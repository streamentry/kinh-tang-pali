import assert from 'node:assert/strict';
import test from 'node:test';
import { setImmediate } from 'node:timers/promises';
import { PlaybackController, type PlayerEvent, type PlayerPort } from '../../apps/mobile/src/playback-core';
import { ProgressStore } from '../../apps/mobile/src/storage-core';
import { playlistEvent } from '../../apps/mobile/src/playlist-clock';
import type { AudioPart } from '../../src/lib/audio/types';
import { trackKey } from '../../src/lib/native/protocol';
import { MemoryBackend, track } from '../helpers/mobile';

class FakePlayer implements PlayerPort {
  state: PlayerEvent = { isLoaded: false, currentTime: 0, playing: false, isBuffering: false, didJustFinish: false };
  callback: ((event: PlayerEvent) => void) | null = null;
  lateCallback: ((event: PlayerEvent) => void) | null = null;
  playCalls = 0;
  seekCalls: number[] = [];
  rateCalls: number[] = [];
  disposed = false;
  deferSeek = false;
  staleSeekStatus = false;
  finishSeek: (() => void) | null = null;
  emit(patch: Partial<PlayerEvent>) { this.state = { ...this.state, ...patch }; this.callback?.(this.state); }
  play() { this.playCalls++; this.emit({ playing: true }); }
  pause() { this.emit({ playing: false }); }
  seekTo(seconds: number) {
    this.seekCalls.push(seconds);
    if (this.deferSeek) return new Promise<void>(resolve => {
      this.finishSeek = () => { this.state.currentTime = seconds; resolve(); };
    });
    if (!this.staleSeekStatus) this.state.currentTime = seconds;
    return Promise.resolve();
  }
  setRate(rate: number) { this.rateCalls.push(rate); }
  setLockScreen() {}
  subscribe(callback: (event: PlayerEvent) => void) {
    this.callback = callback; this.lateCallback = callback;
    return () => { this.callback = null; };
  }
  getStatus() { return this.state; }
  dispose() { this.disposed = true; }
}
function harness(nativeMultipart = false) {
  const backend = new MemoryBackend();
  const store = new ProgressStore(backend);
  const players: FakePlayer[] = [];
  const urls: string[] = [];
  const queues: (AudioPart[] | undefined)[] = [];
  const controller = new PlaybackController(store, {
    supportsNativeMultipart: nativeMultipart,
    prepare: async () => {},
    createPlayer(url, parts) { urls.push(url); queues.push(parts); const player = new FakePlayer(); players.push(player); return player; },
  });
  return { store, backend, players, urls, queues, controller };
}
async function load(player: FakePlayer) { player.emit({ isLoaded: true }); await setImmediate(); }

test('nothing auto-plays on startup; saved position survives zero-status hydration until seek completes', async t => {
  const { controller, store, players } = harness(); t.after(controller.dispose);
  const item = track();
  store.saveListening({ track: item, position: 67, duration: 120, rate: 1.25, completed: false });
  assert.equal(players.length, 0);
  controller.playTrack(item);
  const player = players[0]; player.deferSeek = true;
  await load(player);
  controller.flush();
  assert.equal(store.getListening(item)?.position, 67);
  assert.equal(player.playCalls, 0);
  assert.deepEqual(player.seekCalls, [67]);
  player.finishSeek!(); await setImmediate();
  assert.equal(player.playCalls, 1);
  assert.equal(controller.getSnapshot().status.position, 67);
  assert.equal(controller.getSnapshot().status.rate, 1.25);
});

test('a slow old seek and late source event cannot restart or overwrite the newly selected track', async t => {
  const { controller, players, store } = harness(); t.after(controller.dispose);
  controller.playTrack(track('mn1'));
  const old = players[0]; old.deferSeek = true; await load(old);
  controller.playTrack(track('mn2'));
  await load(players[1]);
  old.finishSeek!(); await setImmediate();
  old.lateCallback!({ ...old.state, isLoaded: true, currentTime: 110, playing: true });
  assert.equal(old.playCalls, 0);
  assert.equal(old.disposed, true);
  assert.equal(controller.getSnapshot().track?.uid, 'mn2');
  assert.equal(controller.getSnapshot().status.position, 10);
  assert.equal(store.getListening(track('mn1')), null);
  assert.equal(store.getListening(track('mn2'))?.position, 10);
});

