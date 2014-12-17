/**
 * Media File Model
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  1.0.0
 */
var MediaFile = Function.inherits('Model', function MediaFileModel(options) {

	var chimera,
	    gallery,
	    list,
	    edit;

	MediaFileModel.super.call(this, options);

	// Create the chimera behaviour
	chimera = this.addBehaviour('chimera');

	if (chimera) {
		// Get the list group
		list = chimera.getActionFields('list');

		list.addField('name');
		list.addField('filename');
		list.addField('type');

		// Get the edit group
		edit = chimera.getActionFields('edit');

		edit.addField('name');
		edit.addField('filename');
		edit.addField('type');

		// Get the galery group
		gallery = chimera.getActionFields('gallery');

		gallery.addField('name');
		gallery.addField('filename');
		gallery.addField('type');
		gallery.addField('extra');
	}
});

MediaFile.addField('name', 'String');
MediaFile.addField('filename', 'String');
MediaFile.addField('type', 'Enum');
MediaFile.addField('extra', 'Object');

MediaFile.belongsTo('MediaRaw');

MediaFile.setProperty('types', alchemy.shared('Media.types'));

/**
 * Get a file based on its media file id
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 *
 * @param    {String|ObjectID}   id
 * @param    {Function}          callback
 */
MediaFile.setMethod(function getFile(id, callback) {

	var that = this,
	    Raw  = this.getModel('MediaRaw'),
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
			item = result[0].MediaFile;

			item.path = Raw.getPathFromId(item.media_raw_id);

			callback(null, item, result[0]);

		} else {
			callback(new Error('No image found'));
		}
	});
});

/**
 * Add a new file
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  1.0.0
 *
 * @param    {String}   file      The path to the file, can be a URL
 * @param    {Object}   options
 * @param    {Function} callback
 */
MediaFile.setMethod(function addFile(file, options, callback) {
	this.getModel('MediaRaw').addFile(file, options, callback);
});