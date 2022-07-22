/**
 * The al-ico element
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.0
 * @version  0.6.0
 */
const Icon = Function.inherits('Alchemy.Element', 'AlIco');

/**
 * The stylesheet to load for this element
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.6.0
 * @version  0.6.0
 */
Icon.setStylesheetFile('alchemy_icons');

/**
 * The source to use
 * (Will default to Fontawesome)
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.6.3
 * @version  0.6.3
 */
Icon.setAttribute('source');

/**
 * The icon-style to use
 * (Will default to regular for fontawesome)
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.6.3
 * @version  0.6.3
 */
Icon.setAttribute('icon-style');

/**
 * The actual icon name to use
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.6.3
 * @version  0.6.3
 */
Icon.setAttribute('icon-name');

/**
 * The element is being retained
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.3
 * @version  0.6.3
 */
Icon.setMethod(function retained() {
	this.setCssClasses();
});

/**
 * The element has been introduced to the DOM for the first time
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.3
 * @version  0.6.3
 */
Icon.setMethod(function introduced() {
	this.setCssClasses();
});

/**
 * Set the CSS classes
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.3
 * @version  0.6.3
 */
Icon.setMethod(function setCssClasses() {

	if (this.source && this.source != 'fontawesome') {
		return;
	}

	let fa_pro = this.hawkejs_renderer.expose('fontawesome_pro');

	if (fa_pro) {
		this.hawkejs_renderer.style(fa_pro);
	} else {
		this.hawkejs_renderer.style('alchemy_icons_fafree');
	}

	let existing_classes = Array.cast(this.classList);

	// Remove existing fontawesome classes
	for (let entry of existing_classes) {
		if (entry.startsWith('fa')) {
			this.classList.remove(entry);
		}
	}

	this.classList.add('fa-' + (this.icon_style || 'regular'));
	this.classList.add('fa-' + this.icon_name);
});