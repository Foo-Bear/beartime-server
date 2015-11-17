// Data Processor
// Processes today's schedule
console.log('Starting Data Processor...');
//import all features
console.log('Loading Dependencies');
var ioredis = require('ioredis'); // redis clients
var moment = require('moment'); //date/time thing
var scheduler = require('node-schedule'); // autoupdater
var _ = require('underscore'); // hurray we know what this means

console.log('Loaded Dependencies');

// Connect to the redis server
console.log('Connecting to the Redis Server');

var redis = new ioredis(6379, 'jspamc.homelinux.com');
redis.on('connect', function(result) {
  console.log("Connected to redis");
});
redis.on('error', function(result) {
  throw result;
});

var redislistener = new ioredis(6379, 'jspamc.homelinux.com');
redislistener.on('connect', function(result) {
  console.log("Subscriber connected");
});
redislistener.on('error', function(result) {
  throw result;
});
redislistener.subscribe('dataprocessor');


// Define functions
var today = [],
  currentClass = [],
  nextClass = [],
  remainingTime = [];
var gettoday = function(db) {
  db = db || 'today';
  redis.get(db, function(err, data) {
    if (err) throw error;
    console.log("Got Today's schedule");
    if (data === "No School") {
      today = "No School";
    } else {
      today = JSON.parse(data);
    }
  });
};

gettoday(); // We should call this ASAP

var isnow = function() { // determine current class
  if (today !== "No School") {
    currentClass = _.filter(today, function(item) {
      return moment().isBetween(moment().hour(item.shour).minute(item.smin),
        moment().hour(item.ehour).minute(item.smin), 'seconds');
    });
    if (Array.isArray(currentClass)) redis.set('currentclass', currentClass);
    else redis.set('currentclass', "No School");
  } else {
    redis.set('currentclass', "No School");
  }
};

var isnext = function() {
  if (today !== "No School") {
    var upcoming = _.filter(today, function(item) {
      return moment().isBefore(moment().hour(item.shour).minute(item.smin));
    });
    nextClass = upcoming.slice(0, currentClass.length);
    if (nextClass.length >= 1) redis.set('nextclass', JSON.stringify(nextClass));
    else redis.set('nextclass', "No School");
  } else {
    redis.set('nextclass', "No School");
  }
};

var endsin = function() {
  if (today !== "No School" && currentClass !== "No School") {
    _.each(currentClass, function(item) {
      item.etime = moment().hour(item.ehour).minute(item.emin);
      item.remainingtime = Math.floor(moment.duration(item.etime.diff(moment())).asMinutes());
    });
    remainingTime = _.pluck(currentClass, 'remainingtime');
    redis.set('remainingtime', remainingTime);
  } else {
    redis.set('remainingtime', "No School");
  }
};
var endsin = function(db) {
  db = db || today;
  var endtime, results = [],
    remtimeMS, remtimeD, remtimeS;
  if (currentClass !== "No School" && typeof currentClass !== 'undefined') { // is there a current class?
    for (var i = 0; i < currentClass.length; i++) { // for each in currentclass (for parallel classes)
      endtime = moment().set({
        'hour': currentClass[i].ehour,
        'minute': currentClass[i].emin,
        'seconds': 0
      }); //parse the end time
      remtimeMS = endtime.diff(moment()); // the ms difference
      remtimeD = moment.duration(remtimeMS); // make it a moment duration
      remtimeS = Math.floor(remtimeD.asMinutes()); // floor the ms as minutes (always rounds down)
      // Other (Old) Methods
      //remtimeS = Math.floor(remtimeD.asHours()) + moment.utc(remtimeMS).format(":mm"); // some math to floor it and stuff
      // moment.utc(endtime.diff(moment(), 'minutes')) is what we used before
      results.push(remtimeS); // add the diff to the array
    }
  } else {
    redis.set('remainingtime', "No School");
  }
  if (results.length >= 1) { // if results has anything in it
    redis.set('remainingtime', JSON.stringify(results)); // send the redis command
    remainingTime = results;
  } else if (today.length >= 1) { // otherwise return no school if today has anything.
    redis.set('remainingtime', "No School");
    remainingTime = "No School";
  } else { // if all else fails for some odd reason
    console.log('ERROR: Could not remaining time');
  }
};

var dayjob = scheduler.scheduleJob('0 0 * * *', function() {
  gettoday();
});
var minutejob = scheduler.scheduleJob('0 * * * * *', function() { //called every minute at 0 seconds
  isnow();
  isnext();
  endsin();
});
minutejob.invoke();
redislistener.on('message', function(channel, message) {
  if (message == 'update') {
    console.log('Got an update request from the Redis Channel');
    dayjob.invoke();
    minutejob.invoke();
  }
});

// Reporting to the service list.
// ATTACH THIS TO ALL SERVICES
console.log('Reporting to service set');
redis.zincrby('services', 1, 'dataprocessor'); // add us to the list

process.on('exit', function(code) { // for clean exit
  console.log('Removing from service list');
  redis.zincrby('services', -1, 'dataprocessor'); // remove one instance of it (for scaling)
  redis.quit(); // remove from the server
  redislistener.quit();
  console.log('Goodbye');
});
process.on('SIGINT', function(code) { // for CTRL-C
  process.exit(); // Do regular exit
});
