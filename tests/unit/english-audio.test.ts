import test from 'node:test';
import assert from 'node:assert/strict';
import type { CanonDocument } from '../../src/lib/canon/types';
import { englishAudioSource, englishAudioTranscriptHash } from '../../src/lib/canon/english-audio';

function document(segments: Array<{ id: string; en?: string; enFrom?: 'english-sujato' | 'english-project' }>, commit = 'pinned-commit'): CanonDocument {
  return {
    uid: 'dn1',
    collection: 'dn',
    sourceKey: 'dn1',
    canonicalOrder: 1,
    viTitle: 'Kinh Trường Bộ',
    status: 'published',
    hasProjectData: true,
    commit,
    layers: [],
    segments: segments.map((segment) => ({
      id: segment.id,
      en: segment.en,
      enFrom: segment.enFrom,
      absence: { en: 'none', viCurrent: 'not-published-upstream', vi: 'none' },
    })),
  };
}

test('English narration source preserves reader order and segment provenance', () => {
  const source = englishAudioSource(document([
    { id: 'dn1:1.1', en: 'Sujato sentence.', enFrom: 'english-sujato' },
    { id: 'dn1:1.2', en: 'Published project fill.', enFrom: 'english-project' },
    { id: 'dn1:1.3', en: 'Another Sujato sentence.', enFrom: 'english-sujato' },
  ]), 'published');

  assert.equal(source.status, 'ready');
  assert.deepEqual(source.segments.map((segment) => [segment.id, segment.text, segment.source]), [
    ['dn1:1.1', 'Sujato sentence.', 'english-sujato'],
    ['dn1:1.2', 'Published project fill.', 'english-project'],
    ['dn1:1.3', 'Another Sujato sentence.', 'english-sujato'],
  ]);
  assert.equal(source.source_segment_counts['english-sujato'], 2);
  assert.equal(source.source_segment_counts['english-project'], 1);
  assert.match(source.source_sha256 ?? '', /^[0-9a-f]{64}$/);
});

test('project English is blocked until its own status is published', () => {
  const source = englishAudioSource(document([
    { id: 'dn1:1.1', en: 'Draft fill.', enFrom: 'english-project' },
  ]), 'draft');
  assert.equal(source.status, 'blocked');
  assert.equal(source.source_sha256, null);
  assert.deepEqual(source.blockers, ['project English is not published at dn1:1.1']);
});

test('a text with no English prose is classified as no-english', () => {
  const source = englishAudioSource(document([
    { id: 'dn1:1.1', en: '   ' },
    { id: 'dn1:1.2' },
  ]), null);
  assert.equal(source.status, 'no-english');
  assert.deepEqual(source.segments, []);
  assert.equal(source.source_sha256, null);
});

test('the English source hash changes with its source commit or wording', () => {
  const first = englishAudioSource(document([
    { id: 'dn1:1.1', en: 'Sujato sentence.', enFrom: 'english-sujato' },
  ]), null);
  const changed = englishAudioSource(document([
    { id: 'dn1:1.1', en: 'Revised sentence.', enFrom: 'english-sujato' },
  ], 'different-commit'), null);
  assert.notEqual(first.source_sha256, changed.source_sha256);
});

test('English words without a known source layer are blocked', () => {
  const source = englishAudioSource(document([
    { id: 'dn1:1.1', en: 'Unattributed English.' },
  ]), null);
  assert.equal(source.status, 'blocked');
  assert.deepEqual(source.blockers, ['English provenance missing or unsupported at dn1:1.1']);
});

test('English transcript hash keeps segment order, text, and supplying layer', () => {
  const first = englishAudioSource(document([
    { id: 'dn1:1.1', en: 'First.', enFrom: 'english-sujato' },
    { id: 'dn1:1.2', en: 'Second.', enFrom: 'english-project' },
  ]), 'published');
  const reordered = englishAudioSource(document([
    { id: 'dn1:1.2', en: 'Second.', enFrom: 'english-project' },
    { id: 'dn1:1.1', en: 'First.', enFrom: 'english-sujato' },
  ]), 'published');
  const reattributed = englishAudioSource(document([
    { id: 'dn1:1.1', en: 'First.', enFrom: 'english-project' },
    { id: 'dn1:1.2', en: 'Second.', enFrom: 'english-project' },
  ]), 'published');
  assert.match(englishAudioTranscriptHash(first) ?? '', /^[0-9a-f]{64}$/);
  assert.notEqual(englishAudioTranscriptHash(first), englishAudioTranscriptHash(reordered));
  assert.notEqual(englishAudioTranscriptHash(first), englishAudioTranscriptHash(reattributed));
  assert.equal(englishAudioTranscriptHash(englishAudioSource(document([{ id: 'dn1:1.1', en: 'Draft.' }]), null)), null);
});
