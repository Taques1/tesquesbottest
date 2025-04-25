const { EmbedBuilder, PermissionsBitField } = require('discord.js'); // Importa as classes necessárias

module.exports = {
  name: 'unlockchannel', // Nome do comando
  description: 'Desbloqueia o canal para o role @everyone.', // Descrição do comando
  async execute(client, message, args) {
    // Verifica se o usuário tem permissão de administrador
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('Você não tem permissão para usar esse comando!');
    }

    // Atualiza as permissões do canal para permitir o envio de mensagens
    try {
      await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
        SendMessages: true
      });

      // Cria um embed para informar que o canal foi desbloqueado
      const embed = new EmbedBuilder()
        .setColor('#00FF00') // Define a cor como verde em formato hexadecimal
        .setTitle('🔓 Canal desbloqueado!');

      // Envia o embed para o canal
      await message.channel.send({ embeds: [embed] });

      // Exclui a mensagem do comando
      await message.delete();
    } catch (error) {
      console.error('Erro ao desbloquear o canal:', error);
      message.reply('Ocorreu um erro ao tentar desbloquear o canal.');
    }
  }
};
