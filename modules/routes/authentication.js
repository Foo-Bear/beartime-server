//Requests that require higher authentication go here.
module.exports = function(){
  var express = require('express');
  var app = express();

  var bodyParser = require('body-parser');
  var jwt = require('jsonwebtoken');
  var jsonParser = bodyParser.json(); // make a json parser for input
  var config = require('../../config.js');
  var ioredis = require('ioredis'),
    redis = new ioredis(config.dbport, config.dbaddr);

  app.post('/inputschedule', jsonParser, function(req, res) {
    if (!req.body) res.sendStatus(400);
    var auth = jwt.verify(req.get('Authorization'), config.secret);

    if (auth.admin == true && auth.ip == req.ip) {
      redis.publish('specials', JSON.stringify(req.body));
      redis.publish('dbman', 'update');
      res.sendStatus(201);
    } else {res.sendStatus(401)};
  });

  app.post('/deletespecial' , jsonParser , function (req, res) {
    if (!req.body) return res.sendStatus(400);
    redis.publish('specials', 'delete: ' + req.body.date);
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
    //pass id in object. Should probably verify @blakeschool.org
    redis.get("user:" + req.body.id, function (err, result) {
      if (err) res.send(err);
      if (!result) {
        res.sendStatus(204);
      } else {
        jwt.sign({id: req.body.id, ip: req.ip}, config.secret);
        res.send({
          token: jwt.sign({id: req.body.id, ip: req.ip}, config.secret),
          data: result
        });
      }
    })
  });
  app.post('/storeuser', jsonParser, function (req, res) {
    // pass id, and data in object. Data will not be appended.
    // verify token assigned upon getting user.
  });

  return app;
}();
