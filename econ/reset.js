const { QuickDB } = require('quick.db');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const db = new QuickDB();

module.exports = {
    name: 'reseteco',
    description: 'Reseta todo o sistema de economia de um servidor',
    async execute(client, message, args) {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('Você não tem permissão para realizar esta ação! Apenas administradores podem invocar este poder.');
        }

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('confirm_reset')
                .setLabel('Confirmar Reset')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('cancel_reset')
                .setLabel('Cancelar Reset')
                .setStyle(ButtonStyle.Secondary)
        );

        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('⚠️ Atenção, Admin!')
            .setDescription(`Você está prestes a RESETAR **toda** a economia do servidor **${message.guild.name}**. Este processo **não pode ser desfeito**. Deseja continuar?`)
            .setFooter({ text: 'O sistema de economia será apagado permanentemente para todos os usuários.' });

        const confirmMessage = await message.channel.send({
            embeds: [embed],
            components: [row]
        });

        const filter = (interaction) => interaction.user.id === message.author.id;
        const collector = confirmMessage.createMessageComponentCollector({ filter, time: 15000 });

        let isConfirmed = false;

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'confirm_reset') {
                try {
                    const allData = await db.all();
                    const userKeys = allData
                        .map(entry => entry.id)
                        .filter(key => key.startsWith("wallet_"));

                    for (const key of userKeys) {
                        const userId = key.replace("wallet_", "");
                        if (/^(bot_|Bot_)/i.test(userId)) continue;

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
                    }

                    // Resetando dados globais do servidor (se tiver algum específico)
                    await db.delete(`server_wallet`);
                    await db.delete(`server_bank`);
                    await db.delete(`server_inventory`);

                    const successEmbed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('💥 Reset Completo!')
                        .setDescription(`A economia de **todos os usuários**, mesmo os que saíram do servidor, foi **resetada com sucesso**!`)
                        .setFooter({ text: 'Ação concluída com sucesso!' });

                    await interaction.update({
                        embeds: [successEmbed],
                        components: []
                    });

                    isConfirmed = true;
                } catch (err) {
                    console.error(err);
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('❌ Erro ao Resetar')
                        .setDescription('Ocorreu um erro ao tentar resetar a economia do servidor. Tente novamente mais tarde.')
                        .setFooter({ text: 'Algo deu errado!' });

                    await interaction.update({
                        embeds: [errorEmbed],
                        components: []
                    });
                }
            } else if (interaction.customId === 'cancel_reset') {
                const cancelEmbed = new EmbedBuilder()
                    .setColor('#FFFF00')
                    .setTitle('⏸️ Reset Cancelado')
                    .setDescription('O processo de reset foi cancelado.')
                    .setFooter({ text: 'A ação foi abortada pelo administrador.' });

                await interaction.update({
                    embeds: [cancelEmbed],
                    components: []
                });
                await confirmMessage.delete();
            }
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time' && !isConfirmed) {
                const timeoutEmbed = new EmbedBuilder()
                    .setColor('#FF8C00')
                    .setTitle('⏰ Tempo de Resposta Expirado')
                    .setDescription('O tempo de resposta expirou! O processo de reset foi cancelado.')
                    .setFooter({ text: 'Ação não realizada.' });

                await confirmMessage.edit({
                    embeds: [timeoutEmbed],
                    components: []
                });
            }
        });
    }
};
