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