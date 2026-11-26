import test from 'node:test';
import assert from 'node:assert/strict';
import { ReaderSession } from '../../apps/mobile/src/reader-session';
import { type NativeMessage, type ReadingPosition, type WebMessage } from '../../src/lib/native/protocol';
import { reading, siteUrl, track } from '../helpers/mobile';

const page = (uid = 'mn1') => ({ url: reading(uid).pageUrl, title: `Kinh ${uid}`, uid });
const ready = (sessionId = 'document-1', uid = 'mn1'): WebMessage => ({ v: 1, sessionId, page: page(uid), type: 'ready' });
const progress = (sessionId = 'document-1', position = reading()): WebMessage => ({
  v: 1, sessionId, page: { url: position.pageUrl, title: position.title, uid: position.uid }, type: 'reading-progress', position,
});
const captured = (requestId: string, position: ReadingPosition | null = reading(), sessionId = 'document-1'): WebMessage => ({
  v: 1, sessionId, page: page(), type: 'captured', requestId, position,
});

function harness(options: { requested?: ReadingPosition; timeout?: number } = {}) {
  const sent: NativeMessage[] = [];
  const saved: ReadingPosition[] = [];
  const errors: string[] = [];
  const state = { active: true, broken: false, savesFail: false, reads: 0, audioStarts: 0, readyCount: 0, stored: reading() as ReadingPosition | null };
  const bridge = new ReaderSession(siteUrl, reading().pageUrl, {
    send: message => { sent.push(message); },
    getReading: () => { ++state.reads; if (state.broken) throw new Error('Corrupt record'); return state.stored; },
    saveReading: position => { if (state.savesFail) return false; saved.push(position); return true; },
    isActive: () => state.active,
    ready: () => { ++state.readyCount; },
    audio: () => { ++state.audioStarts; },
    error: message => { errors.push(message); },
  }, options.requested, options.timeout);
  const requestId = () => {
    const request = sent.at(-1);
    assert.equal(request?.type, 'capture');
    if (request?.type !== 'capture' || !request.requestId) throw new Error('Capture request missing');
    return request.requestId;
  };
  return { bridge, sent, saved, errors, state, requestId };
}

test('duplicate ready replays one hydration snapshot, and pre-hydration scroll cannot replace progress', () => {
  const h = harness();
  assert.equal(h.bridge.receive(progress()), false);
  h.bridge.receive(ready()); h.bridge.receive(ready());
  assert.equal(h.state.reads, 1);
  assert.equal(h.state.readyCount, 1);
  const restore: NativeMessage = { v: 1, sessionId: 'document-1', type: 'restore', position: reading() };
  assert.deepEqual(h.sent, [restore, restore]);
  assert.equal(h.bridge.receive(progress()), true);
  assert.equal(h.saved.length, 1);
});

test('a lost first restore recovers the same bookmark snapshot without rereading changed storage', () => {
  const bookmark = { ...reading(), segmentId: 'mn1:9.1', scrollRatio: 0.9 };
  const h = harness({ requested: bookmark });
  h.bridge.receive(ready()); // The native transport loses this first injection.
  const first = h.sent[0];
  h.state.stored = { ...reading(), segmentId: 'mn1:2.1', scrollRatio: 0.2 };
  h.bridge.receive(ready()); h.bridge.receive(ready());
  assert.deepEqual(h.sent, [first, first, first]);
  assert.equal(first.type, 'restore');
  if (first.type === 'restore') assert.deepEqual(first.position, bookmark);
  assert.equal(h.state.reads, 1);
  assert.equal(h.state.readyCount, 1);
});

test('a new reader can retry restore(null), but a retired session cannot replay it', () => {
  const h = harness(); h.state.stored = null;
  h.bridge.receive(ready()); h.bridge.receive(ready());
  const restore: NativeMessage = { v: 1, sessionId: 'document-1', type: 'restore', position: null };
  assert.deepEqual(h.sent, [restore, restore]);
  h.bridge.navigate(reading().pageUrl);
  assert.equal(h.bridge.receive(ready()), false);
  assert.equal(h.sent.length, 2);
  h.bridge.receive(ready('document-2'));
  assert.equal(h.state.reads, 2);
  assert.deepEqual(h.sent.at(-1), { ...restore, sessionId: 'document-2' });
});

