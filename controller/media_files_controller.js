var fs = require('fs'),
    MediaTypes = alchemy.getClassGroup('media_type'),
    MediaType  = Classes.Alchemy.MediaType,
    child      = require('child_process');

/**
 * The Media File Controller class
 *
 * @constructor
 * @extends       Alchemy.AppController
 *
 * @author        Jelle De Loecker   <jelle@develry.be>
 * @since         0.0.1
 * @version       0.3.0
 */
const MediaFiles = Function.inherits('Alchemy.Controller', 'MediaFile');

/**
 * Serve a thumbnail
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.6.4
 *
 * @param    {Conduit}   conduit
 */
MediaFiles.setAction(function thumbnail(conduit, id) {

	if (!id) {
		return conduit.notFound('No valid id given');
	}

	// Get the requested file
	this.getModel('MediaFile').getFile(id, function gotFile(err, record) {

		if (err) {
			return conduit.notFound(err);
		}

		const Type = MediaTypes[record.type] || Classes.Alchemy.MediaType;

		if (Type) {
			let instance = new Type();
			instance.thumbnail(conduit, record);
		} else {
			conduit.error('Error generating thumbnail of ' + record.type);
		}
	});
});

/**
 * Serve a placeholder
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.4.1
 *
 * @param    {Conduit}   conduit
 */
MediaFiles.setAction(function placeholder(conduit, options) {
	var Image = new MediaTypes.image;
	return Image.placeholder(conduit, options);
});

/**
 * Serve a static image file
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.4.1
 *
 * @param    {Conduit}   conduit
 */
MediaFiles.setAction(function serveStatic(conduit, path) {

	var Image = new MediaTypes.image;

	// Find the actual path to the image
	alchemy.findImagePath(path, function gotPath(err, image_path) {

		if (err) {
			return conduit.error(err);
		}

		return Image.serve(conduit, image_path);
	});
});


/**
 * Serve an image file
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.6.4
 *
 * @param    {Conduit}   conduit
 */
MediaFiles.setAction(function image(conduit, id) {

	if (!id) {
		return this.placeholder(conduit, {text: 'Invalid image ID', status: 404});
	}

	this.getModel('MediaFile').getFile(id, function gotFile(err, record) {

		if (err) {
			return conduit.error(err);
		}

		const Image = new MediaTypes.image;

		if (!record) {
			return Image.placeholder(conduit, {text: 404, status: 404});
		}

		if (record.type != 'image') {
			const Type = MediaTypes[record.type] || Classes.Alchemy.MediaType;
			let instance = new Type();
			return instance.thumbnail(conduit, record);
		}

		Image.serve(conduit, record);
	});
});

/**
 * Serve a file
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.5.0
 *
 * @param    {Conduit}   Conduit
 */
MediaFiles.setAction(function file(conduit, id, extension) {

	if (!id) {
		return conduit.notFound('No valid id given');
	}

	this.getModel('MediaFile').getFile(id, function gotFile(err, record) {

		var Type;

		if (err) {
			return conduit.error(err);
		}

		if (!record) {
			return conduit.notFound('File not found');
		}

		Type = MediaTypes[record.type];

		if (Type) {
			Type = new Type();
			Type.serve(conduit, record, {download: true});
		} else {
			conduit.error('Unable to serve unknown type "' + record.type + '"');
		}
	});
});

/**
 * Serve a file (not inline)
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.0
 * @version  0.5.0
 *
 * @param    {Conduit}   Conduit
 */
MediaFiles.setAction(function downloadFile(conduit, id, extension) {

	if (!id) {
		return conduit.notFound('No valid id given');
	}

	this.getModel('MediaFile').getFile(id, function gotFile(err, record) {

		var Type;

		if (err) {
			return conduit.error(err);
		}

		if (!record) {
			return conduit.notFound('File not found');
		}

		Type = MediaTypes[record.type];

		if (Type) {
			Type = new Type();
			Type.serve(conduit, record, {download: true, inline: false});
		} else {
			conduit.error('Unable to serve unknown type "' + record.type + '"');
		}
	});

});

/**
 * Handle file uploads
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.4.2
 *
 * @param    {Conduit}   conduit
 */
