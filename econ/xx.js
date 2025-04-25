const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

// Mapeamento de emojis personalizados (atualize com IDs reais)
const emotes = {
  varadepesca: '<:varadepesca:1365397727198052562> ',
  moeda: '<:emoji_26:1077739873143890011>',
  isca_magnetica: '<:isca_magnetica:ID>',
  isca_dupla: '<:iscadupla:1365398227636981780>',
  isca_tripla: '<:iscatripla:1365397725201436702>',
  isca_comum: '<:iscadepesca:1365398224478670888>',
  isca_especial: '<:isca2:1365398230053027961>',
  peixe_pequeno: '<:peixep:1365399244667617320>',
  peixe_medio: '<:peixem:1365399242029404241>',
  peixe_grande: '<:paixeg:1365399956516638790>',
  peixe_lendario: '<:peixel:1365399951315697744>'
};

module.exports = {
  name: 'pescar',
  description: 'Pesque um peixe e veja o que você pegou!',
  execute: async (client, message, args) => {
    const userId = message.author.id;

    // Verifica vara de pesca
    const rodCount = await db.get(`inventory_${userId}.vara_de_pesca`) || 0;
    if (rodCount < 1) return message.reply('🎣 Você precisa de uma **Vara de Pesca** para pescar.');

    // Lista de iscas disponíveis
    const baitTypes = ['isca_magnetica', 'isca_dupla', 'isca_tripla', 'isca_comum', 'isca_especial'];
    const ownedBaits = [];
    for (const bait of baitTypes) {
      const qty = await db.get(`inventory_${userId}.${bait}`) || 0;
      if (qty > 0) ownedBaits.push(bait);
    }

    let selectedBait;
    // Se tiver mais de uma isca, mostra select menu
    if (ownedBaits.length > 1) {
      const menu = new StringSelectMenuBuilder()
        .setCustomId('select_bait')
        .setPlaceholder('Selecione sua isca')
        .addOptions(
          ...ownedBaits.map(bait => ({
            label: bait.replace('isca_', '').toUpperCase(),
            value: bait,
            emoji: emotes[bait]
          }))
        );
      const row = new ActionRowBuilder().addComponents(menu);
      const baitMsg = await message.channel.send({ content: '🎣 Escolha uma isca para começar:', components: [row] });

      const selCollector = baitMsg.createMessageComponentCollector({ filter: i => i.user.id === userId, max: 1, time: 30000 });
      const sel = await new Promise(resolve => {
        selCollector.on('collect', i => {
          i.deferUpdate();
          resolve(i.values[0]);
        });
        selCollector.on('end', () => resolve(null));
      });
      selectedBait = sel;
      await baitMsg.delete().catch(() => {});
    } else {
      // Se tiver apenas uma ou nenhuma, usa a única ou nenhuma
      selectedBait = ownedBaits[0] || null;
    }

    // Botão de prontidão
    const readyButton = new ButtonBuilder()
      .setCustomId('ready_fish')
      .setLabel('Pronto')
      .setStyle(ButtonStyle.Success);
    const readyRow = new ActionRowBuilder().addComponents(readyButton);
    const readyEmbed = new EmbedBuilder()
      .setTitle('🎣 Preparado para Pescar?')
      .setDescription('Clique em **Pronto** quando estiver preparado.')
      .setColor('#00AA00');
    const readyMsg = await message.channel.send({ embeds: [readyEmbed], components: [readyRow] });

    const readyCollector = readyMsg.createMessageComponentCollector({ filter: i => i.customId === 'ready_fish' && i.user.id === userId, max: 1, time: 30000 });
    readyCollector.on('collect', async i => {
      await i.update({ components: [] });

      // Define tipos de peixe
      const fishTypes = [
        { key: 'peixe_pequeno', name: 'Peixe Pequeno', value: 100, chance: 0.6 },
        { key: 'peixe_medio', name: 'Peixe Médio', value: 500, chance: 0.3 },
        { key: 'peixe_grande', name: 'Peixe Grande', value: 1000, chance: 0.09 },
        { key: 'peixe_lendario', name: 'Peixe Lendário', value: 5000, chance: 0.01 }
      ];
      // Determina peixe antes
      const rand = Math.random();
      let cumulative = 0;
      const fish = fishTypes.find(f => {
        cumulative += f.chance;
        return rand <= cumulative;
      });

      // Prepara botão de captura
      const catchButton = new ButtonBuilder()
        .setCustomId('catch_fish')
        .setLabel('Pescar')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true);
      const catchRow = new ActionRowBuilder().addComponents(catchButton);

      // Embed de pesca iniciada
      const startEmbed = new EmbedBuilder()
        .setTitle('🎣 Pesca Iniciada!')
        .setDescription(`${emotes.varadepesca} ${selectedBait ? emotes[selectedBait] + ' **' + selectedBait.replace('isca_', '').toUpperCase() + ' ATIVA**' : '⚠️ **Nenhuma Isca Equip.**'}`)
        .setColor('#1E90FF');
      const fishMsg = await message.channel.send({ embeds: [startEmbed], components: [catchRow] });

      // Delay para ativar botão e tempo de captura baseado na raridade
      const enableDelay = Math.floor(Math.random() * 1000) + 2000;
      const activeTime = Math.floor((1 - fish.chance) * 3000) + 2000;

      setTimeout(async () => {
        catchButton.setDisabled(false);
        await fishMsg.edit({ components: [catchRow] });

        const filterCatch = inter => inter.customId === 'catch_fish' && inter.user.id === userId;
        const catchCollector = fishMsg.createMessageComponentCollector({ filter: filterCatch, time: activeTime });
        let caught = false;

        catchCollector.on('collect', async inter => {
          caught = true;
          await inter.deferUpdate();

          // Lógica de recompensa
          const rewards = [];
          // Valor do peixe
          await db.add(`wallet_${userId}`, fish.value);
          rewards.push(`${emotes[fish.key]} **${fish.name}** ${emotes.moeda}${fish.value}`);
          // Remove vara
          await db.add(`inventory_${userId}.vara_de_pesca`, -1);

          // Conquista de peixe lendário
          const extras = [];
          if (fish.key === 'peixe_lendario') {
            const has = await db.get(`achievements_${userId}.fish_legendary`);
            if (!has) {
              await db.set(`achievements_${userId}.fish_legendary`, true);
              extras.push('🏆 Conquista desbloqueada: **Pesque um Peixe Lendário**');
            }
          }

          // Efeito da isca equipada
          const losses = [];
          if (selectedBait) {
            const qty = await db.get(`inventory_${userId}.${selectedBait}`) || 0;
            if (qty > 0) {
              // Exemplificando efeito de isca dupla/tripla
              if (selectedBait === 'isca_dupla') {
                // 2 peixes
                for (let i = 0; i < 2; i++) {
                  const extraFish = fishTypes[Math.floor(Math.random() * fishTypes.length)];
                  await db.add(`wallet_${userId}`, extraFish.value);
                  rewards.push(`${emotes[extraFish.key]} **${extraFish.name} (extra)** ${emotes.moeda}${extraFish.value}`);
                }
              } else if (selectedBait === 'isca_tripla') {
                // 3 peixes
                for (let i = 0; i < 3; i++) {
                  const extraFish = fishTypes[Math.floor(Math.random() * fishTypes.length)];
                  await db.add(`wallet_${userId}`, extraFish.value);
                  rewards.push(`${emotes[extraFish.key]} **${extraFish.name} (extra)** ${emotes.moeda}${extraFish.value}`);
                }
              } else if (selectedBait === 'isca_magnetica') {
                if (Math.random() < 0.5) {
                  extras.push(`${emotes.isca_magnetica} Sua Isca Magnética brilhou...`);
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
                    rewards.push(`🎁 **${chest.name}** ${emotes.moeda}${chest.value}`);
                  } else {
                    extras.push('🔍 Era só uma tralha qualquer.');
                  }
                }
                if (Math.random() < 0.3) {
                  await db.add(`inventory_${userId}.isca_magnetica`, -1);
                  losses.push('💔 Sua **Isca Magnética** quebrou!');
                }
              }
              // remove durability da isca comum/epecial etc
              await db.add(`inventory_${userId}.${selectedBait}`, -1);
            }
          }

          // Monta embed de resultado
          const lines = [];
          lines.push(rewards.join('\n'));
          if (extras.length) lines.push(extras.join('\n'));
          if (losses.length) lines.push(losses.join('\n'));

          const resultEmbed = new EmbedBuilder()
            .setTitle('🎣 Resultado da Pesca')
            .setDescription(lines.join('\n----------------------------------------------------------\n'))
            .setFooter({ text: `${emotes.varadepesca} **${selectedBait ? selectedBait.replace('isca_', '').toUpperCase() + ' ATIVA**' : 'Nenhuma Isca**'}` });

          await fishMsg.edit({ embeds: [resultEmbed], components: [] });
        });

        catchCollector.on('end', async (_, reason) => {
          if (!caught && reason === 'time') {
            const escapeEmbed = new EmbedBuilder()
              .setTitle('🚨 O Peixe Fugiu!')
              .setDescription('O peixe escapou enquanto você hesitava!')
              .setFooter({ text: `${emotes.varadepesca} **${selectedBait ? selectedBait.replace('isca_', '').toUpperCase() + ' ATIVA**' : 'Nenhuma Isca**'}` })
              .setColor('#FF4500');
            await fishMsg.edit({ embeds: [escapeEmbed], components: [] });
          }
        });
      }, enableDelay);
    });
  }
};
