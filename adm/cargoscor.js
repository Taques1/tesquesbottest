const {
    EmbedBuilder
} = require('discord.js');
const emotes = require("../emotes.json");

exports.execute = async (client, message) => {
    console.log("Comando de cargos de cor iniciado!");

    const emojis = [
        emotes.branco, emotes.rosaclaro, emotes.rosa, emotes.vermelho, emotes.laranja, 
        emotes.amarelo, emotes.verde_limao, emotes.verde, emotes.verdeaqua,                     emotes.azulclaro, emotes.azul, emotes.roxo, emotes.preto
        
    ];

    const roleIdsPrimary = [
        '1357857398018019518', '812313588307853352', '810949775129837620',
        '810949772483100763',  '810949771698110464', '810949773220642848',
        '1365087693339361421', '810949779177734175', '810949778195742721',
        '810949776228876308',  '810949777160273940', '810949774530183199',
        '810949770696065064'
        
          
          
          
    ];

    const roleIdsFallback = [
        '1357847105724481609', '1357443911001571671', '1357443905599176925',
        '1357443895679516803', '1357443903556423732', '1357443894803169494', 
        '1365093156198027264', '1357443904097751271', '1357443908237529271',
        '1357443907386085528', '1357443906270265656', '1357443897239932958',
        '1357443893678833665'
        
         
          
          
         
    ];

    const roleIds = roleIdsPrimary.map((id, i) => {
        const role = message.guild.roles.cache.get(id);
        if (role) return id;

        const fallbackRole = message.guild.roles.cache.get(roleIdsFallback[i]);
        if (fallbackRole) return roleIdsFallback[i];

        return null;
    });

    console.log("Emojis e cargos carregados!");

    const embed = new EmbedBuilder()
        .setColor('#ffce57')
        .setAuthor({ name: '◈ ━━━━« Cores Padrão »━━━━ ◈' })
        .setDescription(emojis.map((emoji, i) => {
            const roleId = roleIds[i];
            return roleId ? `${emoji} <@&${roleId}>` : `${emoji} *(cargo indisponível)*`;
        }).join('\n'));

    await message.channel.send({ embeds: [embed] });
    console.log("Mensagem de cores enviada sem botões!");
};


