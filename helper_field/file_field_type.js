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

/**
 * Get the accepted types
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.1
 * @version  0.7.1
 *
 * @return   {Array|null}
 */
FileField.setMethod(function getAcceptedTypes() {

	let accept = this.options?.accept;

	if (!accept) {
		return null;
	}

	accept = Array.cast(accept);

	return accept;
});

/**
 * Get the accepted types string, for the input element
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.1
 * @version  0.7.1
 *
 * @return   {String|null}
 */
FileField.setMethod(function getAcceptedTypesString() {

	let types = this.getAcceptedTypes();

	if (!types?.length) {
		return null;
	}

	return types.join(', ');
});

if (Blast.isBrowser) {
	return;
}

/**
 * Make sure the file is really a file,
 * download urls first
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.9.0
 *
 * @param    {Alchemy.OperationalContext.SaveFieldToDatasource}   context
 * @param    {*} value
 *
 * @return   {Pledge<ObjectId>|ObjectId}
 */
FileField.setMethod(function _toDatasource(context, value) {

	let options = Object.assign({}, this.options);

	let pass_through_media_file = typeof value == 'string' && (value.startsWith('http') || value.startsWith('/'));

	if (!pass_through_media_file) {
		if (value && typeof value == 'object' && !alchemy.isObjectId(value)) {
			pass_through_media_file = true;
		}
	}

	if (!pass_through_media_file) {
		return this.cast(value);
	}

	return Swift.waterfall(
		() => this.getModel('MediaFile').addFile(value, options),
		result => result._id,
	);
});