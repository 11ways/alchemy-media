/**
 * The al-svg element
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.5.1
 * @version  0.7.0
 */
const Svg = Function.inherits('Alchemy.Element.Media.Base', 'AlSvg');

/**
 * The location of the svg
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.5.1
 * @version  0.5.1
 */
Svg.setAttribute('src');

/**
 * Get the contents of this SVG
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.5.1
 * @version  0.7.4
 */
Svg.setMethod(async function injectSvg() {

	let contents,
	    src = this.src;

	if (!src.endsWith('.svg')) {
		src += '.svg';
	}

	// Remove all the content
	Hawkejs.removeChildren(this);

	if (Blast.isNode) {
		let path = await alchemy.findImagePath(src);

		if (path) {
			let file = new Classes.Alchemy.Inode.File(path);
			contents = await file.readString();
		} else {
			contents = '';
		}
	} else {
		contents = await Blast.fetch('/media/static/' + src, {cache: 60 * 60 * 1000});
	}

	this.innerHTML = contents;

	if (this.role) {

		// Do not allow `graphics-symbol` role, because it is not widely supported
		// and google doesn't know it either
		if (this.role == 'graphics-symbol') {
			this.role = 'img';

			if (!this.hasAttribute('aria-label')) {
				this.setAttribute('aria-label', '');

				// graphics-symbol images are not important, so they can be hidden
				this.setAttribute('aria-hidden', 'true');
			}
		}

		let svg = this.querySelector('svg');

		if (svg) {
			svg.setAttribute('role', this.role);

			if (this.hasAttribute('aria-label')) {
				svg.setAttribute('aria-label', this.getAttribute('aria-label'));
			}
		}
	}

	if (this._resolve_me_too) {
		this._resolve_me_too.resolve();
	}
});

/**
 * Cached render method for Hawkejs
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.5.1
 * @version  0.5.1
 */
Hawkejs.setCachedMethod(Svg, Hawkejs.RENDER_CONTENT, function doRender() {

	if (!this.src) {
		return;
	}

	return this.injectSvg();
});