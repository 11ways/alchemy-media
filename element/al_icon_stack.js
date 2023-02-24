/**
 * The al-icon-stack element
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.3
 * @version  0.7.3
 */
const IconStack = Function.inherits('Alchemy.Element.Media.Base', 'AlIconStack');

/**
 * Set the default role
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.3
 * @version  0.7.3
 */
IconStack.setRole('graphics-symbol');

/**
 * Set the size attribute
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.3
 * @version  0.7.3
 */
IconStack.setAttribute('size', {type: 'number'});