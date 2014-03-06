/**
 * The Media File field type
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('ModelEditorField', function MediaFileMEF() {

	this.input = function input(callback) {

		this.fieldView = 'media_file';

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