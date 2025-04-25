const { AttachmentBuilder } = require('discord.js');
const Jimp = require('jimp');
const sharp = require('sharp');
const path = require('path');
const fetch = require('node-fetch');

module.exports = {
  name: 'gaytest',
  aliases: ['gay'],
  description: 'Testa a porcentagem de "gay" do usuário',
  async execute(client, message, args) {
    const user = message.mentions.users.first() || message.author;

    if (user.bot) {
      return message.reply('Da onde já se viu bot ter perfil kkakakakakakk');
    }

    // Pega o avatar do usuário
    const avatarURL = user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });

    try {
      // Baixa a imagem do avatar
      const response = await fetch(avatarURL);
      if (!response.ok) {
        throw new Error('Não foi possível baixar a imagem do avatar.');
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Converte a imagem para PNG usando sharp
      const pngBuffer = await sharp(buffer).toFormat('png').toBuffer();

      // Carrega a imagem do avatar com Jimp
      const avatar = await Jimp.read(pngBuffer);
      avatar.resize(1000, 1000);

      // Gera a porcentagem
      const porcentagem = Math.floor(Math.random() * 100);

      // Define o layout com base na porcentagem
      let layoutPath;
      if (porcentagem < 30) {
        layoutPath = path.join(__dirname, 'images', 'layout1.png');
      } else if (porcentagem <= 60) {
        layoutPath = path.join(__dirname, 'images', 'layout2.png');
      } else {
        layoutPath = path.join(__dirname, 'images', 'layout3.png');
      }

      // Carrega o layout a partir do arquivo local
      const layoutImage = await Jimp.read(layoutPath);

      // Sobrepõe o layout na imagem do avatar
      avatar.blit(layoutImage, 0, 0);

      // Adiciona o texto de porcentagem à imagem
      let font;
      try {
        font = await Jimp.loadFont(path.join(__dirname, 'fonts', 'IMPACT.fnt'));
      } catch (e) {
        console.error('Fonte personalizada não carregada. Usando fonte padrão.');
        font = await Jimp.loadFont(Jimp.FONT_SANS_128_WHITE);
      }

      // Adiciona o texto de porcentagem à imagem no local especificado (40, 900)
      const text = `${porcentagem}%`;
      avatar.print(font, 41, 800, text); // Ajuste a posição aqui

      // Cria um buffer com a imagem modificada
      const outputBuffer = await avatar.getBufferAsync(Jimp.MIME_PNG);
      const attachment = new AttachmentBuilder(outputBuffer, { name: 'gaytest.png' });

      // Envia a mensagem com o anexo
      return message.channel.send({ content: `${message.author}`, files: [attachment] });
    } catch (error) {
      console.error('Erro ao processar a imagem:', error);
      return message.reply(`<a:checkNo:528625993569796121> **| ${message.author.tag}**, Parece que ocorreu um erro ao enviar essa imagem.`);
    }
  }
};
