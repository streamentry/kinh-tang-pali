import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const checker = resolve('scripts/check-sitemaps.py');
const origin = 'https://example.org/site/';
const ns = 'http://www.sitemaps.org/schemas/sitemap/0.9';

test('built sitemap parser accepts valid XML and rejects broken, out-of-scope, or unlisted files', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sitemaps-'));
  const dist = join(dir, 'dist');
  mkdirSync(dist);
  const write = (name: string, value: string) => writeFileSync(join(dist, name), value);
  const run = () => spawnSync('python3', [checker, origin], { cwd: dir, encoding: 'utf8' });
  try {
    write('sitemap.xml', `<sitemapindex xmlns="${ns}"><sitemap><loc>${origin}sitemap-pages.xml</loc></sitemap></sitemapindex>`);
    write('sitemap-pages.xml', `<urlset xmlns="${ns}"><url><loc>${origin}?a=1&amp;b=2</loc></url></urlset>`);
    assert.notEqual(run().status, 0, 'query URLs must be rejected after XML decoding');
    write('sitemap-pages.xml', `<urlset xmlns="${ns}"><url><loc>${origin}one/</loc></url></urlset>`);
    const valid = run();
    assert.equal(valid.status, 0, valid.stderr);
    assert.deepEqual(JSON.parse(valid.stdout), [`${origin}one/`]);
    write('sitemap-pages.xml', '<urlset>');
    assert.notEqual(run().status, 0, 'malformed XML must be rejected');
    write('sitemap-pages.xml', `<urlset xmlns="${ns}"><url><loc>https://elsewhere.example/</loc></url></urlset>`);
    assert.notEqual(run().status, 0, 'external URLs must be rejected');
    write('sitemap-pages.xml', `<urlset xmlns="${ns}"/>`);
    write('sitemap-extra.xml', `<urlset xmlns="${ns}"/>`);
    assert.notEqual(run().status, 0, 'unlisted child sitemap must be rejected');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
