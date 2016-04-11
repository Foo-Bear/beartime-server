/* global redis, redislistener */

// Database manager microservice
// Does the actual file writing and parsing

// import all features

// var ioredis = require('ioredis') // redis clients
var moment = require('moment') // date stime thing
var scheduler = require('node-schedule') // autoupdater
var underscore = require('underscore')
var config = require('../config.js')
var fs = require('fs')
var Log = require('log')
var log = new Log('debug', fs.createWriteStream('../dbman.log'))
log.info('Starting Database Manager...')

// Connect to the redis server
config.connect('dbman')

// define the different schedule arrays.
var basejson = {}

// update the db

var update = function () {
  // read the database async
  log.debug('Loading the Database Files')
  basejson = JSON.parse(fs.readFileSync('../db/database.json'))
}
// check what to return

var parser = function (db) {
  log.debug('Parsing the Database Files')
  db = db || basejson.treeroot // take a db or default to the basejson
  var today = underscore.filter(db, function (item) {
    return moment().isSame(moment().day(item.day), 'day')
  })
  // next we see if there is any specials today
  var todaySpecials
  redis.get('specials', function (err, res) {
    if (err) log.error(err)
    log.debug('DEBUG: getting specials')
    var specialsArray = JSON.parse(res)
    todaySpecials = underscore.find(specialsArray, function (item) {
      log.debug('item ' + item.date)
      return moment().isSame(moment(item.date), 'day')
    })
    // log.debug(todaySpecials.schedule)
    // then we check which to return
    // we do it in here so that it is a promise
    if (today.length === 0 && typeof todaySpecials === 'undefined') { // if there is nothing
      redis.set('today', 'No School')
    } else if (typeof todaySpecials !== 'undefined') { // otherwise if there is a special schedule
      redis.set('today', JSON.stringify(todaySpecials.schedule)) // return today defaults
      if (specialsArray.indexOf(todaySpecials) > -1) {
        specialsArray.splice(specialsArray.indexOf(todaySpecials), 1)
      }
    } else {
      redis.set('today', JSON.stringify(today))
    }
    redis.set('schedule', JSON.stringify(db))
  })
}

// run every day
var dayjob = scheduler.scheduleJob('0 0 * * *', function () {
  log.debug('Running Daily Update')
  update()
  parser()
})
// call the job on startup cause we don't want to wait
dayjob.invoke()

// redis update subscriber

redislistener.on('message', function (channel, message) {
  if (message === 'update' && channel === 'dbman') {
    log.debug('Got an update request from the Redis Channel')
    dayjob.invoke()
  }
})

// Reporting to the service list.
// ATTACH THIS TO ALL SERVICES
log.debug('Reporting to service set')
redis.zincrby('services', 1, 'dbman') // add us to the list

process.on('exit', function (code) { // for clean exit
  log.debug('Removing From service list')
  redis.zincrby('services', -1, 'dbman') // remove all instances
  redis.quit()
  redislistener.quit()
})
process.on('SIGINT', function (code) { // for CTRL-C
  process.exit() // Do regular exit
})
