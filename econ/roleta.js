const { QuickDB } = require('quick.db');
const { createCanvas, loadImage } = require('canvas');
const fetch = require('node-fetch');
const sharp = require('sharp');
const { AttachmentBuilder } = require('discord.js');

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
            .slice(0, 5); // Pega os top 5

        if (sortedUsers.length === 0) {
            return message.channel.send('Nenhum usuário com saldo encontrado.');
        }

        // Configuração do Canvas
        const canvasWidth = 800;
        const canvasHeight = 600;
        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');

        // Fundo
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Título
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Rank', canvas.width / 2, 50);

        // Carregar imagem da moeda
        const moedaImage = await loadImage('https://i.imgur.com/lCGJyzF.png');

        // Configurações de barra e espaçamento
        const barHeight = 90;
        const barWidth = canvasWidth * 0.75;
        const avatarSize = 70;
        const margin = 30; // Margem entre faixas
        const topMargin = 80; // Margem inicial
        const paddingX = 20; // Espaço interno horizontal da barra
        const radius = 20;

        for (let i = 0; i < sortedUsers.length; i++) {
            const [userId, balance] = sortedUsers[i];
            const user = await client.users.fetch(userId);

            // Calcula posição Y de cada barra de forma simétrica
            const y = topMargin + i * (barHeight + margin);

            // Desenhar a faixa
            ctx.fillStyle = '#800080'; // Cor roxa
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(barWidth - radius, y);
            ctx.arcTo(barWidth, y, barWidth, y + radius, radius);
            ctx.lineTo(barWidth, y + barHeight - radius);
            ctx.arcTo(barWidth, y + barHeight, barWidth - radius, y + barHeight, radius);
            ctx.lineTo(0, y + barHeight);
            ctx.closePath();
            ctx.fill();

            // Obter avatar
            const avatarURL = user.displayAvatarURL({ format: 'png', size: 128 });
            const response = await fetch(avatarURL);
            const buffer = Buffer.from(await response.arrayBuffer());
            const pngBuffer = await sharp(buffer).toFormat('png').toBuffer();
            const avatar = await loadImage(pngBuffer);

            // Desenhar avatar
            const avatarX = paddingX;
            const avatarY = y + (barHeight - avatarSize) / 2;
            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
            ctx.restore();

            // Desenhar posição
            const rankText = `${i + 1}°`;
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 30px Arial';
            ctx.fillText(rankText, avatarX + avatarSize + 20, avatarY + 30);

            // Desenhar imagem da moeda e saldo
            const moedaSize = 30;
            const moedaX = barWidth - 150; // Alinhado à direita
            const moedaY = y + (barHeight - moedaSize) / 2; // Centralizado verticalmente
            ctx.drawImage(moedaImage, moedaX, moedaY, moedaSize, moedaSize);

            // Desenhar saldo ao lado da moeda
            const balanceText = parseInt(balance).toLocaleString('pt-BR');
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '20px Arial';
            ctx.textAlign = 'left'; // Garante que o texto se alinhe à esquerda do ícone
            const textX = moedaX + moedaSize + 10; // Espaço fixo após o ícone
            const textY = moedaY + moedaSize / 2 + 5; // Centraliza com o ícone
            ctx.fillText(balanceText, textX, textY);

        }

        // Enviar imagem no Discord
        const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'ranking.png' });
        message.channel.send({ files: [attachment] });
    }
};
