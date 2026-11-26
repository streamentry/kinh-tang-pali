import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';

const origin = 'https://streamentry.github.io/kinh-tang-pali/';
function htmlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? htmlFiles(join(dir, entry.name)) : entry.name.endsWith('.html') ? [join(dir, entry.name)] : []);
}
// Parse actual XML, enforce the sitemap protocol's uncompressed limits, and require
// every child to live under this site's base. No network or third-party XML entities.
const locations: string[] = JSON.parse(execFileSync('python3', ['scripts/check-sitemaps.py', origin], { encoding: 'utf8' }));
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
  // Search and the continuous-reading views of a group are noindex and stay out of the sitemap;
  // the reading view repeats scripture whose own page is the one to index.
  const mustBeNoindex = path === 'search/' || /^sutta\/(sn|an|kn)\/nhom\/[^/]+\/doc\/(\d+\/)?$/.test(path);
  const isNoindex = html.includes('content="noindex,follow"');
  if (mustBeNoindex && !isNoindex) throw new Error(`Must be noindex: ${file}`);
  if (!mustBeNoindex && isNoindex) throw new Error(`Unexpected noindex: ${file}`);
  if (!isNoindex) expected.add(url);
  if (/href="\/(?:sutta|search)\//.test(html)) throw new Error(`Link omits base: ${file}`);
}
if (locations.length !== new Set(locations).size) throw new Error('Duplicate sitemap URLs');
if (locations.length !== expected.size || locations.some(url => !expected.has(url))) throw new Error('Sitemap and indexable HTML differ');
console.log(`SEO output verified: ${expected.size} indexable pages, canonical/metadata/JSON-LD/base links and sitemap match.`);
