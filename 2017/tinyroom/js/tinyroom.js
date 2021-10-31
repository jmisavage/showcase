function preload(arr){
	var newimages = [],
		loadedimages = 0;
	var postaction = function(){};

	arr=(typeof arr!="object")? [arr] : arr;

	function imageloadpost(){
		loadedimages++
		if (loadedimages==arr.length){
			postaction(newimages);
		}
	}
	for (var i=0; i<arr.length; i++){
		newimages[i]=new Image()
		newimages[i].src=arr[i]
		newimages[i].onload=function(){
			imageloadpost()
		}
		newimages[i].onerror=function(){
			imageloadpost()
		}
	}
	return {
		done:function(f){
			postaction=f || postaction
		}
	}
}

var renderer = (function() {
	var color = null;
	var animation = null;
	var raf = null;

	function render() {
		var f;
		var v;

		if(animation !== null) {
			f = animation.fn;
			v = animation.vars;
			animation = null;

			f.apply(null, v );
		}

		if(color !== null) {
			f = color.fn;
			v = color.vars;
			color = null;

			f.apply(null, v );
		}

		raf = requestAnimationFrame(render);
	}

	function addColor(method, params) {
		color = {
			fn: method,
			vars: params
		}

		if(raf === null) {
			raf = requestAnimationFrame(render);
		}
	}

	function addAnimation(method, params) {
		animation = {
			fn: method,
			vars: params
		}

		if(raf === null) {
			raf = requestAnimationFrame(render);
		}
	}

	return {
		addAnimation : addAnimation,
		addColor : addColor
	}
})();


