var exiv2    = alchemy.use('@11ways/exiv2'),
    child    = alchemy.use('child_process'),
    gm       = alchemy.use('gm'),
    profiles = alchemy.shared('Media.profiles'),
    fs       = alchemy.use('fs'),
    libpath  = require('path'),
    cache    = {};

/**
 * The Image Media Type class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.2.0
 *
 * @param    {Object}   options
 */
const ImageMedia = Function.inherits('Alchemy.MediaType', 'ImageMediaType');

ImageMedia.setProperty('exivPath', alchemy.plugins.media.exiv2);
ImageMedia.setProperty('hashType', alchemy.plugins.media.hash);
ImageMedia.setProperty('veronica', alchemy.plugins.media.veronica);

ImageMedia.setProperty('typeMap', {
	images: {
		regex: /^image\//,
		score: 2
	}
});

/**
 * Generate a thumbnail of this type
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.0.1
 * @version  0.7.3
 *
 * @param    {Conduit}   conduit
 * @param    {Object}    record
 */
ImageMedia.setMethod(function thumbnail(conduit, record) {

	const path = record?.path;

	if (!path) {
		return conduit.notFound('Image could not be found');
	}

	let mimetype = record?.MediaRaw?.mimetype;

	if (typeof mimetype == 'string' && mimetype.startsWith('image/svg')) {
		return conduit.serveFile(path, {
			mimetype    : 'image/svg+xml',
			disposition : false
		});
	}

	let dimension = 100 * this.getDpr(conduit);
	let options   = {};

	// Set the square dimensions
	options.width = dimension;
	options.height = dimension;

	// @todo: make it possible to disable webp
	if (this.supportsWebp(conduit)) {
		options.type = 'webp';
	}

	this.veronica.getResizedImage(record.path, options, function gotResizedImage(err, resizedPath) {

		// @todo: serve an error image
		if (err) {
			return conduit.error(err);
		}

		conduit.serveFile(resizedPath, {disposition: false});
	});
});

/**
 * Get the wanted image dimension
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.3
 * @version  0.7.3
 *
 * @param    {Conduit}   conduit
 *
 * @return   {Object}
 */
ImageMedia.setMethod(function getResizeDimension(conduit) {

	const query = conduit.url.query;

	if (!query.width && !query.height) {
		return;
	}

	let resolution = conduit.cookie('mediaResolution') || {},
	    dpr = this.getDpr(conduit);

	let width = getResizedDimension(query, 'width', resolution, dpr),
	    height = getResizedDimension(query, 'height', resolution, dpr);
	
	return {
		width,
		height
	};
});

/**
 * Get the wanted image dimension
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.3
 * @version  0.7.3
 *
 * @param    {Conduit}   conduit
 * @param    {String}    type         'width' or 'height'
 * @param    {Object}    resolution
 * @param    {Number}    dpr
 *
 * @return   {Object}
 */
function getResizedDimension(query, type, resolution, dpr) {

	if (type !== 'width' && type !== 'height') {
		throw new Error('Invalid dimension type: ' + type);
	}

	let size_query = query[type];

	if (!size_query) {
		return;
	}

	let size_string = String(size_query);
	let size = parseInt(size_string);

	if (!size) {
		if (type == 'width') {
			size = 1920;
		} else {
			size = 1080;
		}

		size_string = ''+size;
	}

	if (size_string.includes('%') || size_string.includes('vw') || size_string.includes('vh')) {
		let base_size = Number(resolution[type]) || query['max' + type.capitalize()],
		    percentage = size;

		if (!base_size) {
			if (type == 'width') {
				base_size = 1920;
			} else {
				base_size = 1080;
			}
		}


		size = (base_size * percentage) / 100;
	}

	size *= dpr;

	// Round to the nearest 100
	size = Math.ceil(size / 100) * 100;

	if (!size) {
		size = 100;
	}

	if (type == 'width') {
		if (size > 3840) {
			size = 3840;
		}
	} else if (type == 'height') {
		if (size > 2160) {
			size = 2160;
		}
	}

	return size;
};

/**
 * Serve this file
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.0.1
 * @version  0.7.3
 *
 * @param    {Conduit}   conduit
 * @param    {Object}    record
 */
