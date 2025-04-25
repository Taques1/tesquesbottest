const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB(); // Instanciando QuickDB
const emotes = require('../emotes.json'); // Emojis personalizados

module.exports = {
    name: 'blackjack',
    description: 'Jogue uma partida de Blackjack!',
    execute: async (client, message, args) => {
        const bet = parseInt(args[0]);
        if (isNaN(bet) || bet <= 0) {
            return message.reply('Por favor, especifique uma aposta válida.');
        }

        const balance = await db.get(`wallet_${message.author.id}`) || 0;
        if (balance < bet) {
            return message.reply(`Você não tem dinheiro suficiente para apostar ${bet}. Seu saldo atual é ${balance}.`);
        }

        // Funções auxiliares
        const getCard = () => Math.floor(Math.random() * 10) + 1; // Cartas de 1 a 10
        const getTotal = (cards) => cards.reduce((a, b) => a + b, 0);

        // Cartas do jogador e do dealer
        let playerCards = [getCard(), getCard()];
        let dealerCards = [getCard(), getCard()];

        let playerTotal = getTotal(playerCards);
        let dealerTotal = getTotal(dealerCards);

        // Função para formatar o footer
        const getFooter = (playerTotal, dealerTotal, cardsRemaining, revealDealer) => {
            // Se revealDealer for verdadeiro, mostramos o valor total da mão do dealer
            const dealerDisplay = revealDealer ? dealerTotal : `${dealerCards[0]} + ?`;
            return `Sua mão: ${playerTotal} | Mão do dealer: ${dealerDisplay} | Cartas restantes: ${cardsRemaining}`;
        };

        const embed = new EmbedBuilder()
            .setTitle('Blackjack')
            .setColor('Gold')
            .setDescription(`
**Sua mão:**
${playerCards.map(card => `🃏 ${card}`).join(' + ')}
**Valor:** ${playerTotal}

**Mão do dealer:**
🃏 ${dealerCards[0]} + ?
**Valor:** ?

**Faça sua escolha:**
- **Pedir Carta**: Receba uma nova carta.
- **Parar**: Finalize sua jogada.
            `)
            .setFooter({ text: getFooter(playerTotal, dealerTotal, 52, false) });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('hit')
                    .setLabel('Pedir Carta')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('stand')
                    .setLabel('Parar')
                    .setStyle(ButtonStyle.Danger)
            );

        const msg = await message.channel.send({ embeds: [embed], components: [row] });

        const collector = msg.createMessageComponentCollector({ time: 60000 });

        const endGame = async (i, resultMessage, color) => {
            await i.update({
                embeds: [new EmbedBuilder()
                    .setTitle('Blackjack')
                    .setColor(color)
                    .setDescription(`
**Sua mão:**
${playerCards.map(card => `🃏 ${card}`).join(' + ')}
**Valor:** ${playerTotal}

**Mão do dealer:**
${dealerCards.map(card => `🃏 ${card}`).join(' + ')}
**Valor:** ${dealerTotal}

${resultMessage} ${resultMessage === 'Você ganhou!' ? `Você ganhou **${emotes.moeda}${bet}**.` : resultMessage === 'Você perdeu!' ? `Você perdeu **${emotes.moeda}${bet}**.` : ''}
                    `)
                    .setFooter({ text: getFooter(playerTotal, dealerTotal, 52 - playerCards.length - dealerCards.length, true) })
                ],
                components: []
            });
        };

        const checkWinner = async (i) => {
            if (playerTotal === 21 || dealerTotal === 21) {
                let resultMessage;
                let color;

                if (playerTotal === 21 && dealerTotal === 21) {
                    resultMessage = 'Empate!';
                    color = 'Yellow';
                } else if (playerTotal === 21 || dealerTotal > 21 || playerTotal > dealerTotal) {
                    await db.add(`wallet_${message.author.id}`, bet);
                    resultMessage = 'Você ganhou!';
                    color = 'Green';
                } else {
                    await db.sub(`wallet_${message.author.id}`, bet);
                    resultMessage = 'Você perdeu!';
                    color = 'Red';
                }

                await endGame(i, resultMessage, color);
                collector.stop(); // Para o coletor, pois o jogo acabou
                return true;
            }
            return false;
        };

        collector.on('collect', async i => {
            if (i.user.id !== message.author.id) return;

            if (i.customId === 'hit') {
                playerCards.push(getCard());
                playerTotal = getTotal(playerCards);

                if (await checkWinner(i)) return; // Verifica se alguém venceu após pedir carta

                if (playerTotal > 21) {
                    await db.sub(`wallet_${message.author.id}`, bet);
                    return endGame(i, `Você estourou! Você perdeu **${emotes.moeda}${bet}**.`, 'Red');
                }

                embed.setDescription(`
**Sua mão:**
${playerCards.map(card => `🃏 ${card}`).join(' + ')}
**Valor:** ${playerTotal}

**Mão do dealer:**
🃏 ${dealerCards[0]} + ?
**Valor:** ?
                `);
                embed.setFooter({ text: getFooter(playerTotal, dealerTotal, 52 - playerCards.length, false) });
                await i.update({ embeds: [embed], components: [row] });

            } else if (i.customId === 'stand') {
                while (dealerTotal < 17) {
                    dealerCards.push(getCard());
                    dealerTotal = getTotal(dealerCards);
                }

                let resultMessage;
                let color;
                if (dealerTotal > 21 || playerTotal > dealerTotal) {
                    await db.add(`wallet_${message.author.id}`, bet);
                    resultMessage = 'Você ganhou!';
                    color = 'Green';
                } else if (playerTotal < dealerTotal) {
                    await db.sub(`wallet_${message.author.id}`, bet);
                    resultMessage = 'Você perdeu!';
                    color = 'Red';
                } else {
                    resultMessage = 'Empate!';
                    color = 'Yellow';
                }

                await endGame(i, resultMessage, color);
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                message.channel.send(`${message.author}, o tempo acabou e você desistiu da partida.`);
            }
            msg.edit({ components: [] });
        });
    }
};
