const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { QuickDB } = require('quick.db');
const emotes = require("../emotes.json");

const db = new QuickDB();

module.exports = {
    name: 'rank',
    description: 'Mostra o ranking dos usuários com mais dinheiro total.',
    execute: async (client, message, args) => {
        // Obter todos os IDs dos usuários com saldo na carteira ou banco
        const walletEntries = await db.all();
        const userIds = new Set(walletEntries
            .filter(entry => entry.id.startsWith('wallet_') || entry.id.startsWith('bank_'))
            .map(entry => entry.id.replace(/^(wallet_|bank_)/, ''))
        );

        const userBalances = {};

        for (const userId of userIds) {
            // Verificar se o userId é um número válido (snowflake)
            if (!/^\d+$/.test(userId)) {
                console.warn(`ID inválido encontrado: ${userId}`);
                continue;
            }

            try {
                // Verificar se o ID pertence a um bot e ignorá-lo
                const user = await client.users.fetch(userId);
                if (user.bot) continue;

                const walletBalance = await db.get(`wallet_${userId}`) || 0;
                const bankBalance = await db.get(`bank_${userId}`) || 0;
                userBalances[userId] = walletBalance + bankBalance;
            } catch (error) {
                console.error(`Erro ao buscar usuário com ID ${userId}: ${error.message}`);
                continue;
            }
        }

        // Ordena os usuários pelo saldo total em ordem decrescente
        const sortedUsers = Object.entries(userBalances)
            .sort(([, balanceA], [, balanceB]) => balanceB - balanceA);

        const itemsPerPage = 10;
        const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
        let currentPage = 0;

        const generateEmbed = (page) => {
            const start = page * itemsPerPage;
            const currentPageItems = sortedUsers.slice(start, start + itemsPerPage);

            return new EmbedBuilder()
                .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL() })
                .setTitle('Ranking de Moedas')
                .setColor('#0000FF')
                .setDescription(currentPageItems.length > 0
                    ? currentPageItems.map((entry, index) => `**${start + index + 1}.** <@${entry[0]}>: ${emotes.moeda}${entry[1]}`).join('\n')
                    : 'Nenhum usuário com saldo encontrado.')
                .setFooter({ text: `Página ${page + 1} de ${totalPages}` })
                .setTimestamp();
        };

        const embed = generateEmbed(currentPage);

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('previous')
                    .setLabel('◀️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === 0),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('▶️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === totalPages - 1)
            );

        const messageEmbed = await message.channel.send({ embeds: [embed], components: [row] });

        const collector = messageEmbed.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'previous') {
                currentPage--;
            } else if (i.customId === 'next') {
                currentPage++;
            }

            const newEmbed = generateEmbed(currentPage);

            await i.update({ embeds: [newEmbed], components: [
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('previous')
                            .setLabel('◀️')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(currentPage === 0),
                        new ButtonBuilder()
                            .setCustomId('next')
                            .setLabel('▶️')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(currentPage === totalPages - 1)
                    )
            ]});
        });

        collector.on('end', () => {
            messageEmbed.edit({ components: [] }).catch(console.error); // Remove os botões quando o tempo expira
        });
    }
};