ImageMedia.setMethod(function serve(conduit, record, options) {

	const that = this;

	if (!record) {
		return onError('Empty file record', 404);
	}

	let mimetype = record?.MediaRaw?.mimetype;

	if (typeof mimetype == 'string' && mimetype.startsWith('image/svg')) {
		return conduit.serveFile(record.path, {
			mimetype    : 'image/svg+xml',
			disposition : false
		});
	}

	let query = conduit.url.query,
	    dpr = this.getDpr(conduit),
	    path,
	    width,
	    height,
	    baseWidth,
	    resolution,
	    baseHeight,
	    resizeOptions;

	if (!options) {
		options = {};
	}

	function onError(message, status) {

		if (!status) {
			status = 404;
		}

		if (message instanceof Error) {
			message = message.code;
		}

		that.placeholder(conduit, {text: message, status: status});
	};

	if (record == null) {
		return onError('No image requested', 404);
	}

	if (record.MediaFile) {
		path = record.path;
	} else if (record && record.path) {
		path = record.path;
	} else {
		path = record;
	}

	if (!path) {
		return onError('Record has no file set', 500);
	}

	if (typeof path != 'string') {
		return onError('Could not find path to file', 500);
	}

	// @todo: implement way to only allow profiles
	if (query.profile) {

		if (profiles[query.profile]) {
			resizeOptions = JSON.clone(profiles[query.profile]);
		}

		// Make sure the resizeOptions are an object
		if (!resizeOptions || typeof resizeOptions != 'object') {
			resizeOptions = {};
		}
	}

	if (query.width || query.height) {

		resizeOptions = this.getResizeDimension(conduit);

		if (query.quality) {
			if (query.quality > 0 && query.quality < 100) {
				resizeOptions.quality = query.quality;
			}
		}

		if (query.maxWidth) {
			resizeOptions.maxWidth = query.maxWidth * dpr;
		}

		if (query.maxHeight) {
			resizeOptions.maxHeight = query.maxHeight * dpr;
		}
	}

	// Force conversion to webp?
	if (!options.download && !resizeOptions && this.supportsWebp(conduit) && !path.endsWith('.svg')) {
		resizeOptions = {
			type: 'webp'
		};
	}

	if (resizeOptions) {

		if (this.supportsWebp(conduit) && alchemy.plugins.media.cwebp) {
			resizeOptions.type = 'webp';
		}

		this.veronica.getResizedImage(path, resizeOptions, function gotResizedPath(err, resizedPath) {

			var mimetype;

			// @todo: serve an error image
			if (err) {
				return conduit.error(err);
			}

			// Add a mimetype hint in case it isn't found for webp images
			if (resizeOptions.type == 'webp') {
				mimetype = 'image/webp';
			}

			conduit.serveFile(resizedPath, {
				mimetype      : mimetype,
				onError       : onError,
				disposition   : 'inline',
				original_path : path
			});
		});
	} else {
		let serve_options = {
			onError     : onError,
		};

		if (options.inline !== false) {
			serve_options.disposition = 'inline';
		}

		// If a mimetype is available, use it!
		if (record && record.MediaRaw && record.MediaRaw.mimetype) {
			serve_options.mimetype = record.MediaRaw.mimetype;
		}

		if (record && record.filename) {
			serve_options.filename = record.filename;
		}

		conduit.serveFile(path, serve_options);
	}
});

/**
 * Generate a placeholder
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.7.3
 *
 * @param    {Conduit}   conduit
 * @param    {Object}    options
 */
ImageMedia.setMethod(function placeholder(conduit, options) {

	let default_options,
	    profile,
	    query = conduit.url.query;

	if (options == null) {
		options = {};
	}

	default_options = {
		width: 300,
		height: 300
	};

	if (query.profile && profiles[query.profile]) {

		profile = profiles[query.profile];

		// If only 1 dimension is provided, use it for both settings
		options.width = profile.width || profile.height;
		options.height = profile.height || profile.width;
	}

	if (query.width || query.height) {
		let resize_options = this.getResizeDimension(conduit);

		if (resize_options.width) {
			options.width = resize_options.width;
		}

		if (resize_options.height) {
			options.height = resize_options.height;
		}
	}

	if (!options.text) {
		options.text = conduit.param('text');
	}

	options = Object.assign({}, default_options, options);

	this.veronica.placeholder(options, function gotPlaceholderPath(err, filepath) {
		conduit.serveFile(filepath, {disposition: false});
	});
});

ImageMedia.setMethod(function getSize(conduit, filePath, options, callback) {

	var tempName = filePath,
	    resizeOptions = '',
	    tempPath;

	if (!options.type) {
		options.type = 'webp';
	}

	if (options.width) {
		tempName += '-w' + options.width;
	}

	if (options.height) {
		tempName += '-h' + options.height;

		resizeOptions += '-resize ' + options.width + ' ' + options.height;
	}

	tempName += '-' + options.type;

	// If an entry in the cache exists, return that path
	if (cache[tempName]) {
		return callback(null, cache[tempName]);
	}

	tempPath = PATH_TEMP + '/' + alchemy.ObjectId() + '.webp';

	if (!alchemy.plugins.media.cwebp) {
		return callback(new Error('Unable to get size: cwebp not found'));
	}

	child.exec(alchemy.plugins.media.cwebp + ' ' + [resizeOptions, '-q 80', filePath, '-o', tempPath].join(' '), function(err, out) {

		if (err) {
			return callback(err);
		}

		cache[tempName] = tempPath;
		callback(null, tempPath);
	});
});

/**
 * Some identical files can produce different hashes because of
 * embedded meta-data.
 * This method should strip out the meta data,
 * so it can be stored inside MediaFile instead of MediaRaw
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.0.1
 * @version  0.7.3
 */
