/* global redis, redislistener */

// The Frontend of the API: ties everything together
// make sure to add all new features here when extending the system

var express = require('express')
var app = express()
// var ioredis = require('ioredis')
// var underscore = require('underscore')
var morgan = require('morgan')
var config = require('../config.js')
var fs = require('fs')
var Log = require('log')
var log = new Log('debug', fs.createWriteStream('../frontend.log'))

var accessLogStream = fs.createWriteStream('../access.log', {flags: 'a'})
app.use(morgan('common', {stream: accessLogStream}))

log.info('Booting Frontend')
// Connect to the redis server
config.connect('frontend')

/*
 * Important Note
 * Because we are using redis as a backend, it costs almost nothing to patch each request directly through.
 * This reduces load in the long term because the frontend needs no memory or update scheme.
 */

// CORS hedaders
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

app.use('/', require('./routes/schedules')) // load the schedules routes
app.use('/', require('./routes/authentication')) // load the schedules routes

app.listen(3000)

log.debug('Reporting to service set')
redis.zincrby('services', 1, 'frontend') // add us to the list

process.on('exit', function (code) { // for clean exit
  log.debug('Removing From service list')
  redis.zincrby('services', -1, 'frontend') // remove all instances
  redis.quit()
  redislistener.quit()
})
process.on('SIGINT', function (code) { // for CTRL-C
  process.exit() // Do regular exit
})
