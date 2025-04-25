const { EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const emotes = require("../emotes.json");

const db = new QuickDB(); // Instancia o QuickDB
const WORK_COOLDOWN = 30000; // 1 hora em milissegundos

module.exports = {
    name: 'work',
    description: 'Comando para trabalhar e ganhar dinheiro',
    execute: async (client, message, args) => {
        const userId = message.author.id;

        // Verifica o cooldown do trabalho
        const lastWork = await db.get(`workCooldown_${userId}`);
        const currentTime = Date.now();

        if (lastWork && currentTime - lastWork < WORK_COOLDOWN) {
            const timeLeft = Math.ceil((WORK_COOLDOWN - (currentTime - lastWork)) / 60000);
            const cooldownEmbed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(
                    `${emotes.no} Você já trabalhou recentemente! Tente novamente em **${timeLeft} minutos**.`
                )
                .setTimestamp();
            return message.channel.send({ embeds: [cooldownEmbed] });
        }

        // Gera a recompensa aleatória (dinamicamente ajustável)
        const reward = Math.floor(Math.random() * (200 - 50 + 1)) + 50; // Entre 50 e 200 moedas

        try {
            // Adiciona a recompensa à carteira do usuário
            await db.add(`wallet_${userId}`, reward);
            await db.set(`workCooldown_${userId}`, currentTime); // Define o cooldown do trabalho

            // Cria o embed de resposta
            const successEmbed = new EmbedBuilder()
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setTitle('Trabalho Concluído!')
                .setColor('Green')
                .setDescription(`${emotes.yes} Você trabalhou e ganhou **${emotes.moeda}${reward}**!`)
                .setTimestamp();

            return message.channel.send({ embeds: [successEmbed] });
        } catch (error) {
            console.error('Erro ao processar o comando de trabalho:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(`${emotes.no} Ocorreu um erro ao processar seu trabalho. Tente novamente mais tarde.`)
                .setTimestamp();
            return message.channel.send({ embeds: [errorEmbed] });
        }
    }
};
