var AvrgirlIspmkii = require('../avrgirl-ispmkii');
var intelhex = require('intel-hex');
var fs = require('fs');
var async = require('async');
var C  = require('../lib/c');

var attiny45 = {
  signature: [0x1E, 0x92, 0x06],
  timeout: 0xC8,
  stabDelay: 0x64,
  cmdexeDelay: 0x19,
  syncLoops: 0x20,
  byteDelay: 0x00,
  pollIndex: 0x03,
  pollValue: 0x53,
  preDelay: 0x01,
  postDelay: 0x01,
  pollMethod: 0x01,
  poll1: 0x00,
  poll2: 0x00,
  pgmEnable: [0xAC, 0x53, 0x00, 0x00],
  flash: {
    paged: true,
    mode: 0xC1,
    delay: 6,
    size: 4096,
    pageSize: 64,
    pages: 64,
    addressOffset: 1,
    write: [0x40, 0x4C, 0x20],
    read: [0x20, 0x00, 0x00],
    poll1: 0xFF,
    poll2: 0xFF
  },
  eeprom: {
    pages: true,
    mode: 0xC1,
    delay: 6,
    size: 256,
    pageSize: 4,
    pages: 64,
    addressOffset: 0,
    write: [0xC1, 0xC2, 0xA0],
    read: [0xA0, 0x00, 0x00],
    poll1: 0xFF,
    poll2: 0xFF
  },
  erase: {
    delay: 10,
    cmd: [0xAC, 0x80, 0x00, 0x00]
  },
  signature: {
    startAddress: 0x00,
    read: [0x30, 0x00, 0x00, 0x00]
  },
  fuses: {
    startAddress: 0x00,
    write: {
      low: [0xAC, 0xA0, 0x00, 0x00],
      high: [0xAC, 0xA8, 0x00, 0x00],
      ext: [0xAC, 0xA4, 0x00, 0x00]
    },
    read: {
      low: [0x50, 0x00, 0x00, 0x00],
      high: [0x58, 0x08, 0x00, 0x00],
      ext: [0x50, 0x08, 0x00, 0x00]
    }
  }
};

var avrgirl = new AvrgirlIspmkii(attiny45);

var pr = fs.readFileSync(__dirname + '/pr.hex', {encoding: 'utf8'});
var ee = fs.readFileSync(__dirname + '/eeprom.hex', {encoding: 'utf8'});
var prBin = intelhex.parse(pr).data;
var eeBin = intelhex.parse(ee).data;

avrgirl.on('ready', function() {
  // run demos
  async.series([
    avrgirl.verifyProgrammer.bind(avrgirl),
    avrgirl.enterProgrammingMode.bind(avrgirl),
    function hi (callback) {
      avrgirl.readChipSignature(function(error, data) {
        console.log('signature response read:' , data);
        callback();
      });
    },
    function hifuses (callback) {
      avrgirl.readFuses(function(error, data) {
        console.log('fuse response read:' , data);
        callback();
      });
    },
    function readeeprom (callback) {
      avrgirl.readEeprom(0x04, function(error, data) {
        console.log('eeprom response read:', error, data.toString('hex'));
        callback();
      });
    },
    function readflash (callback) {
      avrgirl.readFlash(0x04, function(error, data) {
        console.log('flash response read:', error, data.toString('hex'));
        callback();
      });
    },
    avrgirl.eraseChip.bind(avrgirl),
    avrgirl.writeMem.bind(avrgirl, 'flash', prBin),
    avrgirl.writeMem.bind(avrgirl, 'eeprom', eeBin),
    avrgirl.exitProgrammingMode.bind(avrgirl)
    ], function (error) {
      console.log(error);
      avrgirl.close();
    }
  );
});
