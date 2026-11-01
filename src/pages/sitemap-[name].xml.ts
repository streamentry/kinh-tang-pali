import type { APIRoute, GetStaticPaths } from 'astro';
import { sitemapNames, sitemapNamespace, sitemapPaths, sitemapUrl, xmlEscape, xmlHeader, xmlHeaders } from '../lib/sitemap';

export const getStaticPaths: GetStaticPaths = () => sitemapNames.map(name => ({ params: { name } }));

export const GET: APIRoute = ({ site, params }) => {
  const urls = sitemapPaths(params.name!).map(path => sitemapUrl(path, site));
  if (urls.length > 50_000 || new Set(urls).size !== urls.length) throw new Error(`Invalid sitemap ${params.name}: too many or duplicate URLs`);
  const xml = `${xmlHeader}<urlset xmlns="${sitemapNamespace}">\n${urls.map(url => `  <url><loc>${xmlEscape(url)}</loc></url>`).join('\n')}\n</urlset>\n`;
  if (new TextEncoder().encode(xml).length > 52_428_800) throw new Error(`Sitemap ${params.name} exceeds 50 MiB`);
  return new Response(xml, { headers: xmlHeaders });
};
