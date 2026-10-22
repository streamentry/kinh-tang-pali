/**
 * How much one continuous-reading page may hold.
 *
 * Measured on the 2026-10-22 build before this layer existed: a reader page costs about 1.4 KB of
 * HTML per segment (an3.65: 206 KB for 108 segments, mnd1: 758 KB for 516), and the 669 groups
 * whose children are all texts have a median of 10 texts / 200 segments, p90 606, p99 2,788 and a
 * maximum of 12,291 (Mahāniddesa). 800 segments is ≈1.1 MB of HTML (≈0.2 MB gzipped), the size of
 * an ordinary long sutta page, and keeps nine groups in ten on a single page. A group above the
 * budget is split at text boundaries into numbered parts; a single text above it is not copied at
 * all, only linked, because its own page already is that page.
 */
export const CONTINUOUS_READING_BUDGET = {
  maxSegmentsPerPart: 800,
  maxTextsPerPart: 30,
} as const;

export interface ReadingItem { uid: string; segments: number }

export type ReadingEntry =
  | { type: 'text'; uid: string; segments: number }
  /** Too long to copy into a continuous page: shown as a link to its own page. */
  | { type: 'link'; uid: string; segments: number };

/**
 * Split a group's texts, in order, into parts within the budget. Every text appears in exactly
 * one part, in its original order; no part is empty.
 */
export function planReadingParts(items: readonly ReadingItem[], budget = CONTINUOUS_READING_BUDGET): ReadingEntry[][] {
  const parts: ReadingEntry[][] = [];
  let current: ReadingEntry[] = [];
  let segments = 0;
  const flush = () => {
    if (current.length) parts.push(current);
    current = [];
    segments = 0;
  };
  for (const item of items) {
    const oversized = item.segments > budget.maxSegmentsPerPart;
    const cost = oversized ? 0 : item.segments;
    if (current.length && (segments + cost > budget.maxSegmentsPerPart || current.length >= budget.maxTextsPerPart)) flush();
    current.push(oversized ? { type: 'link', uid: item.uid, segments: item.segments } : { type: 'text', uid: item.uid, segments: item.segments });
    segments += cost;
  }
  flush();
  return parts;
}

/** Page path of part `index` (0-based): the first part keeps the plain `doc/` URL. */
export function readingPartPath(groupBase: string, index: number): string {
  return index === 0 ? `${groupBase}doc/` : `${groupBase}doc/${index + 1}/`;
}
