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

	// Add the button to remove the image
	html += '<span class="remove">';
	html += '<span class="icon"><i class="fa fa-times fa-inverse"></i></span>';
	html += '<span class="message">Remove</span>';
	html += '</span>';

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
		done: function (e, data) {
			// We only allow 1 file to be uploaded
			var file = data.result.files[0];
			that.setId(file.id);
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
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    1.0.0
 * @version  1.0.0
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
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    1.0.0
 * @version  1.0.0
 */
FileChimeraField.setMethod(function renderEdit() {
	var html = '<div class="mediafieldgroup"></div>';
	this.setMainElement(html);

	this.mediafile = new MediaFileField(this);
	this.mediafile.chimerafield = this;
});

hawkejs.scene.on('filebrowser', function onFilebrowse(input, dialog, filebrowser) {

	pickMediaId(function picked(err, result) {

		if (err) {
			throw err;
		}

		input.setValue('/media/image/' + result);
	});
});

function pickMediaId(callback) {

	var madeSelection;

	vex.open({
		className: vex.defaultOptions.className + ' chimeraMedia-picker',
		content: '<x-hawkejs class="" data-type="block" data-name="mediaGalleryPicker"></x-hawkejs>',
		afterOpen: function($vexContent) {
			hawkejs.scene.openUrl('/chimera/media_gallery/media_files/gallery_picker', {history: false}, function(err, viewRender) {

				var $bar = $('.progress-bar', $vexContent),
				    $fileupload = $('.fileupload', $vexContent);

				$fileupload.fileupload({
					url: '/media/upload',
					dataType: 'json',
					formData: {},
					done: function (e, data) {

						var renderer = new hawkejs.constructor.ViewRender(hawkejs),
						    file = data.result.files[0],
						    html;

						renderer.initHelpers();

						html = '<figure class="chimeraGallery-thumb" data-id="' + file.id + '" style="';
						html += renderer.helpers.Media.imageCssSet(file.id, {profile: 'pickerThumb'});
						html += '"><div class="chimeraGallery-thumbInfo"><span>Select</span></div></figure>';

						$('.chimeraGallery-pickup', $vexContent).after(html);
						$bar.css('width', '');
					},
					progressall: function (e, data) {
						var progress = parseInt(data.loaded / data.total * 100, 10);
						$bar.css('width', progress + '%');
					}
				});

				$vexContent.on('click', '.chimeraGallery-thumb', function onThumbClick(e) {

					var $thumb = $(this),
					    id = $thumb.data('id');

					madeSelection = true;

					if (callback) {
						callback(null, id);
					}

					vex.close();
				});
			});
		},
		afterClose: function() {
			if (!madeSelection && callback) {
				callback(null, false);
			}
		}
	});
}
});