// src/utils/banglaNumerals.js
//
// Bengali (Bangla) digits map to a different Unicode range than the
// standard Arabic numerals (0-9) that the rest of the app and the
// generated PDF filename rely on. OCR engines (including Tesseract's
// "ben" language pack) will often return Bangla glyphs for numbers
// printed on a Bangla-language document, even when the visual shape
// is a digit. This module normalizes any such text into plain
// English digits before we try to extract an ID from it.

/**
 * Maps each Bangla digit character to its English (Arabic numeral) equivalent.
 * ০ = 0, ১ = 1, ২ = 2, ৩ = 3, ৪ = 4, ৫ = 5, ৬ = 6, ৭ = 7, ৮ = 8, ৯ = 9
 */
export const BANGLA_DIGIT_MAP = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

const BANGLA_DIGIT_REGEX = /[০-৯]/g;

/**
 * Replaces every Bangla digit character found in a string with its
 * English digit equivalent. Any character that is not a Bangla digit
 * (including English digits, letters, and punctuation) is left untouched.
 *
 * @param {string} input - Raw text, possibly containing Bangla digits.
 * @returns {string} The same text with Bangla digits converted to English digits.
 */
export function convertBanglaDigitsToEnglish(input) {
  if (typeof input !== 'string' || input.length === 0) {
    return '';
  }

  return input.replace(BANGLA_DIGIT_REGEX, (banglaChar) => BANGLA_DIGIT_MAP[banglaChar] ?? banglaChar);
}

/**
 * Takes raw OCR output (which may mix English text, Bangla text, Bangla
 * digits, English digits, whitespace, and noise characters) and returns
 * the most likely numeric ID found in it.
 *
 * Strategy:
 *  1. Normalize any Bangla digits to English digits.
 *  2. Find every contiguous run of English digits in the normalized text.
 *  3. Return the longest run, since the ID is almost always the longest
 *     unbroken digit sequence on the page (stray single digits from
 *     noise, page numbers, or OCR artifacts tend to be shorter).
 *
 * @param {string} rawOcrText - The raw string returned by the OCR engine.
 * @returns {string} The extracted numeric ID as a string of English digits, or '' if none found.
 */
export function extractNumericId(rawOcrText) {
  if (typeof rawOcrText !== 'string' || rawOcrText.length === 0) {
    return '';
  }

  const normalized = convertBanglaDigitsToEnglish(rawOcrText);
  const digitRuns = normalized.match(/\d+/g);

  if (!digitRuns || digitRuns.length === 0) {
    return '';
  }

  return digitRuns.reduce((longestSoFar, current) => (current.length > longestSoFar.length ? current : longestSoFar), '');
}
