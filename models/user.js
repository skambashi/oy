var mongoose = require('mongoose');
var constants = require('./../../constants');
var client = require('twilio')(constants.twilio_sid, constants.auth_token);
var debug = require('./../helpers/debug');

var User = mongoose.model('User', {
  number: String,
  is_paired: Boolean,
  is_active: Boolean,
  created_on: Date,
  last_active: Date
});

var create_user = function(req, res, next) {
  User.create({
    number: req.body.From,
    is_paired: false,
    is_active: true,
    created_on: (new Date()),
    last_active: (new Date())
  }, function (err, user) {
    if (err) {
      debug.print(
        debug.type.error,
        'USER',
        'An error occured while trying to create user.'
      );

      res.status(err).end();
    } else {
      debug.print(
        debug.type.info,
        'USER',
        'Added new user: '.green + req.body.From.yellow + '.'.green
      );

      client.messages.create({
        body: 'Welcome to Oy!',
        to: req.body.From,
        from: constants.from_phone
      }, function(err, message){
        if (err) {
          debug.print(
            debug.info.error,
            'SMS',
            'Error sending welcome message: ' + err
          );
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
      debug.print(
        debug.type.error,
        'USER',
        'An error occured while looking for user: ' + req.body.From
      );

      res.status(err).end();
    } else if (user) {
      debug.print(
        debug.type.info,
        'USER',
        'Found user: '.green + req.body.From.yellow + '.'
      );

      user.is_active = true;
      user.save();
      next();
    } else {
      debug.print(
        debug.type.info,
        'USER',
        'Did not find user: '.green + req.body.From.yellow
      );

      create_user(req, res, next);
    }
  });
};

exports.find_pair = function(req, res, callback) {
  User.find({ is_paired: false, is_active: true }, function(err, pair) {
    if (pair.length >= 2) {
      debug.print(
        debug.type.info,
        'USER',
        'Found a possible pair.'
      );

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
        { $set: { is_paired: true, last_active: (new Date()) } },
        { multi: true },
        function(err, result) {
          if (err) {
            print.debug(
              debug.type.error,
              'USER',
              'An error occured while trying to set numbers as paired: ' + err
            );

            res.status(err).end();
          } else {
            client.messages.create({
              body: 'You have been matched!\nText \'nahh\' to switch people.\nText \'pce\' to stop.',
              to: user_one.number,
              from: constants.from_phone
            }, function(err, message){
              if (err) {
                debug.print(
                  debug.type.error,
                  'SMS',
                  'Error sending match message: ' + err
                );
              }
            });
            client.messages.create({
              body: 'You have been matched!\nText \'nahh\' to switch people.\nText \'pce\' to stop.',
              to: user_two.number,
              from: constants.from_phone
            }, function(err, message){
              if (err) {
                debug.print(
                  debug.type.error,
                  'SMS',
                  'Error sending match message: ' + err
                );
              }
            });
            callback(user_one.number, user_two.number, res);
          }
        });
    } else {
      debug.print(
        debug.type.info,
        'USER',
        'Could not create a pair, not enough singles.'
      );

      res.status(200).end();
    }
  });
};

exports.divorce_user = function(req, res, divorcee) {
  var divorcer = req.body.From;
  User.find({ $or: [{ number: divorcer }, { number: divorcee }]}, function(err, users) {
    if (err) {
      debug.print(
        debug.type.error,
        'USER',
        'An error occured while trying to set numbers as paired.'
      );

      res.status(err).end();
    } else if (users) {
      debug.print(
        debug.type.info,
        'USER',
        'Found users to divorce.'
      );

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
      unactive_user.last_active = (new Date());
      active_user.last_active = (new Date());
      unactive_user.save();
      active_user.save();

      if (unactive_user.is_active) {
        client.messages.create({
          to: unactive_user.number,
          from: constants.from_phone,
          body: 'Rematching...'
        }, function(err, message){
          if (err) {
            debug.print(
              debug.type.error,
              'SMS',
              'Error sending rematching message: ' + err
            );
          }
        });
      } else {
        client.messages.create({
          to: unactive_user.number,
          from: constants.from_phone,
          body: 'You have left the chat pool.'
        }, function(err, message){
          if (err) {
            debug.print(
              debug.type.error,
              'SMS',
              'Error sending left chat pool message: ' + err
            );
          }
        });
      }
      client.messages.create({
        to: active_user.number,
        from: constants.from_phone,
        body: 'The other person has diconnected...\nMatching...'
      }, function(err, message){
        if (err) {
          debug.print(
            debug.type.error,
            'SMS',
            'Error sending disconnect message: ' + err
          );
        }
      });
      res.status(200).end();
    } else {
      debug.print(
        debug.type.error,
        'USER',
        'No users were found while trying to divorce.'
      );

      res.status(200).end();
    }
  });
};
