import "./chunk-V4OQ3NZ2.js";

// node_modules/filepond-plugin-image-edit/dist/filepond-plugin-image-edit.esm.js
var isPreviewableImage = (file) => /^image/.test(file.type);
var plugin = (_) => {
  const { addFilter, utils, views } = _;
  const { Type, createRoute, createItemAPI = (item) => item } = utils;
  const { fileActionButton } = views;
  addFilter(
    "SHOULD_REMOVE_ON_REVERT",
    (shouldRemove, { item, query }) => new Promise((resolve) => {
      const { file } = item;
      const canEdit = query("GET_ALLOW_IMAGE_EDIT") && query("GET_IMAGE_EDIT_ALLOW_EDIT") && isPreviewableImage(file);
      resolve(!canEdit);
    })
  );
  addFilter(
    "DID_LOAD_ITEM",
    (item, { query, dispatch }) => new Promise((resolve, reject) => {
      if (item.origin > 1) {
        resolve(item);
        return;
      }
      const { file } = item;
      if (!query("GET_ALLOW_IMAGE_EDIT") || !query("GET_IMAGE_EDIT_INSTANT_EDIT")) {
        resolve(item);
        return;
      }
      if (!isPreviewableImage(file)) {
        resolve(item);
        return;
      }
      const createEditorResponseHandler = (item2, resolve2, reject2) => (userDidConfirm) => {
        editRequestQueue.shift();
        if (userDidConfirm) {
          resolve2(item2);
        } else {
          reject2(item2);
        }
        dispatch("KICK");
        requestEdit();
      };
      const requestEdit = () => {
        if (!editRequestQueue.length) return;
        const { item: item2, resolve: resolve2, reject: reject2 } = editRequestQueue[0];
        dispatch("EDIT_ITEM", {
          id: item2.id,
          handleEditorResponse: createEditorResponseHandler(
            item2,
            resolve2,
            reject2
          )
        });
      };
      queueEditRequest({ item, resolve, reject });
      if (editRequestQueue.length === 1) {
        requestEdit();
      }
    })
  );
  addFilter("DID_CREATE_ITEM", (item, { query, dispatch }) => {
    item.extend("edit", () => {
      dispatch("EDIT_ITEM", { id: item.id });
    });
  });
  const editRequestQueue = [];
  const queueEditRequest = (editRequest) => {
    editRequestQueue.push(editRequest);
    return editRequest;
  };
  addFilter("CREATE_VIEW", (viewAPI) => {
    const { is, view, query } = viewAPI;
    if (!query("GET_ALLOW_IMAGE_EDIT")) return;
    const canShowImagePreview = query("GET_ALLOW_IMAGE_PREVIEW");
    const shouldExtendView = is("file-info") && !canShowImagePreview || is("file") && canShowImagePreview;
    if (!shouldExtendView) return;
    const editor = query("GET_IMAGE_EDIT_EDITOR");
    if (!editor) return;
    if (!editor.filepondCallbackBridge) {
      editor.outputData = true;
      editor.outputFile = false;
      editor.filepondCallbackBridge = {
        onconfirm: editor.onconfirm || (() => {
        }),
        oncancel: editor.oncancel || (() => {
        })
      };
    }
    const openEditor = ({ root, props, action }) => {
      const { id } = props;
      const { handleEditorResponse } = action;
      editor.cropAspectRatio = root.query("GET_IMAGE_CROP_ASPECT_RATIO") || editor.cropAspectRatio;
      editor.outputCanvasBackgroundColor = root.query("GET_IMAGE_TRANSFORM_CANVAS_BACKGROUND_COLOR") || editor.outputCanvasBackgroundColor;
      const item = root.query("GET_ITEM", id);
      if (!item) return;
      const file = item.file;
      const crop = item.getMetadata("crop");
      const cropDefault = {
        center: {
          x: 0.5,
          y: 0.5
        },
        flip: {
          horizontal: false,
          vertical: false
        },
        zoom: 1,
        rotation: 0,
        aspectRatio: null
      };
      const resize = item.getMetadata("resize");
      const filter = item.getMetadata("filter") || null;
      const filters = item.getMetadata("filters") || null;
      const colors = item.getMetadata("colors") || null;
      const markup = item.getMetadata("markup") || null;
      const imageParameters = {
        crop: crop || cropDefault,
        size: resize ? {
          upscale: resize.upscale,
          mode: resize.mode,
          width: resize.size.width,
          height: resize.size.height
        } : null,
        filter: filters ? filters.id || filters.matrix : root.query("GET_ALLOW_IMAGE_FILTER") && root.query("GET_IMAGE_FILTER_COLOR_MATRIX") && !colors ? filter : null,
        color: colors,
        markup
      };
      editor.onconfirm = ({ data }) => {
        const { crop: crop2, size, filter: filter2, color, colorMatrix, markup: markup2 } = data;
        const metadata = {};
        if (crop2) {
          metadata.crop = crop2;
        }
        if (size) {
          const initialSize = (item.getMetadata("resize") || {}).size;
          const targetSize = {
            width: size.width,
            height: size.height
          };
          if (!(targetSize.width && targetSize.height) && initialSize) {
            targetSize.width = initialSize.width;
            targetSize.height = initialSize.height;
          }
          if (targetSize.width || targetSize.height) {
            metadata.resize = {
              upscale: size.upscale,
              mode: size.mode,
              size: targetSize
            };
          }
        }
        if (markup2) {
          metadata.markup = markup2;
        }
        metadata.colors = color;
        metadata.filters = filter2;
        metadata.filter = colorMatrix;
        item.setMetadata(metadata);
        editor.filepondCallbackBridge.onconfirm(data, createItemAPI(item));
        if (!handleEditorResponse) return;
        editor.onclose = () => {
          handleEditorResponse(true);
          editor.onclose = null;
        };
      };
      editor.oncancel = () => {
        editor.filepondCallbackBridge.oncancel(createItemAPI(item));
        if (!handleEditorResponse) return;
        editor.onclose = () => {
          handleEditorResponse(false);
          editor.onclose = null;
        };
      };
      editor.open(file, imageParameters);
    };
    const didLoadItem = ({ root, props }) => {
      if (!query("GET_IMAGE_EDIT_ALLOW_EDIT")) return;
      const { id } = props;
      const item = query("GET_ITEM", id);
      if (!item) return;
      const file = item.file;
      if (!isPreviewableImage(file)) return;
      root.ref.handleEdit = (e) => {
        e.stopPropagation();
        root.dispatch("EDIT_ITEM", { id });
      };
      if (canShowImagePreview) {
        const buttonView = view.createChildView(fileActionButton, {
          label: "edit",
          icon: query("GET_IMAGE_EDIT_ICON_EDIT"),
          opacity: 0
        });
        buttonView.element.classList.add("filepond--action-edit-item");
        buttonView.element.dataset.align = query(
          "GET_STYLE_IMAGE_EDIT_BUTTON_EDIT_ITEM_POSITION"
        );
        buttonView.on("click", root.ref.handleEdit);
        root.ref.buttonEditItem = view.appendChildView(buttonView);
      } else {
        const filenameElement = view.element.querySelector(
          ".filepond--file-info-main"
        );
        const editButton = document.createElement("button");
        editButton.className = "filepond--action-edit-item-alt";
        editButton.innerHTML = query("GET_IMAGE_EDIT_ICON_EDIT") + "<span>edit</span>";
        editButton.addEventListener("click", root.ref.handleEdit);
        filenameElement.appendChild(editButton);
        root.ref.editButton = editButton;
      }
    };
    view.registerDestroyer(({ root }) => {
      if (root.ref.buttonEditItem) {
        root.ref.buttonEditItem.off("click", root.ref.handleEdit);
      }
      if (root.ref.editButton) {
        root.ref.editButton.removeEventListener("click", root.ref.handleEdit);
      }
    });
    const routes = {
      EDIT_ITEM: openEditor,
      DID_LOAD_ITEM: didLoadItem
    };
    if (canShowImagePreview) {
      const didPreviewUpdate = ({ root }) => {
        if (!root.ref.buttonEditItem) return;
        root.ref.buttonEditItem.opacity = 1;
      };
      routes.DID_IMAGE_PREVIEW_SHOW = didPreviewUpdate;
    } else {
    }
    view.registerWriter(createRoute(routes));
  });
  return {
    options: {
      // enable or disable image editing
      allowImageEdit: [true, Type.BOOLEAN],
      // location of processing button
      styleImageEditButtonEditItemPosition: ["bottom center", Type.STRING],
      // open editor when image is dropped
      imageEditInstantEdit: [false, Type.BOOLEAN],
      // allow editing
      imageEditAllowEdit: [true, Type.BOOLEAN],
      // the icon to use for the edit button
      imageEditIconEdit: [
        '<svg width="26" height="26" viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M8.5 17h1.586l7-7L15.5 8.414l-7 7V17zm-1.707-2.707l8-8a1 1 0 0 1 1.414 0l3 3a1 1 0 0 1 0 1.414l-8 8A1 1 0 0 1 10.5 19h-3a1 1 0 0 1-1-1v-3a1 1 0 0 1 .293-.707z" fill="currentColor" fill-rule="nonzero"/></svg>',
        Type.STRING
      ],
      // editor object
      imageEditEditor: [null, Type.OBJECT]
    }
  };
};
var isBrowser = typeof window !== "undefined" && typeof window.document !== "undefined";
if (isBrowser) {
  document.dispatchEvent(
    new CustomEvent("FilePond:pluginloaded", { detail: plugin })
  );
}
var filepond_plugin_image_edit_esm_default = plugin;
export {
  filepond_plugin_image_edit_esm_default as default
};
/*! Bundled license information:

filepond-plugin-image-edit/dist/filepond-plugin-image-edit.esm.js:
  (*!
   * FilePondPluginImageEdit 1.6.3
   * Licensed under MIT, https://opensource.org/licenses/MIT/
   * Please visit https://pqina.nl/filepond/ for details.
   *)
*/
//# sourceMappingURL=filepond-plugin-image-edit.js.map
