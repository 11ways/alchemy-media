var MediaTypes = alchemy.shared('Media.types'),
    icons      = alchemy.shared('Media.icons'),
    fs         = alchemy.use('fs'),
    mime       = alchemy.use('mime'),
    path       = alchemy.use('path'),
    useragent  = alchemy.use('useragent'),
    Blast      = __Protoblast,
    MediaType;

Blast.on('extended', function(parent, child) {

	var typeName,
	    name;

	if (parent.name.endsWith('MediaType')) {
		name = child.name.beforeLast('MediaType') || 'Media';
		typeName = name.underscore();

		child.setProperty('title', name);
		child.setProperty('typeName', typeName);

		MediaTypes[typeName] = child;
	}
});

/**
 * The Media Type class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  1.0.0
 */
MediaType = Function.inherits(function MediaType(options) {

	var typeName;

	typeName = this.constructor.name.replace(/MediaType$/, '');

	this.veronica = alchemy.plugins.media.veronica;

	this.title = typeName || 'Media';
	this.typeName = this.title.underscore();
	this.options = options || {};

	// The typemap to match agains.
	// The default class matches everything with a low score
	this.typeMap = {};
});

/**
 * See if we can use webp
 *
 * @param   {Conduit}   conduit
 */
MediaType.setMethod(function supportsWebp(conduit) {

	var result   = false,
	    supportsWebp,
	    uaString,
	    agent,
	    is;

	// If webp has been disabled, return false
	if (!alchemy.plugins.media.webp) {
		return false;
	}

	supporstWebp = conduit.session('supportsWebp');

	// If it's already in the session, return that value
	if (supporstWebp != null) {
		return supporstWebp;
	}

	// Check the request headers
	if (conduit.headers.accept && conduit.headers.accept.indexOf('image/webp') !== -1){
		result = true;
	} else if (conduit.headers['user-agent']) {

		// Get the user agent string from the headers
		uaString = conduit.headers['user-agent'];

		// Start parsing the string
		is = useragent.is(uaString);
		agent = useragent.parse(uaString);

		if (typeof agent.satisfies != 'function') {
			console.log('Satisfies is not a function?', conduit.headers, uaString, is, agent);
		} else {

			// Enable webp support on chrome, opera & android
			if ((is.chrome && agent.satisfies('>=23.0.0'))
				|| (is.opera && agent.satisfies('>=12.1'))
				|| (is.android && agent.satisfies('>=4.0'))){
				result = true;
			}
		}
	}

	// Write the result to the session
	conduit.session('supportsWebp', result);

	return result;
});

/**
 * Get the Display Pixel Ratio of the user
 * as given to us in a GET parameter
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  1.0.0
 *
 * @param    {Conduit}   conduit
 */
MediaType.setMethod(function getDpr(conduit) {

	var dpr = 1,
	    parameter = Number(conduit.param('dpr'));

	// Only allow valid ratios smaller than 10
	if (parameter && parameter < 10) {
		dpr = parameter;
	}

	return dpr;
});

/**
 * Generate a thumbnail of this type
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  1.0.0
 *
 * @param    {Conduit}
 * @param    {Object}
 */
MediaType.setMethod(function thumbnail(conduit, record) {

	// Get the extension according to the raw file's mimetype
	var extension = mime.extension(record.MediaRaw.mimetype),
	    iconfile  = '_blank.png',
	    dimension = 100 * this.getDpr(conduit),
	    options   = {},
	    iconPath;

	if (icons[extension]) {
		iconfile = icons[extension];
	}

	iconPath = path.resolve(icons._location, iconfile);

	// Set the square dimensions
	options.width = dimension;
	options.height = dimension;

	if (this.supportsWebp(conduit)) {
		options.type = 'webp';
	}

	veronica.getResizedImage(iconPath, options, function(err, resizedPath) {

		// @todo: serve an error image
		if (err) {
			return render.res.end(''+err);
		}

		render.serveFile(resizedPath);
	});
});

/**
 * Serve the file in the given record to the client
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 *
 * @param    {Conduit}
 * @param    {Object}
 */
MediaType.setMethod(function serve(conduit, record) {

	render.res.writeHead(200, {
		'Content-Type': record.MediaRaw.mimetype,
		'Content-Length': record.MediaRaw.size
	});

	var readStream = fs.createReadStream(record.MediaFile.path);
	readStream.pipe(render.res);
});

/**
 * Some identical files can produce different hashes because of
 * embedded meta-data.
 * This method should strip out the meta data,
 * so it can be stored inside MediaFile instead of MediaRaw
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  1.0.0
 */
MediaType.setMethod(function normalize(filePath, baseInfo, callback) {
	console.log('Should normalize filepath', filePath, baseInfo);
});

MediaTypes.media = MediaType;

/**
 * Determine with MediaType to use,
 * defaults to the base class MediaType by default.
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  1.0.0
 *
 * @param    {String}      mimeType
 *
 * @return   {MediaType}   A new instance of the class to use
 */
MediaType.setStatic(function determineType(mimeType, options) {

	var typeClass,
	    typeName,
	    useScore,
	    useType,
	    match,
	    score,
	    proto,
	    rule,
	    type,
	    key;

	// The type to use by default is MediaType
	useType = MediaType;
	useScore = 1;

	// Go over every available type
	for (typeName in MediaTypes) {

		// Reset the score to 0
		score = 0;

		// Create a reference to this class
		typeClass = MediaTypes[typeName];

		// And to its prototype
		proto = typeClass.prototype;

		// Go over every entry in the typemap
		for (key in proto.typeMap) {

			// Create a reference to the rule
			rule = proto.typeMap[key];

			match = rule.regex.exec(mimeType);

			if (match && (rule.score > score || rule.score < 0)) {
				score = rule.score;
			}

			// If the score is under 0, this type is disqualified
			if (score < 0) {
				break;
			}
		};

		if (score > useScore) {
			useType = typeClass;
		}
	}

	return new useType(options);
});
