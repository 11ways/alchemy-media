(function() {

var MediaFields = [];

/**
 * The MediaFileInput class
 */
function MediaFileField($element) {

	// Get the index in the MediaFields array
	this.index = (MediaFields.push(this)-1);

	// The hawkejs element
	this.element = $element;

	// The original input
	this.input = $element.find('.chimeraEditor-input');

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

	// Add the wrapper after the hidden input
	this.input.after(this.wrapper);

	// And now put the hidden input into the wrapper
	this.wrapper.prepend(this.input);

	// Get the current value
	value = this.input.val();

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
	html = '<img src="/media/thumbnail/' + id + '" srcset="/media/file/' + id + '?dpr=2 2x" />';

	// Add the button to remove the image
	html += '<span class="remove">';
	html += '<span class="icon"><i class="fa fa-times fa-inverse"></i></span>';
	html += '<span class="message">Remove</span>';
	html += '</span>';

	// See if this is an arrayable field
	this.array = !!this.wrapper.parents('.mediafieldgroup').find('button[data-chimera-add-entry]').length;

	// Set the preview image
	this.preview.html(html);

	// Hide the controls
	this.controls.hide();

	// Set the value in the hidden input
	this.input.val(id);

	// Show the preview
	this.preview.show();

	// Attach a listener to the remove button
	$('.remove .icon, .remove .message', this.preview).click(function() {
		that.removeFile();
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

	that.element.data('new-value', null);
};

/**
 * Set the controls
 */
MediaFileField.prototype.setControls = function setControls() {

	var that = this,
	    $progress,
	    $bar,
	    html;

	html = '<span class="btn btn-success fileinput-button">';
	html += '<i class="fa fa-plus"></i>';
	html += '<span>Select files...</span>';
	html += '<input class="fileupload" type="file" name="newfile">';
	html += '</span>';
	html += '<div class="progress">';
	html += '<div class="progress-bar progress-bar-success"></div>';
	html += '</div>';

	// Remove the current value
	this.input.val('');

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
			that.element.data('new-value', file.id);
		},
		progressall: function (e, data) {
			var progress = parseInt(data.loaded / data.total * 100, 10);
			$bar.css('width', progress + '%');
		}
	})
};

// Listen to the mediafield event, which tells us we need to init a new field
hawkejs.scene.on({type: 'create', implement: 'chimera/fields/file_edit'}, function(el) {
	new MediaFileField($(el));
});

}());