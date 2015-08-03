// harness
var test = require('tape');
// test helpers
var sinon = require('sinon');
var proxyquire = require('proxyquire');
var chip = require('./helpers/mock-chip');
var usbmock = require('./helpers/mock-usb');
// module to test
var avrgirl = proxyquire('../avrgirl-ispmkii', { 'usb': usbmock });
