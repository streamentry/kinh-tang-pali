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

test('every Dīgha and Majjhima sutta has exactly one cover, and no other collection has one', () => {
  assert.deepEqual(registry.collections, ['dn', 'mn']);
  const expected = [...catalogUids('dn'), ...catalogUids('mn')].sort();
  assert.deepEqual(covers.map((cover) => cover.uid).sort(), expected);
  for (const cover of covers) assert.ok(registry.collections.includes(cover.collection), cover.uid);
});

test('no Commons file is reused across suttas', () => {
  const files = covers.map((cover) => cover.file);
  assert.equal(new Set(files).size, files.length);
  const hashes = covers.map((cover) => cover.originalSha1);
  assert.equal(new Set(hashes).size, hashes.length, 'two titles for the same original');
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
  for (const cover of covers) {
    assert.equal(cover.asset, `src/assets/covers/${cover.collection}/${cover.uid}.webp`);
    assert.ok(existsSync(cover.asset), cover.asset);
    assert.equal(createHash('sha256').update(readFileSync(cover.asset)).digest('hex'), cover.sha256, cover.uid);
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
