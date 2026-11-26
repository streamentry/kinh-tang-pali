import assert from 'node:assert/strict';
import test from 'node:test';
import { ProgressStore, ProgressStorageError } from '../../apps/mobile/src/storage-core';
import { MemoryBackend, reading, siteUrl, track } from '../helpers/mobile';
import { trackKey } from '../../src/lib/native/protocol';

test('reading positions survive a store restart and normalize query/hash without losing context', () => {
  const backend = new MemoryBackend();
  const store = new ProgressStore(backend, () => 100);
  const position = reading();
  store.saveReading({ ...position, pageUrl: `${position.pageUrl}?app=1#mn1:1.2` });
  assert.deepEqual(new ProgressStore(backend).getReading(position.pageUrl), { ...position, updatedAt: 100 });
});

test('reading, bookmarks, audio variants and changed recordings remain independent', () => {
  const store = new ProgressStore(new MemoryBackend(), () => 100);
  const original = track();
  const children = { ...original, version: { ...original.version, id: 'children' as const, kind: 'explanation' as const } };
  store.saveReading(reading());
  store.saveListening({ track: original, position: 35, duration: 120, rate: 1, completed: false });
  store.saveListening({ track: children, position: 66, duration: 120, rate: 1.25, completed: false });
  assert.equal(store.getListening(original)?.position, 35);
  assert.equal(store.getListening(children)?.position, 66);
  assert.equal(store.getListening({ ...original, version: { ...original.version, url: 'https://audio.example.org/mn1-v2.mp3' } }), null);
  assert.equal(store.toggleBookmark(reading()), true);
  assert.equal(store.getBookmarks()[0].position?.segmentId, 'mn1:1.2');
  assert.equal(store.toggleBookmark(reading()), false);
  assert.equal(store.getReading(reading().pageUrl)?.scrollRatio, 0.4);
});

test('invalid progress is rejected and corrupt stored data is never silently discarded', () => {
  const backend = new MemoryBackend();
  const store = new ProgressStore(backend);
  assert.throws(() => store.saveReading({ ...reading(), scrollRatio: NaN }), ProgressStorageError);
  assert.throws(() => store.saveListening({ track: track(), position: 1_000, duration: 10_000, rate: 1, completed: false }), ProgressStorageError);
  backend.put('reading', reading().pageUrl, '{broken', 1);
  assert.throws(() => store.getReading(reading().pageUrl), ProgressStorageError);
  assert.throws(() => store.saveReading(reading()), ProgressStorageError);
  assert.equal(backend.get('reading', reading().pageUrl), '{broken');
  backend.put('listening', trackKey(track()), '{broken', 1);
  assert.throws(() => store.getListening(track()), ProgressStorageError);
  assert.throws(() => store.saveListening({ track: track(), position: 0, duration: 120, rate: 1, completed: false }), ProgressStorageError);
  assert.equal(backend.get('listening', trackKey(track())), '{broken');
});

test('deferred listening writes keep their activity date and never replace a newer stored record', () => {
  const store = new ProgressStore(new MemoryBackend(), () => 1_000);
  const item = track();
  store.saveListening({ track: item, position: 30, duration: 120, rate: 1, completed: false }, 100);
  assert.equal(store.getListening(item)?.updatedAt, 100);
  const latest = store.saveListening({ track: item, position: 80, duration: 120, rate: 1.5, completed: false }, 300);
  const retained = store.saveListening({ track: item, position: 40, duration: 120, rate: 1, completed: false }, 200);
  assert.deepEqual(retained, latest);
  assert.deepEqual(store.getListening(item), latest);
  assert.throws(() => store.saveListening({ track: item, position: 40, duration: 120, rate: 1, completed: false }, NaN), ProgressStorageError);
});