ImageMedia.setMethod(function normalize(filePath, baseInfo, callback) {

	const that = this;

	let mimetype = baseInfo?.mimetype;

	if (typeof mimetype == 'string' && mimetype.startsWith('image/svg')) {
		return callback(null, filePath);
	}

	this.getImageInfo(filePath, function gotFileInfo(err, info, extra) {

		if (err) {
			return callback(err);
		}
		
		that.getMetadata(filePath, baseInfo, info, extra, function(err, rawPath, rawInfo, rawExtra, extra) {

			if (err) {
				return callback(err);
			}

			callback(null, rawPath, rawInfo, rawExtra, extra);
		});
	});
});

/**
 * Get all the metadata for this image
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.2.0
 */
ImageMedia.setMethod(function getMetadata(filePath, base, info, extra, callback) {

	// Create a temporary filename
	var tempFile = '/tmp/' + String(alchemy.ObjectId()) + ~~(Math.random()*1000) + '.temp',
	    tasks    = {},
	    result   = {},
	    that     = this;

	// Extract the metadata out of the given image
	if (exiv2 && this.options.extractMeta !== false) {
		tasks.meta = function getMetaData(next) {
			exiv2.getImageTags(filePath, function(err, meta) {

				var metaData = {},
				    val,
				    key;

				for (key in meta) {

					// Skip strings that are way too big (data dumps & maker notes)
					if (typeof meta[key] == 'string' && meta[key].length > 1000) {
						continue;
					}

					// See if it can be cast to a string
					val = Number(meta[key]);

					// If the results do not match, use the regular value
					if (val != meta[key]) {
						val = meta[key];
					}

					Object.setPath(metaData, key, val);
				}

				// We have no need for the thumbnail data
				delete metaData.Thumbnail;

				result.meta = metaData;

				next(err);
			});
		};
	} else if (!exiv2) {
		//log.warn('Could not load exiv2');
	}

	// Make a copy of the file and strip out all the metadata
	tasks.stripped = function stripData(next) {
		// Make a copy of the file, because we'll be stripping the exiv2 data
		alchemy.copyFile(filePath, tempFile, function madeTempFile(err) {

			if (err) {
				return next(err);
			}

			// If it's a GIF, don't strip anything
			if (filePath.endsWith('.gif')) {
				return getInfo();
			}

			child.execFile(that.exivPath, ['rm', tempFile], function afterStrip(err) {

				if (err) {
					log.error('Error stripping metadata ', {err: err});
				}

				getInfo();
			});

			// Get the file information from the stripped file
			function getInfo() {
				alchemy.getFileInfo(tempFile, {hash: that.hashType}, function gotInfo(err, stripped_info) {

					if (err) {
						log.error('Error getting file info from the temp file', {err: err});
					}

					next(null, stripped_info);
				});
			}
		});
	};

	Function.parallel(tasks, function(err, task_result) {

		if (err) {
			return callback(err);
		}

		extra.meta = result.meta;

		callback(null, tempFile, task_result.stripped, info, extra);
	});
});

/**
 * Resize an image using imagemagick's convert
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.4.2
 */
ImageMedia.setMethod(function resize(source, target, width, height, callback) {

	var convertBin = alchemy.plugins.media.convert;

	child.execFile(convertBin, [source, '-resize', width + 'x' + height, target], function(err) {
		callback(err);
	});
});

/**
 * Get basic image info using exiv2
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.2.0
 *
 * @param    {String}   filePath   The path of the file to inspect
 * @param    {Function} callback
 */
ImageMedia.setMethod(function getImageInfo(filePath, callback) {

	// Run exiv on the given file
	child.execFile(this.exivPath, ['-pt', filePath], function afterStrip(err, out) {

		var output,
		    lines,
		    data   = {},
		    info   = {},
		    extra  = {},
		    size;

		// See what type of error was made
		if (err) {

			// No exif information found
			if (err.code == 253) {

				gm(filePath).size(function gotGmResponse(err, size) {

					if (err) {
						if (err.message && err.message.indexOf('spawn ENOENT')) {
							callback(new Error('Graphicsmagick needs to be installed!'));
						} else {
							callback(err);
						}
						return;
					}

					info.width = size.width;
					info.height = size.height;

					extra.width = size.width;
					extra.height = size.height;

					callback(null, info, extra);
				});

				return;
			}

			// Code 255 = file not found
			if (err.code == 255) {
				return callback(err);
			} else {
				return callback(err);
			}
		}

		output = String(out);
		lines = output.split('\n');

		lines.forEach(function(line, index) {

			var pieces = line.split(/ +/g),
			    name,
			    type,
			    val,
			    nr,
			    x;

			if (pieces.length > 1) {

				// First piece is the name
				name = pieces.shift();

				// Second piece is the type
				type = pieces.shift();

				// Something type-related info
				x = pieces.shift();

				// Last pieces are the value
				val = pieces.join(' ').trim();

				// See if it's a number
				nr = Number(val);

				if (String(nr) === val) {
					val = nr;
				}

				Object.setPath(data, name, val);
			}
		});

		data = data.Exif || {};

		if(!data.Photo) {
			data.Photo = {};
		}

		// Extract the image size
		info.width = Number(data.Photo.PixelXDimension);
		info.height = Number(data.Photo.PixelYDimension);

		extra.width = info.width;
		extra.height = info.height;

		extra.exiv_info = data;

		callback(null, info, extra);
	});
});