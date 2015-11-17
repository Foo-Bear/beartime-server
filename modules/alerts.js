// Alert Systema
// To get alerts for things.
console.log("Starting Alert Daemon...");

//import dependencies
console.log('Loading Dependencies');
var ioredis = require('ioredis');
var moment = require('moment');
var scheduler = require('node-schedule');
console.log('Loaded Dependencies');

// Connect to the redis server
console.log('Connecting to the Redis Server');
var redis = new ioredis(6379, 'localhost');
var redislistener = new ioredis(6379, 'localhost');
redislistener.subscribe('alerts');
console.log('Connected to the Redis Server');
// Define our alert custom type.
var Alert = function (name, priority, data) {
  this.name = name; // Friendly name. Used in header of alert
  this.priority = priority; // For how the alert should be handled
  this.data = data; // The content of the alert
};
var alerts = [];
// Format for adding an alert should be the following
// alert: {"name":"foo", "priority":1, "data":"bar", "expires":"n"} where n is seconds.
redislistener.on('message', function (channel, message) {
  if (message.indexOf("alert") > -1) { // if it has alert
    console.log('Someone sent an alert!');
    var expires;
    var splitmessage = message.split('/', 2); // split by the colon once so the object is preserved
    var data = JSON.parse(splitmessage[1]); // JSON parse the actual object
    redis.set('alert.' + data.name, JSON.stringify(data)); // make a new key with alert. as a prefix then the name of the alert.
    if (data.expires !== undefined) { // check if there is TTL
      console.log('There is an TTL attached, processing');
      expires = moment.duration(data.expires, 'seconds').asSeconds(); // makes a duration, see the format above.
      console.log(expires + ' TTL');
      redis.expire('alert. ' + data.name, expires); // set the expiry property.
    } else {console.log('No TTL attached, assuming forever');}
    //alerts.push(new Alert(data.name,data.priority,data.data));
  }
});



console.log('Reporting to service set');
redis.sadd('services', 'alerts'); // add us to the list
redis.publish('main', 'alerts has been added to the services set');


process.on('exit', function (code) { // for clean exit
  console.log('Removing From service list');
  redis.publish('main', 'Alerts signing out');
  redis.srem('services', 1, 'alerts'); // remove all instances
  redis.quit();
  redislistener.quit();
});
process.on('SIGINT', function (code) { // for CTRL-C
  process.exit(); // Do regular exit
});
