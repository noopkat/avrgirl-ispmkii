var usb = require('usb');
var util = require('util');
var async = require('async');
var stk500v2 = require('avrgirl-stk500v2');

function avrgirlIspmkii(chip) {
  var self = this;

  usb.setDebugLevel(0);

  var VID = 0x03eb;
  var PID = 0x2104;

  var device = usb.findByIds(VID, PID);

  var options = {
    chip: chip,
    debug: true,
    comm: device,
    frameless: true
  };

  stk500v2.call(this, options);

};

util.inherits(avrgirlIspmkii, stk500v2);

avrgirlIspmkii.prototype.verifyProgrammer = function (sig, callback) {
  var self = this;

  this.getSignature(function (error, data) {
    self.verifySignature(sig, data, function(error) {
      callback(error);
    });
  });
};

module.exports = avrgirlIspmkii;
