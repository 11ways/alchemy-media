/**
 * The base class for all other media elements
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.0
 * @version  0.7.0
 */
const Base = Function.inherits('Alchemy.Element', 'Alchemy.Element.Media', 'Base');

/**
 * The stylesheet to load for this element
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.0
 * @version  0.7.0
 */
Base.setStylesheetFile('alchemy_media');
