/**
 * The al-image custom element
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.4.1
 * @version  0.7.0
 */
const AlImage = Function.inherits('Alchemy.Element.Media.Base', 'AlImage');

/**
 * CSS
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.4.1
 * @version  0.4.1
 */
AlImage.setStatic(function hawkejsCss() {
	var css = 'al-image {position:relative;display:inline-block;overflow:hidden;}'
	        + 'al-image .placeholder {position: absolute;left: 0; top: 0; width:100%; height: 100%;transform:scale(1.03);filter:blur(8px);z-index:-1;transition:0.1s transform;}'
	        + 'al-image .final {height:auto;width:auto;opacity:0;transition: 0.1s opacity, 0.1s transform;transform:scale(1.03)}';

	return css;
});

/**
 * Test image
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.4.1
 * @version  0.4.1
 */
AlImage.setMethod(function introduced() {

	var placeholder = this.querySelector('.placeholder'),
	    final = this.querySelector('.final');

	final.onload = function() {
		console.log('Final is loaded!');
		final.style.opacity = 1;
		final.style.transform = 'scale(1)';
		placeholder.style.transform = 'scale(1)';
	}

});

/**
 * Get the content for hawkejs
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
AlImage.setMethod(function getContent(callback) {

	var that = this,
	    src = this.getAttribute('src');

	this.viewRender.helpers.Alchemy.getResource({name: 'MediaFile#info', params: {path: src}}, function gotResult(err, info) {

		if (err) {
			return callback(err);
		}

		console.log('Size:', info);

		that.innerHTML = '<img class="final" src="/media/static/' + src + '?width=50%25" width=' + info.width + ' height=' + info.height +' style="width:400px">'
		               + '<img class="placeholder" src="/media/static/' + src + '?width=20px">';

		callback(null);
	});
});