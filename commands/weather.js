require('dotenv').config();
const Discord = require('discord.js');
const admin = require('firebase-admin');
const serviceAccount = JSON.parse(process.env.FIREBASE_PRIVATE_KEY);
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: process.env.FIREBASE_DATABASE_URL,
});
const database = admin.firestore();
const later = require('later');

const client = new Discord.Client();
const channels = database.collection('channels');
const weatherConditions = database.collection('weather-conditions');
const timedEvents = database.collection('timed-events');
const worldAnnouncementID = process.env.WORLD_ANNOUNCEMENT_ID;

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
					return message.reply('an error occurred, please try again!')
						.catch((error) => {
							console.error(error);
						});
				});
			if (!weatherCondition.exists) {
				return message.reply('that weather condition doesn\'t exist!')
					.catch((error) => {
						console.error(error);
					});
			}
			if (weatherCondition.data().inside.size === 0 || weatherCondition.data().outside.size === 0) {
				return message.reply('that weather type doesn\'t have any descriptions!')
					.catch((error) => {
						console.error(error);
					});
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
					.then(async snapshot => {
						if (snapshot.exists) {
							return status = 2;
						}
						else {
							weatherConditions.doc(args[1]).set({
								inside: [],
								outside: [],
							})
								.then(status = 1)
								.catch(console.error);
						}
					})
					.catch(error => {
						return console.error(error);
					});

				switch (status) {
					case 0:
						return message.reply('an error occurred, please try again!')
							.catch((error) => {
								console.error(error);
							});
					case 1:
						return message.reply(`weather \`${args[1]}\` condition has been added! Please remember to add descriptions for inside and outside`)
							.catch((error) => {
								console.error(error);
							});
					case 2:
						return message.reply('that weather condition already exists!')
							.catch((error) => {
								console.error(error);
							});
				}
			}
		}
		else if (args[0] == 'add' && args.length == 3) {
			if (message.mentions.channels.first().type == 'text' &&
			(args[2] == 'outside' || args[2] == 'inside')) {
				const channelName = message.mentions.channels.first().name;
				const channelType = args[2];
				const channelID = message.mentions.channels.first().id;

				let error = false;
				await channels.doc(channelName.toString()).set({
					id: channelID.toString(),
					type: channelType.toString(),
				})
					.catch(e => {
						console.error(e);
						return error = true;
					});

				if (error) {
					return message.channel.send('an error occurred, please try again!')
						.catch((error) => {
							console.error(error);
						});
				}

				return message.channel.send(`${message.mentions.channels.first()} has been added to the list of (${channelType}) weather channels!`)
					.catch(console.error);
			}
		}
		else if (args[0] == 'remove' && args.length == 2) {
			if (message.mentions.channels.size == 0 &&
			message.mentions.users.size == 0 &&
			message.mentions.roles.size == 0) {
				let status = 0;
				await weatherConditions.doc(args[1]).get()
					.then(async snapshot => {
						if (!snapshot.exists) {
							return status = 2;
						}
						else {
							await weatherConditions.doc(args[1]).delete()
								.then(status = 1)
								.catch(console.error);
						}
					})
					.catch(error => {
						return console.error(error);
					});

				switch (status) {
					case 0:
						return message.reply('an error occurred, please try again!')
							.catch((error) => {
								console.error(error);
							});
					case 1:
						return message.reply('weather condition has been removed!')
							.catch((error) => {
								console.error(error);
							});
					case 2:
						return message.reply('that weather condition doesn\'t exist!')
							.catch((error) => {
								console.error(error);
							});
				}
			}

			if (message.mentions.channels.size == 1 && message.mentions.channels.first().type == 'text') {
				const channelName = message.mentions.channels.first().name;

				let status = 0;
				await channels.doc(channelName.toString()).get()
					.then(async snapshot => {
						console.log(snapshot.data().type);
						if (!snapshot.exists) {
							return status = 2;
						}
						else {
							await channels.doc(channelName.toString()).delete()
								.then(status = 1)
								.catch(console.error);
						}
					})
					.catch(error => {
						return console.error(error);
					});

				switch (status) {
					case 0:
						return message.reply('an error occurred, please try again!')
							.catch((error) => {
								console.error(error);
							});
					case 1:
						return message.channel.send(`${message.mentions.channels.first()} has been removed from the list of weather channels!`)
							.catch((error) => {
								console.error(error);
							});
					case 2:
						return message.reply('that channel doesn\'t exist!')
							.catch((error) => {
								console.error(error);
							});
				}
			}
		}
		else if (args[0] == 'remove' && args.length == 4) {
			let status = 0;
			await weatherConditions.doc(args[1]).get()
				.then(async weatherCondition => {
					if (weatherCondition.exists) {
						if (!weatherCondition.data()[args[2]][args[3]]) {
							return status = 2;
						}
						await weatherConditions.doc(args[1]).update({
							[args[2]]: admin.firestore.FieldValue.arrayRemove(weatherCondition.data()[args[2]][args[3]]),
						});
						return status = 1;
					}
				})
				.catch(console.error);

			switch (status) {
				case 0:
					return message.reply('an error occurred, please try again!');
				case 1:
					return message.reply('that weather condition\'s description has been deleted!');
				case 2:
					return message.reply('that weather condition doesn\'t exist!');
			}
		}
		else if (args[0] == 'describe' && args.length >= 4) {
			let status = 0;
			await weatherConditions.doc(args[1]).get()
				.then(async weatherCondition => {
					if (weatherCondition.exists) {
						if (args[2] == 'inside' || args[2] == 'outside') {
							let description = '';
							for (let i = 3; i < args.length; i++) {
								description += ` ${args[i]}`;
							}
							description = description.substring(1);

							if (weatherCondition.data()[args[2]].includes(description)) {
								return status = 4;
							}

							await weatherConditions.doc(args[1]).update({
								[args[2]]: admin.firestore.FieldValue.arrayUnion(description),
							})
								.then(status = 1)
								.catch(console.error);
						}
						else {
							return status = 3;
						}
					}
					else {
						return status = 2;
					}

				})
				.catch(console.error);

			switch (status) {
				case 0:
					return message.reply('an error occurred, please try again!');
				case 1:
					return message.reply(`the "${args[1]}" while "${args[2]}" weather condition has a new description!`);
				case 2:
					return message.reply('that weather condition doesn\'t exist!');
				case 3:
					return message.reply('please specify if it is inside/outside');
				case 4:
					return message.reply('that description is already on that weather condition!');
			}
		}
		else if (args[0] == 'list' && args.length == 2) {
			if (args[1] == 'conditions') {
				let sendMessage = 'Weather conditions: \n';
				const weatherKeys = [];
				await weatherConditions.get()
					.then(snapshot => {
						snapshot.forEach(doc =>{
							weatherKeys.push([doc.id]);
						});
					});
				for (let i = 0; i < weatherKeys.length; i++) {
					sendMessage += `- ${weatherKeys[i]}\n`;
				}

				return message.channel.send(sendMessage).catch(console.error);
			}
			else if (args[1] == 'channels') {
				let sendMessage = 'Weather channels: \n';
				const channelKeys = [];
				await channels.get()
					.then(snapshot => {
						snapshot.forEach(doc =>{
							channelKeys.push([doc.id]);
						});
					});
				for (let i = 0; i < channelKeys.length; i++) {
					sendMessage += `- ${channelKeys[i]}\n`;
				}

				return message.channel.send(sendMessage).catch(console.error);
			}
		}
		else if (args[0] == 'list' && args.length == 3) {
			let status = 0;
			let sendMessage = `Descriptions for ${args[2]} ${args[1]}: \n`;
			if (args[2] === 'inside' || args[2] === 'outside') {
				await weatherConditions.doc(args[1]).get()
					.then(async weatherCondition => {
						if (weatherCondition.exists) {
							const weatherConditionSize = await weatherCondition.data()[args[2]].length;

							if (weatherConditionSize === 0) {
								status = 1;
								return sendMessage = `${args[2]} ${args[1]} has no descriptions yet!`;
							}

							for (let i = 0; i < weatherConditionSize; i++) {
								sendMessage += `${i} - ${await weatherCondition.data()[args[2]][i]}\n`;
							}
							status = 1;
						}
						else {
							return status = 2;
						}
					})
					.catch(console.error);
			}
			else {
				return message.reply('please specify inside or outside conditions!');
			}

			switch (status) {
				case 0:
					return message.reply('an error occurred, please try again!');
				case 1:
					return message.reply(sendMessage);
				case 2:
					return message.reply('that weather condition doesn\'t exist!');
			}
		}

		return message.reply('invalid arguments for that command');
	},
	async setupSchedulers() {
		const schedule = later.parse.recur().every(5).minute();

		const autoWeatherFunction = async () => {
			timedEvents.doc('auto-send-weather').get()
				.then(async autoWeatherSnapshot => {
					if (await autoWeatherSnapshot.data().timestamp.toDate() <= new Date()) {
						let weatherCondition;
						await weatherConditions.get()
							.then(collectionSnapshot => {
								const collectionSize = collectionSnapshot.size;
								const conditionIndex = Math.floor(Math.random() * Math.floor(collectionSize));
								let i = 0;
								collectionSnapshot.forEach(async documentSnapshot => {
									if (i === conditionIndex) {
										weatherCondition = documentSnapshot;
									}
									else {
										i++;
									}
								});
							})
							.catch(console.error);
						console.log(`Auto selected weather condition: ${weatherCondition.id}`);

						await channels.get()
							.then(collectionSnapshot => {
								collectionSnapshot.forEach(async documentSnapshot => {
									if (await documentSnapshot.data().type === 'inside' || await documentSnapshot.data().type === 'outside') {
										const weatherDescription = randomProperty(weatherCondition.data()[await documentSnapshot.data().type]);
										const channelID = await documentSnapshot.data().id;
										await client.channels.fetch(channelID)
											.then(weatherChannel => {
												weatherChannel.send(weatherDescription)
													.catch(console.error);
												console.log(`Auto messaged ${documentSnapshot.id} the ${documentSnapshot.data().type} weather: ${weatherDescription}`);
											})
											.catch(async error => {
												console.error(error);
												client.channels.fetch(worldAnnouncementID)
													.then((channel) => {
														channel.send(`An error occurred trying to message the "${documentSnapshot.id}" channel`)
															.catch(console.error);
													});
											})
											.catch(console.error);
									}
								});
							})
							.catch(console.error);

						return client.channels.fetch(worldAnnouncementID)
							.then((channel) => {
								channel.send('The weather has been announced!')
									.catch((error) => {
										console.error(error);
									});

								const newTime = new Date();
								const randomHours = Math.random() * 12 + 12;
								console.log(`Announcing new weather in ${randomHours} hours`);
								newTime.setHours(newTime.getHours() + randomHours);

								timedEvents.doc('auto-send-weather').set({
									timestamp: newTime,
								})
									.then(() => {
										channel.send('The weather has been announced!')
											.catch((error) => {
												console.error(error);
											});
									})
									.catch(error => {
										console.error(error);
										channel.send('The weather has been announced!')
											.catch(console.error);
									});
							});
					}
				})
				.catch(console.error);

		};

		const autoSeasonFunction = async () => {
			timedEvents.doc('auto-send-season').get()
				.then(async autoSeasonSnapshot => {
					client.channels.fetch(worldAnnouncementID)
						.then(async channel => {
							const timestamp = await autoSeasonSnapshot.data().timestamp.toDate();
							const today = new Date();

							if (timestamp < today) {
								const nextSeason = await autoSeasonSnapshot.data().nextSeason;
								const nextDate = new Date();
								nextDate.setDate(15);
								nextDate.setHours(0);
								switch (nextSeason) {
									case 'Spring':
										channel.send('The season has changed to Spring')
											.catch(console.error);
										nextDate.setMonth(5);
										console.log(`Next season: Summer\nNext Date: ${nextDate}\n`);
										return await timedEvents.doc('auto-send-season').set({
											timestamp: nextDate,
											nextSeason: 'Summer',
										});
									case 'Summer':
										channel.send('The season has changed to Summer')
											.catch(console.error);
										nextDate.setMonth(8);
										console.log(`Next season: Autumn\nNext Date: ${nextDate}\n`);
										return await timedEvents.doc('auto-send-season').set({
											timestamp: nextDate,
											nextSeason: 'Autumn',
										});
									case 'Autumn':
										channel.send('The season has changed to Autumn')
											.catch(console.error);
										nextDate.setMonth(11);
										console.log(`Next season: Winter\nNextDate: ${nextDate}\n`);
										return await timedEvents.doc('auto-send-season').set({
											timestamp: nextDate,
											nextSeason: 'Winter',
										});
									case 'Winter':
										channel.send('The season has changed to Winter')
											.catch(console.error);
										nextDate.setMonth(2);
										nextDate.setFullYear(nextDate.getFullYear() + 1);
										console.log(`Next season: Spring\nNext Date: ${nextDate}\n`);
										return await timedEvents.doc('auto-send-season').set({
											timestamp: nextDate,
											nextSeason: 'Spring',
										});
								}
							}
						});
				});

		};

		later.setInterval(autoWeatherFunction, schedule);
		later.setInterval(autoSeasonFunction, schedule);
	},
};

client.login();