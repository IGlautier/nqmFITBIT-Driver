"use strict";

module.exports = (function() {

	var util = require("util");
	var EventEmitter = require("events").EventEmitter;
	var passport = require("passport");
	var express = require("express");
	var	session = require("express-session");
	var FitbitStrategy = require("passport-fitbit").Strategy;
	var cookieParser = require("cookie-parser"); 
	var Getter = require("./FITBITGetter.js");
	var process = require("./FITBITProcess.js");
	var configLocal = require("./config.local.json"), fs = require("fs"); 


	function MEITEKDriver(config) {

		console.log("creating MEITEK GPS adapter");

		EventEmitter.call(this);
		this._config = config;
		this._server = null;
		this._subscriber = null;
		this._updater = null;
	}

	util.inherits(FITBITDriver, EventEmitter);

	FITBITDriver.prototype.start = function() {

		console.log("starting FITBIT Adapter");

		this._subscriber = new Getter(this._config.appData, this._config.subscribe);
		this._updater = new Getter(this._config.appData, this._config.update);
		
		// Create a new server and provide a callback for when a connection occurs
		this._server = express();
		this._server.use(session({secret: '1234567890QWERTY'}));
		this._server.use(passport.initialize());
		this._server.use(passport.session());
		this._server.use(cookieParser());
		
		
		passport.use(new FitbitStrategy({
			consumerKey: this._config.appData.key,
			consumerSecret: this._config.appData.secret,
			callbackURL: this._config.callbackURL
		},
			function(token, tokenSecret, profile, done) {
			
				var accessToken = {
					public: token,
					secret: tokenSecret
				}

				this._subscriber.get(accessToken, function(response) {

					if(error) console.log("Failed to verify token " + token + " and secret " + tokenSecret + " with error: " + error);
					
					else process.checkUser(response.ownerID, configLocal.users, function(exists) {
					
						if (exists) console.log("User " + response.ownerID + " is already subscribed");
						
						else {
						
							configLocal.users.push({"ID": response.ownerID, "access": accessToken});
							
							fs.writeFile('config.local.json', JSON.stringify(configLocal), function (err) {
								if (err) throw err;
								console.log("User " + response.ownerID + " is added to system");
							});							
						}
						
					});
				});
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
			for(var i = 0; i < req.body.length; i++) {
				var uID = req.body[i].ownerID;
				updater.get(configLocal.users.uID.accessToken, function(response) {
				
					if(response.error) console.log("Could not get update for user ID " + uID);
					
					else {
						process.parseData(response.data, function(parseResult) {
						
							if (parseResult.error) console.log("Failed to parse update for user ID " + uID);
							
							else this.emit("data", "FITBIT"+uID, parseResult.userData);
						});
					}
				});	
				
			}

		});
		
		

		// Listen on port 8061
		this._server.listen(this._config.port);
	  };

	  FITBITDriver.prototype.stop = function() {
		this._server.close();
	  };

	  return FITBITDriver;
}());