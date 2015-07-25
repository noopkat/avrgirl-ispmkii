var AvrgirlIspmkii = require('../avrgirl-ispmkii');
var avrgirl = new AvrgirlIspmkii();

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
  pgmEnable: [0xAC, 0x53, 0x00, 0x00]
};

avrgirl.on('ready', function() {
  console.log('ready!');
  avrgirl.getSignature(function(error, data) {
    if (!error) {
      avrgirl.verifySignature(data, function(error) {
        var status = (error) ? error : 'verified!';
        console.log(status);
        avrgirl.enterProgrammingMode(attiny45, function(error) {
          var status = (error) ? error : 'progamming mode entered';
          console.log(status);
          avrgirl.exitProgrammingMode(attiny45.preDelay, attiny45.postDelay, function(error) {
            var status = (error) ? error : 'progamming mode left';
            console.log(status);
            avrgirl.close();
          });
        });
      });
    };
  });
});
