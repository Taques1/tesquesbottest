const { QuickDB } = require('quick.db');
const { EmbedBuilder } = require('discord.js');
const emotes = require('../emotes.json');
const db = new QuickDB();

const roles = [
    {
        name: 'Cafetão',
        roleID: '810949799671103568',
        dailyIncome: 1500,
    },
    {
        name: 'Dono da Boca',
        roleID: '970783056485023744',
        dailyIncome: 2000,
    },
    {
        name: 'Empresário',
        roleID: '810949798902759495',
        dailyIncome: 2500,
    },
    {
        name: 'Agiota',
        roleID: '810949795454910544',
        dailyIncome: 5000,
    },
    {
        name: 'Imperador',
        roleID: '810949794293219339',
        dailyIncome: 10000,
    },
    {
        name: 'Mestre',
        roleID: '810949765058920459',
        dailyIncome: 50000,
    },
];

const GOLDEN_KEY = 'chave de ouro'; // Nome do item "Chave de Ouro"

module.exports = {
    name: 'collect',
    description: 'Colete o dinheiro diário de todos os seus cargos',
    execute: async (client, message, args) => {
        const useGoldenKey = args.includes('key'); // Verifica se o usuário quer usar a Chave de Ouro
        const userId = message.author.id;
        const userRoles = message.member.roles.cache;
        const currentTime = Date.now();
        let totalIncome = 0;
        let collectedDetails = [];
        let earliestNextCollectTime = null;

        // Verifica se o usuário tem a Chave de Ouro
        const goldenKeyCount = await db.get(`inventory_${userId}.${GOLDEN_KEY}`) || 0;

        if (useGoldenKey && goldenKeyCount <= 0) {
            return message.channel.send('Você não tem Chaves de Ouro suficientes.');
        }

        // Inicializa um objeto para rastrear o próximo tempo de coleta para cada cargo
        const roleCollectTimes = {};

        for (const role of roles) {
            if (userRoles.has(role.roleID)) {
                const lastCollect = await db.get(`lastCollect_${userId}_${role.roleID}`);
                const timePassed = currentTime - (lastCollect || 0);
                const timeUntilNextCollect = 24 * 60 * 60 * 1000 - timePassed;

                if (timePassed >= 24 * 60 * 60 * 1000) {
                    // Coleta normal
                    totalIncome += role.dailyIncome;
                    collectedDetails.push({
                        roleID: role.roleID,
                        name: role.name,
                        income: role.dailyIncome,
                    });
                    await db.add(`wallet_${userId}`, role.dailyIncome);
                    await db.set(`lastCollect_${userId}_${role.roleID}`, currentTime);
                } else if (useGoldenKey && goldenKeyCount > 0) {
                    // Coleta adicional com a Chave de Ouro
                    totalIncome += role.dailyIncome;
                    collectedDetails.push({
                        roleID: role.roleID,
                        name: role.name,
                        income: role.dailyIncome,
                    });
                    await db.add(`wallet_${userId}`, role.dailyIncome);

                    // Diminui a quantidade da Chave de Ouro
                    await db.sub(`inventory_${userId}.${GOLDEN_KEY}`, 1);
                } else {
                    // Atualiza o próximo tempo de coleta mais próximo
                    if (!earliestNextCollectTime || timeUntilNextCollect < earliestNextCollectTime) {
                        earliestNextCollectTime = timeUntilNextCollect;
                    }
                }
            }
        }

        if (totalIncome > 0) {
            const embed = new EmbedBuilder()
                .setTitle('💰 Coleta de Dinheiro Diária')
                .setDescription(
                    `Você coletou um total de ${emotes.moeda}${totalIncome} de todos os seus cargos:\n\n` +
                    collectedDetails.map(detail => 
                        `<@&${detail.roleID}> - ${emotes.moeda}${detail.income}`
                    ).join('\n') +
                    `\n\nVolte em 24 horas para coletar novamente!`
                )
                .setColor('Gold');

            return message.channel.send({ embeds: [embed] });
        } else if (earliestNextCollectTime !== null) {
            const hours = Math.floor(earliestNextCollectTime / (1000 * 60 * 60));
            const minutes = Math.floor((earliestNextCollectTime % (1000 * 60 * 60)) / (1000 * 60));

            const embed = new EmbedBuilder()
                .setTitle('🔄 Sem Coleta Disponível')
                .setDescription(
                    `Você não pode coletar o dinheiro diário ainda. Volte em **${hours} horas e ${minutes} minutos** para coletar novamente.` +
                    (goldenKeyCount > 0 ? `\n\nVocê tem ${goldenKeyCount} Chave(s) de Ouro. Use \`!collect key\` para coletar novamente usando uma Chave de Ouro.` : '')
                )
                .setColor('Red');

            return message.channel.send({ embeds: [embed] });
        } else {
            const embed = new EmbedBuilder()
                .setTitle('🔄 Sem Coleta Disponível')
                .setDescription(`Você não tem cargos elegíveis para coleta no momento.`)
                .setColor('Red');

            return message.channel.send({ embeds: [embed] });
        }
    },
};
