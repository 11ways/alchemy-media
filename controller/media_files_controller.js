var fs = require('fs'),
    async      = alchemy.use('async'),
    MediaTypes = alchemy.shared('Media.types'),
    MediaType  = alchemy.classes.MediaType,
    child      = require('child_process');

/**
 * The Media File Controller class
 *
 * @constructor
 * @extends       alchemy.classes.AppController
 *
 * @author        Jelle De Loecker   <jelle@codedor.be>
 * @since         0.0.1
 * @version       1.0.0
 */
var MediaFiles = Function.inherits('Controller', function MediaFilesController(conduit, options) {
	this.constructor.super.call(this, conduit, options);
});

/**
 * Serve a thumbnail
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  1.0.0
 *
 * @param    {Conduit}   conduit
 */
MediaFiles.setMethod(function thumbnail(conduit, id) {

	if (!id) {
		return conduit.notFound('No valid id given');
	}

	// Get the requested file
	this.getModel('MediaFile').getFile(id, function gotFile(err, file, record) {

		var Type;

		if (err) {
			return conduit.notFound(err);
		}

		Type = MediaTypes[file.type];

		if (Type) {
			Type = new Type();
			Type.thumbnail(conduit, record);
		} else {
			conduit.error('Error generating thumbnail of ' + file.type);
		}
	});
});

/**
 * Serve a placeholder
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Conduit}   conduit
 */
MediaFiles.setMethod(function placeholder(conduit) {
	var Image = new MediaTypes.image;
	return Image.placeholder(conduit);
});

/**
 * Serve an image file
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.1.0
 *
 * @param    {Conduit}   conduit
 */
MediaFiles.setMethod(function image(conduit) {

	var id = conduit.param('id');

	if (!id) {
		return conduit.notFound('No valid id given');
	}

	this.getModel('MediaFile').getFile(id, function(err, file, record) {

		var Image = new MediaTypes.image;

		if (!file) {
			return Image.placeholder(conduit, {text: 404});
		}

		Image.serve(conduit, record);
	});
});

/**
 * Serve a file
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  1.0.0
 *
 * @param    {Conduit}   Conduit
 */
MediaFiles.setMethod(function file(conduit) {

	this.getModel('MediaFile').getFile(render.req.params.id, function(err, file, record) {

		var Type;

		if (!file) {
			return render.res.status(404).send('File not found!');
		}
		
		Type = MediaTypes[file.type];

		if (Type) {
			Type = new Type();
			Type.serve(render, record);
		} else {
			render.res.end('Error serving type ' + file.type);
		}
	});
});

/**
 * Handle file uploads
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 *
 * @param    {Conduit}   conduit
 */
MediaFiles.setMethod(function upload(conduit) {

	var MediaFile = this.getModel('MediaFile'),
	    files = conduit.files,
	    tasks = [],
	    file,
	    key;

	// Iterate over every file
	Object.each(files, function(file, key) {

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
			throw err;
		}

		files = [];

		result.forEach(function(file, index) {
			files.push({
				name: file.filename,
				media_raw_id: file.media_raw_id,
				id: file._id
			});
		});

		conduit.send(JSON.stringify({files: files}))
	});
});