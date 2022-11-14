# Alchemy Media

The media plugin for the Alchemy MVC

## Installation

Just installing the npm package can be done like this:

    $ npm install alchemy-media

## Activate

You can activate the plugin by adding this to the main `bootstrap.js` file:

```javascript
alchemy.usePlugin('media', {});
```

The second parameter is an object containing options.
These are currently the default settings:

```javascript
var options = {

	// The path to use in the url
	url: '/media/image',

	// Where to store the files
	path: path.resolve(PATH_ROOT, 'files'),

	// Which hash function to use
	hash: 'sha1',

	// The location of the exiv2 binary
	exiv2: '/usr/bin/exiv2',

	// The location of cwebp
	cwebp: '/usr/bin/cwebp',

	// Enable webp
	webp: true,

	// Temporary map for intermediate file changes
	scratch: path.resolve(PATH_TEMP, 'scratch'),

	// The cache map for resized images & thumbnails
	cache: path.resolve(PATH_TEMP, 'imagecache')
};
```

`PATH_ROOT` points to the main project folder.
`PATH_TEMP` does not point to `/tmp`, but to the `temp` folder in the `PATH_ROOT` (main project) folder.

## Use

This plugin provides you with a Hawkejs helper to resize images on-the-fly (on request, actually).
This is how you create an image element using an image record id:

```ejs
<%= Media.image(image_id, {width: '50%'}) %>
```

Or using a static image asset:

```ejs
<%= Media.image('file_in_image_folder.jpg', {width: '25%', className: 'myclass'}) %>
```

The supplied width percentage isn't relative to the image itself, but to the user's screen resolution.

## System dependencies

You will have to install certain packages on your system,
you can do so like this on Debian/Ubuntu

Install the requirements of the `veronica` module:

    apt-get install graphicsmagick webp libgif-dev libcairo2-dev libpango1.0-dev libjpeg-dev librsvg2-dev

This plugin requires exiv2

    apt-get install exiv2 libexiv2-dev

This plugin requires libopencv packages

    apt-get install libopencv-dev

This plugin requires magick++

    apt-get install libmagick++-dev