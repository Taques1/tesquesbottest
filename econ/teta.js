const { QuickDB } = require('quick.db');
const { EmbedBuilder } = require('discord.js');
const db = new QuickDB();

module.exports = {
    name: 'removeeco',
    description: 'Remove toda a economia de um usuário pelo ID',
    async execute(client, message, args) {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('Você não tem permissão pra usar esse comando.');
        }

        const userId = args[0];
        if (!userId || isNaN(userId)) {
            return message.reply('Você precisa informar um ID válido.');
        }

        try {
            // Apagando os dados relacionados à economia do usuário
            await db.delete(`wallet_${userId}`);
            await db.delete(`bank_${userId}`);
            await db.delete(`inventory_${userId}`);
            await db.delete(`conquistas_${userId}`);
            await db.delete(`max_items_${userId}`);
            await db.delete(`dailyStreak_${userId}`);
            await db.delete(`lastDaily_${userId}`);
            await db.delete(`role_bought_${userId}`);
            await db.delete(`xp_${userId}`);
            await db.delete(`level_${userId}`);

            const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('Economia Removida')
                .setDescription(`Todos os dados de economia do ID \`${userId}\` foram apagados com sucesso.`);

            return message.channel.send({ embeds: [embed] });
        } catch (err) {
            console.error(err);
            return message.reply('Ocorreu um erro ao tentar apagar os dados.');
        }
    }
};
