// Data Processor
// Processes today's schedule
var ioredis = require('ioredis');
var moment = require('moment');
var scheduler = require('node-schedule');
var underscore = require('underscore');
var config = require('../config.js');
var fs = require('fs')
  , Log = require('log')
  , log = new Log('debug', fs.createWriteStream('../dataprocessor.log'));
// Connect to the redis server
var redis = new ioredis(config.dbport, config.dbaddr);
redis.on('error', function(err) {
  throw err;
});
var redislistener = new ioredis(config.dbport, config.dbaddr);
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
    if (data === "No School") {
      today = "No School";
    } else {
      today = JSON.parse(data);
    }
// today = "No School";
  });
};
gettoday(); // We should call this ASAP
var isnow = function() { // determine current class
  log.debug('Finding Current Class')
  if (today !== "No School") {
    currentClass = underscore.filter(today, function(item) {
      return moment().isBetween(moment({
        h: item.shour,
        m: item.smin
      }), moment({
        h: item.ehour,
        m: item.emin
      }));
    });
    if (currentClass.length >= 1) {
      log.debug('Current class is ' + JSON.stringify(currentClass))
      redis.set('currentclass', JSON.stringify(currentClass))
    } else {
      log.debug('School today, but no current class');
      redis.set('currentclass', "Break")
    }
  } else {
    log.debug('No School today');
    redis.set('currentclass', "No School");
  }
};

var isnext = function() {
  log.debug('Finding Next Class');
  if (today !== "No School") {
    var upcoming = underscore.filter(today, function(item) { //all upcoming classes.
      return moment().isBefore(moment({
        h: item.shour,
        m: item.smin
      }));
    });
    if (upcoming.length > 0) {
      if (upcoming[0].key_name.slice(-1) == 0) { // if it is not a split
        nextClass = upcoming.slice(0, 1);
      } else if (upcoming[0].key_name.slice(-1) !== 0) { // If it is a split
        nextClass = upcoming.slice(0, 2)
      }
    }
    if (nextClass.length >= 1) {
      redis.set('nextclass', JSON.stringify(nextClass))
    } else {
      redis.set('nextclass', "No School")
    }
  } else {
    redis.set('nextclass', "No School");
  }
};

var endsin = function() {
  if (currentClass !== "No School") { // are there classes right now?
    underscore.each(currentClass, function(item) { // do for all in currentclass
      item.etime = moment({
        h: item.ehour,
        m: item.emin
      }); // add etime to item
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
log.info('Reporting to service set');
redis.zincrby('services', 1, 'dataprocessor'); // add us to the list

process.on('exit', function(code) { // for clean exit
  log.info('Removing from service list');
  redis.zincrby('services', -1, 'dataprocessor'); // remove one instance of it (for scaling)
  redis.quit(); // remove from the server
  redislistener.quit();
});
process.on('SIGINT', function(code) { // for CTRL-C
  process.exit(); // Do regular exit
});
