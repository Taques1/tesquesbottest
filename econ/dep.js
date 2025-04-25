const { EmbedBuilder } = require('discord.js'); // Atualizado para EmbedBuilder
const { QuickDB } = require('quick.db'); // Usando QuickDB
const emotes = require("../emotes.json");
const db = new QuickDB(); // Instanciando QuickDB

module.exports = {
    name: 'deposit',
    description: 'Deposita uma quantidade de dinheiro na conta bancária',
    execute: async (client, message, args) => {
        const wallet = await db.get(`wallet_${message.author.id}`);
        let depositAmount;

        if (args[0] === 'all') {
            depositAmount = wallet;
        } else {
            depositAmount = parseInt(args[0], 10);
        }

        if (!depositAmount || depositAmount <= 0) {
            return message.reply('Você precisa especificar um valor válido para depositar na carteira!');
        }

        if (wallet < depositAmount) {
            return message.reply(`Você não tem saldo suficiente para depositar essa quantidade de ${emotes.moeda} na carteira!`);
        }

        // Atualizar valores usando métodos apropriados
        await db.add(`wallet_${message.author.id}`, -depositAmount); // Subtrai da carteira
        await db.add(`bank_${message.author.id}`, depositAmount); // Adiciona ao banco

        const embed = new EmbedBuilder() // Atualizado para EmbedBuilder
            .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
            .setTitle('Depósito realizado!')
            .setColor('Green')
            .setDescription(`${emotes.yes} Você depositou **${emotes.moeda}${depositAmount}** na sua conta bancária!`);
        
        return message.channel.send({ embeds: [embed] });
    }
};
