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
  predelay  : 0x01,
  postdelay : 0x01,
  pollmethod : 0x01,
  pgmEnable: [0xAC, 0x53, 0x00, 0x00]
};

avrgirl.on('ready', function() {
  console.log('ready!');
  avrgirl.getSignature(function(error, data) {
    if (!error) {
      avrgirl.verifySignature(data, function(error) {
        var status = (error) ? error : 'verified!';
        console.log(status);
        //avrgirl.close();
        avrgirl.enterProgrammingMode(attiny45, function(error) {
          var status = (error) ? error : 'progamming mode entered';
          console.log(status);
        });
      });
    }
  });
});
