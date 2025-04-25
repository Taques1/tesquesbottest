const { QuickDB } = require('quick.db');
const { createCanvas, loadImage, registerFont } = require('canvas');
const fetch = require('node-fetch');
const sharp = require('sharp');
const { AttachmentBuilder } = require('discord.js');

// Registre a fonte aqui
registerFont('./fun/fonts/helsinki.ttf', { family: 'Helsinki' });

const db = new QuickDB();

module.exports = {
    name: 'rank',
    description: 'Mostra o ranking dos usuários com mais dinheiro total.',
    execute: async (client, message, args) => {
        const walletEntries = await db.all();
        const userIds = new Set(walletEntries
            .filter(entry => entry.id.startsWith('wallet_') || entry.id.startsWith('bank_'))
            .map(entry => entry.id.replace(/^(wallet_|bank_)/, ''))
        );

        const userBalances = {};
        for (const userId of userIds) {
            if (!/^\d+$/.test(userId)) continue;
            try {
                const user = await client.users.fetch(userId);
                if (user.bot) continue;

                const walletBalance = await db.get(`wallet_${userId}`) || 0;
                const bankBalance = await db.get(`bank_${userId}`) || 0;
                userBalances[userId] = walletBalance + bankBalance;
            } catch (error) {
                console.error(`Erro ao buscar usuário com ID ${userId}: ${error.message}`);
                continue;
            }
        }

        const sortedUsers = Object.entries(userBalances)
            .sort(([, balanceA], [, balanceB]) => balanceB - balanceA)
            .slice(0, 5); // Pega o top 5

        if (sortedUsers.length === 0) {
            return message.channel.send('Nenhum usuário com saldo encontrado.');
        }

        // Criando a tela
        const canvas = createCanvas(800, 600);
        const ctx = canvas.getContext('2d');

        // Fundo preto
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Desenhar o título "Rank" no topo
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 40px Helsinki';
        ctx.textAlign = 'center';
        ctx.fillText('Rank', canvas.width / 2, 50);

        // Parâmetros para as faixas
        const purple = '#800080';
        const barHeight = 90; 
        const barWidth = canvas.width * 0.75; 
        const radius = 20;
        const padding = 15; 
        const topMargin = 80; 

        // Carregar imagem da moeda
        const moedaImage = await loadImage('https://i.imgur.com/lCGJyzF.png');

        // Definir coordenada X fixa para nomes
        const fixedNameX = 200; // Posição fixa para os nomes

        // Iterar sobre o ranking
        for (let i = 0; i < sortedUsers.length; i++) {
            const [userId, totalBalance] = sortedUsers[i];
            const user = await client.users.fetch(userId);
            const y = i * (barHeight + padding) + topMargin; 

            // Desenhar faixa
            ctx.fillStyle = purple;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(barWidth - radius, y);
            ctx.arcTo(barWidth, y, barWidth, y + radius, radius);
            ctx.lineTo(barWidth, y + barHeight - radius);
            ctx.arcTo(barWidth, y + barHeight, barWidth - radius, y + barHeight, radius);
            ctx.lineTo(0, y + barHeight);
            ctx.closePath();
            ctx.fill();

            // Desenhar avatar
            const avatarURL = user.displayAvatarURL({ format: 'png', size: 128 });
            const response = await fetch(avatarURL);
            const buffer = Buffer.from(await response.arrayBuffer());
            const pngBuffer = await sharp(buffer).toFormat('png').toBuffer();
            const avatar = await loadImage(pngBuffer);

            const avatarSize = 70;
            const avatarX = 20;
            const avatarY = y + (barHeight - avatarSize) / 2; 
            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
            ctx.restore();

            // Desenhar número da posição (1°, 2°, etc.) e nome do usuário na mesma linha
            const rankPosition = `${i + 1}°`; 
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 30px Helsinki'; 
            ctx.fillText(rankPosition, avatarX + avatarSize + 10, avatarY + 30); // Posição do rank

            // Desenhar nome do usuário com uma posição fixa
            ctx.font = 'bold 25px Helsinki'; 
            ctx.fillText(user.username, fixedNameX, avatarY + 30); // Nome alinhado com a posição fixa

            // Desenhar imagem da moeda
            const moedaSize = 30;
            const moedaX = fixedNameX; 
            const moedaY = avatarY + 40; 
            ctx.drawImage(moedaImage, moedaX, moedaY, moedaSize, moedaSize);

            // Desenhar quantidade de moedas ao lado da imagem da moeda
            ctx.font = '20px Helsinki'; 
            const balanceX = moedaX + moedaSize + 10; 
            const balanceText = parseInt(totalBalance).toLocaleString('pt-BR'); 
            ctx.fillText(balanceText, balanceX, moedaY + 22); 
        }

        // Enviar imagem para o canal
        const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'ranking.png' });
        message.channel.send({ files: [attachment] });
    }
};
