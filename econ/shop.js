const { Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const emotes = require('../emotes.json');

// Lista de itens
const items = [
  {
    name: `${emotes.chave} chave`,
    description: 'Uma chave usada para abrir !baús',
    price: 100,
  },
  {
    name: `${emotes.ficha} ficha`,
    description: 'Uma ficha usada para apostas',
    price: 500,
  },
  {
    name: `${emotes.galo} galo`,
    description: 'Um galo de batalha',
    price: 500,
  },
  {
    name: `${emotes.raspadinha} raspadinha`,
    description: 'Um ticket de !raspadinha',
    price: 500,
  },
  {
    name: `${emotes.vara} vara de pesca`,
        description: 'Uma vara para !pescar',
        price: 500,
    },
    {
       name: `${emotes.isca} isca magnetica`,
        description: 'Isca magnética para atrair tesouros',
        price: 500,
    },
];

// Lista de cargos
const roles = [
  {
    name: '<@&810949799671103568>',
    description: 'Ganha 1500 por dia',
    price: 15000,
  },
  {
    name: '<@&970783056485023744>',
    description: 'Ganha 2000 por dia',
    price: 25000,
  },
  {
    name: '<@&810949798902759495>',
    description: 'Ganha 2500 por dia',
    price: 25000,
  },
  {
    name: '<@&810949795454910544>',
    description: 'Ganha 5000 por dia',
    price: 50000,
  },
  {
    name: '<@&810949794293219339>',
    description: 'Ganha 10000 por dia',
    price: 100000,
  },
  {
    name: '<@&810949765058920459>',
    description: 'Ganha 50000 por dia e pode personalizar o cargo',
    price: 500000,
  },
];

module.exports.execute = async (client, message, args) => {
  const serverName = message.guild.name;
  const iconURL = message.guild.iconURL();

  const embedItems = new EmbedBuilder()
    .setAuthor({ name: `${serverName} Store`, iconURL: iconURL })
    .setColor('Blue')
    .setDescription(
      'Compre um item com `!buy <nome> [quantidade]`.\n\n' +
      items.map(item => `**${item.name}** - ${emotes.moeda}${item.price}\n${item.description}`).join('\n\n')
    );

  const embedRoles = new EmbedBuilder()
    .setAuthor({ name: `${serverName} Store`, iconURL: iconURL })
    .setColor('Blue')
    .setDescription(
      'Compre um cargo com `!buy <nome>`.\n\n' +
      roles.map(role => `**${role.name}** - ${emotes.moeda}${role.price}\n${role.description}`).join('\n\n')
    );

  const pages = [embedItems, embedRoles];
  let page = 0;

  const buttonRow = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('previous')
        .setLabel('⬅️')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('next')
        .setLabel('➡️')
        .setStyle(ButtonStyle.Primary),
    );

  const messageAction = await message.channel.send({ embeds: [pages[page]], components: [buttonRow] });

  const filter = interaction => ['previous', 'next'].includes(interaction.customId) && interaction.user.id === message.author.id;
  const collector = messageAction.createMessageComponentCollector({ filter, time: 60000 });

  collector.on('collect', async interaction => {
    if (interaction.customId === 'previous') {
      page = page > 0 ? page - 1 : pages.length - 1;
    } else if (interaction.customId === 'next') {
      page = page + 1 < pages.length ? page + 1 : 0;
    }

    await interaction.update({ embeds: [pages[page]] });
  });

  // O coletor terminará, mas os botões permanecerão
  collector.on('end', async collected => {
    console.log(`Collected ${collected.size} interactions.`);
  });
};

module.exports.help = {
  name: 'shop',
};
