import assert from 'node:assert/strict';
import test from 'node:test';
import { validateSegmentMap } from '../../scripts/lib/validation';

test('accepts a valid aligned translation segment', () => {
  const errors = validateSegmentMap(
    { 'mn118:1.1': 'Bản dịch thử nghiệm' },
    { uid: 'mn118', sourceIds: new Set(['mn118:1.1']) },
  );
  assert.deepEqual(errors, []);
});

test('rejects a deliberately broken/orphan segment ID', () => {
  const errors = validateSegmentMap(
    { 'mn118:999.999': 'Không tồn tại' },
    { uid: 'mn118', sourceIds: new Set(['mn118:1.1']) },
  );
  assert.equal(errors.some((error) => error.includes('orphan segment mn118:999.999')), true);
});

test('review completeness rejects missing segments', () => {
  const errors = validateSegmentMap(
    { 'mn118:1.1': 'Có' },
    { uid: 'mn118', sourceIds: new Set(['mn118:1.1', 'mn118:1.2']), requireComplete: true },
  );
  assert.equal(errors.some((error) => error.includes('missing translation for mn118:1.2')), true);
});
