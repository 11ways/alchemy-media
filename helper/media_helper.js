const PLACEHOLDER = Symbol('placeholder');

/**
 * The Media helper
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  1.0.0
 *
 * @param    {ViewRender}    view
 */
const Media = Function.inherits('Alchemy.Helper', 'Media');

/**
 * Function to execute on the client side, when the scene is made
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.4.1
 *
 * @param    {Scene}   scene
 */
Media.setStatic(function onScene(scene) {

	// Get the screen size of this client, so we can send them correct pictures
	scene.cookie('mediaResolution', {
		width  : Math.max(screen.availWidth||0, window.outerWidth||0) || 1024,
		height : Math.max(screen.availHeight||0, window.outerHeight||0) || 768,
		dpr    : window.devicePixelRatio
	});

	// Look for lazy load images
	scene.appears('js-he-lazy', {padding: 600, live: true}, function onAppear(el) {

		// Get the current style
		var style = el.getAttribute('style');

		// Add the lazy style
		el.setAttribute('style', style + el.dataset.lazy);

		// Remove the data-lazy attribute
		el.dataset.lazy = '';
	});

	//Media.loadImagesBasedOnSize();
});

/**
 * Load images based on the element's dimensions
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.4.1
 * @version  0.4.1
 */
Media.setStatic(function loadImagesBasedOnSize() {

	var elements = document.querySelectorAll('img'),
	    element,
	    srcset,
	    src,
	    url,
	    i;

	for (i = 0; i < elements.length; i++) {
		element = elements[i];
		src = element.getAttribute('src');

		if (!src) {
			continue;
		}

		// Parse the url
		url = Blast.Classes.RURL.parse(src);

		url.addQuery('width', element.width);
		url.addQuery('height', element.height);

		// Set the new source
		url.src = String(url);

		// Add dpr info
		url.addQuery('dpr', 2);

		// Create sourceset
		srcset = String(url) + ' 2x';

		element.setAttribute('srcset', srcset);
	}
});

/**
 * Load the icon font
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.4
 * @version  0.6.4
 *
 * @return   {string}
 */
Media.setMethod(function loadIconFont() {

	let font_style = this.hawkejs_renderer.expose('fontawesome_pro');

	if (!font_style) {
		font_style = 'alchemy_icons_fafree';
	}

	this.hawkejs_renderer.style(font_style);

	return font_style;
});

/**
 * Apply directive to an element
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.0
 * @version  0.6.2
 *
 * @param    {Element}   element    The element to apply to
 * @param    {String}    image      The image identifier
 * @param    {Object}    options
 *
 * @return   {Object}
 */
Media.setMethod(function applyDirective(element, image, options) {

	let record,
	    height = element.getAttribute('height'),
	    width = element.getAttribute('width');

	if (image && typeof image == 'object' && image._id) {
		record = image;
		image = image._id;
	}

	if (!options) {
		options = {};
	}

	let variables = element[Hawkejs.VARIABLES];

	if (!options.route) {
		options.route = variables?.['media-route'];
	}

	if (width) {
		if (width.indexOf('%') > -1) {
			element.removeAttribute('width');
		}

		options.width = width;
	}

	if (height) {
		if (height.indexOf('%') > -1) {
			element.removeAttribute('height');
		}

		options.height = height;
	}

	let url = this.imageUrl(image, options),
	    clone = url.clone();

	clone.addQuery('dpr', 2);

	let srcset = clone + ' 2x';

	// Set the source attribute
	element.setAttribute('src', url);

	element.setAttribute('srcset', srcset);

	if (element.hasAttribute('alt')) {
		return;
	}

	if (record && record.alt) {
		element.setAttribute('alt', record.alt);
		return;
	}

	if (options[PLACEHOLDER]) {
		element.setAttribute('alt', '');
		element.setAttribute('role', 'presentation');
	}

	if (!String(image).isHex()) {
		return;
	}

	let pledge = new Pledge();

	this.view.helpers.Alchemy.getResource({
		name: 'MediaFile#data',
		params: {
			id: image
		}
	}, function gotResult(err, data) {

		if (!err && data) {
			if (data.alt) {
				element.setAttribute('alt', data.alt);
			} else {
				element.setAttribute('alt', '');
			}

			if (data.title && !element.hasAttribute('title')) {
				element.setAttribute('title', data.title);
			}

		}

		pledge.resolve();
	});

	return pledge;
});

