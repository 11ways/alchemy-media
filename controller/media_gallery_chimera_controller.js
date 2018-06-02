/**
 * The Media Gallery Gallery Controller class
 *
 * @author        Jelle De Loecker   <jelle@develry.be>
 * @since         0.2.0
 * @version       0.3.0
 */
var MediaGallery = Function.inherits('Alchemy.Controller.Chimera.Editor', function MediaGallery(conduit, options) {

	MediaGallery.super.call(this, conduit, options);

	this.addComponent('paginate');

	this.addAction('model', 'gallery', {title: 'Gallery'});

	// Remove the "index" action
	var types = this.getActions('model');
	types.set('index', null);
});

/**
 * The gallery action
 *
 * @param   {Conduit}   conduit
 */
MediaGallery.setAction(function gallery(conduit) {
	return this.doAction('listing', [conduit, 'gallery']);
});

/**
 * The gallery_picker action
 *
 * @param   {Conduit}   conduit
 */
MediaGallery.setAction(function gallery_picker(conduit) {
	return this.doAction('listing', [conduit, 'gallery', 'gallery_picker']);
});