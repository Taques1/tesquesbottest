const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const emotes = require('../emotes.json');

const db = new QuickDB(); // Instanciando QuickDB

module.exports = {
  name: 'scratch',
  description: 'Compre um bilhete de raspadinha e revele um prêmio!',
  execute: async (client, message, args) => {
    const userId = message.author.id;
    const ticketItemName = 'raspadinha'; // Nome do item de raspadinha

    // Obtém o número de bilhetes de raspadinha no inventário do usuário
    const ticketCount = await db.get(`inventory_${userId}.${ticketItemName}`) || 0;

    if (ticketCount < 1) {
      return message.reply(`Você não tem um bilhete de raspadinha para usar. Compre um na loja!`);
    }

    // Remove um bilhete de raspadinha do inventário do usuário
    await db.add(`inventory_${userId}.${ticketItemName}`, -1);

    // Preço do bilhete de raspadinha (para referências futuras)
    const ticketPrice = 0;

    // Possíveis prêmios
    const prizes = [
      { type: 'moeda', amount: 1000, chance: 0.49 },
      { type: 'moeda', amount: 5000, chance: 0.19 },
      { type: 'item', name: 'ficha', amount: 1, chance: 0.14 },
      { type: 'item', name: 'chave', amount: 1, chance: 0.09 },
      { type: 'item', name: 'chave de ouro', amount: 1, chance: 0.01 },
      { type: 'nada', chance: 0.04 }
    ];

    // Função para determinar o prêmio
    const getPrize = () => {
      const rand = Math.random();
      let cumulativeChance = 0;
      for (const prize of prizes) {
        cumulativeChance += prize.chance;
        if (rand <= cumulativeChance) {
          return prize;
        }
      }
    };

    const prize = getPrize();

    // Define a mensagem do prêmio e atualiza o saldo ou inventário
    let prizeMessage;
    if (prize.type === 'moeda') {
      prizeMessage = `${emotes.moeda}${prize.amount}`;
      await db.add(`wallet_${userId}`, prize.amount);
    } else if (prize.type === 'item') {
      prizeMessage = `1x ${prize.name}`;
      await db.add(`inventory_${userId}.${prize.name}`, prize.amount);
    } else {
      prizeMessage = 'Nada. Melhor sorte da próxima vez!';
    }

    // Cria o embed da raspadinha com spoiler para o prêmio
    const embed = new EmbedBuilder()
      .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
      .setColor('#FFD700') // Amarelo para o prêmio
      .setTitle('🎫 Raspadinha')
      .setDescription(`Você raspou o bilhete e...` + '\n\n' +
                      `**Prêmio:** ||${prizeMessage}||` +
                      '\n\nVolte mais tarde para tentar a sorte novamente.');

    // Cria o botão para abrir outro bilhete
    const button = new ButtonBuilder()
      .setCustomId('scratch_another')
      .setLabel('Abrir Outro')
      .setStyle(ButtonStyle.Primary);

    // Cria a fila de botões e adiciona o botão
    const actionRow = new ActionRowBuilder().addComponents(button);

    // Envia o embed com o resultado e o botão
    const messageSent = await message.channel.send({ embeds: [embed], components: [actionRow] });

    // Cria um coletor para lidar com a interação do botão
    const filter = i => i.customId === 'scratch_another' && i.user.id === userId;
    const collector = message.channel.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async i => {
      // Verifica se o usuário ainda tem um bilhete de raspadinha
      const newTicketCount = await db.get(`inventory_${userId}.${ticketItemName}`) || 0;
      if (newTicketCount < 1) {
        return i.reply(`Você não tem mais bilhetes de raspadinha para usar.`);
      }

      // Remove um bilhete de raspadinha do inventário do usuário
      await db.add(`inventory_${userId}.${ticketItemName}`, -1);

      // Calcula o prêmio novamente
      const newPrize = getPrize();
      let newPrizeMessage;
      if (newPrize.type === 'moeda') {
        newPrizeMessage = `${emotes.moeda}${newPrize.amount}`;
        await db.add(`wallet_${userId}`, newPrize.amount);
      } else if (newPrize.type === 'item') {
        newPrizeMessage = `1x ${newPrize.name}`;
        await db.add(`inventory_${userId}.${newPrize.name}`, newPrize.amount);
      } else {
        newPrizeMessage = 'Nada. Melhor sorte da próxima vez!';
      }

      // Atualiza o embed com o novo prêmio
      const newEmbed = new EmbedBuilder()
        .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
        .setColor('#FFD700')
        .setTitle('🎫 Raspadinha')
        .setDescription(`Você raspou o bilhete e...` + '\n\n' +
                        `**Prêmio:** ||${newPrizeMessage}||` +
                        '\n\nVolte mais tarde para tentar a sorte novamente.');

      // Edita a mensagem original com o novo embed
      await i.update({ embeds: [newEmbed], components: [actionRow] });
    });

    collector.on('end', collected => {
      // Opcional: Se desejar, você pode desativar o botão após o tempo acabar
      messageSent.edit({ components: [] });
    });
  }
};