MediaFiles.setAction(function upload(conduit) {

	var MediaFile = this.getModel('MediaFile'),
	    files = conduit.files,
	    tasks = [],
	    file;

	if (files && files.files && typeof files.files == 'object') {
		files = files.files;
	}

	// Iterate over every file
	Object.each(files, function eachFile(file, key) {

		tasks[tasks.length] = function storeFile(next) {
			let options = {
				move: true,
				filename: file.name
			};

			let name = file.name.split('.');

			// Remove the last piece if there are more than 1
			if (name.length > 1) {
				name.pop();
			}

			// Join them again
			name = name.join('.');

			options.name = name;

			MediaFile.addFile(file.path, options, next);
		};
	});

	// Store every file
	Function.parallel(tasks, function storedFiles(err, result) {

		var files;

		if (err) {
			return conduit.error(err);
		}

		files = [];

		result.forEach(function eachStoredFile(file, index) {
			files.push({
				id            : file._id,
				_id           : file._id,
				name          : file.filename,
				media_raw_id  : file.media_raw_id,
			});
		});

		conduit.send({files: files})
	});
});

/**
 * Upload a single file and return the path
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.4.1
 *
 * @param    {Conduit}   conduit
 */
MediaFiles.setAction(function uploadsingle(conduit) {

	var MediaFile = this.getModel('MediaFile'),
	    options,
	    files = conduit.files,
	    file = files.file,
	    name;

	options = {
		move: true,
		filename: file.name
	};

	name = file.name.split('.');

	// Remove the last piece if there are more than 1
	if (name.length > 1) {
		name.pop();
	}

	// Join them again
	name = name.join('.');

	options.name = name;

	MediaFile.addFile(file.path, options, function afterAdd(err, result) {

		if (err) {
			return conduit.error(err);
		}

		conduit.response.end('/media/image/' + result._id);
	});
});

/**
 * Get the file data
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.5.1
 * @version  0.6.4
 *
 * @param    {Conduit}     conduit
 * @param    {ObjectId}    media_file_id
 */
MediaFiles.setAction(async function data(conduit, prefix, media_file_id) {

	conduit.prefix = prefix;

	let media_file = await this.model.findById(media_file_id);

	if (!media_file) {
		return conduit.notFound();
	}

	conduit.setHeader('cache-control', 'public, max-age=3600, must-revalidate');

	conduit.end({
		name   : media_file.name,
		alt    : media_file.alt,
		title  : media_file.title
	});
});

/**
 * Get info on a file
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.4.1
 * @version  0.4.1
 *
 * @param    {Conduit}   conduit
 * @param    {String}    path
 */
MediaFiles.setAction(function info(conduit) {

	var Image = new MediaTypes.image,
	    path = conduit.param('path');

	if (!path) {
		return conduit.error(new Error('No valid path given'));
	}

	// Find the actual path to the image
	alchemy.findImagePath(path, function gotPath(err, image_path) {

		if (err) {
			return conduit.error(err);
		}

		var image = Image.veronica.image(image_path);

		image.size(function gotSize(err, size) {

			if (err) {
				return conduit.error(err);
			}

			conduit.setHeader('cache-control', 'public, max-age=3600, must-revalidate');

			conduit.end(size);
		});
	});
});

/**
 * Recordsource action
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @param    {Conduit}   conduit
 */
MediaFiles.setAction(async function recordsource(conduit) {

	const model = this.model;

	let crit = model.find();

	model.disableTranslations();

	let page_size = conduit.param('page_size'),
	    filters = conduit.param('filters'),
	    fields = conduit.param('fields'),
	    page = conduit.param('page'),
	    sort = conduit.param('sort');
	
	if (fields) {

		// @TODO: fix FieldSet being sent with regular json?
		if (fields.fields) {
			fields = fields.fields;
		}

		crit.select(fields);
	}

	if (page_size && !page) {
		page = 1;
	}

	if (page) {
		crit.page(page, page_size);
	}

	if (sort?.field && sort?.dir) {
		crit.sort([sort.field, sort.dir]);
	}

	if (filters) {
		let key,
		    val;

		for (key in filters) {
			val = filters[key];

			// The value should always be a string,
			// so anything that is falsy can be ignored
			if (!val) {
				continue;
			}

			val = RegExp.interpretWildcard('*' + val + '*', 'i');
			crit.where(key).equals(val);
		}
	}

	let records = await model.find('all', crit);
	
	conduit.end({
		records : records
	});
});