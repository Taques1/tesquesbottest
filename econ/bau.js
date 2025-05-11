const { EmbedBuilder } = require('discord.js'); // Atualizado para EmbedBuilder
const { QuickDB } = require('quick.db');
const emotes = require('../emotes.json');

const db = new QuickDB(); // Instanciando QuickDB

// Lista de itens com as porcentagens de cada raridade e itens adicionais
const items = [
  {
    name: 'Comum',
    description: 'Um item comum',
    price: 100,
    rarity: 'comum',
    percentage: 50,
    color: '#808080',
    additionalItems: [
      { name: 'Ficha', percentage: 10 },
      { name: 'Chave de Ouro', percentage: 1 },
      { name: 'Raspadinha', percentage: 25 }
    ]
  },
  {
    name: 'Incomum',
    description: 'Um item incomum',
    price: 250,
    rarity: 'incomum',
    percentage: 30,
    color: '#00FF00',
    additionalItems: [
      { name: 'Ficha', percentage: 15 },
      { name: 'Chave de Ouro', percentage: 5 },
      { name: 'Raspadinha', percentage: 20 }
    ]
  },
  {
    name: 'Raro',
    description: 'Um item raro',
    price: 500,
    rarity: 'raro',
    percentage: 15,
    color: '#0000FF',
    additionalItems: [
      { name: 'Ficha', percentage: 20 },
      { name: 'Chave de Ouro', percentage: 10 },
      { name: 'Raspadinha', percentage: 15 }
    ]
  },
  {
    name: 'Épico',
    description: 'Um item épico',
    price: 1000,
    rarity: 'epico',
    percentage: 4,
    color: '#800080',
    additionalItems: [
      { name: 'Ficha', percentage: 30 },
      { name: 'Chave de Ouro', percentage: 15 },
      { name: 'Raspadinha', percentage: 20 }
    ]
  },
  {
    name: 'Lendário',
    description: 'Um cargo lendário',
    price: 10000,
    rarity: 'lendario',
    roleID: '973313948390666342',
    percentage: 1,
    color: '#FFA500',
    additionalItems: [
      { name: 'Ficha', percentage: 50 },
      { name: 'Chave de Ouro', percentage: 20 },
      { name: 'Raspadinha', percentage: 25 }
    ]
  }
];

// Soma das porcentagens para o cálculo da raridade dos itens principais
const totalItemPercentage = items.reduce((acc, item) => acc + item.percentage, 0);

