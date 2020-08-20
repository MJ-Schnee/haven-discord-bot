module.exports = {
	name: 'help',
	description: 'Send a description and usage of all comands to user',
	async execute(message) {
		const helpPage =
        '**Here are all the commands I have!**\n\n' +
        '*weather send {weather condition}*\n' +
        '- Sends descriptions of that weather condition to all channels\n\n' +
        '*weather add {weather condition}*\n' +
        '- Adds that weather condition to list of possible weather conditions\n\n' +
        '*weather add {#channel} {"inside"/"outside"}*\n' +
        '- Adds the specified channel to the list of channels with a condition "inside" or "outside"\n\n' +
        '*weather remove {#channel/weather condition}*\n' +
        '- Removes specified channel or weather condition from list of channels/conditions\n\n' +
        '*weather remove {weather condition} {"inside"/"outside"} {condition\'s index}*\n' +
        '- Removes a specific description from a weather condition\n\n' +
        '*weather list {"channels"/"conditions"}*\n' +
        '- Lists all channels and if they are "inside"/"outside" or all weather conditions\n\n' +
        '*weather list {weather condition} {"inside"/"outside"}*\n' +
        '- Lists all descriptions and their index'
        ;

		message.author.send(helpPage)
			.then(() => console.log('DMd the help page to a user'))
			.catch(console.error);

		return message.reply('The help page has been DMd to you!')
			.catch(console.error);
	},
};
