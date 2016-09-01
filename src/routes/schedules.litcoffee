##Routes - Schedules
####Most scheduling stuff that does not need authentication should go here

    module.exports = do ->
      express = require('express')
      app = express()
      config = require('../../config.js')
      Ioredis = require('ioredis')
      redis = new Ioredis(config.dbport, config.dbaddr)

      app.get '/currentclass', (req, res) ->
        redis.get 'currentclass', (err, result) ->
          if err
            res.send 'An error occured: ' + err
          else
            res.send result

      app.get '/nextclass', (req, res) ->
        redis.get 'nextclass', (err, result) ->
          if err
            res.send 'An error occured: ' + err
          else
            res.send result

      app.get '/today', (req, res) ->
        redis.get('today').then (result) ->
          res.send result

      app.get '/remainingtime', (req, res) ->
        redis.get 'remainingtime', (err, result) ->
          if err
            res.send err
            throw err
          else
            res.send result

      app.get '/specialschedule', (req, res) ->
        redis.get 'specials', (err, result) ->
          if err
            res.send err
            throw err
          else
            res.send result
      app.get '/week', (req, res) ->
        redis.get 'week', (err, result) ->
          if err
            res.send err
            throw err
          res.send result
      app

