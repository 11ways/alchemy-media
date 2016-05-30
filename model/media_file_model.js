/**
 * Media File Model
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.2.0
 */
var MediaFile = Function.inherits('Model', function MediaFileModel(options) {

	MediaFileModel.super.call(this, options);

	this.queue = Function.createQueue();
	this.queue.limit = 5;
	this.queue.throttle = 10;
	this.queue.start();
});

MediaFile.setProperty('types', alchemy.shared('Media.types'));

/**
 * Constitute the class wide schema
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 */
MediaFile.constitute(function addFields() {

	this.addField('name', 'String');
	this.addField('filename', 'String');
	this.addField('type', 'Enum');
	this.addField('extra', 'Object');

	this.belongsTo('MediaRaw');
});

/**
 * Configure chimera for this model
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
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

	// Get the edit group
	edit = this.chimera.getActionFields('edit');

	edit.addField('name');
	edit.addField('filename');
	edit.addField('type');

	// Get the galery group
	gallery = this.chimera.getActionFields('gallery');

	gallery.addField('name');
	gallery.addField('filename');
	gallery.addField('type');
	gallery.addField('extra');
});

/**
 * Get a file based on its media file id
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.0.1
 *
 * @param    {String|ObjectID}   id
 * @param    {Function}          callback
 */
MediaFile.setMethod(function getFile(id, callback) {

	var that = this,
	    Raw  = this.getModel('MediaRaw'),
	    options;

	options = {
		conditions: {
			'_id': id
		}
	};

	this.find('first', options, function gotResult(err, result) {

		var item;

		if (err != null) {
			return callback(err);
		}

		if (result.length) {
			item = result.MediaFile;

			item.path = Raw.getPathFromId(item.media_raw_id);

			callback(null, item, result);

		} else {
			callback(new Error('No image found'));
		}
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