test('pause while loading cancels pending autoplay', async t => {
  const { controller, players } = harness(); t.after(controller.dispose);
  controller.playTrack(track()); controller.pause();
  await load(players[0]);
  assert.equal(players[0].playCalls, 0);
  assert.equal(controller.getSnapshot().status.playing, false);
  controller.toggle();
  assert.equal(players[0].playCalls, 1);
});

test('a resolved seek with a delayed zero native sample cannot erase the resumed position', async t => {
  const { controller, players, store } = harness(); t.after(controller.dispose);
  const item = track();
  store.saveListening({ track: item, position: 67, duration: 120, rate: 1, completed: false });
  controller.playTrack(item);
  players[0].staleSeekStatus = true;
  await load(players[0]);
  controller.flush();
  assert.equal(store.getListening(item)?.position, 67);
  assert.equal(controller.getSnapshot().status.position, 67);
  players[0].emit({ currentTime: 67.5, playing: true });
  controller.flush();
  assert.equal(store.getListening(item)?.position, 67.5);
});

test('multipart seeking and automatic part continuation use the same cumulative clock', async t => {
  const { controller, players, store, urls } = harness(); t.after(controller.dispose);
  const item = track();
  item.version.parts = [
    { url: item.version.url, duration_seconds: 50 },
    { url: 'https://audio.example.org/mn1-part2.mp3', duration_seconds: 70 },
  ];
  controller.playTrack(item, 65); await load(players[0]);
  assert.equal(urls[0], item.version.parts[1].url);
  assert.deepEqual(players[0].seekCalls, [15]);
  assert.equal(controller.getSnapshot().status.position, 65);
  controller.seek(35); await load(players[1]);
  players[1].emit({ currentTime: 50, didJustFinish: true, playing: false });
  await load(players[2]);
  assert.equal(urls[2], item.version.parts[1].url);
  assert.deepEqual(players[2].seekCalls, [0]);
  assert.equal(controller.getSnapshot().status.position, 50);
  assert.equal(store.getListening(item)?.position, 50);
});

test('finishing a queue item saves completion and starts the next item at its default, not old progress', async t => {
  const { controller, players, store } = harness(); t.after(controller.dispose);
  const first = track('mn1'), next = track('mn2');
  store.saveListening({ track: next, position: 89, duration: 120, rate: 1, completed: false });
  controller.playTrack(first, undefined, [next]); await load(players[0]);
  players[0].emit({ currentTime: 120, playing: false }); // Native paused sample can arrive before EOF.
  players[0].emit({ currentTime: 120, didJustFinish: true, playing: false });
  await load(players[1]);
  assert.equal(store.getListening(first)?.completed, true);
  assert.equal(controller.getSnapshot().track?.uid, 'mn2');
  assert.equal(controller.getSnapshot().status.position, next.version.start_seconds);
  assert.equal(controller.getSnapshot().status.queueRemaining, 0);
});

test('a user pause at the end cannot advance the queue or autoplay a later seek', async t => {
  const { controller, players } = harness(); t.after(controller.dispose);
  controller.playTrack(track(), undefined, [track('mn2')]); await load(players[0]);
  players[0].state.currentTime = 120;
  controller.pause();
  players[0].emit({ currentTime: 120, didJustFinish: true, playing: false });
  assert.equal(players.length, 1);
  assert.equal(controller.getSnapshot().track?.uid, 'mn1');
  controller.seek(40); await load(players[1]);
  assert.equal(players[1].playCalls, 0);
});

test('completion persists and replay starts at scripture start while an explicit zero plays the summary', async t => {
  const { controller, players, store } = harness(); t.after(controller.dispose);
  const item = track(); controller.playTrack(item); await load(players[0]);
  players[0].emit({ currentTime: 120, didJustFinish: true, playing: false });
  assert.equal(store.getListening(item)?.position, 120);
  assert.equal(controller.getSnapshot().status.completed, true);
  controller.toggle(); await load(players[1]);
  assert.equal(controller.getSnapshot().status.position, 10);
  controller.playTrack(item, 0); await load(players[2]);
  assert.equal(controller.getSnapshot().status.position, 0);
});

