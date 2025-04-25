const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'minigame',
    description: 'Um minigame de sequência 3x3.',
    async execute(client, message) {
        const gridSize = 3;
        const maxPhases = 5;
        let currentSequence = [];
        let userInput = [];
        let currentPhase = 0;
        let gameMessage;
        let highlightDelay = 1000; // Tempo inicial (1 segundo)

        // Função para gerar o tabuleiro de botões
        const generateGrid = (highlightedIndex = null, disabled = false, userCorrectIndex = null) => {
            const rows = [];
            for (let i = 0; i < gridSize; i++) {
                const row = new ActionRowBuilder();
                for (let j = 0; j < gridSize; j++) {
                    const index = i * gridSize + j;
                    let style = ButtonStyle.Secondary; // Cinza padrão
                    if (highlightedIndex === index) style = ButtonStyle.Success; // Verde ao destacar sequência
                    if (userCorrectIndex === index) style = ButtonStyle.Primary; // Azul ao clicar corretamente

                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId(index.toString())
                            .setLabel('⬜') // Quadrado cinza
                            .setStyle(style)
                            .setDisabled(disabled) // Define se os botões estão ativos
                    );
                }
                rows.push(row);
            }
            return rows;
        };

        // Função para iniciar uma nova fase
        const startPhase = async () => {
            currentPhase++;
            userInput = [];
            if (currentPhase > maxPhases) {
                await gameMessage.edit({
                    content: '🎉 Parabéns! Você completou todas as fases!',
                    components: []
                });
                return;
            }

            // Adicionar um novo índice à sequência (uma única sequência por fase)
            let newIndex;
            do {
                newIndex = Math.floor(Math.random() * gridSize * gridSize);
            } while (currentSequence.includes(newIndex));
            currentSequence.push(newIndex);

            // Mostrar a sequência ao jogador
            for (let i = 0; i < currentSequence.length; i++) {
                await gameMessage.edit({
                    content: `🎮 Fase ${currentPhase}: Memorize a sequência!`,
                    components: generateGrid(currentSequence[i], true)
                });
                await new Promise((resolve) => setTimeout(resolve, highlightDelay)); // Pausa ajustável
                await gameMessage.edit({
                    content: `🎮 Fase ${currentPhase}: Memorize a sequência!`,
                    components: generateGrid(null, true)
                });
                await new Promise((resolve) => setTimeout(resolve, 300)); // Pequena pausa entre os destaques
            }

            // Reduz o tempo de destaque a cada fase (agora mais rápido)
            highlightDelay = Math.max(200, highlightDelay - 200); // Agora diminui 200ms por fase, mínimo de 200ms

            // Jogador deve repetir a sequência
            await gameMessage.edit({
                content: `✅ Sua vez! Repita a sequência na ordem.`,
                components: generateGrid(null, false)
            });
        };

        // Função para processar o clique do jogador
        const handleUserInput = async (interaction) => {
            try {
                // Verificar se a interação é válida
                if (!interaction.isButton()) return;

                const index = parseInt(interaction.customId);
                userInput.push(index);

                // Se a interação já foi respondida, não faz mais nada
                if (interaction.replied || interaction.deferred) {
                    return;
                }

                // Atualiza o botão para azul, indicando que foi pressionado
                await interaction.deferUpdate();  // Esse comando garante que a interação não expire
                await interaction.editReply({
                    content: `🎮 Fase ${currentPhase}: Memorize a sequência!`,
                    components: generateGrid(null, false, index) // Passa o índice do botão para ser colorido de azul
                });

                // Verificar se a entrada está correta
                for (let i = 0; i < userInput.length; i++) {
                    if (userInput[i] !== currentSequence[i]) {
                        await gameMessage.edit({
                            content: `❌ Você errou! Fase alcançada: ${currentPhase}.`,
                            components: []
                        });
                        return;
                    }
                }

                // Se completou a sequência, avançar de fase
                if (userInput.length === currentSequence.length) {
                    await gameMessage.edit({
                        content: `🎉 Sequência correta! Prepare-se para a próxima fase...`,
                        components: generateGrid(null, true)
                    });
                    setTimeout(startPhase, 2000); // Espera antes de começar a próxima fase
                }
            } catch (error) {
                console.error('Erro ao processar interação:', error);
            }
        };

        // Enviar mensagem inicial com o tabuleiro
        gameMessage = await message.channel.send({
            content: 'Clique em "Play" para começar o jogo!',
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('start')
                        .setLabel('▶️ Play')
                        .setStyle(ButtonStyle.Success)
                )
            ]
        });

        // Criar coletor de interações
        const collector = gameMessage.createMessageComponentCollector({
            time: 60000 * 5 // 5 minutos
        });

        collector.on('collect', async (interaction) => {
            try {
                // Verificar se a interação foi respondida ou não
                if (interaction.customId === 'start') {
                    await interaction.deferUpdate(); // Garante que a interação não expira
                    await interaction.editReply({
                        content: '🎮 Prepare-se para a primeira fase!',
                        components: generateGrid(null, true)
                    });
                    startPhase();
                } else {
                    await handleUserInput(interaction);
                }
            } catch (error) {
                console.error('Erro ao coletar interação:', error);
            }
        });

        collector.on('end', async () => {
            await gameMessage.edit({
                content: '⏳ Tempo esgotado! O jogo foi encerrado.',
                components: []
            });
        });
    }
};
