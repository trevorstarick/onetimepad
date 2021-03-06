#!/usr/bin/env node
var Chance = require('chance');
var argv = require('optimist').argv;
var fs = require('fs');

// --print      [string]
// --pool       [string]
// --padLength  [int]
// --decode     [file]
// --encode     [file]

var fingerprint = argv.print || '3141592653';
var pool = argv.pool.toString() ||'0123456789abcdef';
var padLength = argv.padLength || 8;

var token = new Chance(fingerprint).apple_token();
var pad = new Chance(token).string({
  length: padLength * 1024,
  pool: pool
});

var otp = {
  encode: function(buffer) {
    var cryptext = '';
    var i = 0;

    buffer = buffer.toString('hex');
    buffer = buffer.split('');

    buffer.forEach(function(v) {
      var value = pool.indexOf(v);
      if (value > -1) {
        value += pool.indexOf(pad[i % pad.length]);
        cryptext += pool[value % pool.length];
        i += 1;
      } else {
        cryptext += v;
      }
    });

    return new Buffer(cryptext, 'hex');
  },
  decode: function(buffer) {
    var plaintext = '';
    var i = 0;

    buffer = buffer.toString('hex');
    buffer = buffer.split('');

    buffer.forEach(function(v) {
      var value = pool.indexOf(v);
      if (value > -1) {
        value -= pool.indexOf(pad[i % pad.length]);
        if (value < 0) value += pool.length;
        plaintext += pool[value % pool.length];
        i += 1;
      } else {
        plaintext += v;
      }

    });

    return new Buffer(plaintext, 'hex');
  }
};

function getExtension(string) {
  var ext = string.split('.');
  ext = ext.length > 1 ? '.' + ext[ext.length - 1] : '';
  return ext;
}

if (argv.decode) {
  var ext = getExtension(argv.decode);
  var d = otp.decode(fs.readFileSync(argv.decode));
  fs.writeFileSync('decoded' + ext, d);
} else if (argv.encode) {
  var ext = getExtension(argv.encode);
  var e = otp.encode(fs.readFileSync(argv.encode));
  fs.writeFileSync('encoded' + ext, e);
} else {
  var ext = getExtension(argv._[0]);
  var e = otp.encode(fs.readFileSync(argv._[0]););
  fs.writeFileSync('encoded' + ext, e);
}
