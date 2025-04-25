const { PermissionsBitField, EmbedBuilder } = require('discord.js'); // Atualização para discord.js v14

module.exports = {
    name: 'clear',
    category: 'moderation',
    description: 'Deleta uma quantidade de mensagens especificada.',
    async execute(client, message, args) {
        // Verifica se o usuário tem permissão para gerenciar mensagens
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return message.channel.send(
                `Você não tem permissão para usar este comando, ${message.author.username}`
            ).then(msg => setTimeout(() => msg.delete(), 5000));
        }

        // Verifica se o número de mensagens a serem deletadas foi especificado
        if (!args[0]) {
            return message.channel.send('Selecione um número de 1 a 100').then(msg => setTimeout(() => msg.delete(), 5000));
        }

        // Determina a quantidade de mensagens a serem deletadas
        let deleteAmount = parseInt(args[0], 10);

        // Verifica se o valor inserido é válido
        if (isNaN(deleteAmount) || deleteAmount < 1) {
            return message.channel.send('O número deve ser um valor entre 1 e 100').then(msg => setTimeout(() => msg.delete(), 5000));
        }
        if (deleteAmount > 100) {
            deleteAmount = 100;
        }

        // Exclui a mensagem de comando para não ser contada nas mensagens a serem deletadas
        await message.delete().catch(error => console.error('Erro ao deletar a mensagem do comando:', error));

        try {
            // Busca as mensagens do canal
            const fetchedMessages = await message.channel.messages.fetch({ limit: deleteAmount });

            // Deleta as mensagens
            await message.channel.bulkDelete(fetchedMessages, true);

            // Cria um embed para informar sobre as mensagens deletadas
            const embed = new EmbedBuilder()
                .setTitle(`Limpeza de Mensagens`)
                .setThumbnail(message.author.displayAvatarURL())
                .setDescription(`Mensagens deletadas: ${deleteAmount}`)
                .setFooter({ text: message.author.username, iconURL: message.author.displayAvatarURL() })
                .setColor('#f2f2f2');

            // Envia o embed para o canal
            const sentMessage = await message.channel.send({ embeds: [embed] });

            // Exclui o embed após 10 segundos
            setTimeout(async () => {
                try {
                    await sentMessage.delete();
                } catch (error) {
                    console.error('Erro ao deletar embed:', error);
                }
            }, 10000);

        } catch (error) {
            console.error('Erro ao deletar mensagens:', error);
            if (error.code === 10008) {
                return message.channel.send('Algumas mensagens não foram encontradas ou já foram deletadas.').then(msg => setTimeout(() => msg.delete(), 5000));
            } else {
                return message.channel.send('Ocorreu um erro ao tentar deletar as mensagens.').then(msg => setTimeout(() => msg.delete(), 5000));
            }
        }
    }
};
