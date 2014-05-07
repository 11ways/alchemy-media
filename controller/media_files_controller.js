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
 * @version       0.0.1
 */
Controller.extend(function MediaFilesController (){

	/**
	 * Serve a thumbnail
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {renderCallback}   render
	 */
	this.thumbnail = function thumbnail(render) {

		// Get the requested file
		this.getModel('MediaFile').getFile(render.req.params.id, function(err, file, record) {

			var Type;

			if (err) {
				return render.res.end(String(err));
			}

			Type = MediaTypes[file.type];

			if (Type) {
				Type = new Type();
				Type.thumbnail(render, record);
			} else {
				render.res.end('Error generating thumbnail of ' + file.type);
			}
		});
	};

	/**
	 * Serve a placeholder
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @param    {renderCallback}   render
	 */
	this.placeholder = function placeholder(render) {
		var Image = new MediaTypes.image;
		return Image.placeholder(render, render.req.query);
	};

	/**
	 * Serve an image file
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.1.0
	 *
	 * @param    {renderCallback}   render
	 */
	this.image = function image(render) {

		this.getModel('MediaFile').getFile(render.req.params.id, function(err, file, record) {

			var Image = new MediaTypes.image;

			if (!file) {
				return Image.placeholder(render, {text: 404});
			}

			Image.serve(render, record);
		});
	};

	/**
	 * Serve a file
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.1.0
	 *
	 * @param    {renderCallback}   render
	 */
	this.file = function file(render) {

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

	};

	/**
	 * Handle file uploads
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {renderCallback}   render
	 */
	this.upload = function upload(render) {

		var MediaFile = this.getModel('MediaFile'),
		    files = render.req.files || {},
		    tasks = [],
		    file,
		    key;

		// Iterate over every file
		Object.each(files, function(file, key) {
			tasks[tasks.length] = function storeFile(next) {
				var options = {
					move: true,
					filename: file.originalFilename
				},
				    name;

				name = file.originalFilename.split('.');

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
		async.parallel(tasks, function(err, result) {

			var files = [];

			result.forEach(function(file, index) {
				files.push({
					name: file.filename,
					media_raw_id: file.media_raw_id,
					id: file._id
				});
			});

			render.res.send(200, JSON.stringify({files: files}))
		});
	};

});
