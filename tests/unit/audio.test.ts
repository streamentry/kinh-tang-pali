import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { composeDocument } from '../../src/lib/canon/document';
import { narrationSource, narrationHash, loadAudio, hasAudioRegistration } from '../../src/lib/canon/audio';

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
  assert.equal(hasAudioRegistration('test-no-audio-registration'), false);
});

test('registered MN1 audio matches the current source and disappears after text changes', {
  skip: !fs.existsSync('content/audio/mn1.json'),
}, () => {
  const doc = composeDocument('mn', 'mn1');
  const audio = loadAudio(doc);
  assert.ok(audio);
  assert.ok(audio.scripture_start_seconds > 0);
  assert.ok(audio.scripture_start_seconds < audio.duration_seconds);
  const original = audio.versions.find(version => version.id === 'original');
  assert.ok(original);
  assert.equal(original.url, audio.url);
  assert.equal(original.start_seconds, audio.scripture_start_seconds);
  assert.equal(new Set(audio.versions.map(version => version.id)).size, audio.versions.length);
  assert.ok(audio.versions.every(version => version.review_status === 'pending' || version.review_status === 'approved'));
  assert.equal(loadAudio({ ...doc, summary: doc.summary + ' changed' }), null);
});

test('DN narration source resolves Digha canonical summary and Vietnamese text', () => {
  const doc = composeDocument('dn', 'dn1');
  const source = narrationSource(doc);
  assert.ok(source.summary);
  assert.ok(source.segments.length);
  assert.ok(source.segments.every(([id]) => id.startsWith('dn1:') && !id.startsWith('dn1:0.')));
});

test('DN audience registrations become selectable player versions without replacing the original', {
  skip: !fs.existsSync('content/audio/dn4.json'),
}, () => {
  const doc = composeDocument('dn', 'dn4');
  const audio = loadAudio(doc);
  assert.ok(audio);
  assert.equal(audio.versions[0].id, 'original');
  assert.ok(audio.versions.some(version => version.id === 'children' && version.kind === 'explanation'));
  const children = audio.versions.find(version => version.id === 'children');
  assert.ok(children);
  assert.equal(children.start_seconds, 0);
  assert.equal(children.review_status, 'pending');
  assert.equal(audio.versions.find(version => version.id === 'original')?.url, audio.url);
});
