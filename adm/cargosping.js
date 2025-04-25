    const { EmbedBuilder } = require('discord.js');

    exports.execute = async (client, message, args) => {
        const embed = new EmbedBuilder()
            .setColor('#6602fa')
            .setAuthor({ name: '◈ ━━━━━━« pings »━━━━━━ ◈' })
            .setDescription([
                '👥➥<@&829140579560062987>', // Alerta de Aliados??
                '📢➥<@&814242432643760178>', // Guardião dos Avisos
                '🎉➥<@&817851718619889724>', // Emissário de Premiações
                '🎮➥<@&831968075149607002>', // Taverna dos Jogos
                '🍿➥<@&829140587297898518>', // Anfiteatro das Telas
                '💀➥<@&817822097127637023>', // Necromancer do Chat
                '🛡️➥<@&817824142048886785>'  // Guardas do Portão
            ].join('\n'));

        const embedMessage = await message.channel.send({ embeds: [embed] });

        const emojis = ['👥', '📢', '🎉', '🎮', '🍿', '💀', '🛡️'];
        const roleIds = [
            
        ];

        const filter = (reaction, user) => {
            return emojis.includes(reaction.emoji.name) && !user.bot;
        };

        const collector = embedMessage.createReactionCollector({ filter, dispose: true });

        collector.on('collect', async (reaction, user) => {
            const roleIndex = emojis.indexOf(reaction.emoji.name);
            const role = message.guild.roles.cache.get(roleIds[roleIndex]);
            if (role) {
                const member = await message.guild.members.fetch(user.id);
                await member.roles.add(role).catch(console.error);
            }
        });

        collector.on('remove', async (reaction, user) => {
            const roleIndex = emojis.indexOf(reaction.emoji.name);
            const role = message.guild.roles.cache.get(roleIds[roleIndex]);
            if (role) {
                const member = await message.guild.members.fetch(user.id);
                await member.roles.remove(role).catch(console.error);
            }
        });
    };
