import type { APIRoute } from 'astro';
import { sitemapNames, sitemapNamespace, sitemapUrl, xmlEscape, xmlHeader, xmlHeaders } from '../lib/sitemap';

export const GET: APIRoute = ({ site }) => new Response(
  `${xmlHeader}<sitemapindex xmlns="${sitemapNamespace}">\n${sitemapNames.map(name => `  <sitemap><loc>${xmlEscape(sitemapUrl(`sitemap-${name}.xml`, site))}</loc></sitemap>`).join('\n')}\n</sitemapindex>\n`,
  { headers: xmlHeaders },
);
