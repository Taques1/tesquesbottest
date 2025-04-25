const emotes = require("../emotes.json");

module.exports = {
  name: 'ping', // Nome do comando
  description: 'Comando de ping para verificar a latência do bot e do servidor.',
  async execute(client, message, args) {
    try {
      // Envia uma mensagem temporária para medir a latência
      const m = await message.channel.send('ping?');

      // Deleta a mensagem original do usuário
      message.delete().catch(console.error);

      // Calcula a latência do servidor e da API
      const serverLatency = m.createdTimestamp - message.createdTimestamp;
      const apiLatency = Math.round(client.ws.ping);

      // Atualiza a mensagem com os resultados
      await m.edit(`🏓 **| Pong!**\n${emotes.lod} Latência do Servidor: **${serverLatency}ms**\n${emotes.lod} Latência da API: **${apiLatency}ms**`);
    } catch (error) {
      console.error('Erro ao executar o comando de ping:', error);
    }
  }
};
