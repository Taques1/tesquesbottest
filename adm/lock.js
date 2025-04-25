const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

// Comando de lock
module.exports = {
    name: 'lock',
    description: 'Bloqueia o canal para que ninguém possa enviar mensagens.',
    async execute(client, message, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.channel.send(
                '❌ **Erro:** Você não tem permissão para usar este comando!'
            ).then(msg => msg.delete({ timeout: 5000 })); // Apaga a mensagem de erro após 5 segundos
        }

        // Define a permissão de envio de mensagens para false
        try {
            await message.channel.permissionOverwrites.edit(message.guild.id, {
                SendMessages: false
            });

            // Cria um embed para informar que o canal foi fechado
            const embed = new EmbedBuilder()
                .setTitle('🔒 Canal fechado!')
                .setColor('#FF0000');

            // Envia o embed para o canal
            await message.channel.send({ embeds: [embed] });

            // Exclui a mensagem de comando
            await message.delete();
        } catch (error) {
            console.error('Erro ao tentar bloquear o canal:', error);
            return message.channel.send(
                '❌ **Erro:** Ocorreu um erro ao tentar bloquear o canal.'
            ).then(msg => msg.delete({ timeout: 5000 })); // Apaga a mensagem de erro após 5 segundos
        }
    }
};
