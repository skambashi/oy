// Setup
var express = require('express');
var colors = require('colors');
var mongoose = require('mongoose');
var parser = require('body-parser');
var constants = require('./../constants');
var client = require('twilio')(constants.twilio_sid, constants.auth_token);
var app = express();
var port = 80;

// Configuration
app.use(parser.urlencoded({ extended: false }));
mongoose.connect('mongodb://localhost/oy');

// Models
var Users = require('./models/user.js');
var Pairs = require('./models/pair.js');

// Routes
app.post(
  '/sms',
  Users.is_user,
  Pairs.is_in_pair,
  function(req, res) {
    var from = req.body.From;
    var body = req.body.Body;
    var to = req.body.To;

    console.log('[SMS] From:'.green, from.yellow, 'Body:'.green, body.yellow, 'To:'.green, to.yellow);

    res.status(200).end();
  }
);


/*
app.post('/sms', function(req, res){
    var from = req.body.From;
    var body = req.body.Body;
    console.log('[SMS] From:'.green, from.yellow, 'Body:'.green, body.yellow);
    if (/^pce$/i.test(body)){
		db.terminateUser(from);
        console.log('[SMS]'.green, from.yellow, 'Stopped.'.red);
    } else {
		console.log('getPairNumber:', from);
        db.getPairNumber(from, function (result) {
		    if (result) {
	            client.messages.create({
		            body: body,
		            to: result,
		            from: constants.from_phone
		        }, function(err, message){
		            if (err) {
		                console.log('[ERR]'.red, err.red);
		            }
		        });
		    }
		});
    }
});
*/

// App
console.log('[SERVER] Creating server on port'.green,  port.toString().yellow);
app.listen(port);