test('pause/background flush saves actual native time and duplicate flush does not change history recency', async t => {
  const { controller, players, store } = harness(); t.after(controller.dispose);
  const item = track(); controller.playTrack(item); await load(players[0]);
  players[0].state.currentTime = 73; // Time advanced while JS status rendering was suspended.
  controller.flush();
  assert.equal(store.getListening(item)?.position, 73);
  const timestamp = store.getListening(item)?.updatedAt;
  await setImmediate(); controller.flush();
  assert.equal(store.getListening(item)?.updatedAt, timestamp);
  controller.setRate(1.5);
  assert.equal(store.getListening(item)?.rate, 1.5);
});

test('load errors preserve saved progress, release native resources, and can be retried explicitly', async t => {
  const { controller, players, store } = harness(); t.after(controller.dispose);
  const item = track();
  store.saveListening({ track: item, position: 80, duration: 120, rate: 1, completed: false });
  controller.playTrack(item);
  players[0].emit({ error: 'Network failure' });
  assert.equal(store.getListening(item)?.position, 80);
  assert.equal(players[0].disposed, true);
  assert.equal(controller.getSnapshot().status.loading, false);
  assert.ok(controller.getSnapshot().status.error);
  controller.retry(); await load(players[1]);
  assert.equal(controller.getSnapshot().status.position, 80);
});

for (const playing of [true, false]) {
  test(`retrying a failed progress write keeps audio ${playing ? 'playing' : 'paused'}`, async t => {
    const { controller, players, store, backend } = harness(); t.after(controller.dispose);
    const item = track();
    controller.playTrack(item); await load(players[0]);
    if (!playing) controller.pause();
    backend.failKey = trackKey(item);
    players[0].state.currentTime = 34;
    controller.flush();
    assert.ok(controller.getSnapshot().status.error);
    assert.equal(store.getListening(item)?.position, 10);
    assert.equal(controller.getSnapshot().status.playing, playing);
    const playCalls = players[0].playCalls;
    backend.failKey = null;
    controller.retry();
    assert.equal(store.getListening(item)?.position, 34);
    assert.equal(controller.getSnapshot().status.error, null);
    assert.equal(controller.getSnapshot().status.playing, playing);
    assert.equal(players[0].playCalls, playCalls);
    assert.equal(players.length, 1);
  });
}

test('a failed completion save can be retried after native resources are released without replaying audio', async t => {
  const { controller, players, store, backend } = harness(); t.after(controller.dispose);
  const item = track();
  controller.playTrack(item); await load(players[0]);
  backend.failKey = trackKey(item);
  players[0].emit({ currentTime: 120, playing: false, didJustFinish: true });
  assert.equal(players[0].disposed, true);
  assert.ok(controller.getSnapshot().status.error);
  assert.equal(store.getListening(item)?.completed, false);
  backend.failKey = null;
  controller.retry();
  assert.equal(store.getListening(item)?.position, 120);
  assert.equal(store.getListening(item)?.completed, true);
  assert.equal(controller.getSnapshot().status.error, null);
  assert.equal(controller.getSnapshot().status.playing, false);
  assert.equal(players.length, 1);
});