/**
 * Get a file anchor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.4.0
 * @version  0.4.0
 *
 * @param    {String}   image_id
 *
 * @return   {HTMLElement}
 */
Media.setMethod(function fileAnchor(file_id, options) {

	var url;

	return this.view.helpers.Router.printRoute('Media::file', {id: file_id}, options);
});

/**
 * Get the base url for a single image
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.5.1
 *
 * @param    {String}   image_id
 *
 * @return   {URL}
 */
Media.setMethod(function imageUrl(image_id, options) {

	var routeName,
	    base_url,
	    url;

	if (!options) {
		options = {};
	}

	if (String(image_id).isHex()) {

		if (options.route) {
			routeName = options.route;
		} else {
			routeName = 'Media::image';
		}

		url = this.parseURL(this.view.helpers.Router.routeUrl(routeName, {id: image_id}));
	} else if (typeof image_id == 'string' && image_id.indexOf('http') === 0) {
		url = this.parseURL(image_id);
	} else if (image_id) {
		url = this.parseURL('/media/static/' + image_id);
	} else {
		return this.placeholderUrl(options);
	}

	if (options != null) {
		if (options.profile) {
			url.addQuery('profile', options.profile);
		}

		if (options.width) {
			url.addQuery('width', options.width);
		}

		if (options.height) {
			url.addQuery('height', options.height);
		}
	}

	if (options.full) {
		base_url = this.view.internal('url');
		url.protocol = base_url.protocol;
		url.host = base_url.host;
		url.hostname = base_url.hostname;
		url.port = base_url.port;
	}

	return url;
});

/**
 * Create a base placeholder image url
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.6.2
 *
 * @param    {Object}   options
 *
 * @return   {URL}
 */
Media.setMethod(function placeholderUrl(options) {

	var url;

	url = this.parseURL(this.view.helpers.Router.routeUrl('Media::placeholder'));

	if (options != null) {

		if (options.profile) {
			url.addQuery('profile', options.profile);
		}

		if (options.width) {
			url.addQuery('width', options.width);
		}

		if (options.height) {
			url.addQuery('height', options.height);
		}

		if (options.text) {
			url.addQuery('text', options.text);
		}

		options[PLACEHOLDER] = true;
	}

	return url;
});

/**
 * Get an array of srcset image urls
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {String}   image_id
 * @parma    {Object}   options
 *
 * @return   {Array}    An array of URL objects
 */
Media.setMethod(function imageUrls(image_id, options) {

	var result,
	    base;

	if (image_id) {
		base = this.imageUrl(image_id, options);
	} else {
		base = this.placeholderUrl(options);
	}

	result = [base];

	result.push(base.clone().addQuery('dpr', '2 2x'));

	return result;
});

/**
 * Get background-image CSS, including srcset
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.4.1
 *
 * @param    {String}   image_id
 * @parma    {Object}   options
 *
 * @return   {String}
 */
Media.setMethod(function imageCssSet(image_id, options) {

	var result,
	    prefix,
	    clone,
	    url,
	    ua,
	    i;

	ua = this.view.internal('useragent') || {};

	switch (ua.family) {

		case 'Mobile Safari':
		case 'Chromium':
		case 'Safari':
		case 'Chrome':
			prefix = ['-webkit-'];
			break;

		case 'Firefox':
			prefix = ['-moz-'];
			break;

		case 'Opera':
			prefix = ['-webkit-', '-o-'];
			break;

		case 'IE':
		case 'IE Mobile':
			prefix = ['-ms-'];
			break;

		default:
			prefix = ['-webkit-', '-moz-', '-o-', '-ms-'];
	}

	url = this.imageUrl(image_id, options);

	// Unprefixed mostly works, now
	prefix.push('');

	result = 'background-image: url(' + url + ');';

	for (i = 0; i < prefix.length; i++) {
		result += '\n';

		result += 'background-image: ';

		result += prefix[i] + 'image-set(\n';

		clone = url.clone();
		clone.addQuery('dpr', 1);

		result += 'url(' + clone + ') 1x,\n';

		clone = url.clone();
		clone.addQuery('dpr', 2);

		result += 'url(' + clone + ') 2x\n);';
	}

	return result;
});

/**
 * Output an img element
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {String}   image_id
 *
 * @return   {URL}
 */
