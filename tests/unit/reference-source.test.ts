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
import { upstreamPublishes } from '../../src/lib/canon/manifest';
import { parse } from 'yaml';
import type { CanonCatalog, CollectionCode } from '../../src/lib/canon/types';

interface SuttaMeta {
  status?: string;
  quality?: { blocking_errors?: string[] };
}

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
  // Texts the pinned edition does not publish at all. The editor has put the whole
  // corpus in scope, so these get translated — but AGENTS.md is explicit that a
  // missing reference layer blocks `review` and `published`, and the manifest is
  // what separates "upstream never published it" from "nobody downloaded it".
  // So the requirement moves rather than disappears: such a text must be `draft`
  // and must carry a recorded blocker. That is the same rule `validate` enforces,
  // and it is checked here per text so a silent promotion cannot slip through.
  const unpublishedUpstream: string[] = [];
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
        const sourcePath = english?.sourcePath ?? englishPathFor(collection, uid, item.sourcePath);
        const published = sourcePath ? upstreamPublishes('english-sujato', sourcePath) : null;
        if (published === true) {
          problems.push(`${collection}/${uid}: pinned English exists but is not synced (${sourcePath})`);
        } else if (published === false) {
          unpublishedUpstream.push(`${collection}/${uid}`);
          const meta = parse(readFileSync(`${dir}/${name}`, 'utf8')) as SuttaMeta;
          if (meta.status !== 'draft') {
            problems.push(`${collection}/${uid}: no pinned English edition at this commit, so ${meta.status} cannot stand`);
          }
          const blockers = meta.quality?.blocking_errors ?? [];
          if (blockers.length === 0) {
            problems.push(`${collection}/${uid}: no pinned English edition and no recorded blocker`);
          }
        } else {
          problems.push(`${collection}/${uid}: cannot tell whether the pinned edition publishes English for it`);
        }
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
  // Pinned, so the branch above cannot go vacuous: 1,596 Khuddaka texts have no
  // English anywhere on SuttaCentral at the locked commit, and `kn/ja101` is one
  // of the project's own translations among them. If upstream ever publishes
  // English for these, this fails and the scorecards have to be re-triangulated.
  assert.ok(unpublishedUpstream.length > 100, `expected the no-English group, found ${unpublishedUpstream.length}`);
  assert.ok(unpublishedUpstream.includes('kn/ja101'), 'kn/ja101 has no pinned English and must be checked as such');
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
  // blockquote, and the ellipsis at :3.5 likewise. The PINNED edition leaves both
  // empty — so this text also measures what the store does about it.
  //
  // It used to assert exactly that hole (`substantiveWithoutEnglish === 2`) and sit
  // just above the floor. That measurement became wrong the moment the project's own
  // `english-project` layer filled those two segments: the assertion was still
  // describing the pinned edition's blanks, while the metric under test now measures
  // the fill layer too. Asserting a number that only stays true while a known gap
  // happens to remain unfilled is a test that fails the moment the project succeeds.
  // So it now pins the ratio from both sides and asserts the shape of the hole.
  const blockquoted = englishCoverageFor('an', 'an2.1')!;
  assert.equal(blockquoted.substantiveSegments, 22);
  assert.equal(
    blockquoted.substantiveWithoutEnglish,
    0,
    'the project fill now covers both segments the pinned edition left blank',
  );
  assert.equal(blockquoted.ratio, 1, 'so an2.1 is fully covered at store level');

  // sn24.37 was the counter-example here until the project's own fill layer closed
  // it: seven substantive segments, six blank in the pinned edition, and it sat
  // just under the floor. Every one of the six is now covered, so the assertion
  // below would have kept describing a hole the project had already cured. Keep
  // the pin — the same shape as an2.1 and an2.3 — so dropping the fill again
  // fails loudly instead of silently reopening the gap.
  const sn2437 = englishCoverageFor('sn', 'sn24.37')!;
  assert.equal(sn2437.substantiveSegments, 7);
  assert.equal(
    sn2437.substantiveWithoutEnglish,
    0,
    'the project fill now covers every blank the pinned edition left in sn24.37',
  );
  assert.equal(sn2437.ratio, 1, 'so sn24.37 is fully covered at store level');

  // mn58 is the live counter-example that keeps this test meaningful. Twenty-one
  // of its seventy-six substantive segments are blank in the pinned edition and
  // the fill layer has not covered them, so it sits under the floor. The shape
  // matters: nine of those twenty-one are Pāli repeated *verbatim* elsewhere in
  // the same text (:3.18 and the six :6.1x–:6.2x replies), so much of the
  // meaning is recoverable from the keys around them. That is exactly why the
  // metric counts missing segments rather than declaring the text unreadable.
  // It is the smallest text left with a genuinely thin pinned edition — every
  // other sub-floor text is one the pin does not cover at all.
  const mn58 = englishCoverageFor('mn', 'mn58')!;
  assert.equal(mn58.substantiveSegments, 76);
  assert.equal(mn58.substantiveWithoutEnglish, 21);
  assert.ok(mn58.ratio < MIN_ENGLISH_COVERAGE, 'which does drop it below the floor');
  assert.ok(
    Math.abs(mn58.ratio - 0.7237) < 1e-4,
    'and the hole is 21 of 76 substantive segments, not a rounded impression',
  );
  const english = segmentMapForUid(
    readJson<Record<string, string>>(upstreamFile('translation/en/sujato/sutta/an/an2/an2.1-10_translation-en-sujato.json')),
    'an2.3',
  );
  assert.equal(english['an2.3:1.4'].trim(), '', 'the merged segment is blank');
  assert.ok(english['an2.3:1.3'].includes('body, speech, and mind'), 'its content moved to :1.3');
  // The pinned blanks above are unchanged — but the store-level metric no longer
  // sees a hole here: the project fill has since covered all four merged segments,
  // just as it did for an2.1. Pin that too, so a regression that drops the fill
  // fails loudly instead of silently reopening the gap.
  const merged = englishCoverageFor('an', 'an2.3')!;
  assert.equal(merged.substantiveSegments, 7);
  assert.equal(
    merged.substantiveWithoutEnglish,
    0,
    'the project fill now covers the merged segments the pinned edition left blank',
  );
  assert.equal(merged.ratio, 1, 'so an2.3 is fully covered at store level');
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

