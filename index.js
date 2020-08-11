// Environment variables
require('dotenv').config();
// Firebase
const firebaseAdmin = require('firebase-admin');
const firebaseServiceAccount = JSON.parse(process.env.FIREBASE_PRIVATE_KEY);
firebaseAdmin.initializeApp({
	credential: firebaseAdmin.credential.cert(firebaseServiceAccount),
	databaseURL: process.env.FIREBASE_DATABASE_URL,
});
// Node.js file system
const fs = require('fs');
// Set up Discord.js
const Discord = require('discord.js');
// Get values from the config
const botPrefix = process.env.PREFIX;
const worldAnnouncementID = process.env.WORLD_ANNOUNCEMENT_ID;

// Create a new Discord client
const client = new Discord.Client();

// Get the collection of available commands
client.commands = new Discord.Collection();

// Array of all JavaScript files in ./commands
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
// Put each command into the collection
commandFiles.forEach(file => {
	const command = require(`./commands/${file}`);
	// Set new item in the collection
	// the key being the command name and its value being what actually gets run
	client.commands.set(command.name, command);
});

client.once('ready', () => {
	console.log(`Connected as ${client.user.tag}`);
	client.user.setActivity('Made in Haven', { type: 2 });

	// Updates the weather at a random interval 12-24 hours
	function autoSendWeather() {
		const minWait = 43200000;
		const maxWait = 86400000;
		const randomTime = Math.random() * (maxWait - minWait + 1) + minWait;
		client.commands.get('weather').announceRandomWeather();
		console.log(`\nAuto announcing new weather in ${randomTime / 1000 / 60 / 60} hours`);
		setTimeout(autoSendWeather, randomTime);
	}
	autoSendWeather();

	// Updates the season every 3 months
	// Check every 24 hours to see if the season needs to be updated
	setInterval(() => {
		// Access the channel to update the season in
		client.channels.fetch(worldAnnouncementID).then((channel) => {
			const today = new Date();

			// Check if it is the 1st of the month
			if (today.getDate() == 1) {
				// Jan, Feb, March - Spring
				if (today.getMonth() == 0) {
					channel.send('The season has changed to Spring');
				}
				// April, May, June - Summer
				else if (today.getMonth() == 3) {
					channel.send('The season has changed to Summer');
				}
				// July, August, Sept - Autumn
				else if (today.getMonth() == 6) {
					channel.send('The season has changed to Autumn');
				}
				// Oct, Nov, Dec - Winter
				else if (today.getMonth() == 9) {
					channel.send('The season has changed to Winter');
				}
			}
		});
	}, 86400000);
});

client.on('message', message => {
	// Prevent bot from responding to its own messages
	// Check if using prefix
	if(message.author.bot || message.content[0] != botPrefix) {
		return;
	}

	// Check if user has the proper role to use the bot
	if((message.member.roles.cache.find(role => role.name === 'The Council') === undefined) &&
			(message.member.roles.cache.find(role => role.name === 'Moderator') === undefined)) {
		return;
	}

	// Get all arguments in the command following the prefix
	const args = message.content.slice(1).split(/ +/);
	// Set the first argument as the command
	const command = args.shift().toLowerCase();

	// Run command if it is valid
	try {
		client.commands.get(command).execute(message, args);
		console.log(`"${message.author.username}" ran the command "${command}" with the arguments [${args}]\n`);
	}
	catch (error) {
		console.error(error);
		message.reply('are you sure that\'s a command?').catch((sendError) => {
			console.error(sendError);
		});
	}
});

// Login to Discord with app token
client.login();