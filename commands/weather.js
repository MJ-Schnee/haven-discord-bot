// Access the channels json
const channelsJSON = require('../test code/testChannels.json');

module.exports = {
    name: 'weather',
    description: 'Send Haven weather update to all text channels',
    execute(message, args) {
        // Checks if adding a channel to send weather into
		if(args[0] == "add") {
            // Validate arguments
            if(args.length == 3 && // Checks if all required arguments exist
                message.mentions.channels.first().type == "text" && // Checks if text channel is mentioned
                (args[2]=="outside" ||  args[2]=="inside")) { // Checks if inside/outside channel is specified

                    const channelName = message.mentions.channels.first().name;
                    const channelType = args[2];
                    const channelID = message.mentions.channels.first().id;

                    return channelsJSON[channelName] = {
                        type: channelType,
                        id: channelID
                    };
                    
                    // File writing isn't working but it saves so long as the bot stays open
                    //const fs = require('fs');
                    //fs.writeFile('./test code/testChannels.json', channelsJSON, 'utf8', error => { if(error) console.error(error);});
            }
        }

        // Checks if sending out a weather update and weather specified
        else if(args[0] == "send" && args[1]) {
            // Check if weather type exists
            if(!channelsJSON[args[1]])
                return message.reply("that weather type doesn't have any descriptions!");

            /* Use this to send a message to a specific channel
            client.channels.fetch(CHANNEL ID).then( channel => { channel.send(MESSAGE) });
            */
        }
        return  message.reply(`invalid arguments for that command`);
    }
}