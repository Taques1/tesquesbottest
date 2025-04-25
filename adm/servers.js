const { EmbedBuilder } = require('discord.js'); // Importa a biblioteca necessária

module.exports = {
  name: 'servers',
  description: 'Lista todos os servidores em que o bot está presente.',
  async execute(client, message, args) {
    // Mapeia todos os servidores que o bot está e cria uma string formatada
    const guildList = client.guilds.cache.map(guild => `**${guild.name}** | \`\`\`${guild.id}\`\`\``).join('\n');

    // Cria o embed
    const embed = new EmbedBuilder()
      .setTitle('Meus Servidores...')
      .setDescription(guildList)
      .setColor('#0023ff')
      .setFooter({ text: 'Servers.' });

    // Envia o embed para o canal onde o comando foi chamado
    await message.channel.send({ embeds: [embed] });
  }
};
