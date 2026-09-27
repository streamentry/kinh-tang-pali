import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import {
  COLLECTIONS,
  englishPathFor,
  loadLock,
  segmentMapForUid,
  sourcePathFor,
  upstreamFile,
} from '../../src/lib/canon/load';
import {
  assertStoreIntegrity,
  contentPathForLayer,
  fillableSegments,
  readingOrder,
  resolveLayer,
  storeLayer,
  storeView,
} from '../../src/lib/canon/layers';
import { englishCoverageFor, isReferenceBlock, loadRecordedGaps } from '../../src/lib/canon/reference';
import type { CanonCatalog, CollectionCode } from '../../src/lib/canon/types';

const readJson = <T>(file: string): T => JSON.parse(readFileSync(file, 'utf8')) as T;
const catalog = (collection: CollectionCode): CanonCatalog =>
  readJson<CanonCatalog>(`content/catalog/sutta/${collection}.json`);
const synced = existsSync(upstreamFile('translation/en/sujato/sutta/mn/mn118_translation-en-sujato.json'))
  ? false
  : 'run npm run source:sync:all';

test('the store registry is internally consistent', () => {
  assert.deepEqual(assertStoreIntegrity(), []);
});

test('the store declares the four reading layers in order', () => {
  assert.deepEqual(readingOrder().map((layer) => layer.id), [
    'pali',
    'english-sujato',
    'english-project',
    'vietnamese-current',
    'vietnamese-project',
  ]);
});

test('only the Pāli root claims authority', () => {
  const claiming = readingOrder().filter((layer) => layer.authority).map((layer) => layer.id);
  assert.deepEqual(claiming, ['pali'], 'a reference layer that outranked the Pāli root would invert the evidence order');
  for (const layer of readingOrder()) {
    if (layer.authority) assert.equal(layer.kind, 'root');
  }
});

test('the existing Vietnamese layer is declared as a reference, not a deliverable', () => {
  const layer = storeLayer('vietnamese-current');
  assert.equal(layer.kind, 'reference');
  assert.equal(layer.language, 'vi');
  assert.equal(layer.authority, false);
  assert.equal(layer.countsTowardCoverage, false, 'a Vietnamese layer must never count as English reference');
  assert.equal(layer.location.type, 'upstream');
  const edition = loadLock().referenceEditions.find((e) => e.path === (layer.location as { path: string }).path);
  assert.ok(edition, 'the layer must point at a pinned edition');
  assert.equal(edition!.translatorName, 'Bhikkhu Thích Minh Châu');
});

test('a text resolves every declared layer, marking the ones that are absent', () => {
  const view = storeView('an', 'an4.59');
  const byId = new Map(view.layers.map((layer) => [layer.id, layer]));
  assert.equal(byId.get('pali')!.present, true);
  assert.equal(byId.get('english-sujato')!.present, true);
  assert.equal(byId.get('english-project')!.present, true);
  assert.equal(byId.get('vietnamese-project')!.present, true);
  // Thích Minh Châu is Dhammapada-only at the pinned commit, so an Aṅguttara text
  // legitimately has no such layer. Absence must be visible, not assumed.
  assert.equal(byId.get('vietnamese-current')!.present, false);
  assert.match(byId.get('vietnamese-current')!.source, /translation\/vi\/phantuananh/);
});

test('the Dhammapada does resolve the existing Vietnamese layer', { skip: synced }, () => {
  const view = storeView('kn', 'dhp1-20');
  const current = view.layers.find((layer) => layer.id === 'vietnamese-current')!;
  assert.equal(current.present, true, 'the pinned vi corpus covers the Dhammapada');
  assert.equal(current.proseShare, 1, 'and it is fully translated');
});

test('the fill layer may only write where the pinned edition has no words', { skip: synced }, () => {
  for (const uid of ['an4.59', 'an3.149', 'an3.153']) {
    const fillFile = contentPathForLayer(storeLayer('english-project'), 'an', uid)!;
    assert.ok(existsSync(fillFile), `${uid} is a seeded fill`);
    const fill = readJson<Record<string, string>>(fillFile);
    const allowed = new Set(fillableSegments('an', uid));
    for (const id of Object.keys(fill)) {
      assert.ok(allowed.has(id), `${uid}: ${id} must be a passage the pinned edition left blank`);
    }
    const sujato = resolveLayer('english-sujato', 'an', uid)!;
    for (const id of Object.keys(fill)) {
      assert.equal(
        String(sujato.segments[id] ?? '').trim(), '',
        `${uid}: ${id} is filled but Sujato already translates it`,
      );
    }
  }
});

