### global redis, redislistener ###

# Database manager microservice
# Does the actual file writing and parsing
moment = require('moment')
scheduler = require('node-schedule')
underscore = require('underscore')
config = require('../config.js')
fs = require('fs')
async = require 'async'
console.log 'Starting Database Manager...'

config.connect 'dbman'
basejson = {}

update = ->
  # read the database async
  console.log 'Loading the Database Files'
  basejson = JSON.parse(fs.readFileSync('db/database.json'))
  return

# check what to return

parserDay = (update, date, callback) ->
  console.log 'parsing a day: ' + moment(date).format('YYYY-MM-DD')

  today = basejson.treeroot[moment().day()] unless date?
  if date?
    today = basejson.treeroot[moment(date if date?).day()]
  # next we see if there is any specials today
  todaySpecials = undefined
  redis.get 'specials', (err, res) ->
    if err
      console.log err

    specialsArray = JSON.parse res
    todaySpecials = underscore.find(specialsArray, (item) ->
      moment(date if date?).isSame moment(item.date, 'YYYY-MM-DD'), 'day'
    )
    if todaySpecials? then today = todaySpecials.schedule
    if update
      setToday today
    if callback
      callback today
  
  

parserWeek = ->
  week = []
  async.eachSeries [1..5], 
    (item, callback) ->
      parserDay false, moment().day(item), (today) -> week[item] = today; callback()
    () -> redis.set 'week', JSON.stringify week


setToday = (daySchedule) ->
  if daySchedule?
    redis.set 'today', JSON.stringify(daySchedule)
  else
    redis.set 'today', 'No School'
  redis.set 'schedule', JSON.stringify(basejson.treeroot)



# run every day
dayjob = scheduler.scheduleJob('0 0 * * *', ->
  console.log 'Running Daily Update'
  update()
  parserDay(true)
  parserWeek()
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