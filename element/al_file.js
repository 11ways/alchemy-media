/**
 * The al-image custom element
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.0
 * @version  0.7.0
 */
const AlFile = Function.inherits('Alchemy.Element.Media.Base', 'AlFile');

/**
 * The template code
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.0
 * @version  0.6.0
 */
AlFile.setTemplateFile('element/al_file');

/**
 * Getter for the drop target
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.2
 * @version  0.6.2
 */
AlFile.addElementGetter('drop_target', '.al-file-drop-target');

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
 * Getter for the remove button
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.2
 * @version  0.6.2
 */
AlFile.addElementGetter('remove_button', '.al-file-remove');

/**
 * Getter for the select button
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.0
 * @version  0.7.0
 */
AlFile.addElementGetter('select_button', '.al-file-select');

/**
 * Getter for the uploading-icon
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.2
 * @version  0.6.2
 */
AlFile.addElementGetter('icon_uploading', '.uploading-icon');

/**
 * Getter for the empty-icon
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.2
 * @version  0.6.2
 */
AlFile.addElementGetter('icon_empty', '.empty-icon');

/**
 * Set the accepted types
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.1
 * @version  0.7.1
 */
AlFile.setAttribute('accept');

/**
 * Set the value
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.0
 * @version  0.6.2
 */
AlFile.setAttribute('value', null, function setValue(value) {

	if (value == null) {
		value = '';
	}

	if (this.remove_button) {
		this.remove_button.hidden = !value;
	}

	if (this.icon_empty) {
		this.icon_empty.hidden = !!value;
	}

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
 * @version  0.7.5
 */
AlFile.setMethod(async function uploadFile(config) {

	let file     = config.file,
	    filename = config.filename,
	    format   = config.format;
	
	this.classList.add('uploading');

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

	if (this.accept) {
		form_data.append('accept', this.accept);
	}

	let upload_percentage = this.querySelector('.upload-percentage');

	if (upload_percentage) {
		upload_percentage.textContent = '';
	}

	let response;

	try {
		let pledge = Blast.fetch({
			url     : url,
			post    : form_data,
			timeout : 60 * 1000,
		});

		let request = pledge.request;

		request.on('progress_upload', data => {
			if (upload_percentage) {
				upload_percentage.textContent = Math.round(data.percentage) + '%';
			}
		});

		response = await pledge;
	} catch (err) {

		let alchemy_field = this.queryUp('al-field');

		if (alchemy_field) {
			alchemy_field.showError(err);
		} else {
			console.error('Failed to upload file:', err);
			alert('Failed to upload file: ' + err);
		}
	}

	this.classList.remove('uploading');

	if (!response || !response.files || !response.files[0]) {
		return;
	}

	let uploaded_file = response.files[0];

	this.value = uploaded_file.id;

	// uploaded_file.name
	// uploaded_file.media_raw_id
});

/**
 * Added to the DOM for the first time
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.0
 * @version  0.6.2
 */
AlFile.setMethod(function introduced() {

	const that = this;

	this.addEventListener('dragenter', e => {
		e.preventDefault();
	});

	this.addEventListener('dragover', e => {
		this.classList.add('dropping');
		e.preventDefault();
	});

	this.addEventListener('dragend', e => {
		this.classList.remove('dropping');
	});

	this.addEventListener('dragleave', e => {
		this.classList.remove('dropping');
	});

	this.addEventListener('drop', e => {
		this.classList.remove('dropping');
		this.classList.add('dropped');

		e.preventDefault();

		let file = e.dataTransfer.files[0];

		this.uploadFile({
			file     : file,
			filename : file.name,
			format   : null,
		});
	});

	this.updatePreview();

	this.file_input.addEventListener('change', e => {

		this.classList.remove('dropping');
		this.classList.add('dropped');

		this.uploadFile({
			file     : this.file_input.files[0],
			filename : this.file_input.files[0].name,
			format   : null,
		});
	});

	this.remove_button.addEventListener('click', e => {
		this.value = null;
	});

	if (this.select_button) {
		this.select_button.addEventListener('click', e => {
			this.showExistingFileSelection();
		});
	}
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

		that.innerHTML = '<img class="final" src="/media/static/' + src + '?width=50%25" width=' + info.width + ' height=' + info.height +' style="width:400px">'
		               + '<img class="placeholder" src="/media/static/' + src + '?width=20px">';

		callback(null);
	});
});

/**
 * Select existing files
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.0
 * @version  0.7.1
 */
AlFile.setMethod(async function showExistingFileSelection() {

	let variables = {};

	if (this.accept) {
		let filters = {
			type : this.accept,
		};
		
		variables.filters = filters;
	}

	await hawkejs.scene.render('element/al_file_selection', variables);

	let dialog_contents = document.querySelector('he-dialog [data-he-template="element/al_file_selection"]');

	if (!dialog_contents) {
		return;
	}

	let dialog = dialog_contents.queryParents('he-dialog'),
	    button = dialog_contents.querySelector('.btn-apply');

	dialog_contents.classList.add('default-form-editor');
	hawkejs.scene.enableStyle('chimera/chimera');

	button.addEventListener('click', e => {
		e.preventDefault();

		let table = dialog.querySelector('al-table');
		
		if (table) {
			let row = table.active_row;

			if (row && row.dataset.pk) {
				this.value = row.dataset.pk;
			}
		}

		dialog.remove();
	});

});