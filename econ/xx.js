const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');

const db = new QuickDB();

module.exports = {
  name: 'pescar',
  description: 'Pesque um peixe e veja o que você pegou!',
  execute: async (client, message, args) => {
    const userId = message.author.id;

    const emojis = {
      vara: '<:varadepesca:1365397727198052562>',
      moeda: '<:emoji_26:1077739873143890011>',
      isca_magnetica: '<:iscamagnetica:1280258865606164652>',
      isca_dupla: '<:iscadupla:1365398227636981780>',
      isca_tripla: '<:iscatripla:1365397725201436702>',
      isca_comum: '<:iscadepesca:1365398224478670888>',
      isca_especial: '<:isca2:1365398230053027961>',
      peixe_pequeno: '<:peixep:1365399244667617320>',
      peixe_medio: '<:peixem:1365399242029404241>',
      peixe_grande: '<:paixeg:1365399956516638790>',
      peixe_lendario: '<:peixel:1365399951315697744>'
    };

    const fishingRod = await db.get(`inventory_${userId}.vara_de_pesca`) || 0;
    if (fishingRod < 1) return message.reply(`Você precisa de uma vara de pesca ${emojis.vara} para pescar. Compre uma na loja!`);

    const inventory = await db.get(`inventory_${userId}`) || {};

    const fishTypes = [
      { name: `${emojis.peixe_pequeno} Peixe Pequeno`, value: 100, chance: 0.6 },
      { name: `${emojis.peixe_medio} Peixe Médio`, value: 500, chance: 0.3 },
      { name: `${emojis.peixe_grande} Peixe Grande`, value: 1000, chance: 0.09 },
      { name: `${emojis.peixe_lendario} Peixe Lendário`, value: 5000, chance: 0.01 }
    ];

    const applyBaitBonus = (fishList, baitType) => {
      if (baitType === 'isca_comum') {
        // Aumenta levemente a chance dos peixes melhores
        fishList[0].chance -= 0.2; // pequeno
        fishList[1].chance += 0.1;
        fishList[2].chance += 0.08;
        fishList[3].chance += 0.02;
      }
      return fishList;
    };

    const getFishingResult = () => {
      let adjustedFish = JSON.parse(JSON.stringify(fishTypes));
      if (inventory.isca_comum > 0) adjustedFish = applyBaitBonus(adjustedFish, 'isca_comum');
      const rand = Math.random();
      let cumulativeChance = 0;
      for (const fish of adjustedFish) {
        cumulativeChance += fish.chance;
        if (rand <= cumulativeChance) return fish;
      }
    };

    const startFishingEmbed = new EmbedBuilder()
      .setTitle('🎣 Pesca!')
      .setDescription('Espere o momento certo e aperte o botão "Pescar" para capturar o peixe!')
      .setColor('#1E90FF');

    const fishButton = new ButtonBuilder()
      .setCustomId('catch_fish')
      .setLabel('Pescar')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true);

    const row = new ActionRowBuilder().addComponents(fishButton);
    const msg = await message.channel.send({ embeds: [startFishingEmbed], components: [row] });

    const delay = Math.random() * 1000 + 2000;

    setTimeout(async () => {
      fishButton.setDisabled(false);
      await msg.edit({ components: [row] });

      const filter = (i) => i.customId === 'catch_fish' && i.user.id === userId;
      const collector = msg.createMessageComponentCollector({ filter, time: 2000 });

      let fishCaught = false;
      collector.on('collect', async (i) => {
        fishCaught = true;

        let results = [];
        let amount = 1;
        if (inventory.isca_dupla > 0 && Math.random() < 0.7) amount = 2;
        if (inventory.isca_tripla > 0 && Math.random() < 0.5) amount = 3;

        for (let j = 0; j < amount; j++) {
          const fish = getFishingResult();
          if (fish) {
            results.push(fish);
            await db.add(`wallet_${userId}`, fish.value);
          }
        }

        await db.add(`inventory_${userId}.vara_de_pesca`, -1);

        let resultMessage = results.map(f => `🎉 Você pescou um **${f.name}** e ganhou ${emojis.moeda} ${f.value}`).join('\n');

        if (results.some(f => f.name.includes('Peixe Lendário'))) {
          const hasAchiev = await db.get(`achievements_${userId}.fish_legendary`);
          if (!hasAchiev) {
            await db.set(`achievements_${userId}.fish_legendary`, true);
            resultMessage += `\n🏆 Parabéns! Conquista desbloqueada: **Pesque um Peixe Lendário**!`;
          }
        }

        if (inventory.isca_especial > 0 && Math.random() < 0.4) {
          const bonus = Math.floor(Math.random() * 2500 + 1000);
          await db.add(`wallet_${userId}`, bonus);
          resultMessage += `\n🌟 A **Isca Especial ${emojis.isca_especial}** ativou um portal e você encontrou ${emojis.moeda} ${bonus} escondidas num baú submerso!`;
        }

        const resultEmbed = new EmbedBuilder()
          .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
          .setColor('#1E90FF')
          .setTitle('🎣 Resultado da Pesca')
          .setDescription(resultMessage);

        await i.update({ embeds: [resultEmbed], components: [] });
      });

      collector.on('end', async (_, reason) => {
        if (!fishCaught && reason === 'time') {
          const escapeEmbed = new EmbedBuilder()
            .setTitle('🚨 O Peixe Fugiu!')
            .setDescription('O peixe escapou enquanto você hesitava! Seja mais rápido na próxima vez.')
            .setColor('#FF4500');

          await msg.edit({ embeds: [escapeEmbed], components: [] });
        }
      });
    }, delay);
  },
};
