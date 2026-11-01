import { COLLECTIONS, loadCatalog } from './canon/load';
import { allGroups, groupHref } from './canon/groups';
import { NAVIGATION_COLLECTIONS } from './canon/navigation-types';
import { collectionPageCount, collectionPagePath } from './collection-pagination';
import type { CollectionCode } from './canon/types';
import { withBase } from './url';

export const sitemapNames = ['pages', ...COLLECTIONS.map(collection => collection.code)];

export function sitemapPaths(name: string): string[] {
  if (name === 'pages') return ['', 'credits/', 'quality/'];
  const collection = COLLECTIONS.find(item => item.code === name);
  if (!collection) throw new Error(`Unknown sitemap: ${name}`);
  const code: CollectionCode = collection.code;
  const texts = loadCatalog(code).texts;
  return [
    ...Array.from({ length: collectionPageCount(code, texts.length) }, (_, index) => collectionPagePath(code, index + 1)),
    ...texts.map(text => `sutta/${code}/${text.uid}/`),
    ...(NAVIGATION_COLLECTIONS.includes(code as (typeof NAVIGATION_COLLECTIONS)[number])
      ? allGroups(code as (typeof NAVIGATION_COLLECTIONS)[number]).map(node => groupHref(code as (typeof NAVIGATION_COLLECTIONS)[number], node.id)) : []),
  ];
}

export function sitemapUrl(path: string, site: URL | undefined): string {
  if (!site) throw new Error('Astro site must be configured for absolute sitemap URLs');
  return new URL(withBase(path), site).href;
}

export function xmlEscape(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
export const sitemapNamespace = 'http://www.sitemaps.org/schemas/sitemap/0.9';
export const xmlHeaders = { 'Content-Type': 'application/xml; charset=utf-8' };
