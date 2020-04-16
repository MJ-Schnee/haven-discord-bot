// JSON files
const testWeather = require('./testWeather.json');
const testLocation = require('./testLocations.json');
const numberOfLocations = Object.keys(testLocation).length;

// Gets random weather condition
// Thanks to https://stackoverflow.com/questions/2532218/pick-random-property-from-a-javascript-object
function getRandomWeather() {
    var keys = Object.keys(testWeather);
    var randomCondition = keys[ keys.length * Math.random() << 0 ];

    console.log("Random condition: "+randomCondition+"\n");
    return testWeather[randomCondition];
}

var randomCondition = getRandomWeather();

for(var i=0; i<numberOfLocations; i++) {
    var locationKeys = Object.keys(testLocation);
    var channel = locationKeys[testLocationsKeys[i]];
    console.log("Posting to channel: "+channel.channelID);
    console.log("Condition: "+randomCondition[channel.type]+"\n");
}