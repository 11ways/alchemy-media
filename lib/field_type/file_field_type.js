/**
 * The FileFieldType class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 */
var FileFieldType = Function.inherits('ObjectIdFieldType', function FileFieldType(schema, name, options) {
	FileFieldType.super.call(this, schema, name, options);
});

/**
 * Defer casting when processing data?
 *
 * @type   {Boolean}
 */
FieldType.setProperty('deferCast', true);

/**
 * Make sure the file is really a file,
 * download urls first
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {Mixed}        value
 * @param    {Object}       data
 * @param    {Datasource}   datasource
 * @param    {Function}     callback
 *
 * @return   {Mixed}
 */
FileFieldType.setMethod(function _toDatasource(value, data, datasource, callback) {

	if (typeof value == 'string' && value.startsWith('http')) {

		Model.get('MediaFile').addFile(value, function addedFile(err, result) {

			if (err != null) {
				return callback(err);
			}

			callback(null, result._id);
		});
	} else {
		callback(null, this.cast(value));
	}
});