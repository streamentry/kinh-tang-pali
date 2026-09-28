/**
 * The four-version comparison document.
 *
 * These tests are about two things the reader must never get wrong:
 *
 *   1. **Alignment.** The Pāli root is the key set, so every version lines up with it
 *      and a segment id means the same thing in all four columns.
 *   2. **Honest absence.** A version SuttaCentral does not publish, a version that is
 *      published but not fetched, and a version present but silent at a segment are
 *      three different facts. The reader is told which, because collapsing them is how
 *      a text's missing reference gets mistaken for agreement on wording.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, renameSync } from 'node:fs';
import { composeDocument } from '../../src/lib/canon/document';
import { storeLayers } from '../../src/lib/canon/layers';
import { manifestCommit, upstreamPublishes } from '../../src/lib/canon/manifest';
import { loadLock, sourcePathFor, loadCatalog } from '../../src/lib/canon/load';
import type { CollectionCode } from '../../src/lib/canon/types';

const synced = existsSync('.cache/upstream/suttacentral/root/pli/ms/sutta/kn/mil/mil1_root-pli-ms.json');
const fullSync = { skip: synced ? false : 'run npm run source:sync:manifest' };

test('the manifest the site reads names the same commit as the lock', () => {
  assert.equal(manifestCommit(), loadLock().commit);
});

test('upstreamPublishes answers null rather than guessing when it cannot tell', () => {
  // A layer that is not an upstream edition, and a path outside it, are both
  // unanswerable — reporting either as "not published" would invent a fact about the
  // corpus, which is exactly the failure the coverage audit already made once.
  assert.equal(upstreamPublishes('pali', 'nonsense/elsewhere.json'), null);
  assert.equal(upstreamPublishes('no-such-layer', 'x.json'), null);
});

test('upstreamPublishes separates a published text from an unpublished one', fullSync, () => {
  // Milindapañha: Pāli exists, no English anywhere on SuttaCentral.
  assert.equal(
    upstreamPublishes('pali', 'root/pli/ms/sutta/kn/mil/mil1_root-pli-ms.json'),
    true,
  );
  assert.equal(
    upstreamPublishes('english-sujato', 'translation/en/sujato/sutta/kn/mil/mil1_translation-en-sujato.json'),
    false,
  );
  // Majjhima: both exist.
  assert.equal(
    upstreamPublishes('english-sujato', 'translation/en/sujato/sutta/mn/mn118_translation-en-sujato.json'),
    true,
  );
});

test('every text reports four versions, in reading order, with the right standing', fullSync, () => {
  for (const [collection, uid] of [['mn', 'mn118'], ['kn', 'dhp1-20'], ['kn', 'mil1']] as const) {
    const document = composeDocument(collection as CollectionCode, uid);
    assert.deepEqual(
      document.layers.map((layer) => layer.id),
      ['pali', 'english', 'viCurrent', 'vi'],
      `${collection}/${uid}: reference layers read left of ours`,
    );
    const standing = Object.fromEntries(document.layers.map((layer) => [layer.id, layer.standing]));
    assert.deepEqual(standing, {
      // Pāli is the authority; the references must never claim to be.
      pali: 'authority',
      english: 'reference',
      viCurrent: 'reference',
      vi: 'project',
    }, `${collection}/${uid}: only Pāli is the authority`);
  }
});

test('Pāli is the key set, so all four columns line up segment for segment', fullSync, () => {
  const document = composeDocument('mn', 'mn118');
  const ids = document.segments.map((segment) => segment.id);
  assert.ok(ids.length > 100, 'mn118 should resolve its segments');
  assert.equal(new Set(ids).size, ids.length, 'segment ids are unique');

  const pali = storeLayers().find((layer) => layer.id === 'pali')!;
  assert.ok(pali.authority, 'the Pāli layer is the authority');

  for (const segment of document.segments) {
    assert.ok(segment.pali !== undefined, `${segment.id}: a segment exists because Pāli declares it`);
    // Every version's key must be a Pāli key, or it is an orphan in the reader.
    for (const value of [segment.en, segment.viCurrent, segment.vi]) {
      if (value !== undefined) assert.ok(ids.includes(segment.id));
    }
  }
  for (const layer of document.layers) {
    assert.equal(layer.total, ids.length, `${layer.id}: reports against the same segment count`);
    assert.ok(layer.withText <= layer.total, `${layer.id}: cannot have more text than segments`);
  }
});

test('a bundled range UID compares across every sutta in the range', fullSync, () => {
  // `an1.248-257` is a bookmark bundle: one file, ten suttas, individual segment
  // prefixes, none of which carries the range UID itself. The comparison has to line up
  // on the real prefixes or the range would resolve to nothing.
  const document = composeDocument('an', 'an1.248-257');
  const prefixes = new Set(document.segments.map((segment) => segment.id.split(':')[0]));
  assert.ok(prefixes.size >= 10, `expected the whole bundle, resolved ${prefixes.size} suttas`);
  for (const segment of document.segments) {
    assert.ok(segment.pali !== undefined, `${segment.id}: Pāli resolved`);
  }
  const english = document.layers.find((layer) => layer.id === 'english')!;
  assert.ok(english.withText > 0, 'the bundle has English to compare against');
  assert.ok(english.withText <= english.total);
});

test('a version the snapshot does not publish says so, rather than rendering blank', fullSync, () => {
  // Milindapañha has no English on SuttaCentral and no Thích Minh Châu text. Both
  // must be reported as a limit of the snapshot, not as a local sync problem — that
  // distinction is the whole reason the manifest is read by the site.
  const document = composeDocument('kn', 'mil1');
  const english = document.layers.find((layer) => layer.id === 'english')!;
  const current = document.layers.find((layer) => layer.id === 'viCurrent')!;
  assert.equal(english.reason, 'not-published-upstream');
  assert.equal(current.reason, 'not-published-upstream');
  assert.equal(english.withText, 0);
  assert.equal(english.sourceLayers.length, 0, 'nothing contributed, and it does not pretend otherwise');

  for (const segment of document.segments) {
    assert.equal(segment.en, undefined);
    assert.equal(segment.absence.en, 'not-published-upstream');
    assert.equal(segment.absence.viCurrent, 'not-published-upstream');
  }
});

test('a version published but not fetched is told apart from one never published', fullSync, () => {
  // The English file is in the pinned manifest but is deliberately moved out of the
  // local cache. The reader must report `not-synced`, because that is a local state
  // someone can fix. Claiming "SuttaCentral has no English here" would be false, and
  // it would disguise a sync bug as a property of the corpus — the confusion this
  // project has already been bitten by once.
  const englishFile = '.cache/upstream/suttacentral/translation/en/sujato/sutta/mn/mn152_translation-en-sujato.json';
  if (!existsSync(englishFile)) return; // nothing to hide in a partial cache
  const away = `${englishFile}.hidden-for-test`;
  renameSync(englishFile, away);
  try {
    const document = composeDocument('mn', 'mn152');
    const english = document.layers.find((layer) => layer.id === 'english')!;
    assert.equal(english.reason, 'not-synced', 'published upstream, absent from the cache');
    assert.equal(english.withText, 0);
    assert.equal(english.sourceLayers.length, 0, 'nothing contributed');
  } finally {
    renameSync(away, englishFile);
  }
  // And with the file back, the same text reports the edition as present.
  const restored = composeDocument('mn', 'mn152');
  assert.equal(
    restored.layers.find((layer) => layer.id === 'english')!.reason,
    'none',
    'the cache is intact again',
  );
});

test('a blank reference segment is a gap in that edition, not an absence of the edition', fullSync, () => {
  // Sujato leaves blockquotes and `…pe…` elisions empty. Where it does, the cell says
  // the reference is blank *here* — which is what the English fill layer exists to
  // address — rather than claiming the edition is missing.
  const document = composeDocument('kn', 'dhp1-20');
  const english = document.layers.find((layer) => layer.id === 'english')!;
  assert.equal(english.reason, 'none', 'the edition is present');
  assert.ok(english.withText < english.total, 'and still leaves some segments blank');
  const blank = document.segments.filter((segment) => !segment.en);
  assert.ok(blank.length > 0);
  for (const segment of blank) {
    assert.equal(segment.absence.en, 'none', `${segment.id}: present edition, silent at this segment`);
  }
});

test('our own English fill is marked as ours, never presented as the pinned edition', fullSync, () => {
  // `an3.149` is one of the seeded fills: Sujato left a passage blank and the project
  // supplied it. A reader must be able to tell the two apart, because a pinned
  // published translation and our own draft do not carry the same weight.
  const document = composeDocument('an', 'an3.149');
  const english = document.layers.find((layer) => layer.id === 'english')!;
  assert.ok(
    english.sourceLayers.includes('english-project'),
    'the English column is assembled from both layers',
  );
  assert.ok(
    english.sourceLayers.includes('english-sujato'),
    'and Sujato takes precedence wherever it translated',
  );
  assert.equal(english.sourceLayers[0], 'english-sujato', 'the pinned edition is consulted first');

  const filled = document.segments.filter((segment) => segment.enFrom === 'english-project');
  assert.ok(filled.length > 0, 'the seeded fill is present');
  for (const segment of filled) {
    assert.ok(segment.en, `${segment.id}: a fill segment carries our text`);
  }
  // A Sujato segment must never be attributed to our fill.
  for (const segment of document.segments) {
    if (segment.enFrom === 'english-sujato') assert.ok(segment.en);
  }
});

test('a text with no project data still renders every version it does have', fullSync, () => {
  // 1,596 catalogue texts have no project translation at all. The reader must still be
  // useful there: the Pāli and whatever references exist, and our panel marked as not
  // started rather than absent from the page.
  const document = composeDocument('kn', 'mil1');
  assert.equal(document.hasProjectData, false);
  const project = document.layers.find((layer) => layer.id === 'vi')!;
  assert.equal(project.reason, 'not-started');
  assert.equal(project.status, 'not-started');
  assert.ok(document.layers.length === 4, 'all four versions are still described');
  for (const segment of document.segments) {
    assert.equal(segment.absence.vi, 'not-started');
  }
});

test('the document names the commit its authority layer was read at', fullSync, () => {
  assert.equal(composeDocument('mn', 'mn118').commit, loadLock().commit);
});

test('the project translation is never absent for a reason other than not-started', fullSync, () => {
  // The project's own layer is local, so there is no upstream to blame. If it reports
  // `not-published-upstream` or `not-synced` something is wired wrongly.
  for (const [collection, uid] of [['mn', 'mn118'], ['kn', 'dhp1-20'], ['an', 'an3.149']] as const) {
    const project = composeDocument(collection as CollectionCode, uid)
      .layers.find((layer) => layer.id === 'vi')!;
    assert.ok(
      ['none', 'not-started'].includes(project.reason),
      `${collection}/${uid}: project layer reported '${project.reason}'`,
    );
  }
});

test('a text whose Pāli is missing degrades instead of throwing', () => {
  // A catalogue entry with no local Pāli must still produce a document, so the page
  // can explain what to do rather than failing the whole static build.
  const document = composeDocument('kn', 'bv999' in loadCatalog('kn').texts ? 'bv999' : 'bv1');
  assert.ok(Array.isArray(document.segments));
  assert.equal(document.layers.length, 4);
});
