/*

  HELLO FELLOW HUMAN ELECTRICAL INTERESTED PERSON
  PLEASE DO NOT RUN THIS EXAMPLE UNLESS YOU'D LIKE TO
  OVERWRITE THE RANDOM DEVICE YOU MAY HAVE PLUGGED IN.

  THIS IS JUST A HANDY FILE TO HELP YOU SEE CONTEXT OF
  HOW TO USE THIS SOFTWARE.

  THANK YOU,
  @NOOPKAT

*/

var AvrgirlIspmkii = require('../avrgirl-ispmkii');
var chips = require('avrgirl-chips-json');
var intelhex = require('intel-hex');
var fs = require('fs');
var async = require('async');

var attiny45 = chips.attiny45;
var avrgirl = new AvrgirlIspmkii(attiny45);

var pr = fs.readFileSync(__dirname + '/hex/pr.hex', {encoding: 'utf8'});
var ee = fs.readFileSync(__dirname + '/hex/eeprom.hex', {encoding: 'utf8'});
var prBin = intelhex.parse(pr).data;
var eeBin = intelhex.parse(ee).data;

avrgirl.on('ready', function() {
  // run demos
  async.series([
    avrgirl.enterProgrammingMode.bind(avrgirl),
    function hi (callback) {
      avrgirl.getChipSignature(function(error, data) {
        console.log('signature response read:' , data);
        callback();
      });
    },
    function hifuses (callback) {
      avrgirl.readFuses(function(error, data) {
        console.log('fuse response read:' , data);
        callback();
      });
    },
    function readeeprom (callback) {
      avrgirl.readEeprom(0x04, function(error, data) {
        console.log('eeprom response read:', error, data.toString('hex'));
        callback();
      });
    },
    function readflash (callback) {
      avrgirl.readFlash(0x04, function(error, data) {
        console.log('flash response read:', error, data.toString('hex'));
        callback();
      });
    },
    avrgirl.eraseChip.bind(avrgirl),
    avrgirl.writeFlash.bind(avrgirl, prBin),
    avrgirl.writeEeprom.bind(avrgirl, eeBin),
    avrgirl.exitProgrammingMode.bind(avrgirl)
    ], function (error) {
      console.log(error);
      avrgirl.close();
    }
  );
});
