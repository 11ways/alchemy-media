/**
 * The Widget Image class
 *
 * @constructor
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.6.0
 * @version  0.6.0
 *
 * @param    {Object}   data
 */
const Image = Function.inherits('Alchemy.Widget', 'Image');

/**
 * Prepare the schema
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.0
 * @version  0.7.1
 */
Image.constitute(function prepareSchema() {

	this.schema.addField('image', 'File', {
		description : 'Upload/select the image to display',
		widget_config_editable: true,
	});

	this.schema.addField('width_hint', 'Number', {
		description : 'Approximate maximum width of the image in pixels or as a percentage of the total page width.',
		widget_config_editable: true,
		default: '25%',
	});

	this.schema.addField('lazy_load', 'Boolean', {
		description : 'Determines whether the image should be loaded lazily or not',
		widget_config_editable: true,
		default: true,
	});
});

/**
 * Populate the widget
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.0
 * @version  0.7.1
 *
 * @param    {HTMLElement}   widget
 */
Image.setMethod(function populateWidget() {

	let img = this.createElement('img');

	let width_hint = this.config.width_hint,
	    lazy_load = this.config.lazy_load;

	if (width_hint === null || width_hint === '' || typeof width_hint == 'undefined') {
		width_hint = '25%';
	}

	if (lazy_load == null) {
		lazy_load = true;
	}

	this.hawkejs_renderer.helpers.Media.applyDirective(img, this.config.image, {width: width_hint, lazy_load});

	this.widget.append(img);

	return populateWidget.super.call(this);
});
