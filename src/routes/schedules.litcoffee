##Routes - Schedules
####Most scheduling stuff that does not need authentication should go here

    module.exports = do ->
      express = require('express')
      app = express()
      config = require('../../config.js')
      dbman = require '../dbman.js'
      config.connect 'schedulecommands'

Get the current schedule. returns an array of classes as defined in readme.
There's also the date optional param which changes the functionality entirely and makes custom calls.
Perhaps requiring dbman exported functions would be of use.

      app.get '/day/:date*?', (req, res) ->
        

If there is a date attached, lets use that instead. 

        if req.params.date?
          dbman.parserDay(req.params.date, (today) -> res.send today)

        else
          redis.get('today').then (err, result) ->
            if err
              res.send err
            else
              res.send result

Get the list of all specials. Pretty useless.

      app.get '/specialschedule', (req, res) ->
        redis.get 'specials', (err, result) ->
          if err
            res.send err
          else
            res.send result

Get the weekly schedule.

      app.get '/week/:date*?', (req, res) ->

        redis.get 'week', (err, result) ->
          if err
            res.send err
          res.send result
      return app

