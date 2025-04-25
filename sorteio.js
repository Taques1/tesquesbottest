const { ButtonBuilder, ActionRowBuilder, EmbedBuilder, AttachmentBuilder, ButtonStyle } = require('discord.js');
const Canvas = require('canvas');
const sharp = require('sharp');
const fetch = require('node-fetch');
const ms = require('ms');
const moment = require('moment-timezone'); // Importa moment-timezone para manipular fusos horários

module.exports = {
  name: 'sorteio',
  description: 'Inicia um sorteio com uma duração especificada e um prêmio.',

  async execute(client, message, args) {
    if (args.length < 2) {
      return message.channel.send('Uso correto: !sorteio <prêmio> <duração>. Exemplo: !sorteio Felicidade Eterna 10s');
    }

    // Extrai o prêmio e a duração
    const duration = args.pop(); // Remove o último item como duração
    const prize = args.join(' '); // Junta o restante como prêmio
    const giveawayDuration = ms(duration);

    if (isNaN(giveawayDuration)) {
      return message.channel.send('Duração inválida. Por favor, especifique um tempo válido.');
    }

    // Cria os botões
    const participateButton = new ButtonBuilder()
      .setCustomId('participate')
      .setLabel('Participar')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(participateButton);

    // Calcula o tempo de término do sorteio
    const endTime = Date.now() + giveawayDuration;
    const endDate = moment(endTime).tz('America/Sao_Paulo'); // Define o fuso horário para São Paulo
    const endDateString = `Hoje às ${endDate.format('HH:mm')}`;

    // Cria o embed para o sorteio
    const embed = new EmbedBuilder()
      .setColor('#7289DA')
      .setTitle('🎁 Sorteio!')
      .setDescription(`Uma pessoa sortuda irá ganhar **${prize}**! 🎉\n\nUse o botão abaixo para participar!`)
      .setFooter({ text: `Acabará em | ${endDateString}` })
      .setThumbnail('https://your-thumbnail-url.com/thumbnail.png') // Adicione uma URL de thumbnail, se desejar
      .setTimestamp();

    // Envia a mensagem do sorteio com o embed e o botão
    const giveawayMessage = await message.channel.send({
      embeds: [embed],
      components: [row]
    });

    // Cria um filtro para capturar interações de botão
    const filter = i => i.customId === 'participate' && !i.user.bot;
    const collector = giveawayMessage.createMessageComponentCollector({ filter, time: giveawayDuration });

    const participants = new Set();

    collector.on('collect', i => {
      if (Date.now() > endTime) {
        return i.reply({ content: 'O sorteio já terminou. Não é mais possível participar.', ephemeral: true });
      }
      participants.add(i.user);
      i.reply({ content: `Você participou do sorteio, ${i.user.username}! Boa sorte!`, ephemeral: true });
    });

    collector.on('end', async () => {
      if (participants.size < 1) {
        return message.channel.send('Nenhum participante encontrado. O sorteio foi cancelado.');
      }

      const winner = [...participants][Math.floor(Math.random() * participants.size)];

      try {
        // Pega o avatar do vencedor
        const avatarURL = winner.displayAvatarURL({ format: 'png', dynamic: true, size: 512 });
        const response = await fetch(avatarURL);

        if (!response.ok) {
          throw new Error('Não foi possível baixar a imagem do avatar.');
        }

        const buffer = await response.buffer();
        const pngBuffer = await sharp(buffer).toFormat('png').toBuffer();

        // Cria o canvas
        const canvas = Canvas.createCanvas(800, 400);
        const ctx = canvas.getContext('2d');

        // Define o fundo cinza
        ctx.fillStyle = '#808080'; // Cor cinza
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Desenha o avatar do vencedor no canvas
        const winnerAvatar = await Canvas.loadImage(pngBuffer);
        const avatarSize = 200;
        const avatarX = canvas.width / 2 - avatarSize / 2;
        const avatarY = 100;

        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(winnerAvatar, avatarX, avatarY, avatarSize, avatarSize);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 6;
        ctx.stroke();
        ctx.restore();

        // Texto do sorteio
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Vencedor do Sorteio!', canvas.width / 2, 70);

        ctx.fillStyle = '#ffffff';
        ctx.font = '30px Arial';
        ctx.fillText(`Parabéns, ${winner.username}!`, canvas.width / 2, 320);

        // Adiciona o prêmio
        ctx.fillStyle = '#ffffff';
        ctx.font = '30px Arial';
        ctx.fillText(`Prêmio: ${prize}`, canvas.width / 2, 380);

        const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'winner.png' });

        // Envia a mensagem do resultado do sorteio
        message.channel.send({ content: `🎉 O sorteio terminou! O vencedor é: ${winner}`, files: [attachment] });

      } catch (error) {
        console.error('Erro ao processar o avatar do vencedor:', error);
        return message.reply('Ocorreu um erro ao processar o avatar do vencedor.');
      }
    });
  }
};
