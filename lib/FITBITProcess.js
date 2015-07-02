var exports = module.exports = {};

exports.parseData = function(data, callback) {

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

exports.checkUser = function(user, users, callback) {

	var exists = false;
	
	for (var i = 0; i < users.length; i++) if (users[i].ID == user) exists = true;
	
	callback(exists, user);
}