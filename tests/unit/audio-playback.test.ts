import test from 'node:test';
import assert from 'node:assert/strict';
import { isScripturePhase, playFailure } from '../../src/lib/audio/playback';

test('a seek rounded just below the scripture marker is classified as scripture', () => {
  assert.equal(isScripturePhase(138.749999, 138.74999999999997), true);
});

test('the scripture phase does not begin noticeably before its marker', () => {
  assert.equal(isScripturePhase(138.739, 138.75), false);
  assert.equal(isScripturePhase(138.75, 138.75), true);
});

test('invalid media times remain in the summary phase', () => {
  assert.equal(isScripturePhase(Number.NaN, 138.75), false);
  assert.equal(isScripturePhase(138.75, Number.NaN), false);
});

test('a refused play() is classified by its cause, so the listener sees the right message', () => {
  // The browser's autoplay policy: the media is fine, the listener only needs to press Play.
  assert.equal(playFailure(new DOMException('play() can only be initiated by a user gesture', 'NotAllowedError')), 'blocked');
  // A newer action (pause, another track) interrupted this request: nothing went wrong.
  assert.equal(playFailure(new DOMException('The play() request was interrupted by a call to pause()', 'AbortError')), 'interrupted');
  // The media itself could not be loaded or decoded (R2 404, network, unsupported).
  assert.equal(playFailure(new DOMException('Failed to load because no supported source was found.', 'NotSupportedError')), 'unavailable');
  assert.equal(playFailure(new Error('network')), 'unavailable');
  assert.equal(playFailure(undefined), 'unavailable');
});
