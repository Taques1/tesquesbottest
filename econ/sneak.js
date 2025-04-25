const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');

const db = new QuickDB();

module.exports = {
  name: 'pescar',
  description: 'Pesque um peixe e veja o que você pegou!',
  execute: async (client, message, args) => {
    const userId = message.author.id;

    // Verifica se o usuário tem uma vara de pesca
    const fishingRod = await db.get(`inventory_${userId}.vara_de_pesca`) || 0;
    if (fishingRod < 1) {
      return message.reply('Você precisa de uma vara de pesca para pescar. Compre uma na loja!');
    }

    // Configurações do jogo
    const fishTypes = [
      { name: 'Peixe Pequeno', value: 100, chance: 0.6, emoji: '🐟' }, // 60% de chance
      { name: 'Peixe Médio', value: 500, chance: 0.3, emoji: '🐠' }, // 30% de chance
      { name: 'Peixe Grande', value: 1000, chance: 0.09, emoji: '🐡' }, // 9% de chance
      { name: 'Peixe Lendário', value: 5000, chance: 0.01, emoji: '🐋' } // 1% de chance
    ];

    // Envia a mensagem inicial com o botão desativado
    const startFishingEmbed = new EmbedBuilder()
      .setTitle('🎣 Pesca!')
      .setDescription('Espere o momento certo e aperte o botão "Pescar" para capturar o peixe!')
      .setColor('#1E90FF');

    const fishButton = new ButtonBuilder()
      .setCustomId('catch_fish')
      .setLabel('Pescar')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true); // Botão desativado inicialmente

    const row = new ActionRowBuilder().addComponents(fishButton);

    const msg = await message.channel.send({ embeds: [startFishingEmbed], components: [row] });

    // Função para determinar o resultado da pesca
    const getFishingResult = () => {
      const rand = Math.random();
      let cumulativeChance = 0;
      for (const fish of fishTypes) {
        cumulativeChance += fish.chance;
        if (rand <= cumulativeChance) {
          return fish;
        }
      }
    };

    // Função para atualizar a animação de pesca
    const updateFishingAnimation = (emoji) => {
      return new EmbedBuilder()
        .setTitle('🎣 Pesca!')
        .setDescription(`O peixe está se aproximando... ${emoji}`)
        .setColor('#1E90FF');
    };

    // Espera um tempo aleatório entre 2 a 3 segundos e ativa o botão
    const delay = Math.random() * 1000 + 2000; // Entre 2000 e 3000 ms

    setTimeout(async () => {
      fishButton.setDisabled(false); // Ativa o botão
      await msg.edit({ components: [row] });

      // Coleta a interação do botão
      const filter = (interaction) => interaction.customId === 'catch_fish' && interaction.user.id === userId;
      const collector = msg.createMessageComponentCollector({ filter, time: 2000 }); // Tempo máximo para clicar é 2 segundos

      let fishCaught = false;

      collector.on('collect', async (interaction) => {
        if (!interaction.isButton()) return;

        fishCaught = true;

        // Atualiza a animação do peixe
        await msg.edit({ embeds: [updateFishingAnimation('🌊')] });

        // Atraso para aumentar a emoção
        setTimeout(async () => {
          const fish = getFishingResult();
          let resultMessage;

          if (fish) {
            // Adiciona o valor ao saldo do usuário
            await db.add(`wallet_${userId}`, fish.value);

            // Remove uma vara de pesca do inventário
            await db.add(`inventory_${userId}.vara_de_pesca`, -1);

            resultMessage = `🎉 Você pescou um **${fish.name}** ${fish.emoji} e ganhou ${fish.value} moedas!`;

            // Se for o peixe lendário, mostre uma animação especial
            if (fish.name === 'Peixe Lendário') {
              resultMessage += `\n🏆 Você pegou um **Peixe Lendário**! Um grande prêmio!`;
            }
          } else {
            resultMessage = '❌ Você não conseguiu pescar nada desta vez. Tente novamente!';
          }

          // Atualiza o embed original com o resultado da pesca
          const resultEmbed = new EmbedBuilder()
            .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
            .setColor('#1E90FF')
            .setTitle('🎣 Resultado da Pesca')
            .setDescription(resultMessage);

          await interaction.update({ embeds: [resultEmbed], components: [] });
        }, 1500); // Atraso de 1.5 segundos para dar tempo da animação de pesca

      });

      collector.on('end', async (collected, reason) => {
        if (!fishCaught && reason === 'time') {
          // Se o peixe escapou
          const escapeEmbed = new EmbedBuilder()
            .setTitle('🚨 O Peixe Fugiu!')
            .setDescription('O peixe escapou enquanto você hesitava! Seja mais rápido na próxima vez.')
            .setColor('#FF4500') // Vermelho para alerta
            .setFooter({ text: 'Fique atento da próxima vez!' });

          await msg.edit({ embeds: [escapeEmbed], components: [] });
        }
      });

    }, delay);
  },
};
