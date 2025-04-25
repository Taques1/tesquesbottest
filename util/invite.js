const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'adicionar',  // Certifique-se de que o nome corresponde ao comando usado
    description: 'Gera um link para adicionar o bot em outros servidores.',
    execute: (client, message, args) => {
        let link = 'https://discord.com/oauth2/authorize?client_id=794799824977264730&scope=bot&permissions=805314622';
        
        const embed = new EmbedBuilder()
            .setAuthor({ name: '🤖Me adicione!' })
            .setDescription(`Me ajude a fazer mais servidores felizes👉👈! [Clique aqui](${link}) e me adicione em seu servidor!`)
            .setColor('#C5EAFF')
            .setFooter({ text: `• Autor: ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ format: "png" }) });
        
        message.channel.send({ embeds: [embed] });
    }
};
