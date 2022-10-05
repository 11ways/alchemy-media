/**
 * Media File Model
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.3.0
 */
var MediaFile = Function.inherits('Alchemy.Model', function MediaFile(options) {

	MediaFile.super.call(this, options);

	this.queue = Function.createQueue();
	this.queue.limit = 5;
	this.queue.throttle = 10;
	this.queue.start();
});

MediaFile.setProperty('types', alchemy.shared('Media.types'));

/**
 * Constitute the class wide schema
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.6.4
 */
MediaFile.constitute(function addFields() {

	this.addField('name', 'String', {
		description: 'The name of the file',
	});

	this.addField('filename', 'String', {
		description : 'The actual filename',
	});

	this.addField('type', 'Enum', {
		values: alchemy.getClassGroup('media_type'),
		description: 'The type of file',
	});

	this.addField('extra', 'Object');

	this.addField('title', 'String', {
		translatable : alchemy.plugins.media.translatable,
		description  : 'The title of the file (will be used in the title attribute)',
	});

	this.addField('alt', 'String', {
		translatable : alchemy.plugins.media.translatable,
		description  : 'The alternative information of the file (will be used in the alt attribute)',
	});

	this.belongsTo('MediaRaw');
});

/**
 * Configure chimera for this model
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.2.0
 * @version  0.6.4
 */
MediaFile.constitute(function chimeraConfig() {

	var gallery,
	    list,
	    edit;

	if (!this.chimera) {
		return;
	}

	// Get the list group
	list = this.chimera.getActionFields('list');

	list.addField('name');
	list.addField('filename');
	list.addField('type');
	list.addField('title');
	list.addField('alt');

	// Get the edit group
	edit = this.chimera.getActionFields('edit');

	edit.addField('_id', {
		view    : 'file_preview',
		wrapper : 'file_preview',
		widget_settings : {
			title : 'Preview',
		},
	});

	edit.addField('name');
	edit.addField('filename');
	edit.addField('type');
	edit.addField('title');
	edit.addField('alt');

	// Get the galery group
	gallery = this.chimera.getActionFields('gallery');

	gallery.addField('name');
	gallery.addField('filename');
	gallery.addField('type');
	gallery.addField('extra');
	gallery.addField('title');
	gallery.addField('alt');
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
MediaFile.Document.setFieldGetter(function path() {

	var MediaRaw = this.getModel('MediaRaw');

	return MediaRaw.getPathFromId(this.media_raw_id);
});

/**
 * Get a file based on its media file id
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.5.0
 *
 * @param    {String|ObjectID}   id
 * @param    {Function}          callback
 */
MediaFile.setMethod(function getFile(id, callback) {

	var that = this,
	    options,
	    result,
	    item;

	options = {
		conditions: {
			'_id': id
		}
	};

	Function.series(function findInExtra(next) {
		if (!alchemy.plugins.media.extra_media_model) {
			return next();
		}

		let ExtraModel = that.getModel(alchemy.plugins.media.extra_media_model);

		ExtraModel.getFile(id, function gotResult(err, _item, record) {

			if (err) {
				log.error('Error in extra model:', err);
				return next();
			}

			if (!_item) {
				return next();
			}

			item = _item;
			result = record;
			next();
		});
	}, function useDefaultModel(next) {

		if (result) {
			return next();
		}

		that.find('first', options, function gotResult(err, record) {

			if (err != null) {
				return callback(err);
			}

			if (record) {
				result = record;
				next();
			} else {
				next(new Error('No image found'));
			}
		});
	}, async function done(err) {

		if (err) {
			return callback(err);
		}

		if (!result.MediaRaw) {
			await result.populate('MediaRaw');
		}

		callback(null, result);
	});
});

/**
 * Add a new file
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.2.0
 *
 * @param    {String}   file      The path to the file, can be a URL
 * @param    {Object}   options
 * @param    {Function} callback
 */
MediaFile.setMethod(function addFile(file, options, callback) {

	var that = this;

	this.queue.add(function(done) {
		that.getModel('MediaRaw').addFile(file, options, function(err, response) {
			callback(err, response);
			done();
		});
	});
});