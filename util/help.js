const { Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, IntentsBitField } = require('discord.js');
const config = require("../config.json");
const emotes = require("../emotes.json");

module.exports = {
  name: 'comandos',
  description: 'Mostra comandos do bot com navegação por botões.',
  async execute(client, message, args) {

    // Criação do embed inicial
    const initialEmbed = new EmbedBuilder()
      .setColor('#000000') // Preto
      .setAuthor({ name: 'Taques Bot', iconURL: client.user.displayAvatarURL() })
      .setTitle('Oi, eu sou o Taques Bot! Espero que goste de mim.')
      .setDescription('**Reaja de acordo com o que procura!**\n\n⚙️ - Administração\n📚 - Gerais\n🎉 - Diversão\n🖼️ - Imagem\n💰 - Economia')
      .setImage('https://i.imgur.com/jaaYyNK.png')
      .setFooter({ text: `Comando solicitado por ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    // Criação dos botões
    const buttons = [
      new ButtonBuilder()
        .setCustomId('admin')
        .setLabel('⚙️')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId('gerais')
        .setLabel('📚')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId('diversao')
        .setLabel('🎉')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId('imagem')
        .setLabel('🖼️')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId('economia')
        .setLabel('💰')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId('voltar')
        .setLabel('Voltar')
        .setEmoji('🔙')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true) // Desabilitado no início
    ];

    // Divisão dos botões em linhas (máximo 5 por linha)
    const row = new ActionRowBuilder().addComponents(buttons.slice(0, 5));
    const row2 = new ActionRowBuilder().addComponents(buttons.slice(5));

    // Envio da mensagem inicial com os botões
    const sentMessage = await message.channel.send({ embeds: [initialEmbed], components: [row, row2] });

    // Filtro para coletar interações apenas do autor da mensagem original
    const filter = (interaction) => interaction.user.id === message.author.id;

    // Criação do coletor de interações
    const collector = sentMessage.createMessageComponentCollector({ filter, time: 600000 }); // 10 minutos

    collector.on('collect', async (interaction) => {
      // Previne qualquer interação de outros usuários
      await interaction.deferUpdate();

      let embedResponse;

      switch (interaction.customId) {
        case 'admin':
          embedResponse = new EmbedBuilder()
            .setColor('#5865F2') // Azul Discord
            .setTitle('⚙️ Comandos de Administração')
            .setDescription(`
**!tban** <@user> - Bana um usuário do servidor.
**!tlistban** - Lista de pessoas e bots banidos.
**!tkick** <@user> <motivo> - Expulse o usuário do servidor.
**!tclear** <1 a 100> - Exclua mensagens do canal.
**!tnuke** - Exclui todas as mensagens do canal.
**!twarn** <@user> <motivo> - Avisa o usuário.
**!tunwarn** <@user> - Remove os avisos do membro.
**!tlock** - Bloqueia o canal.
**!tunlock** - Desbloqueia o canal bloqueado.
**!tenquete** <mensagem> - Cria uma enquete.
**!tsorteio** <tempo> <canal> <prêmio> - Inicia um sorteio.
            `)
            .setFooter({ text: `Comandos de Administração | Solicitado por ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();
          break;

        case 'gerais':
          embedResponse = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('📚 Comandos Gerais')
            .setDescription(`
**!tavatar** - Mostra seu avatar.
**!tclima** <cidade> - Veja a previsão do tempo.
**!tservericon** - Mostra a imagem do servidor.
**!tbotinfo** - Veja as minhas informações.
**!tuserinfo** - Veja as informações de um membro.
**!tserverinfo** - Veja as informações do servidor.
**!tsay** <mensagem> - O bot repetirá a mensagem.
**!tping** - Ver a latência do bot.
**!thelp** - Lista de comandos.
**!tideia** <mensagem> - Envie uma sugestão.
**!tuptime** - Veja há quanto tempo estou online.
            `)
            .setFooter({ text: `Comandos Gerais | Solicitado por ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();
          break;

        case 'diversao':
          embedResponse = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🎉 Comandos de Diversão')
            .setDescription(`
**!t8ball** <pergunta> - Responde sua pergunta.
**!taplaudir** <@user> - Aplauda um usuário.
**!tcoinflip** - Cara ou coroa?
**!tfaustão** - Frases do Faustão.
**!tfeed** <@user> - Alimente um usuário.
**!thomo** - Quão gay você é?
**!tgoularte** <mensagem> - Faça o Goularte falar algo.
**!thug** <@user> - Abrace um usuário.
**!tjokempo** <escolha> - Jogue pedra, papel ou tesoura.
**!tkiss** <@user> - Beije um usuário.
**!tpat** <@user> - Faça carinho em um usuário.
**!tpunch** <@user> - Bata em um usuário.
**!trun** - Corra!
**!tship** <@user> <@user> - Shippe usuários.
**!tshy** - Mostre que está tímido.
**!tslap** <@user> - Dê um tapa em um usuário.
            `)
            .setFooter({ text: `Comandos de Diversão | Solicitado por ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();
          break;

        case 'imagem':
          embedResponse = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🖼️ Comandos de Imagem')
            .setDescription(`
**!tbeautiful** <@user> - Mostra o quão lindo alguém é.
**!tcmm** <mensagem> - Mude minha ideia.
**!tenfim** <mensagem> - Mostre a hipocrisia.
**!tgay** - Veja o quão gay você é em imagens.
**!tlaranjo** <mensagem> - Laranjo repete sua mensagem.
**!tpetpet** <@user> - Faça carinho em alguém.
**!tprimeiraspalavras** <mensagem> - Primeiras palavras do bebê.
**!tstonks** <@user> - Meme Stonks.
**!ttobecontinued** - Meme "To be continued".
**!ttrigger** - TRIGGERED!
            `)
            .setFooter({ text: `Comandos de Imagem | Solicitado por ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();
          break;

        case 'economia':
          embedResponse = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('💰 Comandos de Economia')
            .setDescription(`
**!work** - Trabalhe para ganhar dinheiro.
**!rob** <@user> - Roube dinheiro de alguém.
**!bal** - Veja o seu saldo.
**!dep** <quantia> - Deposite dinheiro no banco.
**!wit** <quantia> - Retire dinheiro do banco.
**!pay** <quantia> <@user> - Pague alguem.
**!rank** - Veja o ranking dos mais ricos.
**!inv** - Veja o seu inventario.
**!perfil** - Veja o seu perfil.
**!shop** - Veja o catalogo.
**!buy** <item> - Compre itens com seu dinheiro.
**!collect** - Colete o dinheiro dos seus cargos.
**!rinha** <aposta> - Faça uma rinha de galos.
**!slot** <aposta> - Jogue na máquina caça-níqueis.
**!rr** <aposta> - Jogue Roleta Russa.
**!21** <aposta> - Jogue um blackjack.
**!mines** <aposta> - Jogue um campo minado.
**!pescar** - Pesque peixes.
**!bau** - Abra os seus baus.
**!raspadinha** - Tente a sorte com raspadinhas.
**!roulette** - Jogue na roleta.
**!conquistas** - Veja as suas conquistas.
            `)
            .setFooter({ text: `Comandos de Economia | Solicitado por ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();
          break;

        case 'voltar':
          embedResponse = initialEmbed;
          break;

        default:
          embedResponse = initialEmbed;
          break;
      }

      // Habilita o botão "Voltar" após a primeira interação
      const updatedButtons = buttons.map(btn => {
        if (btn.data.custom_id === 'voltar') {
          return ButtonBuilder.from(btn).setDisabled(false);
        }
        return btn;
      });

      const updatedRow = new ActionRowBuilder().addComponents(updatedButtons.slice(0, 5));
      const updatedRow2 = new ActionRowBuilder().addComponents(updatedButtons.slice(5));

      await interaction.editReply({ embeds: [embedResponse], components: [updatedRow, updatedRow2] });
    });

    collector.on('end', () => {
      // Desabilita todos os botões após o término do coletor
      const disabledButtons = buttons.map(btn => ButtonBuilder.from(btn).setDisabled(true));
      const disabledRow = new ActionRowBuilder().addComponents(disabledButtons.slice(0, 5));
      const disabledRow2 = new ActionRowBuilder().addComponents(disabledButtons.slice(5));

      sentMessage.edit({ components: [disabledRow, disabledRow2] }).catch(console.error);
    });
  },
};
