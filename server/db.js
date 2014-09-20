var colors = require('colors');
var mongoose = require('mongoose');
var constants = require('./../../constants');
var client = require('twilio')(constants.twilio_sid, constants.auth_token);
var db_uri = 'mongodb://localhost/oy';
mongoose.connect(db_uri, function(err, res){
    if (err) {
        console.log(('[DB] Error connecting to: ' + db_uri + '. ' + err).red);
    } else {
        console.log(('[DB] Successfully connected to: ' + db_uri + '. ').yellow);
    }
});

var db = mongoose.connection;

var pairSchema = new mongoose.Schema({
    alpha: String,
    omega: String
});
var Pair = mongoose.model('Pair', pairSchema);

var lonely = "";

addPair = function(l1, l2) {
    var pair = new Pair({
        'alpha': l1,
        'omega': l2
    });
    pair.save(function(err, pair){
        if (err) {
            console.log(('[DB] Error when saving new pair: ' + err).red);
        } else {
            console.log('[DB] Successfully saved new pair!'.green);
            client.messages.create({
                body: 'You have been connected!',
                to: l1,
                from: constants.from_phone
            }, function(err, message){
                if (err) {
                    console.log('[ERR]'.red, err.red);
                }
            });
            client.messages.create({
                body: 'You have been connected!',
                to: l2,
                from: constants.from_phone
            }, function(err, message){
                if (err) {
                    console.log('[ERR]'.red, err.red);
                }
            });
        }
    });
}

exports.terminateUser = function(number) {
    Pair.findOne({$or: [{'alpha':number},{'omega':number}]}, function(err, pair) {
        // User not found
        if (err) {
            if (lonely == number) {
                lonely = '';
            }
        // Else, returning user
        } else {
            var left_over;
            if (pair.alpha == number) {
                left_over = pair.omega;
            }
            left_over = pair.alpha;
            pair.remove();
            client.messages.create({
                body: 'The other person has disconnected...\nMatching...',
                to: from,
                from: constants.from_phone
            }, function(err, message){
                if (err) {
                    console.log('[ERR]'.red, err.red);
                }
            });
            if (lonely == ''){
                lonely = left_over;
            } else {
                addPair(lonely, left_over);
            }
        }
    });
}

exports.getPairedNumber = function(number) {
    Pair.findOne({$or: [{'alpha':number},{'omega':number}]}, function(err, pair) {
        // New User
        if (err) {
            // If no one to pair to, return false
            if (lonely == "") {
                lonely = number;
                return false;
            // Otherwise, return number of pair
            } else {
                addPair(lonely,number);
                var temp = lonely;
                lonely = "";
                return temp;
            }
        // Else, returning user
        } else {
            if (pair.alpha == number) {
                return pair.omega;
            }
            return pair.alpha;
        }
    });
}
