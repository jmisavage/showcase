var picker = (function(){

	var settings;
	var component;

	var colorsPerPage = 56;

	// HTML elements
	var mask,
		swatches,
		nav,
		indiciator,
		info;

	var hideRollOver;
	var hideInfoBox;
	var offset = 0;

	var maskWidth = 240;
	var roRightMargin = 40;
	var roBottomMargin = 40;

	var inDrag = false;

	var navHeight = 100;
	var navOffset = 0;
	var indicatorHeight = 6.5;

	/**
	* @param {object} config - settings for this component
	* @param {HTMLElement} config.container - the HTML elemnt to attach the color picker too
	* @param {array} config.data - the color data to layout color picker
	* @param {function} config.hoverHandler - callback when a new color is selected
	* @param {function} config.clickHandler - callback when a new color is selected
	* @param {function} config.leaveHandler - callback when a mouse leaves the picker
	* @param {number} config.bannerWidth
	* @param {number} config.bannerHeight
	*/
	function init(config) {
		settings = config;

		createComponent();
		assignEvents();
	}

	function createComponent() {
		component = document.createElement('div');
		component.className = 'picker';

		// hover details
		info = document.createElement('div');
		info.className = 'picker--info';

		// create large swatches container
		mask = document.createElement('div');
		mask.className = 'picker--color-mask';

		swatches = document.createElement('ul');

		// create mini swatch nav
		nav = document.createElement('ul');
		nav.className = 'picker--mini-nav';

		// indiciator where in the mini selector you are
		indiciator = document.createElement('div');
		indiciator.className = 'picker--mini-selected';
		nav.appendChild(indiciator);

		for(var i = 0; i < settings.data.length; i++) {
			// color swatch
			var swatch = document.createElement('li');
			swatch.style.backgroundColor = '#' + settings.data[i][2];
			swatch.dataset.index = i;

			swatches.appendChild( swatch );

			// build mini nav
			if( ((i-6) % colorsPerPage) === 0 ) {
				var item = document.createElement('li');
				item.style.backgroundColor = '#' + settings.data[i][2];
				item.dataset.offset = Math.round( (i-6)/colorsPerPage );

				nav.appendChild( item );
			}
		}

		mask.appendChild( swatches );
		component.appendChild( mask );
		component.appendChild( nav );
		document.getElementById('ola').appendChild( info );

		settings.container.appendChild( component );

		// store nav metrics for slide operations later
		var n = nav.getBoundingClientRect();
		navHeight = n.height - indicatorHeight;
		navOffset = n.top;
	}

	function assignEvents() {
		nav.addEventListener('click', function clickNavItem(e) {
			if(e.target.nodeName.toLowerCase() === 'li') {
				showSection(e.target.dataset.offset);
			}
		});

		indiciator.addEventListener('mousedown', sliderStart);
		nav.addEventListener('mousemove', sliderMove);
		indiciator.addEventListener('mouseup', sliderEnd);
		document.body.addEventListener('mouseup', sliderEnd);

		swatches.addEventListener('mousemove', function(e) {
			clearTimeout(hideRollOver);
			clearTimeout(hideInfoBox);

			if(e.target.nodeName.toLowerCase() === 'li') {
				showSwatch(e.target.dataset.index, e.pageX, e.pageY);
			}
		});

		swatches.addEventListener('click', selectSwatch);
		swatches.addEventListener('mouseout', hideSwatches);
	}

	/**
	* Display a swatch
	*/
	function showSwatch(index, cursorX, cursorY, forceHover) {
		var el = swatches.querySelector('li[data-index="'+index+'"]');
		var pos = el.getBoundingClientRect();

		if(forceHover) {
			var siblings = el.parentNode.childNodes;
			for(var i = 0; i < siblings.length; i++) {
				siblings[i].classList.remove('hover');
			}
			el.classList.add('hover');
		}

		var w = parseInt(info.clientWidth, 10);
		var h = parseInt(info.clientHeight, 10);
		var x = cursorX + 10;
		var y = cursorY + 10;

		if((x + w + roRightMargin) > settings.bannerWidth) {
			x = cursorX - w - 10;
		}

		if((y + h + roBottomMargin) > settings.bannerHeight) {
			y = cursorY - h - 10;
		}

		displaySwatchAt(index, x, y);
	}

	/**
	* convert to hex of BG color on the color info box
	*/
	function rgbToHex(col) {
	    if(col.charAt(0)=='r')
	    {
	        col=col.replace('rgb(','').replace(')','').split(',');
	        var r=parseInt(col[0], 10).toString(16);
	        var g=parseInt(col[1], 10).toString(16);
	        var b=parseInt(col[2], 10).toString(16);
	        r=r.length==1?'0'+r:r; g=g.length==1?'0'+g:g; b=b.length==1?'0'+b:b;
	        var colHex='#'+r+g+b;
	        return String(colHex).toUpperCase();
	    }
	}

	/**
	* Display a color info box at a specified location
	*/
	function displaySwatchAt(index, x, y) {
		var d = settings.data[index];
		if(String('#'+d[2]).toUpperCase() !== rgbToHex(info.style.backgroundColor)) {

			info.style.backgroundColor = '#' + d[2];

			info.className = 'picker--info show';

			info.innerHTML = d[0] + '<br>' + d[1];
		}

		info.style.transform = 'translate('+x+'px, '+y+'px)';

		settings.hoverHandler({
			name : d[0],
			number : d[1],
			hex : '#' + d[2]
		});
	}

	function selectSwatch(e) {
		clearTimeout(hideRollOver);

		var d = settings.data[e.target.dataset.index];

		settings.clickHandler({
			name : d[0],
			number : d[1],
			hex : '#' + d[2]
		});

		requestInfoSwatchRemoval();
	}

	function hideSwatches(e) {
		requestInfoSwatchRemoval();
		resetColorsOnExit();
	}

	function resetColorsOnExit() {
		clearTimeout(hideInfoBox);
		hideInfoBox = setTimeout(settings.leaveHandler.bind(this), 100);
		//settings.leaveHandler.bind(this)
	}

	function sliderStart(e) {
		inDrag = true;
		nav.classList.add('active');
	}

	function sliderMove(e) {
		if(inDrag) {
			var position = Math.max( Math.min(e.pageY - navOffset, navHeight), 0 );
			indiciator.style.top = position + 'px';
			showSection( Math.round(position / indicatorHeight), true );
		}
	}

	function sliderEnd(e) {
		inDrag = false;
		nav.classList.remove('active');
	}

	function requestInfoSwatchRemoval() {
		clearTimeout(hideRollOver);
		hideRollOver = setTimeout(removeRollOver.bind(this), 100);
	}

	function removeRollOver() {
		info.className = 'picker--info';
	}

	function showSection(offset, drag) {
		var left = -offset * maskWidth;
		swatches.style.left = left + 'px';

		var d = nav.querySelector('li[data-offset="'+offset+'"]');

		if(!drag) {
			indiciator.style.top = d.offsetTop + 'px';
		}
		indiciator.style.backgroundColor = d.style.backgroundColor;
	}

	function cleanHover() {
		var el = swatches.querySelectorAll('li');

		for(var i = 0; i < el.length; i++) {
			el[i].classList.remove('hover');
		}
	}


	return {
		init : init,
		showSection : showSection,
		showSwatch : showSwatch,
		hideSwatches : hideSwatches,
		cleanHover : cleanHover
	};

})();
