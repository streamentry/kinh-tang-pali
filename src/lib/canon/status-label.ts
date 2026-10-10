/** Vietnamese words for the project's status codes; the code itself stays in classes and data. */
export const STATUS_LABEL: Record<string, string> = {
  published: 'Đã xuất bản',
  review: 'Đang duyệt',
  draft: 'Bản nháp',
  'not-started': 'Chưa dịch',
};

/**
 * Reading time for the project's Vietnamese text, in minutes.
 *
 * Vietnamese words are syllables, and scripture is read slowly; 220 per minute is a
 * deliberately unhurried rate. It is an estimate for orientation, shown as "khoảng".
 */
export function readingMinutes(texts: readonly (string | undefined)[]): number | undefined {
  const words = texts.reduce((sum, text) => sum + (text?.trim() ? text.trim().split(/\s+/).length : 0), 0);
  return words > 0 ? Math.max(1, Math.round(words / 220)) : undefined;
}
