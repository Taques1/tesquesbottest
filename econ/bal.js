const { EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const emotes = require("../emotes.json");

const db = new QuickDB(); // Instanciando QuickDB

module.exports = {
    name: 'bal',
    description: 'Mostra o saldo da carteira e banco do usuário.',
    execute: async (client, message, args) => {
        const userToCheck = message.mentions.users.first() || message.author;
        const userId = userToCheck.id;

        try {
            // Recupera os saldos da carteira e do banco
            const wallet = await db.get(`wallet_${userId}`) || 0;
            const bank = await db.get(`bank_${userId}`) || 0;
            const total = wallet + bank;

            // Recupera todos os IDs de usuários com saldo de carteira ou banco
            const walletEntries = await db.all();
            const userIds = new Set(walletEntries
                .filter(entry => entry.id.startsWith('wallet_') || entry.id.startsWith('bank_'))
                .map(entry => entry.id.replace(/^(wallet_|bank_)/, ''))
            );

            const userBalances = {};

            // Somar os saldos da carteira e banco
            for (const id of userIds) {
                const walletBalance = await db.get(`wallet_${id}`) || 0;
                const bankBalance = await db.get(`bank_${id}`) || 0;
                userBalances[id] = walletBalance + bankBalance;
            }

            // Ordena os usuários pelo saldo total em ordem decrescente
            const sortedUsers = Object.entries(userBalances)
                .sort(([, balanceA], [, balanceB]) => balanceB - balanceA);

            // Encontra a posição do usuário no ranking
            const userPosition = sortedUsers.findIndex(([id]) => id === userId);

            // Cria o embed de resposta
            const embed = new EmbedBuilder()
                .setTitle(`Saldo de ${userToCheck.username}`)
                .setAuthor({ name: userToCheck.tag, iconURL: userToCheck.displayAvatarURL() })
                .setDescription(`**Posição no rank:** ${userPosition === -1 ? 'Não classificado' : `#${userPosition + 1}`}`)
                .addFields([
                    { name: `${emotes.moeda} Carteira`, value: wallet.toString(), inline: true },
                    { name: `${emotes.banco} Depósito`, value: bank.toString(), inline: true },
                    { name: `${emotes.bag} Total`, value: total.toString(), inline: true }
                ])
                .setColor('#5980CF') // Azul em formato hexadecimal
                .setTimestamp();

            return message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Erro ao recuperar saldo:', error);
            return message.reply('Houve um erro ao tentar recuperar o saldo.')
                .then(msg => {
                    setTimeout(() => {
                        msg.delete().catch(console.error);
                    }, 10000); // 10 segundos
                })
                .catch(console.error);
        }
    }
};
