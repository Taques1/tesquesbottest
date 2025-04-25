const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { QuickDB } = require('quick.db');
const emotes = require('../emotes.json');
const db = new QuickDB();

module.exports.execute = async (client, message, args) => {
    const betAmount = parseInt(args[0], 10);

    if (isNaN(betAmount) || betAmount <= 0) {
        return message.channel.send('Por favor, forneça um valor de aposta válido.');
    }

    const players = [];
    const collectedPlayers = [];
    let totalPot = 0;

    const embed = new EmbedBuilder()
        .setTitle('💀 Roleta Russa!')
        .setDescription(`Clique no botão abaixo para entrar na roleta. A aposta é de ${emotes.moeda}${betAmount} por jogador.`)
        .setColor('Random');

    // Botão para entrar na roleta
    const joinButton = new ButtonBuilder()
        .setCustomId('join_roleta')
        .setLabel('Entrar na Roleta')
        .setEmoji(emotes.gun)
        .setStyle(ButtonStyle.Primary);

    // Botão para trancar a lista
    const lockButton = new ButtonBuilder()
        .setCustomId('lock_roleta')
        .setLabel('🔒 Trancar Lista')
        .setStyle(ButtonStyle.Secondary);

    // Botão para começar a partida
    const startButton = new ButtonBuilder()
        .setCustomId('start_roleta')
        .setLabel('🏁 Começar Partida')
        .setStyle(ButtonStyle.Danger);

    const buttonRow = new ActionRowBuilder().addComponents(joinButton, lockButton, startButton);

    const messageAction = await message.channel.send({ embeds: [embed], components: [buttonRow] });

    const filter = interaction => ['join_roleta', 'lock_roleta', 'start_roleta'].includes(interaction.customId);
    const collector = messageAction.createMessageComponentCollector({ filter, time: 30000 });

    collector.on('collect', async interaction => {
        if (interaction.customId === 'join_roleta') {
            const userBalance = await db.get(`wallet_${interaction.user.id}`) || 0;

            if (userBalance < betAmount) {
                return interaction.reply({ content: `Você não tem ${emotes.moeda} suficientes para participar desta aposta!`, ephemeral: true });
            }

            if (players.includes(interaction.user.id)) {
                return interaction.reply({ content: 'Você já está na lista!', ephemeral: true });
            }

            players.push(interaction.user.id);
            totalPot += betAmount;
            collectedPlayers.push(interaction.user);

            await db.set(`wallet_${interaction.user.id}`, userBalance - betAmount);

            await interaction.reply({ content: `Você entrou na roleta!`, ephemeral: true });

            const updatedEmbed = new EmbedBuilder()
                .setTitle('💀 Roleta Russa!')
                .setDescription(`👤 __**Jogadores vivos:**__\n${collectedPlayers.map(player => `<@${player.id}>`).join('\n')}`)
                .setColor('Random');

            await messageAction.edit({ embeds: [updatedEmbed] });
        } else if (interaction.customId === 'lock_roleta') {
            // Trancar a lista
            const lockEmbed = new EmbedBuilder()
                .setTitle('🔒 Lista Trancada!')
                .setDescription('A lista de jogadores está agora trancada. Não é possível adicionar mais jogadores.')
                .setColor('Orange');

            await messageAction.edit({ embeds: [lockEmbed], components: [] });
            collector.stop();
        } else if (interaction.customId === 'start_roleta') {
            if (players.length < 2) {
                const botNames = ['Bot1', 'Bot2', 'Bot3', 'Bot4', 'Bot5'];
                while (players.length < 6) {
                    const botName = botNames[players.length - 1];
                    players.push(botName);
                    collectedPlayers.push({ id: `bot_${botName}`, username: botName });
                }
            }

            const startEmbed = new EmbedBuilder()
                .setTitle('🏁 A roleta russa começou!')
                .setDescription(`Começando com (${players.length}) jogadores! Vamos ver quem sobrevive...`)
                .setColor('Red');

            await message.channel.send({ embeds: [startEmbed] });

            // Começa o jogo de eliminação
            while (players.length > 1) {
                const eliminatedPlayer = collectedPlayers.splice(Math.floor(Math.random() * collectedPlayers.length), 1)[0];
                players.splice(players.indexOf(eliminatedPlayer.username || `<@${eliminatedPlayer.id}>`), 1);

                const eliminationEmbed = new EmbedBuilder()
                    .setTitle(`💀 ${emotes.gun} Eliminação!`)
                    .setDescription(`**${eliminatedPlayer.username || `<@${eliminatedPlayer.id}>`}** foi eliminado da roleta!`)
                    .setColor('Red');

                await message.channel.send({ embeds: [eliminationEmbed] });
                await new Promise(resolve => setTimeout(resolve, 10000));
            }

            const winner = collectedPlayers[0];
            const winnerBalance = await db.get(`wallet_${winner.id}`) || 0;

            await db.set(`wallet_${winner.id}`, winnerBalance + totalPot);

            const resultEmbed = new EmbedBuilder()
                .setTitle('🏆 Resultado da Roleta Russa!')
                .setDescription(`O vencedor é ${winner.username || `<@${winner.id}>`}!\n\n${emotes.moeda}${totalPot} foram ganhos!`)
                .setColor('Green');

            await message.channel.send({ embeds: [resultEmbed] });
        }
    });

    collector.on('end', async collected => {
        console.log(`Collected ${collected.size} interactions.`);
    });
};

module.exports.help = {
    name: 'roleta'
};
