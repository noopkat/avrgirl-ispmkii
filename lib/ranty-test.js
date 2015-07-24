var usb = require('usb');
usb.setDebugLevel(0);

var VID = 0x03eb;
var PID = 0x2104;
var CMD_SIGN_ON = 0x01;
var TOKEN = 0x0E;

/* There are several ways to parse MSB and LSB of the message
 * I haven't decided on which way is best yet and I do not need to for the mkii
 */
// var messageLen = new Buffer([0,1]);
// messageLen.writeUInt16BE(0,0);
//var messageLen = [((1 >> 8) & 0xFF), (1 & 0xFF)];

/* So it would be great if Atmel actually followed their own standard STK500v2 protocol, but no.
 * Considering that no one programs these manually except idiots like myself, AVR Studio would normally be just be taking
 * care of the headers/framing so the programmer can just follow it properly but whatever.
 */
var wholeMessage = [0x01];
// this is what you would normally need
// var wholeMessage = [0x1B, 0xff, messageLen[0], messageLen[1], TOKEN, CMD_SIGN_ON];

// no checksum needed either but here it is anyway
// var checksum = 0;
// for (var i = 0; i < wholeMessage.length; i += 1) {
//   checksum ^= wholeMessage[i];
// }
// don't push as it's not needed
//wholeMessage.push(checksum);
var out = new Buffer(wholeMessage);

var device = usb.findByIds(VID, PID);
// *shakes fist at OSX*
(function(__open) {
  device.__open = function() {
    __open.call(this);
    this.__claimInterface(0);
  };
})(device.__open);

device.open();
var endpointOut = device.interfaces[0].endpoints[1];
var endpointIn = device.interfaces[0].endpoints[0];

console.log('sending:', wholeMessage);

endpointOut.transfer(out, function(error) {
  if (error) { return console.log('transfer error:', error); }
  endpointIn.transfer(17, function(error, data) {
    if (error) { return console.log('read error:', error); }
    console.log('received data: ',  data.toString());
    device.close();
  });
});

