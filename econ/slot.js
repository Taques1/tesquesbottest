const { EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const emotes = require("../emotes.json");

const db = new QuickDB(); // Instanciando QuickDB

const VICTORY_REGULAR_PERCENTAGE = 0.50; // Porcentagem de vitória regular (50%)
const JACKPOT_PERCENTAGE = 0.01; // Porcentagem de jackpot (1%)

module.exports = {
  name: 'slot',
  description: 'Jogue na máquina caça-níqueis!',
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

    // Emojis possíveis e suas configurações
    const emojis = ['🍒', '🍋', '🍊', '🍉', '🍇', '🍎'];
    const animationFrames = 5; // Quantidade de frames da animação

    // Seleciona uma linha aleatória de emojis
    const getRandomLine = () => [
      emojis[Math.floor(Math.random() * emojis.length)],
      emojis[Math.floor(Math.random() * emojis.length)],
      emojis[Math.floor(Math.random() * emojis.length)]
    ];

    // Inicializa as linhas do slot
    let topLine = getRandomLine();
    let middleLine = getRandomLine();
    let bottomLine = getRandomLine();

    // Verifica o resultado
    let isJackpot = Math.random() < JACKPOT_PERCENTAGE;
    let isWinning = !isJackpot && Math.random() < VICTORY_REGULAR_PERCENTAGE;

    // Ajusta as linhas para o resultado do jogo
    if (isJackpot) {
      // Se ganhar o jackpot, todas as linhas devem ser iguais
      const jackpotEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      topLine = middleLine = bottomLine = [jackpotEmoji, jackpotEmoji, jackpotEmoji];
    } else if (isWinning) {
      // Se for uma vitória regular, a linha do meio deve ser igual
      const winningEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      middleLine = [winningEmoji, winningEmoji, winningEmoji];
    }

    // Cria um embed inicial com cor azul para a animação
    const embed = new EmbedBuilder()
      .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
      .setColor('#0000FF') // Azul para a animação
      .setDescription(
        `**Aguarde enquanto o slot gira...**\n\n` +
        `| ${topLine[0]} | ${topLine[1]} | ${topLine[2]} |\n` +
        `| ${middleLine[0]} | ${middleLine[1]} | ${middleLine[2]} | ⬅\n` +
        `| ${bottomLine[0]} | ${bottomLine[1]} | ${bottomLine[2]} |`
      );

    const slotMessage = await message.channel.send({ embeds: [embed] });

    // Animação dos emojis descendo
    for (let i = 0; i < animationFrames; i++) {
      setTimeout(async () => {
        const randomLine = getRandomLine();
        await slotMessage.edit({
          embeds: [embed.setDescription(
            `**Aguarde enquanto o slot gira...**\n\n` +
            `| ${randomLine[0]} | ${randomLine[1]} | ${randomLine[2]} |\n` +
            `| ${randomLine[0]} | ${randomLine[1]} | ${randomLine[2]} | ⬅\n` +
            `| ${getRandomLine()[0]} | ${getRandomLine()[1]} | ${getRandomLine()[2]} |`
          )]
        });
      }, i * 500);
    }

    // Resultado final após a animação
    setTimeout(async () => {
      const prizeAmount = isJackpot ? betAmount * 10 : isWinning ? betAmount * 2 : 0;
      const resultMessage = isJackpot ? `ganhou um Jackpot de ${emotes.moeda}${prizeAmount}!` : 
                            isWinning ? `ganhou ${emotes.moeda}${prizeAmount}!` : 
                            `perdeu ${emotes.moeda}${betAmount}!`;

      // Atualiza a cor do embed com base no resultado
      const resultEmbedColor = isJackpot ? '#FFD700' : // Amarelo para Jackpot
                                isWinning ? '#00FF00' : // Verde para Vitória
                                '#FF0000'; // Vermelho para Derrota

      // Atualiza a mensagem do slot com o resultado final
      await slotMessage.edit({
        embeds: [embed.setColor(resultEmbedColor).setDescription(
          `Você ${resultMessage}\n\n` +
          `| ${topLine[0]} | ${topLine[1]} | ${topLine[2]} |\n` +
          `| ${middleLine[0]} | ${middleLine[1]} | ${middleLine[2]} | ⬅\n` +
          `| ${bottomLine[0]} | ${bottomLine[1]} | ${bottomLine[2]} |`
        )]
      });

      // Adiciona as moedas se o usuário ganhou
      if (isJackpot || isWinning) {
        await db.set(`wallet_${userId}`, balance + prizeAmount);
      }

      // Concede a conquista "Jackpot" se o usuário ganhar um Jackpot pela primeira vez
      if (isJackpot) {
        const achievements = await db.get(`achievements_${userId}`) || {};
        if (!achievements.jackpot) {
          await db.set(`achievements_${userId}.jackpot`, true);
          message.channel.send(`🎉 **Parabéns ${message.author.username}!** Você ganhou a conquista **Jackpot**!`);
        }
      }
    }, (animationFrames + 1) * 500);
  }
};
