## 0.7.0 (WIP)

* Use the `al-` prefix for custom elements
* Rename `al-ico` to `al-icon`

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
