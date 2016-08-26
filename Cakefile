{exec, spawn} = require 'child_process'
{minify} = require 'uglify-js'
chalk = require 'chalk'
fs = require 'fs'

task 'build', 'build stuff', ->
  exec 'coffee --compile --output modules/ src/', (err, stdout, stderr) ->
    throw err if err
   	console.log stdout + stderr
   	console.log 'done!'

task 'host', 'light it up!', ->
	new Service 'dbman'
	new Service 'dataprocessor'
	new Service 'frontend'
	new Service 'specialsman'

class Service
	constructor: (name) ->
		service = spawn "node", ["modules/#{name}.js"]
		service.stdout.on 'data', (data) => console.log "#{name}: #{data}"
		service.stderr.on 'data', (data) => console.log chalk.bold.red "#{name} ERR: #{data}"
