var exports = module.exports = {

    'secret': 'supersecret', // Should not be human legible
    'dbaddr': 'localhost:',
    'dbport': '6379',
    'dbpass': 'pass'
};
var ioredis = require('ioredis');
exports.connect = function (sub) {
  console.log('Connecting to the Redis Server');
  redis = new ioredis(exports.dbport, exports.dbaddr);
  redis.on('connect', function(result) {
    console.log("Connected to redis");
  });
  redis.on('error', function(result) {
    throw result;
  });
  redislistener = new ioredis(exports.dbport, exports.dbaddr);
  redislistener.on('connect', function(result) {
    console.log("Subscriber connected");
  });
  redislistener.on('error', function(result) {
    throw result;
  });
  redislistener.subscribe(sub);
}
