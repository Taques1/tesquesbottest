const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');

const db = new QuickDB();

module.exports = {
  name: 'caçar',
  description: 'Caça ao tesouro: explore e veja o que você encontra!',
  execute: async (client, message, args) => {
    const userId = message.author.id;

    // Verifica se o usuário tem uma pá para caçar
    const shovel = await db.get(`inventory_${userId}.pa`) || 0;

    if (shovel < 1) {
      return message.reply('Você precisa de uma pá para caçar tesouros. Compre uma na loja!');
    }

    // Configurações do jogo
    const treasures = [
      { name: 'Moedas de Bronze', value: 50, chance: 0.5 }, // 50% de chance
      { name: 'Baú Antigo', value: 300, chance: 0.3 }, // 30% de chance
      { name: 'Joia Perdida', value: 1000, chance: 0.15 }, // 15% de chance
      { name: 'Artefato Raro', value: 5000, chance: 0.05 } // 5% de chance
    ];

    // Mensagem inicial
    const startEmbed = new EmbedBuilder()
      .setTitle('🏞️ Caça ao Tesouro!')
      .setDescription('Explore o terreno e aperte o botão "Cavar" para ver o que você encontra!')
      .setColor('#FFD700');

    const digButton = new ButtonBuilder()
      .setCustomId('dig_treasure')
      .setLabel('Cavar')
      .setStyle(ButtonStyle.Success)
      .setDisabled(true); // Botão desativado inicialmente

    const row = new ActionRowBuilder().addComponents(digButton);

    const msg = await message.channel.send({ embeds: [startEmbed], components: [row] });

    // Função para determinar o resultado da caça
    const getTreasureResult = () => {
      const rand = Math.random();
      let cumulativeChance = 0;
      for (const treasure of treasures) {
        cumulativeChance += treasure.chance;
        if (rand <= cumulativeChance) {
          return treasure;
        }
      }
    };

    // Espera um tempo aleatório entre 2 a 4 segundos e ativa o botão
    const delay = Math.random() * 2000 + 2000; // Entre 2000 e 4000 ms

    setTimeout(async () => {
      digButton.setDisabled(false); // Ativa o botão
      await msg.edit({ components: [row] });

      // Coleta a interação do botão
      const filter = (interaction) => interaction.customId === 'dig_treasure' && interaction.user.id === userId;
      const collector = msg.createMessageComponentCollector({ filter, time: 3000 }); // Tempo máximo para clicar é 3 segundos

      let treasureFound = false;

      collector.on('collect', async (interaction) => {
        if (!interaction.isButton()) return;

        treasureFound = true;

        const treasure = getTreasureResult();
        let resultMessage;

        if (treasure) {
          // Adiciona o valor ao saldo do usuário
          await db.add(`wallet_${userId}`, treasure.value);

          // Remove uma pá do inventário
          await db.add(`inventory_${userId}.pa`, -1);

          resultMessage = `🎉 Você encontrou um **${treasure.name}** e ganhou ${treasure.value} moedas!`;

          // Verifica se o artefato raro foi encontrado e concede a conquista
          if (treasure.name === 'Artefato Raro') {
            const hasAchievement = await db.get(`achievements_${userId}.artefato_raro`);
            if (!hasAchievement) {
              await db.set(`achievements_${userId}.artefato_raro`, true);
              resultMessage += `\n🏆 Parabéns! Você ganhou a conquista **Artefato Raro Encontrado** pela primeira vez!`;
            }
          }
        } else {
          resultMessage = '❌ Você não encontrou nada desta vez. Continue explorando!';
        }

        // Atualiza o embed original
        const resultEmbed = new EmbedBuilder()
          .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
          .setColor('#FFD700')
          .setTitle('🏞️ Resultado da Caça ao Tesouro')
          .setDescription(resultMessage);

        // Atualiza a mensagem original
        await interaction.update({ embeds: [resultEmbed], components: [] });
      });

      collector.on('end', async (collected, reason) => {
        if (!treasureFound && reason === 'time') {
          // Se o tesouro escapou
          const escapeEmbed = new EmbedBuilder()
            .setTitle('🚨 Tesouro Perdido!')
            .setDescription('Você hesitou e o tesouro escapou. Seja mais rápido da próxima vez!')
            .setColor('#FF4500') // Vermelho para alerta
            .setFooter({ text: 'Fique atento na próxima vez!' });

          await msg.edit({ embeds: [escapeEmbed], components: [] });
        }
      });

    }, delay);
  },
};
