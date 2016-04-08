// The Frontend of the API: ties everything together
// make sure to add all new features here when extending the system

var express = require('express'),
  app = express();
  ioredis = require('ioredis'),
  underscore = require('underscore'),
  morgan = require('morgan'),
  config = require('../config.js'),
  fs = require('fs'),
  Log = require('log'),
  log = new Log('debug', fs.createWriteStream('../frontend.log'));

var accessLogStream = fs.createWriteStream('../access.log', {flags: 'a'})
app.use(morgan('combined', {stream: accessLogStream}))

log.info("Booting Frontend");
// Connect to the redis server
log.info('Connecting to the Redis Server');
var redis = new ioredis(config.dbport, config.dbaddr);
redis.on('connect', function(result) {
  log.info("Connected to redis");
});
redis.on('error', function(result) {
  throw result;
});
var redislistener = new ioredis(config.dbport, config.dbaddr);
redislistener.on('connect', function(result) {
  log.info("Subscriber connected");
});
redislistener.on('error', function(result) {
  throw result;
});
redislistener.subscribe('frontend');
redis.publish('main', 'Frontend launched');


/*
 * Important Note
 * Because we are using redis as a backend, it costs almost nothing to patch each request directly through.
 * This reduces load in the long term because the frontend needs no memory or update scheme.
 */

//CORS headers
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use('/', require('./routes/schedules')); // load the schedules routes
app.use('/', require('./routes/authentication')); // load the schedules routes


app.listen(3000);

log.debug('Reporting to service set');
redis.zincrby('services', 1, 'frontend'); // add us to the list

process.on('exit', function(code) { // for clean exit
  log.debug('Removing From service list');
  redis.zincrby('services', -1, 'frontend'); // remove all instances
  redis.quit();
  redislistener.quit();
});
process.on('SIGINT', function(code) { // for CTRL-C
  process.exit(); // Do regular exit
});
