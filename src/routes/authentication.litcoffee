Requests that require higher authentication go here.

    module.exports = do ->
      express = require('express')
      app = express()
      bodyParser = require('body-parser')
      jwt = require('jsonwebtoken')
      jsonParser = bodyParser.json()

make a json parser for input

      config = require('../../config.js')
      Ioredis = require('ioredis')
      redis = new Ioredis(config.dbport, config.dbaddr)
      underscore = require('underscore')
      app.use (req, res, next) ->

custom CORS headers for authorization

        res.header 'Access-Control-Allow-Origin', '*'
        res.header 'Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
        next()
        return
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
        return
      app.post '/deletespecial', jsonParser, (req, res) ->
        if !req.body
          return res.sendStatus(400)
        redis.publish 'specials', 'delete: ' + req.body.date
        return
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
        return
      app.post '/auth', jsonParser, (req, res) ->
        if !req.body
          return res.sendStatus(400)
        redis.get 'auth', (err, result) ->
          if err
            res.send 'An error occured: ' + err
          if underscore.isEqual(req.body, JSON.parse(result))

Correct Authentication
Assign a JWT key with happy fun time enabled and ip

            res.send jwt.sign({
              admin: true
              ip: req.ip
            }, config.secret)
          else
            res.sendStatus 401

      app

