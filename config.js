/* globals redis, redislistener */
var exports = module.exports = {
  'secret': 'supersecret', // Should not be human legible
  'dbaddr': '127.0.0.1',
  'dbport': '6379',
  'dbpass': 'OQt_lrLSa#?*FnjFD5?bcr7^ODDl%8c&bz&LW4VL0-KmQBi61pgdxfh&XeNlu$WUGL!egs=saZ_!BAAz#Rv^HpliyH7zbb_n9LCF|RHeGH+mrutHiMxJYqlBgw9pqiJO9Hqh?X$Ouc9hUhG^vJ&#=-rvCCrK1i0skgpsmz@lVBBY#|Lphf@f0i^uDnWIAG8icM|TAbHVSn*x2nDFlUawA7bqp$aX!a$4rYLiMjtum1^17Y_eEuT2IL6Ew@H5Abu!',
  'webroot': '/Users/kschamplin19/Documents/bearweb/public'
}
var Ioredis = require('ioredis')
exports.connect = function (sub) {
  console.log('Connecting to the Redis Server')
  redis = new Ioredis({
    port: exports.dbport,
    host: exports.dbaddr,
    password: exports.dbpass
  })
  redis.on('connect', function (result) {
    console.log('Connected to redis')
  })
  redis.on('error', function (result) {
    throw result
  })
  redislistener = new Ioredis({
    port:exports.dbport,
    host: exports.dbaddr,
    password: exports.dbpass
  })
  redislistener.on('connect', function (result) {
    console.log('Subscriber connected')
  })
  redislistener.on('error', function (result) {
    throw result
  })
  redislistener.subscribe(sub)
}
