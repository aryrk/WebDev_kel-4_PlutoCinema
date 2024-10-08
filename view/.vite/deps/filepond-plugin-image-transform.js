import "./chunk-V4OQ3NZ2.js";

// node_modules/filepond-plugin-image-transform/dist/filepond-plugin-image-transform.esm.js
var isImage = (file) => /^image/.test(file.type);
var getFilenameWithoutExtension = (name) => name.substr(0, name.lastIndexOf(".")) || name;
var ExtensionMap = {
  jpeg: "jpg",
  "svg+xml": "svg"
};
var renameFileToMatchMimeType = (filename, mimeType) => {
  const name = getFilenameWithoutExtension(filename);
  const type = mimeType.split("/")[1];
  const extension = ExtensionMap[type] || type;
  return `${name}.${extension}`;
};
var getValidOutputMimeType = (type) => /jpeg|png|svg\+xml/.test(type) ? type : "image/jpeg";
var isImage$1 = (file) => /^image/.test(file.type);
var MATRICES = {
  1: () => [1, 0, 0, 1, 0, 0],
  2: (width) => [-1, 0, 0, 1, width, 0],
  3: (width, height) => [-1, 0, 0, -1, width, height],
  4: (width, height) => [1, 0, 0, -1, 0, height],
  5: () => [0, 1, 1, 0, 0, 0],
  6: (width, height) => [0, 1, -1, 0, height, 0],
  7: (width, height) => [0, -1, -1, 0, height, width],
  8: (width) => [0, -1, 1, 0, 0, width]
};
var getImageOrientationMatrix = (width, height, orientation) => {
  if (orientation === -1) {
    orientation = 1;
  }
  return MATRICES[orientation](width, height);
};
var createVector = (x, y) => ({ x, y });
var vectorDot = (a, b) => a.x * b.x + a.y * b.y;
var vectorSubtract = (a, b) => createVector(a.x - b.x, a.y - b.y);
var vectorDistanceSquared = (a, b) => vectorDot(vectorSubtract(a, b), vectorSubtract(a, b));
var vectorDistance = (a, b) => Math.sqrt(vectorDistanceSquared(a, b));
var getOffsetPointOnEdge = (length, rotation) => {
  const a = length;
  const A = 1.5707963267948966;
  const B = rotation;
  const C = 1.5707963267948966 - rotation;
  const sinA = Math.sin(A);
  const sinB = Math.sin(B);
  const sinC = Math.sin(C);
  const cosC = Math.cos(C);
  const ratio = a / sinA;
  const b = ratio * sinB;
  const c = ratio * sinC;
  return createVector(cosC * b, cosC * c);
};
var getRotatedRectSize = (rect, rotation) => {
  const w = rect.width;
  const h = rect.height;
  const hor = getOffsetPointOnEdge(w, rotation);
  const ver = getOffsetPointOnEdge(h, rotation);
  const tl = createVector(rect.x + Math.abs(hor.x), rect.y - Math.abs(hor.y));
  const tr = createVector(rect.x + rect.width + Math.abs(ver.y), rect.y + Math.abs(ver.x));
  const bl = createVector(rect.x - Math.abs(ver.y), rect.y + rect.height - Math.abs(ver.x));
  return {
    width: vectorDistance(tl, tr),
    height: vectorDistance(tl, bl)
  };
};
var getImageRectZoomFactor = (imageRect, cropRect, rotation = 0, center = { x: 0.5, y: 0.5 }) => {
  const cx = center.x > 0.5 ? 1 - center.x : center.x;
  const cy = center.y > 0.5 ? 1 - center.y : center.y;
  const imageWidth = cx * 2 * imageRect.width;
  const imageHeight = cy * 2 * imageRect.height;
  const rotatedCropSize = getRotatedRectSize(cropRect, rotation);
  return Math.max(rotatedCropSize.width / imageWidth, rotatedCropSize.height / imageHeight);
};
var getCenteredCropRect = (container, aspectRatio) => {
  let width = container.width;
  let height = width * aspectRatio;
  if (height > container.height) {
    height = container.height;
    width = height / aspectRatio;
  }
  const x = (container.width - width) * 0.5;
  const y = (container.height - height) * 0.5;
  return {
    x,
    y,
    width,
    height
  };
};
var calculateCanvasSize = (image, canvasAspectRatio, zoom = 1) => {
  const imageAspectRatio = image.height / image.width;
  let canvasWidth = 1;
  let canvasHeight = canvasAspectRatio;
  let imgWidth = 1;
  let imgHeight = imageAspectRatio;
  if (imgHeight > canvasHeight) {
    imgHeight = canvasHeight;
    imgWidth = imgHeight / imageAspectRatio;
  }
  const scalar = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight);
  const width = image.width / (zoom * scalar * imgWidth);
  const height = width * canvasAspectRatio;
  return {
    width,
    height
  };
};
var canvasRelease = (canvas) => {
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 1, 1);
};
var isFlipped = (flip) => flip && (flip.horizontal || flip.vertical);
var getBitmap = (image, orientation, flip) => {
  if (orientation <= 1 && !isFlipped(flip)) {
    image.width = image.naturalWidth;
    image.height = image.naturalHeight;
    return image;
  }
  const canvas = document.createElement("canvas");
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  const swapped = orientation >= 5 && orientation <= 8;
  if (swapped) {
    canvas.width = height;
    canvas.height = width;
  } else {
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = canvas.getContext("2d");
  if (orientation) {
    ctx.transform.apply(ctx, getImageOrientationMatrix(width, height, orientation));
  }
  if (isFlipped(flip)) {
    const matrix = [1, 0, 0, 1, 0, 0];
    if (!swapped && flip.horizontal || swapped & flip.vertical) {
      matrix[0] = -1;
      matrix[4] = width;
    }
    if (!swapped && flip.vertical || swapped && flip.horizontal) {
      matrix[3] = -1;
      matrix[5] = height;
    }
    ctx.transform(...matrix);
  }
  ctx.drawImage(image, 0, 0, width, height);
  return canvas;
};
var imageToImageData = (imageElement, orientation, crop = {}, options = {}) => {
  const { canvasMemoryLimit, background = null } = options;
  const zoom = crop.zoom || 1;
  const bitmap = getBitmap(imageElement, orientation, crop.flip);
  const imageSize = {
    width: bitmap.width,
    height: bitmap.height
  };
  const aspectRatio = crop.aspectRatio || imageSize.height / imageSize.width;
  let canvasSize = calculateCanvasSize(imageSize, aspectRatio, zoom);
  if (canvasMemoryLimit) {
    const requiredMemory = canvasSize.width * canvasSize.height;
    if (requiredMemory > canvasMemoryLimit) {
      const scalar = Math.sqrt(canvasMemoryLimit) / Math.sqrt(requiredMemory);
      imageSize.width = Math.floor(imageSize.width * scalar);
      imageSize.height = Math.floor(imageSize.height * scalar);
      canvasSize = calculateCanvasSize(imageSize, aspectRatio, zoom);
    }
  }
  const canvas = document.createElement("canvas");
  const canvasCenter = {
    x: canvasSize.width * 0.5,
    y: canvasSize.height * 0.5
  };
  const stage = {
    x: 0,
    y: 0,
    width: canvasSize.width,
    height: canvasSize.height,
    center: canvasCenter
  };
  const shouldLimit = typeof crop.scaleToFit === "undefined" || crop.scaleToFit;
  const scale = zoom * getImageRectZoomFactor(
    imageSize,
    getCenteredCropRect(stage, aspectRatio),
    crop.rotation,
    shouldLimit ? crop.center : { x: 0.5, y: 0.5 }
  );
  canvas.width = Math.round(canvasSize.width / scale);
  canvas.height = Math.round(canvasSize.height / scale);
  canvasCenter.x /= scale;
  canvasCenter.y /= scale;
  const imageOffset = {
    x: canvasCenter.x - imageSize.width * (crop.center ? crop.center.x : 0.5),
    y: canvasCenter.y - imageSize.height * (crop.center ? crop.center.y : 0.5)
  };
  const ctx = canvas.getContext("2d");
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.translate(canvasCenter.x, canvasCenter.y);
  ctx.rotate(crop.rotation || 0);
  ctx.drawImage(
    bitmap,
    imageOffset.x - canvasCenter.x,
    imageOffset.y - canvasCenter.y,
    imageSize.width,
    imageSize.height
  );
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  canvasRelease(canvas);
  return imageData;
};
var IS_BROWSER = (() => typeof window !== "undefined" && typeof window.document !== "undefined")();
if (IS_BROWSER) {
  if (!HTMLCanvasElement.prototype.toBlob) {
    Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
      value: function(callback, type, quality) {
        var dataURL = this.toDataURL(type, quality).split(",")[1];
        setTimeout(function() {
          var binStr = atob(dataURL);
          var len = binStr.length;
          var arr = new Uint8Array(len);
          for (var i = 0; i < len; i++) {
            arr[i] = binStr.charCodeAt(i);
          }
          callback(new Blob([arr], { type: type || "image/png" }));
        });
      }
    });
  }
}
var canvasToBlob = (canvas, options, beforeCreateBlob = null) => new Promise((resolve) => {
  const promisedImage = beforeCreateBlob ? beforeCreateBlob(canvas) : canvas;
  Promise.resolve(promisedImage).then((canvas2) => {
    canvas2.toBlob(resolve, options.type, options.quality);
  });
});
var vectorMultiply = (v, amount) => createVector$1(v.x * amount, v.y * amount);
var vectorAdd = (a, b) => createVector$1(a.x + b.x, a.y + b.y);
var vectorNormalize = (v) => {
  const l = Math.sqrt(v.x * v.x + v.y * v.y);
  if (l === 0) {
    return {
      x: 0,
      y: 0
    };
  }
  return createVector$1(v.x / l, v.y / l);
};
var vectorRotate = (v, radians, origin) => {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const t = createVector$1(v.x - origin.x, v.y - origin.y);
  return createVector$1(origin.x + cos * t.x - sin * t.y, origin.y + sin * t.x + cos * t.y);
};
var createVector$1 = (x = 0, y = 0) => ({ x, y });
var getMarkupValue = (value, size, scalar = 1, axis) => {
  if (typeof value === "string") {
    return parseFloat(value) * scalar;
  }
  if (typeof value === "number") {
    return value * (axis ? size[axis] : Math.min(size.width, size.height));
  }
  return;
};
var getMarkupStyles = (markup, size, scale) => {
  const lineStyle = markup.borderStyle || markup.lineStyle || "solid";
  const fill = markup.backgroundColor || markup.fontColor || "transparent";
  const stroke = markup.borderColor || markup.lineColor || "transparent";
  const strokeWidth = getMarkupValue(markup.borderWidth || markup.lineWidth, size, scale);
  const lineCap = markup.lineCap || "round";
  const lineJoin = markup.lineJoin || "round";
  const dashes = typeof lineStyle === "string" ? "" : lineStyle.map((v) => getMarkupValue(v, size, scale)).join(",");
  const opacity = markup.opacity || 1;
  return {
    "stroke-linecap": lineCap,
    "stroke-linejoin": lineJoin,
    "stroke-width": strokeWidth || 0,
    "stroke-dasharray": dashes,
    stroke,
    fill,
    opacity
  };
};
var isDefined = (value) => value != null;
var getMarkupRect = (rect, size, scalar = 1) => {
  let left = getMarkupValue(rect.x, size, scalar, "width") || getMarkupValue(rect.left, size, scalar, "width");
  let top = getMarkupValue(rect.y, size, scalar, "height") || getMarkupValue(rect.top, size, scalar, "height");
  let width = getMarkupValue(rect.width, size, scalar, "width");
  let height = getMarkupValue(rect.height, size, scalar, "height");
  let right = getMarkupValue(rect.right, size, scalar, "width");
  let bottom = getMarkupValue(rect.bottom, size, scalar, "height");
  if (!isDefined(top)) {
    if (isDefined(height) && isDefined(bottom)) {
      top = size.height - height - bottom;
    } else {
      top = bottom;
    }
  }
  if (!isDefined(left)) {
    if (isDefined(width) && isDefined(right)) {
      left = size.width - width - right;
    } else {
      left = right;
    }
  }
  if (!isDefined(width)) {
    if (isDefined(left) && isDefined(right)) {
      width = size.width - left - right;
    } else {
      width = 0;
    }
  }
  if (!isDefined(height)) {
    if (isDefined(top) && isDefined(bottom)) {
      height = size.height - top - bottom;
    } else {
      height = 0;
    }
  }
  return {
    x: left || 0,
    y: top || 0,
    width: width || 0,
    height: height || 0
  };
};
var pointsToPathShape = (points) => points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
var setAttributes = (element, attr) => Object.keys(attr).forEach((key) => element.setAttribute(key, attr[key]));
var ns = "http://www.w3.org/2000/svg";
var svg = (tag, attr) => {
  const element = document.createElementNS(ns, tag);
  if (attr) {
    setAttributes(element, attr);
  }
  return element;
};
var updateRect = (element) => setAttributes(element, {
  ...element.rect,
  ...element.styles
});
var updateEllipse = (element) => {
  const cx = element.rect.x + element.rect.width * 0.5;
  const cy = element.rect.y + element.rect.height * 0.5;
  const rx = element.rect.width * 0.5;
  const ry = element.rect.height * 0.5;
  return setAttributes(element, {
    cx,
    cy,
    rx,
    ry,
    ...element.styles
  });
};
var IMAGE_FIT_STYLE = {
  contain: "xMidYMid meet",
  cover: "xMidYMid slice"
};
var updateImage = (element, markup) => {
  setAttributes(element, {
    ...element.rect,
    ...element.styles,
    preserveAspectRatio: IMAGE_FIT_STYLE[markup.fit] || "none"
  });
};
var TEXT_ANCHOR = {
  left: "start",
  center: "middle",
  right: "end"
};
var updateText = (element, markup, size, scale) => {
  const fontSize = getMarkupValue(markup.fontSize, size, scale);
  const fontFamily = markup.fontFamily || "sans-serif";
  const fontWeight = markup.fontWeight || "normal";
  const textAlign = TEXT_ANCHOR[markup.textAlign] || "start";
  setAttributes(element, {
    ...element.rect,
    ...element.styles,
    "stroke-width": 0,
    "font-weight": fontWeight,
    "font-size": fontSize,
    "font-family": fontFamily,
    "text-anchor": textAlign
  });
  if (element.text !== markup.text) {
    element.text = markup.text;
    element.textContent = markup.text.length ? markup.text : " ";
  }
};
var updateLine = (element, markup, size, scale) => {
  setAttributes(element, {
    ...element.rect,
    ...element.styles,
    fill: "none"
  });
  const line = element.childNodes[0];
  const begin = element.childNodes[1];
  const end = element.childNodes[2];
  const origin = element.rect;
  const target = {
    x: element.rect.x + element.rect.width,
    y: element.rect.y + element.rect.height
  };
  setAttributes(line, {
    x1: origin.x,
    y1: origin.y,
    x2: target.x,
    y2: target.y
  });
  if (!markup.lineDecoration) return;
  begin.style.display = "none";
  end.style.display = "none";
  const v = vectorNormalize({
    x: target.x - origin.x,
    y: target.y - origin.y
  });
  const l = getMarkupValue(0.05, size, scale);
  if (markup.lineDecoration.indexOf("arrow-begin") !== -1) {
    const arrowBeginRotationPoint = vectorMultiply(v, l);
    const arrowBeginCenter = vectorAdd(origin, arrowBeginRotationPoint);
    const arrowBeginA = vectorRotate(origin, 2, arrowBeginCenter);
    const arrowBeginB = vectorRotate(origin, -2, arrowBeginCenter);
    setAttributes(begin, {
      style: "display:block;",
      d: `M${arrowBeginA.x},${arrowBeginA.y} L${origin.x},${origin.y} L${arrowBeginB.x},${arrowBeginB.y}`
    });
  }
  if (markup.lineDecoration.indexOf("arrow-end") !== -1) {
    const arrowEndRotationPoint = vectorMultiply(v, -l);
    const arrowEndCenter = vectorAdd(target, arrowEndRotationPoint);
    const arrowEndA = vectorRotate(target, 2, arrowEndCenter);
    const arrowEndB = vectorRotate(target, -2, arrowEndCenter);
    setAttributes(end, {
      style: "display:block;",
      d: `M${arrowEndA.x},${arrowEndA.y} L${target.x},${target.y} L${arrowEndB.x},${arrowEndB.y}`
    });
  }
};
var updatePath = (element, markup, size, scale) => {
  setAttributes(element, {
    ...element.styles,
    fill: "none",
    d: pointsToPathShape(
      markup.points.map((point) => ({
        x: getMarkupValue(point.x, size, scale, "width"),
        y: getMarkupValue(point.y, size, scale, "height")
      }))
    )
  });
};
var createShape = (node) => (markup) => svg(node, { id: markup.id });
var createImage = (markup) => {
  const shape = svg("image", {
    id: markup.id,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    opacity: "0"
  });
  shape.onload = () => {
    shape.setAttribute("opacity", markup.opacity || 1);
  };
  shape.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", markup.src);
  return shape;
};
var createLine = (markup) => {
  const shape = svg("g", {
    id: markup.id,
    "stroke-linecap": "round",
    "stroke-linejoin": "round"
  });
  const line = svg("line");
  shape.appendChild(line);
  const begin = svg("path");
  shape.appendChild(begin);
  const end = svg("path");
  shape.appendChild(end);
  return shape;
};
var CREATE_TYPE_ROUTES = {
  image: createImage,
  rect: createShape("rect"),
  ellipse: createShape("ellipse"),
  text: createShape("text"),
  path: createShape("path"),
  line: createLine
};
var UPDATE_TYPE_ROUTES = {
  rect: updateRect,
  ellipse: updateEllipse,
  image: updateImage,
  text: updateText,
  path: updatePath,
  line: updateLine
};
var createMarkupByType = (type, markup) => CREATE_TYPE_ROUTES[type](markup);
var updateMarkupByType = (element, type, markup, size, scale) => {
  if (type !== "path") {
    element.rect = getMarkupRect(markup, size, scale);
  }
  element.styles = getMarkupStyles(markup, size, scale);
  UPDATE_TYPE_ROUTES[type](element, markup, size, scale);
};
var sortMarkupByZIndex = (a, b) => {
  if (a[1].zIndex > b[1].zIndex) {
    return 1;
  }
  if (a[1].zIndex < b[1].zIndex) {
    return -1;
  }
  return 0;
};
var cropSVG = (blob, crop = {}, markup, options) => new Promise((resolve) => {
  const { background = null } = options;
  const fr = new FileReader();
  fr.onloadend = () => {
    const text = fr.result;
    const original = document.createElement("div");
    original.style.cssText = `position:absolute;pointer-events:none;width:0;height:0;visibility:hidden;`;
    original.innerHTML = text;
    const originalNode = original.querySelector("svg");
    document.body.appendChild(original);
    const bBox = originalNode.getBBox();
    original.parentNode.removeChild(original);
    const titleNode = original.querySelector("title");
    const viewBoxAttribute = originalNode.getAttribute("viewBox") || "";
    const widthAttribute = originalNode.getAttribute("width") || "";
    const heightAttribute = originalNode.getAttribute("height") || "";
    let width = parseFloat(widthAttribute) || null;
    let height = parseFloat(heightAttribute) || null;
    const widthUnits = (widthAttribute.match(/[a-z]+/) || [])[0] || "";
    const heightUnits = (heightAttribute.match(/[a-z]+/) || [])[0] || "";
    const viewBoxList = viewBoxAttribute.split(" ").map(parseFloat);
    const viewBox = viewBoxList.length ? {
      x: viewBoxList[0],
      y: viewBoxList[1],
      width: viewBoxList[2],
      height: viewBoxList[3]
    } : bBox;
    let imageWidth = width != null ? width : viewBox.width;
    let imageHeight = height != null ? height : viewBox.height;
    originalNode.style.overflow = "visible";
    originalNode.setAttribute("width", imageWidth);
    originalNode.setAttribute("height", imageHeight);
    let markupSVG = "";
    if (markup && markup.length) {
      const size = {
        width: imageWidth,
        height: imageHeight
      };
      markupSVG = markup.sort(sortMarkupByZIndex).reduce((prev, shape) => {
        const el = createMarkupByType(shape[0], shape[1]);
        updateMarkupByType(el, shape[0], shape[1], size);
        el.removeAttribute("id");
        if (el.getAttribute("opacity") === 1) {
          el.removeAttribute("opacity");
        }
        return prev + "\n" + el.outerHTML + "\n";
      }, "");
      markupSVG = `

<g>${markupSVG.replace(/&nbsp;/g, " ")}</g>

`;
    }
    const aspectRatio = crop.aspectRatio || imageHeight / imageWidth;
    const canvasWidth = imageWidth;
    const canvasHeight = canvasWidth * aspectRatio;
    const shouldLimit = typeof crop.scaleToFit === "undefined" || crop.scaleToFit;
    const cropCenterX = crop.center ? crop.center.x : 0.5;
    const cropCenterY = crop.center ? crop.center.y : 0.5;
    const canvasZoomFactor = getImageRectZoomFactor(
      {
        width: imageWidth,
        height: imageHeight
      },
      getCenteredCropRect(
        {
          width: canvasWidth,
          height: canvasHeight
        },
        aspectRatio
      ),
      crop.rotation,
      shouldLimit ? { x: cropCenterX, y: cropCenterY } : {
        x: 0.5,
        y: 0.5
      }
    );
    const scale = crop.zoom * canvasZoomFactor;
    const rotation = crop.rotation * (180 / Math.PI);
    const canvasCenter = {
      x: canvasWidth * 0.5,
      y: canvasHeight * 0.5
    };
    const imageOffset = {
      x: canvasCenter.x - imageWidth * cropCenterX,
      y: canvasCenter.y - imageHeight * cropCenterY
    };
    const cropTransforms = [
      // rotate
      `rotate(${rotation} ${canvasCenter.x} ${canvasCenter.y})`,
      // scale
      `translate(${canvasCenter.x} ${canvasCenter.y})`,
      `scale(${scale})`,
      `translate(${-canvasCenter.x} ${-canvasCenter.y})`,
      // offset
      `translate(${imageOffset.x} ${imageOffset.y})`
    ];
    const cropFlipHorizontal = crop.flip && crop.flip.horizontal;
    const cropFlipVertical = crop.flip && crop.flip.vertical;
    const flipTransforms = [
      `scale(${cropFlipHorizontal ? -1 : 1} ${cropFlipVertical ? -1 : 1})`,
      `translate(${cropFlipHorizontal ? -imageWidth : 0} ${cropFlipVertical ? -imageHeight : 0})`
    ];
    const transformed = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${canvasWidth}${widthUnits}" height="${canvasHeight}${heightUnits}" 
viewBox="0 0 ${canvasWidth} ${canvasHeight}" ${background ? 'style="background:' + background + '" ' : ""}
preserveAspectRatio="xMinYMin"
xmlns:xlink="http://www.w3.org/1999/xlink"
xmlns="http://www.w3.org/2000/svg">
<!-- Generated by PQINA - https://pqina.nl/ -->
<title>${titleNode ? titleNode.textContent : ""}</title>
<g transform="${cropTransforms.join(" ")}">
<g transform="${flipTransforms.join(" ")}">
${originalNode.outerHTML}${markupSVG}
</g>
</g>
</svg>`;
    resolve(transformed);
  };
  fr.readAsText(blob);
});
var objectToImageData = (obj) => {
  let imageData;
  try {
    imageData = new ImageData(obj.width, obj.height);
  } catch (e) {
    const canvas = document.createElement("canvas");
    imageData = canvas.getContext("2d").createImageData(obj.width, obj.height);
  }
  imageData.data.set(obj.data);
  return imageData;
};
var TransformWorker = () => {
  const TRANSFORMS = { resize, filter };
  const applyTransforms = (transforms, imageData) => {
    transforms.forEach((transform2) => {
      imageData = TRANSFORMS[transform2.type](imageData, transform2.data);
    });
    return imageData;
  };
  const transform = (data, cb) => {
    let transforms = data.transforms;
    let filterTransform = null;
    transforms.forEach((transform2) => {
      if (transform2.type === "filter") {
        filterTransform = transform2;
      }
    });
    if (filterTransform) {
      let resizeTransform = null;
      transforms.forEach((transform2) => {
        if (transform2.type === "resize") {
          resizeTransform = transform2;
        }
      });
      if (resizeTransform) {
        resizeTransform.data.matrix = filterTransform.data;
        transforms = transforms.filter((transform2) => transform2.type !== "filter");
      }
    }
    cb(applyTransforms(transforms, data.imageData));
  };
  self.onmessage = (e) => {
    transform(e.data.message, (response) => {
      self.postMessage({ id: e.data.id, message: response }, [response.data.buffer]);
    });
  };
  const br = 1;
  const bg = 1;
  const bb = 1;
  function applyFilterMatrix(index, data, m) {
    const ir = data[index] / 255;
    const ig = data[index + 1] / 255;
    const ib = data[index + 2] / 255;
    const ia = data[index + 3] / 255;
    const mr = ir * m[0] + ig * m[1] + ib * m[2] + ia * m[3] + m[4];
    const mg = ir * m[5] + ig * m[6] + ib * m[7] + ia * m[8] + m[9];
    const mb = ir * m[10] + ig * m[11] + ib * m[12] + ia * m[13] + m[14];
    const ma = ir * m[15] + ig * m[16] + ib * m[17] + ia * m[18] + m[19];
    const or = Math.max(0, mr * ma) + br * (1 - ma);
    const og = Math.max(0, mg * ma) + bg * (1 - ma);
    const ob = Math.max(0, mb * ma) + bb * (1 - ma);
    data[index] = Math.max(0, Math.min(1, or)) * 255;
    data[index + 1] = Math.max(0, Math.min(1, og)) * 255;
    data[index + 2] = Math.max(0, Math.min(1, ob)) * 255;
  }
  const identityMatrix = self.JSON.stringify([
    1,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    0,
    1,
    0
  ]);
  function isIdentityMatrix(filter2) {
    return self.JSON.stringify(filter2 || []) === identityMatrix;
  }
  function filter(imageData, matrix) {
    if (!matrix || isIdentityMatrix(matrix)) return imageData;
    const data = imageData.data;
    const l = data.length;
    const m11 = matrix[0];
    const m12 = matrix[1];
    const m13 = matrix[2];
    const m14 = matrix[3];
    const m15 = matrix[4];
    const m21 = matrix[5];
    const m22 = matrix[6];
    const m23 = matrix[7];
    const m24 = matrix[8];
    const m25 = matrix[9];
    const m31 = matrix[10];
    const m32 = matrix[11];
    const m33 = matrix[12];
    const m34 = matrix[13];
    const m35 = matrix[14];
    const m41 = matrix[15];
    const m42 = matrix[16];
    const m43 = matrix[17];
    const m44 = matrix[18];
    const m45 = matrix[19];
    let index = 0, r = 0, g = 0, b = 0, a = 0, mr = 0, mg = 0, mb = 0, ma = 0, or = 0, og = 0, ob = 0;
    for (; index < l; index += 4) {
      r = data[index] / 255;
      g = data[index + 1] / 255;
      b = data[index + 2] / 255;
      a = data[index + 3] / 255;
      mr = r * m11 + g * m12 + b * m13 + a * m14 + m15;
      mg = r * m21 + g * m22 + b * m23 + a * m24 + m25;
      mb = r * m31 + g * m32 + b * m33 + a * m34 + m35;
      ma = r * m41 + g * m42 + b * m43 + a * m44 + m45;
      or = Math.max(0, mr * ma) + br * (1 - ma);
      og = Math.max(0, mg * ma) + bg * (1 - ma);
      ob = Math.max(0, mb * ma) + bb * (1 - ma);
      data[index] = Math.max(0, Math.min(1, or)) * 255;
      data[index + 1] = Math.max(0, Math.min(1, og)) * 255;
      data[index + 2] = Math.max(0, Math.min(1, ob)) * 255;
    }
    return imageData;
  }
  function resize(imageData, data) {
    let { mode = "contain", upscale = false, width, height, matrix } = data;
    matrix = !matrix || isIdentityMatrix(matrix) ? null : matrix;
    if (!width && !height) {
      return filter(imageData, matrix);
    }
    if (width === null) {
      width = height;
    } else if (height === null) {
      height = width;
    }
    if (mode !== "force") {
      let scalarWidth = width / imageData.width;
      let scalarHeight = height / imageData.height;
      let scalar = 1;
      if (mode === "cover") {
        scalar = Math.max(scalarWidth, scalarHeight);
      } else if (mode === "contain") {
        scalar = Math.min(scalarWidth, scalarHeight);
      }
      if (scalar > 1 && upscale === false) {
        return filter(imageData, matrix);
      }
      width = imageData.width * scalar;
      height = imageData.height * scalar;
    }
    const originWidth = imageData.width;
    const originHeight = imageData.height;
    const targetWidth = Math.round(width);
    const targetHeight = Math.round(height);
    const inputData = imageData.data;
    const outputData = new Uint8ClampedArray(targetWidth * targetHeight * 4);
    const ratioWidth = originWidth / targetWidth;
    const ratioHeight = originHeight / targetHeight;
    const ratioWidthHalf = Math.ceil(ratioWidth * 0.5);
    const ratioHeightHalf = Math.ceil(ratioHeight * 0.5);
    for (let j = 0; j < targetHeight; j++) {
      for (let i = 0; i < targetWidth; i++) {
        let x2 = (i + j * targetWidth) * 4;
        let weight = 0;
        let weights = 0;
        let weightsAlpha = 0;
        let r = 0;
        let g = 0;
        let b = 0;
        let a = 0;
        let centerY = (j + 0.5) * ratioHeight;
        for (let yy = Math.floor(j * ratioHeight); yy < (j + 1) * ratioHeight; yy++) {
          let dy = Math.abs(centerY - (yy + 0.5)) / ratioHeightHalf;
          let centerX = (i + 0.5) * ratioWidth;
          let w0 = dy * dy;
          for (let xx = Math.floor(i * ratioWidth); xx < (i + 1) * ratioWidth; xx++) {
            let dx = Math.abs(centerX - (xx + 0.5)) / ratioWidthHalf;
            let w = Math.sqrt(w0 + dx * dx);
            if (w >= -1 && w <= 1) {
              weight = 2 * w * w * w - 3 * w * w + 1;
              if (weight > 0) {
                dx = 4 * (xx + yy * originWidth);
                let ref = inputData[dx + 3];
                a += weight * ref;
                weightsAlpha += weight;
                if (ref < 255) {
                  weight = weight * ref / 250;
                }
                r += weight * inputData[dx];
                g += weight * inputData[dx + 1];
                b += weight * inputData[dx + 2];
                weights += weight;
              }
            }
          }
        }
        outputData[x2] = r / weights;
        outputData[x2 + 1] = g / weights;
        outputData[x2 + 2] = b / weights;
        outputData[x2 + 3] = a / weightsAlpha;
        matrix && applyFilterMatrix(x2, outputData, matrix);
      }
    }
    return {
      data: outputData,
      width: targetWidth,
      height: targetHeight
    };
  }
};
var correctOrientation = (view, offset) => {
  if (view.getUint32(offset + 4, false) !== 1165519206) return;
  offset += 4;
  const intelByteAligned = view.getUint16(offset += 6, false) === 18761;
  offset += view.getUint32(offset + 4, intelByteAligned);
  const tags = view.getUint16(offset, intelByteAligned);
  offset += 2;
  for (let i = 0; i < tags; i++) {
    if (view.getUint16(offset + i * 12, intelByteAligned) === 274) {
      view.setUint16(offset + i * 12 + 8, 1, intelByteAligned);
      return true;
    }
  }
  return false;
};
var readData = (data) => {
  const view = new DataView(data);
  if (view.getUint16(0) !== 65496) return null;
  let offset = 2;
  let marker;
  let markerLength;
  let orientationCorrected = false;
  while (offset < view.byteLength) {
    marker = view.getUint16(offset, false);
    markerLength = view.getUint16(offset + 2, false) + 2;
    const isData = marker >= 65504 && marker <= 65519 || marker === 65534;
    if (!isData) {
      break;
    }
    if (!orientationCorrected) {
      orientationCorrected = correctOrientation(view, offset, markerLength);
    }
    if (offset + markerLength > view.byteLength) {
      break;
    }
    offset += markerLength;
  }
  return data.slice(0, offset);
};
var getImageHead = (file) => new Promise((resolve) => {
  const reader = new FileReader();
  reader.onload = () => resolve(readData(reader.result) || null);
  reader.readAsArrayBuffer(file.slice(0, 256 * 1024));
});
var getBlobBuilder = () => {
  return window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
};
var createBlob = (arrayBuffer, mimeType) => {
  const BB = getBlobBuilder();
  if (BB) {
    const bb = new BB();
    bb.append(arrayBuffer);
    return bb.getBlob(mimeType);
  }
  return new Blob([arrayBuffer], {
    type: mimeType
  });
};
var getUniqueId = () => Math.random().toString(36).substr(2, 9);
var createWorker = (fn) => {
  const workerBlob = new Blob(["(", fn.toString(), ")()"], { type: "application/javascript" });
  const workerURL = URL.createObjectURL(workerBlob);
  const worker = new Worker(workerURL);
  const trips = [];
  return {
    transfer: () => {
    },
    // (message, cb) => {}
    post: (message, cb, transferList) => {
      const id = getUniqueId();
      trips[id] = cb;
      worker.onmessage = (e) => {
        const cb2 = trips[e.data.id];
        if (!cb2) return;
        cb2(e.data.message);
        delete trips[e.data.id];
      };
      worker.postMessage(
        {
          id,
          message
        },
        transferList
      );
    },
    terminate: () => {
      worker.terminate();
      URL.revokeObjectURL(workerURL);
    }
  };
};
var loadImage = (url) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => {
    resolve(img);
  };
  img.onerror = (e) => {
    reject(e);
  };
  img.src = url;
});
var chain = (funcs) => funcs.reduce(
  (promise, func) => promise.then((result) => func().then(Array.prototype.concat.bind(result))),
  Promise.resolve([])
);
var canvasApplyMarkup = (canvas, markup) => new Promise((resolve) => {
  const size = {
    width: canvas.width,
    height: canvas.height
  };
  const ctx = canvas.getContext("2d");
  const drawers = markup.sort(sortMarkupByZIndex).map(
    (item) => () => new Promise((resolve2) => {
      const result = TYPE_DRAW_ROUTES[item[0]](ctx, size, item[1], resolve2);
      if (result) resolve2();
    })
  );
  chain(drawers).then(() => resolve(canvas));
});
var applyMarkupStyles = (ctx, styles) => {
  ctx.beginPath();
  ctx.lineCap = styles["stroke-linecap"];
  ctx.lineJoin = styles["stroke-linejoin"];
  ctx.lineWidth = styles["stroke-width"];
  if (styles["stroke-dasharray"].length) {
    ctx.setLineDash(styles["stroke-dasharray"].split(","));
  }
  ctx.fillStyle = styles["fill"];
  ctx.strokeStyle = styles["stroke"];
  ctx.globalAlpha = styles.opacity || 1;
};
var drawMarkupStyles = (ctx) => {
  ctx.fill();
  ctx.stroke();
  ctx.globalAlpha = 1;
};
var drawRect = (ctx, size, markup) => {
  const rect = getMarkupRect(markup, size);
  const styles = getMarkupStyles(markup, size);
  applyMarkupStyles(ctx, styles);
  ctx.rect(rect.x, rect.y, rect.width, rect.height);
  drawMarkupStyles(ctx, styles);
  return true;
};
var drawEllipse = (ctx, size, markup) => {
  const rect = getMarkupRect(markup, size);
  const styles = getMarkupStyles(markup, size);
  applyMarkupStyles(ctx, styles);
  const x = rect.x, y = rect.y, w = rect.width, h = rect.height, kappa = 0.5522848, ox = w / 2 * kappa, oy = h / 2 * kappa, xe = x + w, ye = y + h, xm = x + w / 2, ym = y + h / 2;
  ctx.moveTo(x, ym);
  ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
  ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
  ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
  ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
  drawMarkupStyles(ctx, styles);
  return true;
};
var drawImage = (ctx, size, markup, done) => {
  const rect = getMarkupRect(markup, size);
  const styles = getMarkupStyles(markup, size);
  applyMarkupStyles(ctx, styles);
  const image = new Image();
  const isCrossOriginImage = new URL(markup.src, window.location.href).origin !== window.location.origin;
  if (isCrossOriginImage) image.crossOrigin = "";
  image.onload = () => {
    if (markup.fit === "cover") {
      const ar = rect.width / rect.height;
      const width = ar > 1 ? image.width : image.height * ar;
      const height = ar > 1 ? image.width / ar : image.height;
      const x = image.width * 0.5 - width * 0.5;
      const y = image.height * 0.5 - height * 0.5;
      ctx.drawImage(image, x, y, width, height, rect.x, rect.y, rect.width, rect.height);
    } else if (markup.fit === "contain") {
      const scalar = Math.min(rect.width / image.width, rect.height / image.height);
      const width = scalar * image.width;
      const height = scalar * image.height;
      const x = rect.x + rect.width * 0.5 - width * 0.5;
      const y = rect.y + rect.height * 0.5 - height * 0.5;
      ctx.drawImage(image, 0, 0, image.width, image.height, x, y, width, height);
    } else {
      ctx.drawImage(
        image,
        0,
        0,
        image.width,
        image.height,
        rect.x,
        rect.y,
        rect.width,
        rect.height
      );
    }
    drawMarkupStyles(ctx, styles);
    done();
  };
  image.src = markup.src;
};
var drawText = (ctx, size, markup) => {
  const rect = getMarkupRect(markup, size);
  const styles = getMarkupStyles(markup, size);
  applyMarkupStyles(ctx, styles);
  const fontSize = getMarkupValue(markup.fontSize, size);
  const fontFamily = markup.fontFamily || "sans-serif";
  const fontWeight = markup.fontWeight || "normal";
  const textAlign = markup.textAlign || "left";
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.textAlign = textAlign;
  ctx.fillText(markup.text, rect.x, rect.y);
  drawMarkupStyles(ctx, styles);
  return true;
};
var drawPath = (ctx, size, markup) => {
  const styles = getMarkupStyles(markup, size);
  applyMarkupStyles(ctx, styles);
  ctx.beginPath();
  const points = markup.points.map((point) => ({
    x: getMarkupValue(point.x, size, 1, "width"),
    y: getMarkupValue(point.y, size, 1, "height")
  }));
  ctx.moveTo(points[0].x, points[0].y);
  const l = points.length;
  for (let i = 1; i < l; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  drawMarkupStyles(ctx, styles);
  return true;
};
var drawLine = (ctx, size, markup) => {
  const rect = getMarkupRect(markup, size);
  const styles = getMarkupStyles(markup, size);
  applyMarkupStyles(ctx, styles);
  ctx.beginPath();
  const origin = {
    x: rect.x,
    y: rect.y
  };
  const target = {
    x: rect.x + rect.width,
    y: rect.y + rect.height
  };
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(target.x, target.y);
  const v = vectorNormalize({
    x: target.x - origin.x,
    y: target.y - origin.y
  });
  const l = 0.04 * Math.min(size.width, size.height);
  if (markup.lineDecoration.indexOf("arrow-begin") !== -1) {
    const arrowBeginRotationPoint = vectorMultiply(v, l);
    const arrowBeginCenter = vectorAdd(origin, arrowBeginRotationPoint);
    const arrowBeginA = vectorRotate(origin, 2, arrowBeginCenter);
    const arrowBeginB = vectorRotate(origin, -2, arrowBeginCenter);
    ctx.moveTo(arrowBeginA.x, arrowBeginA.y);
    ctx.lineTo(origin.x, origin.y);
    ctx.lineTo(arrowBeginB.x, arrowBeginB.y);
  }
  if (markup.lineDecoration.indexOf("arrow-end") !== -1) {
    const arrowEndRotationPoint = vectorMultiply(v, -l);
    const arrowEndCenter = vectorAdd(target, arrowEndRotationPoint);
    const arrowEndA = vectorRotate(target, 2, arrowEndCenter);
    const arrowEndB = vectorRotate(target, -2, arrowEndCenter);
    ctx.moveTo(arrowEndA.x, arrowEndA.y);
    ctx.lineTo(target.x, target.y);
    ctx.lineTo(arrowEndB.x, arrowEndB.y);
  }
  drawMarkupStyles(ctx, styles);
  return true;
};
var TYPE_DRAW_ROUTES = {
  rect: drawRect,
  ellipse: drawEllipse,
  image: drawImage,
  text: drawText,
  line: drawLine,
  path: drawPath
};
var imageDataToCanvas = (imageData) => {
  const image = document.createElement("canvas");
  image.width = imageData.width;
  image.height = imageData.height;
  const ctx = image.getContext("2d");
  ctx.putImageData(imageData, 0, 0);
  return image;
};
var transformImage = (file, instructions, options = {}) => new Promise((resolve, reject) => {
  if (!file || !isImage$1(file)) return reject({ status: "not an image file", file });
  const { stripImageHead, beforeCreateBlob, afterCreateBlob, canvasMemoryLimit } = options;
  const { crop, size, filter, markup, output } = instructions;
  const orientation = instructions.image && instructions.image.orientation ? Math.max(1, Math.min(8, instructions.image.orientation)) : null;
  const qualityAsPercentage = output && output.quality;
  const quality = qualityAsPercentage === null ? null : qualityAsPercentage / 100;
  const type = output && output.type || null;
  const background = output && output.background || null;
  const transforms = [];
  if (size && (typeof size.width === "number" || typeof size.height === "number")) {
    transforms.push({ type: "resize", data: size });
  }
  if (filter && filter.length === 20) {
    transforms.push({ type: "filter", data: filter });
  }
  const resolveWithBlob = (blob) => {
    const promisedBlob = afterCreateBlob ? afterCreateBlob(blob) : blob;
    Promise.resolve(promisedBlob).then(resolve);
  };
  const toBlob = (imageData, options2) => {
    const canvas = imageDataToCanvas(imageData);
    const promisedCanvas = markup.length ? canvasApplyMarkup(canvas, markup) : canvas;
    Promise.resolve(promisedCanvas).then((canvas2) => {
      canvasToBlob(canvas2, options2, beforeCreateBlob).then((blob) => {
        canvasRelease(canvas2);
        if (stripImageHead) return resolveWithBlob(blob);
        getImageHead(file).then((imageHead) => {
          if (imageHead !== null) {
            blob = new Blob([imageHead, blob.slice(20)], { type: blob.type });
          }
          resolveWithBlob(blob);
        });
      }).catch(reject);
    });
  };
  if (/svg/.test(file.type) && type === null) {
    return cropSVG(file, crop, markup, { background }).then((text) => {
      resolve(createBlob(text, "image/svg+xml"));
    });
  }
  const url = URL.createObjectURL(file);
  loadImage(url).then((image) => {
    URL.revokeObjectURL(url);
    const imageData = imageToImageData(image, orientation, crop, {
      canvasMemoryLimit,
      background
    });
    const outputFormat = {
      quality,
      type: type || file.type
    };
    if (!transforms.length) {
      return toBlob(imageData, outputFormat);
    }
    const worker = createWorker(TransformWorker);
    worker.post(
      {
        transforms,
        imageData
      },
      (response) => {
        toBlob(objectToImageData(response), outputFormat);
        worker.terminate();
      },
      [imageData.data.buffer]
    );
  }).catch(reject);
});
var MARKUP_RECT = ["x", "y", "left", "top", "right", "bottom", "width", "height"];
var toOptionalFraction = (value) => typeof value === "string" && /%/.test(value) ? parseFloat(value) / 100 : value;
var prepareMarkup = (markup) => {
  const [type, props] = markup;
  const rect = props.points ? {} : MARKUP_RECT.reduce((prev, curr) => {
    prev[curr] = toOptionalFraction(props[curr]);
    return prev;
  }, {});
  return [
    type,
    {
      zIndex: 0,
      ...props,
      ...rect
    }
  ];
};
var getImageSize = (file) => new Promise((resolve, reject) => {
  const imageElement = new Image();
  imageElement.src = URL.createObjectURL(file);
  const measure = () => {
    const width = imageElement.naturalWidth;
    const height = imageElement.naturalHeight;
    const hasSize = width && height;
    if (!hasSize) return;
    URL.revokeObjectURL(imageElement.src);
    clearInterval(intervalId);
    resolve({ width, height });
  };
  imageElement.onerror = (err) => {
    URL.revokeObjectURL(imageElement.src);
    clearInterval(intervalId);
    reject(err);
  };
  const intervalId = setInterval(measure, 1);
  measure();
});
if (typeof window !== "undefined" && typeof window.document !== "undefined") {
  if (!HTMLCanvasElement.prototype.toBlob) {
    Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
      value: function(cb, type, quality) {
        const canvas = this;
        setTimeout(() => {
          const dataURL = canvas.toDataURL(type, quality).split(",")[1];
          const binStr = atob(dataURL);
          let index = binStr.length;
          const data = new Uint8Array(index);
          while (index--) {
            data[index] = binStr.charCodeAt(index);
          }
          cb(new Blob([data], { type: type || "image/png" }));
        });
      }
    });
  }
}
var isBrowser = typeof window !== "undefined" && typeof window.document !== "undefined";
var isIOS = isBrowser && /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
var plugin = ({ addFilter, utils }) => {
  const { Type, forin, getFileFromBlob, isFile } = utils;
  const TRANSFORM_LIST = ["crop", "resize", "filter", "markup", "output"];
  const createVariantCreator = (updateMetadata) => (transform, file, metadata) => transform(file, updateMetadata ? updateMetadata(metadata) : metadata);
  const isDefaultCrop = (crop) => crop.aspectRatio === null && crop.rotation === 0 && crop.zoom === 1 && crop.center && crop.center.x === 0.5 && crop.center.y === 0.5 && crop.flip && crop.flip.horizontal === false && crop.flip.vertical === false;
  addFilter(
    "SHOULD_PREPARE_OUTPUT",
    (shouldPrepareOutput, { query }) => new Promise((resolve) => {
      resolve(!query("IS_ASYNC"));
    })
  );
  const shouldTransformFile = (query, file, item) => new Promise((resolve) => {
    if (!query("GET_ALLOW_IMAGE_TRANSFORM") || item.archived || !isFile(file) || !isImage(file)) {
      return resolve(false);
    }
    getImageSize(file).then(() => {
      const fn = query("GET_IMAGE_TRANSFORM_IMAGE_FILTER");
      if (fn) {
        const filterResult = fn(file);
        if (filterResult == null) {
          return handleRevert(true);
        }
        if (typeof filterResult === "boolean") {
          return resolve(filterResult);
        }
        if (typeof filterResult.then === "function") {
          return filterResult.then(resolve);
        }
      }
      resolve(true);
    }).catch((err) => {
      resolve(false);
    });
  });
  addFilter("DID_CREATE_ITEM", (item, { query, dispatch }) => {
    if (!query("GET_ALLOW_IMAGE_TRANSFORM")) return;
    item.extend(
      "requestPrepare",
      () => new Promise((resolve, reject) => {
        dispatch(
          "REQUEST_PREPARE_OUTPUT",
          {
            query: item.id,
            item,
            success: resolve,
            failure: reject
          },
          true
        );
      })
    );
  });
  addFilter(
    "PREPARE_OUTPUT",
    (file, { query, item }) => new Promise((resolve) => {
      shouldTransformFile(query, file, item).then((shouldTransform) => {
        if (!shouldTransform) return resolve(file);
        const variants = [];
        if (query("GET_IMAGE_TRANSFORM_VARIANTS_INCLUDE_ORIGINAL")) {
          variants.push(
            () => new Promise((resolve2) => {
              resolve2({
                name: query("GET_IMAGE_TRANSFORM_VARIANTS_ORIGINAL_NAME"),
                file
              });
            })
          );
        }
        if (query("GET_IMAGE_TRANSFORM_VARIANTS_INCLUDE_DEFAULT")) {
          variants.push(
            (transform2, file2, metadata) => new Promise((resolve2) => {
              transform2(file2, metadata).then(
                (file3) => resolve2({
                  name: query(
                    "GET_IMAGE_TRANSFORM_VARIANTS_DEFAULT_NAME"
                  ),
                  file: file3
                })
              );
            })
          );
        }
        const variantsDefinition = query("GET_IMAGE_TRANSFORM_VARIANTS") || {};
        forin(variantsDefinition, (key, fn) => {
          const createVariant = createVariantCreator(fn);
          variants.push(
            (transform2, file2, metadata) => new Promise((resolve2) => {
              createVariant(transform2, file2, metadata).then(
                (file3) => resolve2({ name: key, file: file3 })
              );
            })
          );
        });
        const qualityAsPercentage = query("GET_IMAGE_TRANSFORM_OUTPUT_QUALITY");
        const qualityMode = query("GET_IMAGE_TRANSFORM_OUTPUT_QUALITY_MODE");
        const quality = qualityAsPercentage === null ? null : qualityAsPercentage / 100;
        const type = query("GET_IMAGE_TRANSFORM_OUTPUT_MIME_TYPE");
        const clientTransforms = query("GET_IMAGE_TRANSFORM_CLIENT_TRANSFORMS") || TRANSFORM_LIST;
        item.setMetadata(
          "output",
          {
            type,
            quality,
            client: clientTransforms
          },
          true
        );
        const transform = (file2, metadata) => new Promise((resolve2, reject) => {
          const filteredMetadata = { ...metadata };
          Object.keys(filteredMetadata).filter((instruction) => instruction !== "exif").forEach((instruction) => {
            if (clientTransforms.indexOf(instruction) === -1) {
              delete filteredMetadata[instruction];
            }
          });
          const { resize, exif, output, crop, filter, markup } = filteredMetadata;
          const instructions = {
            image: {
              orientation: exif ? exif.orientation : null
            },
            output: output && (output.type || typeof output.quality === "number" || output.background) ? {
              type: output.type,
              quality: typeof output.quality === "number" ? output.quality * 100 : null,
              background: output.background || query(
                "GET_IMAGE_TRANSFORM_CANVAS_BACKGROUND_COLOR"
              ) || null
            } : void 0,
            size: resize && (resize.size.width || resize.size.height) ? {
              mode: resize.mode,
              upscale: resize.upscale,
              ...resize.size
            } : void 0,
            crop: crop && !isDefaultCrop(crop) ? {
              ...crop
            } : void 0,
            markup: markup && markup.length ? markup.map(prepareMarkup) : [],
            filter
          };
          if (instructions.output) {
            const willChangeType = output.type ? (
              // type set
              output.type !== file2.type
            ) : (
              // type not set
              false
            );
            const canChangeQuality = /\/jpe?g$/.test(file2.type);
            const willChangeQuality = output.quality !== null ? (
              // quality set
              canChangeQuality && qualityMode === "always"
            ) : (
              // quality not set
              false
            );
            const willModifyImageData = !!(instructions.size || instructions.crop || instructions.filter || willChangeType || willChangeQuality);
            if (!willModifyImageData) return resolve2(file2);
          }
          const options = {
            beforeCreateBlob: query("GET_IMAGE_TRANSFORM_BEFORE_CREATE_BLOB"),
            afterCreateBlob: query("GET_IMAGE_TRANSFORM_AFTER_CREATE_BLOB"),
            canvasMemoryLimit: query("GET_IMAGE_TRANSFORM_CANVAS_MEMORY_LIMIT"),
            stripImageHead: query(
              "GET_IMAGE_TRANSFORM_OUTPUT_STRIP_IMAGE_HEAD"
            )
          };
          transformImage(file2, instructions, options).then((blob) => {
            const out = getFileFromBlob(
              blob,
              // rename the original filename to match the mime type of the output image
              renameFileToMatchMimeType(
                file2.name,
                getValidOutputMimeType(blob.type)
              )
            );
            resolve2(out);
          }).catch(reject);
        });
        const variantPromises = variants.map(
          (create) => create(transform, file, item.getMetadata())
        );
        Promise.all(variantPromises).then((files) => {
          resolve(
            files.length === 1 && files[0].name === null ? (
              // return the File object
              files[0].file
            ) : (
              // return an array of files { name:'name', file:File }
              files
            )
          );
        });
      });
    })
  );
  return {
    options: {
      allowImageTransform: [true, Type.BOOLEAN],
      // filter images to transform
      imageTransformImageFilter: [null, Type.FUNCTION],
      // null, 'image/jpeg', 'image/png'
      imageTransformOutputMimeType: [null, Type.STRING],
      // null, 0 - 100
      imageTransformOutputQuality: [null, Type.INT],
      // set to false to copy image exif data to output
      imageTransformOutputStripImageHead: [true, Type.BOOLEAN],
      // only apply transforms in this list
      imageTransformClientTransforms: [null, Type.ARRAY],
      // only apply output quality when a transform is required
      imageTransformOutputQualityMode: ["always", Type.STRING],
      // 'always'
      // 'optional'
      // 'mismatch' (future feature, only applied if quality differs from input)
      // get image transform variants
      imageTransformVariants: [null, Type.OBJECT],
      // should we post the default transformed file
      imageTransformVariantsIncludeDefault: [true, Type.BOOLEAN],
      // which name to prefix the default transformed file with
      imageTransformVariantsDefaultName: [null, Type.STRING],
      // should we post the original file
      imageTransformVariantsIncludeOriginal: [false, Type.BOOLEAN],
      // which name to prefix the original file with
      imageTransformVariantsOriginalName: ["original_", Type.STRING],
      // called before creating the blob, receives canvas, expects promise resolve with canvas
      imageTransformBeforeCreateBlob: [null, Type.FUNCTION],
      // expects promise resolved with blob
      imageTransformAfterCreateBlob: [null, Type.FUNCTION],
      // canvas memory limit
      imageTransformCanvasMemoryLimit: [isBrowser && isIOS ? 4096 * 4096 : null, Type.INT],
      // background image of the output canvas
      imageTransformCanvasBackgroundColor: [null, Type.STRING]
    }
  };
};
if (isBrowser) {
  document.dispatchEvent(new CustomEvent("FilePond:pluginloaded", { detail: plugin }));
}
var filepond_plugin_image_transform_esm_default = plugin;
export {
  filepond_plugin_image_transform_esm_default as default
};
/*! Bundled license information:

filepond-plugin-image-transform/dist/filepond-plugin-image-transform.esm.js:
  (*!
   * FilePondPluginImageTransform 3.8.7
   * Licensed under MIT, https://opensource.org/licenses/MIT/
   * Please visit https://pqina.nl/filepond/ for details.
   *)
*/
//# sourceMappingURL=filepond-plugin-image-transform.js.map
