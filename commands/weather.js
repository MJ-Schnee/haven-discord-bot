require('dotenv').config();
const Discord = require('discord.js');
const channelsJSON = require('../data/channelsData.json');
const weatherJSON = require('../data/weatherData.json');
const fs = require('fs');

const client = new Discord.Client();
const worldAnnouncementID = process.env.WORLD_ANNOUNCEMENT_ID;

const updateLocalJSONs = () => {
	fs.writeFile('./test code/testChannels.json', JSON.stringify(channelsJSON, null, 4), 'utf8', error => {
		if(error) console.error(error);
		console.log('Local file write successful for testChannels.json');
	});
	fs.writeFile('./test code/testWeather.json', JSON.stringify(weatherJSON, null, 4), 'utf8', error => {
		if(error) console.error(error);
		console.log('Local file write successful for testWeather.json\n');
	});
};

const randomProperty = obj => {
	const keys = Object.keys(obj);
	return obj[keys[ keys.length * Math.random() << 0]];
};

module.exports = {
	name: 'weather',
	description: 'Send Haven weather update to all text channels',
	execute(message, args) {
		if(args[0] == 'send' && args.length == 2) {
			const weather = args[1];

			if (weatherJSON[weather] === undefined ||
			Object.keys(weatherJSON[weather].inside).length === 0 ||
			Object.keys(weatherJSON[weather].outside).length === 0) {
				return message.reply('that weather type doesn\'t have any descriptions!');
			}

			Object.keys(channelsJSON).forEach(channelKey => {
				const channelRef = channelsJSON[channelKey];
				const weatherDescription = randomProperty(weatherJSON[weather][channelRef.type]);
				try {
					client.channels.fetch(channelRef.id).then(
						weatherChannel => {
							weatherChannel.send(weatherDescription).catch((error) => {
								console.error(error);
							});
							console.log(`Messaged ${channelKey} the ${channelRef.type} weather: ${weatherDescription}`);
						});
				}
				catch (error) {
					console.error(error);
					message.reply(`an error occurred trying to message the "${channelKey}" channel`);
				}
			});

			return message.channel.send('The weather has been announced!')
				.catch((error) => {
					console.error(error);
				});
		}
		else if (args[0] == 'add' && args.length == 2) {
			if (message.mentions.channels.size == 0 &&
			message.mentions.users.size == 0 &&
			message.mentions.roles.size == 0) {
				if (weatherJSON[args[1]]) {
					return message.reply('that weather condition already exists!');
				}

				weatherJSON[args[1]] = {
					'inside': {},
					'outside': {},
				};

				updateLocalJSONs();

				return message.reply('weather condition has been added! Please remember to add descriptions for inside and outside');
			}
		}
		else if (args[0] == 'add' && args.length == 3) {
			if (message.mentions.channels.first().type == 'text' &&
			(args[2] == 'outside' || args[2] == 'inside')) {
				const channelName = message.mentions.channels.first().name;
				const channelType = args[2];
				const channelID = message.mentions.channels.first().id;

				channelsJSON[channelName.toString()] = {
					'type': channelType.toString(),
					'id': channelID.toString(),
				};

				updateLocalJSONs();

				return message.channel.send(`${message.mentions.channels.first()} has been added to the list of weather channels!`).catch((error) => {
					console.error(error);
				});
			}
		}
		else if (args[0] == 'remove' && args.length == 2) {
			if (message.mentions.channels.size == 0 &&
			message.mentions.users.size == 0 &&
			message.mentions.roles.size == 0) {
				if (!weatherJSON[args[1]]) {
					return message.reply('that weather condition doesn\'t exist!');
				}

				delete weatherJSON[args[1]];

				updateLocalJSONs();

				return message.reply('weather condition has been added! Please remember to add descriptions for inside and outside');
			}

			if (message.mentions.channels.size == 1 && message.mentions.channels.first().type == 'text') {
				const channelName = message.mentions.channels.first().name;

				delete channelsJSON[channelName.toString()];

				updateLocalJSONs();

				return message.channel.send(`${message.mentions.channels.first()} has been removed from the list of weather channels!`)
					.catch((error) => {
						console.error(error);
					});
			}
		}
		else if (args[0] == 'remove' && args.length == 4) {
			if (weatherJSON[args[1]] !== undefined &&
			weatherJSON[args[1]][args[2]] !== undefined &&
			weatherJSON[args[1]][args[2]][args[3]] !== undefined) {
				weatherJSON[args[1]][args[2]][args[3]] = weatherJSON[args[1]][args[2]][Object.keys(weatherJSON).length - 1];
				delete weatherJSON[args[1]][args[2]][Object.keys(weatherJSON).length - 1];

				updateLocalJSONs();

				return message.reply('that weather condition\'s description has been deleted!');
			}
		}
		else if (args[0] == 'describe' && args.length >= 4) {
			if (weatherJSON[args[1]]) {
				if (args[2] == 'inside' || args[2] == 'outside') {
					let description = '';
					for (let i = 3; i < args.length; i++) {
						description += ` ${args[i]}`;
					}
					description = description.substring(1);

					const conditionLength = Object.keys(weatherJSON[args[1]][args[2]]).length + 1;

					weatherJSON[args[1]][args[2]][conditionLength] = description;

					updateLocalJSONs();

					return message.reply('the weather condition has been updated\n' +
					`"${args[1]}" while "${args[2]}" now includes "${description}"`);
				}
				return message.reply('please specify if it is inside/outside');
			}
			return message.reply('that weather condition does not exist');
		}
		else if (args[0] == 'list' && args.length == 2) {
			if (args[1] == 'conditions') {
				let sendMessage = 'Weather conditions: \n';
				const weatherKeys = Object.keys(weatherJSON);
				for (let i = 0; i < weatherKeys.length; i++) {
					sendMessage += `- ${weatherKeys[i]}\n`;
				}
				return message.channel.send(sendMessage)
					.catch((error) => {
						console.error(error);
					});
			}
			else if (args[1] == 'channels') {
				let sendMessage = 'Channels to message: \n';
				const channelKeys = Object.keys(channelsJSON);
				for (let i = 0; i < channelKeys.length; i++) {
					sendMessage += `- ${channelKeys[i]}\n`;
				}
				return message.channel.send(sendMessage)
					.catch((error) => {
						console.error(error);
					});
			}
		}
		else if (args[0] == 'list' && args.length == 3) {
			if (weatherJSON[args[1]] !== undefined && weatherJSON[args[1]][args[2]] !== undefined) {
				let sendMessage = `Descriptions for ${args[2]} ${args[1]}: \n`;
				const descriptionKeys = Object.values(weatherJSON[args[1]][args[2]]);
				for (let i = 0; i < descriptionKeys.length; i++) {
					sendMessage += `${i + 1} - ${descriptionKeys[i]}\n`;
				}
				return message.channel.send(sendMessage)
					.catch((error) => {
						console.error(error);
					});
			}
		}

		return message.reply('invalid arguments for that command');
	},
	announceRandomWeather() {
		const keys = Object.keys(weatherJSON);
		let weather = keys[keys.length * Math.random() << 0];

		while (weatherJSON[weather] === undefined ||
		Object.keys(weatherJSON[weather].inside).length === 0 ||
		Object.keys(weatherJSON[weather].outside).length === 0) {
			weather = keys[keys.length * Math.random() << 0];
		}

		console.log(`\nAuto weather selected: ${weather}`);

		Object.keys(channelsJSON).forEach(channelKey => {
			const channelRef = channelsJSON[channelKey];
			const weatherDescription = randomProperty(weatherJSON[weather][channelRef.type]);
			client.channels.fetch(channelRef.id).then(
				weatherChannel => {
					weatherChannel.send(weatherDescription)
						.catch((error) => {
							console.error(error);
						});
					console.log(`Auto messaged ${channelKey} the ${channelRef.type} weather: ${weatherDescription}`);
				})
				.catch((error) => {
					console.error(error);
					return client.channels.fetch(worldAnnouncementID).then((channel) => {
						channel.send(`An error occurred trying to message the "${channelKey}" channel`).catch((sendError) => {
							console.error(sendError);
						});
					});
				});
		});

		return client.channels.fetch(worldAnnouncementID)
			.then((channel) => {
				channel.send('The weather has been announced!')
					.catch((error) => {
						console.error(error);
					});
			});
	},
};

client.login();