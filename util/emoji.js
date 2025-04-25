const { AttachmentBuilder } = require('discord.js');

module.exports = {
  name: 'emoji',
  aliases: ['emoji', 'emojo'],
  cooldown: 3,
  guildOnly: true,
  async execute(client, message, args) {
    if (!args[0]) {
      return message.channel.send(
        `**${message.author.username}, a sintaxe correta é:** ` +
        '`f!emoji nomedoemoji ou id`'
      );
    }

    // Tentando encontrar o emoji pelo nome ou ID
    const emoji = message.guild.emojis.cache.find(
      (emoji) => emoji.name === args[0] || emoji.id === args[0]
    );

    // Caso não encontre no servidor, tenta buscar no Discord como padrão ou ID
    if (!emoji) {
      const emojiRegex = /<(:\w+:|a:\w+:)(\d+)>/;
      const match = args[0].match(emojiRegex);

      if (match) {
        const [, emojiName, emojiId] = match;
        const emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${args[0].startsWith('<a:') ? 'gif' : 'png'}`;

        return message.channel.send({
          files: [new AttachmentBuilder(emojiUrl, { name: `emoji_owo.${args[0].startsWith('<a:') ? 'gif' : 'png'}` })]
        });
      } else {
        return message.channel.send(`\`${args[0]}\` **não é um emoji válido.**`);
      }
    }

    // Se o emoji for encontrado no servidor
    const fileExtension = emoji.animated ? 'gif' : 'png';
    const fileName = `emoji_owo.${fileExtension}`;

    await message.channel.send({
      files: [new AttachmentBuilder(emoji.url, { name: fileName })]
    });
  },
};
