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
var MediaFiles = Function.inherits('Alchemy.Controller', function MediaFile(conduit, options) {
	MediaFile.super.call(this, conduit, options);
});

/**
 * Serve a thumbnail
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.4.1
 *
 * @param    {Conduit}   conduit
 */
MediaFiles.setAction(function thumbnail(conduit, id) {

	if (!id) {
		return conduit.notFound('No valid id given');
	}

	// Get the requested file
	this.getModel('MediaFile').getFile(id, function gotFile(err, record) {

		var Type;

		if (err) {
			return conduit.notFound(err);
		}

		Type = MediaTypes[record.type];

		if (!Type) {
			Type = Classes.Alchemy.MediaType;
		}

		if (Type) {
			Type = new Type();
			Type.thumbnail(conduit, record);
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

	console.log('Serving static', conduit, path);

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
 * @version  0.4.1
 *
 * @param    {Conduit}   conduit
 */
MediaFiles.setAction(function image(conduit, id) {

	if (!id) {
		return this.placeholder(conduit, {text: 'Invalid image ID', status: 404});
	}

	this.getModel('MediaFile').getFile(id, function gotFile(err, record) {

		var Image = new MediaTypes.image;

		if (!record) {
			return Image.placeholder(conduit, {text: 404, status: 404});
		}

		Image.serve(conduit, record);
	});
});

/**
 * Serve a file
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.4.1
 *
 * @param    {Conduit}   Conduit
 */
MediaFiles.setAction(function file(conduit, id, extension) {

	if (!id) {
		return conduit.notFound('No valid id given');
	}

	this.getModel('MediaFile').getFile(id, function(err, file, record) {

		var Type;

		if (err) {
			return conduit.error(err);
		}

		if (!file) {
			return conduit.notFound('File not found');
		}
		
		Type = MediaTypes[file.type];

		if (Type) {
			Type = new Type();
			Type.serve(conduit, record);
		} else {
			conduit.error('Error serving type ' + file.type);
		}
	});
});

/**
 * Handle file uploads
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.4.1
 *
 * @param    {Conduit}   conduit
 */
MediaFiles.setAction(function upload(conduit) {

	var MediaFile = this.getModel('MediaFile'),
	    files = conduit.files,
	    tasks = [],
	    file,
	    key;

	// Iterate over every file
	Object.each(files, function eachFile(file, key) {

		tasks[tasks.length] = function storeFile(next) {
			var options = {
				move: true,
				filename: file.name
			},
			    name;

			name = file.name.split('.');

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