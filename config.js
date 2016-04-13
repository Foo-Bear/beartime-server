/* globals redis, redislistener */
var exports = module.exports = {
  'secret': 'supersecret', // Should not be human legible
  'dbaddr': 'localhost:',
  'dbport': '6379',
  'dbpass': 'AWE4*AngB*S1N_=R3$D8^9jN%5&V1&kn4|lpwTN+bvVIYeCkn!@4FTi*jojDcpqq!l#^lObcewmSM$dkvNIf3bGOM$WlzsBSet1sxWl#M=Rd?P|%&vavobHfLdtzjK9ny$f4%Z0V-jV1eU6sQ8t7X+r#886B^%SUEIhe#w4ebeI@1KI&a*@48KUwO7ZU&u_vCpG7_shY0CMDkYqws9ra3x0isyi-|D7T15#VPO5UkSC9dIGLid8DHXkR2t#qEXuY@b$FqrS0XAug5K&Jw1wi%*pL7n|WX$^Bs?fnVc0KAC@wVyD?J3*OKjMDlxI&yO^ALZ-L-2wK2mf7=ZE|06cgB54ZkaV|g=MnJ#9V1Q6P#yomvF=%#6pXFMTJ3C!b^h5xgGr@-*21pUp8Wh1mFaAG?lXjaEaD!aXnKsR%wZk%8t_fLP6mIZF*|QopI%8i4J_+gj6=38LWOe=f6gK9aH?Xb111^R1uRF#xWEk*0SGwN&I-5C*AsomF*|ICqO512Yl^aKaucU8+e2v3D7D4B_L|OUTPeg8M=!VywZ^NjKGTn!c4H9oszhMJ|_QX7KPB1FHZgnv8@hK+B%#x8_$a_EQlNB33cJ!qddyqQ=rZEqUBsKhrNaY9GB_e_02d00kaVyjnngSedW4IW70TP2NoZkuTFxD!l7Lbyl7DmlOyUc5^nz#&AU%JO?|v_|Lj0N0V=Q3FM4xYlm#nyaY^K*z8t+?vME0-$6vnM8E#i!bdiQae|qcIKDsJ5_0mz8W42PFk4eM5x2%!n85Oe_z3jt@*^^$NU%!uEF-Mtc@^%#N|+mzt9d81tBFCR!%GmFEPm^Ihm6KHx^j2c!xs*r_Zkxe1w8#^ls%pHYe%5xGDVU8a#+V_oY8*6i7UXe2vhvh^d!^Yi+p=SNr*O%aL9h|SC&_^lOr4Xsz&-Kh5P7TVVH+qr4n^D!8uScnhvN^*sTD1q4ZR-#S2Z8r*xSRHTcKdW-dLM7Ae9?1?*eqL81ID&GdjWRRH%O?lQdTqzvBH-pGwEtXqXFzU',
  'webroot': '/Users/kschamplin19/Documents/bearweb/public'
}
var Ioredis = require('ioredis')
exports.connect = function (sub) {
  console.log('Connecting to the Redis Server')
  redis = new Ioredis(exports.dbport, exports.dbaddr)
  redis.on('connect', function (result) {
    console.log('Connected to redis')
  })
  redis.auth(exports.dbpass)
  redis.on('error', function (result) {
    throw result
  })
  redislistener = new Ioredis(exports.dbport, exports.dbaddr)
  redislistener.on('connect', function (result) {
    console.log('Subscriber connected')
  })
  redislistener.auth(exports.dbpass)
  redislistener.on('error', function (result) {
    throw result
  })
  redislistener.subscribe(sub)
}
