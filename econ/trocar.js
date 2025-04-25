const { MessageEmbed } = require('discord.js');
const db = require('quick.db');

module.exports = {
    name: 'trocar',
    description: 'Troque itens com outros usuários',
    usage: '!trocar <@user> <item>',
    async execute(message, args) {
        // Verificar se todos os argumentos estão presentes
        const targetUser = message.mentions.users.first();
        const item = args.slice(1).join(' ');

        if (!targetUser || !item) {
            return message.channel.send('Uso correto: !trocar <@user> <item>');
        }

        if (targetUser.id === message.author.id) {
            return message.channel.send('Você não pode trocar itens consigo mesmo.');
        }

        // Verificar inventários
        const authorInventory = db.get(`inventory_${message.author.id}`) || [];
        const targetInventory = db.get(`inventory_${targetUser.id}`) || [];

        // Verificar se o autor possui o item
        if (!authorInventory.includes(item)) {
            return message.channel.send('Você não possui esse item para trocar.');
        }

        // Enviar confirmação para o usuário alvo
        const embed = new MessageEmbed()
            .setTitle('Solicitação de Troca')
            .setDescription(`${message.author.username} quer trocar o item **${item}** com você.\nClique em "Aceitar" ou "Recusar".`)
            .setColor('BLUE');

        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('accept')
                    .setLabel('Aceitar')
                    .setStyle('SUCCESS'),
                new MessageButton()
                    .setCustomId('decline')
                    .setLabel('Recusar')
                    .setStyle('DANGER')
            );

        const tradeMessage = await message.channel.send({ embeds: [embed], components: [row] });

        const filter = (interaction) =>
            ['accept', 'decline'].includes(interaction.customId) && interaction.user.id === targetUser.id;

        const collector = tradeMessage.createMessageComponentCollector({ filter, time: 30000 });

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'accept') {
                // Troca aceita: remover item do autor e adicionar ao alvo
                db.set(`inventory_${message.author.id}`, authorInventory.filter((i) => i !== item));
                db.push(`inventory_${targetUser.id}`, item);

                await interaction.update({
                    content: `${targetUser.username} aceitou a troca! O item **${item}** foi transferido.`,
                    embeds: [],
                    components: []
                });
            } else if (interaction.customId === 'decline') {
                await interaction.update({
                    content: `${targetUser.username} recusou a troca.`,
                    embeds: [],
                    components: []
                });
            }

            collector.stop();
        });

        collector.on('end', (_, reason) => {
            if (reason === 'time') {
                tradeMessage.edit({
                    content: 'O tempo para resposta acabou. A troca foi cancelada.',
                    embeds: [],
                    components: []
                });
            }
        });
    },
};
