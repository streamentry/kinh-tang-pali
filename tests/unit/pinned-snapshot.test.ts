/**
 * Count-based assertions about the pinned snapshot and the catalogues.
 *
 * The point of these is that no figure in the docs is asserted by hand. Each one is
 * recomputed from `source/upstream-manifest.json` (the git tree of the locked commit)
 * and the catalogues, so a drifting count fails rather than quietly becoming a lie.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { loadLock, segmentMapForUid, sourcePathFor } from '../../src/lib/canon/load';
import { manifestRootForLayer, storeLayers } from '../../src/lib/canon/layers';
import type { CanonCatalog, CollectionCode } from '../../src/lib/canon/types';

const COLLECTIONS: CollectionCode[] = ['dn', 'mn', 'sn', 'an', 'kn'];
const readJson = <T>(file: string): T => JSON.parse(readFileSync(file, 'utf8')) as T;
const catalog = (collection: CollectionCode): CanonCatalog =>
  readJson<CanonCatalog>(`content/catalog/sutta/${collection}.json`);

interface Manifest {
  commit: string;
  editions: Array<{
    layerId: string; path: string; treeSha: string;
    fileCount: number; byteCount: number; files: Record<string, string>;
  }>;
}
const manifest: Manifest = readJson<Manifest>('source/upstream-manifest.json');
const lock = loadLock();
const pali = manifest.editions.find((edition) => edition.layerId === 'pali')!;

test('the manifest is pinned to the locked commit, not to some other snapshot', () => {
  assert.equal(manifest.commit, lock.commit, 'manifest and lock must name the same bilara commit');
  assert.match(manifest.commit, /^[a-f0-9]{40}$/);
});

test('the manifest records the declared layers, and their counts match their own file maps', () => {
  const declared = storeLayers()
    .map(manifestRootForLayer)
    .filter((value): value is string => value !== null)
    .sort();
  const recorded = manifest.editions.map((edition) => edition.path).sort();
  assert.deepEqual(recorded, declared, 'every upstream layer must have a manifest entry, and vice versa');

  for (const edition of manifest.editions) {
    assert.equal(Object.keys(edition.files).length, edition.fileCount, `${edition.layerId} count is self-consistent`);
    assert.ok(edition.fileCount > 0, `${edition.layerId} has files`);
    assert.ok(edition.byteCount > 0, `${edition.layerId} has a byte count`);
    assert.match(edition.treeSha, /^[a-f0-9]{40}$/);
    for (const [name, sha] of Object.entries(edition.files)) {
      assert.match(sha, /^[a-f0-9]{40}$/, `${edition.layerId}/${name} must carry a git blob hash`);
    }
  }
});

test('the catalogues name only paths the pinned commit actually contains', () => {
  const invented: string[] = [];
  for (const collection of COLLECTIONS) {
    for (const item of catalog(collection).texts) {
      const sourcePath = sourcePathFor(collection, item.uid, item.sourcePath);
      if (!sourcePath) {
        invented.push(`${collection}/${item.uid}: no deterministic source path`);
        continue;
      }
      const name = sourcePath.replace(`${pali.path}/`, '');
      if (!pali.files[name]) invented.push(`${collection}/${item.uid}: ${sourcePath} is not in the pinned snapshot`);
    }
  }
  assert.deepEqual(invented, [], 'a catalogue must not reference a file that does not exist at the pin');
});

test('the catalogues cover every Pāli file in the pinned snapshot', () => {
  const covered = new Set<string>();
  for (const collection of COLLECTIONS) {
    for (const item of catalog(collection).texts) {
      const sourcePath = sourcePathFor(collection, item.uid, item.sourcePath);
      if (sourcePath) covered.add(sourcePath);
    }
  }
  const absent = Object.keys(pali.files)
    .map((name) => `${pali.path}/${name}`)
    .filter((fullPath) => !covered.has(fullPath));
  assert.deepEqual(absent, [], 'docs/roadmap.md phase 2 requires importing the whole pinned snapshot');
});

test('catalogue UIDs and orders are unique within each collection', () => {
  for (const collection of COLLECTIONS) {
    const items = catalog(collection).texts;
    const uids = new Set(items.map((item) => item.uid));
    const orders = new Set(items.map((item) => item.order));
    assert.equal(uids.size, items.length, `${collection}: duplicate UID`);
    assert.equal(orders.size, items.length, `${collection}: duplicate order`);
    for (const item of items) {
      assert.match(item.uid, /^[a-z]+[\w.-]*$/, `${collection}/${item.uid}: not a plausible SuttaCentral UID`);
    }
  }
});

test('the Majjhima Nikāya catalogue is untouched: 152 texts in canonical order', () => {
  const items = catalog('mn').texts;
  assert.equal(items.length, 152);
  items.forEach((item, index) => {
    assert.equal(item.uid, `mn${index + 1}`);
    assert.equal(item.order, index + 1);
  });
});

test('every catalogue text resolves the Pāli authority layer, and only the known defect does not', {
  // Guarded on a file that only `source:sync:manifest` fetches. A guard on a text the
  // project works on would pass in CI, where `source:sync:used` has synced only part of
  // the corpus, and then this test would fail on every text it had not downloaded.
  skip: !existsSync(path.join('.cache/upstream/suttacentral', pali.path, 'kn/mil/mil1_root-pli-ms.json'))
    ? 'run npm run source:sync:manifest'
    : false,
}, () => {
  const unresolved: string[] = [];
  const count = { texts: 0, segments: 0 };
  for (const collection of COLLECTIONS) {
    for (const item of catalog(collection).texts) {
      const sourcePath = sourcePathFor(collection, item.uid, item.sourcePath)!;
      const file = path.join('.cache/upstream/suttacentral', sourcePath);
      const json = readJson<Record<string, string>>(file);
      const map = segmentMapForUid(json, item.uid);
      if (Object.keys(map).length === 0) {
        unresolved.push(`${collection}/${item.uid}`);
        continue;
      }
      count.texts += 1;
      count.segments += Object.keys(map).length;
    }
  }
  // One upstream bilara-data defect: `sn12.93-213` ships segments labelled with nested
  // sub-range UIDs, so the Pāli root resolves nothing for it. Recorded, never guessed.
  assert.deepEqual(unresolved, ['sn/sn12.93-213']);
  assert.ok(count.texts > 6000, `expected the whole corpus, resolved ${count.texts}`);
  assert.ok(count.segments > 280000, `expected the whole corpus, resolved ${count.segments} segments`);
});

test('a sample of cached files is byte-identical to the pinned blobs', {
  skip: !existsSync(path.join('.cache/upstream/suttacentral', pali.path, 'mn/mn118_root-pli-ms.json'))
    ? 'run npm run source:sync:used'
    : false,
}, () => {
  // `npm run verify:store` hashes every file; this keeps a cheap guard in the unit
  // suite so a cache that drifted from the pin is caught even without the full run.
  for (const [layerId, relative] of [
    ['pali', 'mn/mn118_root-pli-ms.json'],
    ['pali', 'an/an4/an4.59_root-pli-ms.json'],
    ['english-sujato', 'sutta/mn/mn118_translation-en-sujato.json'],
  ] as const) {
    const edition = manifest.editions.find((entry) => entry.layerId === layerId)!;
    const local = path.join('.cache/upstream/suttacentral', edition.path, relative);
    if (!existsSync(local)) continue;
    const hash = execFileSync('git', ['hash-object', local], { encoding: 'utf8' }).trim();
    assert.equal(hash, edition.files[relative], `${layerId}/${relative} must match the pinned blob`);
  }
});

test('the store registry stays coherent with the manifest', () => {
  for (const layer of storeLayers()) {
    const root = manifestRootForLayer(layer);
    if (root === null) continue;
    assert.ok(
      manifest.editions.some((edition) => edition.path === root),
      `layer '${layer.id}' reads ${root}, which the manifest does not record`,
    );
  }
});

test('a text with editorial data has a metadata file, and vice versa', () => {
  for (const collection of COLLECTIONS) {
    const catalogUids = new Set(catalog(collection).texts.map((item) => item.uid));
    const dir = `content/meta/sutta/${collection}`;
    const metas = existsSync(dir)
      ? readdirSync(dir).filter((name) => name.endsWith('.yaml')).map((name) => name.slice(0, -5))
      : [];
    for (const uid of metas) {
      assert.ok(catalogUids.has(uid), `${collection}/${uid} has metadata but no catalogue entry`);
    }
  }
});
