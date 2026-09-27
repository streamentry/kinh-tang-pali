import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readdirSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import {
  COLLECTIONS,
  englishEdition,
  englishPathFor,
  englishPathForSourcePath,
  loadEnglishReference,
  loadLock,
  segmentMapForUid,
  segmentPrefixesForUid,
  sourcePathFor,
  upstreamFile,
} from '../../src/lib/canon/load';
import {
  MIN_ENGLISH_COVERAGE,
  SUBSTANTIVE_PALI_MIN_CHARS,
  englishCoverageFor,
  loadRecordedGaps,
} from '../../src/lib/canon/reference';
import type { CanonCatalog, CollectionCode } from '../../src/lib/canon/types';

const readJson = <T>(file: string): T => JSON.parse(readFileSync(file, 'utf8')) as T;
const catalog = (collection: CollectionCode): CanonCatalog =>
  readJson<CanonCatalog>(`content/catalog/sutta/${collection}.json`);

test('the lock pins exactly one English reference edition and it is not authoritative', () => {
  const lock = loadLock();
  assert.match(lock.commit, /^[a-f0-9]{40}$/);
  const english = lock.referenceEditions.filter((edition) => edition.role === 'english');
  assert.equal(english.length, 1, 'a single pinned English edition keeps provenance unambiguous');
  assert.equal(english[0].authority, false, 'English is a reference layer, never an authority over the Pāli root');
  assert.deepEqual(english[0].requiredFor, ['review', 'published']);
});

test('English path is a pure transform of the pinned Pāli root path', () => {
  const explicit = (collection: CollectionCode, uid: string) =>
    catalog(collection).texts.find((text) => text.uid === uid)?.sourcePath;
  const cases: Array<[CollectionCode, string, string]> = [
    ['mn', 'mn118', 'translation/en/sujato/sutta/mn/mn118_translation-en-sujato.json'],
    ['dn', 'dn1', 'translation/en/sujato/sutta/dn/dn1_translation-en-sujato.json'],
    ['an', 'an3.1', 'translation/en/sujato/sutta/an/an3/an3.1_translation-en-sujato.json'],
    ['sn', 'sn1.1', 'translation/en/sujato/sutta/sn/sn1/sn1.1_translation-en-sujato.json'],
    ['kn', 'snp5.17', 'translation/en/sujato/sutta/kn/snp/vagga5/snp5.17_translation-en-sujato.json'],
  ];
  for (const [collection, uid, expected] of cases) {
    assert.equal(englishPathFor(collection, uid, explicit(collection, uid)), expected, `${uid} English path`);
  }
  // dn and mn are flat and fully derivable from the UID alone.
  assert.equal(englishPathFor('mn', 'mn118'), 'translation/en/sujato/sutta/mn/mn118_translation-en-sujato.json');
  // kn always needs the catalog's explicit sourcePath, like its Pāli path does.
  assert.equal(englishPathFor('kn', 'snp5.17'), null);
});

