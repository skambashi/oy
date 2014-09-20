var express = require('express');
var mongoose = require('mongoose');
var colors = require('colors');

var app = express();
var port = 80;

app.psot('/sms', function(req, res){

    var user_num = req.body.From;
    var body = req.body.Body;
    console.log('[SMS] From:'.yellow, user_num.green, 'Body:'.yellow, body.green);
});

console.log('[SERVER] Creating server on port '.green,  port.toString().green);
app.listen(port);