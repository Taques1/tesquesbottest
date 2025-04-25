const { StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const emotes = require('../emotes.json');

module.exports = {
  name: 'caça_ao_tesouro',
  description: 'Explore diferentes locais em busca de tesouros e aventuras!',

  async execute(client, message) {
    const userId = message.author.id;
    const userStreak = await db.get(`streak_${userId}`) || 0;
    const isAdmin = message.member.permissions.has(PermissionsBitField.Flags.Administrator);

    if (!isAdmin) {
      const lastHunt = await db.get(`lastHunt_${userId}`);
      const currentDate = new Date().toLocaleDateString();

      if (lastHunt === currentDate) {
        return message.reply(`Você já fez sua caça ao tesouro hoje! Volte em 24 horas para mais aventuras.`);
      }
    }

    function gerarOpcoesAleatorias() {
      const locais = [
        { label: 'Floresta Sombria', value: 'floresta', description: 'Misteriosa e mágica.', rarity: 'comum' },
        { label: 'Caverna Abandonada', value: 'caverna', description: 'Cheia de tesouros... e perigos.', rarity: 'rara' },
        { label: 'Praia Esquecida', value: 'praia', description: 'O que as ondas trouxeram hoje?', rarity: 'comum' },
        { label: 'Montanha Gelada', value: 'montanha', description: 'Somente os mais bravos sobem.', rarity: 'épica' },
        { label: 'Ruínas Antigas', value: 'ruinas', description: 'Vestígios de uma civilização perdida.', rarity: 'rara' },
        { label: 'Pântano Sinistro', value: 'pantano', description: 'Cheio de criaturas misteriosas.', rarity: 'comum' },
        { label: 'Deserto Escaldante', value: 'deserto', description: 'Calor intenso e segredos escondidos.', rarity: 'rara' },
        { label: 'Templo Esquecido', value: 'templo', description: 'Antigos mistérios e armadilhas.', rarity: 'épica' },
        { label: 'Ilha Mística', value: 'ilha', description: 'Isolada e cheia de surpresas.', rarity: 'épica' }
      ];

      return locais.sort(() => Math.random() - 0.5).slice(0, 3);
    }

    const opcoesAleatorias = gerarOpcoesAleatorias();

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('treasure_hunt')
      .setPlaceholder('Escolha um local para explorar...')
      .addOptions(opcoesAleatorias.map((local) => ({
        label: local.label,
        value: local.value,
        description: `${local.description} (Raridade: ${local.rarity})`,
        emoji: local.rarity === 'épica' ? '✨' : local.rarity === 'rara' ? '🔥' : '🌿'
      })))
      .setMaxValues(1);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🗺️ Caça ao Tesouro!')
      .setDescription('Escolha um local para explorar... A jornada está prestes a começar!')
      .setFooter({ text: 'Você tem 20 segundos para escolher!' })
      .setTimestamp();

    const menuMessage = await message.channel.send({
      embeds: [embed],
      components: [row],
    });

    await db.set(`currentHunt_${userId}`, true);

    const filter = (i) => i.customId === 'treasure_hunt' && i.user.id === userId;
    const collector = menuMessage.createMessageComponentCollector({ filter, time: 20000 });

    let hasSelected = false;

    collector.on('collect', async (interaction) => {
      if (hasSelected) {
        return interaction.reply({ content: 'Você já fez sua escolha!', ephemeral: true });
      }

      hasSelected = true;

      const selectedOption = interaction.values[0];
      const currentDate = new Date().toLocaleDateString();

      if (!isAdmin) {
        await db.set(`lastHunt_${userId}`, currentDate);
        await db.add(`streak_${userId}`, 1);
      }

      let resultMessage = '';
      let amount = 0;
      const rand = Math.random();

      await interaction.reply({ content: '⏳ Explorando o local escolhido...', ephemeral: true });
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const gerarResultadoLocal = async (local) => {
        const inventory = await db.get(`inventory_${userId}`);
        const maxItems = await db.get(`max_items_${userId}`) || 10;
        const validItemsCount = Object.entries(inventory || {}).filter(([name, amount]) => amount > 0).length;
        const availableSlots = maxItems - validItemsCount;

        switch (local) {
          case 'floresta':
            if (rand < 0.5) {
              amount = Math.floor(Math.random() * 100) + 50;
              await db.add(`wallet_${userId}`, amount);
              return new EmbedBuilder()
                .setColor('#228B22')
                .setTitle('🌲 Floresta Sombria')
                .setDescription(`Você encontrou **${amount} moedas** escondidas na Floresta Sombria!`)
                .setFooter({ text: 'Boa sorte na próxima aventura!' })
                .setTimestamp();
            } else if (rand < 0.7) {
              const item = 'Poção Mágica';
              if (availableSlots > 0) {
                await db.add(`inventory_${userId}.potion`, 1);
                return new EmbedBuilder()
                  .setColor('#228B22')
                  .setTitle('🌲 Floresta Sombria')
                  .setDescription(`Você encontrou uma **${item}** misteriosa!`)
                  .setFooter({ text: 'Boa sorte na próxima aventura!' })
                  .setTimestamp();
              } else {
                return new EmbedBuilder()
                  .setColor('#FF0000')
                  .setTitle('🌲 Floresta Sombria')
                  .setDescription(`🛑 Seu inventário está cheio!`)
                  .setFooter({ text: 'Tente novamente mais tarde.' })
                  .setTimestamp();
              }
            } else {
              return new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🌲 Floresta Sombria')
                .setDescription(`🦊 Uma raposa mágica roubou seu tesouro e fugiu!`)
                .setFooter({ text: 'Melhor sorte na próxima vez!' })
                .setTimestamp();
            }
          case 'caverna':
            if (rand < 0.4) {
              amount = Math.floor(Math.random() * 200) + 100;
              await db.add(`wallet_${userId}`, amount);
              return new EmbedBuilder()
                .setColor('#A9A9A9')
                .setTitle('🗿 Caverna Abandonada')
                .setDescription(`Você encontrou **${amount} moedas** nas profundezas da Caverna Abandonada!`)
                .setFooter({ text: 'Boa sorte na próxima aventura!' })
                .setTimestamp();
            } else if (rand < 0.7) {
              amount = Math.floor(Math.random() * 50) + 20;
              await db.sub(`wallet_${userId}`, amount);
              return new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🗿 Caverna Abandonada')
                .setDescription(`💀 Você caiu numa armadilha e perdeu **${amount} moedas**!`)
                .setFooter({ text: 'Melhor sorte na próxima vez!' })
                .setTimestamp();
            } else if (rand < 0.9) {
              const item = 'Cristal Raro';
              if (availableSlots > 0) {
                await db.add(`inventory_${userId}.crystal`, 1);
                return new EmbedBuilder()
                  .setColor('#A9A9A9')
                  .setTitle('🗿 Caverna Abandonada')
                  .setDescription(`Você encontrou um **${item}** brilhante!`)
                  .setFooter({ text: 'Boa sorte na próxima aventura!' })
                  .setTimestamp();
              } else {
                return new EmbedBuilder()
                  .setColor('#FF0000')
                  .setTitle('🗿 Caverna Abandonada')
                  .setDescription(`🛑 Seu inventário está cheio!`)
                  .setFooter({ text: 'Tente novamente mais tarde.' })
                  .setTimestamp();
              }
            } else {
              return new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🗿 Caverna Abandonada')
                .setDescription(`🦈 Você encontrou um monstro na caverna e perdeu tudo!`)
                .setFooter({ text: 'Melhor sorte na próxima vez!' })
                .setTimestamp();
            }
          case 'praia':
            if (rand < 0.6) {
              amount = Math.floor(Math.random() * 150) + 50;
              await db.add(`wallet_${userId}`, amount);
              return new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('🏖️ Praia Esquecida')
                .setDescription(`Você encontrou **${amount} moedas** escondidas na Praia Esquecida!`)
                .setFooter({ text: 'Boa sorte na próxima aventura!' })
                .setTimestamp();
            } else if (rand < 0.8) {
              const item = 'Concha Rara';
              if (availableSlots > 0) {
                await db.add(`inventory_${userId}.shell`, 1);
                return new EmbedBuilder()
                  .setColor('#FFD700')
                  .setTitle('🏖️ Praia Esquecida')
                  .setDescription(`Você encontrou uma **${item}** especial!`)
                  .setFooter({ text: 'Boa sorte na próxima aventura!' })
                  .setTimestamp();
              } else {
                return new EmbedBuilder()
                  .setColor('#FF0000')
                  .setTitle('🏖️ Praia Esquecida')
                  .setDescription(`🛑 Seu inventário está cheio!`)
                  .setFooter({ text: 'Tente novamente mais tarde.' })
                  .setTimestamp();
              }
            } else {
              return new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🏖️ Praia Esquecida')
                .setDescription(`🌊 Uma onda levou seu tesouro!`)
                .setFooter({ text: 'Melhor sorte na próxima vez!' })
                .setTimestamp();
            }
          case 'montanha':
            if (rand < 0.3) {
              amount = Math.floor(Math.random() * 300) + 200;
              await db.add(`wallet_${userId}`, amount);
              return new EmbedBuilder()
                .setColor('#A9A9A9')
                .setTitle('🏔️ Montanha Gelada')
                .setDescription(`Você encontrou **${amount} moedas** nas alturas da Montanha Gelada!`)
                .setFooter({ text: 'Boa sorte na próxima aventura!' })
                .setTimestamp();
            } else if (rand < 0.6) {
              const item = 'Pedra de Gelo';
              if (availableSlots > 0) {
                await db.add(`inventory_${userId}.ice`, 1);
                return new EmbedBuilder()
                  .setColor('#A9A9A9')
                  .setTitle('🏔️ Montanha Gelada')
                  .setDescription(`Você encontrou uma **${item}** rara!`)
                  .setFooter({ text: 'Boa sorte na próxima aventura!' })
                  .setTimestamp();
              } else {
                return new EmbedBuilder()
                  .setColor('#FF0000')
                  .setTitle('🏔️ Montanha Gelada')
                  .setDescription(`🛑 Seu inventário está cheio!`)
                  .setFooter({ text: 'Tente novamente mais tarde.' })
                  .setTimestamp();
              }
            } else {
              return new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🏔️ Montanha Gelada')
                .setDescription(`🦄 Um yeti tomou seu tesouro!`)
                .setFooter({ text: 'Melhor sorte na próxima vez!' })
                .setTimestamp();
            }
          case 'ruinas':
            if (rand < 0.4) {
              amount = Math.floor(Math.random() * 200) + 100;
              await db.add(`wallet_${userId}`, amount);
              return new EmbedBuilder()
                .setColor('#B22222')
                .setTitle('🏛️ Ruínas Antigas')
                .setDescription(`Você encontrou **${amount} moedas** nas Ruínas Antigas!`)
                .setFooter({ text: 'Boa sorte na próxima aventura!' })
                .setTimestamp();
            } else if (rand < 0.7) {
              const item = 'Artefato Antigo';
              if (availableSlots > 0) {
                await db.add(`inventory_${userId}.artifact`, 1);
                return new EmbedBuilder()
                  .setColor('#B22222')
                  .setTitle('🏛️ Ruínas Antigas')
                  .setDescription(`Você encontrou um **${item}** misterioso!`)
                  .setFooter({ text: 'Boa sorte na próxima aventura!' })
                  .setTimestamp();
              } else {
                return new EmbedBuilder()
                  .setColor('#FF0000')
                  .setTitle('🏛️ Ruínas Antigas')
                  .setDescription(`🛑 Seu inventário está cheio!`)
                  .setFooter({ text: 'Tente novamente mais tarde.' })
                  .setTimestamp();
              }
            } else {
              return new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🏛️ Ruínas Antigas')
                .setDescription(`👻 Espíritos levaram seu tesouro!`)
                .setFooter({ text: 'Melhor sorte na próxima vez!' })
                .setTimestamp();
            }
          case 'pantano':
            if (rand < 0.5) {
              amount = Math.floor(Math.random() * 100) + 50;
              await db.add(`wallet_${userId}`, amount);
              return new EmbedBuilder()
                .setColor('#228B22')
                .setTitle('🌿 Pântano Sinistro')
                .setDescription(`Você encontrou **${amount} moedas** no Pântano Sinistro!`)
                .setFooter({ text: 'Boa sorte na próxima aventura!' })
                .setTimestamp();
            } else if (rand < 0.7) {
              const item = 'Planta Medicinal';
              if (availableSlots > 0) {
                await db.add(`inventory_${userId}.plant`, 1);
                return new EmbedBuilder()
                  .setColor('#228B22')
                  .setTitle('🌿 Pântano Sinistro')
                  .setDescription(`Você encontrou uma **${item}** útil!`)
                  .setFooter({ text: 'Boa sorte na próxima aventura!' })
                  .setTimestamp();
              } else {
                return new EmbedBuilder()
                  .setColor('#FF0000')
                  .setTitle('🌿 Pântano Sinistro')
                  .setDescription(`🛑 Seu inventário está cheio!`)
                  .setFooter({ text: 'Tente novamente mais tarde.' })
                  .setTimestamp();
              }
            } else {
              return new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🌿 Pântano Sinistro')
                .setDescription(`🐍 Uma cobra roubou seu tesouro!`)
                .setFooter({ text: 'Melhor sorte na próxima vez!' })
                .setTimestamp();
            }
          case 'deserto':
            if (rand < 0.4) {
              amount = Math.floor(Math.random() * 150) + 50;
              await db.add(`wallet_${userId}`, amount);
              return new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('🏜️ Deserto Escaldante')
                .setDescription(`Você encontrou **${amount} moedas** no Deserto Escaldante!`)
                .setFooter({ text: 'Boa sorte na próxima aventura!' })
                .setTimestamp();
            } else if (rand < 0.7) {
              const item = 'Oásis Encantado';
              if (availableSlots > 0) {
                await db.add(`inventory_${userId}.oasis`, 1);
                return new EmbedBuilder()
                  .setColor('#FFD700')
                  .setTitle('🏜️ Deserto Escaldante')
                  .setDescription(`Você encontrou um **${item}** raro!`)
                  .setFooter({ text: 'Boa sorte na próxima aventura!' })
                  .setTimestamp();
              } else {
                return new EmbedBuilder()
                  .setColor('#FF0000')
                  .setTitle('🏜️ Deserto Escaldante')
                  .setDescription(`🛑 Seu inventário está cheio!`)
                  .setFooter({ text: 'Tente novamente mais tarde.' })
                  .setTimestamp();
              }
            } else {
              return new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🏜️ Deserto Escaldante')
                .setDescription(`🌪️ Uma tempestade de areia levou seu tesouro!`)
                .setFooter({ text: 'Melhor sorte na próxima vez!' })
                .setTimestamp();
            }
          case 'templo':
            if (rand < 0.3) {
              amount = Math.floor(Math.random() * 500) + 200;
              await db.add(`wallet_${userId}`, amount);
              return new EmbedBuilder()
                .setColor('#8B4513')
                .setTitle('🏛️ Templo Esquecido')
                .setDescription(`Você encontrou **${amount} moedas** no Templo Esquecido!`)
                .setFooter({ text: 'Boa sorte na próxima aventura!' })
                .setTimestamp();
            } else if (rand < 0.6) {
              const item = 'Relíquia Antiga';
              if (availableSlots > 0) {
                await db.add(`inventory_${userId}.relic`, 1);
                return new EmbedBuilder()
                  .setColor('#8B4513')
                  .setTitle('🏛️ Templo Esquecido')
                  .setDescription(`Você encontrou uma **${item}** misteriosa!`)
                  .setFooter({ text: 'Boa sorte na próxima aventura!' })
                  .setTimestamp();
              } else {
                return new EmbedBuilder()
                  .setColor('#FF0000')
                  .setTitle('🏛️ Templo Esquecido')
                  .setDescription(`🛑 Seu inventário está cheio!`)
                  .setFooter({ text: 'Tente novamente mais tarde.' })
                  .setTimestamp();
              }
            } else {
              return new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🏛️ Templo Esquecido')
                .setDescription(`👹 Guardião do templo tomou seu tesouro!`)
                .setFooter({ text: 'Melhor sorte na próxima vez!' })
                .setTimestamp();
            }
          default:
            return new EmbedBuilder()
              .setColor('#FF0000')
              .setTitle('🚫 Local Desconhecido')
              .setDescription(`❓ O local escolhido não é válido.`)
              .setFooter({ text: 'Escolha um local válido!' })
              .setTimestamp();
        }
      } catch (error) {
        console.error('Erro ao processar o comando:', error);
        return new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('⚠️ Erro!')
          .setDescription('Houve um erro ao processar o comando.')
          .setFooter({ text: 'Tente novamente mais tarde.' })
          .setTimestamp();
      }
    } else {
      return new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('⚠️ Erro de Permissão')
        .setDescription('Você não tem permissão para usar este comando.')
        .setFooter({ text: 'Entre em contato com um administrador se precisar de ajuda.' })
        .setTimestamp();
    }
  }
};
