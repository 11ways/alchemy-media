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
 * @version  0.6.0
 */
Image.constitute(function prepareSchema() {

	this.schema.addField('image', 'File', {
		widget_config_editable: true,
	});
});

/**
 * Populate the widget
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.0
 * @version  0.6.4
 *
 * @param    {HTMLElement}   widget
 */
Image.setMethod(function populateWidget() {

	let img = this.createElement('img');

	this.hawkejs_renderer.helpers.Media.applyDirective(img, this.config.image);

	this.widget.append(img);

	return populateWidget.super.call(this);
});
