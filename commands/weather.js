// Acess Discord.js
const Discord = require('discord.js');
// Create a new Discord client
const client = new Discord.Client();
// Get values from the config
const { botToken, worldAnnouncementID } = require('../config.json');
// Login to Discord with your app's token
client.login(botToken);
// Access the channels and weather JSONs
const channelsJSON = require('../test code/testChannels.json');
const weatherJSON = require('../test code/testWeather.json');

// Writes the JSON data from the Node server onto the local files
const updateLocalJSONs = () => {
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
            console.log("Local file write successful for testWeather.json\n");
    });
};

// Random JSON object picker
// Thanks to https://stackoverflow.com/questions/2532218/pick-random-property-from-a-javascript-object
const randomProperty = obj => {
    let keys = Object.keys(obj);
    return obj[keys[ keys.length * Math.random() << 0]];
};

module.exports = {
    name: 'weather',
    description: 'Send Haven weather update to all text channels',
    // Executes command given arguments
    execute(message, args) {
        // Checks if sending out a weather update
        if(args[0] == "send" && args.length == 2) {
            const weather = args[1];

            // Check if weather type exists and has inside and outside descriptions
            if(weatherJSON[weather] === undefined || 
                    Object.keys(weatherJSON[weather].inside).length === 0 || 
                    Object.keys(weatherJSON[weather].outside).length === 0)
                        return message.reply("that weather type doesn't have any descriptions!");

            // Send messages to all the channels
            Object.keys(channelsJSON).forEach(channelKey => {
                const channelRef = channelsJSON[channelKey];
                const weatherDescription = randomProperty(weatherJSON[weather][channelRef.type]);
                // Fetches the channel based on its ID then sends the weather message to that channel
                try {
                    client.channels.fetch(channelRef.id).then(
                        weatherChannel => { 
                            weatherChannel.send(weatherDescription);
                            console.log(`Messaged ${channelKey} the ${channelRef.type} weather: ${weatherDescription}`);
                        });
                }
                catch (error) { // Most likely the bot doesn't have access to that channel
                    console.error(error);
                    message.reply(`An error occurred trying to message the "${channelKey}" channel`);
                };
            });

            return message.channel.send("The weather has been announced!");
        }

        // Checks if adding weather condition
        else if(args[0] == "add" && args.length == 2) {
            // Check if accidentally forgot arguments for adding channel
            if(message.mentions.channels.size == 0 && 
                message.mentions.users.size == 0 && 
                message.mentions.roles.size == 0) {
                    // Check if condition already exists
                    if(weatherJSON[args[1]])
                        return message.reply("that weather condition already exists!");

                    // Make a blank template for that condition
                    weatherJSON[args[1]] = {
                        "inside": {},
                        "outside": {}
                    };

                    updateLocalJSONs();

                    return message.reply("weather condition has been added! Please remember to add descriptions for inside and outside");
                }
        }

        // Checks if adding a channel to send weather in
		else if(args[0] == "add" && args.length == 3) {
            // Validate arguments
            if(message.mentions.channels.first().type == "text" && // Checks if text channel is mentioned
                (args[2]=="outside" ||  args[2]=="inside")) { // Checks if inside/outside channel is specified
                    const channelName = message.mentions.channels.first().name;
                    const channelType = args[2];
                    const channelID = message.mentions.channels.first().id;

                    // Set Node's JSON
                    channelsJSON[channelName.toString()] = {
                        "type": channelType.toString(),
                        "id": channelID.toString()
                    };
                
                    updateLocalJSONs();

                    return message.channel.send(`${message.mentions.channels.first()} has been added to the list of weather channels!`);
                }
        }

        // Checks if removing a channel or weather condition
        else if(args[0] == "remove" && args.length == 2) {
            // If there are no mentions, then the user is removing a weather condition
            if(message.mentions.channels.size == 0 && 
                message.mentions.users.size == 0 && 
                message.mentions.roles.size == 0) {
                // Check if condition exists
                if( !weatherJSON[args[1]] )
                    return message.reply("that weather condition doesn't exist!");

                delete weatherJSON[args[1]]

                updateLocalJSONs();

                return message.reply("Weather condition has been added! Please remember to add descriptions for inside and outside");
            }

            // Check if removing text channel
            if(message.mentions.channels.size == 1 && message.mentions.channels.first().type == "text") {
                const channelName = message.mentions.channels.first().name;

                delete channelsJSON[channelName.toString()];

                updateLocalJSONs();

                return message.channel.send(`${message.mentions.channels.first()} has been removed from the list of weather channels!`);
            }
        }

        // Checks if describing a weather condition (adding onto inside/outside)
        else if(args[0] == "describe" && args.length >= 4) {
            // Check if weather condition exists
            if(weatherJSON[args[1]]) {
                // Check if inside/outside
                if(args[2] == "inside" || args[2] == "outside") {
                    let description = "";
                    // Go through the rest of the arguments and append them to the description
                    for(let i=3; i<args.length; i++) {
                        description += ` ${args[i]}`;
                    }
                    // Get rid of leading space
                    description = description.substring(1);

                    const conditionLength = Object.keys(weatherJSON[args[1]][args[2]]).length+1;

                    // Append description to Node's JSON
                    weatherJSON[args[1]][args[2]][conditionLength] = description;

                    updateLocalJSONs();

                    return message.reply("the weather condition has been updated\n"+
                    `"${args[1]}" while "${args[2]}" now includes "${description}"`);
                }
                return message.reply("please specify if it is inside/outside");
            }
            return message.reply("that weather condition does not exist");
        }

        // Checks if listing conditions or channels or descriptions
        else if(args[0] == "list" && args.length == 2) {
            // Listing all weather conditions
            if(args[1] == "conditions"){
                let sendMessage = "Weather conditions: \n";
                let weatherKeys = Object.keys(weatherJSON);
                for(let i=0; i<weatherKeys.length; i++) {
                    sendMessage += `- ${weatherKeys[i]}\n`;
                }
                return message.channel.send(sendMessage);
            }
            // Listing all channels to send weather in
            else if(args[1] == "channels"){
                let sendMessage = "Channels to message: \n";
                let channelKeys = Object.keys(channelsJSON);
                for(let i=0; i<channelKeys.length; i++) {
                    sendMessage += `- ${channelKeys[i]}\n`;
                }
                return message.channel.send(sendMessage);
            }
        }

        // Checks if listing descriptions of condition
        else if(args[0] == "list" && args.length == 3) {
            let weatherKeys = Object.keys(weatherJSON);
            // See if weather condition exists
            if(weatherJSON[args[1]] !== undefined && weatherJSON[args[1]][args[2]] !== undefined){
                let sendMessage = `Descriptions for ${args[2]} ${args[1]}: \n`;
                let descriptionKeys = Object.values(weatherJSON[args[1]][args[2]]);
                for(let i=0; i<descriptionKeys.length; i++) {
                    sendMessage += `${i}- ${descriptionKeys[i]}\n`;
                }
                return message.channel.send(sendMessage);
            }
        }

        return message.reply("invalid arguments for that command");
    },
    // Sends a random weather to all channels
    // Used for the auto random weather
    announceRandomWeather() {
        // Get a random type of weather
        let keys = Object.keys(weatherJSON);
        let weather = keys[keys.length * Math.random() << 0];

        // Makes sure weather type has descriptions
        while (weatherJSON[weather] === undefined || 
                Object.keys(weatherJSON[weather].inside).length === 0 || 
                Object.keys(weatherJSON[weather].outside).length === 0) {
                    weather = keys[keys.length * Math.random() << 0];
        };
        
        // Send messages to all the channels
        Object.keys(channelsJSON).forEach(channelKey => {
            const channelRef = channelsJSON[channelKey];
            const weatherDescription = randomProperty(weatherJSON[weather][channelRef.type]);
            // Fetches the channel based on its ID then sends the weather message to that channel
            try {
                client.channels.fetch(channelRef.id).then(
                    weatherChannel => { 
                        weatherChannel.send(weatherDescription);
                        console.log(`Messaged ${channelKey} the ${channelRef.type} weather: ${weatherDescription}`);
                });
            }
            catch (error) { // Most likely the bot doesn't have access to that channel
                console.error(error);
                return client.channels.fetch(worldAnnouncementID).then( (channel) => {
                    channel.send(`An error occurred trying to message the "${channelKey}" channel`);
                });
            };
        });
        
        return client.channels.fetch(worldAnnouncementID).then( (channel) => {
            channel.send("The weather has been announced!");
        });
    }
}