// Node.js file system
const fs = require('fs');
// Set up Discord.js
const Discord = require('discord.js');
// Get values from the config
const { botToken, botPrefix, seasonUpdateChannelID } = require('./config.json');

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

client.once('ready', () => {
	console.log(`Connected as ${client.user.tag}`);
	client.user.setActivity("Made in Haven", { type: 2 });

	// Check every 24 hours to see if the season needs to be updated
	setInterval( () => {
		// Access the channel to update the season in
		client.channels.fetch(seasonUpdateChannelID).then( (channel) => {
			let today = new Date();
			
			// Check if it is the 1st of the month
			if (today.getDate() == 1) {
				// Jan, Feb, March - Spring
				if ((today.getMonth() == 0) || (today.getMonth() == 1) || (today.getMonth() == 2))
					channel.send("Happy Spring");
				// April, May, June - Summer
				else if ((today.getMonth() == 3) || (today.getMonth() == 4) || (today.getMonth() == 5))
					channel.send("Happy Summer");
				// July, August, Sept - Autumn
				else if ((today.getMonth() == 6) || (today.getMonth() == 7) || (today.getMonth() == 8))
					channel.send("Happy Autumn");
				// Oct, Nov, Dec - Winter
				else if ((today.getMonth() == 9) || (today.getMonth() == 10) || (today.getMonth() == 11))
					channel.send("Happy Fall");
			}			
		});
	}, 86400000);
});

client.on('message', message => {	
	// Prevent bot from responding to its own messages
	// Check if using prefix
	if(message.author.bot || message.content[0] != botPrefix)
		return;

	// Check if user has the proper role to use the bot
	if((message.member.roles.cache.find(role => role.name === "The Council") === undefined) &&
		(message.member.roles.cache.find(role => role.name === "Moderator") === undefined))
			return;

	

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
		message.reply("Are you sure that's a command?");
	}
});

// Login to Discord with your app's token
client.login(botToken);
