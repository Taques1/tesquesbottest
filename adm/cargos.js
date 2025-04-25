const { EmbedBuilder } = require('discord.js');

exports.execute = async (client, message, args) => {
    const embed = new EmbedBuilder()
        .setColor('#daa520')
        .setAuthor({ name: '◈ ━━━━« Cargos XP »━━━━ ◈' })
        .setDescription([
            `<@&810949792158974053> 》 — 0 XP`,
            `<@&842347019627921439> 》 — 200 XP`,
            `<@&810949791089557516> 》 — 500 XP`,
            `<@&811009309655302165> 》 — 1000 XP`,
            `<@&810949789826547752> 》 — 3000 XP`,
            `<@&828365904013819904> 》 — 5000 XP`,
            `<@&810949780712456213> 》 — 7000 XP`,
            `<@&810949788723314708> 》 — 10000 XP`,
            `<@&810949781651849267> 》 — 15000 XP`
        ].join('\n'));

    await message.channel.send({ embeds: [embed] });
};
