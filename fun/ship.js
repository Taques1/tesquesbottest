const { AttachmentBuilder } = require('discord.js');
const Canvas = require('canvas');
const fetch = require('node-fetch');
const sharp = require('sharp');
const path = require('path');

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

        // Se há duas pessoas marcadas, definimos member2 e member3 como participantes
        const isTwoUsers = !!member3;
        const [user1, user2] = isTwoUsers ? [member2, member3] : [member1, member2];

        const avatarURL1 = user1.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });
        const avatarURL2 = user2.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });

        try {
            const response1 = await fetch(avatarURL1);
            if (!response1.ok) throw new Error('Não foi possível baixar a imagem do avatar.');
            const buffer1 = Buffer.from(await response1.arrayBuffer());
            const pngBuffer1 = await sharp(buffer1).toFormat('png').toBuffer();

            const response2 = await fetch(avatarURL2);
            if (!response2.ok) throw new Error('Não foi possível baixar a imagem do avatar.');
            const buffer2 = Buffer.from(await response2.arrayBuffer());
            const pngBuffer2 = await sharp(buffer2).toFormat('png').toBuffer();

            const canvas = Canvas.createCanvas(800, 400);
            const ctx = canvas.getContext('2d');

            const amor = Math.floor(Math.random() * 100);

            function calculateBackgroundColor(amor) {
                const startColor = { r: 128, g: 128, b: 128 }; // Cinza
                const midColor = { r: 60, g: 108, b: 224 }; // Azul (#3C6CE0)
                const endColor = { r: 180, g: 104, b: 227 }; // Roxo (#B468E3)
                const finalColor = { r: 255, g: 46, b: 119 }; // Rosa (#FF2E77)

                let r, g, b;
                if (amor <= 33) {
                    const factor = amor / 33;
                    r = Math.round(startColor.r + factor * (midColor.r - startColor.r));
                    g = Math.round(startColor.g + factor * (midColor.g - startColor.g));
                    b = Math.round(startColor.b + factor * (midColor.b - startColor.b));
                } else if (amor <= 66) {
                    const factor = (amor - 33) / 33;
                    r = Math.round(midColor.r + factor * (endColor.r - midColor.r));
                    g = Math.round(midColor.g + factor * (endColor.g - midColor.g));
                    b = Math.round(midColor.b + factor * (endColor.b - midColor.b));
                } else {
                    const factor = (amor - 66) / 34;
                    r = Math.round(endColor.r + factor * (finalColor.r - endColor.r));
                    g = Math.round(endColor.g + factor * (finalColor.g - endColor.g));
                    b = Math.round(endColor.b + factor * (finalColor.b - endColor.b));
                }

                return `rgb(${r}, ${g}, ${b})`;
            }

            const backgroundColor = calculateBackgroundColor(amor);

            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            let emoticonPath;
            if (amor > 60) {
                emoticonPath = path.resolve(__dirname, 'images', 'emoji_2.png');
            } else if (amor >= 40) {
                emoticonPath = path.resolve(__dirname, 'images', 'emoji_3-1.png');
            } else {
                emoticonPath = path.resolve(__dirname, 'images', 'emoji_1.png');
            }

            const emojiBuffer = await sharp(emoticonPath).toBuffer();
            const emojiCamufladoBuffer = await sharp(emojiBuffer)
                .resize({ width: 150 })
                .tint(backgroundColor)
                .toBuffer();

            const emojiCamuflado = await Canvas.loadImage(emojiCamufladoBuffer);

            const emojiSize = 50;
            for (let y = -emojiSize; y < canvas.height + emojiSize; y += emojiSize * 1.5) {
                for (let x = -emojiSize; x < canvas.width + emojiSize; x += emojiSize * 1.5) {
                    ctx.save();
                    ctx.translate(x + emojiSize / 2, y + emojiSize / 2);
                    ctx.rotate(Math.PI / -4);
                    ctx.globalAlpha = 0.3;
                    ctx.drawImage(emojiCamuflado, -emojiSize / 2, -emojiSize / 2, emojiSize, emojiSize);
                    ctx.restore();
                }
            }

            const avatar1 = await Canvas.loadImage(pngBuffer1);
            const avatar2 = await Canvas.loadImage(pngBuffer2);

            const avatarSize = 200;
            const avatar1X = 50;
            const avatar1Y = 100;
            const avatar2X = canvas.width - avatarSize - 50;
            const avatar2Y = 100;

            ctx.save();
            ctx.beginPath();
            ctx.arc(avatar1X + avatarSize / 2, avatar1Y + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar1, avatar1X, avatar1Y, avatarSize, avatarSize);
            ctx.restore();

            ctx.save();
            ctx.beginPath();
            ctx.arc(avatar2X + avatarSize / 2, avatar2Y + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar2, avatar2X, avatar2Y, avatarSize, avatarSize);
            ctx.restore();

            ctx.lineWidth = 5;
            ctx.strokeStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(avatar1X + avatarSize / 2, avatar1Y + avatarSize / 2, avatarSize / 2 + 5, 0, Math.PI * 2, true);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(avatar2X + avatarSize / 2, avatar2Y + avatarSize / 2, avatarSize / 2 + 5, 0, Math.PI * 2, true);
            ctx.stroke();

            const emojiSizeLarge = 150;
            const emojiX = (canvas.width - emojiSizeLarge) / 2;
            const emojiY = (canvas.height - emojiSizeLarge) / 2;
            const originalEmojiBuffer = await sharp(emoticonPath).resize({ width: emojiSizeLarge }).toBuffer();
            const originalEmoji = await Canvas.loadImage(originalEmojiBuffer);
            ctx.drawImage(originalEmoji, emojiX, emojiY, emojiSizeLarge, emojiSizeLarge);

            const barWidth = 300;
            const barHeight = 30;
            const barRadius = 15;
            const progressWidth = (amor / 100) * barWidth;
            const barX = (canvas.width - barWidth) / 2;
            const barY = canvas.height - 70;

            drawRoundedRect(ctx, barX, barY, barWidth, barHeight, barRadius, '#000000');

            ctx.fillStyle = '#FF2E77'; // Cor rosa personalizada (#FF2E77)
            drawRoundedRect(ctx, barX, barY, progressWidth, barHeight, barRadius, '#FF2E77');
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            drawRoundedRect(ctx, barX, barY, barWidth, barHeight, barRadius, null, true);

            const fontPath = path.resolve(__dirname, 'fonts', 'helsinki.ttf'); // Ajuste no caminho
            ctx.font = 'bold 20px "' + fontPath + '"'; // Certifique-se de que o caminho da fonte esteja correto
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle'; // Adicionando textBaseline
            ctx.fillText(`${amor}%`, canvas.width / 2, barY + barHeight / 2);

            const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'ship.png' });

            // Construindo a mensagem de descrição
            const nomeship = `${member1.username.slice(0, 3)}-${member2.username.slice(0, 3)}`; // Fusão dos nomes
            let desc;
            if (amor > 90) {
                desc = `:sparkling_heart: HMMM, vai rolar ou não vai? :sparkling_heart:\n:heart: \`${nomeship}\` Esse é o casal perfeito!`;
            } else if (amor >= 70) {
                desc = `:sparkling_heart: HMMM, vai rolar ou não vai? :sparkling_heart:\n:heart: \`${nomeship}\` Esses aqui já tão se pegando e n contaram pra ngm!`;
            } else if (amor >= 45) {
                desc = `:sparkling_heart: HMMM, vai rolar ou não vai? :sparkling_heart:\n:no_mouth: \`${nomeship}\` Talvez só precisa o \`${member2.username}\` querer...`;
            } else {
                desc = `:sparkling_heart: HMMM, vai rolar ou não vai? :sparkling_heart:\n:cry: \`${nomeship}\` queria muito dizer que é possível, mas...`;
            }

            message.reply({ content: desc, files: [attachment] });

        } catch (error) {
            console.error('Erro ao processar as imagens:', error);
            message.reply('Ocorreu um erro ao tentar criar a imagem do ship.');
        }
    },
};

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
        ctx.stroke();
    }
}
