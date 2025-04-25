const { PermissionsBitField, EmbedBuilder } = require('discord.js'); // Atualizado para discord.js v14
const config = require('../config.json'); // Corrigido o caminho do arquivo de configuração

module.exports = {
    name: 'nuke',
    aliases: ['nuked'],
    description: 'Clona o canal atual e exclui o original, efetivamente fazendo um "nuke".',
    async execute(client, message, args) {
        // Criação do embed para informar o uso do comando
        const embedUser = new EmbedBuilder()
            .setTitle('De nuke no chat')
            .setDescription(`**<a:botconfig:765311159460823091> Como usar?** \n\`${config.prefix}nuke\``)
            .addFields(
                { name: '<:botcanakk:771503918668447764> Exemplos', value: `\`${config.prefix}nuke\`` },
                { name: '<:Pink_Cadeado:770304704923566150> Permissão', value: '`Gerenciar canais`' },
                { name: '<:botonline:769701732128129074> Sinônimos', value: '`nuked`' }
            )
            .setFooter({ text: `Requisitado por: ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true, format: 'png' }) })
            .setTimestamp()
            .setColor(config.color || '#FF0000'); // Definido um fallback para a cor caso config.color esteja indefinido

        // Verifica se o usuário tem permissão para gerenciar canais
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.channel.send({ embeds: [embedUser] });
        }

        // Verifica se o bot tem permissão para gerenciar canais
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.reply('Eu não tenho permissão de `Gerenciar Canais`');
        }

        // Obtém o canal atual e suas propriedades
        const channel = message.channel;
        const position = channel.position;
        const topic = channel.topic;

        try {
            // Clona o canal
            const channel2 = await channel.clone();
            await channel2.setPosition(position);
            await channel2.setTopic(topic);
            await channel.delete();

            // Criação do embed para informar sobre o "nuke"
            const embed = new EmbedBuilder()
                .setTitle('Nuked')
                .setDescription('Canal nuked')
                .setFooter({ text: `Requisitado por: ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true, format: 'png' }) })
                .setImage('https://i.imgur.com/Rxlvu7g.gif')
                .setColor(config.color || '#FF0000') // Definido um fallback para a cor caso config.color esteja indefinido
                .setTimestamp();

            // Envia o embed no novo canal
            await channel2.send({ embeds: [embed] });
        } catch (error) {
            console.error('Erro ao executar o comando nuke:', error);
            message.channel.send('Ocorreu um erro ao tentar executar o comando.');
        }
    }
};
