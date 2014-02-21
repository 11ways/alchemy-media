/**
 * Media File Model
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
Model.extend(function MediaFileModel() {

	this.preInit = function preInit() {

		this.parent();

		this.belongsTo = {
			MediaFile: {
				modelName: 'MediaRaw',
				foreignKey: 'media_raw_id'
			}
		};

		this.blueprint = {
			media_raw_id: {
				type: 'ObjectId'
			},
			name: {
				type: 'String'
			},
			filename: {
				type: 'String'
			},
			extra: {
				type: 'Object'
			}
		};
	};


});