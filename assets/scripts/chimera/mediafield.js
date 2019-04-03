hawkejs.require([
	{name: 'jquery', path: '//code.jquery.com/jquery-1.11.3.min.js'},
	'jqueryui1.10/jquery.ui.widget',
	'fileupload/jquery.fileupload',
	'chimera/chimera'], function onChimeraLoad() {

var MediaFields = [];

/**
 * The MediaFileInput class
 */
function MediaFileField(chimera_field) {

	this.chimera_field = chimera_field;

	// Get the index in the MediaFields array
	this.index = (MediaFields.push(this)-1);

	// The original input
	this.input = chimera_field.input;

	// The wrapper div
	this.wrapper = false;

	// The preview object
	this.preview = false;

	// The controls
	this.controls = false;

	// Is this part of an array-field?
	this.array = false;

	// Init the field
	this.init();
}

/**
 * Init the field, add html code
 */
MediaFileField.prototype.init = function init() {

	var html,
	    value;

	// Create the html
	html = '<div class="mediafilechooser">';
	html += '<div class="preview"></div>';
	html += '<div class="controls"></div>';
	html += '</div>';

	// Prepare the jquery objects
	this.wrapper = $(html);
	this.preview = $('.preview', this.wrapper);
	this.controls = $('.controls', this.wrapper);

	$(this.input).append(this.wrapper);

	// @todo: implement readOnly
	//this.readOnly = this.input.attr('readonly') != null;

	if (this.readOnly) {
		this.controls.hide();
	}

	// Get the current value
	value = this.chimera_field.value;

	// If the value is set, generate the preview
	if (value) {
		this.setId(value);
	} else {
		this.setControls();
	}
};

/**
 * Set the image id and update the preview
 */
MediaFileField.prototype.setId = function setId(id) {

	var that = this,
	    html;

	// Generate the image html
	html = '<img src="/media/thumbnail/' + id + '" srcset="/media/thumbnail/' + id + '?dpr=2 2x" />';

	html += '<div class="image-actions">';

	html += '<span class="edit">';
	html += '<span class="icon"><i class="fa fa fa-edit"></i></span>';
	html += '<span class="message">Edit</span>';
	html += '</span>';

	// Add the button to remove the image
	html += '<span class="remove">';
	html += '<span class="icon"><i class="fa fa-times"></i></span>';
	html += '<span class="message">Remove</span>';
	html += '</span>';

	html += '</div>';

	// See if this is an arrayable field
	this.array = this.chimera_field.isArray;
	//this.array = !!this.wrapper.parents('.mediafieldgroup').find('button[data-chimera-add-entry]').length;

	this.chimera_field.setValue(id);

	// Set the preview image
	this.preview.html(html);

	// Hide the controls
	this.controls.hide();

	// Show the preview
	this.preview.show();

	if (this.readOnly) {
		$('.remove .icon, .remove .message', this.preview).hide();
	} else {
		// Attach a listener to the remove button
		$('.remove .icon, .remove .message', this.preview).click(function() {
			that.removeFile();
		});
	}

	$('.edit', this.preview).on('click', function() {
		that.editFile();
	});
};

/**
 * Remove the set file
 */
MediaFileField.prototype.removeFile = function removeFile() {

	if (this.array) {
		// Remove the wrapper element
		this.wrapper.remove();

		// Set the only reference to this object to null
		MediaFields[this.index] = null;
	} else {
		this.setControls();
	}

	this.chimerafield.setValue(null);
};

/**
 * Edit the set file
 */
MediaFileField.prototype.editFile = function editFile() {

	var that = this,
	    options = {
		history: false,
		get: {
			id: this.chimera_field.value
		}
	};

	var url = '/chimera/media_gallery/media_files/modify';

	hawkejs.scene.openUrl(url, options, function(err, renderer) {

		$('.action-save-image').on('click', function onClick(e) {

			var save_options;

			e.preventDefault();

			save_options = {
				history: false,
				post: {
					title: $('#image-title-text').val(),
					alt: $('#image-alt-text').val()
				}
			};

			hawkejs.scene.fetch(url + '?id=' + that.chimera_field.value, save_options, function saved(err, res, b) {

				if (err) {
					throw err;
				}

				renderer.dialog_element.parentElement.remove();
			});
		});
	});
};

/**
 * Set the controls
 */
MediaFileField.prototype.setControls = function setControls() {

	var that = this,
	    $progress,
	    $bar,
	    html;

	if (this.readOnly) {
		return;
	}

	html = '<span class="btn btn-success fileinput-button">';
	html += '<span>Upload file</span>';

	html += '<input class="fileupload" type="file" name="newfile">';
	html += '</span>';

	html += '<span class="btn btn-primary fileinput-pick">';
	html += '<span>Pick file</span>';
	html += '</span>';

	html += '<div class="chimeraMedia-progress progress">';
	html += '<div class="progress-bar progress-bar-success"></div>';
	html += '</div>';

	// Remove the current value
	this.chimera_field.setValue();

	// Set the html
	this.controls.html(html);

	// Get the $progress wrapper
	$progress = $('.progress', this.controls);

	// Get the bar self
	$bar = $('.progress-bar', $progress);

	// Hide the current preview image
	this.preview.hide();

	// Show the controls
	this.controls.show();

	// Attach the fileupload code
	$('.fileupload', this.controls).fileupload({
		url: '/media/upload',
		dataType: 'json',
		formData: {},
		done: function onDone(e, data) {

			var result = JSON.undry(data.result),
			    file;

			// We only allow 1 file to be uploaded
			file = result.files[0];

			that.setId(file._id);
		},
		progressall: function (e, data) {
			var progress = parseInt(data.loaded / data.total * 100, 10);
			$bar.css('width', progress + '%');
		}
	});

	// Attach the media picker
	$('.fileinput-pick', this.controls).click(function(e) {

		pickMediaId(function(err, id) {

			if (!id) {
				return;
			}

			that.setId(id);
		});

		e.preventDefault();
	});
};

/**
 * The File ChimeraField class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {DOMElement}   container
 * @param    {Object}       variables
 */
var FileChimeraField = ChimeraField.extend(function FileChimeraField(parent, value, container, variables, prefix) {
	FileChimeraField.super.call(this, parent, value, container, variables, prefix);
});

/**
 * Create the edit input element
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.4.0
 */
FileChimeraField.setMethod(function renderEdit(callback) {

	var element;

	if (this._rendered) {
		if (callback) callback(null);
		return;
	}

	this._rendered = true;

	element = Blast.parseHTML('<div class="mediafieldgroup"></div>');

	this.entry = element;
	this.input = element;
	this.parent.addEntry(this);

	this.mediafile = new MediaFileField(this);
	this.mediafile.chimerafield = this;

	if (callback) callback(null);
});

/**
 * Initialize the field in the edit action
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.3.0
 * @version  0.3.0
 *
 * @param    {Mixed}   value   Optional value to override
 */
FileChimeraField.setMethod(function initEdit(value) {

	var that = this;

	// Override the value if given
	if (typeof value == 'undefined') {
		value = this.value;
	}

	this.renderEdit();
});

// Intercept filebrowser event emitted in modified ckeditor code
hawkejs.scene.on('filebrowser', function onFilebrowse(input, dialog, filebrowser) {

	pickMediaId(function picked(err, result, element) {

		if (err) {
			throw err;
		}

		input.setValue('/media/image/' + result);

		// Set the alt text
		if (element && element.getAttribute('alt')) {
			var alt = $('#' + input.domId).parents('table').find('#cke_158_textInput');
			alt.val(element.getAttribute('alt'));
		}
	});
});

function pickMediaId(callback) {

	var madeSelection;

	hawkejs.scene.openUrl('/chimera/media_gallery/media_files/gallery_picker', {history: false}, function(err, viewRender) {

		var $fileupload,
		    element,
		    $bar;

		element = viewRender.dialog_element;
		$fileupload = $('.fileupload', element);
		$bar = $('.progress-bar', element);

		$fileupload.fileupload({
			url: '/media/upload',
			dataType: 'json',
			formData: {},
			done: function onDone(e, data) {

				var renderer = new __Protoblast.Classes.Hawkejs.ViewRender(hawkejs),
				    result = JSON.undry(data.result),
				    file,
				    html;

				// We only allow 1 file to be uploaded
				file = result.files[0];

				renderer.initHelpers();

				html = '<figure class="chimeraGallery-thumb" data-id="' + file._id + '" style="';
				html += renderer.helpers.Media.imageCssSet(file._id, {profile: 'pickerThumb'});
				html += '"><div class="chimeraGallery-thumbInfo"><span>Select</span></div></figure>';

				$('.chimeraGallery-pickup', element).after(html);
				$bar.css('width', '');
			},
			progressall: function onProgressAll(e, data) {
				var progress = parseInt(data.loaded / data.total * 100, 10);
				$bar.css('width', progress + '%');
			}
		});

		$(element).on('click', '.chimeraGallery-thumb', function onThumbClick(e) {

			var $thumb = $(this),
			    id = $thumb.data('id');

			madeSelection = true;

			if (callback) {
				callback(null, id, this);
			}

			element.parentElement.remove();
		});

		viewRender.afterOnce('dialog_close', function afterClosed() {
			if (!madeSelection && callback) {
				callback(null, false);
			}
		});
	});

}
});