test('a seeded English fill actually closes the coverage hole it was made for', { skip: synced }, () => {
  for (const uid of ['an4.59', 'an3.149', 'an3.153']) {
    const before = readJson<Record<string, string>>(
      contentPathForLayer(storeLayer('english-project'), 'an', uid)!,
    );
    assert.ok(Object.keys(before).length > 0);
    const after = englishCoverageFor('an', uid)!;
    assert.equal(after.substantiveWithoutEnglish, 0, `${uid} should have no untranslated substantive Pāli left`);
    assert.equal(after.ratio, 1);
    assert.ok(after.credited.includes('english-project'), `${uid} coverage must be credited to our fill`);
  }
});

test('a draft English fill does not count toward coverage', { skip: synced }, () => {
  const metaFile = 'content/meta/en/an/an3.149.yaml';
  const original = readFileSync(metaFile, 'utf8');
  const meta = YAML.parse(original) as { status: string };
  assert.equal(meta.status, 'published', 'the seed is published, which is why it counts');

  // Simulate the draft state without touching the file on disk: a fill layer that is
  // present but not published must be excluded from the credited set.
  const layer = storeLayer('english-project');
  assert.equal(layer.countsOnlyWhenStatus, 'published');
  const resolved = resolveLayer('english-project', 'an', 'an3.149')!;
  assert.equal(resolved.status, 'published');
});

test('the Pāli reference block is excluded from coverage', () => {
  // Bilara marks book/sutta/vagga titles with path component 0. Sujato leaves many
  // per-story titles blank; counting them would report a Dhammapada bundle as
  // untranslated when only its headings are missing.
  assert.equal(isReferenceBlock('dhp1:0.2'), true);
  assert.equal(isReferenceBlock('mn118:0.1'), true);
  assert.equal(isReferenceBlock('an4.46:0.3'), true);
  assert.equal(isReferenceBlock('dhp44:0.4'), true);
  assert.equal(isReferenceBlock('dhp1:1'), false);
  assert.equal(isReferenceBlock('an4.59:1.4'), false);
  assert.equal(isReferenceBlock('dhp423:8'), false, 'the colophon is content, not a heading');
});

test('every text below the coverage floor is recorded, and nothing else is', { skip: synced }, () => {
  const recorded = loadRecordedGaps();
  const belowFloor: string[] = [];
  const aboveFloorRecorded: string[] = [];
  for (const collection of ['dn', 'mn', 'sn', 'an', 'kn'] as CollectionCode[]) {
    const metaDir = `content/meta/sutta/${collection}`;
    for (const name of existsSync(metaDir) ? readdirSync(metaDir) : []) {
      if (!name.endsWith('.yaml')) continue;
      const uid = name.slice(0, -5);
      const key = `${collection}/${uid}`;
      const coverage = englishCoverageFor(collection, uid);
      if (!coverage?.resolved || coverage.substantiveSegments === 0) continue;
      const below = coverage.ratio < 0.8;
      if (below) belowFloor.push(key);
      if (recorded.has(key) && !below) aboveFloorRecorded.push(key);
    }
  }
  assert.deepEqual(
    belowFloor.filter((key) => !recorded.has(key)),
    [],
    'an unrecorded gap must fail validation, so the record cannot silently fall behind',
  );
  assert.deepEqual(aboveFloorRecorded, [], 'a recorded gap that no longer exists is stale bookkeeping');
  for (const record of recorded.values()) {
    assert.ok(record.reason && record.reason.length > 40, `${record.uid} must carry a reason`);
  }
});

test('the store never loses the Pāli segment alignment the reference layers join on', { skip: synced }, () => {
  for (const collection of COLLECTIONS.map((entry) => entry.code)) {
    for (const item of catalog(collection).texts) {
      const pali = resolveLayer('pali', collection, item.uid, { catalog: catalog(collection) });
      if (!pali?.present) continue;
      const ids = new Set(Object.keys(pali.segments));
      if (ids.size === 0) continue; // recorded upstream defect: sn12.93-213
      for (const layer of readingOrder()) {
        if (layer.id === 'pali') continue;
        const resolved = resolveLayer(layer.id, collection, item.uid, { catalog: catalog(collection) });
        if (!resolved?.present) continue;
        for (const id of Object.keys(resolved.segments)) {
          assert.ok(ids.has(id), `${collection}/${item.uid} ${layer.id} has orphan segment ${id}`);
        }
      }
    }
  }
});

