let url_prefix = '/media/image';

// Create routes
Plugin.addRoute({
	name             : 'MediaFile#serveStatic',
	methods          : ['get'],
	can_be_postponed : false,
	paths            : /\/media\/static\/(.*)*/,
});

Plugin.addRoute({
	name             : 'MediaFile#image',
	methods          : ['get'],
	can_be_postponed : false,
	paths            : url_prefix + '/{id}',
});

// The prefix is added at the end of the route so it does not
// change the user's active_prefix
Plugin.addRoute({
	name             : 'MediaFile#data',
	methods          : ['get'],
	can_be_postponed : false,
	paths            : '/media/data/{prefix}/{id}',
});

Plugin.addRoute({
	name             : 'MediaFile#info',
	methods          : ['get'],
	can_be_postponed : false,
	paths            : '/media/info',
});

Plugin.addRoute({
	name             : 'MediaFile#recordsource',
	methods          : ['get'],
	can_be_postponed : false,
	paths            : '/media/recordsource',
	permission       : 'media.recordsource',
});

// Allow dummy extensions
Plugin.addRoute({
	name             : 'Media#fileextension',
	methods          : ['get'],
	can_be_postponed : false,
	paths            : '/media/file/{id}.{extension}',
	handler          : 'MediaFile#file'
});

// Allow direct file downloads
Plugin.addRoute({
	name             : 'MediaFile#file',
	methods          : ['get'],
	can_be_postponed : false,
	paths            : '/media/file/{id}',
});

Plugin.addRoute({
	name             : 'MediaFile#downloadFile',
	methods          : ['get'],
	can_be_postponed : false,
	paths            : '/media/download/{id}',
});

Plugin.addRoute({
	name             : 'MediaFile#thumbnail',
	methods          : ['get'],
	can_be_postponed : false,
	paths            : '/media/thumbnail/{id}',
});

Plugin.addRoute({
	name             : 'MediaFile#placeholder',
	methods          : ['get'],
	can_be_postponed : false,
	paths            : '/media/placeholder',
});

Plugin.addRoute({
	name             : 'MediaFile#upload',
	methods          : ['post'],
	can_be_postponed : false,
	paths            : '/media/upload',
});

Plugin.addRoute({
	name             : 'MediaFile#uploadsingle',
	methods          : ['post'],
	can_be_postponed : false,
	paths            : '/media/uploadsingle',
});