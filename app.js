// Setup
var debug = require('./helpers/debug');
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
var Messages = require('./models/messages.js');
var Users = require('./models/user.js');
var Pairs = require('./models/pair.js');

// Routes
app.post(
  '/sms',
  Users.is_user,
  Pairs.is_in_pair,
  function(req, res, next) {
    var from = req.body.From;
    var body = req.body.Body;

    if(/^pce$/i.test(body) || /^nahh$/i.test(body)) {
      debug.print(
        debug.type.info,
        'SMS',
        from.yellow + ' sent the command: '.green + body.yellow
      );

      Pairs.delete_pair(req,res);
    } else {
      next();
    }
  },
  function(req, res) {
    var to = req.body.To;
    var from = req.body.From;
    var message = req.body.Body;

    Messages.add_message(to, from, message);

    client.messages.create({
      body: body,
      to: to,
      from: constants.from_phone
    }, function(err, message){
      if (err) {
        debug.print(
          debug.type.error,
          'SMS',
          'Error sending message: ' + err
        );
      }
    });

    res.status(200).end();
  }
);

// App
debug.print(
  debug.type.info,
  'SERVER',
  'Creating server on port '.green + port.toString().yellow
);
app.listen(port);
