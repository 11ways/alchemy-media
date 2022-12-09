const BUSY = Symbol('busy');

/**
 * The al-icon element
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.0
 * @version  0.7.0
 */
const Icon = Function.inherits('Alchemy.Element.Media.Base', 'AlIcon');

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
 * Extra options/flags
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.0
 * @version  0.7.0
 */
Icon.setAttribute('icon-flags');

/**
 * Set the default role
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.1
 * @version  0.7.1
 */
Icon.setRole('graphics-symbol');

/**
 * Refresh the icon when these attributes change
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.0
 * @version  0.7.0
 */
Icon.addObservedAttribute(['icon-style', 'icon-name', 'icon-flags'], function onChange() {
	this.refresh();
});

/**
 * The element is being retained
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.3
 * @version  0.7.0
 */
Icon.setMethod(function retained() {
	this.refresh(true);
});

/**
 * The element has been introduced to the DOM for the first time
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.3
 * @version  0.7.0
 */
Icon.setMethod(function introduced() {
	this.refresh();
});

/**
 * Refresh the icon
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.0
 * @version  0.7.1
 *
 * @param    {Boolean}   force
 */
Icon.setMethod(function refresh(force) {

	if (this[BUSY] && !force) {
		return;
	}

	if (this.role == 'graphics-symbol') {
		this.role = 'graphics-symbol img';

		if (!this.hasAttribute('aria-label')) {
			this.setAttribute('aria-label', '');
		}
	}

	if (!force && Blast.isNode) {
		return;
	}

	this[BUSY] = true;

	this.setCssClasses();

	this[BUSY] = false;
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

	this[BUSY] = true;

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

	this.refresh(true);
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

	let flags = (this.icon_flags || '').split(/\s+/);

	for (let flag of flags) {
		this.classList.add('fa-' + flag);
	}
});