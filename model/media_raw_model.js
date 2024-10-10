var fs     = alchemy.use('fs'),
    Url    = alchemy.use('url'),
    path   = alchemy.use('path'),
    http   = alchemy.use('http'),
    crypto = alchemy.use('crypto');

/**
 * Media Raw Model
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.3.0
 */
var MediaRaw = Function.inherits('Alchemy.Model', function MediaRaw(options) {
	MediaRaw.super.call(this, options);
	this.MediaType = Classes.Alchemy.MediaType;
});

/**
 * Constitute the class wide schema
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.2.0
 * @version  0.4.0
 */
MediaRaw.constitute(function addFields() {

	this.addField('name', 'String');
	this.addField('extension', 'String');

	// Remember the origin of the file (url or path)
	this.addField('origin', 'String');

	// Hash & size should be one unique index together
	this.addField('hash', 'String');
	this.addField('size', 'Number');
	this.addField('mimetype', 'String');
	this.addField('type', 'String');
	this.addField('extra', 'Object');
});

MediaRaw.setProperty('types', alchemy.getClassGroup('media_type'));

/**
 * Get the hash algorithm
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 *
 * @type     {string}
 */
MediaRaw.setProperty(function hashType() {
	return alchemy.settings.plugins.media.file_hash_algorithm;
});

/**
 * Get the base path
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 *
 * @type     {string}
 */
MediaRaw.setProperty(function basePath() {
	return alchemy.settings.plugins.media.file_storage_path;
});

/**
 * Path to this file
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.4.1
 * @version  0.4.1
 *
 * @type    {String}
 */
MediaRaw.Document.setFieldGetter(function path() {
	return this.$model.getPathFromId(this._id);
});

/**
 * Export the actual file
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.4.1
 * @version  0.4.1
 *
 * @type     {Stream}   output
 *
 * @return   {Pledge}
 */
MediaRaw.Document.setMethod(function extraExportToStream(output) {

	var that = this,
	    path = this.path,
	    stats;

	if (!path) {
		return Pledge.resolve();
	}

	return Function.series(function getStats(next) {
		fs.stat(path, function checked(err, result) {

			if (err) {
				return next();
			}

			stats = result;

			next();
		});
	}, function streamFile(next) {

		if (!stats) {
			return next();
		}

		let hbuf = Buffer.allocUnsafe(5);

		// 0xFF indicates an extra export
		hbuf.writeUInt8(0xFF, 0);

		// Now say how long it is
		hbuf.writeUInt32BE(stats.size, 1);

		// Write the header to the stream
		output.write(hbuf);

		// Create a read stream to the file
		let read_stream = fs.createReadStream(path);

		// Listen for the data
		read_stream.on('data', function onData(data) {
			output.write(data);
		});

		// Listen for the stream end
		read_stream.on('end', next);

	}, function done(err) {

	});
});

/**
 * Import the actual file
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.4.1
 * @version  0.4.1
 *
 * @type     {Stream}   input
 *
 * @return   {Pledge}
 */
MediaRaw.Document.setMethod(function extraImportFromStream(input) {

	var that = this,
	    file_path = this.path,
	    pledge = new Pledge(),
	    stream;

	input.pause();

	alchemy.createDir(path.dirname(file_path), function done(err) {

		if (err) {
			return pledge.reject(err);
		}

		input.resume();

		stream = fs.createWriteStream(file_path);

		input.pipe(stream);

		input.on('finish', function onEnd() {
			pledge.resolve();
		});
	});

	return pledge;
});

/**
 * Add a file
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.9.0
 *
 * @param    {String}   file      The path to the file, can be a URL
 * @param    {Object}   options
 * @param    {Function} callback
 */
MediaRaw.setMethod(function addFile(file, options, callback) {

	var that = this,
	    removeOriginal,
	    MediaFile;

	if (typeof options == 'function') {
		callback = options;
		options = {};
	}

	if (!options) {
		options = {};
	}

	if (file && typeof file == 'object' && file instanceof Classes.Alchemy.Inode.File) {
		file = file.path;
	}

	let is_url = file.startsWith('http://') || file.startsWith('https://'),
	    is_data_uri = !is_url && file.startsWith('data:');

	// If the given file is actually a url, we'll need to download it first
	if (is_url || is_data_uri) {

		// Set the url as the origin
		options.origin = file;

		// Don't keep the original, temporary file
		options.move = true;

		alchemy.downloadFile(file, options, function downloadedFile(err, tempfile, filename) {

			if (err) {
				return callback(err);
			}

			if (!is_data_uri) {
				if (!options.filename) {
					options.filename = filename;
				}

				if (!options.filename) {
					options.filename = Url.parse(file).pathname.split('/').last();
				}

				if (!options.name) {
					options.name = options.filename.beforeLast('.') || options.filename;
				}
			}

			that.addFile(tempfile, options, callback);
		});

		return;
	};

	removeOriginal = false;
	MediaFile = this.getModel('MediaFile');

	if (typeof options.move == 'undefined') {
		options.move = false;
	}

	if (options.move) {
		removeOriginal = true;
	}

	alchemy.getFileInfo(file, {hash: this.hashType}, function gotFileInfo(err, info) {

		if (err) {
			return callback(err);
		}

		let type = that.MediaType.determineType(info.mimetype, options);

		type.normalize(file, info, function afterNormalize(err, rawPath, rawInfo, rawExtra, extra) {

			if (err) {
				return callback(err);
			}

			options.rawExtra = rawExtra;
			options.move = true;
			options.name = options.name || info.name;
			options.extension = info.extension;

			// Store the raw file in the database & filesystem
			that.storeFile(rawPath, options, function afterRawStore(err, id, item, createdNew) {

				if (err) {
					return callback(err);
				}

				var FileData = {
					MediaFile: {
						media_raw_id   : item._id,
						name           : options.name || info.name,
						filename       : options.filename || info.filename,
						extra          : extra,
						type           : type.typeName
					}
				};

				if (createdNew || (!createdNew && !options.reusefile)) {

					MediaFile.save(FileData, {document: false}, function savedNewRecord(err, result) {
						if (err) return callback(err);
						callback(null, result[0]);
					});
				} else {

					MediaFile.find('first', {conditions: {media_raw_id: item._id}, recursive: 0, document: false}, function foundRecord(err, items) {

						if (err) {
							return callback(err);
						}

						items = items[0];

						if (items && items.MediaFile) {
							callback(null, items.MediaFile)
						} else {
							MediaFile.save(FileData, {document: false}, function(err, result) {
								if (err) return callback(err);
								callback(null, result[0]);
							});
						}
					});
				}
			});
		});
	});
});

