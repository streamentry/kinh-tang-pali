/**
 * Cover images on Dīgha and Majjhima reading pages.
 *
 * A cover is someone else's photograph or a museum's object, shown under its own licence.
 * These tests hold the registry to what the page promises: one verified file per sutta,
 * terms the project may publish under, an author wherever the licence asks for one, and a
 * credit line printed next to the image.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { normaliseLicence } from '../../scripts/sutta-covers.mjs';

interface Cover {
  uid: string; collection: string; file: string; sourcePage: string; sourceUrl: string;
  originalSha1: string; author: string | null; license: string; licenseUrl: string | null;
  titleVi: string; altVi: string; focus?: string; asset: string; sha256: string;
}
const registry = JSON.parse(readFileSync('source/sutta-covers.json', 'utf8'));
const covers: Cover[] = registry.covers;
const catalogUids = (code: string): string[] =>
  JSON.parse(readFileSync(`content/catalog/sutta/${code}.json`, 'utf8')).texts.map((text: { uid: string }) => text.uid);

test('every sutta across all five Nikāyas (dn, mn, sn, an, kn) has a cover, and every cover UID is in its collection catalogue', () => {
  for (const required of ['dn', 'mn', 'sn', 'an', 'kn']) {
    assert.ok(registry.collections.includes(required), required);
    const actual = covers.filter((cover) => cover.collection === required).map((cover) => cover.uid).sort();
    assert.deepEqual(actual, catalogUids(required).sort());
  }
  const catalogByCollection = new Map<string, Set<string>>(
    registry.collections.map((code: string) => [code, new Set(catalogUids(code))]),
  );
  const seenUids = new Set<string>();
  for (const cover of covers) {
    assert.ok(!seenUids.has(cover.uid), `${cover.uid}: duplicate cover entry`);
    seenUids.add(cover.uid);
    assert.ok(registry.collections.includes(cover.collection), cover.uid);
    assert.ok(catalogByCollection.get(cover.collection)?.has(cover.uid), `${cover.uid}: not in ${cover.collection} catalogue`);
  }
});

test('no Commons file is reused in Dīgha/Majjhima or across different collections', () => {
  const dnMnCovers = covers.filter((cover) => cover.collection === 'dn' || cover.collection === 'mn');
  assert.equal(new Set(dnMnCovers.map((cover) => cover.file)).size, dnMnCovers.length);
  assert.equal(new Set(dnMnCovers.map((cover) => cover.originalSha1)).size, dnMnCovers.length, 'two titles for the same original');

  const collectionByFile = new Map<string, string>();
  const collectionBySha1 = new Map<string, string>();
  const primaryByFile = new Map<string, Cover>();
  for (const cover of covers) {
    const prevCollection = collectionByFile.get(cover.file);
    if (prevCollection) {
      assert.equal(prevCollection, cover.collection, `${cover.uid}: ${cover.file} reused across collections`);
    } else {
      collectionByFile.set(cover.file, cover.collection);
    }
    const prevSha1Collection = collectionBySha1.get(cover.originalSha1);
    if (prevSha1Collection) {
      assert.equal(prevSha1Collection, cover.collection, `${cover.uid}: SHA-1 reused across collections`);
    } else {
      collectionBySha1.set(cover.originalSha1, cover.collection);
    }
    const primary = primaryByFile.get(cover.file);
    if (!primary) {
      primaryByFile.set(cover.file, cover);
      assert.equal(cover.asset, `src/assets/covers/${cover.collection}/${cover.uid}.webp`, cover.uid);
    } else {
      assert.equal(cover.asset, primary.asset, `${cover.uid}: shared cover must share derivative asset`);
      assert.equal(cover.sha256, primary.sha256, `${cover.uid}: shared cover must share derivative sha256`);
    }
  }
});

test('covers carry only terms the project may republish, with an author where required', () => {
  for (const cover of covers) {
    assert.match(cover.license, /^(PD|CC0-1\.0|CC-BY-(SA-)?(1\.0|2\.0|2\.5|3\.0|4\.0))$/, cover.uid);
    if (cover.license.startsWith('CC-BY')) assert.ok(cover.author?.trim(), `${cover.uid}: attribution licence without author`);
    if (cover.license !== 'PD') assert.match(cover.licenseUrl ?? '', /^https:\/\/creativecommons\.org\//, cover.uid);
    assert.ok(cover.sourcePage.startsWith('https://commons.wikimedia.org/wiki/File:'), cover.uid);
    assert.ok(cover.sourceUrl.startsWith('https://upload.wikimedia.org/'), cover.uid);
    assert.match(cover.originalSha1, /^[0-9a-f]{40}$/, cover.uid);
  }
});

test('each stored derivative is on disk and matches its recorded SHA-256', () => {
  const hashByAsset = new Map<string, string>();
  for (const cover of covers) {
    assert.match(cover.asset, new RegExp(`^src/assets/covers/${cover.collection}/[^/]+\\.webp$`), cover.uid);
    let actualHash = hashByAsset.get(cover.asset);
    if (!actualHash) {
      assert.ok(existsSync(cover.asset), cover.asset);
      actualHash = createHash('sha256').update(readFileSync(cover.asset)).digest('hex');
      hashByAsset.set(cover.asset, actualHash);
    }
    assert.equal(actualHash, cover.sha256, cover.uid);
  }
});

test('captions and alt text are written for readers, and crops are valid CSS positions', () => {
  for (const cover of covers) {
    assert.ok(cover.titleVi.trim().length >= 8, `${cover.uid}: caption`);
    assert.ok(cover.altVi.trim().length >= 12, `${cover.uid}: alt`);
    assert.equal(cover.titleVi, cover.titleVi.normalize('NFC'));
    if (cover.focus) assert.match(cover.focus, /^\d{1,3}% \d{1,3}%$/, cover.uid);
  }
});

test('Commons licence names normalise to the registry identifiers', () => {
  assert.equal(normaliseLicence('CC BY-SA 4.0'), 'CC-BY-SA-4.0');
  assert.equal(normaliseLicence('CC BY 2.0'), 'CC-BY-2.0');
  assert.equal(normaliseLicence('CC0'), 'CC0-1.0');
  assert.equal(normaliseLicence('Public domain'), 'PD');
  assert.equal(normaliseLicence('CC BY-NC-SA 2.0'), null, 'non-commercial must not pass');
  assert.equal(normaliseLicence('GFDL'), null);
});

test('the page prints author and terms next to every cover', () => {
  const masthead = readFileSync('src/components/SuttaMasthead.astro', 'utf8');
  assert.ok(masthead.includes('cover.sourcePage'));
  assert.ok(masthead.includes('licenceLabel(cover)'));
  assert.ok(masthead.includes('cover.altVi'));
  const credits = readFileSync('src/pages/credits.astro', 'utf8');
  assert.ok(credits.includes('allCovers()'), 'credits page lists every cover from the registry');
});