test('a full catalogue sync resolves every English edition that exists, and names the ones that do not', {
  // Guarded on a file only `source:sync:manifest` fetches: CI syncs just the texts the
  // project works on, and this asserts the whole-catalogue claim.
  skip: !existsSync(upstreamFile('root/pli/ms/sutta/kn/mil/mil1_root-pli-ms.json'))
    ? 'run npm run source:sync:manifest'
    : false,
}, () => {
  const problems: string[] = [];
  const unresolved: string[] = [];
  const noEnglishEdition: string[] = [];
  for (const collection of ['dn', 'mn', 'sn', 'an', 'kn'] as CollectionCode[]) {
    for (const item of catalog(collection).texts) {
      const paliPath = sourcePathFor(collection, item.uid, item.sourcePath)!;
      const paliFile = upstreamFile(paliPath);
      if (!existsSync(paliFile)) {
        problems.push(`${collection}/${item.uid}: Pāli root not synced`);
        continue;
      }
      const pali = segmentMapForUid(readJson<Record<string, string>>(paliFile), item.uid);
      if (Object.keys(pali).length === 0) {
        unresolved.push(`${collection}/${item.uid}`);
        continue;
      }
      const english = loadEnglishReference(collection, item.uid);
      if (!english?.present) {
        // SuttaCentral publishes no English edition for these texts at all — the
        // extra-canonical Khuddaka collections. That is a coverage limit of the
        // snapshot, not a sync failure, so it is counted rather than called a defect.
        noEnglishEdition.push(`${collection}/${item.uid}`);
        continue;
      }
      const englishSegments = segmentMapForUid(readJson<Record<string, string>>(upstreamFile(english.sourcePath)), item.uid);
      for (const id of Object.keys(pali)) {
        if (!(id in englishSegments)) problems.push(`${collection}/${item.uid}: ${id} has no English segment`);
      }
      for (const id of Object.keys(englishSegments)) {
        if (!(id in pali)) problems.push(`${collection}/${item.uid}: ${id} is an orphan English segment`);
      }
    }
  }
  assert.deepEqual(problems, []);
  // `sn12.93-213` was the sole text bilara-data files under a UID its own segments do
  // not carry. Repaired by `segmentBelongsToUid`, so nothing is unresolved now; this
  // assertion is the tripwire.
  assert.deepEqual(unresolved, []);
  // Pinned so a change in the upstream edition's coverage cannot pass unnoticed.
  const byCollection = new Map<string, number>();
  for (const entry of noEnglishEdition) {
    const collection = entry.split('/')[0];
    byCollection.set(collection, (byCollection.get(collection) ?? 0) + 1);
  }
  assert.deepEqual(Object.fromEntries([...byCollection.entries()].sort()), { kn: 1596 });
});

test('COLLECTIONS still declares every collection the catalogs cover', () => {
  assert.deepEqual(COLLECTIONS.map((entry) => entry.code), ['dn', 'mn', 'sn', 'an', 'kn']);
});
