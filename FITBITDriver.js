	var util = require("util");
	var EventEmitter = require("events").EventEmitter;
	var passport = require("passport");
	var express = require("express");
	var	session = require("express-session");
	var FitbitStrategy = require("passport-fitbit").Strategy;
	var cookieParser = require("cookie-parser"); 
	var Getter = require("./FITBITGetter.js").Getter;
	var process = require("./FITBITProcess.js");
	var configLocal = require("./config.local.json"), fs = require("fs"); 
	var tConf = require("./config.json");
	var bodyParser = require('body-parser');
	var multer = require('multer'); 


	function FITBITDriver(config) {

		console.log("creating FITBIT adapter");

		EventEmitter.call(this);
		this._config = config;
		this._server = null;
		
		/*These objects are used for requests to the fitbit api*/
		this._subscriber = null;
		this._updater = null;
	}

	util.inherits(FITBITDriver, EventEmitter);

	FITBITDriver.prototype.start = function() {

		console.log("starting FITBIT Adapter");

		/*Setting up api request details*/
		this._subscriber = new Getter(this._config.appData, this._config.subscribe);
		this._updater = new Getter(this._config.appData, this._config.update);
		
		/* Create a new server and provide a callback for when a connection occurs*/
		this._server = express();
		this._server.use(session({secret: '1234567890QWERTY'}));
		this._server.use(passport.initialize());
		this._server.use(passport.session());
		this._server.use(cookieParser());
		this._server.use(bodyParser.json()); // for parsing application/json
		this._server.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
		this._server.use(multer()); // for parsing multipart/form-data
		
		passport.serializeUser(function(user, done) {
		  done(null, user);
		});

		passport.deserializeUser(function(user, done) {
		  done(null, user);
		});
		/*OAuth for getting access token and subscribing user*/
		passport.use(new FitbitStrategy({
			consumerKey: this._config.appData.key,
			consumerSecret: this._config.appData.secret,
			callbackURL: this._config.callbackURL
		},
			function(token, tokenSecret, profile, done) {
				console.log(token);
				console.log(tokenSecret);
				var accessToken = {
					public: token,
					secret: tokenSecret
				}

				this._subscriber.get(accessToken, function(response) {
					
					if(response.error) console.log("Failed to verify token " + token + " and secret " + tokenSecret + " with error: " + error);
					
					else process.checkUser(response.data.ownerId, configLocal.users, function(exists, uID) {
						
						if (exists) console.log("User " + uID + " is already subscribed");
						
						else {
						
							configLocal.users.push({"ID": uID, "access": accessToken});
							
							fs.writeFile('config.local.json', JSON.stringify(configLocal), function (err) {
								if (err) throw err;
								console.log("User " + uID + " is added to system");
							});							
						}
						
					});
				});
				return done(null, profile);
			}.bind(this)
		));
		
		/* New User Registration*/
		this._server.get('/auth/fitbit', passport.authenticate('fitbit'), function(req,res) {console.log("Request Received")});

		/* Callback page that user is presented with when they have authorised and subscribed*/
		this._server.get('/auth/fitbit/callback', 
		  passport.authenticate('fitbit', { failureRedirect: '/auth/failed' }),
		  function(req, res) {
			// Currently makes the user's page hang
			res.redirect('/');
		});
		
		  
		/* Failure page*/ 
		this._server.get('/auth/failed', function(req,res) {
			res.send('Something went wrong in authentication');
		});
		
		this._server.get('/', function(req,res) {res.send("200 ok")});
		
		/* Notification Listener*/
		this._server.post('/subscribe/notify', function(req,res) {

			res.send(204);
			
			if(typeof req.body.errors === "undefined"){
				
				for(var i = 0; i < req.body.length; i++) {
					
					var uID = req.body[i].ownerId;
					console.log("Fetching data for user id: " + uID);
					
					this._updater.get(configLocal.users[i].access, function(response) {

						if(response.error) console.log("Could not get update for user");
						
						else {
							process.parseData(response.data, function(parseResult) {
							
								if (parseResult.error) console.log("Failed to parse update for user");
								
								else console.log(util.inspect(parseResult.userData));
								//this.emit("data", "FITBIT"+uID, parseResult.userData);
							});
						}
					});	
					
				}
			}
			else console.log(req.body.errors);

		}.bind(this));
		
		console.log(this._config.port)

		// Listen on port 8061
		this._server.listen(this._config.port);
	  };

	  FITBITDriver.prototype.stop = function() {
		this._server.close();
	  };
	
var server = new FITBITDriver(tConf);
server.start();
