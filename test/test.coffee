{assert, expect} = require 'chai'
should = require('chai').should() #for BDD
require "coffee-script/register"
moment = require 'moment'
http = require('http')
process.env.NODE_ENV = 'test' #disable logging

dbman = require '../src/dbman'


describe 'Day schedule', ->
  day = null
  weekEnd = null
  before ->
    dbman.parserDay(moment("9-2-2016", "MM-DD-YYYY")).then (res) -> day = res
    dbman.parserDay(moment("9-3-2016", "MM-DD-YYYY")).then (res) -> weekEnd = res

  it 'returns null if there is no school that day', ->
    expect(weekEnd).to.be.null

  it 'is an array', ->
    day.should.be.an 'array'

  it 'contains class objects', ->
    for item in day
      item.should.be.an 'object'


describe 'Class Object', ->
  day = null
  before ->
    dbman.parserDay(moment("9-2-2016", "MM-DD-YYYY")).then (res) -> day = res

  it 'is an object', ->
    for item in day
      item.should.be.an 'object'

  it 'has a valid start time', ->
    for item in day
      startTime = moment(item.start, 'hh:mma').isValid()
      startTime.should.be.true

  it 'has a valid end time', ->
    for item in day
      endTime = moment(item.end, 'hh:mma').isValid()
      endTime.should.be.true

  it 'has a number or name property', ->
    for item in day
      item.should.have.any.keys 'number', 'name'

describe 'Week Schedule', ->
  week = null

  before ->
    dbman.parserWeek().then (res) ->
      week = res

  it 'gets a response' , ->
    week.should.be.ok

  it 'is an object', ->
    week.should.be.an 'object'

  it 'has a day schedule for each school day of the week', ->
    for i in [1..5]
      week[moment().day(i).format('dddd')].should.be.an 'array'
    
    
frontend = require '../src/frontend'

describe 'Frontend', ->
  it 'returns 200', (done) ->
    http.get 'http://localhost:3000/api/day', (res) ->
      res.statusCode.should.equal 200
      done()
    


  
    
