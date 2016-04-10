// Most scheduling stuff that does not need authentication should go here
module.exports = (function () {
  var express = require('express')
  var app = express()
  var config = require('../../config.js')
  var Ioredis = require('ioredis')
  var redis = new Ioredis(config.dbport, config.dbaddr)

  app.get('/', function (req, res) { // for A client to ping the entire system
    redis.zrange('services', 0, -1, 'WITHSCORES', function (err, result) {
      if (err) {
        res.send('An error occured: ' + err)
      } else {
        res.send(result)
      }
    })
  })

  app.get('/currentclass', function (req, res) {
    redis.get('currentclass', function (err, result) {
      if (err) {
        res.send('An error occured: ' + err)
      } else {
        res.send(result)
      }
    })
  })

  app.get('/nextclass', function (req, res) {
    redis.get('nextclass', function (err, result) {
      if (err) {
        res.send('An error occured: ' + err)
      } else {
        res.send(result)
      }
    })
  })

  app.get('/today', function (req, res) {
    redis.get('today').then(function (result) {
      res.send(result)
    })
  })

  app.get('/remainingtime', function (req, res) {
    redis.get('remainingtime', function (err, result) {
      if (err) {
        res.send(err)
        throw err
      } else {
        res.send(result)
      }
    })
  })

  app.get('/specialschedule', function (req, res) {
    redis.get('specials', function (err, result) {
      if (err) {
        res.send(err)
        throw err
      } else {
        res.send(result)
      }
    })
  })
  return app
})()
