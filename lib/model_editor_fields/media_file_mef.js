/**
 * The Media File field type
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('ModelEditorField', function MediaFileMEF() {

	/**
	 * Use the media_file input view for editing & viewing
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Function}   callback
	 */
	this.input = function input(callback) {
		this.fieldView = 'media_file';
		callback();
	};

	/**
	 * Render an image in the index list
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Function}   callback
	 */
	this.index = function index(callback) {

		var files, i;
		
		if (this.value) {

			files = Array.cast(this.value);

			this.value = '';

			for (i = 0; i < files.length; i++) {
				this.value += '<img src="/media/thumbnail/' + files[i] + '" srcset="/media/file/' + files[i] + '?dpr=2 2x" class="centerblock" />';
			}
		}

		callback();
	};


	/**
	 * Modify the return value before saving
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.save = function save(callback) {

		if (!this.value) {
			this.value = undefined;
		}

		if (Array.isArray(this.value)) {

			// Cast everything to an objectid
			this.value.forEach(function(value, index, arr) {
				arr[index] = alchemy.castObjectId(value);
			});

			// Remove all the non-objectids
			this.value.clean(undefined);
		};

		callback();
	};

});