module.exports = {
  name: 'bau',
  description: 'Abre um baú e dá um item aleatório ao usuário',
  execute: async (client, message, args) => {
    const userId = message.author.id;
    const inventory = await db.get(`inventory_${userId}`);

    if (!inventory || inventory['chave'] <= 0) {
      return message.reply('Você não tem uma chave para abrir o baú.');
    }

    let quantidade = 1;

    // Se o argumento 'all' for fornecido, abra todos os baús disponíveis
    if (args[0] && args[0].toLowerCase() === 'all') {
      quantidade = inventory['chave'];
    }

    // Remove a chave do inventário do usuário com base na quantidade
    await db.add(`inventory_${userId}.chave`, -quantidade);

    for (let i = 0; i < quantidade; i++) {
      // Seleciona um item aleatório do baú com base em sua raridade
      const randomItem = Math.floor(Math.random() * totalItemPercentage);
      let currentItemPercentage = 0;
      let itemSelecionado;

      for (const item of items) {
        currentItemPercentage += item.percentage;
        if (randomItem < currentItemPercentage) {
          itemSelecionado = item;
          break;
        }
      }

      // Adiciona as moedas ao usuário
      await db.add(`wallet_${userId}`, itemSelecionado.price);

      // Cria o embed para a mensagem
      const embed = new EmbedBuilder()
        .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
        .setTitle(`**Baú ${itemSelecionado.name}**`)
        .setColor(itemSelecionado.color);

      // Formata a descrição do embed com o valor do baú
      let description = `Parabéns!\nVocê abriu o baú e encontrou: **${emotes.moeda}${itemSelecionado.price}**`;

      // Adiciona a possibilidade de ganhar itens adicionais
      let additionalItemsFound = [];

      // Verifica a chance de cada item adicional
      for (const additionalItem of itemSelecionado.additionalItems) {
        // Gera um número aleatório para determinar se o item adicional é recebido
        const randomChance = Math.random() * 100; // Número aleatório de 0 a 100
        if (randomChance < additionalItem.percentage) {
          await db.add(`inventory_${userId}.${additionalItem.name.toLowerCase()}`, 1);
          additionalItemsFound.push(additionalItem.name);
        }
      }

      // Atualiza a descrição do embed para incluir itens adicionais, se houver
      if (additionalItemsFound.length > 0) {
        description += `\nVocê também recebeu: **${additionalItemsFound.join(', ')}**!`;
      }

      // Adiciona a conquista `legendary_chest` se o item selecionado for Lendário e o usuário ainda não a tiver
      if (itemSelecionado.rarity === 'lendario') {
        const achievements = await db.get(`achievements_${userId}`) || {};
        if (!achievements['legendary_chest']) {
          // Atualiza a conquista do usuário
          await db.set(`achievements_${userId}.legendary_chest`, true);
          // Atualiza a descrição do embed para incluir a nova conquista
          description += `\n\nParabéns! Você desbloqueou a conquista **Legendary Chest**!`;
        }
      }

      embed.setDescription(description);

      const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// Cria o botão "Abrir Outro"
const row = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId(`abrirOutro_${message.author.id}`)
    .setLabel('Abrir Outro')
    .setStyle(ButtonStyle.Primary)
);

// Envia o embed com o botão
const msg = await message.channel.send({ embeds: [embed], components: [row] });

// Cria o coletor de interações
const filter = (interaction) =>
  interaction.customId === `abrirOutro_${message.author.id}` &&
  interaction.user.id === message.author.id;

const collector = msg.createMessageComponentCollector({ filter, time: 60000, max: 1 });

collector.on('collect', async (interaction) => {
  const inventoryAtual = await db.get(`inventory_${userId}`);
  if (!inventoryAtual || inventoryAtual['chave'] <= 0) {
    return interaction.reply({ content: 'Você não tem mais chaves!', ephemeral: true });
  }

  // Gasta mais uma chave
  await db.add(`inventory_${userId}.chave`, -1);

  // Repete o sorteio do item (mesma lógica do começo do for)
  const randomItem = Math.floor(Math.random() * totalItemPercentage);
  let currentItemPercentage = 0;
  let itemSelecionado;

  for (const item of items) {
    currentItemPercentage += item.percentage;
    if (randomItem < currentItemPercentage) {
      itemSelecionado = item;
      break;
    }
  }

  await db.add(`wallet_${userId}`, itemSelecionado.price);

  const novoEmbed = new EmbedBuilder()
    .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
    .setTitle(`**Baú ${itemSelecionado.name}**`)
    .setColor(itemSelecionado.color);

  let description = `Parabéns!\nVocê abriu o baú e encontrou: **${emotes.moeda}${itemSelecionado.price}**`;

  let additionalItemsFound = [];
  for (const additionalItem of itemSelecionado.additionalItems) {
    const randomChance = Math.random() * 100;
    if (randomChance < additionalItem.percentage) {
      await db.add(`inventory_${userId}.${additionalItem.name.toLowerCase()}`, 1);
      additionalItemsFound.push(additionalItem.name);
    }
  }

  if (additionalItemsFound.length > 0) {
    description += `\nVocê também recebeu: **${additionalItemsFound.join(', ')}**!`;
  }

  if (itemSelecionado.rarity === 'lendario') {
    const achievements = await db.get(`achievements_${userId}`) || {};
    if (!achievements['legendary_chest']) {
      await db.set(`achievements_${userId}.legendary_chest`, true);
      description += `\n\nParabéns! Você desbloqueou a conquista **Legendary Chest**!`;
    }
  }

  novoEmbed.setDescription(description);

  await interaction.reply({ embeds: [novoEmbed], components: [row] });
});

    }
  }
};
