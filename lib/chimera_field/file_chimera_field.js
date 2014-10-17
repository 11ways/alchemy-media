/**
 * File Chimera Field
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {FieldType}
 */
var FileChimeraField = Function.inherits('ChimeraField', function FileChimeraField(fieldType, options) {

	FileChimeraField.super.call(this, fieldType, options);

	this.viewname = 'file';
});
