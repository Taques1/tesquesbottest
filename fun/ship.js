const { AttachmentBuilder } = require('discord.js');
const Canvas = require('canvas');
const fetch = require('node-fetch');
const sharp = require('sharp');
const path = require('path');

// Desestrutura métodos do Canvas
const { registerFont, createCanvas, loadImage } = Canvas;

// Registra a fonte customizada antes de usar qualquer canvas
registerFont(path.resolve(__dirname, 'fonts', 'helsinki.ttf'), { family: 'Helsinki' });

module.exports = {
  name: 'ship',
  description: 'Ship de dois usuários',
  async execute(client, message, args) {
    const member1 = message.author;
    const member2 = message.mentions.users.first();
    const member3 = message.mentions.users.at(1);

    if (!member2) {
      return message.reply('Você precisa marcar alguém para usar esse comando!');
    }

    const isTwoUsers = !!member3;
    const [user1, user2] = isTwoUsers ? [member2, member3] : [member1, member2];
    const avatarURL1 = user1.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });
    const avatarURL2 = user2.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });

    try {
      // Baixa e converte avatares para PNG
      const resp1 = await fetch(avatarURL1);
      if (!resp1.ok) throw new Error('Não foi possível baixar a imagem do avatar 1.');
      const buf1 = await sharp(Buffer.from(await resp1.arrayBuffer())).png().toBuffer();

      const resp2 = await fetch(avatarURL2);
      if (!resp2.ok) throw new Error('Não foi possível baixar a imagem do avatar 2.');
      const buf2 = await sharp(Buffer.from(await resp2.arrayBuffer())).png().toBuffer();

      // Cria o canvas
      const canvas = createCanvas(800, 400);
      const ctx = canvas.getContext('2d');

      // Define o nível de "amor"
      const amor = Math.floor(Math.random() * 100);

      // Pintura do fundo com cor gradiente
      const backgroundColor = calculateBackgroundColor(amor);
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Desenha emojis camuflados no fundo
      let emoticonPath;
      if (amor > 60) emoticonPath = path.resolve(__dirname, 'images', 'emoji_2.png');
      else if (amor >= 40) emoticonPath = path.resolve(__dirname, 'images', 'emoji_3-1.png');
      else emoticonPath = path.resolve(__dirname, 'images', 'emoji_1.png');

      const emojiBuf = await sharp(emoticonPath).toBuffer();
      const camuBuf = await sharp(emojiBuf).resize({ width: 150 }).tint(backgroundColor).toBuffer();
      const emojiImg = await loadImage(camuBuf);
      const emojiSize = 50;
      for (let y = -emojiSize; y < canvas.height + emojiSize; y += emojiSize * 1.5) {
        for (let x = -emojiSize; x < canvas.width + emojiSize; x += emojiSize * 1.5) {
          ctx.save();
          ctx.translate(x + emojiSize/2, y + emojiSize/2);
          ctx.rotate(Math.PI / -4);
          ctx.globalAlpha = 0.3;
          ctx.drawImage(emojiImg, -emojiSize/2, -emojiSize/2, emojiSize, emojiSize);
          ctx.restore();
        }
      }

      // Carrega avatares no canvas
      const avatar1 = await loadImage(buf1);
      const avatar2 = await loadImage(buf2);
      const avatarSize = 200;
      const avatar1X = 50, avatar1Y = 100;
      const avatar2X = canvas.width - avatarSize - 50, avatar2Y = 100;

      // Avatar 1
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatar1X + avatarSize/2, avatar1Y + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar1, avatar1X, avatar1Y, avatarSize, avatarSize);
      ctx.restore();

      // Avatar 2
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatar2X + avatarSize/2, avatar2Y + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar2, avatar2X, avatar2Y, avatarSize, avatarSize);
      ctx.restore();

      // Bordas brancas ao redor dos avatares
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(avatar1X + avatarSize/2, avatar1Y + avatarSize/2, avatarSize/2 + 5, 0, Math.PI*2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(avatar2X + avatarSize/2, avatar2Y + avatarSize/2, avatarSize/2 + 5, 0, Math.PI*2);
      ctx.stroke();

      // Emoji grande central
      const bigEmojiBuf = await sharp(emoticonPath).resize({ width: 150 }).toBuffer();
      const bigEmojiImg = await loadImage(bigEmojiBuf);
      ctx.drawImage(bigEmojiImg, (canvas.width-150)/2, (canvas.height-150)/2, 150, 150);

      // Barra de compatibilidade
      const barW = 300, barH = 30;
      const barX = (canvas.width - barW)/2, barY = canvas.height - 70;
      const progW = (amor / 100) * barW;
      drawRoundedRect(ctx, barX, barY, barW, barH, 15, '#000000');
      drawRoundedRect(ctx, barX, barY, progW, barH, 15, '#FF2E77');
      drawRoundedRect(ctx, barX, barY, barW, barH, 15, null, true);

      // Texto da porcentagem com fonte personalizada
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px "Helsinki"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${amor}%`, canvas.width/2, barY + barH/2);

      // Monta o attachment e envia
      const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'ship.png' });
      const nomeship = `${member1.username.slice(0,3)}-${member2.username.slice(0,3)}`;
      let desc = `:sparkling_heart: HMMM, vai rolar ou não vai? :sparkling_heart:\n:heart: \`${nomeship}\` Compatibilidade: ${amor}%!`;
      message.reply({ content: desc, files: [attachment] });
    } catch (error) {
      console.error('Erro ao processar as imagens:', error);
      message.reply('Ocorreu um erro ao tentar criar a imagem do ship.');
    }
  },
};

function calculateBackgroundColor(amor) {
  const startColor = { r: 128, g: 128, b: 128 };
  const midColor = { r: 60, g: 108, b: 224 };
  const endColor = { r: 180, g: 104, b: 227 };
  const finalColor = { r: 255, g: 46, b: 119 };
  let r, g, b;
  if (amor <= 33) {
    const f = amor / 33;
    r = Math.round(startColor.r + f * (midColor.r - startColor.r));
    g = Math.round(startColor.g + f * (midColor.g - startColor.g));
    b = Math.round(startColor.b + f * (midColor.b - startColor.b));
  } else if (amor <= 66) {
    const f = (amor - 33) / 33;
    r = Math.round(midColor.r + f * (endColor.r - midColor.r));
    g = Math.round(midColor.g + f * (endColor.g - midColor.g));
    b = Math.round(midColor.b + f * (endColor.b - midColor.b));
  } else {
    const f = (amor - 66) / 34;
    r = Math.round(endColor.r + f * (finalColor.r - endColor.r));
    g = Math.round(endColor.g + f * (finalColor.g - endColor.g));
    b = Math.round(endColor.b + f * (finalColor.b - endColor.b));
  }
  return `rgb(${r}, ${g}, ${b})`;
}

function drawRoundedRect(ctx, x, y, width, height, radius, fillColor, stroke = false) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}
