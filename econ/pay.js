const { EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const emotes = require("../emotes.json");

const db = new QuickDB(); // Instanciando QuickDB

module.exports = {
    name: 'pay',
    description: 'Transfere dinheiro da carteira de um usuário para outro.',
    execute: async (client, message, args) => {
        const sender = message.author;
        const receiver = message.mentions.users.first();
        const amountArg = args[1];

        // Verifica se o receptor é válido
        if (!receiver) {
            const replyMsg = await message.reply(`Você precisa mencionar um usuário para enviar ${emotes.moeda}.`);
            setTimeout(() => {
                replyMsg.delete().catch(console.error);
            }, 10000); // 10 segundos
            return;
        }

        // Verifica se o usuário não está tentando enviar dinheiro para si mesmo
        if (sender.id === receiver.id) {
            const replyMsg = await message.reply(`Você não pode enviar ${emotes.moeda} para si mesmo.`);
            setTimeout(() => {
                replyMsg.delete().catch(console.error);
            }, 10000); // 10 segundos
            return;
        }

        let amount;

        // Se o argumento for 'all', transfere todo o saldo
        if (amountArg.toLowerCase() === 'all') {
            amount = await db.get(`wallet_${sender.id}`) || 0;
        } else {
            // Verifica se a quantidade é válida
            amount = parseInt(amountArg, 10);
            if (isNaN(amount) || amount <= 0) {
                const replyMsg = await message.reply(`Você precisa especificar uma quantidade válida de ${emotes.moeda} para enviar.`);
                setTimeout(() => {
                    replyMsg.delete().catch(console.error);
                }, 10000); // 10 segundos
                return;
            }
        }

        // Verifica o saldo do remetente
        const senderBalance = await db.get(`wallet_${sender.id}`) || 0;
        if (senderBalance < amount) {
            const replyMsg = await message.reply(`Você não tem ${emotes.moeda} suficientes para enviar a quantidade especificada.`);
            setTimeout(() => {
                replyMsg.delete().catch(console.error);
            }, 10000); // 10 segundos
            return;
        }

        // Atualiza o saldo dos usuários
        await db.set(`wallet_${sender.id}`, senderBalance - amount);
        const receiverBalance = await db.get(`wallet_${receiver.id}`) || 0;
        await db.set(`wallet_${receiver.id}`, receiverBalance + amount);

        // Cria o embed de resposta
        const embed = new EmbedBuilder()
            .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
            .setTitle('Moedas Enviadas!')
            .setColor('Green') // Cor verde em formato hexadecimal
            .setDescription(`${emotes.yes} Você enviou **${emotes.moeda}${amount}** para ${receiver}!`)
            .setTimestamp();

        return message.channel.send({ embeds: [embed] });
    }
};
