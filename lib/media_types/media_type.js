var MediaTypes = alchemy.shared('Media.types'),
    icons      = alchemy.shared('Media.icons'),
    fs         = alchemy.use('fs'),
    mime       = alchemy.use('mime'),
    path       = alchemy.use('path'),
    useragent  = alchemy.use('useragent'),
    MediaType;

/**
 * The Media Type class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
MediaType = alchemy.create(function MediaType() {

	var veronica = alchemy.plugins.media.veronica;

	this.title = 'Media';
	this.typeName = 'media';

	// The typemap to match agains.
	// The default class matches everything with a low score
	this.typeMap = {};

	/**
	 * Set type names
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Function}   parent   The parent class
	 * @param    {Function}   child    The (extended) child class
	 */
	this.__extended__ = function __extended__(parentType, childType) {

		// Remove AclType from the name
		var typeName = childType.name.replace(/MediaType$/, '');

		// childType the names in the prototype
		childType.prototype.title = typeName;

		typeName = typeName.underscore();

		childType.prototype.typeName = typeName;

		// Do not let the child inherit the extendonly setting
		if (!childType.prototype.hasOwnProperty('extendonly')) {
			childType.prototype.extendonly = false;
		}

		// Do not inherit the typemap
		if (!childType.prototype.hasOwnProperty('typeMap')) {
			childType.prototype.typeMap = {};
		}

		// Create a new instance if this is a useable type
		if (!childType.prototype.extendonly) {
			MediaTypes[typeName] = childType;
		}
	};

	/**
	 * See if we can use webp
	 */
	this.supportsWebp = function supportsWebp(render) {
		
		var req      = render.req,
		    result   = false,
		    uaString,
		    agent,
		    is;

		// If webp has been disabled, return false
		if (!alchemy.plugins.media.webp) {
			return false;
		}

		// If it's already in the session, return that value
		if (typeof req.session.supportsWebp !== 'undefined') {
			return req.session.supportsWebp;
		}

		// Check the request headers
		if (req.headers.accept.indexOf('image/webp') !== -1){
			result = true;
		} else {

			// Get the user agent string from the headers
			uaString = req.headers['user-agent'];

			// Start parsing the string
			is = useragent.is(uaString);
			agent = useragent.parse(uaString);

			// Enable webp support on chrome, opera & android
			if ((is.chrome && agent.satisfies('>=23.0.0'))
				|| (is.opera && agent.satisfies('>=12.1'))
				|| (is.android && agent.satisfies('>=4.0'))){
				result = true;
			}
		}

		// Write the result to the session
		req.session.supportsWebp = result;

		return result;
	};

	/**
	 * Get the Display Pixel Ratio of the user
	 * as given to us in a GET parameter
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {renderCallback}
	 */
	this.getDpr = function getDpr(render) {

		var dpr = 1,
		    parameter = Number(render.req.query.dpr);

		// Only allow valid ratios smaller than 10
		if (parameter && parameter < 10) {
			dpr = parameter;
		}

		return dpr;
	};

	/**
	 * Generate a thumbnail of this type
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Render}
	 * @param    {Object}
	 */
	this.thumbnail = function thumbnail(render, record) {

		// Get the extension according to the raw file's mimetype
		var extension = mime.extension(record.MediaRaw.mimetype),
		    iconfile  = '_blank.png',
		    dimension = 100 * this.getDpr(render),
		    options   = {},
		    iconPath;

		if (icons[extension]) {
			iconfile = icons[extension];
		}

		iconPath = path.resolve(icons._location, iconfile);

		// Set the square dimensions
		options.width = dimension;
		options.height = dimension;

		if (this.supportsWebp(render)) {
			options.type = 'webp';
		}

		veronica.getResizedImage(iconPath, options, function(err, resizedPath) {

			// @todo: serve an error image
			if (err) {
				return render.res.end(''+err);
			}

			render.serveFile(resizedPath);
		});
	};

	/**
	 * Serve the file in the given record to the client
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Render}
	 * @param    {Object}
	 */
	this.serve = function serve(render, record) {

		render.res.writeHead(200, {
			'Content-Type': record.MediaRaw.mimetype,
			'Content-Length': record.MediaRaw.size
		});

		var readStream = fs.createReadStream(record.MediaFile.path);
		readStream.pipe(render.res);
	};

	/**
	 * Some identical files can produce different hashes because of
	 * embedded meta-data.
	 * This method should strip out the meta data,
	 * so it can be stored inside MediaFile instead of MediaRaw
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.normalize = function normalize(filePath, baseInfo, callback) {
		pr(filePath)
		pr(baseInfo, true);
	};

});

MediaTypes.media = MediaType;

/**
 * Determine with MediaType to use,
 * defaults to the base class MediaType by default.
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 *
 * @param    {String}      mimeType
 *
 * @return   {MediaType}   A new instance of the class to use
 */
MediaType.determineType = function determineType(mimeType) {

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

	return new useType();
};