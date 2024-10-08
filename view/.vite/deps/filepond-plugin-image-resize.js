import "./chunk-V4OQ3NZ2.js";

// node_modules/filepond-plugin-image-resize/dist/filepond-plugin-image-resize.esm.js
var isImage = (file) => /^image/.test(file.type);
var getImageSize = (url, cb) => {
  let image = new Image();
  image.onload = () => {
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    image = null;
    cb({ width, height });
  };
  image.onerror = () => cb(null);
  image.src = url;
};
var plugin = ({ addFilter, utils }) => {
  const { Type } = utils;
  addFilter(
    "DID_LOAD_ITEM",
    (item, { query }) => new Promise((resolve, reject) => {
      const file = item.file;
      if (!isImage(file) || !query("GET_ALLOW_IMAGE_RESIZE")) {
        return resolve(item);
      }
      const mode = query("GET_IMAGE_RESIZE_MODE");
      const width = query("GET_IMAGE_RESIZE_TARGET_WIDTH");
      const height = query("GET_IMAGE_RESIZE_TARGET_HEIGHT");
      const upscale = query("GET_IMAGE_RESIZE_UPSCALE");
      if (width === null && height === null) return resolve(item);
      const targetWidth = width === null ? height : width;
      const targetHeight = height === null ? targetWidth : height;
      const fileURL = URL.createObjectURL(file);
      getImageSize(fileURL, (size) => {
        URL.revokeObjectURL(fileURL);
        if (!size) return resolve(item);
        let { width: imageWidth, height: imageHeight } = size;
        const orientation = (item.getMetadata("exif") || {}).orientation || -1;
        if (orientation >= 5 && orientation <= 8) {
          [imageWidth, imageHeight] = [imageHeight, imageWidth];
        }
        if (imageWidth === targetWidth && imageHeight === targetHeight)
          return resolve(item);
        if (!upscale) {
          if (mode === "cover") {
            if (imageWidth <= targetWidth || imageHeight <= targetHeight)
              return resolve(item);
          } else if (imageWidth <= targetWidth && imageHeight <= targetWidth) {
            return resolve(item);
          }
        }
        item.setMetadata("resize", {
          mode,
          upscale,
          size: {
            width: targetWidth,
            height: targetHeight
          }
        });
        resolve(item);
      });
    })
  );
  return {
    options: {
      // Enable or disable image resizing
      allowImageResize: [true, Type.BOOLEAN],
      // the method of rescaling
      // - force => force set size
      // - cover => pick biggest dimension
      // - contain => pick smaller dimension
      imageResizeMode: ["cover", Type.STRING],
      // set to false to disable upscaling of image smaller than the target width / height
      imageResizeUpscale: [true, Type.BOOLEAN],
      // target width
      imageResizeTargetWidth: [null, Type.INT],
      // target height
      imageResizeTargetHeight: [null, Type.INT]
    }
  };
};
var isBrowser = typeof window !== "undefined" && typeof window.document !== "undefined";
if (isBrowser) {
  document.dispatchEvent(new CustomEvent("FilePond:pluginloaded", { detail: plugin }));
}
var filepond_plugin_image_resize_esm_default = plugin;
export {
  filepond_plugin_image_resize_esm_default as default
};
/*! Bundled license information:

filepond-plugin-image-resize/dist/filepond-plugin-image-resize.esm.js:
  (*!
   * FilePondPluginImageResize 2.0.10
   * Licensed under MIT, https://opensource.org/licenses/MIT/
   * Please visit https://pqina.nl/filepond/ for details.
   *)
*/
//# sourceMappingURL=filepond-plugin-image-resize.js.map
