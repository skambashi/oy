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

isConnected = function(number) {
    if (number == lonely) return true;
    else {
        Pair.find(function(err, pairs){
            if (err) return console.error(err);
            console.dir(pairs);
            for (pair in pairs) {
                if(pair.alpha == number || pair.omega == number) return true;
            }
        });
        return false;
    }
}

exports.isPaired = function(number) {
    Pair.findOne({$or: [{'alpha':number},{'omega':number}]}, function(err, pair) {
        if (err) return false;
        return true;
    });
}

exports.newUser = function(number) {
    if (lonely == "") {
        lonely = number;
    }
    else {
        addPair(lonely,number);
        lonely = "";
    }
}

exports.reconnectUser = function(number) {
    if (isPaired(number)) {
        var toLonely = getPairedNumber(number);
        getPair().remove();
        newUser(toLonely);
    }
    else console.error('Invalid use. Number does not have a pair.');
}

exports.terminateUser = function(number) {
    if (number==lonely) {
        lonely = "";
        return;
    }
    else if (isConnected(number)) reconnectUser(number);
    else console.error("Invalid use. Number is not recognized.");
}

exports.getPairedNumber = function(number) {
    Pair.findOne({$or: [{'alpha':number},{'omega':number}]}, function(err, pair) {
        if (err) return console.error("Invalid use. Number does not have a pair.");
        return pair;
    });
}
