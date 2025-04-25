const { EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const emotes = require("../emotes.json");

const db = new QuickDB(); // Instanciando QuickDB

module.exports = {
    name: 'rob',
    description: 'Rouba uma quantidade de moedas de outro usuário.',
    execute: async (client, message, args) => {
        const thief = message.author;
        const target = message.mentions.users.first();

        // Verifica se o alvo é válido
        if (!target) {
            return message.reply('Você precisa mencionar um usuário para tentar roubar!');
        }

        // Verifica se o ladrão está tentando roubar a si mesmo
        if (thief.id === target.id) {
            return message.reply('Você não pode roubar a si mesmo!');
        }

        // Verifica o saldo do alvo
        const targetBalance = await db.get(`wallet_${target.id}`) || 0;

        // Calcula o valor a ser roubado (entre 10% e 50% do saldo do alvo)
        const minPercentage = 0.10;
        const maxPercentage = 0.50;
        const stealAmount = Math.floor(targetBalance * (Math.random() * (maxPercentage - minPercentage) + minPercentage));

        // Verifica o saldo do ladrão
        const thiefBalance = await db.get(`wallet_${thief.id}`) || 0;

        // Define a multa (20% do saldo total do ladrão ou -200 se não tiver saldo)
        const fine = thiefBalance > 0 ? Math.floor(thiefBalance * 0.20) : -200;

        // Verifica se o ladrão precisa ser multado
        const chanceOfFine = 0.35; // Chance de multa
        const willBeFined = Math.random() < chanceOfFine;

        let embed;

        if (willBeFined) {
            // Se o ladrão for multado
            if (thiefBalance <= 0) {
                // Define saldo negativo se o ladrão não tiver moedas suficientes para pagar a multa
                await db.set(`wallet_${thief.id}`, -200);
                embed = new EmbedBuilder()
                    .setAuthor({ name: thief.tag, iconURL: thief.displayAvatarURL() })
                    .setTitle('Você foi multado!')
                    .setColor('#FF0000') // Cor vermelha em formato hexadecimal
                    .setDescription(`Você tentou roubar as moedas de ${target.tag}, mas não tinha moedas e foi multado com **${fine}** moedas. Seu saldo ficou em -200 moedas.`);
            } else {
                await db.set(`wallet_${thief.id}`, thiefBalance - fine);
                embed = new EmbedBuilder()
                    .setAuthor({ name: thief.tag, iconURL: thief.displayAvatarURL() })
                    .setTitle('Você foi multado!')
                    .setColor('#FF0000') // Cor vermelha em formato hexadecimal
                    .setDescription(`Você tentou roubar as moedas de ${target.tag}, mas foi multado em **${emotes.moeda}${fine}**.`);
            }
        } else {
            // Se o ladrão não for multado e conseguir roubar algo
            if (stealAmount > 0) {
                await db.set(`wallet_${target.id}`, targetBalance - stealAmount);
                await db.set(`wallet_${thief.id}`, thiefBalance + stealAmount);
                embed = new EmbedBuilder()
                    .setAuthor({ name: thief.tag, iconURL: thief.displayAvatarURL() })
                    .setTitle('Roubo Realizado!')
                    .setColor('#00FF00') // Cor verde em formato hexadecimal
                    .setDescription(`Você roubou **${emotes.moeda}${stealAmount}** moedas de ${target.tag}.`);
            } else {
                embed = new EmbedBuilder()
                    .setAuthor({ name: thief.tag, iconURL: thief.displayAvatarURL() })
                    .setTitle('Tentativa de Roubo Falhada!')
                    .setColor('#FFA500') // Cor laranja em formato hexadecimal
                    .setDescription('Você não conseguiu roubar nada desta vez!');
            }
        }

         return message.channel.send({ embeds: [embed] });
    }
};
