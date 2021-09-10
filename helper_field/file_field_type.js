/**
 * The FileFieldType class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.6.0
 */
var FileField = Function.inherits('Alchemy.Field.ObjectId', 'File');

/**
 * Defer casting when processing data?
 *
 * @type   {Boolean}
 */
FileField.setProperty('deferCast', true);

if (Blast.isBrowser) {
	return;
}

/**
 * Make sure the file is really a file,
 * download urls first
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {Mixed}        value
 * @param    {Object}       data
 * @param    {Datasource}   datasource
 * @param    {Function}     callback
 *
 * @return   {Mixed}
 */
FileField.setMethod(function _toDatasource(value, data, datasource, callback) {

	var options = Object.assign({}, this.options);

	if (typeof value == 'string' && (value.startsWith('http') || value.startsWith('/'))) {

		this.getModel('MediaFile').addFile(value, options, function addedFile(err, result) {

			if (err != null) {
				return callback(err);
			}

			callback(null, result._id);
		});
	} else {
		callback(null, this.cast(value));
	}
});