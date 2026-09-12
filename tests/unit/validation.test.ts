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

test('publication completeness rejects missing segments', () => {
  const errors = validateSegmentMap(
    { 'mn118:1.1': 'Có' },
    { uid: 'mn118', sourceIds: new Set(['mn118:1.1', 'mn118:1.2']), requireComplete: true },
  );
  assert.equal(errors.some((error) => error.includes('missing translation for mn118:1.2')), true);
});


test('Vietnamese scripture rejects accidental foreign scripts and encoding damage', () => {
  for (const value of ['Không nên 恐惧.', 'câu sai Привет', 'câu sai ก', 'lỗi �']) {
    const errors = validateSegmentMap(
      { 'mn66:21.1': value },
      { uid: 'mn66', sourceIds: new Set(['mn66:21.1']), requireLatinScript: true },
    );
    assert.ok(errors.length > 0, value);
  }
});

test('Vietnamese and Pāli Latin letters pass the scripture writing-system guard', () => {
  const errors = validateSegmentMap(
    { 'mn76:0.2': 'Tôn giả Ānanda: saññā, nigaṇṭhigabbha, Niết-bàn…' },
    { uid: 'mn76', sourceIds: new Set(['mn76:0.2']), requireLatinScript: true },
  );
  assert.deepEqual(errors, []);
});

test('editorial comments may quote non-Latin scripts without applying the scripture guard', () => {
  const errors = validateSegmentMap(
    { 'mn66:21.1': 'Đã loại lỗi 恐惧 khỏi bản dịch.' },
    { uid: 'mn66', sourceIds: new Set(['mn66:21.1']) },
  );
  assert.deepEqual(errors, []);
});
