/* global Module */

/* MMM-TwitterTrendsByPlace.js
 * 
 * Magic Mirror
 * Module: MMM-TwitterTrendsByPlace
 * 
 * Magic Mirror By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 * 
 * Module MMM-TwitterTrendsByPlace By Adam Moses http://adammoses.com
 */

Module.register("MMM-TwitterTrendsByPlace", {
	// setup the default config options
	defaults: {		
		// required
		consumer_key: null,
		consumer_secret: null,
		access_token_key: null,
		access_token_secret: null,		
		placeName: "NULL",
		placeWoeid: null,
		// optional
		numberOfTrendsToShow: 10,
		showTweetVolume: true,
		showTrendRank: true,
		refreshRate: 20,
		fade: false,
		fadePoint: 0.5,
	},
	// the start function
	start: function() {
		// log starting
		Log.info("Starting module: " + this.name);
		// check refresh rate is not faster than 15 minutes
		this.config.refreshRate = Math.max(15, this.config.refreshRate);
		// set loaded, error, and the update to init values
		this.loaded = false;
		this.error = false;
		this.mostRecentUpdate = null;
		// set the header to this place
		this.data.header = "Twitter Trends For " + this.config.placeName;
		if ( (this.config.consumer_key != null) && (this.config.consumer_secret != null)
				&& (this.config.access_token_key != null) && (this.config.access_token_secret != null)
				&& (this.config.placeWoeid != null) )
		{
			// add this config to the helper functions
			this.sendSocketNotification('ADD_TWITTERTRENDPLACE', this.config);
		}
		else
		{
			this.error = true;
		}		
	},
	// the socket handler
	socketNotificationReceived: function(notification, payload) {
		var self = this;
		// if an update was received
		if (notification === "UPDATE_TWITTERTRENDPLACE") {
			// check this is for this module based on the woeid
			if (payload.woeid === this.config.placeWoeid)
			{
				// set loaded flag, set the update, and call update dom
				this.loaded = true;
				this.mostRecentUpdate = payload;
				this.updateDom();
			}
		}
		// if an error was received
		if (notification === "ERROR_TWITTERTRENDPLACE") {
			// check this is for this module based on the woeid
			if (payload.woeid === this.config.placeWoeid)
			{
				// set error flag to true and call update dom
				this.error = true;
				this.updateDom();
			}
		}		
	},
	// the get dom handler
	getDom: function() {
		// if nothing loaded yet, put in placeholder text
		if (!this.loaded)
		{
			var wrapper = document.createElement("div");
			wrapper.className = "xsmall";
			wrapper.innerHTML = "Awaiting Trends...";
			return wrapper;			
		}
		// main update handler
		else if ((this.mostRecentUpdate != null) && (!this.error))
		{
			// cap the total number of trends to ten or however many are available
			var trendsToUse = Math.min(10, this.mostRecentUpdate.trends.length);
			// if user configed to show all trends then do that instead
			if (this.config.numberOfTrendsToShow != 0)
				trendsToUse = Math.min(trendsToUse, this.config.numberOfTrendsToShow);
			// slice the array of trends to the number just set
			var trends = this.mostRecentUpdate.trends.slice(0, trendsToUse);
			// create the outer table
			var wrapper = document.createElement("table");
			// iterate through trends
			for (var t in trends)
			{
				// get the current trend, get the name, get the tweet volume
				var trend = trends[t];
				var trendName = trend.name;
				var trendCount = trend.tweet_volume;
				var trendCountDisplay = null;
				// if above a million reduce the value and add an 'm'
				if (trendCount > 1000000)
					trendCountDisplay = (trendCount / 1000000).toFixed(2) + "m";
				// otherwise it's thousands, add a 'k'
				else
					trendCountDisplay = (trendCount / 1000).toFixed(0) + "k";
				var trendWrapper = document.createElement("tr");
				// if flagged to show the rank of the trends, add as first row element
				if (this.config.showTrendRank)
				{
					var trendRank = document.createElement("td");
					trendRank.className = "xsmall";
					trendRank.align = "left";
					trendRank.innerHTML = String(Number(t) + 1);
					trendWrapper.appendChild(trendRank);						
				}
				// add the trend name itself to the row
				var trendElementWrapper = document.createElement("td");
				trendElementWrapper.className = "small";
				trendElementWrapper.align = "left";
				trendElementWrapper.innerHTML = trend.name;
				trendWrapper.appendChild(trendElementWrapper);
				// if flagged to show the tweet volume, add as last element of row
				if (this.config.showTweetVolume)
				{
					var trendCountWrapper = document.createElement("td");
					trendCountWrapper.className = "xsmall";
					trendCountWrapper.align = "right";
					trendCountWrapper.innerHTML = trendCountDisplay;
					trendWrapper.appendChild(trendCountWrapper);						
				}
				// add this trend to the table
				wrapper.appendChild(trendWrapper);				
				// if flagged to do fade effect, do so
				// this code is from the forecast default module
				if (this.config.fade && this.config.fadePoint < 1) 
				{
					if (this.config.fadePoint < 0) 
						this.config.fadePoint = 0;				
					var startingPoint = trends.length * this.config.fadePoint;
					var steps = trends.length - startingPoint;
					if (t >= startingPoint) 
					{
						var currentStep = t - startingPoint;
						trendWrapper.style.opacity = 1 - (1 / steps * currentStep);
					}
				}
			}
			// return the rendered html
			return wrapper;			
		}
		// else, an error occured so indicate such
		else
		{
			var wrapper = document.createElement("div");
			wrapper.className = "xsmall";
			wrapper.innerHTML = "Some Error Has Occured";
			return wrapper;		
		}		
	}
});

// ------------ end -------------
