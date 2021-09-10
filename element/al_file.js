/**
 * The al-image custom element
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.0
 * @version  0.6.0
 */
const AlFile = Function.inherits('Alchemy.Element.App', function AlFile() {
	return AlFile.super.call(this);
});

/**
 * The template code
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.0
 * @version  0.6.0
 */
AlFile.setTemplateFile('element/al_file');

/**
 * The stylesheet to load for this element
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.6.0
 * @version  0.6.0
 */
AlFile.setStylesheetFile('element/alchemy_file');

/**
 * Getter for the select button
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.2.0
 */
AlFile.addElementGetter('select_button', '.al-file-select-file');

/**
 * Getter for the file input
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.2.0
 */
AlFile.addElementGetter('file_input', '.al-file-input');

/**
 * Getter for the preview
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.2.0
 */
AlFile.addElementGetter('preview_element', '.al-file-preview');

/**
 * Set the value
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.0
 * @version  0.6.0
 */
AlFile.setAttribute('value', null, function setValue(value) {
	this.updatePreview(value);
	return value;
});

/**
 * Update the preview image
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.0
 * @version  0.6.0
 */
AlFile.setMethod(function updatePreview(value) {

	if (arguments.length == 0) {
		value = this.value;
	}

	if (this.preview_element) {
		Hawkejs.removeChildren(this.preview_element);

		if (value) {
			let img = this.createElement('img');
			img.setAttribute('src', '/media/thumbnail/' + value);
			img.setAttribute('srcset', '/media/thumbnail/' + value + '?dpr=2 2x');

			this.preview_element.append(img);
		}
	}
});

/**
 * Upload the file
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.0
 * @version  0.6.0
 */
AlFile.setMethod(async function uploadFile(config) {

	const that = this;

	let file     = config.file,
	    filename = config.filename,
	    format   = config.format;

	let form_data = new FormData(),
	    url = this.dataset.uploadUrl;

	if (!url) {
		url = '/media/upload';
	}

	form_data.append('uploaded_file', file);
	form_data.append('filename', filename);

	if (format) {
		form_data.append('format', format);
	}

	let response = await Blast.fetch({
		url  : url,
		post : form_data,
	});

	if (!response || !response.files || !response.files[0]) {
		return;
	}

	let uploaded_file = response.files[0];

	this.value = uploaded_file.id;

	// uploaded_file.name
	// uploaded_file.media_raw_id
});

/**
 * Test image
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.0
 * @version  0.6.0
 */
AlFile.setMethod(function introduced() {

	const that = this;

	this.updatePreview();

	this.select_button.addEventListener('click', e => {
		e.preventDefault();
		this.file_input.click();
	});

	this.file_input.addEventListener('change', function onChange(e) {

		that.uploadFile({
			file     : this.files[0],
			filename : this.files[0].name,
			format   : null,
		});
	});

});

/**
 * Get the content for hawkejs
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.6.0
 * @version  0.6.0
 */
AlFile.setMethod(function _getContent(callback) {

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