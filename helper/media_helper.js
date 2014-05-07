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

	/**
	 * Serve a placeholder image

	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @param    {Object}    options
	 */
	media.placeholder = function placeholder(options) {

		var query = '?a',
		    html;

		options = options || {};

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

		this.echo(html);
	};
};