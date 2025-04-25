const { QuickDB } = require('quick.db');
const { EmbedBuilder } = require('discord.js');
const emotes = require('../emotes.json');

const db = new QuickDB();

module.exports = {
    name: 'rinha',
    description: 'Participe de uma rinha de galo!',
    execute: async (client, message, args) => {
        const betAmount = parseInt(args[0], 10);

        if (isNaN(betAmount) || betAmount <= 0) {
            return message.channel.send('Por favor, forneça um valor de aposta válido.');
        }

        // Verifica o inventário do usuário
        const inventory = await db.get(`inventory_${message.author.id}`);
        if (!inventory || !inventory.galo || inventory.galo <= 0) {
            return message.channel.send('Você não tem um galo! Compre um na loja usando `!buy galo`.');
        }

        const userBalance = await db.get(`wallet_${message.author.id}`) || 0;
        if (userBalance < betAmount) {
            return message.channel.send(`Você não tem ${emotes.moeda} suficientes para essa aposta.`);
        }

        // Verifica a chance de vitória do galo, inicializando em 50% se não estiver definida
        let galoChance = await db.get(`galo_${message.author.id}_chance`) || 50;
        const random = Math.random() * 100;
        let resultMessage = '';
        let embedColor = '';

        if (random <= galoChance) {
            // Vitória
            await db.add(`wallet_${message.author.id}`, betAmount * 2); // Ganha o dobro da aposta
            galoChance = Math.min(galoChance + 5, 75); // Aumenta a chance de vitória, limitando a 75%
            await db.set(`galo_${message.author.id}_chance`, galoChance);

            resultMessage = `${emotes.yes} Seu galo venceu a batalha! Você ganhou ${emotes.moeda}${betAmount * 2}.`;

            // Conceda o cargo se a chance atingir 75% e o usuário ainda não tiver o cargo
            if (galoChance === 75) {
                const role = message.guild.roles.cache.get('810949807744090152');
                if (role) {
                    // Verifica se o usuário já tem o cargo
                    if (!message.member.roles.cache.has(role.id)) {
                        await message.member.roles.add(role);
                        resultMessage += ` Parabéns! Você conquistou o cargo <@&810949807744090152> por alcançar 75% de chance de vitória!`;
                    }
                } else {
                    resultMessage += ' Cargo de conquista não encontrado.';
                }
            }

            embedColor = 'Green';
        } else {
            // Derrota
            await db.sub(`inventory_${message.author.id}.galo`, 1); // Remove o galo do inventário
            await db.delete(`galo_${message.author.id}_chance`); // Reseta a chance de vitória

            resultMessage = `🪦 Seu galo morreu.`;
            embedColor = 'Red';
        }

        await db.sub(`wallet_${message.author.id}`, betAmount);

        const embed = new EmbedBuilder()
            .setTitle('🐓 Rinha de Galo!')
            .setDescription(resultMessage)
            .setColor(embedColor);

        if (random <= galoChance) {
            embed.setFooter({ text: `Chance atual de vitória: ${galoChance}%` });
        }

        message.channel.send({ embeds: [embed] });
    }
};
