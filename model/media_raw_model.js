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
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
Model.extend(function MediaRawModel() {

	var basePath  = alchemy.plugins.media.path,
	    hashType  = alchemy.plugins.media.hash,
	    MediaType = alchemy.classes.MediaType;

	this.types = alchemy.shared('Media.types');

	this.preInit = function preInit() {

		this.parent();

		this.blueprint = {
			name: {
				type: 'String'
			},
			extension: {
				type: 'String'
			},
			hash: {
				type: 'String',
				index: {
					unique: true,
					name: 'media_raw_uid',
				}
			},
			size: {
				type: 'Number',
				index: {
					unique: true,
					name: 'media_raw_uid',
				}
			},
			mimetype: {
				type: 'String'
			},
			type: {
				type: 'Enum'
			},
			extra: {
				type: 'Object'
			}
		};
	};

	/**
	 * Add a file
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.1.0
	 *
	 * @param    {String}   file      The path to the file, can be a URL
	 * @param    {Object}   options
	 * @param    {Function} callback
	 */
	this.addFile = function addFile(file, options, callback) {

		var that = this,
		    removeOriginal,
		    MediaFile;

		if (typeof options == 'function') {
			callback = options;
			options = {};
		}

		// If the given file is actually a url, we'll need to download it first
		if (file.startsWith('http://')) {

			if (!options.filename) {
				options.filename = Url.parse(file).pathname.split('/').last();
			}

			// Don't keep the original, temporary file
			options.move = true;

			alchemy.downloadFile(file, options, function(err, tempfile) {

				if (err) {
					return callback(err);
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

		alchemy.getFileInfo(file, {hash: hashType}, function(err, info) {

			var type;

			if (err) {
				return callback(err);
			}

			type = MediaType.determineType(info.mimetype)

			type.normalize(file, info, function afterNormalize(err, rawPath, rawInfo, rawExtra, extra) {

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
							media_raw_id: item._id,
							name: options.name || info.name,
							filename: options.filename || info.filename,
							extra: extra,
							type: type.typeName
						}
					};

					if (createdNew || (!createdNew && !options.reusefile)) {

						MediaFile.save(FileData, function(err, result) {
							if (err) return callback(err);
							callback(null, result[0].item);
						});
					} else {

						MediaFile.find('first', {conditions: {media_raw_id: item._id}, recursive: 0}, function(err, items) {

							if (err) {
								return callback(err);
							}

							if (items && items[0] && items[0].MediaFile) {
								callback(null, items[0].MediaFile)
							} else {
								MediaFile.save(FileData, function(err, result) {
									if (err) return callback(err);
									callback(null, result[0].item);
								});
							}
						});
					}
				});
			});
		});
	};









	/**
	 * Get a file based on its  raw id
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {String|ObjectID}   id
	 * @param    {Function}          callback
	 */
	this.getFile = function getFile(id, callback) {

		var that = this,
		    options = {
			conditions: {
				'_id': id
			}
		};

		this.find('first', options, function(err, result) {

			var item;

			if (result.length) {
				item = result[0].MediaRaw;

				item.path = that.getPathFromId(item._id);

				callback(null, item);

			} else {
				callback(alchemy.createError('No image found'));
			}
		});
	};

	/**
	 * Store the given raw file in our own folder structure and database,
	 * this makes sure there are no duplicates
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {String}   file      The path to the file
	 * @param    {Object}   options   Optional options
	 * @param    {Function} callback  The callback that gets the id & item
	 */
	this.storeFile = function storeFile(file, options, callback) {

		var that = this,
		    transferType;

		if (typeof options == 'function') {
			callback = options;
			options = {};
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
				alchemy[transferType](file, targetPath, function(err) {
					if (err) {
						callback(err);
					} else {
						item.path = targetPath;
						callback(null, id, item, true);
					}
				});
			} else {
				return callback(alchemy.createError('Could not copy file to undefined target'));
			}

		});
	};

	/**
	 * Look up some information on the given file, store it in the
	 * database if it is not there yet, and return the id and info.
	 *
	 * This does NOT copy the file to our own folder structure!
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	var prepareId = function prepareId(file, options, callback) {

		var that = this,
		    data;

		alchemy.getFileInfo(file, {hash: hashType}, function(err, info) {

			if (err) {
				return callback(err);
			}

			// See if this file already exists,
			// based on the hash and the file size
			var search_options = {
				conditions: {
					hash: info.hash,
					size: info.size
				}
			};

			that.find('first', search_options, function(err, result) {

				// Return the existing id if we found a match
				if (result.length) {
					callback(null, true, result[0].MediaRaw._id, result[0].MediaRaw);
				} else {

					// If not: save the data to the database
					data = {
						MediaRaw: {
							name: options.name || info.name,
							extension: options.extension || info.extension,
							mimetype: info.mimetype,
							hash: info.hash,
							size: info.size,
							extra: options.rawExtra
						}
					};

					that.save(data, function(err, result) {

						if (result.length) {
							if (result[0].err) {
								callback(result[0].err);
							} else {
								callback(null, false, result[0].item._id, result[0].item);
							}
						}
					});
				}
			});
		});
	};

	/**
	 * Construct the filepath of the given ObjectId
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {ObjectID|String}   objectId
	 *
	 * @return   {String}            The (expected) path to the file
	 */
	this.getPathFromId = function getPathFromId(objectId) {

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

		filePath = path.resolve(basePath, year, month, String(objectId));

		return filePath;
	};

});