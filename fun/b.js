const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas } = require('canvas');

module.exports = {
  name: 'geometric-password',
  description: 'Resolva o enigma das figuras geométricas!',

  execute: async (client, message, args) => {
    const userId = message.author.id;

    function generateShapes() {
      const shapes = [];
      for (let i = 0; i < 4; i++) {
        shapes.push(Math.floor(Math.random() * 7) + 3); // Gera números de 3 a 9
      }
      return shapes;
    }

    function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    }

    function applyColorRules(value, color) {
      switch (color) {
        case 'green':
          return value + 1;
        case 'red':
          return value - 1;
        case 'blue':
          return value * 2;
        case 'yellow':
          return Math.floor(value / 2);
        default:
          return value;
      }
    }

    function drawShapes(shapes, colors) {
      const canvas = createCanvas(400, 100);
      const ctx = canvas.getContext('2d');

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const colorMap = { red: '#FF5733', green: '#33FF57', blue: '#3357FF', yellow: '#F1C40F' };
      let x = 50;

      shapes.forEach((vertices, index) => {
        const color = colors[index];
        ctx.beginPath();
        const radius = 30;
        const angleStep = (2 * Math.PI) / vertices;
        for (let i = 0; i < vertices; i++) {
          const angle = i * angleStep;
          const px = x + radius * Math.cos(angle);
          const py = 50 + radius * Math.sin(angle);
          if (i === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.closePath();
        ctx.fillStyle = colorMap[color];
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.stroke();

        x += 100;
      });

      return canvas.toBuffer();
    }

    const shapes = generateShapes();
    const colors = ['red', 'green', 'blue', 'yellow'];
    shuffleArray(colors);

    const password = shapes
      .map((shape, index) => applyColorRules(shape, colors[index]))
      .flatMap((value) => value.toString().split('').map(Number)); // Divide números com dois dígitos

    const imageBuffer = drawShapes(shapes, colors);

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
      new ButtonBuilder().setCustomId('0').setLabel('0').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('confirm').setLabel('✅').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('clear').setLabel('❌').setStyle(ButtonStyle.Danger)
    );

    const embed = new EmbedBuilder()
      .setTitle('🔒 Enigma das Figuras Geométricas')
      .setDescription('Digite a senha!')
      .setColor('#333333')
      .addFields({ name: 'Senha Atual:', value: '``` ```' })
      .setFooter({ text: 'Boa sorte!' });

    const attachment = new AttachmentBuilder(imageBuffer, { name: 'shapes.png' });

    const msg = await message.channel.send({
      embeds: [embed],
      files: [attachment],
      components: [row1, row2, row3, row4]
    });

    let currentPassword = [];

    const filter = (interaction) => interaction.user.id === userId;
    const collector = msg.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async (interaction) => {
      const buttonId = interaction.customId;

      if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(buttonId)) {
        if (currentPassword.length < 9) {
          currentPassword.push(buttonId);
        }
      }

      if (buttonId === 'clear') {
        currentPassword = [];
      }

      if (buttonId === 'confirm') {
        const isPasswordCorrect = JSON.stringify(currentPassword.map(Number)) === JSON.stringify(password);

        const resultEmbed = new EmbedBuilder()
          .setTitle('🔒 Enigma das Figuras Geométricas')
          .setDescription(isPasswordCorrect ? 'Senha correta! 🎉' : 'Senha errada! ❌')
          .setColor(isPasswordCorrect ? '#4CAF50' : '#FF0000');

        await interaction.update({
          embeds: [resultEmbed],
          components: []
        });

        collector.stop();
        return;
      }

      const currentPasswordStr = currentPassword.length > 0 ? `\`\`\`${currentPassword.join(' ')}\`\`\`` : '``` ```';

      const updatedEmbed = new EmbedBuilder()
        .setTitle('🔒 Enigma das Figuras Geométricas')
        .setDescription('Digite a senha!')
        .setColor('#333333')
        .addFields({ name: 'Senha Atual:', value: currentPasswordStr })
        .setFooter({ text: 'Boa sorte!' });

      await interaction.update({ embeds: [updatedEmbed], components: [row1, row2, row3, row4] });
    });

    collector.on('end', async (collected, reason) => {
      if (reason === 'time') {
        await msg.edit({ content: 'O tempo acabou! Tente novamente.', components: [] });
      }
    });
  }
};
