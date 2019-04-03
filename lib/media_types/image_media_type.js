var exiv2    = alchemy.use('exiv2'),
    child    = alchemy.use('child_process'),
    Faced    = alchemy.use('faced'),
    gm       = alchemy.use('gm'),
    profiles = alchemy.shared('Media.profiles'),
    fs       = alchemy.use('fs'),
    libpath  = require('path'),
    cache    = {},
    face;

if (Faced) {
	face = new Faced();
}

/**
 * The Image Media Type class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.2.0
 */
var ImageMedia = Function.inherits('Alchemy.MediaType', function ImageMediaType(options) {
	ImageMediaType.super.call(this, options);
});

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
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.4.1
 *
 * @param    {Conduit}   conduit
 * @param    {Object}    record
 */
ImageMedia.setMethod(function thumbnail(conduit, record) {

	var dimension,
	    options;

	if (!record || !record.path) {
		return conduit.notFound('Image could not be found');
	}

	dimension = 100 * this.getDpr(conduit);
	options   = {};

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
 * Serve this file
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.4.3
 *
 * @param    {Conduit}   conduit
 * @param    {Object}    record
 */
ImageMedia.setMethod(function serve(conduit, record) {

	var that = this,
	    query = conduit.url.query,
	    dpr = this.getDpr(conduit),
	    path,
	    width,
	    height,
	    onError,
	    baseWidth,
	    resolution,
	    baseHeight,
	    resizeOptions;

	onError = function onError(message, status) {

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

		resolution = conduit.cookie('mediaResolution') || {};

		if (query.width) {
			width = parseInt(query.width) || 1920;

			if (String(query.width).indexOf('%') > -1) {
				baseWidth = Number(resolution.width) || query.maxWidth || 1920;
				width = (baseWidth * width)/100;
				width *= dpr;

				// Round to the nearest 10
				width = Math.ceil(width / 10) * 10;
			} else {
				width *= dpr;
			}
		}

		if (query.height) {
			height = parseInt(query.height) || 1080;

			if (String(query.height).indexOf('%') > -1) {
				baseHeight = Number(resolution.height) || query.maxHeight || 1080;
				height = (baseHeight * height)/100;
				height *= dpr;

				// Round to the nearest 10
				height = Math.ceil(height / 10) * 10;
			} else {
				height *= dpr;
			}
		}

		resizeOptions = {
			width: width,
			height: height
		};

		if (query.maxWidth) {
			resizeOptions.maxWidth = query.maxWidth * dpr;
		}

		if (query.maxHeight) {
			resizeOptions.maxHeight = query.maxHeight * dpr;
		}
	}

	// Force conversion to webp? (Makes pngs bigger sometimes!)
	// if (!resizeOptions && this.supportsWebp(conduit)) {
	// 	resizeOptions = {type: 'webp'};
	// }

	if (resizeOptions) {

		// @todo: make it possible to disable webp
		if (this.supportsWebp(conduit)) {
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
			disposition : 'inline'
		};

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
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.4.0
 *
 * @param    {Conduit}   conduit
 * @param    {Object}    options
 */
ImageMedia.setMethod(function placeholder(conduit, options) {

	var defaultOptions,
	    resolution = conduit.cookie('mediaResolution') || {},
	    baseHeight,
	    baseWidth,
	    profile,
	    height,
	    width,
	    query = conduit.url.query,
	    dpr = this.getDpr(conduit);

	if (options == null) {
		options = {};
	}

	defaultOptions = {
		width: 300,
		height: 300
	};

	if (query.profile && profiles[query.profile]) {

		profile = profiles[query.profile];

		// If only 1 dimension is provided, use it for both settings
		options.width = profile.width || profile.height;
		options.height = profile.height || profile.width;
	}

	if (query.width) {
		width = parseInt(query.width) || 1920;

		// See if the given width is a percentage
		if (String(query.width).indexOf('%') > -1) {
			baseWidth = Number(resolution.width) || query.maxWidth || 1920;
			width = (baseWidth * width)/100;
			width *= dpr;

			// Round to the nearest 10
			width = Math.ceil(width / 10) * 10;
		} else {
			width *= dpr;
		}

		options.width = width;
	}

	if (query.height) {
		height = parseInt(query.height) || 1080;

		// See if the given width is a percentage
		if (String(query.height).indexOf('%') > -1) {
			baseHeight = Number(resolution.height) || query.maxHeight || 1080;
			height = (baseHeight * height)/100;
			height *= dpr;

			// Round to the nearest 10
			height = Math.ceil(height / 10) * 10;
		} else {
			height *= dpr;
		}

		options.height = height;
	}

	if (!options.text) {
		options.text = conduit.param('text');
	}

	options = Object.assign({}, defaultOptions, options);

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
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.2.0
 */
ImageMedia.setMethod(function normalize(filePath, baseInfo, callback) {

	var that = this;

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

	// Get all the faces in the image
	// @todo: make this optional, as it's very cpu intensive
	if (face && this.options.detectFaces !== false) {
		tasks.faces = function getFaces(next) {

			that.detectFaces(filePath, info, function(err, faces) {

				if (!err) {
					result.faces = faces;
				}

				next();
			});
		};
	}

	Function.parallel(tasks, function(err, task_result) {

		if (err) {
			return callback(err);
		}

		extra.faces = result.faces;
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
 * Detect faces inside an image
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.2.0
 *
 * @param    {String}   filePath
 * @param    {Object}   info        Object containing the width & height
 * @param    {Function} callback
 */
ImageMedia.setMethod(function detectFaces(filePath, info, callback) {

	var resizeFile,
	    maxWidth,
	    ratio;

	if (this.options.facesMaxWidth) {
		maxWidth = this.options.facesMaxWidth;
	} else {
		maxWidth = 500;
	}

	ratio = info.width / maxWidth;
	resizeFile = '/tmp/' + String(alchemy.ObjectId()) + ~~(Math.random()*1000) + '.resize.temp';

	// Resize the file to maximum 500 pixels wide,
	// larger files require too much resources
	this.resize(filePath, resizeFile, maxWidth, ~~((info.height/info.width)*maxWidth), function(err) {

		if (err) {
			return callback(err);
		}

		// Start the face detection, using the resized file
		face.detect(resizeFile, function foundFaces(found_faces, image, file) {

			var faces = [];

			if (!found_faces) {
				return callback(null, faces);
			}

			// Iterate over all the found faces
			found_faces.filter(function(face, index) {

				var features = face.getFeatures(),
				    entry    = {},
				    main     = {},
				    item,
				    name,
				    x,
				    y,
				    w,
				    h;

				for (name in features) {

					// We only use the first result
					item = features[name][0];

					if (item) {

						x = ~~(item.x * ratio);
						y = ~~(item.y * ratio);
						w = ~~(item.width * ratio);
						h = ~~(item.height * ratio);

						entry[name] = {
							sx: x,
							sy: y,
							dx: x+w,
							dy: y+h
						};

						if (main.sx === undefined) {
							main.sx = x;
							main.sy = y;
							main.dx = x+w;
							main.dy = y+h;
						} else {
							if (x < main.sx) {
								main.sx = x;
							}

							if (x+w > main.dx) {
								main.dx = x+w;
							}

							if (y < main.sy) {
								main.sy = y;
							}

							if (y+h > main.dy) {
								main.dy = y+h;
							}
						}
					}
				}

				// Set the main face coordinates
				entry.main = main;

				faces.push(entry);
			});

			// Remove the temporary file
			fs.unlink(resizeFile, function() {});

			// Callback with the faces
			callback(null, faces);
		});
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