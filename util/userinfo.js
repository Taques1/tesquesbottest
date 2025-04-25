const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: "user-info",
  category: "extra",
  async execute(client, message, args) {
    // Obtém o usuário mencionado ou o usuário que executou o comando
    let user = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;

    // Obtém a cor de destaque do membro ou a cor do cargo mais alto
    let color = message.member.displayHexColor;
    if (color === '#000000') color = message.member.roles.highest.hexColor || '#FFFFFF'; // Adiciona fallback para #FFFFFF se não houver cor

    // Define o status do usuário
    let status = "Status não disponível";
    if (user.presence && user.presence.status) {
      switch (user.presence.status) {
        case "online":
          status = "🟢 online";
          break;
        case "dnd":
          status = "🔴 dnd";
          break;
        case "idle":
          status = "🟠 idle";
          break;
        case "offline":
          status = "⚫️ offline";
          break;
        default:
          status = "Status desconhecido";
      }
    }

    // Cria o embed
    const embed = new EmbedBuilder()
      .setTitle('🔍 Informações do Usuário')
      .setColor(color)
      .setThumbnail(user.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: ":bookmark: Tag", value: `${user.user.tag}` },
        { name: "🆔 ID", value: user.user.id },
        { name: "✨ Status", value: status },
        { name: ':date: Criado em', value: user.user.createdAt.toLocaleDateString("pt-BR"), inline: true },
        { name: ':star2: Entrou no server em', value: user.joinedAt.toLocaleDateString("pt-BR"), inline: true },
        {
          name: ':briefcase: Cargos',
          value: user.roles.cache.size >= 2 ? user.roles.cache.filter(role => role.name !== '@everyone').map(role => role).join("\n") : "não tem cargos",
          inline: true
        }
      );

    await message.channel.send({ embeds: [embed] });
  }
};
