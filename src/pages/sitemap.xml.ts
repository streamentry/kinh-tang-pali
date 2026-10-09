import type { APIRoute } from 'astro';
import { COLLECTIONS, loadCatalog } from '../lib/canon/load';
import { withBase } from '../lib/url';

export const GET: APIRoute = ({ site }) => {
  const paths = ['', 'credits/', 'quality/', ...COLLECTIONS.flatMap(collection => [
    `sutta/${collection.code}/`,
    ...loadCatalog(collection.code).texts.map(text => `sutta/${collection.code}/${text.uid}/`),
  ])];
  const escapeXml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path => `<url><loc>${escapeXml(new URL(withBase(path), site).href)}</loc></url>`).join('')}</urlset>`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
