const { EmbedBuilder } = require('discord.js');
const emotes = require("../emotes.json");

exports.execute = async (client, message) => {
    console.log("Comando de cargos de cor iniciado (sem botões)!");

    const emojis = [
        emotes.retrogoldenyellow,
        emotes.RetroDandelion,
        emotes.RetroDarkSeaGreen,
        emotes.RetroOceanGreen,
        emotes.RetroAquamarine,
        emotes.RetroBlueJeans,
        emotes.apatita,
        emotes.RetroGrape,
        emotes.RetroVioletsAreBlue,
        emotes.RetroLavenderIndigo,
        emotes.RetroBakerMillerPink,
        emotes.RetroIrresistible,
        emotes.RetroRustyRed
    ];

    const roleIdsPrimary = [
        '1173448494116241609', '1173448641432784957', '1173448862615220284',
        '1173448967896436737', '1173449065455943680',
        '1173449256850436156', '1357855311284801646',
        '1173449323749580831', '1173449445703176274', '1173449512371634207',
        '1173449589970444360', '1173449695289425950', '1173449748322189382'
    ];

    const roleIdsFallback = [
        '1357443878986187024', '1357443879800017079', '1357443881091858713',
        '1357443882106880243', '1357443883511844965', '1357443884862406857',
        '1357821833117696140', '1357443886653636739', '1357443887483850803',
        '1357443888452731093', '1357443889719414945', '1357443890906398871',
        '1357443892513083664'
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
        .setColor('#8A2BE2') // Roxo retro
        .setAuthor({ name: '◈ ━━━━« Cores Avançadas »━━━━ ◈' })
        .setDescription(emojis.map((emoji, i) => {
            const roleId = roleIds[i];
            return roleId ? `${emoji} <@&${roleId}>` : `${emoji} *(cargo indisponível)*`;
        }).join('\n'));

    await message.channel.send({ embeds: [embed] });
    console.log("Mensagem de visualização enviada com sucesso!");
};
