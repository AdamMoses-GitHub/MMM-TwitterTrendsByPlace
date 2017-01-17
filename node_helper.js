/* global Module */

/* node_helper.js
 * 
 * Magic Mirror
 * Module: MMM-TwitterTrendsByPlace
 * 
 * Magic Mirror By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 * 
 * Module MMM-TwitterTrendsByPlace By Adam Moses http://adammoses.com
 */

// call in the required classes
var NodeHelper = require("node_helper");
var Twitter = require("twitter");
// the main module helper create
module.exports = NodeHelper.create({
	// subclass start method, clears the initial config array
	start: function() {
		this.moduleConfigs = [];
	},
	// subclass socketNotificationReceived, received notification from module
	socketNotificationReceived: function(notification, payload) {
		if (notification === "ADD_TWITTERTRENDPLACE") {
			// useful debug info
			console.log("socketNotificationReceived = " 
							+ "ADD_TWITTERTRENDPLACE:"
							+ payload.placeName + ":" 
							+ payload.placeWoeid);
			// add the current config to an array of all configs used by the helper
			this.moduleConfigs[this.moduleConfigs.length] = payload;
			// this to self
			var self = this;
			// start the interval call for the updates, multiply from minutes to milliseconds			
			setInterval(function() { self.trendsUpdate(payload); }, payload.refreshRate * 60 * 1000);
			// call the initial update now
			this.updateTwitterTrendsByPlace(payload);
			return;
		}
	},
	// trend update simple call
	trendsUpdate: function(moduleConfig) {
		var self = this;
		this.updateTwitterTrendsByPlace(moduleConfig);
	},
	// main helper function to get the trends
	updateTwitterTrendsByPlace: function(moduleConfig) {	
		var client = new Twitter({
		  consumer_key: moduleConfig.consumer_key,
		  consumer_secret: moduleConfig.consumer_secret,
		  access_token_key: moduleConfig.access_token_key,
		  access_token_secret: moduleConfig.access_token_secret
		});	 
		// this to self
		var self = this;
		// prepare the twitter client param
		var params = { id: moduleConfig.placeWoeid }; 
		var paramPlaceWoeid = moduleConfig.placeWoeid;
		// call the twitter client api to get the trends
		client.get('trends/place', params, function(error, jsonOut, response) 
		{
			if (!error) {
				// create a final list of trends to be sent
				var finalTrendList = [];
				// grab the list of trends retrieved
				var trendList = jsonOut[0].trends;
				var trendListLength = trendList.length;
				// iterate throught the trends
				for (var trendIndex = 0; trendIndex < trendListLength; trendIndex++)
				{
					// get the name and tweet volume
					var curTrendName = trendList[trendIndex].name;
					var curTrendVolume = trendList[trendIndex].tweet_volume;
					// if the tweet volume didn't exist, set it to zero
					if (curTrendVolume == null)
						trendList[trendIndex].tweet_volume = 0;
				}				
				// sort by tweet volume
				trendList.sort(function (a, b) {
					return b.tweet_volume - a.tweet_volume;
					});
				// iterate throught the gathered and sorted trends
				for (var trendIndex = 0; trendIndex < trendListLength; trendIndex++)
				{
					// get the trend and volume
					var curTrendName = trendList[trendIndex].name;
					var curTrendVolume = trendList[trendIndex].tweet_volume;
					// if trend didn't have a zero value tweet volume
					if (curTrendVolume != 0)
						finalTrendList[trendIndex] = {name: curTrendName, tweet_volume: curTrendVolume};
				}
				// prepare the update data to send back to the module
				var updateData = { timestamp: Date(),
									woeid: paramPlaceWoeid, 
									trends: finalTrendList}
				// send the data to the module
				self.sendSocketNotification("UPDATE_TWITTERTRENDPLACE", updateData);
			}
			else
			{	  
				// if there is an error, say so	
				console.log("Error getting twitter trends for woeid = " + paraPlaceWoeid);
				// send a message back about the error
				var updateData = { timestamp: Date(),
									woeid: paramPlaceWoeid }
				// send the data to the module
				self.sendSocketNotification("ERROR_TWITTERTRENDPLACE", updateData);
			}
		});	
		return;		
	},		
});

//------------ end -------------
