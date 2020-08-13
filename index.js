require('dotenv').config();
const fs = require('fs');
const Discord = require('discord.js');

const botPrefix = process.env.PREFIX;
const worldAnnouncementID = process.env.WORLD_ANNOUNCEMENT_ID;

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

	// function autoSendWeather() {
	// 	const minWait = 12 * 3600000;
	// 	const maxWait = 24 * 3600000;
	// 	const randomTime = Math.random() * (maxWait - minWait + 1) + minWait;
	// 	client.commands.get('weather').announceRandomWeather();
	// 	console.log(`\nAuto announcing new weather in ${randomTime / 3600000} hours`);
	// 	setTimeout(autoSendWeather, randomTime);
	// }
	// autoSendWeather();

	// setInterval(() => {
	// 	client.channels.fetch(worldAnnouncementID)
	// 		.then((channel) => {
	// 			const today = new Date();

	// 			if (today.getDate() == 1) {
	// 				if (today.getMonth() == 0) {
	// 					channel.send('The season has changed to Spring');
	// 				}
	// 				else if (today.getMonth() == 3) {
	// 					channel.send('The season has changed to Summer');
	// 				}
	// 				else if (today.getMonth() == 6) {
	// 					channel.send('The season has changed to Autumn');
	// 				}
	// 				else if (today.getMonth() == 9) {
	// 					channel.send('The season has changed to Winter');
	// 				}
	// 			}
	// 		});
	// }, 86400000);
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