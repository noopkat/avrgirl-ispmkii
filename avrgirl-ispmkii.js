var usb = require('usb');
var C = require('./lib/c');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var async = require('async');

function avrgirlIspmkii(options) {
  var self = this;
  this.options = options;
  EventEmitter.call(this);
  usb.setDebugLevel(0);

  this.VID = 0x03eb;
  this.PID = 0x2104;

  this.device = usb.findByIds(this.VID, this.PID);

  // *shakes fist at OSX*
  (function(self, __open) {
    self.device.__open = function() {
      __open.call(this);
      // injecting this line here to alleviate a bad error later
      this.__claimInterface(0);
    };
  })(this, this.device.__open);

  this.open();
  this._setUpInterface(function(error) {
    if (!error) {
      setImmediate(emitReady, self);
    }
  });
};

util.inherits(avrgirlIspmkii, EventEmitter);

function emitReady(self) {
  self.emit('ready');
}

avrgirlIspmkii.prototype.open = function() {
  this.device.open();
};

avrgirlIspmkii.prototype.close = function() {
  this.device.close();
};

avrgirlIspmkii.prototype._setUpInterface = function(callback) {
  if (!this.device.interfaces) { return new Error('Failed to set up interfaces: device is not currently open.'); }
  this.endpointOut = this.device.interfaces[0].endpoints[1];
  this.endpointIn = this.device.interfaces[0].endpoints[0];
  callback(null);
};

avrgirlIspmkii.prototype._write = function (buffer, callback) {
  if (!Buffer.isBuffer(buffer)) {
    if (!Array.isArray(buffer)) {
      return callback(new Error('Failed to write: data was not Buffer or Array object.'));
    }
    var buffer = new Buffer(buffer);
  }

  this.endpointOut.transfer(buffer, function (error) {
    callback(error);
  });
};

avrgirlIspmkii.prototype._read = function (length, callback) {
  if (typeof length !== 'number') { return new Error('Failed to read: length must be a number.'); }
  this.endpointIn.transfer(length, function (error, data) {
    callback(error, data);
  });
};

avrgirlIspmkii.prototype._sendCmd = function(cmd, callback) {
  var self = this;
  this._write(cmd, function (error) {
    if (error) { callback(error); }
    self._read(2, function (error, data) {
      if (!error && data.length > 0 && data[1] !== C.STATUS_CMD_OK) {
        var error = new Error('Return status was not OK. Received instead: ' + data.toString('hex'));
      }
      callback(error);
    });
  });
};

avrgirlIspmkii.prototype.getSignature = function (callback) {
  var self = this;
  var cmd = new Buffer([C.CMD_SIGN_ON]);
  var length = 17;

  this._write(cmd, function (error) {
    if (error) { callback(error); }
    self._read(length, function (error, data) {
      callback(error, data);
    });
  })
};

avrgirlIspmkii.prototype.verifySignature = function (data, callback) {
  var error = null;
  if (data[1] === C.STATUS_CMD_OK) {
    var signature = data.slice(2);
    console.log(signature.toString())
    if (signature.toString().trim() !== 'AVRISP_MK2') {
      error = new Error('Failed to verify: programmer signature does not match.');
    }
  } else {
    error = new Error('Failed to verify: programmer return status was not OK.');
  }
  callback(error);
};

avrgirlIspmkii.prototype.loadPage = function (data, callback) {
  var options = this.options;
  var lMSB = data.length >> 8;
  var lLSB = data.length & 0xFF;

  var cmd = new Buffer([
    C.CMD_PROGRAM_FLASH_ISP,
    lMSB, lLSB,
    options.flash.mode, options.flash.delay,
    options.flash.cmd[0], options.flash.cmd[1], options.flash.cmd[2],
    options.flash.poll1, options.flash.poll2
  ]);

  cmd = Buffer.concat([cmd, data]);

  this._sendCmd(cmd, function (error) {
    callback(error);
  });
};

