// Database manager microservice
// Does the actual file writing and parsing
console.log('Starting Database Manager...');
//import all features
console.log('Loading Dependencies');
var ioredis = require('ioredis'); // redis clients
var fs = require('fs'); // filesystem
var moment = require('moment'); //date stime thing
var scheduler = require('node-schedule'); // autoupdater
var underscore = require('underscore');
console.log('Loaded Dependencies');
// Connect to the redis server
console.log('Connecting to the Redis Server');

var redis = new ioredis(6379, 'localhost');
redis.on('connect', function (result) {console.log("Connected to redis");});
redis.on('error', function (result) {throw result;});

var redislistener = new ioredis(6379, 'localhost');
redislistener.on('connect', function (result) {console.log("Subscriber connected");});
redislistener.on('error', function (result) {throw result;});
redislistener.subscribe('dbman');

console.log('Successfully Connected to the Redis Server');

// define the different schedule arrays.
var basejson = {},
  specials = {},
  schedule = {};

//update the db
var update = function() {
  // read the database async
  console.log('dbman: Loading the Database Files');
  basejson = JSON.parse(fs.readFileSync('../db/database.json'));
};
// check what to return

var parser = function(db) {
  console.log('dbman: Parsing the Database Files');
  db = db || basejson.treeroot; // take a db or default to the basejson
  var today = underscore.filter(db, function(item) {
    return moment().isSame(moment().day(item.day), 'day');
  });
  // next we see if there is any specials today
  var todaySpecials;
  redis.get('specials', function (err, res) {
    console.log('DEBUG: getting specials');
    todaySpecials = underscore.find(JSON.parse(res), function(item){
      console.log("item " + item.date);
      return moment().isSame(moment(item.date), 'day');
    });
    //console.log(todaySpecials.schedule);


    // then we check which to return
    // we do it in here so that it is a promise 
    if (today.length === 0 && typeof todaySpecials === "undefined") { //if there is nothing
      redis.set('today', "No School");
    } else if (typeof todaySpecials !== "undefined") { //otherwise if there is a special schedule
      redis.set('today', JSON.stringify(todaySpecials.schedule)); // return today defaults
    } else {
      redis.set('today', JSON.stringify(today));
    }
    redis.set('schedule', JSON.stringify(db));
  });
};

// run every day
var dayjob = scheduler.scheduleJob('0 0 * * *', function() {
  console.log('Running Daily Update');
  update();
  parser();
});
//call the job on startup cause we don't want to wait
dayjob.invoke();

// redis update subscriber

redislistener.on('message', function (channel, message) {
  if (message == 'update' && channel == 'dbman' ) {
    console.log("Got an update request from the Redis Channel");
    dayjob.invoke();
  }
});

// Reporting to the service list.
// ATTACH THIS TO ALL SERVICES
console.log('Reporting to service set');
redis.zincrby('services', 1 ,  'dbman'); // add us to the list

process.on('exit', function (code) { // for clean exit
  console.log('Removing From service list');
  redis.zincrby('services', -1 ,  'dbman'); // remove all instances
  redis.quit();
  redislistener.quit();
});
process.on('SIGINT', function (code) { // for CTRL-C
  process.exit(); // Do regular exit
});
