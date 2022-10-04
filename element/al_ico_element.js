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
 * Try to set the correct icon
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.3
 * @version  0.6.3
 */
Icon.setMethod(function setIcon(info) {

	if (!info) {
		return;
	}

	if (typeof info == 'string') {
		info = info.split(' ');

		if (info.length == 2) {
			this.icon_style = info[0];
			this.icon_name = info[1];
		} else {
			this.icon_name = info[0];
		}
	} else if (typeof info == 'object') {
		let style = info.style || info.icon_style,
		    name = info.name || info.icon_name;
		
		if (style) {
			this.icon_style = style;
		}

		if (name) {
			this.icon_name = name;
		}
	}

	if (!this.icon_style) {
		this.icon_style = 'duotone';
	}
});

/**
 * Set the CSS classes
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.3
 * @version  0.6.4
 */
Icon.setMethod(function setCssClasses() {

	if (this.source && this.source != 'fontawesome') {
		return;
	}

	// Load the appropriate font style
	this.hawkejs_renderer.helpers.Media.loadIconFont();

	let fa_pro = this.hawkejs_renderer.expose('fontawesome_pro'),
	    style = this.icon_style || 'regular';

	if (!fa_pro) {
		if (style == 'duotone' || style == 'light' || style == 'thin' || style == 'regular') {
			style = 'solid';
		}
	}

	let existing_classes = Array.cast(this.classList);

	// Remove existing fontawesome classes
	for (let entry of existing_classes) {
		if (entry.startsWith('fa')) {
			this.classList.remove(entry);
		}
	}

	this.classList.add('fa-' + (this.icon_style || 'solid'));
	this.classList.add('fa-' + this.icon_name);
});