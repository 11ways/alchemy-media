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
	cache: path.resolve(PATH_TEMP, 'imagecache'),

	// Path to fontawesome pro
	fontawesome_pro: null,
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
Router.add({
	name             : 'MediaFile#serveStatic',
	methods          : ['get'],
	can_be_postponed : false,
	paths            : /\/media\/static\/(.*)*/,
});

Router.add({
	name             : 'MediaFile#image',
	methods          : ['get'],
	can_be_postponed : false,
	paths            : options.url + '/{id}',
});

// The prefix is added at the end of the route so it does not
// change the user's active_prefix
Router.add({
	name             : 'MediaFile#data',
	methods          : ['get'],
	can_be_postponed : false,
	paths            : '/media/data/{prefix}/{id}',
});

Router.add({
	name             : 'MediaFile#info',
	methods          : ['get'],
	can_be_postponed : false,
	paths            : '/media/info',
});

Router.add({
	name             : 'MediaFile#recordsource',
	methods          : ['get'],
	can_be_postponed : false,
	paths            : '/media/recordsource',
	permission       : 'media.recordsource',
});

// Allow dummy extensions
Router.add({
	name             : 'Media#fileextension',
	methods          : ['get'],
	can_be_postponed : false,
	paths            : '/media/file/{id}.{extension}',
	handler          : 'MediaFile#file'
});

// Allow direct file downloads
Router.add({
	name             : 'MediaFile#file',
	methods          : ['get'],
	can_be_postponed : false,
	paths            : '/media/file/{id}',
});

Router.add({
	name             : 'MediaFile#downloadFile',
	methods          : ['get'],
	can_be_postponed : false,
	paths            : '/media/download/{id}',
});

Router.add({
	name             : 'MediaFile#thumbnail',
	methods          : ['get'],
	can_be_postponed : false,
	paths            : '/media/thumbnail/{id}',
});

Router.add({
	name             : 'MediaFile#placeholder',
	methods          : ['get'],
	can_be_postponed : false,
	paths            : '/media/placeholder',
});

Router.add({
	name             : 'MediaFile#upload',
	methods          : ['post'],
	can_be_postponed : false,
	paths            : '/media/upload',
});

Router.add({
	name             : 'MediaFile#uploadsingle',
	methods          : ['post'],
	can_be_postponed : false,
	paths            : '/media/uploadsingle',
});

var profiles = alchemy.shared('Media.profiles');

// Create a new veronica instance
options.veronica = new Veronica({
	cwebp: options.cwebp,
	temp: options.scratch,
	cache: options.cache
});

alchemy.hawkejs.addRawHtml(`<script>document.cookie = 'mediaResolution=' + encodeURIComponent(JSON.stringify({width:Math.max(screen.availWidth||0, window.outerWidth||0) || 1024,height:Math.max(screen.availHeight||0, window.outerHeight||0) || 768,dpr:window.devicePixelRatio}))</script>`);

if (options.fontawesome_pro) {
	alchemy.exposeStatic('fontawesome_pro', options.fontawesome_pro);
}

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