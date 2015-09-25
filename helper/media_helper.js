module.exports = function HawkejsMedia(Hawkejs, Blast) {

	var Media = Hawkejs.Helper.extend(function MediaHelper(view) {
		Hawkejs.Helper.call(this, view);
	});

	/**
	 * Function to execute on the client side, when the scene is made
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    1.0.0
	 * @version  1.0.0
	 *
	 * @param    {Scene}   scene
	 */
	Media.setStatic(function onScene(scene) {

		// Get the screen size of this client, so we can send them correct pictures
		scene.cookie('mediaResolution', {
			width: Math.max(320, screen.availWidth||0, window.outerWidth||0),
			height: Math.max(240, screen.availHeight||0, window.outerHeight||0)
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
	});

	/**
	 * Get the base url for a single image
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    1.0.0
	 * @version  1.0.0
	 *
	 * @param    {String}   image_id
	 *
	 * @return   {URL}
	 */
	Media.setMethod(function imageUrl(image_id, options) {

		var routeName,
		    url;

		if (!options) {
			options = {};
		}

		if (String(image_id).isObjectId()) {

			if (options.route) {
				routeName = options.route;
			} else {
				routeName = 'Media::image';
			}

			url = this.parseURL(this.view.helpers.Router.routeUrl(routeName, {id: image_id}));
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

		return url;
	});

	/**
	 * Create a base placeholder image url
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    1.0.0
	 * @version  1.0.0
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
		}

		return url;
	});

	/**
	 * Get an array of srcset image urls
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    1.0.0
	 * @version  1.0.0
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
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    1.0.0
	 * @version  1.0.0
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
	 * Output a figure element
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    1.0.0
	 * @version  1.0.0
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
		    data;

		if (!options) {
			options = {};
		}

		if (options.defaultStyle) {
			style = 'background-size:cover;background-position:center;';
		} else {
			style = '';
		}

		options = Object.assign({}, options);

		if (typeof options.width == 'number') {
			style += 'width: ' + options.width + 'px;';
		}

		if (typeof options.height == 'number') {
			style += 'height: ' + options.height + 'px;';
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

		this.print('<figure class="' + classes + '" ');

		if (data) {
			this.print('data-lazy="' + data + '" ');
		}

		this.print('style="' + style + '"');
		this.print('></figure>');
	});

	/**
	 * Serve a placeholder image

	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  1.0.0
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
};