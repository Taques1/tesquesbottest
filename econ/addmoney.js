const { EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const emotes = require("../emotes.json");

const db = new QuickDB(); // Instanciando QuickDB

module.exports = {
    name: 'addmoney',
    description: 'Adiciona dinheiro à carteira de um usuário.',
    execute: async (client, message, args) => {
        // Verifica se o autor do comando é um administrador
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('Você não tem permissão para usar este comando!')
                .then(msg => msg.delete({ timeout: 5000 }).catch(console.error))
                .catch(console.error);
        }

        // Verifica se o usuário mencionado é válido
        const user = message.mentions.users.first();
        if (!user) {
            return message.reply('Você precisa mencionar um usuário válido!')
                .then(msg => msg.delete({ timeout: 5000 }).catch(console.error))
                .catch(console.error);
        }

        // Verifica se o valor inserido é válido
        const amount = parseInt(args[1], 10);
        if (isNaN(amount) || amount <= 0) {
            return message.reply('Você precisa inserir um valor numérico positivo!')
                .then(msg => msg.delete({ timeout: 50000 }).catch(console.error))
                .catch(console.error);
        }

        try {
            // Adiciona o valor inserido à carteira do usuário
            await db.add(`wallet_${user.id}`, amount);

            // Cria o embed de resposta
            const embed = new EmbedBuilder()
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setTitle('Dinheiro Adicionado!')
                .setColor('Green') // Cor verde em formato hexadecimal
                .setDescription(`${emotes.yes} Foram adicionados **${emotes.moeda}${amount}** à carteira de ${user}!`)
                .setTimestamp();

            return message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Erro ao adicionar dinheiro:', error);
            return message.reply('Houve um erro ao tentar adicionar o dinheiro.');
        }
    }
};
