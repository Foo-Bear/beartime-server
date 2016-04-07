// Specials Manager
// Processes today's schedule
console.log('Starting Data Processor...');
//import all features
console.log('Loading Dependencies');
var ioredis = require('ioredis'); // redis clients
var moment = require('moment'); //date/time thing
var scheduler = require('node-schedule'); // autoupdater

console.log('Loaded Dependencies');
function IsJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}
/*
The format for a special input is like follows:

{name: "optional name for reference", date:2105-9-23, schedule: [{\"key_name\":\"4-030\",\"name\":\"Block 1\",\"shour\":9,\"smin\":50,\"ehour\":10,\"emin\":55,\"day\":4}]}

Notes, Ignore:
append to array, push array to special on redis
dbman will read specials and see if any date matches
if date matches, send instead of regular planned schedule
*/
var redis = new ioredis(6379, 'localhost');
redis.on('error', function(err) {throw err;});
var redislistener = new ioredis(6379, 'localhost');
redislistener.on('error', function(err) {
  throw err;
});
redislistener.subscribe('specials');

redislistener.on('message', function (channel, message) {
  console.log("got message");
  redis.get('specials', function (err, res) {
    var specials = JSON.parse(res);
    var input = JSON.parse(message);
    if (IsJsonString(message)) {
      console.log("got a new special");
      if (Array.isArray(specials) === false) {specials = []; console.log("specials is bad, restarting");}
      if (typeof input.date == 'string' && Array.isArray(input.schedule)) {
        specials.push(JSON.parse(message));
        console.log("new specials list is " + specials);
        redis.set('specials', JSON.stringify(specials));
        redis.publish('dbman', 'update');
      }
    } else {console.log("message invalid json");}
  });
});


// Reporting to the service list.
// ATTACH THIS TO ALL SERVICES
console.log('Reporting to service set');
redis.zincrby('services', 1 ,  'specialsman'); // add us to the list

process.on('exit', function (code) { // for clean exit
  console.log('Removing From service list');
  redis.zincrby('services', -1 ,  'specialsman'); // remove all instances
  redis.quit();
  redislistener.quit();
});
process.on('SIGINT', function (code) { // for CTRL-C
  process.exit(); // Do regular exit
});
