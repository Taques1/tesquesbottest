const { Client, Message } = require('discord.js');

module.exports = {
  name: 'say', // Nome do comando
  description: 'Reenvia a mensagem fornecida no canal.', // Descrição do comando
  /**
   * Executa o comando de "say"
   * @param {Client} client - O cliente do Discord
   * @param {Message} message - A mensagem que acionou o comando
   * @param {string[]} args - Argumentos fornecidos pelo usuário
   */
  async execute(client, message, args) {
    // Junta os argumentos em uma única string
    const sayMessage = args.join(' ');

    // Verifica se o usuário forneceu uma mensagem
    if (!sayMessage) {
      return message.reply('Você precisa fornecer uma mensagem para eu reenviar!');
    }

    try {
      // Deleta a mensagem original do comando
      await message.delete();

      // Envia a mensagem fornecida pelo usuário
      await message.channel.send(sayMessage);
    } catch (error) {
      console.error('Erro ao executar o comando "say":', error);
    }
  }
};
