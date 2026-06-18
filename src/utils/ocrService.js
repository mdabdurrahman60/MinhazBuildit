// src/utils/ocrService.js
//
// Wraps Tesseract.js so the rest of the app only ever has to call one
// function and get back a clean numeric string. A fresh worker is
// created for every recognition pass and explicitly terminated
// afterward (success or failure) — this keeps memory usage minimal and
// ensures no recognition state lingers between scans, in line with the
// app's "wipe everything" privacy goal.

//import { createWorker } from 'tesseract.js';
import * as Tesseract from 'tesseract.js';
import { cropTopRightRegion, preprocessCanvasForOcr } from './imageProcessing.js';
import { extractNumericId } from './banglaNumerals.js';

const { createWorker } = Tesseract;
const OCR_LANGUAGES = 'eng+ben';
const DIGIT_WHITELIST = '0123456789০১২৩৪৫৬৭৮৯';

export async function recognizeText(image) {
  const worker = await createWorker('eng');

  try {
    const {
      data: { text },
    } = await worker.recognize(image);

    return text;
  } finally {
    await worker.terminate();
  }
}

/**
 * Runs the full OCR pipeline against a captured page image and returns
 * the best-guess numeric ID found in its top-right corner.
 *
 * @param {string} pageImageUrl - Object URL of the full captured page image.
 * @param {(progressPercent: number) => void} [onProgress] - Called repeatedly with 0-100 as recognition proceeds.
 * @returns {Promise<string>} The extracted numeric ID (English digits only), or '' if nothing was found.
 */
export async function extractIdFromPageImage(pageImageUrl, onProgress) {
  const croppedCanvas = await cropTopRightRegion(pageImageUrl, {
    heightRatio: 0.05,
    widthRatio: 0.5,
    upscale: 2,
  });
  preprocessCanvasForOcr(croppedCanvas);

  let worker = null;

  try {
    worker = await createWorker(OCR_LANGUAGES, 1, {
      logger: (message) => {
        if (
          onProgress &&
          message &&
          message.status === 'recognizing text' &&
          typeof message.progress === 'number'
        ) {
          onProgress(Math.round(message.progress * 100));
        }
      },
    });

    await worker.setParameters({
      tessedit_char_whitelist: DIGIT_WHITELIST,
      tessedit_pageseg_mode: '6', // Assume a single uniform block of text
    });

    const { data } = await worker.recognize(croppedCanvas);
    const rawText = data && typeof data.text === 'string' ? data.text : '';

    return extractNumericId(rawText);
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}
