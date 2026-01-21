const libpath = require('path');

// system.plugins.media
const MEDIA_PLUGIN_GROUP = Plugin.getSettingsGroup();

MEDIA_PLUGIN_GROUP.addSetting('translatable', {
	type        : 'boolean',
	default     : false,
	description : 'Should file title & alt fields be translatable?',
});

MEDIA_PLUGIN_GROUP.addSetting('file_hash_algorithm', {
	type        : 'string',
	default     : 'sha1',
	description : 'The default file hash method',
});

MEDIA_PLUGIN_GROUP.addSetting('enable_webp', {
	type        : 'boolean',
	default     : true,
	description : 'Serve webp images when possible',
});

MEDIA_PLUGIN_GROUP.addSetting('file_storage_path', {
	type        : 'string',
	default     : libpath.resolve(PATH_ROOT, 'files'),
	description : 'Where to store uploaded files',
});


MEDIA_PLUGIN_GROUP.addSetting('cache_path', {
	type        : 'string',
	default     : libpath.resolve(PATH_TEMP, 'imagecache'),
	description : 'The cache map for resized images & thumbnails',
	action      : (value, value_instance) => {

		if (value) {
			alchemy.createDir(value);
		}

		createVeronicaInstance();
	},
});

MEDIA_PLUGIN_GROUP.addSetting('fontawesome_pro', {
	type        : 'string',
	default     : null,
	description : 'The URL to fontawesome pro',
	action      : (value, value_instance) => {
		alchemy.exposeStatic('fontawesome_pro', value);
	},
});

MEDIA_PLUGIN_GROUP.addSetting('max_page_width', {
	type        : 'integer',
	default     : null,
	description : 'Limit the maximum allowed page width, used for image resizing',
});

const BINARIES = MEDIA_PLUGIN_GROUP.createGroup('binaries');

BINARIES.addSetting('exiv2', {
	type        : 'string',
	default     : alchemy.findPathToBinarySync('exiv2'),
	description : 'The path to the `exiv2` binary',
});


/**
 * Recreate the Veronica instance
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 */
function createVeronicaInstance() {

	let Veronica = alchemy.use('veronica');
	const media = alchemy.settings.plugins.media;

	alchemy.plugins.media.veronica = new Veronica({
		cache  : media.cache_path,
	});
}