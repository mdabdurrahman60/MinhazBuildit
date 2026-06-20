/**
 * CamScanner-style document enhancement system
 * Detects document edges, corrects perspective, removes background, and creates
 * a clean black-and-white scan suitable for OCR and document archival.
 */

/**
 * Checks if OpenCV.js is loaded and available
 * @returns {boolean}
 */
export function isOpenCvReady() {
  return typeof cv !== 'undefined';
}

/**
 * Detects the document's boundaries in the image using edge detection and contour analysis
 * @param {HTMLImageElement} image - The source image
 * @returns {Array|null} Array of 4 corner points [[x1,y1], [x2,y2], [x3,y3], [x4,y4]] or null if detection fails
 */
function detectDocumentContour(image) {
  if (!isOpenCvReady()) return null;

  try {
    let src = cv.imread(image);
    let gray = new cv.Mat();
    let edges = new cv.Mat();
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();

    // Convert to grayscale
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // Apply Gaussian blur to reduce noise
    let blurred = new cv.Mat();
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

    // Edge detection using Canny
    cv.Canny(blurred, edges, 50, 150);

    // Dilate edges to connect nearby lines
    let kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(5, 5));
    let dilated = new cv.Mat();
    cv.dilate(edges, dilated, kernel, new cv.Point(-1, -1), 2);

    // Find contours
    cv.findContours(dilated, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    // Find the largest quadrilateral contour
    let maxArea = 0;
    let docContour = null;

    for (let i = 0; i < contours.size(); i++) {
      let contour = contours.get(i);
      let area = cv.contourArea(contour);

      // Filter by area (document should be reasonably large)
      if (area > 5000) {
        let epsilon = 0.02 * cv.arcLength(contour, true);
        let approx = new cv.Mat();
        cv.approxPolyDP(contour, approx, epsilon, true);

        // Look for quadrilaterals (4-sided polygons)
        if (approx.rows === 4 && area > maxArea) {
          maxArea = area;
          docContour = approx;
        }
        approx.delete();
      }
      contour.delete();
    }

    // Extract corner points
    let cornerPoints = null;
    if (docContour) {
      cornerPoints = [];
      for (let i = 0; i < docContour.rows; i++) {
        let point = docContour.data32S;
        cornerPoints.push([
          point[i * 2],
          point[i * 2 + 1]
        ]);
      }
      docContour.delete();
    }

    // Cleanup
    src.delete();
    gray.delete();
    edges.delete();
    blurred.delete();
    dilated.delete();
    kernel.delete();
    contours.delete();
    hierarchy.delete();

    return cornerPoints;
  } catch (error) {
    console.error('Document contour detection failed:', error);
    return null;
  }
}

/**
 * Sorts corner points in proper order (top-left, top-right, bottom-right, bottom-left)
 * @param {Array} corners - Array of 4 corner points
 * @returns {Array} Sorted corner points
 */
function sortCorners(corners) {
  // Sort by y coordinate first, then x coordinate
  const sorted = corners.sort((a, b) => a[1] - b[1]);

  // Split into top and bottom rows
  const top = sorted.slice(0, 2).sort((a, b) => a[0] - b[0]);
  const bottom = sorted.slice(2, 4).sort((a, b) => a[0] - b[0]);

  return [...top, bottom[1], bottom[0]]; // Return in clockwise order
}

/**
 * Performs perspective correction on the document
 * @param {HTMLImageElement} image - Source image
 * @param {Array} corners - 4 corner points of the document
 * @returns {HTMLCanvasElement|null} Canvas with perspective-corrected image
 */
