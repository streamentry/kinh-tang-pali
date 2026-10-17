import test from 'node:test';
import assert from 'node:assert/strict';
import { isScripturePhase } from '../../src/lib/audio/playback';

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
