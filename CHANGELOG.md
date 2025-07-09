## 0.9.0-alpha.5 (WIP)

* Add `size` to the media file chooser
* Allow using filters in the table
* Limit the height of the media file chooser

## 0.9.0-alpha.4 (2024-10-10)

* Make `MediaRaw#addFile(url)` support data uris too

## 0.9.0-alpha.3 (2024-08-16)

* Implement Alchemy v1.4 `Field` changes

## 0.9.0-alpha.2 (2024-02-19)

* Add `getFile()` method to `MediaFile` and `MediaRaw` documents

## 0.9.0-alpha.1 (2024-02-15)

* Upgrade to Alchemy v1.4.0

## 0.8.0 (2023-10-17)

* Upgrade `@11ways/exiv2` to v0.7.0

## 0.7.6 (2023-10-05)

* Let `Media#imageUrl()` helper handle image instructions that start with a slash

## 0.7.5 (2023-07-28)

* Remove old reference to `chimera/mediafield` script
* Add upload percentage feedback to `al-file` element

## 0.7.4 (2023-03-13)

* By default, conceal SVGs that have the `graphics-symbol` role from assistive technologies

## 0.7.3 (2023-02-26)

* Add `Media#downloadImage()` method to the Media helper
* Add `al-icon-stack` element, to stack items on top of each other
* Fix `svg` files not being able to be uploaded or served
* Round image resizes to the highest 100 pixels
* Add `max_page_width` plugin option, which will be applied to the user's max screen size

## 0.7.2 (2023-01-23)

* Make `al-icon` center its contents
* Make the file upload action use the extra given filename
* Rename most route names & make them not-postponable

## 0.7.1 (2022-12-23)

* Cascade `al-svg` role attribute to child `svg` elements
* Add `img` role fallback when using `graphics-symbol`
* Also add default role to `al-icon` element
* Make `al-file` catch errors and report them to a possible `al-field` parent
* Add the `accept` attribute to `al-file`
* Add the `accept` option to `File` fields
* Add `width_hint` field to `image` widget. This field allows users to specify the approximate maximum width of an image in pixels or as a percentage of the total page width.
* Add `lazy_load` field to `image` widget

## 0.7.0 (2022-11-02)

* Use the `al-` prefix for custom elements
* Rename `al-ico` to `al-icon`
* Allow selecting existing uploaded files in an `al-file` element

## 0.6.4 (2022-10-13)

* Add the `Media#loadIconFont()` helper method
* Make the `image` route serve up filetype thumbnails for non-images
* Add file preview image to the chimera edit view of MediaFile
* Add thumbnail column to MediaFile chimera index view
* Add `prefix` parameter to the `MediaFile#data` route

## 0.6.3 (2022-07-23)

* Fix `al-file` element showing wrong buttons on load
* Always add `role="presentation"` to images that get a simple placeholder
* Add support for Fontawesome Pro with the `media.fontawesome_pro` setting

## 0.6.2 (2022-07-06)

* Upgrade to Fontawesome 6
* Update `al-file` element
* Allow supplying a custom route for the !Media directive with `+` variables

## 0.6.1 (2022-06-02)

* Do not use `cwebp` if the binary could not be found

## 0.6.0 (2021-09-12)

* Add Media directive, which will load extra info (like alt & title attribute) for an image element automatically
* If an image identifier is a valid hexadecimal string, it is assumed a record is wanted. If not, it's a static image. (We only used to check for ObjectIDs)

## 0.5.0 (2020-07-21)

* Throw error when path to serve is not a string
* Make compatible with Alchemy v1.1.0
* Always convert image to webp if supported by the browser
* Accept vw & vh instead of % in width & height parameters
* Allow downloading original file
* Remove the `faced` support

## 0.4.2 (2018-12-06)

* Fix generating thumbnail for records without a MediaRaw
* `Media#image()` helper now accepts documents, and will use their alt & title tag if available
* Add `alt` and `title` field to `MediaFile`, which can now be edited in chimera
* Also serve images with "inline" disposition & filename

## 0.4.1 (2018-08-27)

* `image-set` still has no support in Firefox & IE, so...
* If `window.devicePixelRatio` is available it's stored in the `mediaResolution` cookie, and then THAT will be used if an image request has no DPR set
* Default resolution basis to 1920x1080 instead of 1024x768

## 0.4.0 (2017-08-27)

* Temporary files will now include an 'alchemy_' and pseudohex prefix
* Placeholders are now 300x300 by default
* Add `origin` field to MediaRaw model
* Upgrade `veronica` version, will no longer make images bigger when resizing

## 0.2.0 (2016-05-30)

* Dependency updates
* Media field fixes

## 0.1.0

* Add media helpers
* Add placeholder methods
* Allow percentage widths (of user's creen or maxWidth)

## 0.0.1 (2014-02-21)

* Initial commit
