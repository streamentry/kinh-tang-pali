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

test('arithmetic mean drives direct publication only above 9.0', () => {
  assert.equal(expectedStatusForQuality(arithmeticMean(Object.values(scores(9.1))), []), 'published');
  assert.equal(expectedStatusForQuality(arithmeticMean(Object.values(scores(9.0))), []), 'review');
  assert.equal(expectedStatusForQuality(arithmeticMean(Object.values(scores(7.9))), []), 'draft');
});

test('blocking error forces draft even with perfect scores', () => {
  assert.equal(expectedStatusForQuality(10, ['material semantic error']), 'draft');
});

test('validator rejects published status at exactly 9.0', () => {
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
  assert.equal(errors.some((error) => error.includes('expected review')), true);
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
