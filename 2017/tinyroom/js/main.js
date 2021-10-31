/**
* Main Ad Unit code
*/
(function() {
	// customized per ad variables
	var colorUrl						// i18n color data file location, (en-us, en-ca, and fr-ca)
	var startingColor;					// start color for ad (shadow)
	var initRoom;						// room type, leave null for random
	var initStyle;						// style, leave null for random

	// defaults
	var imageBase = './images/rooms/';	// room images

	// data
	var colors = [];					// loaded color data
	var activeSwatch;					// {array} active swatch - name, product id, hex
	var activePage = 0;

	// elements
	var ola;							// entire ad unit
	var bg;								// dynamic background color
	var msg;							// messaging block
	var close;							// close color picker btn
	var change;							// change color btn
	var prodName;						// product name in footer
	var prodDetails;					// product number in footer
	var style;							// dynamic style sheet
	var pointer;
	var lwiLogo;
	var cta;
	var cur;

	var allowTry = false;				// Lock trying while animating
	var lastColor = null;
	var demoMode = false;

	var finalTimeouts = [];



	/***************************************************************************
	*                                                                          *
	*                               Constructor                                *
	*                                                                          *
	***************************************************************************/
	function init() {
		assignDynamicVars();
	}

	init();

	function assignDynamicVars() {
		colorUrl = 'data/en-us.json';
		initRoom = 'lv';
		initStyle = 'ct';

		build();
	}

	function build() {

		ola = document.getElementById('ola');
		msg = document.getElementById('message');
		bg = document.getElementById('bg');
		lwiLogo = document.getElementById('lwi-logo');
		cta = document.querySelector('#frame3 .cta');
		cur = document.querySelector('#panel .cursor');

		style = document.createElement('style');
		document.getElementsByTagName('head')[0].appendChild(style);

		prodName = document.querySelector('#frame3 .selection');
		prodDetails = document.querySelector('#frame3 .label');

		pointer = document.querySelector('#cursor-demo');

		loadColors();
	}

	/**
	* All the animations start here
	*/
	function start() {
		ola.classList.remove('frame0');

		document.getElementById('panel').addEventListener('mouseover', cancelDemo);

		setTimeout( function() { ola.classList.add('frame1'); }, 500);
		setTimeout( function() { room.setColor('#d5dbbf'); }, 1600 );
		setTimeout( function() { room.setColor('#345576'); }, 2600 );
		setTimeout( function() { room.setColor('#9a3f50'); }, 3600 );
		setTimeout( function() { room.setColor('#cfc6b7'); }, 4600 );
		setTimeout( function() {
			ola.classList.remove('frame1');
			ola.classList.add('frame2');
		}, 5200);
		setTimeout( function() {
			picker.showSection(activePage);
			ola.classList.add('show-picker');
			ola.classList.add('demo');
			cur.classList.add('play');
			trackCursor(true);
		}, 8000 );

		// done
		finalTimeouts.push(
			setTimeout( function() {
				trackCursor(false);
				ola.classList.remove('demo');
				picker.hideSwatches();
			}, 12400 )
		);
		finalTimeouts.push(
			setTimeout( function() {
				if(lastColor !== startingColor) {
					room.setColor(startingColor);
				}
				ola.classList.remove('show-picker');

				cur.style.display = 'none';
			}, 13100 )
		);
		finalTimeouts.push(
			setTimeout( function() {
				ola.classList.remove('frame2');
				ola.classList.add('frame-interaction');

				msg.addEventListener('mouseover', startUserInteraction);

				close = document.querySelector('#color-panel .close');
				close.addEventListener('click', cancelPicker);

				change = document.querySelector('#message .footer .close');
				change.addEventListener('click', openPicker);
			}, 13500 )
		);
	}

	function startUserInteraction() {
		msg.removeEventListener('mouseover', startUserInteraction);

		picker.showSection(activePage);
		openPicker();
	}

	function trackCursor(running) {
		demoMode = running;

		if(running) {
			animateCursor();
		} else {
			picker.cleanHover();
			setHTMLColor(activeSwatch.hex);
		}
	}

	function animateCursor() {
		if(demoMode) {
			var p = pointer.getBoundingClientRect();
			var el = document.elementFromPoint(p.left, p.top);

			if(el.nodeName.toLowerCase() === 'li') {
				picker.showSwatch(el.dataset.index, p.left, p.top, true);
			}

			renderer.addAnimation(animateCursor, []);
		}
	}



	/***************************************************************************
	*                                                                          *
	*                         Color Picker Controllers                         *
	*                                                                          *
	***************************************************************************/
	function openPicker(e) {
		allowTry = true;
		ola.classList.add('show-picker');
		lwiLogo.classList.add('no-delay');
		cta.classList.add('no-delay');
	}

	function closePicker(e) {
		ola.classList.remove('frame-interaction');
		ola.classList.add('frame-end');

		ola.classList.remove('show-picker');

		setTimeout(function() {
			cta.classList.remove('no-delay');
		}, 500);
	}

	function cancelPicker(e) {
		selectColor(activeSwatch);

		ola.classList.remove('show-picker');

		var pinfo = document.querySelector('.picker--info');
		pinfo.classList.remove('show');

		setTimeout(function() {
			cta.classList.remove('no-delay');
		}, 500);
	}



	/***************************************************************************
	*                                                                          *
	*                               Loading Data                               *
	*                                                                          *
	***************************************************************************/
	function loadColors() {
		var xhr = new XMLHttpRequest();
		xhr.overrideMimeType( 'application/json' );
		xhr.addEventListener( 'load', parseColorData );
		xhr.open( 'GET', colorUrl );
		xhr.send();
	}

	function parseColorData() {
		colors = JSON.parse( this.responseText );

		activeSwatch = findProduct('1288');
		startingColor = activeSwatch.hex;

		setHTMLColor(activeSwatch);

		room.init({
			canvas: document.getElementById('room'),
			color: activeSwatch.hex,
			room: initRoom,
			style: initStyle,
			url: imageBase,
			imagesLoaded: imagesLoaded
		});

		picker.init({
			container : document.getElementById('color-panel'),
			data : colors,
			hoverHandler : tryColor,
			leaveHandler : resetColor,
			clickHandler : selectColor,
			bannerWidth : ola.offsetWidth,
			bannerHeight : ola.offsetHeight
		});
	}

	function imagesLoaded() {
		start();
	}

	function cancelDemo(e) {
		if(demoMode) {
			demoMode = false;
			allowTry = true;

			for(var i = 0; i < finalTimeouts.length; i++) {
				clearTimeout(finalTimeouts[i]);
			}

			trackCursor(false);
			ola.classList.remove('demo');
			ola.classList.remove('frame2');
			ola.classList.add('frame-interaction');

			var cur = document.querySelector('#panel .cursor');
			cur.style.display = 'none';

			close = document.querySelector('#color-panel .close');
			close.addEventListener('click', cancelPicker);

			change = document.querySelector('#message .footer .close');
			change.addEventListener('click', openPicker);

			document.getElementById('panel').removeEventListener('mouseover', cancelDemo);
		}
	}



	/***************************************************************************
	*                                                                          *
	*                              Colorize Room                               *
	*                                                                          *
	***************************************************************************/
	/**
	* Test a given color and render.  This is used on the color picker's
	* hover state
	*/
	function tryColor(d, force) {
		if((allowTry || demoMode || force) && d.hex != lastColor) {
			// only allow these colors to paint the background during the demo mode
			if(demoMode) {
				lastColor = d.hex;
				render(d.hex);
			} else {
				lastColor = d.hex;
				render(d.hex);
			}
		}
	}

	function resetColor(force) {
		tryColor(activeSwatch, force);
	}

	/**
	* Set the selected color and render
	*
	* @params d         color object
	* @params d.name	product name
	* @params d.number	product number
	* @params d.hex     product hex value
	*/
	function selectColor(d) {
		allowTry = false;
		prodName.innerText = d.name;
		prodDetails.innerText = d.name + ' ' + d.number;
		activeSwatch = d;

		if(lastColor !== d.hex) {
			// ::FlashTalking:: use d.number (Ben Moore Product Number) to track color selection change

			render(d.hex);
		}
		closePicker();
	}

	/**
	* Colorize the room
	*/
	function render(hex) {
		room.setColor(hex, 1);
		setHTMLColor(hex);
	}



	/***************************************************************************
	*                                                                          *
	*                              Color Helpers                               *
	*                                                                          *
	***************************************************************************/
	/**
	* The swatch can be in a lot of formats depending on whether is came from
	* the JSON file (array), animation (string), or color picker (obj)
	*/
	function setHTMLColor(swatch) {
		if( typeof swatch === 'string' ) {
			renderHTMLColor( swatch );
			return swatch;
		} else if( Array.isArray(swatch) ) {
			renderHTMLColor( swatch[2] );
			return swatch[2];
		} else {
			renderHTMLColor( swatch.hex );
			return swatch.hex;
		}
	}

	/**
	* Set's the messaging area's background color to the given color
	*/
	function renderHTMLColor(color) {
		var c = normalizeColor( color );
		bg.style.backgroundColor = '#' + c;
		ola.style.backgroundColor = '#' + c;

		// Determine whether the text color should be light or dark based on bg color
		ola.className = ola.className.replace(/text-\S*/,'') + ' ' + determineTextColor( c );

		// Set the hover state's text color on the CTA to match the given color
		var css = '#message a:hover span { color: #'+c+'; }';
		if( style.styleSheet ) {
		    style.styleSheet.cssText = css;
		} else {
		    style.appendChild( document.createTextNode( css ) );
		}
	}

	/**
	* Search the JSON file for the product id
	*/
	function findProduct(product) {
		for(var i = 0; i < colors.length; i++) {
			if( colors[i][1] === product) {
				activePage = Math.floor(i / 56);

				activeSwatch = {
					name : colors[i][0],
					number : colors[i][1],
					hex : "#" +colors[i][2]
				};

				return activeSwatch;
			}
		}

		return null;
	}

	/**
	* Come on, it does exactly what the function name says
	*/
	function convertHexToRGB(color) {
		var c = normalizeColor(color);
		var rgb = {
			r: parseInt( c.slice(0,2), 16 ),
			g: parseInt( c.slice(2,4), 16 ),
			b: parseInt( c.slice(4,6), 16 )
		};

		return rgb;
	}

	/**
	* Remove the leading # in a hex color, so we can easily slice it for its RGB
	* values later
	*/
	function normalizeColor(color) {
		var c = (color.charAt(0) === '#') ? color.slice(1) : color;

		return c;
	}

	/**
	* Science!
	*/
	function determineTextColor(color) {
		var textColor = 'text-dark';
		var c = convertHexToRGB( color );
		var luminance = 1 - Math.round( 0.299 * c.r + 0.587 * c.g + 0.114 * c.b ) / 255;

		// dark color, light font
		if( luminance > 0.25 ) {
			textColor = 'text-light';
		}

		return textColor;
	}

	return {
		animateCursor : animateCursor
	}

})();
