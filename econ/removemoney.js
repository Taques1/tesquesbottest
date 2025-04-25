const { EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const emotes = require("../emotes.json");

const db = new QuickDB(); // Instanciando QuickDB

module.exports = {
    name: 'removemoney',
    description: 'Remove dinheiro da carteira e do banco de um usuário.',
    execute: async (client, message, args) => {
        // Verifica se o autor do comando é um administrador
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('Você não tem permissão para usar este comando!')
                .then(msg => {
                    setTimeout(() => msg.delete().catch(console.error), 10000); // 10 segundos
                })
                .catch(console.error);
        }

        // Verifica se o usuário mencionado é válido
        const user = message.mentions.users.first();
        if (!user) {
            return message.reply('Você precisa mencionar um usuário válido!')
                .then(msg => {
                    setTimeout(() => msg.delete().catch(console.error), 10000); // 10 segundos
                })
                .catch(console.error);
        }

        // Verifica se o argumento é 'all' ou um valor numérico
        const amountArg = args[1]?.toLowerCase();
        if (amountArg === 'all') {
            // Remove todo o dinheiro do usuário
            await db.delete(`wallet_${user.id}`);
            await db.delete(`bank_${user.id}`);

            const embed = new EmbedBuilder()
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setTitle('Dinheiro Removido!')
                .setColor('Red') // Cor vermelha em formato hexadecimal
                .setDescription(`${emotes.yes} Todo o dinheiro de ${user} foi removido!`)
                .setTimestamp();

            return message.channel.send({ embeds: [embed] });
        }

        // Verifica se o valor inserido é válido
        const amount = parseInt(amountArg, 10);
        if (isNaN(amount) || amount <= 0) {
            return message.reply('Você precisa inserir um valor numérico positivo ou "all" para remover todo o dinheiro!')
                .then(msg => {
                    setTimeout(() => msg.delete().catch(console.error), 10000); // 10 segundos
                })
                .catch(console.error);
        }

        try {
            const userId = user.id;
            const wallet = await db.get(`wallet_${userId}`) || 0;
            const bank = await db.get(`bank_${userId}`) || 0;
            const total = wallet + bank;

            // Verifica se o saldo total é suficiente para a remoção
            if (total < amount) {
                return message.reply('O valor a ser removido é maior do que o saldo total do usuário!')
                    .then(msg => {
                        setTimeout(() => msg.delete().catch(console.error), 10000); // 10 segundos
                    })
                    .catch(console.error);
            }

            // Remove o valor da carteira e do banco, priorizando a carteira
            if (wallet >= amount) {
                // Subtrai diretamente da carteira
                await db.set(`wallet_${userId}`, wallet - amount);
            } else {
                // Subtrai da carteira e depois do banco
                const remainingAmount = amount - wallet;
                await db.set(`wallet_${userId}`, 0); // Limpa a carteira
                await db.set(`bank_${userId}`, bank - remainingAmount);
            }

            // Cria o embed de resposta
            const embed = new EmbedBuilder()
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setTitle('Dinheiro Removido!')
                .setColor('Red') // Cor vermelha em formato hexadecimal
                .setDescription(`${emotes.yes} Foram removidos **${emotes.moeda}${amount}** do saldo de ${user}!`)
                .setTimestamp();

            return message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Erro ao remover dinheiro:', error);
            return message.reply('Houve um erro ao tentar remover o dinheiro.')
                .then(msg => {
                    setTimeout(() => msg.delete().catch(console.error), 10000); // 10 segundos
                })
                .catch(console.error);
        }
    }
};
