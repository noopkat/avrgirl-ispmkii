[![Build Status](https://travis-ci.org/noopkat/avrgirl-ispmkii.svg?branch=master)](https://travis-ci.org/noopkat/avrgirl-stk500v2) [![Coverage Status](https://coveralls.io/repos/noopkat/avrgirl-ispmkii/badge.svg?branch=master&service=github)](https://coveralls.io/github/noopkat/avrgirl-avrispmkii?branch=master)

# avrgirl-ispmkii

A NodeJS interface layer for the AVRISP mkII programmer from Atmel®.

![avrgirl logo](http://i.imgur.com/hFXbPIe.png)

## Installation

### OSX:
```
npm install avrgirl-ispmkii
```

### Linux:
```
apt-get install build-essential libudev-dev
npm install avrgirl-ispmkii
```
### Windows:
Use [Zadig](http://sourceforge.net/projects/libwdi/files/zadig/) to install the WinUSB driver for your USB device.
Otherwise you will get weird `LIBUSB_ERROR_NOT_SUPPORTED` errors, oops!

Then:

```
npm install avrgirl-ispmkii
```

## What is this?

Known for its rather awkward enclosure/case, the AVRISP mkII programmer is a great little device to have around.
Flashing and reading chips with it is a relatively easy affair. It follows the STK500v2 protocol.

![avrispmkii](http://i.imgur.com/IPg3VaM.jpg)

You can use this library with an AVRISP mkII programmer to do many tasks with connected AVR microchips:

+ Enter / leave programming mode
+ Read chip signatures
+ Write to EEPROM and Flash memory
+ Read from EEPROM and Flash memory
+ Erase chip memory
+ Read and write fuses
+ Get and set parameters


## What would I use this for?

Let's say you'd like to use NodeJS to flash and erase AVR branded microchips. This is the library for you! ❤️

## How to use

avrgirl-ispmkii takes only one argument on instantiation: a JSON object containing the configuration for the microchip you're using. Please see the [providing your chip configuration](#providing-your-chip-configuration) section for more information on how to do this. The example below uses [avrgirl-chips-json](https://www.npmjs.com/package/avrgirl-chips-json) to achieve this.

Example to get you set up:

```javascript
var AvrgirlIspmkii = require('avrgirl-ispmkii');
var chips = require('avrgirl-chips-json');

var attiny45 = chips.attiny45;
var avrgirl = new AvrgirlIspmkii(attiny45);

avrgirl.on('ready', function() {
  // do cool stuff
});

```


## Providing your chip configuration

The chip property is an object that follows a strict format / signature. It specifies the configuration properties of the microchip you are using.  You'll need to know and supply this configuration. You can find this from AVR Studio, the [avrgirl-chips-json package](https://www.npmjs.com/package/avrgirl-chips-json), or use the [AVRDUDE conf API](avrdude-conf.herokuapp.com). Pull requests to the [avrgirl-chips-json repo](https://github.com/noopkat/avrgirl-chips-json) with additional chips is most welcome.

Here is the signature, provided as an example of the ATtiny85:


```javascript
var attiny85 = {
  "name": "ATtiny85",
  "timeout": 200,
  "stabDelay": 100,
  "cmdexeDelay": 25,
  "syncLoops": 32,
  "byteDelay": 0,
  "pollIndex": 3,
  "pollValue": 83,
  "preDelay": 1,
  "postDelay": 1,
  "pgmEnable": [172, 83, 0, 0],
  "erase": {
    "cmd": [172, 128, 0, 0],
    "delay": 45,
    "pollMethod": 1
  },
  "flash": {
    "write": [64, 76, 0],
    "read": [32, 0, 0],
    "mode": 65,
    "blockSize": 64,
    "delay": 10,
    "poll2": 255,
    "poll1": 255,
    "size": 8192,
    "pageSize": 64,
    "pages": 128,
    "addressOffset": 0
  },
  "eeprom": {
    "write": [193, 194, 0],
    "read": [160, 0, 0],
    "mode": 65,
    "blockSize": 4,
    "delay": 5,
    "poll2": 255,
    "poll1": 255,
    "size": 512,
    "pageSize": 4,
    "pages": 128,
    "addressOffset": 0
  },
  "sig": [30, 147, 11],
  "signature": {
    "size": 3,
    "startAddress": 0,
    "read": [48, 0, 0, 0]
  },
  "fuses": {
    "startAddress": 0,
    "write": {
      "low": [172, 160, 0, 0],
      "high": [172, 168, 0, 0],
      "ext": [172, 164, 0, 0]
    },
    "read": {
      "low": [80, 0, 0, 0],
      "high": [88, 8, 0, 0],
      "ext": [80, 8, 0, 0]
    }
  }
}
```

## Available methods


### getChipSignature

Gets the signature of the microchip.

Returns a buffer containing the signature bytes.

Usage:

```javascript
avrgirl.getChipSignature(function(error, signature) {
  console.log(signature);
});
```

### enterProgrammingMode

Enables programming mode on the microchip.

Returns a null error upon callback if successful.

```javascript
avrgirl.enterProgrammingMode(function(error) {
  console.log(error);
});
```

### exitProgrammingMode

Leaves programming mode on the microchip. Returns a null error upon callback if successful.

```javascript
avrgirl.exitProgrammingMode(function(error) {
  console.log(error);
});
```

### eraseChip

Erases both the flash and EEPROM memories on the microchip. Good practice to do before flashing any new data.

💣💣💣  Literally erases **everything** please be careful 💣💣💣

Returns a null error upon callback if successful.

```javascript
avrgirl.eraseChip(function(error) {
  console.log(error);
});
```

### getParameter

Gets the value of a specified parameter for AVRISP mkII's settings. Pass in the parameter's byte label and a callback respectively.

Returns a null error and the parameter value upon callback if successful.

```javascript
avrgirl.getParameter(0x94, function(error, data) {
  console.log(error, data);
});
```

### setParameter

Sets the value of a specified parameter for AVRISP mkII's settings. Pass in the parameter's byte label, the requested value, and a callback respectively.

Returns a null error upon callback if successful.

```javascript
avrgirl.setParameter(0x94, 0x00, function(error) {
  console.log(error);
});
```


### writeFlash

Writes a buffer to the flash memory of the microchip. Provide a buffer and a callback respectively.
Protip: use the package [intel-hex](https://www.npmjs.com/package/intel-hex) if you need to parse a .hex file into a buffer for this method. See the example.

Returns a null error upon callback if successful.

```javascript
var intelhex = require('intel-hex');
var buffer = fs.readFileSync('Blink.cpp.hex', {encoding: 'utf8'});

avrgirl.writeFlash(buffer, function(error) {
  console.log(error);
});
```

### writeEeprom

Writes a buffer to the eeprom memory of the microchip. Provide a buffer and a callback respectively.
Protip: use the package [intel-hex](https://www.npmjs.com/package/intel-hex) if you need to parse a .hex file into a buffer for this method. See the example.

Returns a null error upon callback if successful.

```javascript
var intelhex = require('intel-hex');
var buffer = fs.readFileSync('myEeprom.cpp.hex', {encoding: 'utf8'});

avrgirl.writeEeprom(buffer, function(error) {
  console.log(error);
});
```

### readFlash

Reads a specified length of flash memory from the microchip. Takes a length integer (or hex) for the number of bytes to read, and a callback as the arguments, respectively.

Returns a null error and a buffer of the read bytes upon callback if successful.

Usage:

```javascript
avrgirl.readFlash(64, function(error, data) {
  console.log(data);
});
```

### readEeprom

Reads a specified length of flash memory from the microchip. Takes a length integer (or hex) for the number of bytes to read, and a callback as the arguments, respectively.

Returns a null error and a buffer of the read bytes upon callback if successful.

Usage:

```javascript
avrgirl.readFlash(64, function(error, data) {
  console.log(error, data);
});
```

### readFuses

Reads all of the available fuse values on the microchip.

Returns a null error and an object containing the fuse key and byte value pairs upon callback if successful.

Usage:

```javascript
avrgirl.readFuses(function(error, data) {
  console.log(error, data);
});
```

### readFuse

Reads a specific fuse on the microchip. Pass in a string of the right fuse key from the chip properties.

Returns a null error and a buffer containing the fuse byte value upon callback if successful.

Usage:

```javascript
avrgirl.readFuse('low', function(error, data) {
  console.log(error, data);
});
```

### writeFuse

💣💣💣 ***OMG, please be careful with this.*** 💣💣💣
please please please.

You can brick your chip if you do not know exactly what you're doing. Use an online fuse calculator first, and triple check before running this method.

I accept no responsibility for bricked chips 💀😱😭

Takes a fuse key string, a value to set it to, and a callback.

Usage:

```javascript
// *********
// please do not run this code unless you're sure that 0x62 is a good idea for your chip ;___;
// *********
avrgirl.writeFuse('low', 0x62, function(error) {
  // note: a null error doesn't necessarily mean you didn't do something foolish here.
  console.log(error);
});
```
---

## Other methods

**NOTE:** The following methods below are rarely needed, but documented in case you have need for them.

### open

Void. Upon instantiation, avrgirl-ispmkii opens a connection to the AVRISP mkII. You shouldn't need to call this method unless you've previously closed the connection manually.

Usage:

```javascript
avrgirl.open();
```


### close

Void. Closes the connection to the AVRISP mkII.

Usage:

```javascript
avrgirl.close();
```


### write

Writes a buffer of data to the microchip. Takes a buffer and a callback as the arguments, respectively.

Usage:

```javascript
var buffer = new Buffer([0x01, 0x00, 0x00]);

avrgirl.write(buffer, function(error) {
  console.log('written.');
});
```

### read

Reads the last response from the microchip. Takes a length integer (number of bytes to read), and a callback as the arguments, respectively. Generally you'll want to call this immediately after a write.

Usage:

```javascript
var buffer = new Buffer([0x01, 0x00, 0x00]);

avrgirl.write(buffer, function(error) {
  avrgirl.read(2, function(error, data) {
	console.log(data);
  });
});
```

### sendCmd

SendCmd is a shortcut to sending an instruction buffer, of which you're simply expecting an 'OK' back. Your instruction will be sent, and the callback will return a null error if an 'OK' response returned.

The requires response length needs to be 2 bytes. Not compatible with instructions that aren't simply a simple command for the device. Use write, or the matched method for what you're wanting to achieve.

Returns a null error if successful.

```javascript
var buffer = new Buffer([0x01, 0x00, 0x00]);

avrgirl.sendCmd(buffer, function(error) {
  console.log(error);
});
