Specials Manager
Processes today's schedule
import all features

    config = require('../config.js')

    IsJsonString = (str) ->
      try
        JSON.parse str
      catch e
        return false
      true

    console.log 'Starting Data Processor...'

The format for a special input is like follows:

{name: 'optional name for reference', date:2015-09-23, schedule: [{\'key_name\':\'4-030\',\'name\':\'Block 1\',\'shour\':9,\'smin\':50,\'ehour\':10,\'emin\':55,\'day\':4}]}

Notes, Ignore:
append to array, push array to special on redis
dbman will read specials and see if any date matches
if date matches, send instead of regular planned schedule

    config.connect 'specials'
    redislistener.on 'message', (channel, message) ->
      console.log 'got message'
      redis.get 'specials', (err, res) ->
        if err
          console.log err
        specials = JSON.parse(res)
        input = JSON.parse(message)
        if IsJsonString(message)
          console.log 'got a new special'
          if Array.isArray(specials) == false
            specials = []
            console.log 'specials is bad, restarting'
          if typeof input.date == 'string' and Array.isArray(input.schedule)
            specials.push JSON.parse(message)
            redis.set 'specials', JSON.stringify(specials)
            redis.publish 'dbman', 'update'
        else
          console.log 'message invalid json'
        return
      return

Reporting to the service list.
ATTACH THIS TO ALL SERVICES

    console.log 'Reporting to service set'
    redis.zincrby 'services', 1, 'specialsman'

add us to the list

    process.on 'exit', (code) ->

for clean exit

      console.log 'Removing From service list'
      redis.zincrby 'services', -1, 'specialsman'

remove all instances

      redis.quit()
      redislistener.quit()
      return
    process.on 'SIGINT', (code) ->

for CTRL-C

      process.exit()

Do regular exit

      return

