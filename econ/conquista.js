const { EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');

const db = new QuickDB();

module.exports = {
  name: 'conquistas',
  description: 'Mostra as conquistas que você obteve.',
  execute: async (client, message, args) => {
    const userId = message.author.id;

    // Obtém as conquistas do usuário
    const achievements = await db.get(`achievements_${userId}`) || {};

    // Mapeia as conquistas obtidas
    const achievementList = [
      { name: 'Pesque um Peixe Lendário', key: 'fish_legendary' },
      { name: 'Baú Lendário', key: 'legendary_chest' },
      { name: 'Mil Comandos', key: 'thousand_commands' },
      { name: 'Jackpot', key: 'jackpot' }
      // Adicione outras conquistas aqui com { name: 'Nome da Conquista', key: 'chave_da_conquista' }
    ];

    let description = 'Você ainda não obteve nenhuma conquista.';

    // Se houver conquistas, monta a descrição
    if (Object.keys(achievements).length > 0) {
      description = achievementList
        .filter(ach => achievements[ach.key])
        .map(ach => `🏆 ${ach.name}`)
        .join('\n');
    }

    // Cria o embed de resposta
    const embed = new EmbedBuilder()
      .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
      .setColor('#FFD700') // Dourado para representar conquistas
      .setTitle('🏅 Suas Conquistas')
      .setDescription(description);

    // Envia a resposta
    await message.channel.send({ embeds: [embed] });
  }
};
