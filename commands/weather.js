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

// Writes the JSON data from the Node server onto the local files
const updateLocalJSONs = () => {
    console.log(`Before:\n${channelsJSON}`);
    // Node file system
    const fs = require('fs');
    // Write into the channels JSON
    fs.writeFile('./test code/testChannels.json', JSON.stringify(channelsJSON, null, 4), 'utf8', error => { 
        if(error) 
            console.error(error);
        console.log("Local file write successful for testChannels.json");
    });
    // Write into the weather JSON
    fs.writeFile('./test code/testWeather.json', JSON.stringify(weatherJSON, null, 4), 'utf8', error => { 
        if(error) 
            console.error(error);
            console.log("Local file write successful for testWeather.json");
    });
    console.log(`After:\n${channelsJSON}\n\n`);
};

// Random JSON object picker
// Thanks to https://stackoverflow.com/questions/2532218/pick-random-property-from-a-javascript-object
const randomProperty = obj => {
    var keys = Object.keys(obj);
    return obj[keys[ keys.length * Math.random() << 0]];
};

module.exports = {
    name: 'weather',
    description: 'Send Haven weather update to all text channels',
    execute(message, args) {
        // Checks if sending out a weather update
        if(args[0] == "send" && args[1]) {
            const weather = args[1];

            // Check if weather type exists
            if(!weatherJSON[weather])
                return message.reply("that weather type doesn't have any descriptions!");

            // Send messages to all the channels
            Object.keys(channelsJSON).forEach(channelKey => {
                const channelRef = channelsJSON[channelKey];
                const weatherDescription = randomProperty(weatherJSON[weather][channelRef.type]);
                // Fetches the channel based on its ID then sends the weather message to that channel
                try {
                    client.channels.fetch(channelRef.id).then(
                        weatherChannel => { 
                            weatherChannel.send(weatherDescription) 
                            console.log(`Messaged ${channelKey} the ${channelRef.type} weather: ${weatherDescription}`);
                        });
                }
                catch (error) { // Most likely the bot doesn't have access to that channel
                    console.error(error);
                    message.reply(`An error occurred trying to message the "${channelKey}" channel`);
                };
            });

            return message.channel.send("The weather has been announced!");channelRef.type
        }

        // Checks if adding a channel to send weather in
		else if(args[0] == "add" && args[2]) {
            // Validate arguments
            if(message.mentions.channels.first().type == "text" && // Checks if text channel is mentioned
                (args[2]=="outside" ||  args[2]=="inside")) { // Checks if inside/outside channel is specified
                    const channelName = message.mentions.channels.first().name;
                    const channelType = args[2];
                    const channelID = message.mentions.channels.first().id;

                    channelsJSON[channelName.toString()] = {
                        "type": channelType.toString(),
                        "id": channelID.toString()
                    };
                
                    updateLocalJSONs();

                    return message.channel.send(`${channelName} has been added to the list of weather channels!`);
            }
        }

        // Checks if removing a channel to send weather in
        else if(args[0] == "remove" && args[1]) {
            // Validate arguments
            if(message.mentions.channels.first().type == "text") {
                const channelName = message.mentions.channels.first().name;

                delete channelsJSON[channelName.toString()];

                updateLocalJSONs();

                return message.channel.send(`${channelName} has been removed from the list of weather channels!`);
            }
        }

        return message.reply(`invalid arguments for that command`);
    }
}