const { PermissionsBitField, EmbedBuilder } = require('discord.js'); // Atualizado para discord.js v14

module.exports = {
    name: 'lockserver',
    description: 'Tranca todos os canais do servidor, bloqueando o envio de mensagens e chamadas para todos exceto administradores.',
    async execute(client, message, args) {
        // Verifica se o usuário tem permissão de administrador
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.channel.send('❌ Você não tem permissão para usar este comando.');
        }

        // Atualiza as permissões de todos os canais do servidor
        const updatePermissionsPromises = message.guild.channels.cache.map(async channel => {
            if (channel.isTextBased()) {
                // Bloqueia o envio de mensagens em canais de texto
                await channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
            }
            if (channel.isVoiceBased()) {
                // Bloqueia a conexão em canais de voz
                await channel.permissionOverwrites.edit(message.guild.roles.everyone, { Connect: false });
            }
        });

        // Aguarda a conclusão da atualização de permissões
        await Promise.all(updatePermissionsPromises);

        // Cria um embed para informar que o servidor foi trancado
        const embed = new EmbedBuilder()
            .setTitle('🔒 Servidor Trancado!')
            .setDescription('O servidor foi trancado. Somente administradores podem enviar mensagens e se conectar aos canais de voz.')
            .setColor('#FF0000');

        // Envia o embed para o canal de onde o comando foi chamado
        await message.channel.send({ embeds: [embed] });
    }
};