avrgirlIspmkii.prototype.writeFlash = function (hex, callback) {
  var self = this;
  var options = this.options;
  var pageAddress = 0;
  var useAddress;
  var pageSize = options.flash.pageSize;
  var data;

  async.whilst(
    function testEndOfFile() { return pageAddress < hex.length; },
    function programPage(pagedone) {
      async.series([
        function loadAddress(done) {
          useAddress = pageAddress >> 1;
          self.loadAddress(useAddress, done);
        },
        function writeToPage(done) {
          data = hex.slice(pageAddress, (hex.length > pageSize ? (pageAddress + pageSize) : hex.length - 1))
          self.loadPage(data, done);
        },
        function calcNextPage(done) {
          pageAddress = pageAddress + data.length;
          done();
        }
      ],
      function pageIsDone(error) {
        pagedone(error);
      });
    },
    function(error) {
      callback(error);
    }
  );
};

avrgirlIspmkii.prototype.readFlash = function (length, cmd1, callback) {

};

avrgirlIspmkii.prototype.writeEeprom = function (options, data, callback) {
  // P01
  //options are [mode, delay, poll1, poll2]

};

avrgirlIspmkii.prototype.readEeprom = function (length, cmd1, callback) {

};

avrgirlIspmkii.prototype.readChipSignature = function (callback) {
  // P01
};

avrgirlIspmkii.prototype.cmdSpiMulti = function (options, callback) {
  // P01
  //options are [cmd, numTx, numRx, rxStartAddr, txData]
};

avrgirlIspmkii.prototype.readFuse = function (length, cmd1, callback) {

};

avrgirlIspmkii.prototype.setParam = function (param, value, callback) {
  // P01
};

avrgirlIspmkii.prototype.getParam = function (param, callback) {

};

avrgirlIspmkii.prototype.loadAddress = function (address, callback) {
  var msb = (address >> 24) & 0xFF | 0x80;
  var xsb = (address >> 16) & 0xFF;
  var ysb = (address >> 8) & 0xFF;
  var lsb = address & 0xFF;

  var cmd = new Buffer([C.CMD_LOAD_ADDRESS, msb, xsb, ysb, lsb]);

  this._sendCmd(cmd, function (error) {
    var error = error ? new Error('Failed to load address: return status was not OK.') : null;
    callback(error);
  });
};

avrgirlIspmkii.prototype.enterProgrammingMode = function (callback) {
  var self = this;
  var options = this.options;

  var cmd = new Buffer([
    C.CMD_ENTER_PROGMODE_ISP,
    options.timeout, options.stabDelay,
    options.cmdexeDelay, options.syncLoops,
    options.byteDelay,
    options.pollValue, options.pollIndex,
    options.pgmEnable[0], options.pgmEnable[1],
    options.pgmEnable[2], options.pgmEnable[3]
  ]);

  this._sendCmd(cmd, function (error) {
    var error = error ? new Error('Failed to enter prog mode: programmer return status was not OK.') : null;
    callback(error);
  });
};

avrgirlIspmkii.prototype.exitProgrammingMode = function (callback) {
  var self = this;
  var options = this.options;

  var cmd = new Buffer([
    C.CMD_LEAVE_PROGMODE_ISP, options.preDelay, options.postDelay
  ]);

  this._sendCmd(cmd, function (error) {
    var error = error ? new Error('Failed to leave prog mode: programmer return status was not OK.') : null;
    callback(error);
  });
};

avrgirlIspmkii.prototype.eraseChip = function (callback) {
  var self = this;
  var options = this.options;

  var cmd = new Buffer([
    C.CMD_CHIP_ERASE_ISP,
    options.erase.delay, options.pollMethod,
    options.erase.cmd[0], options.erase.cmd[1],
    options.erase.cmd[2], options.erase.cmd[3]
  ]);

  this._sendCmd(cmd, function (error) {
    var error = error ? new Error('Failed to enter prog mode: programmer return status was not OK.') : null;
    callback(error);
  });
};

module.exports = avrgirlIspmkii;
