### global redis, redislistener ###

# Database manager microservice
# Does the actual file writing and parsing
moment = require('moment')
scheduler = require('node-schedule')
underscore = require('underscore')
config = require('../config.js')
fs = require('fs')
console.log 'Starting Database Manager...'

config.connect 'dbman'
basejson = {}

update = ->
  # read the database async
  console.log 'Loading the Database Files'
  basejson = JSON.parse(fs.readFileSync('db/database.json'))
  return

# check what to return

parserDay = (date) ->
  console.log 'Parsing the Database Files'
  #get the classes for today
  db = basejson.treeroot
  today = underscore.filter(db, (item) ->
    moment().isSame moment().day(item.day), 'day'
  )
  # next we see if there is any specials today
  todaySpecials = undefined
  redis.get 'specials', (err, res) ->
    if err
      console.log err
    console.log 'DEBUG: getting specials'
    specialsArray = JSON.parse res
    todaySpecials = underscore.find(specialsArray, (item) ->
      console.log 'item ' + item.date
      moment().isSame moment(item.date), 'day'
    )
    # console.log(todaySpecials.schedule)
    # then we check which to return
    # we do it in here so that it is a promise
    if today.length == 0 and typeof todaySpecials == 'undefined'
      redis.set 'today', 'No School'
    else if typeof todaySpecials != 'undefined'
      # otherwise if there is a special schedule
      redis.set 'today', JSON.stringify(todaySpecials.schedule)
      # return today defaults
      if specialsArray.indexOf(todaySpecials) > -1
        specialsArray.splice specialsArray.indexOf(todaySpecials), 1
    else
      redis.set 'today', JSON.stringify(today)
    redis.set 'schedule', JSON.stringify(db)
    return
  return

parserWeek = ->

# run every day
dayjob = scheduler.scheduleJob('0 0 * * *', ->
  console.log 'Running Daily Update'
  update()
  parserDay()
  return
)
# call the job on startup cause we don't want to wait
dayjob.invoke()
#weekly updater for new app.
weekjob = scheduler.scheduleJob('0 0 0 * *', ->
  parserWeek()
  return
)
# redis update subscriber
redislistener.on 'message', (channel, message) ->
  if message == 'update' and channel == 'dbman'
    console.log 'Got an update request from the Redis Channel'
    dayjob.invoke()
  return
# Reporting to the service list.
# ATTACH THIS TO ALL SERVICES
console.log 'Reporting to service set'
redis.zincrby 'services', 1, 'dbman'
# add us to the list
process.on 'exit', (code) ->
  # for clean exit
  console.log 'Removing From service list'
  redis.zincrby 'services', -1, 'dbman'
  # remove all instances
  redis.quit()
  redislistener.quit()
  return
process.on 'SIGINT', (code) ->
  # for CTRL-C
  process.exit()
  # Do regular exit
  return