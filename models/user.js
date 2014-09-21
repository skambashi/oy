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
      client.messages.create({
        body: 'Welcome to Oy!',
        to: req.body.From,
        from: constants.from_phone
      }, function(err, message){
        if (err) {
          console.log(('[SMS] Error sending message: ' + err).red)
        }
      });
      next();
    }
  });
};

exports.is_user = function(req, res, next) {
  User.findOne({
    number: req.body.From
  }, function(err, user) {
    if (err) {
      console.log(('[USER] An error occured while looking for user: ' + req.body.From).red);
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
      user_one = pair[Math.floor(Math.random()*pair.length)];
      user_two = pair[Math.floor(Math.random()*pair.length)];
      while (user_one == user_two) {
        user_one = pair[Math.floor(Math.random()*pair.length)];
      }
      User.update(
        { $or: [
          { number: user_one.number },
          { number: user_two.number }
        ] },
        { $set: { is_paired: true } },
        { multi: true },
        function(err, result) {
          if (err) {
            console.log('[USER] An error occured while trying to set numbers as paired.'.red);
            res.status(err).end();
          } else {
            client.messages.create({
              body: 'You have been matched!\nType \'nahh\' to text someone else.\nText \'pce\' to stop.',
              to: pair[0].number,
              from: constants.from_phone
            }, function(err, message){
              if (err) {
                console.log(('[SMS] Error sending message: ' + err).red);
              }
            });
            client.messages.create({
              body: 'You have been matched!\nText \'nahh\' to switch people.\nText \'pce\' to stop.',
              to: pair[1].number,
              from: constants.from_phone
            }, function(err, message){
              if (err) {
                console.log(('[SMS] Error sending message: ' + err).red);
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
  var divorcer = req.body.From;
  User.find({ $or: [{ number: divorcer }, { number: divorcee }]}, function(err, users) {
    if (err) {
      console.log('[User]'.blue, 'An error occured while trying to set numbers as paired.'.red);
      res.status(err).end();
    } else if (users) {
      console.log('[User]'.blue, 'Found users to divorce.'.green);
      var unactive_user = users[0];
      var active_user = users[1];
      if (unactive_user.number != divorcer) {
        unactive_user = users[1];
        active_user = users[0];
      }
      if (/^nahh$/i.test(req.body.Body)) {
        unactive_user.is_active = true;
      } else if (/^pce$/i.test(req.body.Body)) {
        unactive_user.is_active = false;
      }
      unactive_user.is_paired = false;
      active_user.is_paired = false;
      unactive_user.save();
      active_user.save();
      if (unactive_user.is_active) {
        client.messages.create({
          to: unactive_user.number,
          from: constants.from_phone,
          body: 'Rematching...'
        }, function(err, message){
          if (err) {
            console.log(('[SMS] Error sending message: ' + err).red);
          }
        });
      } else {
        client.messages.create({
          to: unactive_user.number,
          from: constants.from_phone,
          body: 'You have left the chat pool.'
        }, function(err, message){
          if (err) {
            console.log(('[SMS] Error sending message: ' + err).red);
          }
        });
      }
      client.messages.create({
        to: active_user.number,
        from: constants.from_phone,
        body: 'The other person has diconnected...\nMatching...'
      }, function(err, message){
        if (err) {
          console.log(('[SMS] Error sending message: ' + err).red);
        }
      });
      res.status(200).end();
    } else {
      console.log('[User]'.blue, 'Users were not found.'.red);
      res.status(200).end();
    }
  });
};
