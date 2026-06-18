// src/utils/imageProcessing.js
//
// All cropping and pixel manipulation happens on in-memory <canvas>
// elements that are never appended to the DOM and never persisted —
// they exist only long enough to produce the data Tesseract needs,
// then they become eligible for garbage collection.

/**
 * Loads an image (from a blob: URL, data: URL, or any same-origin URL)
 * into an HTMLImageElement so its pixel data can be read onto a canvas.
 *
 * @param {string} src - The image source URL.
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = (err) => reject(err);
    image.src = src;
  });
}

/**
 * Crops the top-right region of a captured page image onto a fresh,
 * detached canvas. Documents in this app print their numeric ID in the
 * top-right corner of page 1, so isolating that region before running
 * OCR both speeds up recognition and removes unrelated text/noise that
 * could otherwise confuse the engine.
 *
 * @param {string} imageUrl - Object URL (or data URL) of the full captured page.
 * @param {object} [options]
 * @param {number} [options.heightRatio=0.25] - Fraction of the full image height to keep, measured from the top.
 * @param {number} [options.widthRatio=0.5] - Fraction of the full image width to keep, measured from the right edge.
 * @param {number} [options.upscale=2] - Multiplier applied to the cropped region's resolution to improve OCR accuracy on small text.
 * @returns {Promise<HTMLCanvasElement>} A detached canvas containing only the cropped, upscaled region.
 */
export async function cropTopRightRegion(imageUrl, options = {}) {
  const { heightRatio = 0.25, widthRatio = 0.5, upscale = 2 } = options;

  const image = await loadImage(imageUrl);
  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;

  const cropWidth = Math.max(1, Math.round(sourceWidth * widthRatio));
  const cropHeight = Math.max(1, Math.round(sourceHeight * heightRatio));
  const sourceX = sourceWidth - cropWidth;
  const sourceY = 0;

  const canvas = document.createElement('canvas');
  canvas.width = cropWidth * upscale;
  canvas.height = cropHeight * upscale;

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, sourceX, sourceY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);

  return canvas;
}

/**
 * Applies a lightweight grayscale + contrast-boost pass directly on a
 * canvas's pixel buffer. Printed ID numbers OCR far more reliably once
 * color noise and mid-tone shadows are pushed toward pure black/white,
 * which is especially helpful for phone-camera captures with uneven
 * lighting. Mutates the canvas in place and also returns it for chaining.
 *
 * @param {HTMLCanvasElement} canvas
 * @returns {HTMLCanvasElement}
 */
export function preprocessCanvasForOcr(canvas) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;

    let value;
    if (gray > 150) {
      value = 255;
    } else if (gray < 90) {
      value = 0;
    } else {
      value = gray;
    }

    pixels[i] = value;
    pixels[i + 1] = value;
    pixels[i + 2] = value;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}
