var fs       = alchemy.use('fs'),
    libpath  = require('path'),
    cache    = {},
    face;

/**
 * The Video Media Type class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.4.2
 * @version  0.4.2
 */
var VideoMedia = Function.inherits('Alchemy.MediaType', function VideoMediaType(options) {
	VideoMediaType.super.call(this, options);
});

VideoMedia.setProperty('typeMap', {
	images: {
		regex: /^video\//,
		score: 2
	}
});

/**
 * Serve this file
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.4.2
 * @version  0.4.2
 *
 * @param    {Conduit}   conduit
 * @param    {Object}    record
 */
VideoMedia.setMethod(function serve(conduit, record) {

	var that = this,
	    path,
	    onError;

	onError = function onError(message, status) {
		conduit.error(status, message);
	};

	if (record == null) {
		return onError('No video requested', 404);
	}

	if (record.MediaFile) {
		path = record.path;
	} else if (record && record.path) {
		path = record.path;
	} else {
		path = record;
	}

	if (!path) {
		return onError('Video record has no file set', 500);
	}

	conduit.serveFile(path);
});