import assert from 'node:assert/strict';
import test from 'node:test';
import { NavigationRequests } from '../../apps/mobile/src/navigation-requests';
import { SeekInteraction } from '../../apps/mobile/src/seek-interaction';

function deferred() {
  let resolve!: (captured: boolean) => void;
  const promise = new Promise<boolean>(done => { resolve = done; });
  return { promise, resolve };
}

test('TalkBack and keyboard value changes seek without requiring touch start/end', () => {
  const seeking = new SeekInteraction();
  seeking.configure('mn1:original', true);
  assert.deepEqual(seeking.change('mn1:original', 45), { type: 'seek', position: 45 });
  assert.deepEqual(seeking.change('mn1:original', 60), { type: 'seek', position: 60 });
  assert.deepEqual(seeking.complete('mn1:original', 60), { type: 'ignore' });
});

test('touch dragging previews changes and commits one seek when released', () => {
  const seeking = new SeekInteraction();
  seeking.configure('mn1:original', true);
  assert.deepEqual(seeking.start('mn1:original', 25), { type: 'preview', position: 25 });
  assert.deepEqual(seeking.change('mn1:original', 80), { type: 'preview', position: 80 });
  assert.deepEqual(seeking.complete('mn1:original', 90), { type: 'seek', position: 90 });
  assert.deepEqual(seeking.complete('mn1:original', 90), { type: 'ignore' });
});

test('callbacks from the old native slider cannot seek or finish a drag on its replacement', () => {
  const seeking = new SeekInteraction();
  seeking.configure('mn1:original', true);
  seeking.start('mn1:original', 25);
  seeking.configure('mn2:original', true);
  assert.deepEqual(seeking.change('mn1:original', 90), { type: 'ignore' });
  assert.deepEqual(seeking.complete('mn1:original', 90), { type: 'ignore' });
  seeking.start('mn2:original', 5);
  assert.deepEqual(seeking.complete('mn1:original', 90), { type: 'ignore' });
  assert.deepEqual(seeking.change('mn2:original', 10), { type: 'preview', position: 10 });
  assert.deepEqual(seeking.complete('mn2:original', 15), { type: 'seek', position: 15 });
});

test('closing the player cancels its drag, and hidden or invalid changes never seek', () => {
  const seeking = new SeekInteraction();
  seeking.configure('mn1:original', true);
  seeking.start('mn1:original', 25);
  seeking.configure('mn1:original', false);
  assert.deepEqual(seeking.change('mn1:original', 90), { type: 'ignore' });
  assert.deepEqual(seeking.complete('mn1:original', 90), { type: 'ignore' });
  seeking.configure('mn1:original', true);
  assert.deepEqual(seeking.complete('mn1:original', 90), { type: 'ignore' });
  assert.deepEqual(seeking.change('mn1:original', NaN), { type: 'ignore' });
  assert.deepEqual(seeking.change('mn1:original', 30), { type: 'seek', position: 30 });
});

test('native Back waits for reading capture before changing the document', async () => {
  const navigation = new NavigationRequests();
  const capture = deferred();
  const actions: string[] = [];
  const back = navigation.afterCapture(() => capture.promise, () => actions.push('back'));
  assert.deepEqual(actions, []);
  capture.resolve(true);
  assert.equal(await back, true);
  assert.deepEqual(actions, ['back']);
});

test('a newer tab, internal link, import or unmount invalidates a pending Back', async () => {
  for (const action of ['tab', 'internal link', 'import', 'unmount']) {
    const navigation = new NavigationRequests();
    const capture = deferred();
    const actions: string[] = [];
    const back = navigation.afterCapture(() => capture.promise, () => actions.push('back'));
    navigation.invalidate();
    capture.resolve(true);
    assert.equal(await back, false, action);
    assert.deepEqual(actions, [], action);
  }
});

test('rapid navigation requests commit only the latest intent even if captures finish out of order', async () => {
  const navigation = new NavigationRequests();
  const earlier = deferred(); const later = deferred();
  const actions: string[] = [];
  const first = navigation.afterCapture(() => earlier.promise, () => actions.push('old back'));
  const second = navigation.afterCapture(() => later.promise, () => actions.push('latest page'));
  later.resolve(true);
  assert.equal(await second, true);
  earlier.resolve(true);
  assert.equal(await first, false);
  assert.deepEqual(actions, ['latest page']);
});

test('missing or failed capture keeps navigation available using already saved progress', async () => {
  const navigation = new NavigationRequests();
  const actions: string[] = [];
  assert.equal(await navigation.afterCapture(() => undefined, () => actions.push('no reader')), true);
  assert.equal(await navigation.afterCapture(async () => false, () => actions.push('timeout')), true);
  assert.equal(await navigation.afterCapture(async () => { throw new Error('WebView terminated'); }, () => actions.push('failed bridge')), true);
  assert.deepEqual(actions, ['no reader', 'timeout', 'failed bridge']);
});
