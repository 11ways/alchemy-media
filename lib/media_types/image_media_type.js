var exiv2 = alchemy.use('exiv2'),
    child = alchemy.use('child_process'),
    async = alchemy.use('async'),
    Faced = alchemy.use('faced'),
    face  = new Faced();

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

	var exivPath = alchemy.plugins.media.exiv2,
	    hashType  = alchemy.plugins.media.hash;

	this.typeMap = {
		images: {
			regex: /^image\//,
			score: 2
		}
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
			that.getMetadata(filePath, baseInfo, info, extra, function(err, normalizedPath, useBase, info, extra) {

				if (err) {
					return callback(err);
				}

				pr('Use normalized path: ' + normalizedPath, true);
				pr(useBase)

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
					    item,
					    name;

					for (name in features) {

						// We only use the first result
						item = features[name][0];

						if (item) {
							entry[name] = {
								x: ~~(entry.x * ratio),
								y: ~~(item.y * ratio),
								width: ~~(item.width * ratio),
								height: ~~(item.height * ratio)
							};
						}
					}

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

		// Run exiv on the given file
		child.execFile(exivPath, [filePath], function afterStrip(err, out) {

			if (err) {
				return callback(err);
			}

			var output = String(out),
			    lines  = output.split('\n'),
			    data   = {},
			    info   = {},
			    extra  = {},
			    size;

			lines.filter(function(line, index) {

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