test('failed hydration never sends restore(null), even for a bookmark or duplicate ready', async () => {
  const h = harness({ requested: { ...reading(), scrollRatio: 0.9 } });
  h.state.broken = true;
  h.bridge.receive(ready()); h.bridge.receive(ready());
  assert.equal(h.sent.length, 0);
  assert.equal(h.errors.length, 1);
  assert.equal(h.state.reads, 1);
  assert.equal(await h.bridge.capture(), false);
  assert.equal(h.bridge.receive(progress()), false);
  assert.equal(h.saved.length, 0);
  h.state.broken = false;
  h.bridge.receive(ready());
  assert.equal(h.sent.length, 0, 'A duplicate ready must not reopen a failed hydration gate');
  assert.equal(h.state.reads, 1);
  h.bridge.navigate(reading().pageUrl);
  h.bridge.receive(ready('document-2'));
  assert.equal(h.sent[0]?.type, 'restore');
  assert.equal(h.bridge.receive(progress('document-2')), true);
});

test('old page messages and same-URL reloads cannot take over, while browser-history documents can reconnect', () => {
  const h = harness();
  h.bridge.receive(ready());
  h.bridge.navigate(reading('mn2').pageUrl);
  assert.equal(h.bridge.receive(ready()), false);
  h.bridge.receive(ready('document-2', 'mn2'));
  assert.equal(h.bridge.receive(progress()), false);
  h.bridge.navigate(reading().pageUrl);
  assert.equal(h.bridge.receive(ready()), true); // Native back/forward cache retains this document ID.
  assert.equal(h.bridge.receive(progress()), true);
  h.bridge.navigate(reading().pageUrl); // Same-URL reload needs a fresh document.
  assert.equal(h.bridge.receive(ready()), false);
  h.bridge.receive(ready('document-3'));
  assert.equal(h.bridge.receive(progress('document-3')), true);
  assert.equal(h.saved.length, 2);
  assert.equal(h.bridge.isCurrentDocument(`${siteUrl}fonts/missing.woff2`), false);
  assert.equal(h.bridge.isCurrentDocument(`${reading().pageUrl}#mn1:2.1`), true);
});

test('a hidden reader can flush reading progress but cannot start native audio', async () => {
  const h = harness();
  h.bridge.receive(ready()); h.state.active = false;
  const audio: WebMessage = { ...ready(), type: 'audio-play', track: track() };
  assert.equal(h.bridge.receive(audio), false);
  assert.equal(h.state.audioStarts, 0);
  const capture = h.bridge.capture();
  h.bridge.receive(captured(h.requestId()));
  assert.equal(await capture, true);
  assert.equal(h.saved.length, 1);
  h.state.active = true;
  assert.equal(h.bridge.receive(audio), true);
  assert.equal(h.state.audioStarts, 1);
});

test('capture resolves after saving its matching ACK and never persists an unsolicited or repeated ACK', async () => {
  const h = harness(); h.bridge.receive(ready());
  const capture = h.bridge.capture(); const id = h.requestId();
  assert.equal(h.bridge.receive(captured('unrequested')), false);
  assert.equal(h.saved.length, 0);
  h.bridge.receive(captured(id));
  assert.equal(await capture, true);
  assert.equal(h.saved.length, 1);
  assert.equal(h.bridge.receive(captured(id)), false);
  assert.equal(h.saved.length, 1);
  const noPosition = h.bridge.capture(); h.bridge.receive(captured(h.requestId(), null));
  assert.equal(await noPosition, false);
  h.state.savesFail = true;
  const failedSave = h.bridge.capture(); h.bridge.receive(captured(h.requestId()));
  assert.equal(await failedSave, false);
});

test('an unresponsive website cannot block a backup indefinitely or save its late ACK', async () => {
  const h = harness({ timeout: 5 }); h.bridge.receive(ready());
  const capture = h.bridge.capture(); const id = h.requestId();
  assert.equal(await capture, false);
  assert.equal(h.bridge.receive(captured(id)), false);
  assert.equal(h.saved.length, 0);
});

test('import invalidation cancels pending captures and stops every old document write before React unmounts', async () => {
  const h = harness(); h.bridge.receive(ready());
  const capture = h.bridge.capture(); const id = h.requestId();
  h.bridge.suspend();
  assert.equal(await capture, false);
  assert.equal(h.bridge.receive(captured(id)), false);
  assert.equal(h.bridge.receive(progress()), false);
  assert.equal(h.bridge.receive(ready('new-message-from-old-view')), false);
  assert.equal(h.saved.length, 0);
});
