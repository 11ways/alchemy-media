module.exports = function HawkejsMedia(Hawkejs, Blast) {

	var URL,
	    Media = Hawkejs.Helper.extend(function MediaHelper(view) {
		Hawkejs.Helper.call(this, view);
	});

	URL = Blast.Classes.URL;

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

		var url;

		if (String(image_id).isObjectId()) {
			url = URL.parse(this.view.helpers.Router.routeUrl('Media::image', {id: image_id}));
		} else if (image_id) {
			url = URL.parse('/media/static/' + image_id);
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

		url = URL.parse(this.view.helpers.Router.routeUrl('Media::placeholder'));

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

		var cssSet,
		    style,
		    ratio;

		style = 'background-size: cover;';

		options = Object.assign({}, options);

		if (options.width) {
			style += 'width: ' + options.width + 'px;';
		}

		if (options.height) {
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
		style += cssSet;

		this.print('<figure class="' + (options.class || options.className || '') + '" ');
		this.print('style="' + style + '"></figure>');
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

return;
module.exports = function alchemyMediaHelpers(hawkejs) {
	
	// References
	var helpers = hawkejs.helpers,
	    media    = helpers.media = {};

	/**
	 * Create a thumbnail for any media type
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @param    {String}    file_id      The file id
	 * @param    {Object}    options      Extra options
	 */
	media.thumbnail = function thumbnail(file_id, options) {

		var html = '<img src="/media/thumbnail/' + file_id + '" ';
		html += 'srcset="/media/thumbnail/' + file_id + '?dpr=2 2x" ';

		if (options && options['class']) {
			html += 'class="' + options['class'] + '" ';
		}

		html += '>';

		this.echo(html)
	};

	/**
	 * Serve a resized image
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @param    {String}    image_id     The image id
	 * @param    {Object}    options      Extra options
	 */
	media.image = function image(image_id, options) {

		var html;

		options = options || {};

		if (image_id) {
			html = '<img src="/media/image/' + image_id;

			if (options.profile) {
				html += '?profile=' + options.profile;
			}

			html += '" srcset="/media/image/' + image_id + '?dpr=2';

			if (options.profile) {
				html += '&profile=' + options.profile;
			}

			html += ' 2x" ';

			if (options['class']) {
				html += 'class="' + options['class'] + '"';
			}

			html += '>';

			this.echo(html);
		} else {

			if (options.placeholder) {
				options.text = options.placeholder;
			} else {
				options.text = '404';
			}

			this.media.placeholder(options);
		}
	};

	
};