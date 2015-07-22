var usb = require('usb');
usb.setDebugLevel(0);

var VID = 0x03eb;
var PID = 0x2104;
var CMD_SIGN_ON = 0x01;
var TOKEN = 0x0E;

// var messageLen = new Buffer([0,1]);
// messageLen.writeUInt16BE(0,0);
// var messageLen = [((2 >> 8) & 0xFF), (2 & 0xFF)];
var messageLen = [((1 >> 8) & 0xFF), (1 & 0xFF)];

// var wholeMessage = [0x1B, 0xff, messageLen[0], messageLen[1], TOKEN, CMD_SIGN_ON];
var wholeMessage = [0x01];

var checksum = 0;
for (var i = 0; i < wholeMessage.length; i += 1) {
  checksum ^= wholeMessage[i];
}
//wholeMessage.push(checksum);
var out = new Buffer(wholeMessage);

var device = usb.findByIds(VID, PID);
device.open();

console.log('sending:', wholeMessage);

device.interfaces[0].endpoints[1].transfer(out, function(error) {
  console.log('transfer error:', error);
  device.interfaces[0].endpoints[0].transfer(17, function(error, data) {
    console.log('read error:', error);
    console.log('received data:', data.toString());
    device.close();
  });
});

