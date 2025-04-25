const { QuickDB } = require('quick.db');
const { MessageActionRow, MessageButton } = require('discord.js');
const db = new QuickDB();

module.exports = {
    name: 'reseteco',
    description: 'Reseta todo o sistema de economia de um usuário',
    async execute(client, message, args) {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('Você não tem permissão para realizar esta ação! Apenas administradores podem invocar este poder.');
        }

        const user = message.mentions.users.first() || message.author;
        const userId = user.id;

        const row = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId('confirm_reset')
                .setLabel('Confirmar Reset')
                .setStyle('DANGER')
        );

        const confirmMessage = await message.channel.send({
            content: `⚠️ **Atenção, Admin!** Você está prestes a RESETAR todo o sistema de economia de **${user.username}**. Este processo **não pode ser desfeito**. Deseja continuar?`,
            components: [row]
        });

        const filter = (interaction) => interaction.user.id === message.author.id;
        const collector = confirmMessage.createMessageComponentCollector({ filter, time: 15000 });

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'confirm_reset') {
                try {
                    // Apaga dados principais
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

                    await interaction.update({
                        content: `💥 O sistema de economia foi **resetado com sucesso** para ${user.username}. Tudo foi apagado, o poder do administrador foi exercido!`,
                        components: []
                    });
                } catch (err) {
                    console.error(err);
                    await interaction.update({
                        content: '❌ Ocorreu um erro ao tentar resetar o sistema. Tente novamente mais tarde.',
                        components: []
                    });
                }
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                confirmMessage.edit({
                    content: '⏰ Tempo de resposta expirado! O processo de reset foi cancelado.',
                    components: []
                });
            }
        });
    }
};
