// set up mock usb module for tests

function usb() {};

usb.prototype.findByIds = function (vid, pid) {
  return {
    interfaces: [
      {
        endpoints: [
          {
            transfer: function (length, callback) {
              var buffer = new Buffer(length);
              return callback(null, buffer);
            }
          },
          {
            transfer: function (buffer, callback) {
              return callback(null);
            }
          }
        ]
      },
       __open: function() {},
      open: function() {},
      close: function() {}
    ]
  }
};

module.exports = usb;
