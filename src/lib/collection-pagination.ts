import type { CollectionCode } from './canon/types';

/** Keep the shorter DN/MN directories intact; bound HTML size for the large collections. */
export function collectionPageSize(code: CollectionCode): number {
  return ['sn', 'an', 'kn'].includes(code) ? 100 : Number.MAX_SAFE_INTEGER;
}

export function collectionPageCount(code: CollectionCode, total: number): number {
  return Math.max(1, Math.ceil(total / collectionPageSize(code)));
}

/** Page one retains the existing public collection URL. */
export function collectionPagePath(code: CollectionCode, page: number): string {
  return `sutta/${code}/${page === 1 ? '' : `page/${page}/`}`;
}

export function collectionPageLinks(page: number, count: number): number[] {
  return Array.from(new Set([1, page - 1, page, page + 1, count]))
    .filter(value => value >= 1 && value <= count).sort((a, b) => a - b);
}
