const { EmbedBuilder } = require('discord.js');
const moment = require('moment');
moment.locale('pt-br');

module.exports = {
  /**
   * Executa o comando para mostrar informações do servidor.
   * @param {Client} client - O cliente do Discord
   * @param {Message} message - A mensagem que acionou o comando
   * @param {string[]} args - Argumentos fornecidos pelo usuário
   */
  async execute(client, message, args) {
    const date = message.guild.createdAt;
    const joined = message.member.joinedAt;

    // Obtém o dono do servidor
    const owner = await message.guild.fetchOwner();
    const region = {
      brazil: ':flag_br: Brazil',
      // Adicione outras regiões conforme necessário
    };

    const embed = new EmbedBuilder()
      .setColor('#D4004E')
      .setThumbnail(message.guild.iconURL({ dynamic: true, format: 'png', size: 4096 }))
      .setAuthor({ name: '🔍 Informações do servidor' })
      .addFields(
        { name: '**:bust_in_silhouette: Nome**', value: message.guild.name, inline: true },
        { name: '**:computer: ID**', value: message.guild.id, inline: true },
        { name: '**:crown: Dono(a)**', value: `${owner.user.username}#${owner.user.discriminator}` },
        { name: '**🌎 Região**', value: region[message.guild.region] || 'Desconhecida', inline: true },
        { name: '**:speech_balloon: Canais**', value: message.guild.channels.cache.size.toString(), inline: true },
        { name: '**👥 Membros**', value: message.guild.memberCount.toString(), inline: true },
        { name: '**:briefcase: Cargos**', value: message.guild.roles.cache.size.toString(), inline: true },
        { name: '**:date: Criado em**', value: formatDate('DD/MM/YYYY, às HH:mm:ss', date) },
        { name: '**:star2: Você entrou em**', value: formatDate('DD/MM/YYYY, às HH:mm:ss', joined) }
      )
      .setTimestamp();

    // Envia o embed no canal onde o comando foi executado
    await message.channel.send({ embeds: [embed] });
  },

  /**
   * Configurações do comando.
   */
  conf: {},

  /**
   * Informações sobre o comando.
   */
  get help() {
    return {
      name: 'serverinfo',
      category: 'Info',
      description: 'Informação sobre o servidor',
      usage: 'serverinfo'
    };
  }
};

/**
 * Formata a data passada para o padrão do Brasil.
 * @param {string} template - Template de formatação
 * @param {Date} [date] - Data a ser formatada
 * @return {string} - Data formatada
 */
function formatDate(template, date) {
  return moment(date).format(template);
}
