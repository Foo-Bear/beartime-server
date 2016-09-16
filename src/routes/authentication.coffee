# Routes - Authentication
# Requests that require higher authentication go here.

#Start by exporting everything (required for requiring)


module.exports = do ->

#import all the things we need. There are a lot because this is technically a standalone module.


  express = require('express')
  app = express()
  bodyParser = require('body-parser')
  jwt = require('jsonwebtoken')
  jsonParser = bodyParser.json()
  config = require('../../config.js')
  Ioredis = require('ioredis')
  redis = new Ioredis port: config.dbport, host: config.dbaddr, keyPrefix: 'special:'
  underscore = require('underscore')

#Enable CORS Headers. 


  app.use (req, res, next) ->
    res.header 'Access-Control-Allow-Origin', '*'
    res.header 'Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    next()
#POST request for adding a schedule. First, verify that the client making the request can add things. Verifies by IP and Admin Property.


  app.post '/day/:date', jsonParser, (req, res) ->
    if !req.body || !req.params.date
      res.sendStatus 400
    auth = jwt.verify(req.get('Authorization'), config.secret)
    if auth.admin == true and auth.ip == req.ip
      redis.exists(req.params.date).then (result) ->
        if result
          res.sendStatus 409
        else
          redis.set req.params.date, JSON.stringify req.body.schedule
          redis.publish 'dbman', 'update'
          res.sendStatus 201
    else
      res.sendStatus 401
#PUT request for editing a special. 


  app.put '/day/:date', jsonParser, (req, res) ->
    if !req.body || !req.params.date
      res.sendStatus 400
    auth = jwt.verify(req.get('Authorization'), config.secret)
    if auth.admin == true and auth.ip == req.ip
      redis.exists(req.params.date).then (result) ->
        if result
          redis.set req.params.date, JSON.stringify(req.body)
          redis.publish 'dbman', 'update'
          res.sendStatus 200
        else
          res.sendStatus 404
    else
      res.sendStatus 401
#DELETE request for deleting a special.


  app.delete '/day/:date', jsonParser, (req, res) ->
    if !req.body || !req.params.date
      res.sendStatus 400
    auth = jwt.verify(req.get('Authorization'), config.secret)
    if auth.admin == true and auth.ip == req.ip
      redis.exists(req.params.date).then (result) ->
        if result
          redis.del req.params.date
          redis.publish 'dbman', 'update'
          res.sendStatus 200
        else
          res.sendStatus 404
    else
      res.sendStatus 401

#Authentication scheme. you send a password and username in an object. this is matched with a variable in redis.


  app.post '/auth', jsonParser, (req, res) ->
    if !req.body
      return res.sendStatus(400)
    redis.get 'auth', (err, result) ->
      if err
        res.send 'An error occured: ' + err
      if underscore.isEqual(req.body, JSON.parse result)
        res.send jwt.sign({
          admin: true
          ip: req.ip
        }, config.secret)
      else
        res.sendStatus 401

  app

