/**
 * Media File Model
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
Model.extend(function MediaFileModel() {

	this.types = alchemy.shared('Media.types');
	
	this.preInit = function preInit() {

		this.parent();

		this.belongsTo = {
			MediaRaw: {
				modelName: 'MediaRaw',
				foreignKey: 'media_raw_id'
			}
		};

		this.blueprint = {
			media_raw_id: {
				type: 'ObjectId'
			},
			name: {
				type: 'String'
			},
			filename: {
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
	 * Get a file based on its media file id
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
		    Raw  = this.getModel('MediaRaw'),
		    options = {
			conditions: {
				'_id': id
			}
		};

		this.find('first', options, function(err, result) {

			var item;

			if (result.length) {
				item = result[0].MediaFile;

				item.path = Raw.getPathFromId(item.media_raw_id);

				callback(null, item, result[0]);

			} else {
				callback(alchemy.createError('No image found'));
			}
		});
	};

	/**
	 * Add a new file
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.addFile = function addFile(file, options, callback) {
		this.getModel('MediaRaw').addFile(file, options, callback);
	};



});