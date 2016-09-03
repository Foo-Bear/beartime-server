##Routes - Authentication
####Requests that require higher authentication go here.

Start by exporting everything (required for requiring)

    module.exports = do ->

import all the things we need. There are a lot because this is technically a standalone module.

      express = require('express')
      app = express()
      bodyParser = require('body-parser')
      jwt = require('jsonwebtoken')
      jsonParser = bodyParser.json()
      config = require('../../config.js')
      Ioredis = require('ioredis')
      redis = new Ioredis(config.dbport, config.dbaddr)
      underscore = require('underscore')


Enable CORS Headers. 

      app.use (req, res, next) ->
        res.header 'Access-Control-Allow-Origin', '*'
        res.header 'Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
        next()

POST request for adding a schedule. First, verify that the client making the request can add things. Verifies by IP and Admin Property.

      app.post '/inputschedule', jsonParser, (req, res) ->
        if !req.body
          res.sendStatus 400
        auth = jwt.verify(req.get('Authorization'), config.secret)
        if auth.admin == true and auth.ip == req.ip
          redis.publish 'specials', JSON.stringify(req.body)
          redis.publish 'dbman', 'update'
          res.sendStatus 201
        else
          res.sendStatus 401

POST request for editing the entire array of specials. The idea behind this is to allow for raw editing of schedules. Also deletion.

      app.post '/modifyspecial', jsonParser, (req, res) ->
        if !req.body
          res.sendStatus 400
        auth = jwt.verify(req.get('Authorization'), config.secret)
        if auth.admin == true and auth.ip == req.ip
          redis.set 'specials', JSON.stringify(req.body)
          redis.publish 'dbman', 'update'
          res.sendStatus 201
        else
          res.sendStatus 401


Authentication scheme. you send a password and username in an object. this is matched with a variable in redis.

      app.post '/auth', jsonParser, (req, res) ->
        if !req.body
          return res.sendStatus(400)
        redis.get 'auth', (err, result) ->
          if err
            res.send 'An error occured: ' + err
          if underscore.isEqual(req.body, JSON.parse(result))

Assign a JWT key with admin enabled and ip attached for verification.

            res.send jwt.sign({
              admin: true
              ip: req.ip
            }, config.secret)
          else
            res.sendStatus 401

      app

