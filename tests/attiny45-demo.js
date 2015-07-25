var AvrgirlIspmkii = require('../avrgirl-ispmkii');
var intelhex = require('intel-hex');
var fs = require('fs');
var async = require('async');

var attiny45 = {
  timeout : 0xC8,
  stabDelay : 0x64,
  cmdexeDelay : 0x19,
  syncLoops  : 0x20,
  byteDelay : 0x00,
  pollIndex : 0x03,
  pollValue : 0x53,
  preDelay  : 0x01,
  postDelay : 0x01,
  pollMethod : 0x01,
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
    minWriteDelay: 4500,
    maxWriteDelay: 4500,
    cmd: [0x40, 0x4C, 0x20],
    poll1: 0xFF,
    poll2: 0xFF
  },
  eeprom: {
    size: 256,
    pageSize: 4,
    pages: 64,
    addressOffset: 0,
    mode: 0xC1,
    delay: 6,
    cmd: [0xC1, 0xC2, 0xA0],
    readCmd: [0xA0, 0x00, 0x00],
    poll1: 0xFF,
    poll2: 0xFF
  },
  erase: {
    delay: 10,
    cmd: [0xAC, 0x80, 0x00, 0x00]
  }
};

var avrgirl = new AvrgirlIspmkii(attiny45);

var pr = fs.readFileSync(__dirname + '/pr.hex', {encoding: 'utf8'});
var ee = fs.readFileSync(__dirname + '/eeprom.hex', {encoding: 'utf8'});
var prBin = intelhex.parse(pr).data;
var eeBin = intelhex.parse(ee).data;

avrgirl.on('ready', function() {
  async.series([
    avrgirl.verifyProgrammer.bind(avrgirl),
    avrgirl.enterProgrammingMode.bind(avrgirl),
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
