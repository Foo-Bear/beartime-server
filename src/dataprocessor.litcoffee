##Data Processor
####Processes today's schedule

    moment = require('moment')
    scheduler = require('node-schedule')
    underscore = require('underscore')
    config = require('../config.js')

Connect to the redis server

    config.connect 'dataprocessor'

Define variables.

    today = []
    currentClass = []
    nextClass = []
    remainingTime = []
    upcoming = []

The gettoday function is like the update function in dbman. It loads the daily schedule.


    gettoday = ->
      redis.get 'today', (err, data) ->
        if err
          throw err
        if data == 'No School'
          today = 'No School'
        else
          today = JSON.parse(data)

The meaning of life

    isnow = ->

      console.log 'Finding Current Class'
      if today != 'No School'
        currentClass = underscore.filter(today, (item) ->
          moment().isBetween moment(item.stime), moment(item.etime)
        )
        if currentClass.length >= 1
          console.log 'Current class is ' + JSON.stringify(currentClass)
          redis.set 'currentclass', JSON.stringify(currentClass)
        else if upcoming.length >= 1
          console.log 'School today, but no current class'
          redis.set 'currentclass', 'Break'
        else if upcoming.length == 0
          console.log 'No upcoming classes, school is out now.'
          redis.set 'currentclass', 'No School'
      else
        console.log 'No School today'
        redis.set 'currentclass', 'No School'
      return

    isnext = ->
      console.log 'Finding Next Class'
      if today != 'No School'
        upcoming = []
        nextClass = []
        upcoming = underscore.filter(today, (item) ->

all upcoming classes.

          moment().isBefore moment(item.stime)
        )
        redis.set 'upcoming', JSON.stringify(upcoming)
        console.log upcoming
        if upcoming.length >= 1
          console.log 'upcoming is a pretty long ' + upcoming.length
          if parseInt(upcoming[0].key_name.slice(-1), 10) == 0

if it is not a split

            nextClass = []
            nextClass = upcoming.slice(0, 1)
          else if upcoming[0].key_name.slice(-1) != 0

If it is a split right now

            nextClass = []

Crazy Logic. Something to do with lunch splits. Needs a refactor.

            1stLunch = underscore.find(upcoming, (item) ->
              parseInt(item.key_name.slice(-1), 10) == 1
            )
            2ndLunch = underscore.find(upcoming, (item) ->
              parseInt(item.key_name.slice(-1), 10) == 2
            )
            if 1stLunch
              nextClass.push 1stLunch
            else
              nextClass.push upcoming[2]
            if 2ndLunch
              nextClass.push 2ndLunch
            else
              nextClass.push upcoming[2]
        else
          redis.set 'nextclass', 'No School'
        if nextClass.length >= 1
          redis.set 'nextclass', JSON.stringify(nextClass)
        else
          redis.set 'nextclass', 'No School'
      else
        redis.set 'nextclass', 'No School'
      return

    endsin = ->
      if currentClass != 'No School'

are there classes right now?

        underscore.each currentClass, (item) ->

do for all in currentclass

          item.etime = moment(
            h: item.ehour
            m: item.emin)

add etime to item

          item.remainingtime = Math.floor(moment.duration(item.etime.diff(moment())).asMinutes())

add remainingtime to item

          return
        remainingTime = underscore.pluck(currentClass, 'remainingtime')

get remainingtime from all entries in currentClass

        redis.set 'remainingtime', JSON.stringify(remainingTime)

set it

      else
        redis.set 'remainingtime', 'No School'
      return

    minutejob = scheduler.scheduleJob('0 * * * * *', ->

called every minute at 0 seconds

      gettoday()
      isnow()
      isnext()
      endsin()
      return
    )
    minutejob.invoke()
    redislistener.on 'message', (channel, message) ->
      if message == 'update'
        minutejob.invoke()
      return
