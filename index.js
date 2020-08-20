require('dotenv').config();
const fs = require('fs');
const Discord = require('discord.js');

const botPrefix = process.env.PREFIX;

const client = new Discord.Client();
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
commandFiles.forEach(file => {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
});

client.once('ready', () => {
	console.log(`Connected as ${client.user.tag}`);
	client.user.setActivity('Made in Haven', { type: 2 });

	client.commands.get('weather').setupSchedulers();
});

client.on('message', message => {
	if(message.author.bot || message.content[0] != botPrefix) {
		return;
	}

	if((message.member.roles.cache.find(role => role.name === 'The Council') === undefined) &&
			(message.member.roles.cache.find(role => role.name === 'Moderator') === undefined)) {
		return;
	}

	const args = message.content.slice(botPrefix.length).split(/ +/);
	const command = args.shift().toLowerCase();

	try {
		client.commands.get(command).execute(message, args);
		console.log(`"${message.author.username}" ran the command "${command}" with the arguments [${args}]\n`);
	}
	catch (error) {
		console.error(error);
		message.reply('are you sure that\'s a command?')
			.catch((sendError) => {
				console.error(sendError);
			});
	}
});

client.login();