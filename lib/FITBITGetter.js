var exports = module.exports = {};
var OAuth = require("oauth-1.0a");
var request = require("request");

function Getter(appData, reqData) {

	this.oauth = OAuth({
		consumer: {
			public: appData.key,
			secret: appData.secret
		},
		signature_method: 'HMAC-SHA1'
	});
		
	this.requestData = {
			url: reqData.url,
			method: reqData.method
	};
	
	this.get = function(accessToken, callback) {

		request({
		
				url: this.requestData.url,
				method: this.requestData.method, 
				headers: this.oauth.toHeader(this.oauth.authorize(this.requestData, accessToken))
				
			}, function(error, response, body) {
				var res = {};
				if (error) {
					res.error = error;
					res.data = body;
				}
				else {
					res.error = false;
					res.data = JSON.parse(body);
				}
				
				callback(res);
			}
		);
	}
}



exports.Getter = Getter;
