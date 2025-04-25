const { EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const emotes = require("../emotes.json");

const db = new QuickDB();

module.exports = {
    name: 'inventario',
    description: 'Mostra o inventário do usuário',
    execute: async (client, message, args) => {
        const inventory = await db.get(`inventory_${message.author.id}`);

        if (!inventory || Object.keys(inventory).length === 0) {
            return message.reply('Você ainda não tem nenhum item no seu inventário!');
        }

        const inventoryItems = Object.entries(inventory)
            .filter(([name, amount]) => amount > 0) // Filtra apenas os itens com quantidade > 0
            .map(([name, amount]) => `**${name.replace(/_/g, ' ')}**: ${amount}x`) // Formata a exibição dos itens
            .join('\n');

        const validItemsCount = Object.entries(inventory).filter(([name, amount]) => amount > 0).length;
        const maxItems = await db.get(`max_items_${message.author.id}`) || 10;
        const availableSlots = maxItems - validItemsCount;

        // Obter a cor do cargo mais alto do usuário
        const highestRoleColor = message.member.roles.highest.color || 'Red';

        const embed = new EmbedBuilder()
            .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
            .setTitle(`Inventário de ${message.author.username}`)
            .setColor(highestRoleColor)
            .setThumbnail(message.author.displayAvatarURL())
            .setDescription(`**Itens no inventário**:\n${inventoryItems}\n`)
            .setFooter({ text: `Total de vagas: ${maxItems} | Vagas disponíveis: ${availableSlots}` });

        return message.channel.send({ embeds: [embed] });
    }
};
