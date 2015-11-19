// Data Processor
// Processes today's schedule
var ioredis = require('ioredis'); // redis clients
var moment = require('moment'); //date/time thing
var scheduler = require('node-schedule'); // autoupdater
var underscore = require('underscore'); // hurray we know what this means
// Connect to the redis server
var redis = new ioredis(6379, 'jspamc.homelinux.com');
redis.on('error', function(err) {throw err;});
var redislistener = new ioredis(6379, 'jspamc.homelinux.com');
redislistener.on('error', function(err) {
  throw err;
});
redislistener.subscribe('dataprocessor');
// Define functions
var today,
  currentClass = [],
  nextClass = [],
  remainingTime = [];
var gettoday = function() {
  redis.get('today', function(err, data) {
      if (err) throw err;
      today = JSON.parse(data);
      // today = "No School";
    });
};
gettoday(); // We should call this ASAP
var isnow = function() { // determine current class
  if (today !== "No School") {
    currentClass = underscore.filter(today, function(item) {
      return moment().isBetween(moment({h:item.shour, m: item.smin}), moment({h:item.ehour, m: item.emin}));
    });
    if (currentClass.length >= 1) redis.set('currentclass', JSON.stringify(currentClass));
    else redis.set('currentclass', "No School");
  } else {
    redis.set('currentclass', "No School");
  }
};

var isnext = function() {
  if (today !== "No School") {
    var upcoming = underscore.filter(today, function(item) {
      return moment().isBefore(moment({h:item.shour}));
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
    underscore.each(currentClass, function(item) { // do for all in currentclass
      item.etime = moment({h:item.ehour, m:item.emin}); // add etime to item
      item.remainingtime = Math.floor(moment.duration(item.etime.diff(moment())).asMinutes()); //add remainingtime to item
    });
    remainingTime = underscore.pluck(currentClass, 'remainingtime'); //get remainingtime from all entries in currentClass
    redis.set('remainingtime', JSON.stringify(remainingTime)); // set it
  } else {
    redis.set('remainingtime', "No School");
  }
};

var minutejob = scheduler.scheduleJob('0 * * * * *', function() { //called every minute at 0 seconds
  gettoday();
  isnow();
  isnext();
  endsin();
});
minutejob.invoke();
redislistener.on('message', function(channel, message) {
  if (message == 'update') {
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
});
process.on('SIGINT', function(code) { // for CTRL-C
  process.exit(); // Do regular exit
});
