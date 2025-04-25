const { AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const GIFEncoder = require('gifencoder');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

module.exports = {
  name: 'petpet',
  description: 'Acaricie o avatar de alguém ou o seu próprio avatar!',
  async execute(client, message, args) {
    try {
      const user = message.mentions.users.first() || message.author;

      // Obtém o avatar do usuário
      const avatarURL = user.displayAvatarURL({ format: 'png', dynamic: true, size: 128 });
      const response = await fetch(avatarURL);
      if (!response.ok) {
        throw new Error('Não foi possível baixar a imagem do avatar.');
      }
      const avatarBuffer = await response.buffer();
      const avatarImage = await loadImage(avatarBuffer);

      // Define o tamanho do GIF
      const width = 128;
      const height = 128;

      // Cria o GIF encoder
      const gifEncoder = new GIFEncoder(width, height);
      const outputPath = path.join(__dirname, 'petpet.gif');
      const gifStream = fs.createWriteStream(outputPath);
      gifEncoder.createReadStream().pipe(gifStream);

      gifEncoder.start();
      gifEncoder.setRepeat(0);  // 0 para repetir, -1 para não repetir
      gifEncoder.setDelay(500); // atraso entre frames em ms
      gifEncoder.setQuality(10); // qualidade da imagem (1 = melhor, 20 = pior)

      // Número de frames no GIF
      const numFrames = 10;

      for (let i = 0; i < numFrames; i++) {
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Desenha o avatar no fundo
        ctx.drawImage(avatarImage, 0, 0, width, height);

        // Adiciona um efeito de carinho (aqui, um simples círculo animado)
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 20 + (i % 10), 0, Math.PI * 2, false);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 5;
        ctx.stroke();

        gifEncoder.addFrame(ctx);
      }

      gifEncoder.finish();

      // Envia o GIF gerado
      const attachment = new AttachmentBuilder(outputPath, { name: 'petpet.gif' });
      message.channel.send({ files: [attachment] });

    } catch (error) {
      console.error('Erro ao gerar o GIF petpet:', error);
      message.channel.send('Ocorreu um erro ao tentar gerar o GIF de carinho.');
    }
  }
};
