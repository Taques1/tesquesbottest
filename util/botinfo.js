const { Client, Intents, EmbedBuilder } = require('discord.js');
const moment = require('moment');

moment.locale('pt-br');

module.exports = {
  name: 'botinfo',
  description: 'Mostra informações do bot.',
  async execute(client, message, args) {
    // Obtém informações do bot
    const botAvatar = client.user.displayAvatarURL();
    const date = client.user.createdAt;
    const userName = client.user.username;
    const serverSize = client.guilds.cache.size;
    const userSize = client.users.cache.size;
    const status = {
      online: '`🟢` Online',
      idle: '`🟡` Ausente',
      dnd: '`🔴` Não perturbar',
      offline: '`⚫` Offline'
    };

    // URL do banner do bot (substitua pelo URL do seu banner, se disponível)
    const botBannerURL = 'https://example.com/banner.png'; // Substitua pelo URL do seu banner ou imagem de placeholder

    // Remove a mensagem que chamou o comando
    message.delete().catch(console.error);

    // Cria o embed
    let embed = new EmbedBuilder()
      .setColor('#D4004E')
      .setThumbnail(botAvatar)
      .setImage(botBannerURL) // Adiciona o banner
      .setAuthor({ name: '🤖 Minhas informações' })
      .addFields(
        { name: '**Meu nick**', value: userName },
        { name: '**Meu ID**', value: client.user.id },
        { name: '**Servidores**', value: `🛡 ${serverSize}`, inline: true },
        { name: '**Usuários**', value: `${userSize}`, inline: true },
        { name: '**Estou online a**', value: moment.duration(client.readyAt).humanize() },
        { name: '**Criado em**', value: formatDate('DD/MM/YYYY, às HH:mm:ss', date) }
      )
      .setTimestamp();

    // Adiciona o campo de status se disponível
    const activity = client.user.presence?.activity;
    if (activity) {
      embed.addFields(
        { name: '**Status**', value: `${status[client.user.presence.status] || '`⚫` Offline'}`, inline: true },
        { name: '**Faixa do Bot**', value: `${activity.name || 'Nenhuma'}`, inline: true }
      );
    } else {
      embed.addFields(
        { name: '**Status**', value: `${status[client.user.presence.status] || '`⚫` Offline'}`, inline: true }
      );
    }

    // Envia o embed para o canal
    await message.channel.send({ embeds: [embed] });
  }
};

/**
 * Formata a data passada para o padrão do Brasil.
 * @param {string} template
 * @param {Date=} [date]
 * @return {string}
 */
function formatDate(template, date) {
  const specs = 'YYYY:MM:DD:HH:mm:ss'.split(':');
  date = new Date(date || Date.now() - new Date().getTimezoneOffset() * 6e4);
  return date.toISOString().split(/[-:.TZ]/).reduce((template, item, i) => {
    return template.split(specs[i]).join(item);
  }, template);
}
