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
  });
};

avrgirlIspmkii.prototype.verifySignature = function (data, callback) {
  var error = null;
  if (data[1] === C.STATUS_CMD_OK) {
    var signature = data.slice(2);
    if (signature.toString().trim() !== 'AVRISP_MK2') {
      error = new Error('Failed to verify: programmer signature does not match.');
    }
  } else {
    error = new Error('Failed to verify: programmer return status was not OK.');
  }
  callback(error);
};

avrgirlIspmkii.prototype.verifyProgrammer = function (callback) {
  var self = this;
  this.getSignature(function (error, data) {
    self.verifySignature(data, function(error) {
      callback(error);
    });
  });
};

avrgirlIspmkii.prototype.loadAddress = function (memType, address, callback) {
  var dMSB = memType === 'flash' ? 0x80 : 0x00;
  var msb = (address >> 24) & 0xFF | dMSB;
  var xsb = (address >> 16) & 0xFF;
  var ysb = (address >> 8) & 0xFF;
  var lsb = address & 0xFF;

  var cmd = new Buffer([C.CMD_LOAD_ADDRESS, msb, xsb, ysb, lsb]);

  this._sendCmd(cmd, function (error) {
    var error = error ? new Error('Failed to load address: return status was not OK.') : null;
    callback(error);
  });
};

avrgirlIspmkii.prototype.loadPage = function (memType, data, callback) {
  var lMSB = data.length >> 8;
  var lLSB = data.length & 0xFF;
  var mem = this.options[memType];
  var cmd = memType === 'flash' ? C.CMD_PROGRAM_FLASH_ISP : C.CMD_PROGRAM_EEPROM_ISP

  var cmd = new Buffer([
    cmd,
    lMSB, lLSB,
    mem.mode, mem.delay,
    mem.cmd[0], mem.cmd[1], mem.cmd[2],
    mem.poll1, mem.poll2
  ]);

  cmd = Buffer.concat([cmd, data]);

  this._sendCmd(cmd, function (error) {
    callback(error);
  });
};

avrgirlIspmkii.prototype.writeMem = function (memType, hex, callback) {
  var self = this;
  var options = this.options;
  var pageAddress = 0;
  var useAddress;
  var pageSize = options[memType].pageSize;
  var addressOffset = options[memType].addressOffset;
  var data;

  async.whilst(
    function testEndOfFile() { return pageAddress < hex.length; },
    function programPage(pagedone) {
      async.series([
        function loadAddress(done) {
          useAddress = pageAddress >> addressOffset;
          self.loadAddress(memType, useAddress, done);
        },
        function writeToPage(done) {
          data = hex.slice(pageAddress, (hex.length > pageSize ? (pageAddress + pageSize) : hex.length - 1))
          self.loadPage(memType, data, done);
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
    var error = error ? new Error('Failed to erase chip: programmer return status was not OK.') : null;
    callback(error);
  });
};

avrgirlIspmkii.prototype.writeFlash = function (hex, callback) {
  // optional convenience method
};

avrgirlIspmkii.prototype.readFlash = function (length, cmd1, callback) {
  // P02
};

avrgirlIspmkii.prototype.writeEeprom = function (hex, callback) {
 // optional convenience method
};

avrgirlIspmkii.prototype.readEeprom = function (length, cmd1, callback) {
  // P02
};

avrgirlIspmkii.prototype.readChipSignature = function (callback) {
  var self = this;
  var options = this.options;
  var readLen = options.signature.length;
  var set = 0;

  var cmd = new Buffer([
    C.CMD_READ_SIGNATURE_ISP,
    options.readSignature.startAddress,
    options.readSignature.cmd[0], options.readSignature.cmd[1],
    options.readSignature.cmd[2], options.readSignature.cmd[3]
  ]);

  var response = new Buffer(3);

  function getSigByte() {
    self._write(cmd, function (error) {
      if (error) { callback(error); }
      self._read(8, function(error, data) {
        if (error) { callback(error); }
        response[set] = data[2];
        set += 1;
        cmd[4] = set;
        if (set < 3) {
          getSigByte();
        } else {
          callback(null, response);
        }
      });
    });
  };

  getSigByte();

};

avrgirlIspmkii.prototype.cmdSpiMulti = function (options, callback) {
  // // P02
  //options are [cmd, numTx, numRx, rxStartAddr, txData]
};

avrgirlIspmkii.prototype.readFuse = function (length, cmd1, callback) {
  // P02
};

avrgirlIspmkii.prototype.setParam = function (param, value, callback) {
  // P02
};

avrgirlIspmkii.prototype.getParam = function (param, callback) {
  // P02
};

module.exports = avrgirlIspmkii;
