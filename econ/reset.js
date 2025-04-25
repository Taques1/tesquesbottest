const { EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const emotes = require('../emotes.json');

const db = new QuickDB();

// Itens disponíveis para compra
const items = [
    { name: 'ficha', description: 'Descrição do item 1', price: 500, type: 'item' },
    { name: 'chave', description: 'Descrição do item 2', price: 100, type: 'item' },
    { name: 'galo', description: 'Descrição do item 3', price: 500, type: 'item' },
    { name: 'raspadinha', description: 'Descrição do item 4', price: 500, type: 'item' },
    { name: 'vara de pesca', description: 'Descrição do item 5', price: 500, type: 'item' },
    { name: 'isca magnetica', description: 'Descrição do item 6', price: 500, type: 'item' },
];

// Cargos disponíveis para compra
const roles = [
    { name: 'Cafetão', price: 15000, roleID: '810949799671103568', dailyIncome: 1500 },
    { name: 'Dono da Boca', price: 25000, roleID: '970783056485023744', dailyIncome: 2000 },
    { name: 'Empresário', price: 25000, roleID: '810949798902759495', dailyIncome: 2500 },
    { name: 'Agiota', price: 50000, roleID: '810949795454910544', dailyIncome: 5000 },
    { name: 'Imperador', price: 100000, roleID: '810949794293219339', dailyIncome: 10000 },
    { name: 'Mestre', price: 500000, roleID: '810949765058920459', dailyIncome: 50000, special: 'Pode personalizar o cargo' },
];

module.exports = {
    name: 'buy',
    description: 'Comando para comprar itens ou cargos',
    execute: async (client, message, args) => {
        // Obtém o último argumento como a quantidade, se fornecida
        const quantityArg = args.length > 1 && !isNaN(args[args.length - 1]) ? args.pop() : 1;
        const itemOrRoleArg = args.join(' '); // Junta os argumentos restantes como o nome do item ou cargo

        // Converte a quantidade para número inteiro
        const quantity = parseInt(quantityArg, 10);

        // Verifica se o nome do item ou cargo é válido
        const normalize = (str) => str.toLowerCase().replace(/_/g, ' ').trim();

        const item = items.find((i) => normalize(i.name) === normalize(itemOrRoleArg));
        const role = roles.find((r) => normalize(r.name) === normalize(itemOrRoleArg));

        if (!item && !role) {
            return message.channel.send('Não foi possível encontrar o item ou cargo especificado.');
        }

        const balance = await db.get(`wallet_${message.author.id}`) || 0;
        const totalCost = item ? item.price * quantity : role.price;

        if (balance < totalCost) {
            return message.channel.send(
                `Você não tem dinheiro suficiente para comprar ${quantity}x ${item ? item.name : role.name}. O custo é de ${emotes.moeda}${totalCost}, e você tem ${emotes.moeda}${balance}.`
            );
        }

        if (item) {
            const inventory = await db.get(`inventory_${message.author.id}`) || {};
            const maxItems = await db.get(`max_items_${message.author.id}`) || 10;
            const validItemsCount = Object.entries(inventory).filter(([name, amount]) => amount > 0).length;

            // Verifica se a compra de mais itens excederia o limite de inventário
            if (validItemsCount >= maxItems && !inventory[item.name]) {
                return message.channel.send(`Você atingiu o limite máximo de ${maxItems} itens no inventário. Não é possível adicionar mais itens.`);
            }

            // Verificação específica para o item 'galo'
            if (item.name === 'galo') {
                const galoCount = inventory.galo || 0;
                if (galoCount > 0) {
                    return message.channel.send('Você já possui um galo. Não é possível comprar mais de um.');
                }
            }

            // Atualiza o saldo e o inventário
            await db.sub(`wallet_${message.author.id}`, totalCost);
            await db.add(`inventory_${message.author.id}.${item.name.replace(/ /g, '_')}`, quantity);
            return message.channel.send(
                `Você comprou ${quantity}x ${item.name} por ${emotes.moeda}${totalCost}.`
            );
        } else if (role) {
            // Verificação se o usuário já possui o cargo
            const userRoles = message.member.roles.cache.map((role) => role.id);
            if (userRoles.includes(role.roleID)) {
                return message.channel.send('Você já possui esse cargo.');
            }

            // Atualiza o saldo e adiciona o cargo
            await db.sub(`wallet_${message.author.id}`, totalCost);
            await message.member.roles.add(role.roleID);
            const specialText = role.special ? ` e ${role.special}` : '';
            return message.channel.send(
                `Você comprou o cargo ${role.name} por ${emotes.moeda}${totalCost}${specialText}.`
            );
        }
    }
};
