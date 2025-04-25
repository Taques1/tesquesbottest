const { EmbedBuilder } = require('discord.js'); // Atualizado para EmbedBuilder
const { QuickDB } = require('quick.db'); // Usando QuickDB
const emotes = require("../emotes.json");
const db = new QuickDB(); // Instanciando QuickDB

module.exports = {
    name: 'withdraw',
    description: 'Saca uma quantidade de dinheiro da conta bancária',
    execute: async (client, message, args) => {
        const bank = await db.get(`bank_${message.author.id}`) || 0;
        let withdrawAmount;

        // Verifica se o usuário deseja sacar tudo
        if (args[0] === 'all') {
            withdrawAmount = bank;
        } else {
            withdrawAmount = parseInt(args[0], 10);
        }

        if (!withdrawAmount || withdrawAmount <= 0) {
            return message.reply('Você precisa especificar um valor válido para sacar da conta bancária!');
        }

        if (bank < withdrawAmount) {
            return message.reply(`Você não tem ${emotes.moeda} suficiente no banco para sacar essa quantidade!`);
        }

        // Atualizar valores usando métodos apropriados
        await db.add(`wallet_${message.author.id}`, withdrawAmount); // Adiciona à carteira
        await db.add(`bank_${message.author.id}`, -withdrawAmount); // Subtrai do banco

        const embed = new EmbedBuilder() // Atualizado para EmbedBuilder
            .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
            .setTitle('Saque realizado!')
            .setColor('Green')
            .setDescription(`${emotes.yes} Você sacou **${emotes.moeda}${withdrawAmount}** da sua conta bancária!`);
        
        return message.channel.send({ embeds: [embed] });
    }
};
