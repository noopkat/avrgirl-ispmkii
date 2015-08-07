// harness
var test = require('tape');
// test helpers
var sinon = require('sinon');
var proxyquire = require('proxyquire');
var chip = require('./helpers/mock-chip');
var usbmock = require('./helpers/mock-usb');
// module to test
var avrgirl = proxyquire('../avrgirl-ispmkii', { 'usb': usbmock });

test('[ AVRGIRL-ISPMKII ] ::verifyProgrammer', function (t) {
  var a = new avrgirl(FLoptions);
  var sig1 = new Buffer([0xff, 0xff, 0xff]);
  var sig2 = new Buffer([0x00, 0x00, 0x00]);

  t.plan(2);

  a.verifyProgrammer(sig1, function(error) {
    t.error(error, 'no error on identical signatures');
  });

  a.verifyProgrammer(sig2, function(error) {
    var msg = 'returns error on non matching signature';
    if (!error) {
      t.fail(msg);
    } else {
      t.pass(msg)
    }
  });
});
