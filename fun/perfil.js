const { createCanvas, loadImage, registerFont } = require('canvas');
const { AttachmentBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const path = require('path');
const db = new QuickDB();
const fetch = require('node-fetch');
const sharp = require('sharp');

// Registra a fonte Helsinki a partir da nova localização
registerFont(path.join(__dirname, 'fonts', 'helsinki.ttf'), { family: 'Helsinki' });

module.exports = {
    name: 'profile',
    aliases: ['perfil', 'sobremim'],
    execute: async (client, message, args) => {
        try {
            // Cria o canvas
            const canvas = createCanvas(850, 550);
            const ctx = canvas.getContext('2d');

            // Obtém o usuário mencionado ou o autor da mensagem
            const user = message.mentions.users.first() || client.users.cache.get(args[0]) || message.author;

            // Obtém o "sobre mim" do usuário ou define uma mensagem padrão
            let sobremim = await db.get(`sobremim_${user.id}`);
            if (!sobremim) {
                sobremim = 'Você pode alterar o seu sobremim digitando !tsobremim';
            }

            // Obtém a quantidade de moedas em carteira e banco, ou define como 0
            const wallet = await db.get(`wallet_${user.id}`) || 0;
            const bank = await db.get(`bank_${user.id}`) || 0;

            // Calcula o total de moedas
            const totalCoins = wallet + bank;

            // Obtém o avatar do usuário
            const avatarURL = user.displayAvatarURL({ format: 'png', size: 1024 });

            // Carrega a imagem de fundo
            let background;
            try {
                background = await loadImage(path.join(__dirname, 'images', 'backgroundprofile.jpg'));
            } catch (error) {
                console.error('Erro ao carregar a imagem de fundo:', error);
                return message.channel.send('Erro ao carregar a imagem de fundo.');
            }
            ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

            // Carrega o layout da imagem
            let layout;
            try {
                layout = await loadImage(path.join(__dirname, 'images', 'layoutprofile2.png'));
            } catch (error) {
                console.error('Erro ao carregar o layout da imagem:', error);
                return message.channel.send('Erro ao carregar o layout da imagem.');
            }
            ctx.drawImage(layout, 0, 0, canvas.width, canvas.height);

            // Configura a fonte para o nome do usuário
            ctx.font = '30px Helsinki';
            ctx.fillStyle = '#F8F8F8';
            ctx.fillText(user.username, 340, 73);

            // Configura a fonte para a quantidade total de moedas
            ctx.font = '20px Helsinki';
            ctx.fillStyle = '#F8F8F8';
            ctx.fillText(`Total de moedas: ${totalCoins}`, 500, 230);

            // Carrega e desenha o emoji de moeda
            const emojiURL = 'https://i.imgur.com/lCGJyzF.png'; // Substitua pelo URL da sua imagem de emoji
            try {
                const emojiImage = await loadImage(emojiURL);
                ctx.drawImage(emojiImage, 450, 183, 50, 50); // Ajuste a posição e o tamanho conforme necessário
            } catch (error) {
                console.error('Erro ao carregar a imagem do emoji:', error);
                return message.channel.send('Erro ao carregar a imagem do emoji.');
            }

            // Configura a fonte para o "sobremim"
            ctx.font = '25px Helsinki';
            ctx.fillStyle = '#F8F8F8';
            ctx.fillText(sobremim, 20, 500);

            // Verifica se o usuário possui conquistas específicas e desenha as insígnias
            const achievements = await db.get(`achievements_${user.id}`) || {};

            const badgePaths = {
                jackpot: path.join(__dirname, 'images', 'jackpot.png'),
                fish_legendary: path.join(__dirname, 'images', 'peixe.png'),
                legendary_chest: path.join(__dirname, 'images', 'bau.png')
            };

            const badgePositions = {
                fish_legendary: { x: canvas.width * 0.82 - 136 - 189 + 49 - 10, y: canvas.height * 0.83 - 104 + 7 - 3 },
                jackpot: { x: canvas.width * 0.82 - 136 - 189 + 49 + 80 - 17, y: canvas.height * 0.83 - 104 + 7 - 4 },
                legendary_chest: { x: canvas.width * 0.82 - 136 - 189 + 49 + 80 + 17 + 42, y: canvas.height * 0.83 - 104 + 7 - 4 }
            };

            for (const [key, path] of Object.entries(badgePaths)) {
                if (achievements[key]) {
                    try {
                        const badgeImage = await loadImage(path);
                        const { x, y } = badgePositions[key];
                        const badgeWidth = canvas.width * 0.18;
                        const badgeHeight = canvas.height * 0.18;
                        ctx.drawImage(badgeImage, x, y, badgeWidth, badgeHeight);
                    } catch (error) {
                        console.error(`Erro ao carregar a insígnia ${key}:`, error);
                        return message.channel.send(`Erro ao carregar a insígnia ${key}.`);
                    }
                }
            }

            // Cria uma máscara redonda para o avatar do usuário
            ctx.beginPath();
            ctx.arc(723, 108, 94, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();

            // Baixa e carrega o avatar do usuário
            try {
                const response = await fetch(avatarURL);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const buffer = await response.buffer();

                // Converte a imagem para PNG usando sharp
                const pngBuffer = await sharp(buffer).toFormat('png').toBuffer();
                const avatar = await loadImage(pngBuffer);

                ctx.drawImage(avatar, 628, 12, 193, 193);

                // Envia a imagem ao canal
                const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'profile.png' });
                return message.channel.send({ content: `${message.author}`, files: [attachment] });
            } catch (error) {
                console.error('Erro ao carregar o avatar do usuário:', error);
                return message.channel.send('Erro ao carregar o avatar do usuário.');
            }
        } catch (error) {
            console.error('Erro ao gerar perfil:', error);
            message.channel.send('Ocorreu um erro ao gerar o perfil.');
        }
    }
};