test('native multipart transitions retain cumulative progress without creating a JS player at each part', async t => {
  const { controller, players, queues, store } = harness(true); t.after(controller.dispose);
  const item = track();
  item.version.duration_seconds = 200;
  item.version.parts = [
    { url: item.version.url, duration_seconds: 50 },
    { url: 'https://audio.example.org/mn1-part2.mp3', duration_seconds: 70 },
    { url: 'https://audio.example.org/mn1-part3.mp3', duration_seconds: 80 },
  ];
  controller.playTrack(item, 65); await load(players[0]);
  assert.deepEqual(queues[0], item.version.parts.slice(1));
  assert.deepEqual(players[0].seekCalls, [15]);
  const sample = { currentIndex: 1, currentTime: 2, isLoaded: true, playing: true, isBuffering: false, didJustFinish: false };
  players[0].emit(playlistEvent(queues[0]!, sample));
  assert.equal(players.length, 1);
  assert.equal(controller.getSnapshot().status.position, 122);
  controller.flush();
  assert.equal(store.getListening(item)?.position, 122);
  // AVQueuePlayer can remove its final item, returning an unloaded zero clock.
  players[0].emit(playlistEvent(queues[0]!, { ...sample, currentTime: 0, isLoaded: false, playing: false, didJustFinish: true }));
  assert.equal(store.getListening(item)?.position, 200);
  assert.equal(store.getListening(item)?.completed, true);
  assert.equal(players[0].disposed, true);
  assert.equal(players.length, 1);
  controller.toggle(); await load(players[1]);
  assert.equal(controller.getSnapshot().status.position, 10);
});

test('seeking a native multipart reading in either direction rebuilds the right remaining sources', async t => {
  const { controller, players, queues, store } = harness(true); t.after(controller.dispose);
  const item = track();
  item.version.parts = [
    { url: item.version.url, duration_seconds: 50 },
    { url: 'https://audio.example.org/mn1-part2.mp3', duration_seconds: 70 },
  ];
  controller.playTrack(item, 10); await load(players[0]);
  controller.seek(85); await load(players[1]);
  assert.equal(queues[1], undefined); // Only the last MP3 remains; use a single native player.
  assert.deepEqual(players[1].seekCalls, [35]);
  assert.equal(store.getListening(item)?.position, 85);
  controller.seek(25); await load(players[2]);
  assert.equal(queues[2]?.length, 2);
  assert.deepEqual(players[2].seekCalls, [25]);
  assert.equal(controller.getSnapshot().status.position, 25);
});

test('stop prevents old player callbacks and later flushes from overwriting imported progress', async t => {
  const { controller, players, store } = harness(); t.after(controller.dispose);
  const item = track();
  controller.playTrack(item); await load(players[0]);
  players[0].emit({ currentTime: 30, playing: true });
  controller.stop();
  store.saveListening({ track: item, position: 80, duration: 120, rate: 1.5, completed: false });
  players[0].lateCallback!({ ...players[0].state, currentTime: 31 });
  controller.flush();
  assert.equal(controller.getSnapshot().track, null);
  assert.equal(store.getListening(item)?.position, 80);
  assert.equal(players[0].disposed, true);
  controller.playTrack(item); await load(players[1]);
  assert.equal(controller.getSnapshot().status.position, 80);
  assert.equal(controller.getSnapshot().status.rate, 1.5);
});

test('native resumption after an interruption reapplies the chosen listening speed', async t => {
  const { controller, players } = harness(); t.after(controller.dispose);
  controller.playTrack(track()); await load(players[0]);
  controller.setRate(1.5);
  players[0].emit({ currentTime: 30, playing: false });
  players[0].emit({ currentTime: 30, playing: true });
  assert.equal(players[0].rateCalls.at(-1), 1.5);
  assert.equal(controller.getSnapshot().status.rate, 1.5);
});

test('a native next-part load that never finishes becomes a retryable error and preserves progress', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { controller, players, store } = harness(true); t.after(controller.dispose);
  const item = track();
  item.version.parts = [
    { url: item.version.url, duration_seconds: 50 },
    { url: 'https://audio.example.org/mn1-part2.mp3', duration_seconds: 70 },
  ];
  controller.playTrack(item); await load(players[0]);
  players[0].emit({ currentTime: 49, playing: true });
  controller.flush();
  players[0].emit({ currentTime: 50, isLoaded: false, isBuffering: true });
  assert.equal(controller.getSnapshot().status.loading, true);
  t.mock.timers.tick(30_000);
  assert.ok(controller.getSnapshot().status.error);
  assert.equal(controller.getSnapshot().status.loading, false);
  assert.equal(players[0].disposed, true);
  assert.equal(store.getListening(item)?.position, 49);
});
