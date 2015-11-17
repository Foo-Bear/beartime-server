// Specials Manager
// Processes today's schedule
console.log('Starting Data Processor...');
//import all features
console.log('Loading Dependencies');
var ioredis = require('ioredis'); // redis clients
var moment = require('moment'); //date/time thing
var scheduler = require('node-schedule'); // autoupdater

console.log('Loaded Dependencies');
