var mongoose = require('mongoose');

var User = mongoose.model('User', {
  number: String,
  is_paired: Boolean
});

var create_user = function(req, res, next) {
  User.create({
    number: req.body.From,
    is_paired: false
  }, function (err, user) {
    if (err) {
      console.log('[User] An error occured while trying to create user.');
      res.status(err).end();
    } else {
      console.log('[User] Added new user: ' + req.body.From + '.');
      next();
    }
  });
};

exports.is_user = function(req, res, next) {
  User.findOne({
    number: req.body.From
  }, function(err, user) {
    if (err) {
      console.log('[User] An error occured while looking for user: ' + req.body.From);
      res.status(err).end();
    } else if (user) {
      console.log('[User] Found user: ' + req.body.From);
      next();
    } else {
      console.log('[User] Did not find user: ' + req.body.From);
      create_user(req, res, next);
    }
  });
};

exports.find_pair = function(req, res, callback) {
  User.find({ is_paired: false }, function(err, pair) {
    if (pair.length >= 2) {
      console.log('[User] Found a possible pair.');
      User.update( 
        { $or: [
          { number: pair[0].number },
          { number: pair[1].number }
        ] },
        { $set: { is_paired: true } },
        { multi: true },
        function(err, result) {
          if (err) {
            console.log('[User] An error occured while trying to set numbers as paired.');
            res.status(err).end();
          } else {
            callback(pair[0].number, pair[1].number, res);
          }
        });
    } else {
      console.log('[User] Could not create a pair, not enough singles.');
      res.status(200).end();
    }
  });
};

