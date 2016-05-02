/* global redis, redislistener */

// The Frontend of the API: ties everything together
// make sure to add all new features here when extending the system

var express = require('express')
var app = express()
// var ioredis = require('ioredis')
// var underscore = require('underscore')
var morgan = require('morgan')
var config = require('../config.js')
// var fs = require('fs')
var ecstatic = require('ecstatic')
// var https = require('https')
app.use(morgan('dev'))

console.log('Booting Frontend')
// Connect to the redis server
config.connect('frontend')

/*
 * Important Note
 * Because we are using redis as a backend, it costs almost nothing to patch each request directly through.
 * This reduces load in the long term because the frontend needs no memory or update scheme.
*/

// CORS headers
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

/*
var privateKey = fs.readFileSync('../sslcert/server.key').toString()
var certificate = fs.readFileSync('../sslcert/server.crt').toString()
var credentials = {key: privateKey, cert: certificate}
*/

app.use('/api', require('./routes/schedules')) // load the schedules routes
app.use('/api', require('./routes/authentication')) // load the schedules routes
app.use('/', ecstatic({ root: config.webroot }))
app.listen(3000)
/*
var httpsServer = https.createServer(credentials, app)
httpsServer.listen(3000)
*/

console.log('Reporting to service set')
redis.zincrby('services', 1, 'frontend') // add us to the list

process.on('exit', function (code) { // for clean exit
  console.log('Removing From service list')
  redis.zincrby('services', -1, 'frontend') // remove all instances
  redis.quit()
  redislistener.quit()
})
process.on('SIGINT', function (code) { // for CTRL-C
  process.exit() // Do regular exit
})
