## Database manager microservice
##### Does the actual file writing and parsing

The difference between dbman and dataprocessor is that dbman is designed to show things about the *schedule* and not the current events.

Load required modules.

    moment = require('moment')
    scheduler = require('node-schedule')
    underscore = require('underscore')
    config = require('../config.js')
    fs = require('fs')
    async = require 'async'
    Promise = require 'bluebird'
    config.connect 'dbman'
    basejson = {}


    log = (string) ->
      if (process.env.NODE_ENV != 'test')
        console.log(string)
    


This is the equivalent of a refresh. Should not be called often,
because it a.) is synchronous and b.) doesn't change often. We want to do this right away.

    update = ->

      log 'Loading the Database Files'
      basejson = JSON.parse(fs.readFileSync('db/database.json'))
      return
    update()


Here is parserDay, the core function of the database manager. 
This basically aquires the schedule for a date, if one is supplied.
extra options are for practicality purposes. In desparate need of rewrite.
Date must be in YYYY-MM-DD format.

    parserDay = (date) ->
      new Promise (resolve, reject) ->


Read the generic schedule for that day. (if one is supplied)

        if date?
          log 'parsing a day: ' + moment(date, 'YYYY-MM-DD').format('YYYY-MM-DD') + "raw: #{date}"
          today = basejson[moment(date, 'YYYY-MM-DD').format('dddd')]
        else
          log 'parsing a day: ' + moment().format('YYYY-MM-DD')
          today = basejson[moment().format('dddd')]


Now we determine if there is a special schedule for today. The async nature
of this requires some odd code to cope with its many uses. Probably can be refactored.

        todaySpecials = undefined
        
        redis.get 'specials', (err, res) ->
          if err
            reject err

Load and filter the big list of specials. 

          specialsArray = JSON.parse res
          todaySpecials = underscore.find(specialsArray, (item) ->
            moment(date if date?).isSame moment(item.date, 'YYYY-MM-DD'), 'day'
          )

if there's a special for today, load it instead of the generic schedule

          if todaySpecials then today = todaySpecials.schedule
          if typeof today == 'undefined'
            today = null
          resolve today

parserWeek basically just runs parserDay for every day in the week. It looks ugly, but anti-patterns of async are never fun.

    parserWeek = (date) ->
      new Promise (resolve, reject) ->
        week = {}
        async.each [1..5],
          (item, call) ->
            eachCallback = (today) ->
              if date? 
                week[moment(date, 'YYYY-MM-DD').day(item).format('dddd')] = today
              else 
                week[moment().day(item).format('dddd')] = today
              call()
            
            if date?
              parserDay(moment(date, 'YYYY-MM-DD').day(item).format('YYYY-MM-DD')).then eachCallback
            else 
              parserDay(moment().day(item).format('YYYY-MM-DD')).then eachCallback
          () -> resolve week

Here we define a job to be run every day/week, but only if this is it's own process. This job gets the daily/weekly schedule for today, and sets it. 

    if require.main == module
      dayjob = scheduler.scheduleJob('0 0 * * *', ->
        log 'Running Daily Update'
        parserDay().then (today) -> redis.set 'today', JSON.stringify today
        return
      )
      weekjob = scheduler.scheduleJob('0 * * * *', ->
        parserWeek().then (week) -> redis.set 'week', JSON.stringify week
        return
      )


Those timers update at midnight every day/week, so we should start them now just to make them load something. Unless we are testing.
    
      weekjob.invoke()
      dayjob.invoke()

We define a third timer to update the hardcoded database.
    
    updatejob = scheduler.scheduleJob '0 0 * * *', ->
      update()
    

Subscribe to messages sent by a redis client. useful for development. Runs every function and updates.

    redislistener.on 'message', (channel, message) ->
      if message == 'update' and channel == 'dbman'
        log 'Got an update request from the Redis Channel'
        update()
        if require.main == module
          dayjob.invoke()
          weekjob.invoke()
      return


### Exporting.
Due to the nature of this code, combined with some of the communication problems encountered by redis pub/sub, we export the two main functions.

    module.exports.parserDay = parserDay
    module.exports.parserWeek = parserWeek