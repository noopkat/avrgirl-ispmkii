var AvrgirlIspmkii = require('../avrgirl-ispmkii');
var intelhex = require('intel-hex');
var fs = require('fs');

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
    mode: 0xc1,
    delay: 6,
    size: 4096,
    pageSize: 64,
    pages: 64,
    minWriteDelay: 4500,
    maxWriteDelay: 4500,
    cmd: [0x40, 0x4C, 0x20],
    poll1: 0xFF,
    poll2: 0xFF
  },
  erase: {
    delay: 6,
    cmd: [0xAC, 0x80, 0x00, 0x00]
  }
};

var avrgirl = new AvrgirlIspmkii(attiny45);

var pr = fs.readFileSync(__dirname + '/pr.hex', {encoding: 'utf8'});
var prBin = intelhex.parse(pr).data;

// PYRAMID OF DOOOOOOOOOOOOOOOOOOM
// (fix this eventually)
avrgirl.on('ready', function() {
  console.log('ready!');
  avrgirl.getSignature(function(error, data) {
    if (!error) {
      avrgirl.verifySignature(data, function(error) {
        var status = (error) ? error : 'verified!';
        console.log(status);
        avrgirl.enterProgrammingMode(function(error) {
          var status = (error) ? error : 'progamming mode entered';
          console.log(status);
          avrgirl.eraseChip(function(error) {
            avrgirl.writeFlash(prBin, function(error) {
              var status = (error) ? error : 'flash complete';
              console.log(status);
              avrgirl.exitProgrammingMode(function(error) {
                var status = (error) ? error : 'progamming mode left';
                console.log(status);
                avrgirl.close();
              });
            });
          });
        });
      });
    };
  });
});