/**
 * Get a file based on its raw id
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.2.0
 *
 * @param    {String|ObjectID}   id
 * @param    {Function}          callback
 */
MediaRaw.setMethod(function getFile(id, callback) {

	var that = this,
	    options = {
		conditions: {
			'_id': id
		},
		document: false
	};

	this.find('first', options, function gotFileRecord(err, result) {

		var item;

		if (err) {
			return callback(err);
		}

		if (!result.length) {
			return callback(new Error('No image found'));
		}


		item = result.MediaRaw;

		item.path = that.getPathFromId(item._id);

		callback(null, item);
	});
});

/**
 * Store the given raw file in our own folder structure and database,
 * this makes sure there are no duplicates
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.4.2
 *
 * @param    {String}   file      The path to the file
 * @param    {Object}   options   Optional options
 * @param    {Function} callback  The callback that gets the id & item
 */
MediaRaw.setMethod(function storeFile(file, options, callback) {

	var that = this,
	    transferType;

	if (typeof options == 'function') {
		callback = options;
		options = {};
	}

	if (!file) {
		return callback(new Error('Unable to store file: given path string is empty'));
	}

	if (typeof options.move == 'undefined') {
		options.move = false;
	}

	if (options.move) {
		transferType = 'moveFile';
	} else {
		transferType = 'copyFile';
	}

	prepareId.call(this, file, options, function gotDatabaseInfo(err, alreadyCopied, id, item) {

		var targetPath;

		if (err) {
			return callback(err);
		}

		targetPath = that.getPathFromId(id);
		item.path = targetPath;

		if (alreadyCopied) {
			callback(null, id, item, false);

			// If we wanted to move this file, remove the original
			if (options.move) {
				fs.unlink(file, function afterUnlink(){});
			}

		} else if (targetPath) {
			alchemy[transferType](file, targetPath, function afterTransfer(err) {
				if (err) {
					callback(err);
				} else {
					item.path = targetPath;
					callback(null, id, item, true);
				}
			});
		} else {
			return callback(new Error('Could not copy file to undefined target'));
		}

	});
});

/**
 * Look up some information on the given file, store it in the
 * database if it is not there yet, and return the id and info.
 *
 * This does NOT copy the file to our own folder structure!
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.4.2
 */
var prepareId = function prepareId(file, options, callback) {

	var that = this,
	    data;

	if (!file) {
		return callback(new Error('Unable to prepare file ID: given path is empty'));
	}

	alchemy.getFileInfo(file, {hash: this.hashType}, function gotFileInfo(err, info) {

		if (err) {
			return callback(err);
		}

		// See if this file already exists,
		// based on the hash and the file size
		var search_options = {
			conditions: {
				hash: info.hash,
				size: info.size
			},
			document: false
		};

		that.find('first', search_options, function gotFindResult(err, result) {

			if (err) {
				return callback(err);
			}

			result = result[0];

			// Return the existing id if we found a match
			if (result) {
				callback(null, true, result.MediaRaw._id, result.MediaRaw);
			} else {

				// If not: save the data to the database
				data = {
					MediaRaw: {
						name      : options.name || info.name,
						extension : options.extension || info.extension,
						mimetype  : info.mimetype,
						hash      : info.hash,
						size      : info.size,
						extra     : options.rawExtra
					}
				};

				if (options.origin) {
					data.MediaRaw.origin = options.origin;
				}

				that.save(data, {document: false}, function getSaveResult(err, result) {

					if (err) {
						return callback(err);
					}

					result = result[0];

					if (result) {
						callback(null, false, result._id, result);
					}
				});
			}
		});
	});
};

/**
 * Construct the filepath of the given ObjectId
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.2.0
 *
 * @param    {ObjectID|String}   objectId
 *
 * @return   {String}            The (expected) path to the file
 */
MediaRaw.setMethod(function getPathFromId(objectId) {

	var filePath,
	    month,
	    year,
	    date;

	// Ensure an objectid
	if (!(objectId = alchemy.castObjectId(objectId))) {
		return false;
	}

	date = objectId.getTimestamp();
	year = String(date.getFullYear());
	month = (date.getMonth()+1);

	if (month < 10) {
		month = '0' + month;
	} else {
		month = String(month);
	}

	filePath = path.resolve(this.basePath, year, month, String(objectId));

	return filePath;
});

/**
 * Get a Inode.File instance
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 *
 * @return   {Alchemy.Inode.File}
 */
MediaRaw.setDocumentMethod(function getFile() {
	return new Classes.Alchemy.Inode.File(this.path);
});