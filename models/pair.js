var mongoose = require('mongoose');
var Users = require('./user');
var debug = require('./../helpers/debug');

var Pair = mongoose.model('Pair', {
  number_a: String,
  number_b: String,
  is_deleted: Boolean
});

var create_pair = function(number_a, number_b, res) {
  Pair.create({
    number_a: number_a,
    number_b: number_b,
    is_deleted: false
  }, function (err, pair) {
    if (err) {
      debug.print(
        debug.type.error,
        'PAIR',
        'An error occured while trying to create a pair with ' + number_a + ' and ' + number_b + '.'
      );

      res.status(err).end();
    } else if (pair) {
      debug.print(
        debug.type.info,
        'PAIR',
        'Successfully paired users: '.green + number_a.yellow + ' and '.green + number_b.yellow + '.'.green
      );

      res.status(200).end();
    } else {
      debug.print(
        debug.type.info,
        'PAIR',
        'Failed to create a pair with numbers: '.green + number_a.yellow + ' and '.green + number_b.yellow + '.'.green
      );

      res.status(200).end();
    }
  });
};

exports.is_in_pair = function(req, res, next) {
  Pair.findOne(
    { $or: [
      { number_a: req.body.From, is_deleted: false },
      { number_b: req.body.From, is_deleted: false }
    ] },
    function(err, pair) {
      if (err) {
        debug.print(
          debug.type.error,
          'PAIR',
          'An error occured while looking for a pair that includes ' + req.body.From + '.'
        );

        res.status(err).end();
      } else if (pair) {
        if (pair.number_a == req.body.From) {
          req.body.To = pair.number_b;
        } else {
          req.body.To = pair.number_a;
          next();
        }

        debug.print(
          debug.type.info,
          'PAIR',
          'Found '.green + req.body.From.yellow + ' in a pair with '.green + req.body.To.yellow + '.'.green
        );

        next();
      } else {
        debug.print(
          debug.type.info,
          'PAIR',
          req.body.From.yellow + ' is not in a pair.'.green
        );

        Users.find_pair(req, res, create_pair);
      }
  });
};

exports.delete_pair = function(req, res) {
  Pair.findOne(
    { $or: [
      { number_a: req.body.From, is_deleted: false },
      { number_b: req.body.From, is_deleted: false }
    ] },
    function(err, pair) {
      if (err) {
        debug.print(
          debug.type.error,
          'PAIR',
          '[PAIR] Failed to delete pair with number: ' + req.body.From + '.' + err
        );

        res.status(err).end();
      } else if (pair) {
        pair.is_deleted = true;
        pair.save();

        var divorcee = pair.number_a;
        if (req.body.From == divorcee) {
          divorcee = pair.number_b;
        }

        debug.print(
          debug.type.info,
          'PAIR',
          'Successfully deleted pair with numbers: ' + req.body.From.yellow + ' and ' + divorcee + '.'
        );

        Users.divorce_user(req, res, divorcee);
      }
  });
};
