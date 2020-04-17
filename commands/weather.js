// Acess Discord.js
const Discord = require('discord.js');
// Create a new Discord client
const client = new Discord.Client();
// Get values from the config
const { botToken } = require('../config.json');
// Login to Discord with your app's token
client.login(botToken);
// Access the channels and weather JSONs
const channelsJSON = require('../test code/testChannels.json');
const weatherJSON = require('../test code/testWeather.json');

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

                    channelsJSON[channelName] = {
                        "type": channelType,
                        "id": channelID
                    };

                    console.log(channelsJSON);
                    return message.channel.send(`${channelName} has been added to the list of weather channels!`);
                    
                    // File writing isn't working but it saves so long as the bot stays open
                    //const fs = require('fs');
                    //fs.writeFile('./test code/testChannels.json', channelsJSON, 'utf8', error => { if(error) console.error(error);});
            }
        }

        // Checks if sending out a weather update and weather specified
        else if(args[0] == "send" && args[1]) {
            const weather = args[1];

            // Check if weather type exists
            if(!weatherJSON[weather])
                return message.reply("that weather type doesn't have any descriptions!");

            // Random JSON object picker
            // Thanks to https://stackoverflow.com/questions/2532218/pick-random-property-from-a-javascript-object
            let randomProperty = function (obj) {
                var keys = Object.keys(obj);
                return obj[keys[ keys.length * Math.random() << 0]];
            };

            // Send messages to all the channels
            Object.keys(channelsJSON).forEach(channelKey => {
                const channelRef = channelsJSON[channelKey];
                const weatherDescription = randomProperty(weatherJSON[weather][channelRef.type]);
                console.log(`=== ${channelKey} ===`);
                console.log(`Type: ${channelRef.type}`);
                console.log(`ID: ${channelRef.id}`);
                console.log(`Weather: ${weatherDescription}`);
                console.log();
                // Fetches the channel based on its ID then sends the weather message to that channel
                client.channels.fetch(channelRef.id).then(
                    weatherChannel => { 
                        weatherChannel.send(weatherDescription) 
                        console.log(`Messaged ${channelKey} the ${channelRef.type} weather: ${weatherDescription}`);
                    });
            });

            return message.channel.send("The weather has been announced!");channelRef.type
        }
        return message.reply(`invalid arguments for that command`);
    }
}