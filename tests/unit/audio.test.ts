import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { composeDocument } from '../../src/lib/canon/document';
import { narrationSource, narrationHash, loadAudio } from '../../src/lib/canon/audio';

test('MN1 narration includes summary and canonical prose, never comments or heading IDs', () => {
  const doc = composeDocument('mn', 'mn1');
  const source = narrationSource(doc);
  assert.equal(source.summary, doc.summary?.trim());
  assert.equal(source.segments.length, doc.segments.filter(s => !s.id.startsWith('mn1:0.') && s.vi?.trim()).length);
  assert.equal(source.segments[0][1], 'Tôi nghe như vầy.');
  assert.ok(source.segments.every(([id, text]) => doc.segments.find(s => s.id === id)?.vi?.trim() === text));
  const changedComment = { ...doc, segments: doc.segments.map(s => ({ ...s, commentVi: 'NOT FOR NARRATION' })) };
  assert.equal(narrationHash(doc), narrationHash(changedComment));
  assert.notEqual(narrationHash(doc), narrationHash({ ...doc, summary: doc.summary + ' changed' }));
  assert.notEqual(narrationHash(doc), narrationHash({ ...doc, segments: doc.segments.map(s => ({ ...s, vi: s.vi ? s.vi + ' changed' : undefined })) }));
});

test('unregistered texts have no player', () => {
  assert.equal(loadAudio({ ...composeDocument('mn', 'mn1'), uid: 'test-no-audio-registration' }), null);
});

test('registered MN1 audio matches the current source and disappears after text changes', {
  skip: !fs.existsSync('content/audio/mn1.json'),
}, () => {
  const doc = composeDocument('mn', 'mn1');
  const audio = loadAudio(doc);
  assert.ok(audio);
  assert.ok(audio.scripture_start_seconds > 0);
  assert.ok(audio.scripture_start_seconds < audio.duration_seconds);
  assert.equal(loadAudio({ ...doc, summary: doc.summary + ' changed' }), null);
});

test('DN narration source resolves Digha canonical summary and Vietnamese text', () => {
  const doc = composeDocument('dn', 'dn1');
  const source = narrationSource(doc);
  assert.ok(source.summary);
  assert.ok(source.segments.length);
  assert.ok(source.segments.every(([id]) => id.startsWith('dn1:') && !id.startsWith('dn1:0.')));
});