Media.setMethod(function image(image_id, options) {

	var classes,
	    element,
	    srcset,
	    image,
	    clone,
	    key,
	    url;

	if (!options) {
		options = {};
	} else {
		options = Object.assign({}, options);
	}

	if (image_id && typeof image_id == 'object' && image_id._id) {
		image = image_id;
		image_id = image_id._id;
	} else {
		image = {};
	}

	url = this.imageUrl(image_id, options);
	clone = url.clone();
	clone.addQuery('dpr', 2);

	srcset = clone + ' 2x';

	// Create the element
	element = this.view.createElement('img');

	// Set the source attribute
	element.setAttribute('src', url);

	// Set the srcset if it's available
	if (srcset) {
		element.setAttribute('srcset', srcset);
	}

	if (options.title || image.title) {
		element.setAttribute('title', options.title || image.title);
	}

	// Set the alt description
	if (options.alt || image.alt) {
		element.setAttribute('alt', options.alt || image.alt);
	}

	classes = (options.class || options.className || '');

	element.setAttribute('class', classes);

	if (options.attributes) {
		Hawkejs.setAttributes(element, options.attributes);
	}

	return element;
});

/**
 * Output a figure element
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.4.1
 *
 * @param    {String}   image
 * @parma    {Object}   options
 *
 * @return   {String}
 */
Media.setMethod(function figure(image, options) {

	var classes,
	    cssSet,
	    style,
	    ratio,
	    data,
	    html;

	if (!options) {
		options = {};
	}

	if (options.defaultStyle) {
		style = 'background-size:cover;background-position:center;';
	} else {
		style = '';
	}

	options = Object.assign({}, options);

	if (options.dimension_style !== false) {
		if (typeof options.width == 'number' || Number(options.width) == options.width) {
			style += 'width: ' + options.width + 'px;';
		}

		if (typeof options.height == 'number' || Number(options.height) == options.height) {
			style += 'height: ' + options.height + 'px;';
		}
	}

	if (options.rWidth && options.rHeight && !options.height) {
		ratio = ((options.rHeight / options.rWidth)*100).toPrecision(5);
		style += 'padding-bottom: ' + ratio + '%;';

		options.height = options.rHeight;
		options.width = options.rWidth;
	}

	if (options.profile) {
		options.width = null;
		options.height = null;
	}

	cssSet = this.imageCssSet(image, options);

	classes = (options.class || options.className || '');

	if (options.lazy) {
		classes += ' js-he-lazy';
		data = cssSet;
	} else {
		style += cssSet;
	}

	html = '<figure class="' + classes + '" ';

	if (data) {
		html += 'data-lazy="' + data + '" ';
	}

	html += 'style="' + style + '"';
	html += '></figure>';

	return html;
});

/**
 * Serve a placeholder image

 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.2.0
 *
 * @param    {Object}    options
 */
Media.setMethod(function placeholder(options) {

	var query = '?a',
	    html;

	options = Object.assign({}, options);

	if (options.profile) {
		query += '&profile=' + options.profile;
	} else {
		if (options.width) {
			query += '&width=' + options.width;
		}

		if (options.height) {
			query += '&height=' + options.height;
		}
	}

	if (options.text) {
		query += '&text=' + encodeURIComponent(options.text);
	}

	html = '<img src="/media/placeholder' + query + '" srcset="';
	html += '/media/placeholder' + query + '&dpr=2 2x"';

	if (options['class']) {
		html += ' class="' + options['class'] + '"';
	}

	html += '>';

	return html;
});

/**
 * Test image
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.4.1
 * @version  0.4.1
 *
 * @param    {Object}    options
 */
Media.setMethod(function testImage(image) {

	var that = this,
	    placeholder;

	var start = Date.now();

	placeholder = Blast.Classes.Hawkejs.Helper.Helper.prototype.placeholder.call(this, function imageResolver(callback) {

		var html;

		console.log('Getting resource with path', image);

		that.view.helpers.Alchemy.getResource({name: 'MediaFile#info', params: {path: image}}, function gotResult(err, info) {

			console.log('Result;', err, info);

			callback(null, '<b>Hi: ' + (Date.now()-start) + '</b>');
		});
	});

	var alimage = this.view.createElement('al-image');
	alimage.setAttribute('src', image);

	this.print(alimage);

	return placeholder;
});