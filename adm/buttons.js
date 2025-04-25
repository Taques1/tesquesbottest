const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = {
    name: 'paginator',
    description: 'Navega entre páginas usando botões.',
    async execute(client, message, args) {
        const pages = [
            'Esta é a página 1',
            'Esta é a página 2',
            'Esta é a página 3'
        ];

        let currentPage = 0;

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('previous')
                    .setLabel('⬅️')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('➡️')
                    .setStyle(ButtonStyle.Primary)
            );

        const msg = await message.channel.send({
            content: pages[currentPage],
            components: [row]
        });

        const collector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000 // 1 minuto
        });

        collector.on('collect', i => {
            if (i.user.id !== message.author.id) {
                return i.reply({ content: 'Você não pode usar esses botões.', ephemeral: true });
            }

            if (i.customId === 'previous') {
                currentPage = currentPage > 0 ? --currentPage : pages.length - 1;
            } else if (i.customId === 'next') {
                currentPage = currentPage + 1 < pages.length ? ++currentPage : 0;
            }

            i.update({ content: pages[currentPage] });
        });

        collector.on('end', () => {
            row.components.forEach(button => button.setDisabled(true));
            msg.edit({ components: [row] });
        });
    }
};
