module.exports = {
  name: 'leaveserver',
  description: 'Faz o bot sair de um servidor específico usando o ID e envia uma mensagem de despedida.',
  async execute(client, message, args) {
    // Verifica se o usuário forneceu um ID de servidor
    if (!args[0]) {
      return message.reply('Por favor, forneça o ID do servidor que você quer que o bot saia.');
    }

    const guildId = args[0];
    const guild = client.guilds.cache.get(guildId);

    // Verifica se o bot está no servidor com o ID fornecido
    if (!guild) {
      return message.reply('O bot não está em um servidor com esse ID ou o ID é inválido.');
    }

    try {
      // Envia uma mensagem de despedida no canal geral ou no primeiro canal de texto disponível
      const channel = guild.channels.cache.find(ch => ch.type === 0 && ch.permissionsFor(guild.members.me).has('SEND_MESSAGES'));

      if (channel) {
        await channel.send('Obrigado por me terem aqui! Estou saindo do servidor agora. Até mais!');
      } else {
        message.reply('Não foi possível encontrar um canal de texto onde o bot pode enviar mensagens.');
      }

      // Sai do servidor
      await guild.leave();
      return message.reply(`O bot enviou uma mensagem e saiu do servidor: **${guild.name}** (ID: ${guild.id})`);
    } catch (error) {
      console.error(`Erro ao tentar sair do servidor: ${error}`);
      return message.reply('Ocorreu um erro ao tentar sair do servidor. Verifique os logs para mais detalhes.');
    }
  }
};