test('English path preserves bundled and nested UIDs exactly like the Pāli path', () => {
  for (const collection of ['dn', 'mn', 'sn', 'an', 'kn'] as CollectionCode[]) {
    for (const item of catalog(collection).texts) {
      const pali = sourcePathFor(collection, item.uid, item.sourcePath);
      if (!pali) continue;
      const english = englishPathFor(collection, item.uid, item.sourcePath);
      assert.ok(english, `${collection}/${item.uid} must have a deterministic English path`);

      // The invariant is that the two editions are the same file slot, not that the
      // filenames match: bilara-data files several UIDs under one name (`an1.1`
      // through `an1.10` all live in `an1.1-10_*`), so the filename legitimately
      // names the bundle rather than the individual UID. What must hold is that the
      // English file is the Pāli file's slot in the other edition, in the same
      // directory, with only the edition and suffix swapped.
      const directoryOf = (value: string) => value
        .slice(0, value.lastIndexOf('/'))
        .replace(/^root\/pli\/ms\//, '')
        .replace(/^translation\/en\/sujato\//, '');
      const bodyOf = (value: string) => value
        .slice(value.lastIndexOf('/') + 1)
        .replace(/_translation-en-[\w-]+\.json$/, '')
        .replace(/_root-pli-ms\.json$/, '');
      assert.equal(directoryOf(english), directoryOf(pali), `${collection}/${item.uid} English directory mismatch`);
      assert.equal(bodyOf(english), bodyOf(pali), `${collection}/${item.uid} English file body mismatch`);
      assert.equal(englishPathForSourcePath(pali), english, `${collection}/${item.uid} transform is not stable`);
    }
  }
});

test('English path transform rejects a non-standard Pāli root path', () => {
  assert.equal(englishPathForSourcePath('root/pli/ms/variant/pli/ms/x.json'), null);
  assert.equal(englishPathForSourcePath('not-a-bilara-path'), null);
});

test('segment prefixes cover merged bundles and bookmark bundles alike', () => {
  // Merged bundle: segments carry the range UID itself.
  assert.ok(segmentPrefixesForUid('an5.308-1152').includes('an5.308-1152'));
  // Bookmark bundle: one file, segments carry each sutta's own prefix.
  const dotted = segmentPrefixesForUid('sn12.83-92');
  assert.ok(dotted.includes('sn12.83-92'));
  assert.ok(dotted.includes('sn12.83'));
  assert.ok(dotted.includes('sn12.92'));
  // Plain range without a dot still expands.
  const plain = segmentPrefixesForUid('dhp1-20');
  assert.equal(plain.length, 21);
  assert.ok(plain.includes('dhp1') && plain.includes('dhp20'));
  // A plain UID is untouched.
  assert.deepEqual(segmentPrefixesForUid('mn118'), ['mn118']);
});

test('segmentMapForUid resolves a bookmark bundle to only its own suttas', () => {
  const source = {
    'sn12.82:1.1': 'previous sutta',
    'sn12.83:0.1': 'title',
    'sn12.83:1.1': 'first',
    'sn12.92:1.6': 'last',
    'sn12.93:1.1': 'next sutta',
  };
  assert.deepEqual(segmentMapForUid(source, 'sn12.83-92'), {
    'sn12.83:0.1': 'title',
    'sn12.83:1.1': 'first',
    'sn12.92:1.6': 'last',
  });
});

test('the locked English edition matches the directory it is synced into', () => {
  assert.equal(englishEdition().translator, 'sujato');
  assert.equal(englishEdition().language, 'en');
});

test('the coverage floor is set from the audit, not chosen to be convenient', () => {
  // 1,070 of 1,427 comparable texts sit at 99%+, so 0.8 flags only the texts that
  // genuinely lost their reference layer. Relaxing it to 0.5 would silently accept
  // the 121 texts between 50% and 80%.
  assert.equal(MIN_ENGLISH_COVERAGE, 0.8);
  assert.equal(SUBSTANTIVE_PALI_MIN_CHARS, 40);
});

test('every in-scope text resolves to a synced, segment-aligned English reference', { skip: !existsSync(upstreamFile('translation/en/sujato/sutta/mn/mn118_translation-en-sujato.json')) ? 'run npm run source:sync:used' : false }, () => {
  const problems: string[] = [];
  const emptyInBothLayers: string[] = [];
  let checked = 0;
  for (const collection of ['dn', 'mn', 'sn', 'an', 'kn'] as CollectionCode[]) {
    const dir = `content/meta/sutta/${collection}`;
    if (!existsSync(dir)) continue;
    const catalogFor = catalog(collection);
    for (const name of readdirSync(dir)) {
      if (!name.endsWith('.yaml')) continue;
      const uid = name.slice(0, -5);
      const item = catalogFor.texts.find((text) => text.uid === uid);
      if (!item) continue;
      checked += 1;
      const english = loadEnglishReference(collection, uid);
      if (!english?.present) {
        problems.push(`${collection}/${uid}: English file not synced (${english?.sourcePath ?? 'unmapped'})`);
        continue;
      }
      const paliPath = sourcePathFor(collection, uid, item.sourcePath)!;
      const paliFile = upstreamFile(paliPath);
      if (!existsSync(paliFile)) {
        problems.push(`${collection}/${uid}: Pāli root not synced`);
        continue;
      }
      const pali = segmentMapForUid(readJson<Record<string, string>>(paliFile), uid);
      const englishSegments = segmentMapForUid(readJson<Record<string, string>>(upstreamFile(english.sourcePath)), uid);
      if (Object.keys(pali).length === 0 && Object.keys(englishSegments).length === 0) {
        emptyInBothLayers.push(`${collection}/${uid}`);
        continue;
      }
      for (const id of Object.keys(pali)) {
        if (!(id in englishSegments)) problems.push(`${collection}/${uid}: ${id} has no English segment`);
      }
      for (const id of Object.keys(englishSegments)) {
        if (!(id in pali)) problems.push(`${collection}/${uid}: ${id} is an orphan English segment`);
      }
    }
  }
  assert.ok(checked > 1000, `expected the in-scope corpus, checked only ${checked}`);
  assert.deepEqual(problems, []);
  // The one text with no resolvable segment in either layer is an upstream
  // bilara-data defect: `sn12.93-213_*` ships its 40 segments labelled with nested
  // sub-range UIDs (`sn12.93-103`, `sn12.104-114`, …). It is recorded rather than
  // silently remapped, and the test fails if upstream ever fixes it unnoticed.
  assert.deepEqual(emptyInBothLayers, []);
});

test('coverage measures substantive Pāli, not raw segment count', { skip: !existsSync(upstreamFile('translation/en/sujato/sutta/an/an2/an2.1-10_translation-en-sujato.json')) ? 'run npm run source:sync:all' : false }, () => {
  // an1.1 is the argument for the substantive denominator. Half its segments are
  // blank in English — every `Paṭhamaṁ.`, `Dutiyaṁ.`, `Tatiyaṁ.` marker and the
  // vagga closer — yet its body is translated throughout. A metric that counted raw
  // blank segments would have flagged a fully covered text.
  const markerHeavy = englishCoverageFor('an', 'an1.1')!;
  assert.ok(markerHeavy.resolved);
  assert.equal(markerHeavy.englishSegments, markerHeavy.paliSegments, 'join is exact');
  assert.equal(markerHeavy.substantiveSegments, 4, 'only four segments carry real prose');
  assert.equal(markerHeavy.substantiveWithoutEnglish, 0, 'and all four have English words');
  assert.equal(markerHeavy.ratio, 1, 'so coverage is complete, despite the blank markers');

  // an2.1 is the counter-case: the punishment list at an2.1:3.3 is a 625-character
  // blockquote with no English at all, and the ellipsis at :3.5 likewise.
  const blockquoted = englishCoverageFor('an', 'an2.1')!;
  assert.equal(blockquoted.substantiveSegments, 22);
  assert.equal(blockquoted.substantiveWithoutEnglish, 2);
  assert.ok(blockquoted.ratio > MIN_ENGLISH_COVERAGE, 'a two-segment hole stays above the floor');

  // an2.3 shows the merge: Sujato folded an2.3:1.3–1.5 into one English sentence,
  // so :1.4 and :1.5 are blank. The meaning survives, on another key.
  const english = segmentMapForUid(
    readJson<Record<string, string>>(upstreamFile('translation/en/sujato/sutta/an/an2/an2.1-10_translation-en-sujato.json')),
    'an2.3',
  );
  assert.equal(english['an2.3:1.4'].trim(), '', 'the merged segment is blank');
  assert.ok(english['an2.3:1.3'].includes('body, speech, and mind'), 'its content moved to :1.3');
  const merged = englishCoverageFor('an', 'an2.3')!;
  assert.equal(merged.substantiveSegments, 7);
  assert.equal(merged.substantiveWithoutEnglish, 4);
  assert.ok(merged.ratio < MIN_ENGLISH_COVERAGE, 'which does drop it below the floor');
});

test('a text with no English prose at all falls below the coverage floor', { skip: !existsSync(upstreamFile('translation/en/sujato/sutta/an/an4/an4.46_translation-en-sujato.json')) ? 'run npm run source:sync:all' : false }, () => {
  // an4.46 keeps its join keys but has no English for the Buddha's whole answer,
  // including "Gamanena na pattabbo, lokassanto kudācanaṁ".
  const coverage = englishCoverageFor('an', 'an4.46')!;
  assert.equal(coverage.englishSegments, coverage.paliSegments, 'join is exact');
  assert.equal(coverage.substantiveSegments, 18);
  assert.equal(coverage.substantiveWithoutEnglish, 15);
  assert.ok(coverage.ratio < MIN_ENGLISH_COVERAGE, `expected below floor, got ${coverage.ratio}`);
  // Pinned exactly: if the pinned commit ever changes, this must be revisited on
  // purpose rather than drifting unnoticed.
  assert.equal(coverage.ratio, 3 / 18);
  assert.ok(coverage.worstMissingSegment, 'the tool points at a concrete hole');
  const pali = segmentMapForUid(
    readJson<Record<string, string>>(upstreamFile('root/pli/ms/sutta/an/an4/an4.46_root-pli-ms.json')),
    'an4.46',
  );
  assert.ok(pali['an4.46:4.1'].length > 40, 'and that hole is real prose');
});

test('every text below the coverage floor is recorded, and nothing else is', { skip: !existsSync(upstreamFile('translation/en/sujato/sutta/mn/mn118_translation-en-sujato.json')) ? 'run npm run source:sync:all' : false }, () => {
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
      const below = coverage.ratio < MIN_ENGLISH_COVERAGE;
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
  assert.ok(recorded.size > 0, 'the pinned edition really does have gaps worth recording');
  for (const record of recorded.values()) {
    assert.ok(record.reason && record.reason.length > 40, `${record.uid} must carry a reason`);
  }
});

test('the pinned English edition leaves blockquotes and elisions without prose', { skip: !existsSync(upstreamFile('translation/en/sujato/sutta/an/an2/an2.1-10_translation-en-sujato.json')) ? 'run npm run source:sync:all' : false }, () => {
  // an2.1:3.3 is a blockquoted list of punishments with no English prose at all:
  // Sujato's sentence flows from :3.2 straight to :3.4. A reader must not mistake
  // an empty string for a missing file, and must not read it as agreement on wording.
  const english = segmentMapForUid(
    readJson<Record<string, string>>(upstreamFile('translation/en/sujato/sutta/an/an2/an2.1-10_translation-en-sujato.json')),
    'an2.1',
  );
  const pali = segmentMapForUid(
    readJson<Record<string, string>>(upstreamFile('root/pli/ms/sutta/an/an2/an2.1-10_root-pli-ms.json')),
    'an2.1',
  );
  assert.ok('an2.1:3.3' in english, 'the segment is present and aligned');
  assert.equal(english['an2.1:3.3'].trim(), '', 'Sujato leaves the blockquote empty');
  assert.ok(pali['an2.1:3.3'].length > 40, 'while the Pāli carries substantive text there');
  assert.ok(english['an2.1:3.4'].trim().length > 0, 'the sentence continues in the next segment');
});

test('a full catalog sync resolves every English reference, with the known upstream defect called out', {
  // Deliberately not part of CI: CI syncs only the texts the project works on. This
  // asserts the stronger whole-catalogue claim for whoever runs `source:sync:all`, so
  // the claim is never made silently and never checked nowhere.
  skip: !existsSync(upstreamFile('root/pli/ms/sutta/sn/sn12/sn12.93-213_root-pli-ms.json'))
    ? 'run npm run source:sync:all'
    : false,
}, () => {
  const problems: string[] = [];
  const unresolved: string[] = [];
  for (const collection of ['dn', 'mn', 'sn', 'an', 'kn'] as CollectionCode[]) {
    for (const item of catalog(collection).texts) {
      const english = loadEnglishReference(collection, item.uid);
      if (!english?.present) {
        problems.push(`${collection}/${item.uid}: English file not synced`);
        continue;
      }
      const paliPath = sourcePathFor(collection, item.uid, item.sourcePath)!;
      const pali = segmentMapForUid(readJson<Record<string, string>>(upstreamFile(paliPath)), item.uid);
      const englishSegments = segmentMapForUid(readJson<Record<string, string>>(upstreamFile(english.sourcePath)), item.uid);
      if (Object.keys(pali).length === 0) {
        unresolved.push(`${collection}/${item.uid}`);
        continue;
      }
      for (const id of Object.keys(pali)) {
        if (!(id in englishSegments)) problems.push(`${collection}/${item.uid}: ${id} has no English segment`);
      }
      for (const id of Object.keys(englishSegments)) {
        if (!(id in pali)) problems.push(`${collection}/${item.uid}: ${id} is an orphan English segment`);
      }
    }
  }
  assert.deepEqual(problems, []);
  // `sn12.93-213` is the sole text bilara-data files under a UID its own segments do
  // not carry, so the Pāli root resolves nothing for it. Recorded, not guessed.
  assert.deepEqual(unresolved, ['sn/sn12.93-213']);
});

test('COLLECTIONS still declares every collection the catalogs cover', () => {
  assert.deepEqual(COLLECTIONS.map((entry) => entry.code), ['dn', 'mn', 'sn', 'an', 'kn']);
});
