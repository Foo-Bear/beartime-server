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

{date:2105-9-23, schedule: [{\"key_name\":\"4-030\",\"name\":\"Block 1\",\"shour\":9,\"smin\":50,\"ehour\":10,\"emin\":55,\"day\":4}]}

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
  if (true) {
    console.log("got a special");
    var prevspecials = redis.get('specials');
    var currentspecials = prevspecials.treeroot.push(message);
    console.log(JSON.stringify(currentspecials));
    redis.set('specials', JSON.stringify(currentspecials));
  }
});
