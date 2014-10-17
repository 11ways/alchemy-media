/**
 * The Media Gallery Gallery Controller class
 *
 * @author        Jelle De Loecker   <jelle@codedor.be>
 * @since         1.0.0
 * @version       1.0.0
 */
var MediaGallery = Function.inherits('EditorChimeraController', function MediaGalleryChimeraController(conduit, options) {

	MediaGalleryChimeraController.super.call(this, conduit, options);

	this.addComponent('paginate');

	this.addAction('model', 'gallery', {title: 'Gallery'});
});

/**
 * The gallery action
 *
 * @param   {Conduit}   conduit
 */
MediaGallery.setMethod(function gallery(conduit) {
	return this.listing(conduit, 'gallery');
});

/**
 * The gallery_picker action
 *
 * @param   {Conduit}   conduit
 */
MediaGallery.setMethod(function gallery_picker(conduit) {
	return this.listing(conduit, 'gallery', 'gallery_picker');
});