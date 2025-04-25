const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { QuickDB } = require('quick.db');
const emotes = require('../emotes.json');

const db = new QuickDB(); // Instanciando QuickDB

const BOARD_SIZE = 5; // Tamanho do tabuleiro 5x5
const MINES_COUNT = 5; // Número de minas no tabuleiro

module.exports = {
  name: 'mines',
  description: 'Jogue um jogo de minas e teste sua sorte!',
  execute: async (client, message, args) => {
    const userId = message.author.id;
    const betAmount = parseInt(args[0]) || 0;
    const ticketItemName = 'ficha'; // Nome do item de ficha

    // Verifica se o usuário tem o item ficha
    const ticketCount = await db.get(`inventory_${userId}.${ticketItemName}`) || 0;
    if (ticketCount < 1) {
      return message.reply('Você não tem uma ficha para jogar. Compre uma na loja!');
    }

    // Remove uma ficha do inventário do usuário
    await db.add(`inventory_${userId}.${ticketItemName}`, -1);

    if (isNaN(betAmount) || betAmount <= 0) {
      return message.reply('Por favor, insira uma quantidade válida de moedas para apostar.');
    }

    // Obtém o saldo atual do usuário
    const balance = await db.get(`wallet_${userId}`) || 0;
    if (balance < betAmount) {
      return message.reply('Você não tem moedas suficientes para fazer essa aposta.');
    }

    // Remove a quantidade apostada do saldo do usuário
    await db.set(`wallet_${userId}`, balance - betAmount);

    // Função para gerar o tabuleiro com minas
    const generateBoard = (size, minesCount) => {
      const board = Array(size).fill().map(() => Array(size).fill('⬜'));
      let minesPlaced = 0;

      while (minesPlaced < minesCount) {
        const x = Math.floor(Math.random() * size);
        const y = Math.floor(Math.random() * size);
        if (board[x][y] === '⬜') {
          board[x][y] = '💣';
          minesPlaced++;
        }
      }

      return board;
    };

    // Função para mostrar o tabuleiro ao usuário
    const displayBoard = (board, revealed = []) => {
      return board.map((row, x) => row.map((cell, y) => revealed.includes(`${x},${y}`) ? cell : '⬛').join(' ')).join('\n');
    };

    // Inicializa o jogo
    const board = generateBoard(BOARD_SIZE, MINES_COUNT);
    let revealedCells = [];
    let winnings = 0;
    let multiplier = 1.0;

    // Loop de jogo
    const playGame = async () => {
      const embed = new EmbedBuilder()
        .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
        .setColor('#00FF00')
        .setTitle('Jogo de Minas')
        .setDescription(`Escolha uma célula para revelar (Exemplo: "1 3")\n\n${displayBoard(board, revealedCells)}`)
        .addFields({ name: 'Multiplicador Atual', value: `${multiplier}x`, inline: true })
        .addFields({ name: 'Ganho Potencial', value: `${emotes.moeda}${Math.floor(betAmount * multiplier)}`, inline: true });

      const msg = await message.channel.send({ embeds: [embed] });

      // Coletando a resposta do usuário
      const filter = m => m.author.id === userId && /^[1-5] [1-5]$/.test(m.content);
      const userInput = await message.channel.awaitMessages({ filter, max: 1, time: 60000 });

      if (!userInput.size) {
        return message.reply('Tempo esgotado! Jogo encerrado.');
      }

      const [x, y] = userInput.first().content.split(' ').map(Number).map(n => n - 1);

      if (board[x][y] === '💣') {
        // Se o usuário acertar uma mina
        await msg.edit({
          embeds: [embed.setColor('#FF0000').setDescription(`Você acertou uma mina! Você perdeu ${emotes.moeda}${betAmount}.\n\n${displayBoard(board, [...revealedCells, `${x},${y}`])}`)]
        });
        return;
      } else {
        // Se o usuário evitar uma mina
        revealedCells.push(`${x},${y}`);
        multiplier += 0.5;
        winnings = Math.floor(betAmount * multiplier);

        const continueEmbed = new EmbedBuilder()
          .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
          .setColor('#00FF00')
          .setTitle('Jogo de Minas')
          .setDescription(`Você evitou a mina! Deseja continuar ou parar?\n\n${displayBoard(board, revealedCells)}`)
          .addFields({ name: 'Multiplicador Atual', value: `${multiplier}x`, inline: true })
          .addFields({ name: 'Ganho Potencial', value: `${emotes.moeda}${winnings}`, inline: true });

        // Botões de continuar ou parar
        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('continue')
              .setLabel('Continuar')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('stop')
              .setLabel('Parar')
              .setStyle(ButtonStyle.Danger)
          );

        await msg.edit({ embeds: [continueEmbed], components: [row] });

        // Filtro para interação dos botões
        const buttonFilter = i => i.user.id === userId;
        const interaction = await msg.awaitMessageComponent({ filter: buttonFilter, time: 60000 });

        if (interaction.customId === 'stop') {
          await db.set(`wallet_${userId}`, balance + winnings);
          await interaction.update({
            embeds: [continueEmbed.setDescription(`Você parou o jogo e ganhou ${emotes.moeda}${winnings}!`)],
            components: []
          });
        } else {
          await interaction.update({ components: [] }); // Remover os botões após escolha
          playGame(); // Continue jogando
        }
      }
    };

    playGame();
  }
};
