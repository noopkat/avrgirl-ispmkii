var util = require('util');
var async = require('async');
var stk500v2 = require('avrgirl-stk500v2');
var usb = require('usb');

function avrgirlIspmkii(chip) {
  var self = this;

  usb.setDebugLevel(0);

  var VID = 0x03eb;
  var PID = 0x2104;

  var device = usb.findByIds(VID, PID);

  if (!device) {
    return new Error('Could not find a connected AVRISP mkii device.');
  }

  var options = {
    chip: chip,
    debug: false,
    comm: device,
    frameless: true
  };

  this.signature = new Buffer('AVRISP_MK2');

  stk500v2.call(this, options);
};

util.inherits(avrgirlIspmkii, stk500v2);

avrgirlIspmkii.prototype.verifyProgrammer = function (callback) {
  var self = this;

  this.getSignature(function (error, data) {
    self.verifySignature(self.signature, data, function(error) {
      callback(error);
    });
  });
};

module.exports = avrgirlIspmkii;
