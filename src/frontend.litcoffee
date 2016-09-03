The Frontend of the API: ties everything together
make sure to add all new features here when extending the system

First require a bunch of things. 

    express = require('express')
    app = express()
    morgan = require('morgan')
    config = require('../config.js')
    ecstatic = require('ecstatic')
    if process.env.NODE_ENV != 'test'
      app.use morgan('tiny')

Connect to the redis server

    config.connect 'frontend'

    log = (string) ->
      if process.env.NODE_ENV != 'test'
        console.log string
    log 'Starting Frontend...'

CORS headers.

    app.use (req, res, next) ->
      res.header 'Access-Control-Allow-Origin', '*'
      res.header 'Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept'
      next()

Import all routes and assign a static route from the config. See those files for details.

    app.use '/api', require './routes/schedules'
    app.use '/api', require './routes/authentication'
    app.use '/', ecstatic root: config.webroot

Start the listener

    app.listen 3000

