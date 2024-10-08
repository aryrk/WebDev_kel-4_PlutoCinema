import "./chunk-V4OQ3NZ2.js";

// node_modules/filepond-plugin-image-crop/dist/filepond-plugin-image-crop.esm.js
var isImage = (file) => /^image/.test(file.type);
var plugin = ({ addFilter, utils }) => {
  const { Type, isFile, getNumericAspectRatioFromString } = utils;
  const allowCrop = (item, query) => !(!isImage(item.file) || !query("GET_ALLOW_IMAGE_CROP"));
  const isObject = (value) => typeof value === "object";
  const isNumber = (value) => typeof value === "number";
  const updateCrop = (item, obj) => item.setMetadata("crop", Object.assign({}, item.getMetadata("crop"), obj));
  addFilter("DID_CREATE_ITEM", (item, { query }) => {
    item.extend("setImageCrop", (crop) => {
      if (!allowCrop(item, query) || !isObject(center)) return;
      item.setMetadata("crop", crop);
      return crop;
    });
    item.extend("setImageCropCenter", (center2) => {
      if (!allowCrop(item, query) || !isObject(center2)) return;
      return updateCrop(item, { center: center2 });
    });
    item.extend("setImageCropZoom", (zoom) => {
      if (!allowCrop(item, query) || !isNumber(zoom)) return;
      return updateCrop(item, { zoom: Math.max(1, zoom) });
    });
    item.extend("setImageCropRotation", (rotation) => {
      if (!allowCrop(item, query) || !isNumber(rotation)) return;
      return updateCrop(item, { rotation });
    });
    item.extend("setImageCropFlip", (flip) => {
      if (!allowCrop(item, query) || !isObject(flip)) return;
      return updateCrop(item, { flip });
    });
    item.extend("setImageCropAspectRatio", (newAspectRatio) => {
      if (!allowCrop(item, query) || typeof newAspectRatio === "undefined")
        return;
      const currentCrop = item.getMetadata("crop");
      const aspectRatio = getNumericAspectRatioFromString(newAspectRatio);
      const newCrop = {
        center: {
          x: 0.5,
          y: 0.5
        },
        flip: currentCrop ? Object.assign({}, currentCrop.flip) : {
          horizontal: false,
          vertical: false
        },
        rotation: 0,
        zoom: 1,
        aspectRatio
      };
      item.setMetadata("crop", newCrop);
      return newCrop;
    });
  });
  addFilter(
    "DID_LOAD_ITEM",
    (item, { query }) => new Promise((resolve, reject) => {
      const file = item.file;
      if (!isFile(file) || !isImage(file) || !query("GET_ALLOW_IMAGE_CROP")) {
        return resolve(item);
      }
      const crop = item.getMetadata("crop");
      if (crop) {
        return resolve(item);
      }
      const humanAspectRatio = query("GET_IMAGE_CROP_ASPECT_RATIO");
      item.setMetadata("crop", {
        center: {
          x: 0.5,
          y: 0.5
        },
        flip: {
          horizontal: false,
          vertical: false
        },
        rotation: 0,
        zoom: 1,
        aspectRatio: humanAspectRatio ? getNumericAspectRatioFromString(humanAspectRatio) : null
      });
      resolve(item);
    })
  );
  return {
    options: {
      // enable or disable image cropping
      allowImageCrop: [true, Type.BOOLEAN],
      // the aspect ratio of the crop ('1:1', '16:9', etc)
      imageCropAspectRatio: [null, Type.STRING]
    }
  };
};
var isBrowser = typeof window !== "undefined" && typeof window.document !== "undefined";
if (isBrowser) {
  document.dispatchEvent(
    new CustomEvent("FilePond:pluginloaded", { detail: plugin })
  );
}
var filepond_plugin_image_crop_esm_default = plugin;
export {
  filepond_plugin_image_crop_esm_default as default
};
/*! Bundled license information:

filepond-plugin-image-crop/dist/filepond-plugin-image-crop.esm.js:
  (*!
   * FilePondPluginImageCrop 2.0.6
   * Licensed under MIT, https://opensource.org/licenses/MIT/
   * Please visit https://pqina.nl/filepond/ for details.
   *)
*/
//# sourceMappingURL=filepond-plugin-image-crop.js.map
