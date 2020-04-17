// Node.js file system
const fs = require('fs');
// Set up Discord.js
const Discord = require('discord.js');
// Get values from the config
const { botToken, botPrefix } = require('./config.json');

// Create a new Discord client
const client = new Discord.Client();

// Get the collection of available commands
client.commands = new Discord.Collection();

// Array of all JavaScript files in ./commands
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
// Put each command into the collection
commandFiles.forEach( file => {
	const command = require(`./commands/${file}`);
	// Set new item in the collection
	// the key being the command name and its value being what actually gets run
	client.commands.set(command.name, command);
});

// Notify console when client is ready
client.once('ready', () => {
	console.log(`Connected as ${client.user.tag}`);
	client.user.setActivity("Haven's favorite robot");
});

client.on('message', message => {	
	// Prevent bot from responding to its own messages and check if using prefix
	// Check if first character of the message is the prefix
	if(message.author.bot || message.content[0] != botPrefix) return;

	// Get all arguments in the command following the prefix
	const args = message.content.slice(1).split(/ +/);
	// Set the first argument as the command
	const command = args.shift().toLowerCase();

	// Run command if it is valid
	try {
		client.commands.get(command).execute(message, args);
		console.log(`"${message.author.username}" ran the command "${command}" with the arguments [${args}]\n`);
	} catch (error) {
		console.error(error);
		message.reply('there was an error trying to execute that command!');
	}
});

// Login to Discord with your app's token
client.login(botToken);
