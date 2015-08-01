// harness
var test = require('tape');
// test helpers
var sinon = require('sinon');
var proxyquire = require('proxyquire');
var chip = require('./helpers/mock-chip');
var usbmock = require('./helpers/mock-usb');
// module to test
var avrgirl = proxyquire('../avrgirl-ispmkii', { 'usb': usbmock });

test('[ AVRGIRL-ISPMKII ] initialise', function (t) {
  var a = new avrgirl(chip);
  t.equal(typeof a, 'object', 'new is object');
  t.end();
});

test('[ AVRGIRL-ISPMKII ] device ready', function (t) {
  var a = new avrgirl(chip);
  a.on('ready', function() {
    t.ok(typeof a.device === 'object', 'device created');
    t.ok(a.device.interfaces.length, 'interfaces set up');
    t.pass('emitted "ready"');
    t.end();
  });
  t.timeoutAfter(500);
});

test('[ AVRGIRL-ISPMKII ] method presence', function (t) {
  var a = new avrgirl(chip);
  function isFn(name) {
    return typeof a[name] === 'function';
  };
  var methods = [
    'open',
    'close',
    '_write',
    '_read',
    '_setUpInterface',
    '_sendCmd',
    'getSignature',
    'verifySignature',
    'verifyProgrammer',
    'loadAddress',
    'loadPage',
    'writeMem',
    'enterProgrammingMode',
    'exitProgrammingMode',
    'eraseChip',
    'writeFlash',
    'writeEeprom',
    'readChipSignature',
    'readFuses',
    'cmdSpiMulti',
    'setParameter',
    'getParameter',
  ];
  for (var i = 0; i < methods.length; i += 1) {
    t.ok(isFn(methods[i]), methods[i]);
    if (i === (methods.length - 1)) {
      t.end();
    }
  }

});
