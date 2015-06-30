"use strict";

module.exports = (function() {

  var util = require("util");
  var EventEmitter = require("events").EventEmitter;
  var passport = require('passport'), express = require("express"), session = require("express-session"), FitbitStrategy = require('passport-fitbit').Strategy, cookieParser = require('cookie-parser'), OAuth = require("oauth-1.0a"), process = require("./FITBITProcess.js"); 

/*Implement some function to check for duplicate users */

	verifyToken(token, tokenSecret) {
		getData(token, tokenSecret, function(response, error){
			if (error) console.log("Bad Token: " + response);
			else {
				parseData(response, function(parseResult) {
					if (parseResult.error) console.log("Verifying token failed");
					else {
						this._config.users[parseResult.userID] = {
							"accessToken": token,
							"accessSecret": tokenSecret
						}
						console.log("Added user id: " + parseResult.userID);
					}
				});
			}
		});
	}
  

  function MEITEKDriver(config) {

    console.log("creating MEITEK GPS adapter");

    EventEmitter.call(this);
    this._config = config;
    this._sockets = [];
    this._server = null;
  }

  util.inherits(FITBITDriver, EventEmitter);

  FITBITDriver.prototype.start = function() {

    console.log("starting FITBIT Adapter");

    // Create a new server and provide a callback for when a connection occurs
    this._server = express();
	this._server.use(session({secret: '1234567890QWERTY'}));
	this._server.use(passport.initialize());
	this._server.use(passport.session());
	this._server.use(cookieParser());
	
	
	passport.use(new FitbitStrategy({
    consumerKey: this._config.consumerKey,
    consumerSecret: this._config.consumerSecret,
    callbackURL: this._config.callbackURL
    },
	  function(token, tokenSecret, profile, done) {
		verifyToken(token, tokenSecret);
	  /*Need to save data here*/
		console.log(token);
		console.log(tokenSecret);
	  }
	));
	
	/* New User Registration*/
	this._server.get('/auth/fitbit', passport.authenticate('fitbit'));

	this._server.get('/auth/fitbit/callback', 
	  passport.authenticate('fitbit', { failureRedirect: '/auth/failed' }),
	  function(req, res) {
		// Currently makes the user's page hang
		res.redirect('/');
	});
	  
	this._server.get('/auth/failed', function(req,res) {
	 res.send('Something went wrong in authentication');
	});
	
	/* Notification Listener*/
	this._server.post('/subscribe/notify', function(req,res) {

	 res.send(204);
	 for(var i = 0; i < req.body.length; i++) getData(req.body[i].ownerID);
	});
	
	

    // Listen on port 8061
    this._server.listen(this._config.port);
  };

  FITBITDriver.prototype.stop = function() {
    this._server.close();
  };

  return FITBITDriver;
}());