test('capturing unchanged hidden reading before import preserves recency so newer backup progress wins', () => {
  let now = 100;
  const local = new ProgressStore(new MemoryBackend(), () => now);
  const remote = new ProgressStore(new MemoryBackend(), () => 200);
  local.saveReading(reading());
  remote.saveReading({ ...reading(), segmentId: 'mn1:3.1', scrollRatio: 0.8 });
  now = 300;
  const captured = local.saveReading({ ...reading(), pageUrl: `${reading().pageUrl}?app=1#mn1:1.2` });
  assert.equal(captured.updatedAt, 100);
  assert.equal(local.importSnapshot(remote.exportSnapshot(), siteUrl).readings, 1);
  assert.equal(local.getReading(reading().pageUrl)?.segmentId, 'mn1:3.1');
  assert.equal(local.getReading(reading().pageUrl)?.updatedAt, 200);
  now = 400;
  local.saveReading({ ...reading(), segmentId: 'mn1:4.1', mode: 'compare' });
  assert.equal(local.getReading(reading().pageUrl)?.updatedAt, 400);
  assert.equal(local.importSnapshot(remote.exportSnapshot(), siteUrl).readings, 0);
});

test('backup roundtrip includes all records even beyond the recent-history display limit', () => {
  const source = new ProgressStore(new MemoryBackend(), () => 200);
  for (let index = 1; index <= 110; index++) source.saveReading(reading(`mn${index}`));
  source.saveListening({ track: track(), position: 88, duration: 120, rate: 1.5, completed: false });
  source.toggleBookmark(reading());
  assert.equal(source.listReadings().length, 100);
  const destination = new ProgressStore(new MemoryBackend());
  const counts = destination.importSnapshot(JSON.parse(JSON.stringify(source.exportSnapshot())), siteUrl);
  assert.deepEqual(counts, { readings: 110, listenings: 1, bookmarks: 1 });
  assert.equal(destination.getReading(reading('mn110').pageUrl)?.segmentId, 'mn110:1.2');
  assert.equal(destination.getListening(track())?.rate, 1.5);
});

test('backup merge preserves newer local progress, imports newer remote positions, and is idempotent', () => {
  const local = new ProgressStore(new MemoryBackend(), () => 300);
  const remote = new ProgressStore(new MemoryBackend(), () => 200);
  local.saveReading({ ...reading(), scrollRatio: 0.8 });
  remote.saveReading(reading());
  remote.saveReading(reading('mn2'));
  assert.deepEqual(local.importSnapshot(remote.exportSnapshot(), siteUrl), { readings: 1, listenings: 0, bookmarks: 0 });
  assert.equal(local.getReading(reading().pageUrl)?.scrollRatio, 0.8);
  assert.deepEqual(local.importSnapshot(remote.exportSnapshot(), siteUrl), { readings: 0, listenings: 0, bookmarks: 0 });
});

test('malformed, future-schema and foreign-site backups fail before writing any records', () => {
  const remote = new ProgressStore(new MemoryBackend(), () => 100);
  remote.saveReading(reading());
  remote.saveReading(reading('mn2'));
  const store = new ProgressStore(new MemoryBackend());
  const malformed = remote.exportSnapshot();
  malformed.readings[1].scrollRatio = 2;
  assert.throws(() => store.importSnapshot(malformed, siteUrl));
  assert.equal(store.listReadings().length, 0);
  assert.throws(() => store.importSnapshot({ ...remote.exportSnapshot(), version: 2 }, siteUrl));
  assert.throws(() => store.importSnapshot(remote.exportSnapshot(), 'https://example.org/'));
  assert.equal(store.listReadings().length, 0);
});

test('a failed write rolls back the whole backup merge', () => {
  const remote = new ProgressStore(new MemoryBackend(), () => 100);
  remote.saveReading(reading());
  remote.saveReading(reading('mn2'));
  const backend = new MemoryBackend();
  backend.failKey = reading('mn2').pageUrl;
  const local = new ProgressStore(backend);
  assert.throws(() => local.importSnapshot(remote.exportSnapshot(), siteUrl), /Disk full/);
  assert.equal(local.listReadings().length, 0);
});
