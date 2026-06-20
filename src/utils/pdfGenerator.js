// src/utils/pdfGenerator.js
//
// Compiles the captured page images into a single PDF entirely in
// memory using pdf-lib, triggers a browser download, and then releases
// the generated PDF's object URL. No network requests are made and
// nothing is ever written to a server.

import { PDFDocument } from 'pdf-lib';

const A4_WIDTH_POINTS = 595.28; // Standard A4 width in PDF points (1/72 inch)

/**
 * Fetches the bytes behind a blob: (or data:) URL.
 * @param {string} url
 * @returns {Promise<ArrayBuffer>}
 */
async function readUrlAsArrayBuffer(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Unable to read captured image data.');
  }
  return response.arrayBuffer();
}

/**
 * Builds a sanitized, filesystem-safe file name from the extracted ID.
 * @param {string} baseName
 * @returns {string}
 */
function buildFileName(baseName) {
  const cleaned = (baseName || '').toString().trim().replace(/[^a-zA-Z0-9_-]/g, '');
  return `${cleaned || 'document'}.pdf`;
}

/**
 * Compiles one or more page images (in order) into a single PDF, where
 * each PDF page is sized to that image's aspect ratio scaled to a
 * standard A4 width, then immediately downloads the result using the
 * supplied base name as the file name.
 *
 * @param {string[]} imageUrls - Object URLs of the captured page images, in the order they should appear in the PDF.
 * @param {string} fileBaseName - The name to use for the downloaded file, without the .pdf extension (typically the extracted ID).
 * @returns {Promise<string>} The final file name that was downloaded.
 */
export async function generateAndDownloadPdf(imageUrls, fileBaseName) {
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    throw new Error('No pages available to generate a PDF.');
  }

  const pdfDoc = await PDFDocument.create();

  for (const url of imageUrls) {
    const arrayBuffer = await readUrlAsArrayBuffer(url);

    let embeddedImage;
    try {
      // Try JPEG first for maximum quality with scans
      embeddedImage = await pdfDoc.embedJpg(arrayBuffer);
    } catch (error) {
      // Fallback to PNG if JPEG embedding fails
      embeddedImage = await pdfDoc.embedPng(arrayBuffer);
    }

    const scale = A4_WIDTH_POINTS / embeddedImage.width;
    const pageWidth = A4_WIDTH_POINTS;
    const pageHeight = embeddedImage.height * scale;

    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
    });
  }

  const pdfBytes = await pdfDoc.save();
  const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
  const downloadUrl = URL.createObjectURL(pdfBlob);
  const finalFileName = buildFileName(fileBaseName);

  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = finalFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Give the browser a moment to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 2000);

  return finalFileName;
}
