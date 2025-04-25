const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  name: 'senha',
  description: 'Clique nos botões para formar a senha!',

  execute: async (client, message, args) => {
    const userId = message.author.id;

    // Defina a ordem da senha (exemplo de ordem correta)
    const correctPassword = [4, 7, 9, 2];
    let currentPassword = [];

    // Criar os botões numerados de 1 a 9
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('1').setLabel('1').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('2').setLabel('2').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('3').setLabel('3').setStyle(ButtonStyle.Secondary)
    );
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('4').setLabel('4').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('5').setLabel('5').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('6').setLabel('6').setStyle(ButtonStyle.Secondary)
    );
    const row3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('7').setLabel('7').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('8').setLabel('8').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('9').setLabel('9').setStyle(ButtonStyle.Secondary)
    );
    const row4 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('confirm').setLabel('Confirmar').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('clear').setLabel('Apagar').setStyle(ButtonStyle.Danger)
    );

    const startEmbed = new EmbedBuilder()
      .setTitle('🔒 Sistema de Senha')
      .setDescription('Clique nos botões para formar a senha!')
      .setColor('#333333')
      .addFields({ name: 'Senha: ', value: '``` ```' })
      .setFooter({ text: 'Tente formar a senha corretamente!' })
      .setImage('https://i.imgur.com/ZT45iBR.jpeg'); // Adiciona a imagem ao embed

    const msg = await message.channel.send({
      embeds: [startEmbed],
      components: [row1, row2, row3, row4]
    });

    const filter = (interaction) => interaction.user.id === userId;
    const collector = msg.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async (interaction) => {
      const buttonId = interaction.customId;

      if (['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(buttonId)) {
        if (currentPassword.length < 9) {
          currentPassword.push(Number(buttonId));
        }
      }

      if (buttonId === 'clear') {
        currentPassword = [];
      }

      if (buttonId === 'confirm') {
        const isPasswordCorrect = JSON.stringify(currentPassword) === JSON.stringify(correctPassword);

        const resultEmbed = new EmbedBuilder()
          .setTitle('🔒 Sistema de Senha')
          .setDescription(isPasswordCorrect ? 'Senha Correta!' : 'Senha Errada!')
          .setColor(isPasswordCorrect ? '#4CAF50' : '#FF0000')
          .addFields({ name: 'Senha: ', value: `\`\`\`${currentPassword.join(' ')}\`\`\`` })
          .setFooter({ text: isPasswordCorrect ? 'Comando finalizado!' : 'Tente novamente.' })
          .setImage('https://i.imgur.com/ZT45iBR.jpeg'); // Adiciona a imagem ao embed

        await interaction.update({
          embeds: [resultEmbed],
          components: [] // Remove os botões após a confirmação
        });

        if (isPasswordCorrect) {
          collector.stop('senha-correta'); // Finaliza o coletor ao acertar a senha
        } else {
          currentPassword = [];
        }
        return;
      }

      const currentPasswordStr = currentPassword.length > 0 ? `\`\`\`${currentPassword.join(' ')}\`\`\`` : '``` ```';

      const updatedEmbed = new EmbedBuilder()
        .setTitle('🔒 Sistema de Senha')
        .setDescription('Clique nos botões para formar a senha!')
        .setColor('#333333')
        .addFields({ name: 'Senha: ', value: currentPasswordStr })
        .setFooter({ text: 'Tente formar a senha corretamente!' })
        .setImage('https://i.imgur.com/ZT45iBR.jpeg'); // Adiciona a imagem ao embed

      await interaction.update({ embeds: [updatedEmbed], components: [row1, row2, row3, row4] });
    });

    collector.on('end', async (collected, reason) => {
      if (reason === 'time') {
        await msg.edit({ content: 'O tempo acabou! Tente novamente.', components: [] });
      } else if (reason === 'senha-correta') {
        // Não há necessidade de feedback adicional; tudo já foi atualizado no `collect`.
      }
    });
  }
};
