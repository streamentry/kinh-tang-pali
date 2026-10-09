import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const origin = 'https://streamentry.github.io/kinh-tang-pali/';
function htmlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? htmlFiles(join(dir, entry.name)) : entry.name.endsWith('.html') ? [join(dir, entry.name)] : []);
}
const sitemap = readFileSync('dist/sitemap.xml', 'utf8');
const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
const expected = new Set<string>();
for (const file of htmlFiles('dist')) {
  const path = relative('dist', file).replace(/index\.html$/, '');
  const url = origin + path;
  const html = readFileSync(file, 'utf8');
  if (!html.includes(`rel="canonical" href="${url}"`)) throw new Error(`Wrong canonical: ${file}`);
  for (const marker of ['name="description"', 'property="og:url"', 'application/ld+json']) {
    if (!html.includes(marker)) throw new Error(`Missing ${marker}: ${file}`);
  }
  for (const match of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) JSON.parse(match[1]);
  if (path === 'search/') {
    if (!html.includes('noindex,follow')) throw new Error('Search must be noindex');
  } else expected.add(url);
  if (/href="\/(?:sutta|search)\//.test(html)) throw new Error(`Link omits base: ${file}`);
}
if (locations.length !== new Set(locations).size) throw new Error('Duplicate sitemap URLs');
if (locations.length !== expected.size || locations.some(url => !expected.has(url))) throw new Error('Sitemap and indexable HTML differ');
console.log(`SEO output verified: ${expected.size} indexable pages, canonical/metadata/JSON-LD/base links and sitemap match.`);
