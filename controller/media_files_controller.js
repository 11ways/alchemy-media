var fs = require('fs');

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

	this.image = function image(render) {

		console.time('Find image info')

		this.getModel('MediaFile').getFile(render.req.params.id, function(err, file) {

			console.timeEnd('Find image info')

			if (err) {
				render.res.end('Error: ' + err);
			} else {

				render.res.writeHead(200, {
					'Content-Type': file.mimetype,
					'Content-Length': file.size
				});

				var readStream = fs.createReadStream(file.path);
				readStream.pipe(render.res);
			}

		});

	};

});
