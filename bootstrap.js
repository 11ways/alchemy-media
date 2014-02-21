var path = require('path');

// Define the default options
var options = {

	// The path to use in the url
	url: '/media/image',

	// Where to store the files
	path: path.resolve(PATH_ROOT, 'files'),

	// Which hash function to use
	hash: 'sha1',

	// The location of the exiv2 binary
	exiv2: '/usr/bin/exiv2'
};

// Inject the user-overridden options
alchemy.plugins.media = alchemy.inject(options, alchemy.plugins.media);

alchemy.connect('media::image', options.url + '/:id', {controller: 'media_file', action: 'image'});