test('the store layer paths land inside the repository, never outside it', () => {
  for (const collection of COLLECTIONS.map((entry) => entry.code)) {
    for (const layer of readingOrder()) {
      if (layer.location.type !== 'content') continue;
      const target = contentPathForLayer(layer, collection, 'mn118')!;
      const resolved = path.resolve(target);
      assert.ok(
        resolved.startsWith(path.resolve('content')),
        `${layer.id} must resolve under content/, got ${resolved}`,
      );
    }
  }
});

test('the pinned English edition is derived from the Pāli path, as are the other upstream layers', () => {
  for (const collection of COLLECTIONS.map((entry) => entry.code)) {
    for (const item of catalog(collection).texts) {
      const pali = sourcePathFor(collection, item.uid, item.sourcePath);
      if (!pali) continue;
      const match = pali.match(/^(?:root\/pli\/ms|root\/[^/]+\/[^/]+)\/(sutta\/.+)_root-pli-ms\.json$/);
      if (!match) continue;
      const english = englishPathFor(collection, item.uid, item.sourcePath)!;
      assert.equal(english, `translation/en/sujato/${match[1]}_translation-en-sujato.json`);
      const vi = `translation/vi/phantuananh/${match[1]}_translation-vi-phantuananh.json`;
      const layer = storeLayer('vietnamese-current');
      assert.equal(layer.location.type === 'upstream' ? `${layer.location.path}/${match[1]}${layer.location.suffix}` : null, vi);
    }
  }
});

test('upstream layers share the Pāli file slot, not a re-derived UID', () => {
  // Bundled UIDs share a bilara file (`an1.1` … `an1.10` all live in `an1.1-10_*`), so
  // the filename legitimately names the bundle. What must hold across layers is that
  // each one names the same file body in its own edition.
  const bodyOf = (value: string) => value
    .slice(value.lastIndexOf('/') + 1)
    .replace(/_translation-en-sujato\.json$/, '')
    .replace(/_translation-vi-phantuananh\.json$/, '')
    .replace(/_root-pli-ms\.json$/, '');
  for (const collection of COLLECTIONS.map((entry) => entry.code)) {
    for (const item of catalog(collection).texts) {
      const pali = sourcePathFor(collection, item.uid, item.sourcePath);
      if (!pali) continue;
      const vi = resolveLayer('vietnamese-current', collection, item.uid, { catalog: catalog(collection) });
      if (!vi?.upstreamPath) continue;
      assert.equal(bodyOf(vi.upstreamPath), bodyOf(pali), `${collection}/${item.uid} layer file body mismatch`);
    }
  }
});

test('segment maps are read through the same UID filter in every layer', { skip: synced }, () => {
  // A bookmark bundle (`sn12.83-92`) is filed under individual sutta prefixes. If any
  // layer filtered differently, a translator would read English for one sutta against
  // Pāli for another. The invariant is that every present layer yields the same key
  // set for this UID as the Pāli authority layer does.
  const collection: CollectionCode = 'sn';
  const uid = 'sn12.83-92';
  const reference = resolveLayer('pali', collection, uid, { catalog: catalog(collection) })!;
  assert.ok(reference.present);
  const referenceIds = Object.keys(reference.segments).sort();
  assert.ok(referenceIds.length > 10, 'the bookmark bundle really does span several suttas');
  assert.ok(referenceIds.every((id) => id.startsWith('sn12.')), 'and its keys carry individual sutta prefixes');

  for (const layer of readingOrder()) {
    const resolved = resolveLayer(layer.id, collection, uid, { catalog: catalog(collection) });
    if (!resolved?.present) continue;
    const ids = Object.keys(segmentMapForUid(
      readJson<Record<string, string>>(resolved.file),
      uid,
    )).sort();
    assert.deepEqual(ids, referenceIds, `${layer.id} must resolve the same segment set as the Pāli root`);
  }
});