/**
*
*/
var room = (function() {
	var settings;
	var activeRoom;
	var ctx;
	var layers;

	var raf = null;
	var x = 0;
	var y = 0;

	var room = ['lv','br','dr','kt'];
	var style = ['cc','ct','me','mm'];
	var anim = {
		'300x250' : {
			cc : {
				lv : { x : 150, y: 125 },
				kt : { x : 150, y: 125 },
				br : { x : 150, y: 125 },
				dr : { x : 150, y: 125 }
			},
			ct : {
				lv : { x : 150, y: 125 },
				kt : { x : 150, y: 125 },
				br : { x : 150, y: 125 },
				dr : { x : 150, y: 125 }
			},
			me : {
				lv : { x : 150, y: 125 },
				kt : { x : 150, y: 125 },
				br : { x : 150, y: 125 },
				dr : { x : 150, y: 125 }
			},
			mm : {
				lv : { x : 150, y: 125 },
				kt : { x : 150, y: 125 },
				br : { x : 150, y: 125 },
				dr : { x : 150, y: 125 }
			}
		},
		'300x600' : {
			cc : {
				lv : { x : 150, y: 310 },
				kt : { x : 150, y: 240 },
				br : { x : 150, y: 260 },
				dr : { x : 10, y: 250 }
			},
			ct : {
				lv : { x : 150, y: 340 },
				kt : { x : 150, y: 250 },
				br : { x : 150, y: 250 },
				dr : { x : 240, y: 310 }
			},
			me : {
				lv : { x : 150, y: 360 },
				kt : { x : 75, y: 250 },
				br : { x : 150, y: 300 },
				dr : { x : 250, y: 300 }
			},
			mm : {
				lv : { x : 150, y: 360 },
				kt : { x : 150, y: 270 },
				br : { x : 190, y: 205 },
				dr : { x : 150, y: 340 }
			}
		},
		'728x90' : {
			cc : {
				lv : { x : 525, y: 150 },
				kt : { x : 525, y: 150 },
				br : { x : 525, y: 150 },
				dr : { x : 525, y: 150 }
			},
			ct : {
				lv : { x : 525, y: 150 },
				kt : { x : 525, y: 150 },
				br : { x : 525, y: 150 },
				dr : { x : 525, y: 150 }
			},
			me : {
				lv : { x : 525, y: 150 },
				kt : { x : 525, y: 150 },
				br : { x : 525, y: 150 },
				dr : { x : 525, y: 150 }
			},
			mm : {
				lv : { x : 525, y: 150 },
				kt : { x : 525, y: 150 },
				br : { x : 525, y: 150 },
				dr : { x : 525, y: 150 }
			}
		},
		'970x250' : {
			cc : {
				lv : { x : 410, y: 200 },
				kt : { x : 455, y: 20 },
				br : { x : 575, y: 90 },
				dr : { x : 410, y: 125 }
			},
			ct : {
				lv : { x : 525, y: 150 },
				kt : { x : 500, y: 150 },
				br : { x : 565, y: 110 },
				dr : { x : 385, y: 100 }
			},
			me : {
				lv : { x : 480, y: 170 },
				kt : { x : 500, y: 170 },
				br : { x : 325, y: 170 },
				dr : { x : 310, y: 125 }
			},
			mm : {
				lv : { x : 535, y: 50 },
				kt : { x : 465, y: 170 },
				br : { x : 575, y: 90 },
				dr : { x : 360, y: 125 }
			}
		}
	};

	var totalIterations = 45;

	/**
	* @param {object} config
	* @param {string} config.url - url to load room layout files
	* @param {HTMLElement} config.canvas - canvas element to render the room to
	* @param {string} config.room - (lv|br|dr|kt) or if undefined than one chosen at random
	* @param {string} config.style - (cc|ct|me|mm) or if undefined than one chosen at random
	* @param {string} config.color - hex color value to render room in
	*/
	function init(config) {
		settings = config;

		if( settings.room.length === 0 || settings.room.match(/(lv|br|dr|kt)/).length === 0 ) {
			settings.room = random( room );
		}

		if( settings.style.length === 0 || settings.style.match(/(cc|ct|me|mm)/).length === 0 ) {
			settings.style = random( style );
		}

		// animation starting point varies by room style and type now
		var size = settings.canvas.width + 'x' + settings.canvas.height
		settings.x = anim[size][settings.style][settings.room].x;
		settings.y = anim[size][settings.style][settings.room].y;

		ctx = settings.canvas.getContext('2d');

		parseRoomConfig();
	}

	function parseRoomConfig() {
		var tmp = [];
		tmp.push( settings.url + settings.room + '-' + settings.style + '-o.png');
		tmp.push( settings.url + settings.room + '-' + settings.style + '-p.png');
		tmp.push( settings.url + settings.room + '-' + settings.style + '-x.jpg');

		preload( tmp ).done( onLoadComplete.bind(this) );
	}

	function onLoadComplete(images) {
		layers = images;
		setColor( settings.color, totalIterations );
		settings.imagesLoaded();
	}

	function createColorLayer(color, mask) {
		var canvas = document.createElement('canvas');
		canvas.width = settings.canvas.width;
		canvas.height = settings.canvas.height;

		var ctx2 = canvas.getContext('2d');
		ctx2.drawImage(mask, 0, 0);
		ctx2.globalCompositeOperation = 'source-in';

		ctx2.fillStyle = color;
		ctx2.fillRect(0,0, settings.canvas.width, settings.canvas.height);

		return canvas;
	}

	function createAnimationLayer(base, walls, overlay, percent) {
		var canvas = document.createElement('canvas');
		canvas.width = settings.canvas.width;
		canvas.height = settings.canvas.height;

		var ctx2 = canvas.getContext('2d');
		//ctx2.fillStyle = 'rgba(255,255,255,0.02)';
		//ctx2.fillRect(0, 0, canvas.width, canvas.height);

		ctx2.globalCompositeOperation = 'destination-in';
		ctx2.drawImage(walls, 0, 0);

		ctx2.globalCompositeOperation = 'source-over';
		ctx2.drawImage( createPaintingEffect(base, walls, overlay, percent), 0, 0 );

		return canvas;
	}

	function createPaintingEffect(base, walls, overlay, percent) {
		var canvas = document.createElement('canvas');
		canvas.width = settings.canvas.width;
		canvas.height = settings.canvas.height;

		var r = Math.max(canvas.width,canvas.height) * 0.6 * percent; // 0.6 refers to we only need a radius 60% the max size of the banner
		var feather = 50; // was 30

		var ctx2 = canvas.getContext('2d');
		var grd = ctx2.createRadialGradient(settings.x, settings.y, r, settings.x, settings.y, r+feather);
		grd.addColorStop(0, 'rgba(0,0,0,1)');
		grd.addColorStop(1, 'rgba(0,0,0,0)');
		ctx2.globalCompositeOperation = 'source-over';
		ctx2.arc(settings.x, settings.y, r+feather, 0, Math.PI*2);
		ctx2.fillStyle = grd;
		ctx2.fill();

		ctx2.globalCompositeOperation = 'source-atop';
		ctx2.drawImage(base, 0, 0);
			ctx2.globalAlpha = 1 * percent;
		ctx2.drawImage(walls, 0, 0);
			ctx2.globalAlpha = 1 * percent;
		ctx2.drawImage(overlay, 0, 0);

		ctx2.globalCompositeOperation = 'destination-in';
		ctx2.drawImage(walls, 0, 0);

		return canvas;
	}

	function setColor(color, iteration) {
		iteration = (iteration === undefined) ? 1 : iteration;

		if(iteration >= totalIterations) {
			ctx.drawImage( layers[2], 0, 0 );
			ctx.drawImage( createColorLayer( color, layers[1]), 0, 0 );
			ctx.drawImage( layers[0], 0, 0 );
		} else {
			var p = easeInOutQuad(iteration, 0.1, 1, totalIterations);

			ctx.drawImage( createAnimationLayer( layers[2], createColorLayer( color, layers[1] ), layers[0], p ), 0, 0 );

			renderer.addColor(setColor, [color, iteration + 1]);
		}
	}

	function error(msg) {
		//console.error(msg);
	}

	function random(arr) {
		var index = Math.round( Math.random()*(arr.length - 1) );

		return arr[index];
	}

	return {
		init : init,
		setColor : setColor
	}



	/**
	* Robert Penner's Easing Equations
	* url: https://gist.github.com/marioluan/5499930
	*/
	function easeInOutCubic(currentIteration, startValue, changeInValue, totalIterations) {
	    if ((currentIteration /= totalIterations / 2) < 1) {
	        return changeInValue / 2 * Math.pow(currentIteration, 3) + startValue;
	    }
	    return changeInValue / 2 * (Math.pow(currentIteration - 2, 3) + 2) + startValue;
	}

	function easeInOutQuad(currentIteration, startValue, changeInValue, totalIterations) {
		if ((currentIteration /= totalIterations / 2) < 1) {
			return changeInValue / 2 * currentIteration * currentIteration + startValue;
		}
		return -changeInValue / 2 * ((--currentIteration) * (currentIteration - 2) - 1) + startValue;
	}

})();
