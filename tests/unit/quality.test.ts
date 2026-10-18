import assert from 'node:assert/strict';
import test from 'node:test';
import type { EditorialMeta, TranslationQualityScores } from '../../src/lib/canon/types';
import {
  arithmeticMean,
  expectedStatusForQuality,
  validateQualityAssessment,
} from '../../scripts/lib/quality';

function scores(value: number): TranslationQualityScores {
  return {
    source_provenance: value,
    semantic_fidelity: value,
    grammar_logic: value,
    segment_alignment: value,
    terminology: value,
    triangulation: value,
    vietnamese_clarity: value,
    han_viet_balance: value,
    ambiguity_integrity: value,
    technical_integrity: value,
  };
}

test('arithmetic mean drives direct publication from 9.0 upward', () => {
  assert.equal(expectedStatusForQuality(arithmeticMean(Object.values(scores(9.1))), []), 'published');
  assert.equal(expectedStatusForQuality(arithmeticMean(Object.values(scores(9.0))), []), 'published');
  assert.equal(expectedStatusForQuality(arithmeticMean(Object.values(scores(8.9))), []), 'review');
  assert.equal(expectedStatusForQuality(arithmeticMean(Object.values(scores(7.9))), []), 'draft');
});

test('a mean of exactly 9.0 is published whether the float sum overshoots or undershoots', () => {
  // Real scorecards (pe2, bv4) whose ten scores average exactly 9.0 but sum to 9.000000000000002.
  const pe2 = [9.3, 8.9, 8.7, 9.5, 9, 8.6, 8.4, 9, 9.2, 9.4];
  const bv4 = [9.4, 8.8, 8.6, 10, 8.6, 8.7, 8.6, 9, 8.7, 9.6];
  for (const values of [pe2, bv4]) {
    assert.ok(arithmeticMean(values) > 9.0, 'fixture must reproduce the float overshoot');
    assert.equal(expectedStatusForQuality(arithmeticMean(values), []), 'published');
  }
  assert.equal(expectedStatusForQuality(9.000000000000002, []), 'published');
  assert.equal(expectedStatusForQuality(8.999999999999998, []), 'published');
  assert.equal(expectedStatusForQuality(7.999999999999998, []), 'review');
  assert.equal(expectedStatusForQuality(8.99, []), 'review');
});

test('an editor publish override lifts only review to published', () => {
  assert.equal(expectedStatusForQuality(8.84, [], [], true), 'published');
  assert.equal(expectedStatusForQuality(8.84, [], [], false), 'review');
  assert.equal(expectedStatusForQuality(7.9, [], [], true), 'draft');
  assert.equal(expectedStatusForQuality(8.84, ['material semantic error'], [], true), 'draft');
});

test('blocking error forces draft even with perfect scores', () => {
  assert.equal(expectedStatusForQuality(10, ['material semantic error']), 'draft');
});

test('validator accepts published status at exactly 9.0', () => {
  const meta: EditorialMeta = {
    uid: 'mn1',
    status: 'published',
    quality: {
      scores: scores(9),
      final_score: 9,
      blocking_errors: [],
      assessed_at: '2026-09-10',
      assessed_by: ['test'],
    },
  };
  const errors = validateQualityAssessment(meta);
  assert.equal(errors.some((error) => error.includes('expected')), false);
});

test('validator accepts a blocker-free score above 9.0 as published', () => {
  const meta: EditorialMeta = {
    uid: 'mn1',
    status: 'published',
    quality: {
      scores: scores(9.2),
      final_score: 9.2,
      blocking_errors: [],
      assessed_at: '2026-09-10',
      assessed_by: ['test'],
    },
  };
  assert.deepEqual(validateQualityAssessment(meta), []);
});

test('review or published status is rejected without a quality scorecard', () => {
  const reviewErrors = validateQualityAssessment({ uid: 'mn1', status: 'review' });
  const publishedErrors = validateQualityAssessment({ uid: 'mn1', status: 'published' });
  assert.equal(reviewErrors.some((error) => error.includes('requires a complete quality scorecard')), true);
  assert.equal(publishedErrors.some((error) => error.includes('requires a complete quality scorecard')), true);
});
