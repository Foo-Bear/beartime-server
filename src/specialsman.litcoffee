##Specials Manager
####Processes today's schedule
import all features. Not very many. We also have a function for testing JSON.

    config = require('../config.js')

    IsJsonString = (str) ->
      try
        JSON.parse str
      catch e
        return false
      true

    console.log 'Starting Specials Manager...'
    config.connect 'specials'


    redislistener.on 'message', (channel, message) ->

When we get a message, parse it through our parser.

      console.log 'got message'

Load the current specials array.

      redis.get 'specials', (err, res) ->
        if err
          console.log err

Parse and verify JSON message.

        specials = JSON.parse(res)
        input = JSON.parse(message)
        if IsJsonString(message)
          console.log 'got a new special'

Verify that the specials global is an array. Otherwise, refresh it.

          if Array.isArray(specials) == false
            specials = []
            console.log 'specials is bad, restarting'

Do some typechecking to make sure that no problems occur later.

          if typeof input.date == 'string' and Array.isArray(input.schedule)

It's all good at this point, so go ahead and add it to the array and set the new global.
Also update the dbman, because a new special might affect schedules.

            specials.push JSON.parse(message)
            redis.set 'specials', JSON.stringify(specials)
            redis.publish 'dbman', 'update'

cleanup

        else
          console.log 'message invalid json'
