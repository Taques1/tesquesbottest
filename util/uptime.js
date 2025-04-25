const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'uptime',
    description: 'Mostra o tempo de atividade do bot',
    async execute(client, message, args) {
        // Calcula o tempo de atividade
        let totalSeconds = client.uptime / 1000;
        let days = Math.floor(totalSeconds / 86400);
        let hours = Math.floor(totalSeconds / 3600);
        totalSeconds %= 3600;
        let minutes = Math.floor(totalSeconds / 60);
        let seconds = totalSeconds % 60;

        let uptime = `🗓️ ${days.toFixed()} dias\n🕒 ${hours.toFixed()} horas\n⏳ ${minutes.toFixed()} minutos\n⏲️ ${seconds.toFixed()} segundos`;

        // Cria o embed
        const embed = new EmbedBuilder()
            .setTitle('Tempo de Atividade 🕰️')
            .setThumbnail('https://imgur.com/WZMylbw.gif')
            .setColor('#FF0000')
            .setDescription(`**Estou online há:**\n${uptime}`);

        // Envia a mensagem com o embed
        message.channel.send({ embeds: [embed] });
    }
};
