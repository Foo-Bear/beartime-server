// The Frontend of the API: ties everything together
// make sure to add all new features here when you extend the system

console.log('Starting Frontend...');

console.log('Loading Dependencies');
var express = require('express');
var app = express();
var ioredis = require('ioredis');
var bodyParser = require('body-parser');
var underscore = require('underscore');
var jwt = require('jsonwebtoken');
var morgan = require('morgan');
var config = require('../config.js');
console.log('Loaded Dependencies');

app.use(morgan('short'));
// Connect to the redis server
console.log('Connecting to the Redis Server');
var redis = new ioredis({
  host: 'localhost'
});
redis.on('connect', function(result) {
  console.log("Connected to redis");
});
redis.on('error', function(result) {
  throw result;
});
var redislistener = new ioredis(6379, 'localhost');
redislistener.on('connect', function(result) {
  console.log("Subscriber connected");
});
redislistener.on('error', function(result) {
  throw result;
});
redislistener.subscribe('frontend');
redis.publish('main', 'Frontend launched');


var jsonParser = bodyParser.json(); // make a json parser for input
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

app.get('/', function(req, res) { // for A client to ping the entire system
  redis.zrange('services', 0, -1, 'WITHSCORES', function(err, result) {
    if (err) {
      res.send('An error occured: ' + err);
    } else {
      res.send(result);
    }
  });
  redis.publish('main', 'A user is requesting the list of services');
});

app.get('/currentclass', function(req, res) {
  redis.get('currentclass', function(err, result) {
    if (err) {
      res.send('An error occured: ' + err);
    } else {
      res.send(result);
    }
  });
});

app.get('/nextclass', function(req, res) {
  redis.get('nextclass', function(err, result) {
    if (err) {
      res.send('An error occured: ' + err);
    } else {
      res.send(result);
    }
  });
});

app.get('/today', function(req, res) {
  redis.get('today').then(function(result) {
    res.send(result);
  });
});

app.get('/remainingtime', function(req, res) {
  redis.get('remainingtime', function(err, result) {
    if (err) {
      res.send(err);
      throw err;
    } else {
      res.send(result);
    }
  });
});

app.get('/specialschedule', function(req, res) {
  redis.get('specials', function(err, result) {
    if (err) {
      res.send(err);
      throw err;
    } else {
      res.send(result);
    }
  });
});

// end get commands, start post commands
//These require Authentication
app.post('/inputschedule', jsonParser, function(req, res) {
  if (!req.body) res.sendStatus(400);
  var auth = jwt.verify(req.get('Authorization'), config.secret);

  if (auth.admin == true && auth.ip == req.ip) {
    redis.publish('specials', JSON.stringify(req.body));
    redis.publish('dbman', 'update');
    res.sendStatus(201);
  } else {res.sendStatus(401)};
});
app.post('/deletespecial' , bodyParser , function (req, res) {
  if (!req.body) return res.sendStatus(400);
});

//Authentication
app.post('/auth', jsonParser, function(req, res) {
  if (!req.body) return res.sendStatus(400);
  redis.get('auth', function (err, result) {
    if (err) res.send('An error occured: ' + err);
    if (underscore.isEqual(req.body, JSON.parse(result))) {
      //Correct Authentication
      //Assign a JWT key with happy fun time enabled and ip
      res.send(jwt.sign({ admin: true, ip: req.ip }, config.secret));
    } else {
      res.sendStatus(401);
    };
  })
});

//userdata
app.post('/getuser', jsonParser, function (req, res) {
  redis.get("user:" + req.body.id, function (err, result) {
    if (err) res.send(err);
    if (!result) {
      res.sendStatus(204);
    } else {
      res.sendStatus(201);
    }
  })
});
app.post('/storeuser', jsonParser, function (req, res) {

})

app.listen(3000);

console.log('Reporting to service set');
redis.zincrby('services', 1, 'frontend'); // add us to the list

process.on('exit', function(code) { // for clean exit
  console.log('Removing From service list');
  redis.zincrby('services', -1, 'frontend'); // remove all instances
  redis.quit();
  redislistener.quit();
});
process.on('SIGINT', function(code) { // for CTRL-C
  process.exit(); // Do regular exit
});
