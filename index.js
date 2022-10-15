/* eslint-disable no-mixed-spaces-and-tabs */
const { Client, GatewayIntentBits, AttachmentBuilder, EmbedBuilder, Colors, REST, SlashCommandBuilder, Routes, PermissionFlagsBits  } = require('discord.js');
const { clientId, guildId, token, pointspermsg } = require('./config.json');
const Levels = require('discord-xp');


const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const commands = [
	new SlashCommandBuilder().setName('points').setDescription('Replies with users points!'),
	new SlashCommandBuilder().setName('leaderboard').setDescription('Replies with the server points leaderboard!'),
	new SlashCommandBuilder().setName('pointsadd').setDescription('Add x points to users account').addUserOption(option => option.setName('user').setDescription('The user you want to add points to!').setRequired(true)).addIntegerOption(op => op.setName('amount').setDescription('The amount of points you want to give the user!').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	new SlashCommandBuilder().setName('pointsremove').setDescription('Remove x points from users account').addUserOption(option => option.setName('user').setDescription('The user you want to remove points from!').setRequired(true)).addIntegerOption(op => op.setName('amount').setDescription('The amount of points you want to take from the user!').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	new SlashCommandBuilder().setName('pointsreset').setDescription('Add x points to users account').addUserOption(option => option.setName('user').setDescription('The user you want to add points to!').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
]
	.map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
	.then((data) => console.log(`Successfully registered ${data.length} application commands.`))
	.catch(console.error);

Levels.setURL('mongodb+srv://main:admin@points.sm8de68.mongodb.net/?retryWrites=true&w=majority');


client.once('ready', () => {
	console.log('Ready!');
});

client.on('messageCreate', async message => {
	if (message.author.bot) return;

	if(Levels.fetch(message.author.id, message.guild.id) == null) Levels.createUser(message.author.id, message.guild.id);

	Levels.appendXp(message.author.id, message.guild.id, pointspermsg);

});

client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const { commandName } = interaction;

	if (commandName === 'ping') {
		await interaction.reply('Pong!');
	}
	if (commandName === 'points') {
		const user = await Levels.fetch(interaction.member.user.id, interaction.guild.id, true);
		
		const embed = new EmbedBuilder()
			.setTitle(interaction.user.username + "\'s Points")
			.setThumbnail(interaction.member.displayAvatarURL())
			.setDescription("**Points: ** " + user.xp + "\n**Rank:** " + user.position)
			.setColor(Colors.White)
		interaction.reply({embeds: [embed]});

	}
	if (commandName === 'leaderboard') {
		const main = await Levels.fetchLeaderboard(interaction.guild.id, 5);
		if(main.length < 1) return interaction.reply({content:'Leaderboard Empty'});
		const leaderboard = await Levels.computeLeaderboard(client, main, true);
       	const map = leaderboard.map(e => `${e.position}. ${e.username}#${e.discriminator} │ Points: ${e.xp.toLocaleString()}`);

    	const NewEmbed = new EmbedBuilder()
     		.setColor(Colors.White)
    		.setTitle("GrimSyn Points Leaderboard") 
    		.setDescription(`\`\`\`${map.join("\n")}\`\`\``)

    	interaction.reply({embeds: [NewEmbed]});
	}
	if (commandName === 'pointsadd') {
		const user = interaction.options.getMember('user');
		const amount = interaction.options.getInteger('amount');
		Levels.appendXp(user.id, interaction.guild.id, amount);
		interaction.reply({content: 'Done :)', ephemeral: true});
	}
	if (commandName === 'pointsremove') {
		const user = interaction.options.getMember('user');
		const amount = interaction.options.getInteger('amount');
		Levels.subtractXp(user.id, interaction.guild.id, amount);
		interaction.reply({content: 'Done :)', ephemeral: true});
	}
	if (commandName === 'pointsreset') {
		const user = interaction.options.getMember('user');
		const xp = await Levels.fetch(user.id, interaction.guild.id, true);
		Levels.subtractXp(user.id, interaction.guild.id, xp.xp);
		interaction.reply({content: 'Done :)', ephemeral: true});
	}
});


client.login(token);