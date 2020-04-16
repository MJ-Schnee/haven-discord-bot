// JSON files
const weatherJSON = require('./testWeather.json');
const channelsJSON = require('./testChannels.json');

const condition = "Pouring"

// Random JSON object picker
// Thanks to https://stackoverflow.com/questions/2532218/pick-random-property-from-a-javascript-object
var randomProperty = function (obj) {
    var keys = Object.keys(obj);
    return obj[keys[ keys.length * Math.random() << 0]];
};

// Loop through all channels
Object.keys(channelsJSON).forEach(channel => {
    channelRef = channelsJSON[channel];
    console.log(`=== ${channel} ===`);
    console.log(`Type: ${channelRef.type}`);
    console.log(`ID: ${channelRef.id}`);
    console.log(`Weather: ${randomProperty(weatherJSON[condition][channelRef.type])}`);
    console.log();
});