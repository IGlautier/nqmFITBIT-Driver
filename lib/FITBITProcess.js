var exports = module.exports = {};

exports.parseData = function parseData(data, callback) {
		var parseResult = {};
		if (data === "undefined") parseResult.error = true;
		else {
			parseResult.userData = {};
			parseResult.error = false;
			parseResult.userID = data.user.encodedID;
			parseResult.userData.weight = data.user.weight;
			parseResult.userData.height = data.user.height;
			parseResult.userData.dailySteps = data.user.averageDailySteps;
		}
		callback(parseResult);
	}
	
exports.getData = function getData(token, secret, conKey, conSecret, callback) {

		var oauth = OAuth({
			consumer: {
				public: conKey,
				secret: conSecret
			},
			signature_method: 'HMAC-SHA1'
		});
		
		var request_token = {
			public: token,
			secret: secret
		};
		
		var request_data = {
			url: 'https://api.fitbit.com/1/user/-/profile.json',
			method: 'GET'
		};
		
		request({
			url: request_data.url,
			method: request_data.method, 
			headers: oauth.toHeader(oauth.authorize(request_data, request_token))
		}, function(error, response, body) {
			if (!error) callback(body, false);
			else callback(error, true);
		});
	}
	
exports.subscribe = function subscribe(token, secret, conKey, conSecret, callback) {

		var oauth = OAuth({
			consumer: {
				public: conKey,
				secret: conSecret
			},
			signature_method: 'HMAC-SHA1'
		});
		
		var request_token = {
			public: token,
			secret: secret
		};
		
		var request_data = {
			url: 'https://api.fitbit.com/1/user/-/apiSubscriptions/0.json',
			method: 'POST'
		};
		
		request({
		url: request_data.url,
			method: request_data.method, 
			headers: oauth.toHeader(oauth.authorize(request_data, request_token))
		}, function(error, response, body) {
			if (!error) callback(body, false);
			else callback(error, true);
		});
	}