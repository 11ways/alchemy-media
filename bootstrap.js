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
	exiv2: '/usr/bin/exiv2',

	// Temporary map for intermediate file changes
	scratch: path.resolve(PATH_TEMP, 'scratch'),

	// The cache map for resized images & thumbnails
	cache: path.resolve(PATH_TEMP, 'imagecache')
};

// Inject the user-overridden options
alchemy.plugins.media = alchemy.inject(options, alchemy.plugins.media);

// Make sure these folders exist
alchemy.createDir(options.scratch);
alchemy.createDir(options.cache);

// Create routes
alchemy.connect('media::image', options.url + '/:id', {controller: 'media_file', action: 'image'});
alchemy.connect('media::file', '/media/file/:id', {controller: 'media_file', action: 'file'});
alchemy.connect('media::file', '/media/thumb/:id', {controller: 'media_file', action: 'thumb'});
alchemy.connect('media::upload', '/media/upload', {controller: 'media_file', action: 'upload'});

var profiles = alchemy.shared('Media.profiles');

// Add a new profile
options.addProfile = function addProfile(name, settings) {
	profiles[name] = settings;
};

options.addProfile('thumbnail', {width: 100, height: 100});
options.addProfile('thumbnail2x', {width: 200, height: 200});