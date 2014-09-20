var mongoose = require('mongoose');
var constants = require('./../../constants');
var client = require('twilio')(constants.twilio_sid, constants.auth_token);

var User = mongoose.model('User', {
  number: String,
  is_paired: Boolean,
  is_active: Boolean
});

var create_user = function(req, res, next) {
  User.create({
    number: req.body.From,
    is_paired: false,
    is_active: true
  }, function (err, user) {
    if (err) {
      console.log('[USER] An error occured while trying to create user.'.red);
      res.status(err).end();
    } else {
      console.log('[USER]'.blue, 'Added new user:'.green, req.body.From.yellow + '.'.green);
      next();
    }
  });
};

exports.is_user = function(req, res, next) {
  User.findOne({
    number: req.body.From
  }, function(err, user) {
    if (err) {
      console.log(('[USER] An error occured while looking for user: ' + req.body.From)).red;
      res.status(err).end();
    } else if (user) {
      console.log('[USER]'.blue, 'Found user:'.green, req.body.From.yellow);
      user.is_active = true;
      user.save();
      next();
    } else {
      console.log('[USER]'.blue, 'Did not find user:'.green, req.body.From.yellow);
      create_user(req, res, next);
    }
  });
};

exports.find_pair = function(req, res, callback) {
  User.find({ is_paired: false, is_active: true }, function(err, pair) {
    if (pair.length >= 2) {
      console.log('[USER]'.blue, 'Found a possible pair.'.green);
      User.update(
        { $or: [
          { number: pair[0].number },
          { number: pair[1].number }
        ] },
        { $set: { is_paired: true } },
        { multi: true },
        function(err, result) {
          if (err) {
            console.log('[USER] An error occured while trying to set numbers as paired.'.red);
            res.status(err).end();
          } else {
            client.messages.create({
              body: 'You have been matched!',
              to: pair[0].number,
              from: constants.from_phone
            }, function(err, message){
              if (err) {
                console.log(('[SMS] Error sending message: ' + err).red)
              }
            });
            client.messages.create({
              body: 'You have been matched!',
              to: pair[1].number,
              from: constants.from_phone
            }, function(err, message){
              if (err) {
                console.log(('[SMS] Error sending message: ' + err).red)
              }
            });
            callback(pair[0].number, pair[1].number, res);
          }
        });
    } else {
      console.log('[USER]'.blue, 'Could not create a pair, not enough singles.'.green);
      res.status(200).end();
    }
  });
};

exports.divorce_user = function(req, res, divorcee) {
  var divorcer = res.body.From;
  User.find({ $or: [{ number: divorcer }, { number: divorcee }]}, function(err, users) {
    if (err) {
      console.log('[User]'.blue, 'An error occured while trying to set numbers as paired.'.red);
      res.status(err).end();
    } else if (users) {
      console.log('[User]'.blue, 'Found users to divorce :('.green);
      var unactive_user = users[0];
      var active_user = users[1];
      if (unactive_user.number != divorcer) {
        unactive_user = users[1];
        active_user = users[0];
      }
      if(/^nahh$/i.test(res.body.Body)) {
        unactive_user.is_active = true;
      } else if (/^pce$/i.test(res.body.Body)) {
        unactive_user.is_active = false;
      }
      unactive_user.is_paired = false;
      active_user.is_paired = false;
      unactive_user.save();
      active_user.save();
      client.messages.create({
        body: 'You have left the chat pool.',
        to: unactive_user,
        from: constants.from_phone
      }, function(err, message){
        if (err) {
          console.log(('[SMS] Error sending message: ' + err).red)
        }
      });
      client.messages.create({
        body: 'The other person has diconnected...\nMatching...',
        to: active_user,
        from: constants.from_phone
      }, function(err, message){
        if (err) {
          console.log(('[SMS] Error sending message: ' + err).red)
        }
      });
      res.status(err).end();
    } else {
      console.log('[User]'.blue, 'Users were not found.'.red);
      res.status(err).end();
    }
  });
};
