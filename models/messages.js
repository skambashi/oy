var mongoose = require('mongoose');
var debug = require('./../helpers/debug');

var Message = mongoose.model('Message', {
  to: String,
  from: String,
  message: String,
  sent_on: Date
});

exports.add_message = function(to, from, message) {
  debug.print(
    debug.type.info,
    'MESSAGE',
    'From: '.green + from.yellow + ' To: '.green + to.yellow + ' Message: '.green + message.yellow
  );

  Message.create({
    to: to,
    from: from,
    message: message,
    sent_on: (new Date())
  }, function (err, user) {
    if (err) {
      debug.print(
        debug.type.error,
        'MESSAGE',
        'An error occured while storing a message. ' + err
      );
    }
  });
};
