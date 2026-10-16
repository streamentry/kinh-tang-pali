import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { COLLECTIONS, loadCatalog } from '../../src/lib/canon/load';
import { collectionPageCount, collectionPageLinks, collectionPagePath, collectionPageSize } from '../../src/lib/collection-pagination';

test('collection pages preserve every canonical UID exactly once in order', () => {
  for (const { code } of COLLECTIONS) {
    const texts = loadCatalog(code).texts;
    const count = collectionPageCount(code, texts.length);
    const size = collectionPageSize(code);
    const pages = Array.from({ length: count }, (_, index) => texts.slice(index * size, (index + 1) * size));
    assert.deepEqual(pages.flat().map(text => text.uid), texts.map(text => text.uid));
    assert.equal(new Set(pages.flat().map(text => text.uid)).size, texts.length);
    assert.equal(count === 1, code === 'dn' || code === 'mn');
    assert.ok(pages.every(page => page.length > 0 && page.length <= size));
  }
  assert.equal(collectionPageCount('sn', 100), 1);
  assert.equal(collectionPageCount('sn', 101), 2);
  assert.equal(collectionPageCount('sn', 0), 1);
});

test('page navigation includes boundaries and neighbours without invalid or duplicate links', () => {
  for (let count = 1; count <= 30; count++) {
    for (let page = 1; page <= count; page++) {
      const links = collectionPageLinks(page, count);
      assert.equal(links[0], 1);
      assert.equal(links.at(-1), count);
      assert.ok(links.includes(page));
      if (page > 1) assert.ok(links.includes(page - 1));
      if (page < count) assert.ok(links.includes(page + 1));
      assert.equal(new Set(links).size, links.length);
      assert.ok(links.every(value => value >= 1 && value <= count));
    }
  }
  assert.equal(collectionPagePath('sn', 1), 'sutta/sn/');
  assert.equal(collectionPagePath('sn', 2), 'sutta/sn/page/2/');
});

test('built directories retain all links and paginate only the large collections', { skip: !existsSync('dist/sutta/sn/index.html') }, () => {
  for (const { code } of COLLECTIONS) {
    const texts = loadCatalog(code).texts;
    const count = collectionPageCount(code, texts.length);
    const found: string[] = [];
    for (let page = 1; page <= count; page++) {
      const html = readFileSync(`dist/${collectionPagePath(code, page)}index.html`, 'utf8');
      const links = [...html.matchAll(new RegExp(`href="/kinh-tang-pali/sutta/${code}/([^/" ]+)/"`, 'g'))].map(match => match[1]);
      assert.equal(links.length, Math.min(collectionPageSize(code), texts.length - found.length));
      found.push(...links);
      if (count > 1) {
        assert.ok(html.includes(`aria-label="Trang ${page}" aria-current="page"`));
        if (page < count) assert.ok(html.includes(`href="/kinh-tang-pali/${collectionPagePath(code, page + 1)}" rel="next"`));
        if (page > 1) assert.ok(html.includes(`href="/kinh-tang-pali/${collectionPagePath(code, page - 1)}" rel="prev"`));
      }
    }
    assert.deepEqual(found, [...texts].sort((a, b) => a.order - b.order).map(text => text.uid));
  }
});
