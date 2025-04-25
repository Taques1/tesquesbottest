const { PermissionsBitField } = require('discord.js'); // Atualização para discord.js v14

module.exports = {
    name: 'ban',
    description: 'Banir um membro do servidor.',
    async execute(client, message, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return message.reply("Você não tem permissão para banir membros!");
        }

        const membro = message.mentions.members.first();
        if (!membro) {
            return message.reply("Mencione um membro para banir.");
        }

        if (membro.id === message.author.id) {
            return message.reply("Você não pode se banir.");
        }

        try {
            await membro.ban({ reason: args.slice(1).join(' ') || 'Sem motivo' });
            message.channel.send(`O membro ${membro.user.tag} foi banido com sucesso!`);
        } catch (error) {
            console.error(error);
            message.reply("Não consegui banir o membro. Pode ser um erro de permissão ou outro problema.");
        }
    },
    help: {
        name: 'ban',
        description: 'Banir um membro do servidor.',
        usage: '<@membro> [motivo]'
    }
};
