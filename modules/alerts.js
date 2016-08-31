// Alert Systema
// To get alerts for things.
console.log("Starting Alert Daemon...");

//import dependencies
console.log('Loading Dependencies');
var ioredis = require('ioredis');
var moment = require('moment');
var scheduler = require('node-schedule');
var underscore = require('underscore');
console.log('Loaded Dependencies');

// Connect to the redis server
console.log('Connecting to the Redis Server');
var redis = new ioredis(6379, 'localhost');
var redislistener = new ioredis(6379, 'localhost');
var stream = redis.scanStream({
  // only returns keys following the pattern of `alert:*`
  match: 'alert:*',
  // returns approximately 100 elements per call
});
redislistener.subscribe('alerts');
console.log('Connected to the Redis Server');


var parsealerts = function () {
  stream.on('data', function (resultKeys) {

  // `resultKeys` is an array of strings representing key names
  for (var i = 0; i < resultKeys.length; i++) {
    var thing = redis.get(resultKeys[i]);
    alerts.push(thing);
  }
});
console.log(JSON.stringify(alerts));
};

// Define our alert custom type.
// Format for adding an alert should be the following
// alert: {"name":"foo", "priority":1, "data":"bar", "expires":"n"} where n is seconds.
redislistener.on('message', function (channel, message) {
  if (message.indexOf("alert") > -1) { // if it has alert
    console.log('Someone sent an alert!');
    var expires;
    var splitmessage = message.split('/', 2); // split by the colon once so the object is preserved
    var data = JSON.parse(splitmessage[1]); // JSON parse the actual object
    console.log(JSON.stringify(data));
    redis.set("alert:" + data.name, JSON.stringify(data)).then(function (result) {console.log(result);});
    // make a new key with alert. as a prefix then the name of the alert.
    if (data.expires !== undefined) { // check if there is TTL
      console.log('There is an TTL attached, processing');
      expires = moment.duration(data.expires, 'minutes').asSeconds(); // makes a duration, see the format above.
      console.log(expires + ' TTL');
      redis.expire('alert:' + data.name, expires); // set the expiry property.
    } else {console.log('No TTL attached, assuming forever');}
    //alerts.push(new Alert(data.name,data.priority,data.data));
  }
  parsealerts();
});
var alerts = [];


console.log('Reporting to service set');
redis.zincrby('services', 1, 'alertsd'); // add us to the list

process.on('exit', function(code) { // for clean exit
  console.log('Removing from service list');
  redis.zincrby('services', -1, 'alertsd'); // remove one instance of it (for scaling)
  redis.quit(); // remove from the server
  redislistener.quit();
});
process.on('SIGINT', function(code) { // for CTRL-C
  process.exit(); // Do regular exit
});
