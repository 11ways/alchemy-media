var MediaTypes = alchemy.shared('Media.types'),
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