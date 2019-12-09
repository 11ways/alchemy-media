var path      = alchemy.use('path'),
    Veronica  = alchemy.use('veronica'),
    fs        = alchemy.use('fs');

// Define the default options
var options = {

	// The path to use in the url
	url: '/media/image',

	// Where to store the files
	path: path.resolve(PATH_ROOT, 'files'),

	// Which hash function to use
	hash: 'sha1',

	// Enable webp
	webp: true,

	// Temporary map for intermediate file changes
	scratch: path.resolve(PATH_TEMP, 'scratch'),

	// The cache map for resized images & thumbnails
	cache: path.resolve(PATH_TEMP, 'imagecache')
};

// Inject the user-overridden options
alchemy.plugins.media = Object.assign(options, alchemy.plugins.media);

// Find the paths to these binaries
options.convert = alchemy.findPathToBinarySync('convert', options.convert);
options.exiv2 = alchemy.findPathToBinarySync('exiv2', options.exiv2);
options.cwebp = alchemy.findPathToBinarySync('cwebp', options.cwebp);

// Make sure these folders exist
alchemy.createDir(options.scratch);
alchemy.createDir(options.cache);

// Create routes
Router.get('Media::static', /\/media\/static\/(.*)*/, 'MediaFile#serveStatic');
Router.get('Media::image', options.url + '/{id}', 'MediaFile#image');

Router.get('MediaFile#info', '/media/info', 'MediaFile#info');

// Allow dummy extensions
Router.get('Media::fileextension', '/media/file/{id}.{extension}', 'MediaFile#file');

// Allow direct file downloads
Router.get('Media::file', '/media/file/{id}', 'MediaFile#file');
Router.get('Media#download', '/media/download/{id}', 'MediaFile#downloadFile');

Router.get('Media::thumb', '/media/thumbnail/{id}', 'MediaFile#thumbnail');
Router.get('Media::placeholder', '/media/placeholder', 'MediaFile#placeholder');
Router.post('Media::upload', '/media/upload', 'MediaFile#upload');
Router.post('Media::uploadsingle', '/media/uploadsingle', 'MediaFile#uploadsingle');

var profiles = alchemy.shared('Media.profiles');

// Create a new veronica instance
options.veronica = new Veronica({
	cwebp: options.cwebp,
	temp: options.scratch,
	cache: options.cache
});

alchemy.hawkejs.addRawHtml(`<script>document.cookie = 'mediaResolution=' + encodeURIComponent(JSON.stringify({width:Math.max(screen.availWidth||0, window.outerWidth||0) || 1024,height:Math.max(screen.availHeight||0, window.outerHeight||0) || 768,dpr:window.devicePixelRatio}))</script>`);

/**
 * Register a profile under the given name
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.0.1
 *
 * @param    {String}   name
 * @param    {Object}   settings
 */
options.addProfile = function addProfile(name, settings) {
	profiles[name] = settings;
};

// Add the thumbnail profile
options.addProfile('thumbnail', {width: 100, height: 100});
options.addProfile('pickerThumb', {width: 250, height: 250});
options.addProfile('chimera-gallery', {width: 400, height: 400});