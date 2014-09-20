var mongoose = require('mongoose');
var Users = require('./user');

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
      console.log(('[PAIR] An error occured while trying to create a pair.')).red;
      res.status(err).end();
    } else if (pair) {
      console.log('[PAIR]'.blue, 'Successfully paired users:'.green, number_a.yellow, 'and'.green, number_b.yellow + '.'.green);
      res.status(200).end();
    } else {
      console.log('[PAIR]'.blue, 'Failed to create a pair with numbers:'.green, number_a.yellow, 'and', number_b.yellow + '.'.green);
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
        console.log(('[PAIR] An error occured while looking for pair.')).red;
        res.status(err).end();
      } else if (pair) {
        console.log('[PAIR]'.blue, 'Found'.green, req.body.From.yellow, 'in a pair.'.green);

        if (pair.number_a == req.body.From) {
          req.body.To = pair.number_b;
          next();
        } else {
          req.body.To = pair.number_a;
          next();
        }
      } else {
        console.log('[PAIR]'.blue, 'Number'.green, req.body.From.yellow, 'is not in a pair.'.green); 
        Users.find_pair(req, res, create_pair);
      }
  });
};

exports.delete_pair = function(number) {
  User.update( 
    { $or: [ 
      { number_a: number, is_deleted: false }, 
      { number_b: number, is_deleted: false }
    ] },
    { $set: { is_deleted: true } },
    function(err, result) {
      if (err) {
        console.log(('[PAIR] Failed to delete pair with number: ' + number + '.' + err)).red;
        res.status(200).end();
      } else {
        console.log('[PAIR]'.blue, 'Successfully deleted pair with number:'.green, number.yellow);
        var divorcee = result.number_a;
        if (number == divorcee) {
          divorcee = result.number_b;
        }
        Users.divorce_pair(number, divorcee, res);
        res.status(200).end();
      }
  });
}
