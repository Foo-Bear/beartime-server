{exec, spawn, execSync} = require 'child_process'
{minify} = require 'uglify-js'
chalk = require 'chalk'
fs = require 'fs'
walk = require('walk')

task 'build', 'build stuff', ->
  exec 'coffee --compile --output modules/ src/', (err, stdout, stderr) ->
    throw err if err
    console.log stdout + stderr
    console.log 'done!'

task 'host', 'light it up!', ->
  new Service 'dbman'
  new Service 'frontend'
  new Service 'specialsman'

class Service
  constructor: (name) ->
    service = spawn "node", ["modules/#{name}.js"]
    service.stdout.on 'data', (data) -> console.log "#{name}: #{data}"
    service.stderr.on 'data', (data) -> console.log chalk.bold.red "#{name} ERR: #{data}"



task 'docs', 'build the docs', ->
  files = []
  # Walker options
  walker = walk.walk('./src', followLinks: false)
  walker.on 'file', (root, stat, next) ->
    # Add this file to the list of files
    files.push root + '/' + stat.name
    next()
    return
  walker.on 'end', ->
    for file in files
      console.log "docco #{file}"
      execSync "docco #{file}", (err, stdout, stderr) ->
        throw err if err
        console.log stdout + stderr
    return