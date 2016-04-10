/* global redis, redislistener */

// Specials Manager
// Processes today's schedule
log.debug('Starting Data Processor...')
// import all features
var config = require('../config.js')
var fs = require('fs')
var Log = require('log')
var log = new Log('debug', fs.createWriteStream('../specialsman.log'))

log.debug('Starting Data Processor...')
function IsJsonString (str) {
  try {
    JSON.parse(str)
  } catch (e) {
    return false
  }
  return true
}
/*
The format for a special input is like follows:

{name: 'optional name for reference', date:2105-9-23, schedule: [{\'key_name\':\'4-030\',\'name\':\'Block 1\',\'shour\':9,\'smin\':50,\'ehour\':10,\'emin\':55,\'day\':4}]}

Notes, Ignore:
append to array, push array to special on redis
dbman will read specials and see if any date matches
if date matches, send instead of regular planned schedule
*/
config.connect('specials')

redislistener.on('message', function (channel, message) {
  log.debug('got message')
  redis.get('specials', function (err, res) {
    if (err) log.error(err)
    var specials = JSON.parse(res)
    var input = JSON.parse(message)
    if (IsJsonString(message)) {
      log.debug('got a new special')
      if (Array.isArray(specials) === false) {
        specials = []
        log.debug('specials is bad, restarting')
      }
      if (typeof input.date === 'string' && Array.isArray(input.schedule)) {
        specials.push(JSON.parse(message))
        redis.set('specials', JSON.stringify(specials))
        redis.publish('dbman', 'update')
      }
    } else {
      log.debug('message invalid json')
    }
  })
})

// Reporting to the service list.
// ATTACH THIS TO ALL SERVICES
log.info('Reporting to service set')
redis.zincrby('services', 1, 'specialsman') // add us to the list

process.on('exit', function (code) { // for clean exit
  log.info('Removing From service list')
  redis.zincrby('services', -1, 'specialsman') // remove all instances
  redis.quit()
  redislistener.quit()
})
process.on('SIGINT', function (code) { // for CTRL-C
  process.exit() // Do regular exit
})
