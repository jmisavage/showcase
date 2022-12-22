var distanceToMoon = 238857;
var divisions = 2389;
var tweetDivisions = 2389;
var distancePerTweet = distanceToMoon / (tweetDivisions-1);
var gap = 60;
var paper;
var route;
var path;
var routeDots;
var routeProgess;
var dotSpacing;

var prepaper;
var prepath;

var tweets;
var tweetCount = 0;
var currentTweet;
var dots = [];
var dotGlow;
var dotCurrent;

var startDots = tweetDivisions;
var dotsPerLoop = 100;
var redrawPath = true;
var initAnimation = true;
var updateInterval;

var endpoints = {
	//tweets: "/api/index.php/api/tweets",
	tweets: "/data/tweets.json",
	//tweetCount: "/api/index.php/api/tweetCount"
	tweetCount: "/data/tweetCount.json"
};

var styles = {
	preloader:{
		dot:{
			endpoint:{
				"fill": "#ffffff",
				"stroke": "#ffffff",
				"stroke-width": 0,
				"stroke-opacity": 1,
				"fill-opacity" : 1
			},
			progress:{
				"r"		: 4,
				"fill" : "#00aeef",
				"stroke" : "#ffffff",
				"stroke-width":4
			}
		},
		route:{
			base:{
				"stroke": "#ffffff",
				"stroke-width": 1.4,
				"stroke-opacity": 0.4
			},
			travelled:{
				"stroke": "#ffffff",
				"stroke-width": 1.4,
				"stroke-opacity": 1
			}
		},
		glow:{color:"#00aeef"}
	},
	journey:{
		dot:{
			base:{
				"r"				: 3,
				"fill" 			: "#000000",
				"stroke" 		: "#ffffff",
				"stroke-width"	: 2
			},
			active: {
				"r"				: 4,
				"fill" 			: "#00aeef",
				"stroke" 		: "#ffffff",
				"stroke-width"	: 4
			},
			hover: {
				"r"				:3,
				"fill" 	: "#00aeef",
				"stroke" 	: "#ffffff",
				"stroke-width"	: 6
			},
			glow:{

			}
		},
		route:{
			base:{
				"stroke": "#ffffff",
				"stroke-width": 1.4,
				"stroke-opacity": 0.4
			},
			travelled:{
				"stroke": "#ffffff",
				"stroke-width": 1.4,
				"stroke-opacity": 1
			}
		}
	}
}


function main() {
	drawPreloaderRoute();

	tweets = [];

	drawRoute();

	// load tweets
	loadTweets();

	// setup events
	$(".start").on("click", hideMenu);
	$(".newer").on("click", nextTweet);
	$(".older").on("click", prevTweet);
}

/**********************  Toggle to Tribute View  **********************/
function hideMenu() {
	TweenMax.to($("#title .blurb"), 0.5, {css:{autoAlpha:0}, onComplete:hideTitle});
	TweenMax.to($("#title .start"), 0.5, {css:{autoAlpha:0}});
	TweenMax.to($("#menu .moon"), 4, {css:{bottom: "2000px"}, ease:Power2.easeIn, delay:0.5, onComplete:showRoute});
	TweenMax.to($("#menu .moon"), 4,{css:{ scale:0.2 }, delay:1.1, onComplete:buildAndShowRule});
}

function hideTitle() {
	$("#title .blurb, #title .start").hide();
}

function showRoute() {
	$("#menu").hide();
	$("#journey").show(0);

	TweenMax.to($('#route'), 2, {css:{opacity:1.0}});

	var scrollDuration = $("#journey").height() - $(window).height();
	
	var starMovement = $(window).height() - $("#starfield").height();
	var extraMovement2 = $(window).height() - $("#extras2").height();
	
	var controller = $.scrollorama({blocks: ".scrollblock"});
	controller.animate("#starfield", {duration:scrollDuration, property:"top", start:0, end:starMovement});
	controller.animate("#extras2", {duration:scrollDuration, property:"top", start:0, end:extraMovement2});

	//console.log('[showRoute][scrollduration]: ' + scrollDuration);
	
	window.scrollTo(0,scrollDuration);
	
	// The first couple will cause the tweet block to show up below the earth
	//$("#tweet").css("top", (dots[2].attrs.cy - 30) + "px");
	
	setTimeout(function(){
		showTweet(tweetCount, true);
	}, 1000);

	// We've reached our goal the rest is gravy
	if(tweetCount < divisions) {
		// TODO: Set interval to 2 minutes
		var interval = 120 * 1000; // check for new tweets every minute
		updateInterval = setInterval(loadTweets, interval);
	}
}



