var colors = require('colors');

var month_names = new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec");

var getFormattedDate = function() {
  var date = new Date();
  var d = date.getDate();
  var m = date.getMonth();
  var h = date.getHours();
  var mi = date.getMinutes();
  var s = date.getSeconds();
  s = s < 10 ? '0' + s : s;

  return d + " " + month_names[m] + " " + h + ":" + mi + ":" + s + " -";
}

var type = {
  info: 0,
  debug: 1,
  error: 2
};

var assert = function(test, message) {
  if (!test) {
    console.log(getFormattedDate(), '[FAILED ASSERT]'.blue, message.red);
    ASSERT_FAILED();
  }
};

/// SET LEVEL OF DEBUG TO PRINT TO BE ATLEAST...
var DEBUG_PRINT_LEVEL = type.info;
assert(DEBUG_PRINT_LEVEL <= type.error, 'DEBUG_PRINT_LEVEL should always show errors.');

/// EXPORT FUNCTIONS
exports.assert = assert;

exports.type = type;

exports.print = function(msg_type, model, msg) {
  if (msg_type < DEBUG_PRINT_LEVEL) {
    return;
  }

  switch(msg_type) {
    case type.info:
      console.log(getFormattedDate(), ('[' + model + ']').blue, msg.green);
      break;
    case type.debug:
      console.log(getFormattedDate(), ('[' + model + ']').blue, msg.yellow);
      break;
    case type.error:
      console.log(getFormattedDate(), ('[' + model + ']').blue, msg.red);
      break;
    default:
      console.log(getFormattedDate(), ('[' + model + ']').blue, msg.purple);
  };
};
