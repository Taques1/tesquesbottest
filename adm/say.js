const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'say',
    description: 'Faz o bot dizer uma mensagem.',
    execute(client, message, args) {
        // Verifica se o usuário tem a permissão de Administrador para usar o comando
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.channel.send('Você não tem permissão para usar este comando.');
        }

        // Verifica se há argumentos (a mensagem a ser enviada)
        const sayMessage = args.join(' ');
        if (!sayMessage) {
            return message.channel.send('Você precisa fornecer uma mensagem para o bot dizer.');
        }

        // Deleta a mensagem original (o comando usado)
        message.delete().catch((err) => {
            console.warn('Não foi possível deletar a mensagem:', err);
        });

        // Envia a mensagem fornecida
        message.channel.send(sayMessage);
    },
};