/******************************  Events  ******************************/
function loaded() {
	$("#preloader").hide();
	$("#menu, #tweetbutton, #title").show();

	plotProgress(tweetCount);
}

/***************************  "Public" API  ***************************/
function plotProgress(tweetsCount) {
	if(routeProgess) {
		routeProgess.remove();
	}
	
	var end = (tweetsCount > tweetDivisions) ? tweetDivisions : tweetsCount - 1;

	if(end > 0) {
		var traveled = route.getSubpath(dotSpacing * (tweetDivisions - end - 1), dotSpacing * (tweetDivisions-1));
				
		routeProgess = paper.path(traveled).insertAfter(route).attr(styles.journey.route.travelled);
	}
	
	for(var i = 0; i <= end; i++) {
		dots[i].attr(styles.journey.dot.base);
	}
}

function showTweet(tweetIndex, scroll) {
	distancePerTweet = distanceToMoon / (tweetDivisions - 1);
	
	if(tweetIndex <= tweetCount && tweetIndex > 0) {
		var tweetInfo = tweets[tweetIndex-1];

		// The first couple will cause the tweet block to show up below the earth
		if(tweetIndex < 3) {
			var y = dots[2].attrs.cy;
		} else if(tweetIndex >= (dots.length - 2)) {
			var y = dots[dots.length - 2].attrs.cy;
		} else {
			var y = dots[tweetIndex-1].attrs.cy;
		}
		
		y = Math.ceil(y);
		
		// Remove previous active tweet
		if(currentTweet) {
			dots[currentTweet-1].attr(styles.journey.dot.base);
		}
		
		// set new active tweet
		dotCurrent = dots[tweetIndex-1].attr(styles.journey.dot.active);

		// dots
		if (dotGlow) dotGlow.remove();
		dotGlow = dotCurrent.glow({color:"#00aeef", width:15, opacity: 0.75});

		currentTweet = tweetIndex;
		var time = 1;

		// scroll to new position
		if (scroll) adjustWindowScroll();
		
		// toggle up/newer/next button
		if(currentTweet == tweetCount) {
			$("#tweet .newer").hide();
		} else {
			$("#tweet .newer").show();
		}
		
		// toggle down/older/prev button
		if(currentTweet == 1) {
			$("#tweet .older").hide();
		} else {
			$("#tweet .older").show();
		}

		
		var distance = Math.round(distancePerTweet * tweetIndex);
		distance = distance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		
		var mileageText = '<div class="miles">'+ distance +' Miles</div>';
		
		// Linkify twitter hashtags and users
		var tweetText = "@" + tweetInfo.fromUser + " " + tweetInfo.text;
		tweetText = tweetText.replace(/(^|\s)@(\w+)/g, "$1<a href=\"http://www.twitter.com/$2\" target=\"blank\" class=\"user\">@$2</a>");
		tweetText = tweetText.replace(/(^|\s)#(\w+)/g, "$1<a href=\"http://search.twitter.com/search?q=%23$2\" target=\"blank\" class=\"hashtag\">#$2</a>");
		
		$("#tweet .message").html(mileageText + tweetText);
	}
}

function nextTweet() {
	if(currentTweet) {
		showTweet(currentTweet+1, true);
	}
}

function prevTweet() {
	if(currentTweet) {
		showTweet(currentTweet-1, true);
	}
}


function loadTweets() {

	var endpoint = endpoints.tweets;
	if (tweets.length > 0){
		endpoint += "/" + tweets[tweets.length-1].id;
	}

	$.ajax({
		url : endpoint,
		dataType: "json",
		success : function(data) {
			tweets = tweets.concat(data);
			
			tweetCount = tweets.length;

			if(tweetCount > tweetDivisions) {
				clearInterval(updateInterval);
			}
		
			if(redrawPath) {
				startDots = tweetDivisions;
				addDots();
			} else {
				plotProgress(tweetCount);
			}
		
			redrawPath = false;
		}
	});
}

function adjustWindowScroll(duration) {
	$('html, body').animate({scrollTop: dotCurrent.attr("cy")-170}, duration, 'swing', function(){
		// show #tweet if needed
		if (initAnimation){
			$("#tweet").show();
			$(window).scroll(navigateTweets);
			initAnimation = false;
		}
	});


}

function navigateTweets(){
	var realDistanceBetweenTweets = ($('#route').height() - 170)/tweetDivisions,
		top = $('body').scrollTop() + 170,
		position = Math.round(top/realDistanceBetweenTweets);
	showTweet(tweetDivisions - position, false);

}

/****************************  Draw Route  ****************************/
function drawRoute() {
	paper = Raphael("route", 800, divisions*gap+180);

	// setup curvey path
	path = [["M", 600, 100]];
	var segments = gap;
	var curves = Math.floor(divisions/3);
	
	// Bunch of bezier curves
	for(var i = 1; i <= segments; i++) {
		var a = divisions*(i-1) + curves + 100;
		var b = divisions*(i-1) + curves*2 + 100;
		var c = divisions*i+100;
	
		if(i != segments) {
			path.push(["C", 200, a, 600, b, 400, c]);
		} else {
			path.push(["C", 200, a, 600, b, 550, c]);
		}
	}
	
	// draw route
	route = paper.path(path).attr(styles.journey.route.base);
}

function addDots() {
	// create the little dots in between the tweet dots
	dotSpacing = route.getTotalLength() / (tweetDivisions-1);
	
	setTimeout(drawDots, 250);
}

function drawDots() {
	// Add tweet dots
	var endDots = startDots - dotsPerLoop;
	endDots = (endDots > 0) ? endDots : 0;
	
	for(var i = startDots; i > endDots; i--) {
		var spot =  route.getPointAtLength(dotSpacing*(i-1));
		var dot = paper.circle(spot.x, spot.y, 3);
		dot.attr({
			"fill": "#cccccc"
		}).data("i", (tweetDivisions-i+1)).click(function() {
			showTweet(this.data("i"), false);
		}).mouseover(function() {
			if(this.data("i") <=  tweetCount && this.data("i") != currentTweet) {
				this.attr(styles.journey.dot.hover);
			}
		}).mouseout(function() {
			if(this.data("i") <=  tweetCount && this.data("i") != currentTweet) {
				this.attr(styles.journey.dot.base);
			}
		});
		
		dots.push(dot);
	}
	
	if(endDots > 0) {
		startDots = endDots;
		setTimeout( drawDots, 50 );
	} else {
		loaded();
	}
}
/****************************  Side Rule  ****************************/
function buildAndShowRule() {
	for (var i=0;i<100; i=i+2){
		$('<span></span>').css('top',i+'%').appendTo('#rule');
	}
	$('#rule').fadeIn(4000);
}


/****************************  Draw Preloader Route  ****************************/
function drawPreloaderRoute() {
	prepaper = Raphael("preroute", 220, 480);

	var path = "M144,380"+
		"c0-29.308-23.759-53.066-53.066-53.066"+
		"c-36.635,0-66.333,29.698-66.333,66.333"+
		"c0,45.793,37.123,82.917,82.916,82.917"+
		"c57.242,0,103.646-46.404,103.646-103.646"+
		"c0-71.552-60.662-101.038-105.162-145.538"+
		"c-46.5-46.5-71.547-95.885-71.547-147.606"+
		"c0-41.376,33.542-74.918,74.919-74.918"+
		"c33.101,0,59.935,26.833,59.935,59.935"+
		"c0,26.48-21.467,47.948-47.948,47.948"+
		"c-21.185,0-38.358-17.174-38.358-38.358";


	prepath = prepaper.path(path).attr(styles.preloader.route.base);

	prepaper.circle(84, 74, 4).attr(styles.preloader.dot.endpoint);
	prepaper.circle(144, 380, 4).attr(styles.preloader.dot.endpoint);

	$.ajax({
		url : endpoints.tweetCount,
		dataType: "json",
		success : function(data) {
			var count = data.count,
				remaining = distanceToMoon - (count*100);

			remaining = remaining < 0 ? 0 : remaining;

			var progressPercentage = (distanceToMoon - remaining)/distanceToMoon,
				pathTotalLength = prepath.getTotalLength(),
				progressLength = pathTotalLength * progressPercentage,
				pathPointAtLength = prepath.getPointAtLength(progressLength),
				path = prepath.getSubpath(0, progressLength);

			prepaper.path(path).attr(styles.preloader.route.travelled).glow(styles.preloader.glow);
			prepaper.circle(pathPointAtLength.x, pathPointAtLength.y, 4).attr(styles.preloader.dot.progress).glow(styles.preloader.glow);

			$("#preloader .distance span").html(remaining);

		}
	});
}