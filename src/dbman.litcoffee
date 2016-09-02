##Database manager microservice
#####Does the actual file writing and parsing

The difference between dbman and dataprocessor is that dbman is designed to show things about the *schedule* and not the current events.

Load required modules.

    moment = require('moment')
    scheduler = require('node-schedule')
    underscore = require('underscore')
    config = require('../config.js')
    fs = require('fs')
    async = require 'async'
    Promise = require 'bluebird'
    console.log 'Starting Database Manager...'

    config.connect 'dbman'
    basejson = {}


This is the equivalent of a refresh. Should not be called often,
because it a.) is synchronous and b.) doesn't change often.

    update = ->

      console.log 'Loading the Database Files'
      basejson = JSON.parse(fs.readFileSync('db/database.json'))
      return


Here is parserDay, the core function of the database manager. 
This basically aquires the schedule for a date, if one is supplied.
extra options are for practicality purposes. In desparate need of rewrite.

    parserDay = (date, callback) ->
      console.log 'parsing a day: ' + moment(date).format('YYYY-MM-DD')

Read the generic schedule for that day. (if one is supplied)

      today = basejson.treeroot[moment().day()] unless date?
      if date
        today = basejson.treeroot[moment(date).day()]

Now we determine if there is a special schedule for today. The async nature
of this requires some odd code to cope with its many uses. Probably can be refactored.

      todaySpecials = undefined
      redis.get 'specials', (err, res) ->
        if err
          console.log err

Load and filter the big list of specials. 

        specialsArray = JSON.parse res
        todaySpecials = underscore.find(specialsArray, (item) ->
          moment(date if date?).isSame moment(item.date, 'YYYY-MM-DD'), 'day'
        )

if there's a special for today, load it instead of the generic schedule

        if todaySpecials? then today = todaySpecials.schedule
        return today

call a callback for async stuff.

        if callback
          callback today

parserWeek basically just runs parserDay for every day in the week. It looks ugly, but anti-patterns of async are never fun.

    parserWeek = (callback) ->
      week = []
      async.eachSeries [1..5], 
        (item, call) ->
          parserDay moment().day(item), (today) -> week[item] = today; call()
        () -> 
          if callback
            callback week
      return week
Here we define a job to be run every day. This job gets the daily schedule for today, and sets it.

    dayjob = scheduler.scheduleJob('0 0 * * *', ->
      console.log 'Running Daily Update'
      parserDay().then (today) -> redis.set 'today', JSON.stringify today
      return
    )

This is the same as above except for being weekly. I put the hard database update here because its not worth adding another timer.

    weekjob = scheduler.scheduleJob('0 0 0 * *', ->
      update()
      parserWeek((week) -> redis.set 'week', JSON.stringify week)
      return
    )

Those timers update at midnight every day/week, so we should start them now just to make them load something. 
    
    weekjob.invoke()
    dayjob.invoke()

Subscribe to messages sent by a redis client. useful for development. Runs every function and updates.

    redislistener.on 'message', (channel, message) ->
      if message == 'update' and channel == 'dbman'
        console.log 'Got an update request from the Redis Channel'
        dayjob.invoke()
        weekjob.invoke()
      return


###Exporting.
Due to the nature of this code, combined with some of the communication problems encountered by redis pub/sub, we export the two main functions.

    module.exports.parserDay = parserDay
    module.exports.parserWeek = parserWeek



