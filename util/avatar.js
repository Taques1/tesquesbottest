const { EmbedBuilder } = require('discord.js');
const emotes = require('../emotes.json');

module.exports = {
  name: 'avatar',
  description: 'Exibe o avatar de um usuário.',
  async execute(client, message, args) {
    // Obtém o usuário mencionado ou o autor da mensagem se nenhum usuário for mencionado
    let user = message.mentions.users.first() || client.users.cache.get(args[0]) || message.author;

    // Obtém a URL do avatar do usuário
    let avatar = user.displayAvatarURL({ dynamic: true, format: 'png', size: 1024 });

    // Obtém a cor do membro ou usa a cor do cargo destacado se a cor for preta
    let color = message.member.displayHexColor;
    if (color === '#000000') color = message.member.hoistRole?.hexColor || '#ffffff'; // Usa branco como cor padrão se não houver cor

    // Cria o embed
    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`${emotes.quadro} Avatar de ${user.username}`)
      .setDescription(`**[Clique aqui](${avatar}) para baixar.**`)
      .setImage(avatar)
      .setFooter({ text: `• Autor: ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ format: 'png' }) });

    // Envia o embed para o canal
    await message.channel.send({ embeds: [embed] });
  },
};

