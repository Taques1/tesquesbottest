const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  name: 'trocar',
  description: 'Troque itens do seu inventário com outros usuários.',

  async execute(client, message, args) {
    // Verifique se há menção a um usuário
    const targetUser = message.mentions.users.first();
    if (!targetUser) {
      return message.reply('Você precisa mencionar um usuário para trocar itens.');
    }

    const userId = message.author.id;
    const targetUserId = targetUser.id;

    // Buscando inventários
    const userInventory = await db.get(`inventory_${userId}`) || {};
    const targetInventory = await db.get(`inventory_${targetUserId}`) || {};

    if (Object.keys(userInventory).length === 0) {
      return message.reply('Seu inventário está vazio. Você não pode oferecer itens para troca.');
    }

    if (Object.keys(targetInventory).length === 0) {
      return message.reply(`${targetUser.username} não possui itens no inventário para trocar.`);
    }

    // Listar itens do usuário
    const userItems = Object.keys(userInventory)
      .map((item) => `${item.charAt(0).toUpperCase() + item.slice(1)} (Quantidade: ${userInventory[item]})`)
      .join('\n');

    // Listar itens do alvo
    const targetItems = Object.keys(targetInventory)
      .map((item) => `${item.charAt(0).toUpperCase() + item.slice(1)} (Quantidade: ${targetInventory[item]})`)
      .join('\n');

    // Solicitar itens para troca
    await message.reply(
      `**Seus itens disponíveis para troca:**\n${userItems}\n\n**Itens de ${targetUser.username}:**\n${targetItems}\n\nEnvie uma mensagem informando o item que deseja trocar e o item que quer em troca (Ex.: \`potion -> cristal\`).`
    );

    const filter = (msg) => msg.author.id === userId || msg.author.id === targetUserId;
    const collector = message.channel.createMessageCollector({ filter, time: 60000 });

    collector.on('collect', async (msg) => {
      const input = msg.content.split('->').map((i) => i.trim().toLowerCase());
      if (input.length !== 2) {
        return msg.reply('Formato inválido! Use o formato: `item_doar -> item_receber`.');
      }

      const [offeredItem, requestedItem] = input;

      if (!userInventory[offeredItem] || !targetInventory[requestedItem]) {
        return msg.reply(
          'Um dos itens especificados não está disponível no inventário de quem deveria oferecê-lo. Verifique e tente novamente.'
        );
      }

      // Confirmar troca
      collector.stop();
      const confirmation = await message.channel.send(
        `${message.author.username} quer trocar \`${offeredItem}\` com ${targetUser.username} por \`${requestedItem}\`. ${targetUser}, você aceita?`
      );

      const emojis = ['✅', '❌'];
      for (const emoji of emojis) {
        await confirmation.react(emoji);
      }

      const reactionFilter = (reaction, user) => emojis.includes(reaction.emoji.name) && user.id === targetUserId;
      const reactionCollector = confirmation.createReactionCollector({ filter: reactionFilter, max: 1, time: 30000 });

      reactionCollector.on('collect', async (reaction) => {
        if (reaction.emoji.name === '✅') {
          // Atualiza os inventários
          userInventory[offeredItem]--;
          targetInventory[requestedItem]--;

          if (userInventory[offeredItem] === 0) delete userInventory[offeredItem];
          if (targetInventory[requestedItem] === 0) delete targetInventory[requestedItem];

          userInventory[requestedItem] = (userInventory[requestedItem] || 0) + 1;
          targetInventory[offeredItem] = (targetInventory[offeredItem] || 0) + 1;

          await db.set(`inventory_${userId}`, userInventory);
          await db.set(`inventory_${targetUserId}`, targetInventory);

          await message.channel.send(
            `Troca concluída! ${message.author.username} trocou \`${offeredItem}\` com ${targetUser.username} por \`${requestedItem}\`.`
          );
        } else {
          await message.channel.send(`${targetUser.username} recusou a troca.`);
        }
      });

      reactionCollector.on('end', (_, reason) => {
        if (reason === 'time') {
          message.channel.send('Tempo esgotado para a confirmação da troca.');
        }
      });
    });

    collector.on('end', (_, reason) => {
      if (reason === 'time') {
        message.channel.send('Tempo esgotado para decidir a troca.');
      }
    });
  },
};