function perspectiveCorrection(image, corners) {
  if (!isOpenCvReady() || !corners || corners.length !== 4) return null;

  try {
    const src = cv.imread(image);
    const sortedCorners = sortCorners(corners);

    // Calculate output dimensions based on document size
    const width = Math.hypot(
      sortedCorners[1][0] - sortedCorners[0][0],
      sortedCorners[1][1] - sortedCorners[0][1]
    );
    const height = Math.hypot(
      sortedCorners[3][0] - sortedCorners[0][0],
      sortedCorners[3][1] - sortedCorners[0][1]
    );

    // Create source and destination points
    const srcPoints = cv.matFromArray(4, 1, cv.CV_32F, sortedCorners.flat());
    const dstPoints = cv.matFromArray(4, 1, cv.CV_32F, [
      0, 0,
      width, 0,
      width, height,
      0, height
    ]);

    // Get perspective transformation matrix
    const perspectiveMatrix = cv.getPerspectiveTransform(srcPoints, dstPoints);

    // Apply perspective transformation
    const dst = new cv.Mat();
    const dsize = new cv.Size(width, height);
    cv.warpPerspective(src, dst, perspectiveMatrix, dsize);

    // Convert to canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    cv.imshow(canvas, dst);

    // Cleanup
    src.delete();
    dst.delete();
    srcPoints.delete();
    dstPoints.delete();
    perspectiveMatrix.delete();

    return canvas;
  } catch (error) {
    console.error('Perspective correction failed:', error);
    return null;
  }
}

/**
 * Enhances document contrast and converts to clean black and white
 * Removes shadows, noise, and creates a professional scan appearance
 * @param {HTMLCanvasElement} canvas - Canvas with the document
 * @returns {HTMLCanvasElement} Enhanced canvas
 */
function enhanceDocumentImage(canvas) {
  if (!isOpenCvReady()) return enhanceDocumentImageFallback(canvas);

  try {
    const src = cv.imread(canvas);
    let dst = new cv.Mat();

    // Convert to grayscale if needed
    if (src.channels() === 4 || src.channels() === 3) {
      const gray = new cv.Mat();
      cv.cvtColor(src, gray, src.channels() === 4 ? cv.COLOR_RGBA2GRAY : cv.COLOR_RGB2GRAY);
      src.delete();

      // Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
      // This removes shadows and improves contrast
      const clahe = cv.createCLAHE(2.0, new cv.Size(8, 8));
      clahe.apply(gray, dst);
      gray.delete();
    } else {
      cv.cvtColor(src, dst, cv.COLOR_GRAY2GRAY);
    }

    // Bilateral filter to reduce noise while preserving edges
    const filtered = new cv.Mat();
    cv.bilateralFilter(dst, filtered, 9, 75, 75);
    dst.delete();

    // Morphological operations to remove small noise
    const kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(3, 3));
    const morphed = new cv.Mat();
    cv.morphologyEx(filtered, morphed, cv.MORPH_OPEN, kernel);
    filtered.delete();

    // Adaptive thresholding for clean black and white
    const bw = new cv.Mat();
    cv.adaptiveThreshold(morphed, bw, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);
    morphed.delete();
    kernel.delete();

    // Apply morphological close to fill small holes
    const kernel2 = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2, 2));
    const final = new cv.Mat();
    cv.morphologyEx(bw, final, cv.MORPH_CLOSE, kernel2);
    bw.delete();
    kernel2.delete();

    // Convert back to canvas
    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = canvas.width;
    resultCanvas.height = canvas.height;
    cv.imshow(resultCanvas, final);
    final.delete();
    src.delete();

    return resultCanvas;
  } catch (error) {
    console.error('Document enhancement with OpenCV failed:', error);
    return enhanceDocumentImageFallback(canvas);
  }
}

/**
 * Fallback enhancement using canvas operations when OpenCV is not available
 * @param {HTMLCanvasElement} canvas - Canvas with the document
 * @returns {HTMLCanvasElement} Enhanced canvas
 */
