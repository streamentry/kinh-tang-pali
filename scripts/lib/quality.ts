import {
  TRANSLATION_QUALITY_KEYS,
  type EditorialMeta,
  type EditorialStatus,
  type TranslationQualityAssessment,
} from '../../src/lib/canon/types';

const EPSILON = 0.005;

export function arithmeticMean(scores: number[]): number {
  return scores.reduce((sum, value) => sum + value, 0) / scores.length;
}

export function expectedStatusForQuality(
  finalScore: number,
  blockingErrors: string[],
): EditorialStatus {
  if (blockingErrors.length > 0) return 'draft';
  if (finalScore > 9.0) return 'published';
  if (finalScore >= 8.0) return 'review';
  return 'draft';
}

export function validateQualityAssessment(meta: EditorialMeta): string[] {
  const errors: string[] = [];
  const quality = meta.quality;

  if (!quality) {
    if (meta.status !== 'draft') {
      errors.push(`${meta.uid}: ${meta.status} status requires a complete quality scorecard`);
    }
    return errors;
  }

  const rawScores = quality.scores as Record<string, unknown> | undefined;
  if (!rawScores || typeof rawScores !== 'object') {
    errors.push(`${meta.uid}: quality.scores must contain exactly 10 criteria`);
    return errors;
  }

  const expectedKeys = new Set<string>(TRANSLATION_QUALITY_KEYS);
  const actualKeys = Object.keys(rawScores);

  for (const key of TRANSLATION_QUALITY_KEYS) {
    if (!(key in rawScores)) errors.push(`${meta.uid}: quality.scores missing ${key}`);
  }
  for (const key of actualKeys) {
    if (!expectedKeys.has(key)) errors.push(`${meta.uid}: quality.scores has unknown criterion ${key}`);
  }

  const numericScores: number[] = [];
  for (const key of TRANSLATION_QUALITY_KEYS) {
    const value = rawScores[key];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 10) {
      errors.push(`${meta.uid}: quality.scores.${key} must be a finite number from 0 to 10`);
      continue;
    }
    numericScores.push(value);
  }

  if (!Array.isArray(quality.blocking_errors)) {
    errors.push(`${meta.uid}: quality.blocking_errors must be an array`);
  } else {
    for (const blocker of quality.blocking_errors) {
      if (typeof blocker !== 'string' || blocker.trim().length === 0) {
        errors.push(`${meta.uid}: blocking errors must be non-empty strings`);
      }
    }
  }

  if (numericScores.length !== TRANSLATION_QUALITY_KEYS.length) return errors;

  const mean = arithmeticMean(numericScores);
  if (typeof quality.final_score !== 'number' || !Number.isFinite(quality.final_score)) {
    errors.push(`${meta.uid}: quality.final_score must be a finite number`);
  } else if (Math.abs(quality.final_score - mean) > EPSILON) {
    errors.push(
      `${meta.uid}: quality.final_score ${quality.final_score} does not match arithmetic mean ${mean.toFixed(4)}`,
    );
  }

  const blockers = Array.isArray(quality.blocking_errors)
    ? quality.blocking_errors.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
  const expectedStatus = expectedStatusForQuality(mean, blockers);
  if (meta.status !== expectedStatus) {
    errors.push(
      `${meta.uid}: status ${meta.status} does not match quality gate; expected ${expectedStatus} for mean ${mean.toFixed(2)} with ${blockers.length} blocker(s)`,
    );
  }

  if (meta.status !== 'draft') {
    if (!quality.assessed_at) errors.push(`${meta.uid}: ${meta.status} status requires quality.assessed_at`);
    if (!quality.assessed_by || quality.assessed_by.length === 0) {
      errors.push(`${meta.uid}: ${meta.status} status requires quality.assessed_by`);
    }
  }

  return errors;
}

export function hasBlockingErrors(quality?: TranslationQualityAssessment): boolean {
  return Boolean(quality?.blocking_errors?.some((item) => item.trim().length > 0));
}
