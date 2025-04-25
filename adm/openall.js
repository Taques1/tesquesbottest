const { PermissionsBitField } = require('discord.js'); // Importa a biblioteca necessária

module.exports = {
    name: 'unlockserver', // Nome do comando
    description: 'Abre todos os canais do servidor para o role @everyone.', // Descrição do comando
    async execute(client, message, args) {
        // Verifica se o autor da mensagem tem a permissão de administrador
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("Você não tem permissão para usar esse comando.");
        }

        // Cria uma lista de promises para atualizar permissões
        const updatePermissionsPromises = message.guild.channels.cache.map(channel => {
            if (channel.isTextBased()) {
                // Atualiza permissões para canais de texto
                return channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                    SendMessages: true
                }).catch(err => console.error(`Erro ao atualizar permissões do canal de texto ${channel.id}:`, err));
            } else if (channel.isVoiceBased()) {
                // Atualiza permissões para canais de voz
                return channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                    Connect: true,
                    Speak: true // Permite falar no canal de voz
                }).catch(err => console.error(`Erro ao atualizar permissões do canal de voz ${channel.id}:`, err));
            }
            return Promise.resolve();
        });

        // Aguarda a conclusão da atualização de permissões
        await Promise.all(updatePermissionsPromises);

        // Envia uma mensagem informando que os canais foram abertos
        message.channel.send("Canais abertos com sucesso!");
    }
};
