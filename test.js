// JSON files
const testWeather = require('./testWeather.json');
const testLocation = require('./testLocations.json');
const numberOfLocations = Object.keys(testLocation).length;

// Random JSON object picker
// Thanks to https://stackoverflow.com/questions/2532218/pick-random-property-from-a-javascript-object


var condition = "Drizzling"

for(var i=0; i<numberOfLocations; i++) {
    var locationKeys = Object.keys(testLocation);
    var channel = testLocation[locationKeys[i]];
    console.log("Posting to channel: "+channel.channelID);
    console.log("Condition: "+testWeather[condition][channel.type]+"\n");
}