require('dotenv').config();
const Discord = require('discord.js');
const admin = require('firebase-admin');
const serviceAccount = JSON.parse(process.env.FIREBASE_PRIVATE_KEY);
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: process.env.FIREBASE_DATABASE_URL,
});
const database = admin.firestore();
const fs = require('fs');
const channelsJSON = require('../data/channelsData.json');
const weatherJSON = require('../data/weatherData.json');

const client = new Discord.Client();
const channels = database.collection('channels');
const weatherConditions = database.collection('weather-conditions');
const timedEvents = database.collection('timed-events');
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
	async execute(message, args) {
		if(args[0] == 'send' && args.length == 2) {
			let weatherCondition;
			await weatherConditions.doc(args[1]).get()
				.then(snapshot => weatherCondition = snapshot)
				.catch(error => {
					console.error(error);
					return message.reply('an error occurred, please try again!');
				});
			if (!weatherCondition.exists) {
				return message.reply('that weather condition doesn\'t exist!');
			}
			if (weatherCondition.data().inside.size === 0 || weatherCondition.data().outside.size === 0) {
				return message.reply('that weather type doesn\'t have any descriptions!');
			}

			let channelsList;
			await channels.get()
				.then(snapshot => channelsList = snapshot)
				.catch(error => {
					console.error(error);
					return message.reply('an error occurred, please try again!');
				});
			if (channelsList.size === 0) {
				return message.reply('there are no channels to message!');
			}

			channelsList.forEach(channel => {
				const description = randomProperty(weatherCondition.data()[channel.data().type]);
				client.channels.fetch(channel.data().id)
					.then(weatherChannel => {
						weatherChannel.send(description)
							.catch(console.error);
						console.log(`Messaged ${channel.id} the ${channel.data().type} weather: ${description}`);
					})
					.catch((error) => {
						console.error(error);
						return message.reply('an error occurred, please try again!');
					});
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
				let status = 0;
				await weatherConditions.doc(args[1]).get()
					.then(snapshot => {
						if (snapshot.exists) {
							return status = 2;
						}
						else {
							weatherConditions.doc(args[1]).set({
								inside: [],
								outside: [],
							});
							return status = 1;
						}
					})
					.catch(error => {
						return console.error(error);
					});

				switch (status) {
				case 0:
					return message.reply('an error occurred, please try again!');
				case 1:
					return message.reply(`weather \`${args[1]}\` condition has been added! Please remember to add descriptions for inside and outside`);
				case 2:
					return message.reply('that weather condition already exists!');
				}
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