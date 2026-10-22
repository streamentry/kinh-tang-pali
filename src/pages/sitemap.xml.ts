import type { APIRoute } from 'astro';
import { COLLECTIONS, loadCatalog } from '../lib/canon/load';
import { collectionPageCount, collectionPagePath } from '../lib/collection-pagination';
import { withBase } from '../lib/url';
import { allGroups, groupHref } from '../lib/canon/groups';
import { NAVIGATION_COLLECTIONS } from '../lib/canon/navigation-types';

export const GET: APIRoute = ({ site }) => {
  const paths = ['', 'credits/', 'quality/', ...COLLECTIONS.flatMap(collection => [
    ...Array.from({ length: collectionPageCount(collection.code, loadCatalog(collection.code).texts.length) },
      (_, index) => collectionPagePath(collection.code, index + 1)),
    ...loadCatalog(collection.code).texts.map(text => `sutta/${collection.code}/${text.uid}/`),
  ]),
  // Group pages are indexable; their continuous-reading pages (`…/doc/`) are noindex and left out.
  ...NAVIGATION_COLLECTIONS.flatMap(code => allGroups(code).map(node => groupHref(code, node.id)))];
  const escapeXml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path => `<url><loc>${escapeXml(new URL(withBase(path), site).href)}</loc></url>`).join('')}</urlset>`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
