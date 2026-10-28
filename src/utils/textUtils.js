/**
 * Utility functions for text cleaning and formatting
 */

/**
 * Removes emoji characters and cleans up surrounding whitespace/punctuation
 * @param {string} str - Input text
 * @returns {string} Cleaned text without emojis
 */
export function stripEmoji(str) {
  if (!str) return '';
  return str
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\u200D]+/gu, '')
    .replace(/\s+\)/g, ')')
    .replace(/\(\s+/g, '(')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Converts English numbers or numeric strings into Bengali numerals
 * e.g. 12 -> '১২', 0 -> '০', 4980 -> '৪,৯৮০' (with comma support)
 */
export function toBengaliNumerals(n) {
  if (n === null || n === undefined || n === '') return '০';
  const bn = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
  // If number, format with locale comma first
  const str = typeof n === 'number' ? n.toLocaleString('en-US') : String(n);
  return str.replace(/[0-9]/g, d => bn[d]);
}

