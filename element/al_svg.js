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
 * @version  0.7.1
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
		let svg = this.querySelector('svg');

		if (svg) {
			svg.role = this.role;
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