// harness
var test = require('tape');
// test helpers
var sinon = require('sinon');
var proxyquire = require('proxyquire');
var chip = require('./helpers/mock-chip');
var usbmock = require('./helpers/mock-usb');
// module to test
var avrgirl = proxyquire('../avrgirl-ispmkii', { 'usb': usbmock });

// test options to pass in to most tests
var FLoptions = {
  chip: chip
};

test('[ AVRGIRL-ISPMKII ] initialise', function (t) {
  var a = new avrgirl(FLoptions);
  t.equal(typeof a, 'object', 'new is object');
  t.end();
});

test('[ AVRGIRL-ISPMKII ] device ready', function (t) {
  var a = new avrgirl(FLoptions);
  a.on('ready', function() {
    t.ok(typeof a.device === 'object', 'device created');
    t.pass('emitted "ready"');
    t.end();
  });
  t.timeoutAfter(500);
});

test('[ AVRGIRL-ISPMKII ] ::verifyProgrammer', function (t) {
  var a = new avrgirl(FLoptions);
  var stub = sinon.stub(a, 'getSignature', function(callback) {
    return callback(null, new Buffer('AVRISP_MK2'));
  });
  t.plan(1);

  a.verifyProgrammer(function(error) {
    t.error(error, 'no error on identical signatures');
  });
});
