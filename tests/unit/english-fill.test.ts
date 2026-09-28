/**
 * Rules for the project's own English fill.
 *
 * The fill is the one place in the project where an agent writes English scripture with
 * no English edition to check it against, so the rules that protect it are mechanical
 * rather than editorial. Two of them are enforced here, both learned the hard way:
 *
 *   1. A fill must never shadow a passage the pinned edition translated. The validator
 *      blocks it, and this pins the property the validator relies on.
 *   2. A fill segment whose Pāli **already appears elsewhere in the same text** must
 *      reuse the rendering given there. Translating it afresh is how a text ends up
 *      contradicting itself, and reading such a segment in isolation is actively
 *      misleading — `sn11.24:1.7` reads like a sutta about seniority and is not one.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import {
  COLLECTIONS,
  loadCatalog,
  segmentMapForUid,
  segmentPrefixesForUid,
  sourcePathFor,
  upstreamFile,
  englishPathFor,
} from '../../src/lib/canon/load';
import { englishCoverageFor, loadRecordedGaps, MIN_ENGLISH_COVERAGE } from '../../src/lib/canon/reference';
import { contentPathForLayer, coverageCreditLayers, fillableSegments, storeLayer } from '../../src/lib/canon/layers';
import { TRANSLATION_QUALITY_KEYS, type CollectionCode } from '../../src/lib/canon/types';

const synced = existsSync('.cache/upstream/suttacentral/root/pli/ms/sutta/mn/mn118_root-pli-ms.json');
const fullSync = { skip: synced ? false : 'run npm run source:sync:manifest' };

const readJson = <T>(file: string): T => JSON.parse(readFileSync(file, 'utf8')) as T;

function fillFiles(): Array<{ collection: CollectionCode; uid: string; segments: Record<string, string> }> {
  const out: Array<{ collection: CollectionCode; uid: string; segments: Record<string, string> }> = [];
  for (const collection of COLLECTIONS.map((entry) => entry.code)) {
    const dir = `content/translation/en/project/sutta/${collection}`;
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      if (!name.endsWith('_translation-en-project.json')) continue;
      out.push({
        collection,
        uid: name.replace('_translation-en-project.json', ''),
        segments: readJson<Record<string, string>>(`${dir}/${name}`),
      });
    }
  }
  return out;
}

const fills = fillFiles();

test('the fill layer exists and is non-trivial', () => {
  assert.ok(fills.length > 0, 'there is at least one fill text');
  const total = fills.reduce((sum, entry) => sum + Object.keys(entry.segments).length, 0);
  assert.ok(total > 0, 'and it carries at least one segment');
  // A content-backed layer must resolve to a real content directory, or the fill is being
  // written somewhere the store never reads. Upstream layers have no content path by
  // design, so only the project layers are asked for one.
  for (const id of ['english-project', 'vietnamese-project']) {
    const layer = storeLayer(id);
    assert.equal(layer.location.type, 'content', `${id} is a content layer`);
    assert.ok(contentPathForLayer(layer, 'mn', 'probe'), `${id} resolves a content path`);
  }
  // And the two upstream reference layers must *not* resolve one, so a fill can never be
  // mistaken for an upstream edition.
  for (const id of ['english-sujato', 'vietnamese-current']) {
    const layer = storeLayer(id);
    assert.equal(layer.location.type, 'upstream', `${id} is an upstream layer`);
    assert.equal(contentPathForLayer(layer, 'mn', 'probe'), null, `${id} has no content path`);
  }
});

test('no fill segment shadows a passage the pinned edition translated', fullSync, () => {
  const shadowing: string[] = [];
  for (const { collection, uid, segments } of fills) {
    const englishPath = englishPathFor(collection, uid);
    if (!englishPath || !existsSync(upstreamFile(englishPath))) continue;
    const pinned = segmentMapForUid(readJson<Record<string, string>>(upstreamFile(englishPath)), uid);
    for (const id of Object.keys(segments)) {
      if (String(pinned[id] ?? '').trim() !== '') shadowing.push(`${collection}/${uid}:${id}`);
    }
  }
  assert.deepEqual(shadowing, [], 'a fill may only sit where the pinned edition has no words');
});

test('no fill segment sits outside the fillable set', fullSync, () => {
  // `fillableSegments` compares only against *pinned upstream* layers, so it cannot be
  // satisfied by the fill itself. If the fill ever drifts out of that set, the rule has
  // been broken somewhere other than the validator.
  const misplaced: string[] = [];
  for (const { collection, uid, segments } of fills) {
    const allowed = new Set(fillableSegments(collection, uid));
    for (const id of Object.keys(segments)) {
      if (!allowed.has(id)) misplaced.push(`${collection}/${uid}:${id}`);
    }
  }
  assert.deepEqual(misplaced, []);
});

test('every fill has its own status and a complete quality scorecard', () => {
  for (const { collection, uid } of fills) {
    const metaFile = `content/meta/en/${collection}/${uid}.yaml`;
    assert.ok(existsSync(metaFile), `${collection}/${uid}: no metadata of its own`);
    const text = readFileSync(metaFile, 'utf8');
    assert.match(text, /^status: (draft|review|published)$/m, `${collection}/${uid}: no status`);
    const quality = text.split('\nquality:')[1];
    assert.ok(quality, `${collection}/${uid}: no quality block`);
    const scores = [...quality.matchAll(/^ {4}(\w+): ([\d.]+)$/gm)];
    assert.equal(
      scores.length,
      TRANSLATION_QUALITY_KEYS.length,
      `${collection}/${uid}: needs all ${TRANSLATION_QUALITY_KEYS.length} criteria`,
    );
    for (const key of TRANSLATION_QUALITY_KEYS) {
      assert.ok(scores.some(([, name]) => name === key), `${collection}/${uid}: missing ${key}`);
    }
  }
});

test('a fill never leaves a gap record it has cured', () => {
  // A published fill raises the text to or above the floor, so the acknowledged-gap list
  // must not still name it. A stale record is a claim that a reference is still missing
  // when it is not.
  const gaps = loadRecordedGaps();
  const stale: string[] = [];
  for (const { collection, uid } of fills) {
    const coverage = englishCoverageFor(collection, uid);
    if (!coverage?.resolved) continue;
    if (coverage.substantiveSegments === 0 || coverage.ratio >= MIN_ENGLISH_COVERAGE) {
      if (gaps.has(`${collection}/${uid}`)) stale.push(`${collection}/${uid}`);
    }
  }
  assert.deepEqual(stale, []);
});

test('a fill that repeats Pāli already in the text reuses the earlier rendering', fullSync, () => {
  // The rule that `sn11.24` taught. Where the fill renders a clause that Sujato already
  // translated earlier in the same text, the two must agree in substance; the check is
  // that the fill keeps the pinned edition's key word, not a fresh reading of the Pāli
  // in isolation.
  const cases: Array<{ collection: CollectionCode; uid: string; fill: string; earlier: string; shared: string[] }> = [
    // 1.7 quotes 1.2+1.3 back to the Buddha: "clashed", "transgressed against the other".
    { collection: 'sn', uid: 'sn11.24', fill: 'sn11.24:1.7', earlier: 'sn11.24:1.2', shared: ['clashed'] },
    // 1.8 quotes 1.4+1.5: "confessed", "accept".
    { collection: 'sn', uid: 'sn11.24', fill: 'sn11.24:1.8', earlier: 'sn11.24:1.4', shared: ['confess'] },
  ];
  const text = (collection: CollectionCode, uid: string): Record<string, string> => {
    const item = loadCatalog(collection).texts.find((entry) => entry.uid === uid)!;
    const path = englishPathFor(collection, uid, item.sourcePath)!;
    return segmentMapForUid(readJson<Record<string, string>>(upstreamFile(path)), uid);
  };

  for (const testCase of cases) {
    const ours = fills.find((f) => f.collection === testCase.collection && f.uid === testCase.uid);
    assert.ok(ours, `${testCase.collection}/${testCase.uid} has a fill`);
    const pinned = text(testCase.collection, testCase.uid);
    for (const word of testCase.shared) {
      assert.match(
        ours.segments[testCase.fill] ?? '',
        new RegExp(word, 'i'),
        `${testCase.fill}: a clause repeated from ${testCase.earlier} must keep "${word}"`,
      );
      assert.match(
        String(pinned[testCase.earlier] ?? ''),
        new RegExp(word, 'i'),
        `${testCase.earlier}: the pinned edition should carry "${word}" too`,
      );
    }
  }
});

test('a fill leaves the Pāli ellipsis alone', () => {
  // Expanding `…pe…` would put invented English into a reference layer that no source
  // licenses. The ellipsis must survive verbatim.
  const sn36 = fills.find((f) => f.uid === 'sn3.6');
  assert.ok(sn36, 'sn3.6 has a fill');
  const elided = sn36.segments['sn3.6:2.4'];
  assert.ok(elided, 'sn3.6:2.4 is the elided segment');
  assert.match(elided, /…/, 'the Pāli ellipsis is kept rather than expanded');
});

test('the fill never claims to be a SuttaCentral edition', () => {
  // Provenance: our English is not Sujato's, and a reader must never be led to think
  // otherwise. The credited-layer list is what the coverage metric reads, so the fill
  // only counts at all when it is `published` in its own right.
  const credit = coverageCreditLayers().map((layer) => layer.id);
  assert.ok(credit.includes('english-project'), 'the fill is a declared credit layer');
  const fillLayer = storeLayer('english-project');
  assert.equal(fillLayer.authority, false, 'the fill is never the authority');
  assert.equal(fillLayer.kind, 'project', 'and is declared as a project layer, not a reference');
  assert.equal(fillLayer.countsOnlyWhenStatus, 'published', 'a draft fill is not yet a reference');
});

test('every catalogue UID the fill names is real', () => {
  // A fill for a UID outside the catalogue would be invisible to every other check.
  for (const { collection, uid, segments } of fills) {
    const catalog = loadCatalog(collection);
    assert.ok(
      catalog.texts.some((text) => text.uid === uid),
      `${collection}/${uid} is not in the catalogue`,
    );
    const item = catalog.texts.find((text) => text.uid === uid)!;
    const path = sourcePathFor(collection, uid, item.sourcePath);
    assert.ok(path, `${collection}/${uid} has a resolvable source path`);
    for (const id of Object.keys(segments)) {
      const prefix = segmentPrefixesForUid(uid);
      assert.ok(
        prefix.some((candidate) => id.startsWith(`${candidate}:`)),
        `${collection}/${uid}:${id} does not belong to this UID`,
      );
    }
  }
});