function enhanceDocumentImageFallback(canvas) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  // Apply contrast enhancement and noise reduction
  for (let i = 0; i < pixels.length; i += 4) {
    let r = pixels[i];
    let g = pixels[i + 1];
    let b = pixels[i + 2];

    // Convert to grayscale
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;

    // Apply contrast stretching
    let contrast = (gray - 128) * 1.5 + 128;
    contrast = Math.max(0, Math.min(255, contrast));

    // Convert to black and white with threshold
    const value = contrast > 140 ? 255 : 0;

    pixels[i] = value;
    pixels[i + 1] = value;
    pixels[i + 2] = value;
    // Keep alpha channel as is
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Main document enhancement pipeline
 * Detects edges, corrects perspective, and enhances the image
 * @param {string} imageUrl - URL of the captured image
 * @returns {Promise<{canvas: HTMLCanvasElement, enhanced: boolean, cornerPoints: Array|null}>}
 */
export async function enhanceDocument(imageUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        // Detect document corners
        const cornerPoints = detectDocumentContour(img);

        let resultCanvas;
        let enhanced = false;

        if (cornerPoints && cornerPoints.length === 4) {
          // Apply perspective correction
          const corrected = perspectiveCorrection(img, cornerPoints);

          if (corrected) {
            // Enhance the corrected image
            resultCanvas = enhanceDocumentImage(corrected);
            enhanced = true;
          } else {
            // Fallback: enhance original image
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            const ctx = tempCanvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resultCanvas = enhanceDocumentImage(tempCanvas);
          }
        } else {
          // No document detected, apply enhancement only
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = img.width;
          tempCanvas.height = img.height;
          const ctx = tempCanvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resultCanvas = enhanceDocumentImage(tempCanvas);
        }

        resolve({
          canvas: resultCanvas,
          enhanced: enhanced,
          cornerPoints: cornerPoints
        });
      } catch (error) {
        console.error('Document enhancement failed:', error);
        // Return original image as fallback
        const fallbackCanvas = document.createElement('canvas');
        fallbackCanvas.width = img.width;
        fallbackCanvas.height = img.height;
        const ctx = fallbackCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve({
          canvas: fallbackCanvas,
          enhanced: false,
          cornerPoints: null
        });
      }
    };

    img.onerror = () => {
      console.error('Failed to load image for enhancement');
      resolve({
        canvas: null,
        enhanced: false,
        cornerPoints: null
      });
    };

    img.src = imageUrl;
  });
}

/**
 * Creates a visual preview with document corners highlighted
 * @param {string} imageUrl - URL of the source image
 * @param {Array} cornerPoints - 4 corner points to highlight
 * @returns {Promise<string>} Data URL of the preview image
 */
export async function createCornerPreview(imageUrl, cornerPoints) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      // Draw the image
      ctx.drawImage(img, 0, 0);

      if (cornerPoints && cornerPoints.length === 4) {
        // Draw corner circles
        ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
        cornerPoints.forEach(([x, y]) => {
          ctx.beginPath();
          ctx.arc(x, y, 15, 0, 2 * Math.PI);
          ctx.fill();
        });

        // Draw connecting lines
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cornerPoints[0][0], cornerPoints[0][1]);
        ctx.lineTo(cornerPoints[1][0], cornerPoints[1][1]);
        ctx.lineTo(cornerPoints[2][0], cornerPoints[2][1]);
        ctx.lineTo(cornerPoints[3][0], cornerPoints[3][1]);
        ctx.closePath();
        ctx.stroke();

        // Draw corner labels
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        cornerPoints.forEach((point, index) => {
          ctx.fillText(index + 1, point[0], point[1]);
        });
      }

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => {
      resolve(null);
    };

    img.src = imageUrl;
  });
}

/**
 * Converts the enhanced document canvas to a blob with high quality
 * @param {HTMLCanvasElement} canvas - The enhanced document canvas
 * @param {number} quality - JPEG quality (0-1)
 * @returns {Promise<Blob>}
 */
export function canvasToBlob(canvas, quality = 0.95) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to convert canvas to blob'));
      },
      'image/jpeg',
      quality
    );
  });
}
