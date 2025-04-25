const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  name: 'pescar',
  description: 'Pesque um peixe e veja o que você pegou!',
  execute: async (client, message, args) => {
    const userId = message.author.id;

    const fishingRod = await db.get(`inventory_${userId}.vara_de_pesca`) || 0;
    if (fishingRod < 1) {
      return message.reply('🎣 Você precisa de uma **Vara de Pesca** para pescar. Compre uma na loja!');
    }

    const magneticBait = await db.get(`inventory_${userId}.isca_magnetica`) || 0;
    const baitDisplay = magneticBait > 0 ? '🧲 **Isca Magnética Ativa**' : '⚠️ **Sem Isca**';

    const fishTypes = [
      { name: '🐟 Peixe Pequeno', value: 100, chance: 0.6 },
      { name: '🐠 Peixe Médio', value: 500, chance: 0.3 },
      { name: '🐡 Peixe Grande', value: 1000, chance: 0.09 },
      { name: '🐋 Peixe Lendário', value: 5000, chance: 0.01 }
    ];

    const startFishingEmbed = new EmbedBuilder()
      .setTitle('🎣 Pesca Iniciada!')
      .setDescription(`Aguarde o momento certo...\n\n${baitDisplay}`)
      .setColor('#1E90FF');

    const fishButton = new ButtonBuilder()
      .setCustomId('catch_fish')
      .setLabel('Pescar')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true);

    const row = new ActionRowBuilder().addComponents(fishButton);
    const msg = await message.channel.send({ embeds: [startFishingEmbed], components: [row] });

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

    const delay = Math.random() * 1000 + 2000;

    setTimeout(async () => {
      fishButton.setDisabled(false);
      await msg.edit({ components: [row] });

      const filter = (interaction) => interaction.customId === 'catch_fish' && interaction.user.id === userId;
      const collector = msg.createMessageComponentCollector({ filter, time: 2000 });

      let fishCaught = false;

      collector.on('collect', async (interaction) => {
        if (!interaction.isButton()) return;
        fishCaught = true;

        let rewards = '';
        let extras = '';
        let losses = '';

        const fish = getFishingResult();
        await db.add(`inventory_${userId}.vara_de_pesca`, -1);

        if (fish) {
          await db.add(`wallet_${userId}`, fish.value);
          rewards += `🎣 **${fish.name}** (+${fish.value} moedas)\n`;

          if (fish.name === '🐋 Peixe Lendário') {
            const hasAchievement = await db.get(`achievements_${userId}.fish_legendary`);
            if (!hasAchievement) {
              await db.set(`achievements_${userId}.fish_legendary`, true);
              extras += `🏆 Conquista desbloqueada: **Pesque um Peixe Lendário**!\n`;
            }
          }

          if (magneticBait > 0) {
            const baitEffectChance = 0.5;
            const baitDurabilityLossChance = 0.3;

            if (Math.random() < baitEffectChance) {
              extras += `🧲 Sua **Isca Magnética** brilhou...\n`;

              if (Math.random() < 0.8) {
                const chestTypes = [
                  { name: 'Baú Comum', value: 100 },
                  { name: 'Baú Incomum', value: 250 },
                  { name: 'Baú Raro', value: 500 },
                  { name: 'Baú Épico', value: 1000 },
                  { name: 'Baú Lendário', value: 10000 }
                ];
                const chest = chestTypes[Math.floor(Math.random() * chestTypes.length)];
                await db.add(`wallet_${userId}`, chest.value);
                rewards += `🎁 **${chest.name}** (+${chest.value} moedas)\n`;
              } else {
                extras += `🔍 Era só uma tralha qualquer.\n`;
              }
            }

            if (Math.random() < baitDurabilityLossChance) {
              await db.add(`inventory_${userId}.isca_magnetica`, -1);
              losses += `💔 Sua **Isca Magnética** quebrou!\n`;
            }
          }
        } else {
          extras += '❌ Você não conseguiu pescar nada...\n';
        }

        const resultEmbed = new EmbedBuilder()
          .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
          .setColor('#00BFFF')
          .setTitle('🎣 Resultado da Pesca')
          .setDescription(
            `${rewards || 'Nada pescado.'}\n${extras || ''}\n${losses || ''}`
          )
          .setFooter({ text: baitDisplay });

        await interaction.update({ embeds: [resultEmbed], components: [] });
      });

      collector.on('end', async (collected, reason) => {
        if (!fishCaught && reason === 'time') {
          const escapeEmbed = new EmbedBuilder()
            .setTitle('🚨 O Peixe Fugiu!')
            .setDescription('O peixe escapou enquanto você hesitava! Seja mais rápido na próxima vez.')
            .setColor('#FF4500')
            .setFooter({ text: baitDisplay });

          await msg.edit({ embeds: [escapeEmbed], components: [] });
        }
      });

    }, delay);
  },
};
