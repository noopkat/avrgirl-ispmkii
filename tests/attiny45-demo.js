var AvrgirlIspmkii = require('../avrgirl-ispmkii');
var avrgirl = new AvrgirlIspmkii();

avrgirl.on('ready', function() {
  console.log('ready!');
  avrgirl.getSignature(function(error, data) {
    if (!error) {
      avrgirl.verifySignature(data, function(error) {
        var status = (error) ? error : 'verified!';
        console.log(status);
        avrgirl.close();
      });
    }
  });
});
