// Set up Discord.js
const Discord = require('discord.js');
// Get values from the config
const { botToken, botPrefix } = require('./config.json');
// Access the weather and channels json
let weatherJSON = require('./test code/testWeather.json');
let channelsJSON = require('./test code/testChannels.json');

// Create a new Discord client
const client = new Discord.Client();

// Notify console when client is ready once "ready" event occurs
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

	if(command === "weather") {
		// Checks if adding a channel to send weather into
		if(args[0] == "add") {
				// Validate arguments
				if(args.length == 3 && // Checks if all required arguments exist
					message.mentions.channels.first().type == "text" && // Checks if text channel is mentioned
					(args[2]=="outside" ||  args[2]=="inside")) { // Checks if inside/outside channel is specified
						// This all works fine
						message.channel.send(`Channel name: ${message.mentions.channels.first().name}`);
						message.channel.send(`Channel type: ${args[2]}`);
						message.channel.send(`Channel ID: ${message.mentions.channels.first().id}`);
						//let data = JSON.parse(channelsJSON);
						//data[]
						return;
				}
		}
		return  message.reply(`invalid arguments for that command`);
	}
	else {
		return  message.reply(`that is not a valid command`);
	}
});

// Login to Discord with your app's token
client.login(botToken);
