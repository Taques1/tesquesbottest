const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'servericon',
  aliases: ['servericon'],
  /**
   * Executa o comando para mostrar o ícone do servidor
   * @param {Client} client - O cliente do Discord
   * @param {Message} message - A mensagem que acionou o comando
   * @param {string[]} args - Argumentos fornecidos pelo usuário
   */
  async execute(client, message, args) {
    // Cria o embed com o ícone do servidor
    const embed = new EmbedBuilder()
      .setTitle(`Ícone do servidor ${message.guild.name}`)
      .setDescription(`[Clique aqui para baixar o ícone](${message.guild.iconURL({
        dynamic: true, format: 'png', size: 4096
      })})`)
      .setColor('#FF0000') // Usando valor hexadecimal para a cor vermelha
      .setImage(message.guild.iconURL({ dynamic: true, format: 'png', size: 4096 }));

    // Envia o embed como resposta
    message.reply({ embeds: [embed] });
  }
};
