var express = require('express');
var colors = require('colors');
var parser = require('body-parser');
var constants = require('./../../constants');
var client = require('twilio')(constants.twilio_sid, constants.auth_token);
var db = require('./db');

var app = express();
var port = 80;

app.use(parser.urlencoded({
    extended: false
}));

app.post('/sms', function(req, res){
    var from = req.body.From;
    var body = req.body.Body;
    console.log('[SMS] From:'.green, from.yellow, 'Body:'.green, body.yellow);
    if (/^pce$/i.test(body)){
	db.terminateUser(from);
        console.log('[SMS]'.green, from.yellow, 'Stopped.'.red);
    } else {
        var result = db.getPairNumber(from);
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
    }
});

console.log('[SERVER] Creating server on port'.green,  port.toString().yellow);
app.listen(port);
