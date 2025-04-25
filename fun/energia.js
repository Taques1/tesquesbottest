const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas } = require('canvas');

module.exports = {
  name: 'energia-puzzle',
  description: 'Conecte a energia até o destino em um labirinto!',

  execute: async (client, message, args) => {
    const userId = message.author.id;
    const gridSize = 6; // Tamanho da grade
    const totalCells = gridSize * gridSize;

    // Função para gerar direções aleatórias para cada célula
    function generateArrows() {
      const directions = ['⬆️', '⬇️', '⬅️', '➡️'];
      return Array(totalCells).fill(null).map(() => directions[Math.floor(Math.random() * directions.length)]);
    }

    // Função para gerar o labirinto e as barreiras
    function generateMaze() {
      const barriers = {
        horizontal: Array(gridSize).fill(null).map(() => Array(gridSize - 1).fill(true)),
        vertical: Array(gridSize - 1).fill(null).map(() => Array(gridSize).fill(true)),
      };

      const visited = Array(totalCells).fill(false);
      const stack = [0];
      visited[0] = true;

      while (stack.length > 0) {
        const current = stack[stack.length - 1];
        const x = current % gridSize;
        const y = Math.floor(current / gridSize);

        const neighbors = [];

        if (y > 0 && !visited[current - gridSize]) neighbors.push([current - gridSize, 'up']);
        if (y < gridSize - 1 && !visited[current + gridSize]) neighbors.push([current + gridSize, 'down']);
        if (x > 0 && !visited[current - 1]) neighbors.push([current - 1, 'left']);
        if (x < gridSize - 1 && !visited[current + 1]) neighbors.push([current + 1, 'right']);

        if (neighbors.length > 0) {
          const [next, direction] = neighbors[Math.floor(Math.random() * neighbors.length)];

          if (direction === 'up') barriers.vertical[y - 1][x] = false;
          if (direction === 'down') barriers.vertical[y][x] = false;
          if (direction === 'left') barriers.horizontal[y][x - 1] = false;
          if (direction === 'right') barriers.horizontal[y][x] = false;

          visited[next] = true;
          stack.push(next);
        } else {
          stack.pop();
        }
      }

      return barriers;
    }

    // Variáveis de estado
    const arrows = generateArrows();
    const gridState = Array(totalCells).fill(false); // false significa que o bloco não está energizado
    const barriers = generateMaze();
    const destinationIndex = totalCells - 1; // Índice do destino
    let currentArrowIndex = 0; // Índice do bloco atual
    gridState[currentArrowIndex] = true; // O primeiro bloco começa com a energia

    // Função para rotacionar a seta
    function rotateArrow(arrow) {
      const rotationOrder = ['⬆️', '➡️', '⬇️', '⬅️'];
      const currentIndex = rotationOrder.indexOf(arrow);
      return rotationOrder[(currentIndex + 1) % 4];
    }

    // Função para desenhar a grade
    function drawGrid() {
      const canvasSize = 600;
      const cellSize = canvasSize / gridSize;
      const canvas = createCanvas(canvasSize, canvasSize);
      const ctx = canvas.getContext('2d');

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const x = j * cellSize;
          const y = i * cellSize;
          const index = i * gridSize + j;

          const arrow = arrows[index];
          const isEnergized = gridState[index];
          const isCurrent = index === currentArrowIndex;
          const isDestination = index === destinationIndex;

          // Fundo
          if (isDestination) {
            ctx.fillStyle = '#FFD700'; // Amarelo para o destino
          } else if (isCurrent) {
            ctx.fillStyle = '#0000FF'; // Azul para a seta atual
          } else if (isEnergized) {
            ctx.fillStyle = '#4CAF50'; // Verde para energizadas
          } else {
            ctx.fillStyle = '#FFFFFF'; // Branco para não energizadas
          }
          ctx.fillRect(x, y, cellSize, cellSize);

          // Seta ou Raio no destino
          ctx.font = `${cellSize * 0.6}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#000000';
          ctx.fillText(isDestination ? '⚡' : arrow, x + cellSize / 2, y + cellSize / 2);

          // Borda
          ctx.strokeStyle = '#000000';
          ctx.strokeRect(x, y, cellSize, cellSize);
        }
      }

      // Barreiras desenhadas acima do fundo
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize - 1; j++) {
          const x = j * cellSize;
          const y = i * cellSize;

          // Barreiras horizontais
          if (barriers.horizontal[i][j]) {
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(x + cellSize, y);
            ctx.lineTo(x + cellSize, y + cellSize);
            ctx.stroke();
          }
        }
      }

      for (let i = 0; i < gridSize - 1; i++) {
        for (let j = 0; j < gridSize; j++) {
          const x = j * cellSize;
          const y = i * cellSize;

          // Barreiras verticais
          if (barriers.vertical[i][j]) {
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(x, y + cellSize);
            ctx.lineTo(x + cellSize, y + cellSize);
            ctx.stroke();
          }
        }
      }

      return canvas.toBuffer();
    }

    const imageBuffer = drawGrid();
    const attachment = new AttachmentBuilder(imageBuffer, { name: 'arrow-grid.png' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('rotate').setLabel('🔄').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('previous').setLabel('⬅️').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('next').setLabel('➡️').setStyle(ButtonStyle.Primary)
    );

    const embed = new EmbedBuilder()
      .setTitle('🔋 Enigma da Energia')
      .setDescription('Conecte a energia até o destino! Evite as barreiras vermelhas.')
      .setColor('#333333')
      .addFields({ name: 'Status:', value: '``` Azul: Atual | Verde: Energizado | Amarelo: Destino ```' })
      .setFooter({ text: 'Boa sorte!' });

    const msg = await message.channel.send({
      embeds: [embed],
      files: [attachment],
      components: [row]
    });

    const filter = (interaction) => interaction.user.id === userId;
    let timeout = 60000; // Tempo limite de 1 minuto de inatividade

    // Função para reiniciar o tempo de inatividade a cada interação
    const resetTimeout = () => {
      collector.resetTimer();
    };

    const collector = msg.createMessageComponentCollector({ filter, time: timeout });

    collector.on('collect', async (interaction) => {
      const buttonId = interaction.customId;

      if (buttonId === 'rotate') {
        arrows[currentArrowIndex] = rotateArrow(arrows[currentArrowIndex]);
      }

      if (buttonId === 'next' || buttonId === 'previous') {
        const direction = buttonId === 'next' ? 1 : -1;
        const currentX = currentArrowIndex % gridSize;
        const currentY = Math.floor(currentArrowIndex / gridSize);
        let nextIndex = -1;

        // Determinando o próximo índice baseado na direção e nas barreiras
        if (arrows[currentArrowIndex] === '⬆️' && currentY > 0 && !barriers.vertical[currentY - 1][currentX]) {
          nextIndex = currentArrowIndex - gridSize;
        } else if (arrows[currentArrowIndex] === '⬇️' && currentY < gridSize - 1 && !barriers.vertical[currentY][currentX]) {
          nextIndex = currentArrowIndex + gridSize;
        } else if (arrows[currentArrowIndex] === '⬅️' && currentX > 0 && !barriers.horizontal[currentY][currentX - 1]) {
          nextIndex = currentArrowIndex - 1;
        } else if (arrows[currentArrowIndex] === '➡️' && currentX < gridSize - 1 && !barriers.horizontal[currentY][currentX]) {
          nextIndex = currentArrowIndex + 1;
        }

        if (nextIndex !== -1) {
          gridState[currentArrowIndex] = false;
          currentArrowIndex = nextIndex;
          gridState[currentArrowIndex] = true;
        }
      }

      // Verificar se o jogador chegou ao destino
      if (currentArrowIndex === destinationIndex) {
        embed.setDescription('🎉 Você chegou ao destino! Parabéns, você venceu o enigma da energia! 🎉');
        row.components.forEach((button) => button.setDisabled(true)); // Desabilitar botões
        collector.stop(); // Encerrar a coleta de interações
      }

      resetTimeout(); // Reiniciar o tempo de inatividade

      const imageBuffer = drawGrid();
      const attachment = new AttachmentBuilder(imageBuffer, { name: 'arrow-grid.png' });

      await interaction.update({
        embeds: [embed],
        files: [attachment],
        components: [row]
      });
    });

    collector.on('end', () => {
      msg.edit({ components: [] }); // Remove os botões após o tempo limite
    });
  },
};
