const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { QuickDB } = require('quick.db');
const emotes = require('../emotes.json'); // Carregar emojis personalizados do arquivo emotes.json
const db = new QuickDB(); // Instanciando QuickDB

module.exports = {
    name: 'corrida',
    description: 'Participe de uma corrida de cavalos!',
    execute: async (client, message, args) => {
        // Verifica se a aposta é válida
        const bet = parseInt(args[0]);
        if (isNaN(bet) || bet <= 0) {
            return message.reply('Por favor, especifique uma aposta válida.');
        }

        // Verifica se o usuário tem saldo suficiente
        const balance = await db.get(`wallet_${message.author.id}`) || 0;
        if (balance < bet) {
            return message.reply(`Você não tem dinheiro suficiente para apostar ${bet}. Seu saldo atual é ${balance}.`);
        }

        // Emojis dos cavalos personalizados
        const horseEmojis = {
            0: `<:${emotes.cavalo1}>`,  // <cavalo1:1275247099050721290>
            1: `<:${emotes.cavalo2}>`,  // <cavalo2:1275247241551937576>
            2: `<:${emotes.cavalo3}>`,  // <cavalo3:1275247287458594887>
            3: `<:${emotes.cavalo4}>`   // <cavalo4:1275247306303869031>
        };

        // Criação do embed e botões
        const embed = new EmbedBuilder()
            .setTitle('Corrida de Cavalos')
            .setColor('Gold')
            .setDescription(`
**Escolha um cavalo para apostar:**
- **Cavalo 1** ${horseEmojis[0]}
- **Cavalo 2** ${horseEmojis[1]}
- **Cavalo 3** ${horseEmojis[2]}
- **Cavalo 4** ${horseEmojis[3]}

Faça sua aposta e veja quem vence!
            `);

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('horse_0')
                    .setLabel(`Cavalo 1 ${horseEmojis[0]}`)
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('horse_1')
                    .setLabel(`Cavalo 2 ${horseEmojis[1]}`)
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('horse_2')
                    .setLabel(`Cavalo 3 ${horseEmojis[2]}`)
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('horse_3')
                    .setLabel(`Cavalo 4 ${horseEmojis[3]}`)
                    .setStyle(ButtonStyle.Primary)
            );

        const msg = await message.channel.send({ embeds: [embed], components: [row] });

        const collector = msg.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async i => {
            if (i.user.id !== message.author.id) return;

            const horseIndex = parseInt(i.customId.split('_')[1]);
            const chosenHorse = horseEmojis[horseIndex];

            await i.update({ 
                content: `Você escolheu o ${chosenHorse} para a corrida! Aguardando a corrida...`, 
                components: [] 
            });

            // Simula a corrida
            const advanceHorses = (positions) => {
                return positions.map(pos => pos + Math.floor(Math.random() * 5) + 1);
            };

            let positions = [0, 0, 0, 0];
            const raceDuration = 15000; // Duração da corrida em milissegundos
            const updateInterval = 500; // Intervalo de atualização em milissegundos

            const raceEmbed = new EmbedBuilder()
                .setTitle('Corrida de Cavalos')
                .setColor('#FFD700') // Amarelo para a corrida
                .setDescription('A corrida vai começar! 🏇');

            const raceMessage = await message.channel.send({ embeds: [raceEmbed] });

            const updateRace = async () => {
                const raceLine = Object.values(horseEmojis).map((horse, index) => ' '.repeat(positions[index]) + horse).join('\n');
                const result = positions.map((pos, index) => ' '.repeat(pos) + horseEmojis[index]).join('\n');

                await raceMessage.edit({
                    content: 'A corrida está acontecendo! 🏁',
                    embeds: [new EmbedBuilder()
                        .setTitle('Corrida de Cavalos')
                        .setDescription(raceLine)
                        .setColor('#FFD700')] // Amarelo para a corrida
                });
            };

            const raceInterval = setInterval(() => {
                positions = advanceHorses(positions);
                updateRace();
            }, updateInterval);

            setTimeout(async () => {
                clearInterval(raceInterval);
                const winnerIndex = positions.indexOf(Math.max(...positions));
                const winnerHorse = horseEmojis[winnerIndex];
                const resultMessage = winnerIndex === horseIndex ? `Parabéns! Seu cavalo ${chosenHorse} venceu!` : `Infelizmente, seu cavalo ${chosenHorse} não venceu. O vencedor foi ${winnerHorse}.`;

                const prizeAmount = winnerIndex === horseIndex ? bet * 2 : 0;
                if (prizeAmount > 0) {
                    await db.add(`wallet_${message.author.id}`, prizeAmount);
                } else {
                    await db.sub(`wallet_${message.author.id}`, bet);
                }

                await raceMessage.edit({
                    content: resultMessage + `\n\nO resultado final foi:\n` + Object.values(horseEmojis).map((horse, index) => `${horse}: ${positions[index]} unidades`).join('\n'),
                    embeds: [new EmbedBuilder()
                        .setTitle('Corrida de Cavalos - Resultado')
                        .setDescription(`O vencedor foi ${winnerHorse}!`)
                        .setColor(winnerIndex === horseIndex ? '#00FF00' : '#FF0000')] // Verde para vitória, vermelho para perda
                });
            }, raceDuration);
        });

        collector.on('end', collected => {
            msg.edit({ components: [] });
        });
    }
};
