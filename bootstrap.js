const profiles = alchemy.shared('Media.profiles');

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
Plugin.addProfile = function addProfile(name, settings) {
	profiles[name] = settings;
};

// Add the thumbnail profile
Plugin.addProfile('thumbnail', {width: 100, height: 100});
Plugin.addProfile('pickerThumb', {width: 250, height: 250});
Plugin.addProfile('chimera-gallery', {width: 400, height: 400});