const { Client, GatewayIntentBits, MessageEmbed } = require('discord.js');
const express = require('express');
const fs = require('fs');
const path = require('path');

// Importando o prefixo do config.json
const config = require('./config.json');

// Configuração do Express
const app = express();
app.get('/', (request, response) => {
    const ping = new Date();
    ping.setHours(ping.getHours() - 3);
    console.log(
        `Ping recebido às ${ping.getUTCHours()}:${ping.getUTCMinutes()}:${ping.getUTCSeconds()}`
    );
    response.sendStatus(200);
});

app.listen(process.env.PORT || 3000, () => {
    console.log('Servidor Express rodando');
});

// Configurando o cliente Discord com intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions // NECESSÁRIO
    ],
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'] // NECESSÁRIO
});


// Função para carregar comandos dinamicamente
const getCommand = (commandName) => {
    const commandFolders = ['adm', 'caos', 'commands', 'econ', 'fun', 'util'];
    for (const folder of commandFolders) {
        const commandPath = path.join(__dirname, folder, `${commandName}.js`);
        if (fs.existsSync(commandPath)) {
            return require(commandPath);
        }
    }
    return null;
};

// Evento de inicialização do cliente
client.on('ready', () => {
    console.log(`Bot iniciado como ${client.user.tag}`);
    client.user.setActivity('Disponível para ajudar!', { type: 'WATCHING' });
});

// Eventos de mensagem
client.on('messageCreate', async message => {
    if (message.author.bot || message.channel.type === 'dm') return;
    if (!message.content.toLowerCase().startsWith(config.prefix.toLowerCase())) return;

    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const commandFile = getCommand(commandName);
    if (!commandFile) {
        const responseMessage = await message.channel.send(`Comando **${commandName}** não encontrado!`);
        console.log('Mensagem de comando não encontrado enviada.');

        // Define um timeout para excluir a mensagem após 60 segundos
        setTimeout(() => {
            responseMessage.delete().catch(err => console.error('Erro ao excluir a mensagem:', err));
        }, 60000); // 60 segundos
        return;
    }

    try {
        commandFile.execute(client, message, args); // Usando `execute` em vez de `run`
    } catch (error) {
        console.error(error);
        message.channel.send('Erro ao executar o comando!');
    }
});

// Outros eventos do cliente
client.on('guildMemberAdd', member => {
    const role = member.guild.roles.cache.find(role => role.name === "Novo Membro");
    if (role) member.roles.add(role);
});

client.on('guildCreate', guild => {
    let channel = guild.channels.cache.find(ch => ch.type === "text" && ch.permissionsFor(guild.me).has("SEND_MESSAGES"));
    if (channel) channel.send("Obrigado por me adicionar!");
});

client.on('messageCreate', message => {
    if (message.author.bot) return;
    if (message.channel.type == 'dm') return;
    if (message.content == `<@${client.user.id}>` || message.content == `<@!${client.user.id}>`) {
        return message.channel.send(`Olá ${message.author}, meu prefixo é ${config.prefix}`);
    }
});


// Login do cliente Discord
client.login(process.env.DISCORD_TOKEN);
