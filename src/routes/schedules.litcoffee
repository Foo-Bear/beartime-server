##Routes - Schedules
####Most scheduling stuff that does not need authentication should go here

    module.exports = do ->
      express = require('express')
      app = express()
      config = require('../../config.js')
      Ioredis = require('ioredis')
      redis = new Ioredis(config.dbport, config.dbaddr)

Get the current schedule. returns an array of classes as defined in readme.
There's also the date optional param which changes the functionality entirely and 

      app.get '/day/:date*?', (req, res) ->
        if res.params.date?

        redis.get('today').then (result) ->
          res.send result

Get the list of all specials. Pretty useless.

      app.get '/specialschedule', (req, res) ->
        redis.get 'specials', (err, result) ->
          if err
            res.send err
            throw err
          else
            res.send result

Get the weekly schedule.

      app.get '/week/:date*?', (req, res) ->
        redis.get 'week', (err, result) ->
          if err
            res.send err
            throw err
          res.send result
      app

