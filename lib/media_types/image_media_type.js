var exiv2    = alchemy.use('exiv2'),
    child    = alchemy.use('child_process'),
    async    = alchemy.use('async'),
    Faced    = alchemy.use('faced'),
    gm       = alchemy.use('gm'),
    profiles = alchemy.shared('Media.profiles'),
    fs       = alchemy.use('fs'),
    cache    = {},
    face     = new Faced();

/**
 * The Image Media Type class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('MediaType', function ImageMediaType() {

	var exivPath  = alchemy.plugins.media.exiv2,
	    hashType  = alchemy.plugins.media.hash,
	    veronica  = alchemy.plugins.media.veronica;

	this.typeMap = {
		images: {
			regex: /^image\//,
			score: 2
		}
	};

	/**
	 * Generate a thumbnail of this type
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Render}
	 * @param    {Object}
	 */
	this.thumbnail = function thumbnail(render, record) {

		var dimension = 100 * this.getDpr(render),
		    options   = {};

		// Set the square dimensions
		options.width = dimension;
		options.height = dimension;

		// @todo: make it possible to disable webp
		if (this.supportsWebp(render)) {
			options.type = 'webp';
		}

		veronica.getResizedImage(record.MediaFile.path, options, function(err, resizedPath) {

			// @todo: serve an error image
			if (err) {
				return render.res.end(''+err);
			}

			render.serveFile(resizedPath);
		});
	};

	/**
	 * Serve this file
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.1.0
	 *
	 * @param    {renderCallback}   render
	 * @param    {Object}           record
	 */
	this.serve = function serve(render, record) {

		var query = render.req.query,
		    dpr = this.getDpr(render),
		    width,
		    height,
		    baseWidth,
		    baseHeight,
		    resizeOptions;

		// @todo: implement way to only allow profiles
		if (query.profile) {

			if (profiles[query.profile]) {
				resizeOptions = alchemy.cloneSafe(profiles[query.profile]);
			}

			// Make sure the resizeOptions are an object
			if (!resizeOptions || typeof resizeOptions != 'object') {
				resizeOptions = {};
			}

		} else if (query.width || query.height) {

			if (query.width) {
				width = parseInt(query.width) || 100;

				if (String(query.width).indexOf('%') > -1) {
					baseWidth = Number(render.req.cookies.screenWidth) || query.maxWidth || 100;
					width = (baseWidth * width)/100;
				}

				width *= dpr;
			}

			if (query.height) {
				height = parseInt(query.height) || 100;

				if (String(query.height).indexOf('%') > -1) {
					baseHeight = Number(render.req.cookies.screenHeight) || query.maxHeight || 100;
					height = (baseHeight * height)/100;
				}

				height *= dpr;
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

		if (resizeOptions) {

			// @todo: make it possible to disable webp
			if (this.supportsWebp(render)) {
				resizeOptions.type = 'webp';
			}

			veronica.getResizedImage(record.MediaFile.path, resizeOptions, function(err, resizedPath) {

				// @todo: serve an error image
				if (err) {
					return render.res.end(''+err);
				}

				render.serveFile(resizedPath);
			});
		} else {
			render.serveFile(record.MediaFile.path);
		}
	};

	/**
	 * Generate a placeholder
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @param    {renderCallback}   render
	 * @param    {Object}           options
	 */
	this.placeholder = function placeholder(render, options) {

		var defaultOptions,
		    profile,
		    query = render.req.query;

		defaultOptions = {
			width: 150,
			height: 150
		};

		if (query.profile && profiles[query.profile]) {
			
			profile = profiles[query.profile];

			// If only 1 dimension is provided, use it for both settings
			options.width = profile.width || profile.height;
			options.height = profile.height || profile.width;
		}

		options = Object.assign({}, defaultOptions, options);

		veronica.placeholder(options, function(err, filepath) {
			render.serveFile(filepath);
		});
	};

	this.getSize = function getSize(render, filePath, options, callback) {

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

		child.exec('/usr/bin/cwebp ' + [resizeOptions, '-q 80', filePath, '-o', tempPath].join(' '), function(err, out) {

			if (err) {
				return callback(err);
			}

			cache[tempName] = tempPath;
			callback(null, tempPath);
		});
	};

	/**
	 * Some identical files can produce different hashes because of
	 * embedded meta-data.
	 * This method should strip out the meta data,
	 * so it can be stored inside MediaFile instead of MediaRaw
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.normalize = function normalize(filePath, baseInfo, callback) {

		var that = this;

		this.getImageInfo(filePath, function(err, info, extra) {

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
	};

	/**
	 * Get all the metadata for this image
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.getMetadata = function getMetadata(filePath, base, info, extra, callback) {

		// Create a temporary filename
		var tempFile = '/tmp/' + String(alchemy.ObjectId()) + ~~(Math.random()*1000) + '.temp',
		    tasks    = {},
		    result   = {},
		    that     = this;

		// Extract the metadata out of the given image
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

					alchemy.objectPath(metaData, key, val);
				}

				// We have no need for the thumbnail data
				delete metaData.Thumbnail;

				result.meta = metaData;

				next(err);
			});
		};

		// Make a copy of the file and strip out all the metadata
		tasks.stripped = function stripData(next) {
			// Make a copy of the file, because we'll be stripping the exiv2 data
			alchemy.copyFile(filePath, tempFile, function madeTempFile(err) {

				if (err) {
					return next(err);
				}

				child.execFile(exivPath, ['rm', tempFile], function afterStrip(err) {

					if (err) {
						log.error('Error stripping metadata ', {err: err});
					}

					// Get the file information from the stripped file
					alchemy.getFileInfo(tempFile, {hash: hashType}, function(err, stripped_info) {

						if (err) {
							log.error('Error getting file info from the temp file', {err: err});
						}

						next(null, stripped_info);
					});
				});
			});
		};

		// Get all the faces in the image
		tasks.faces = function getFaces(next) {

			that.detectFaces(filePath, info, function(err, faces) {

				if (!err) {
					result.faces = faces;
				}

				next();
			});
		};

		async.parallel(tasks, function(err, task_result) {

			if (err) {
				return callback(err);
			}

			extra.faces = result.faces;
			extra.meta = result.meta;

			callback(null, tempFile, task_result.stripped, info, extra);
		});
	};

	/**
	 * Resize an image using imagemagick's convert
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.resize = function resize(source, target, width, height, callback) {

		var convertBin = '/usr/bin/convert';

		child.execFile(convertBin, [source, '-resize', width + 'x' + height, target], function(err) {
			callback(err);
		});
	};

	/**
	 * Detect faces inside an image
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {String}   filePath
	 * @param    {Object}   info        Object containing the width & height
	 * @param    {Function} callback
	 */
	this.detectFaces = function detectFaces(filePath, info, callback) {

		var resizeFile = '/tmp/' + String(alchemy.ObjectId()) + ~~(Math.random()*1000) + '.resize.temp',
		    maxWidth   = 1000,
		    ratio      = info.width / maxWidth;

		// Resize the file to maximum 1000 pixels wide,
		// larger files require too much resources
		this.resize(filePath, resizeFile, maxWidth, ~~((info.height/info.width)*maxWidth), function(err) {

			if (err) {
				return callback(err);
			}
			
			// Start the face detection, using the resized file
			face.detect(resizeFile, function foundFaces(found_faces, image, file) {

				var faces = [];

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
	};

	/**
	 * Get basic image info using exiv2
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {String}   filePath   The path of the file to inspect
	 * @param    {Function} callback
	 */
	this.getImageInfo = function getImageInfo(filePath, callback) {

		//filePath += 'nonexisting';

		// Run exiv on the given file
		child.execFile(exivPath, [filePath], function afterStrip(err, out) {

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

					gm(filePath).size(function(err, size) {

						if (err) {
							pr(err, true);
							return callback(err);
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

				var pieces = line.split(':'),
				    name,
				    val;

				if (pieces.length > 1) {
					name = pieces.shift().trim();
					val = pieces.join(':').trim();

					data[name] = val;
				}

			});

			// Extract the image size
			size = data['Image size'].split('x');
			info.width = Number(size[0]);
			info.height = Number(size[1]);

			extra.width = info.width;
			extra.height = info.height;

			// Remove info we already know
			delete data['File name'];
			delete data['File size'];
			delete data['MIME type'];
			delete data['Image size'];
			delete data['Thumbnail'];

			extra.exiv_info = data;

			callback(null, info, extra);
		});
	};

});
