import { blockerIsCovered, publishOverrideFor, waiverById, waiverConditionHolds } from '../../src/lib/canon/waivers';
import {
  TRANSLATION_QUALITY_KEYS,
  type CollectionCode,
  type EditorialMeta,
  type EditorialStatus,
  type TranslationQualityAssessment,
} from '../../src/lib/canon/types';

const EPSILON = 0.005;
/**
 * The gate compares the raw mean, but a float sum of decimal scores carries representation error:
 * ten scores averaging exactly 9.0 can sum to 8.999999999999998 and fall short of `>= 9.0`. Scores move in
 * steps of at least 0.001, so comparing at 1e-6 removes only that noise and never rounds a real mean.
 */
const GATE_PRECISION = 1e6;

export function arithmeticMean(scores: number[]): number {
  return scores.reduce((sum, value) => sum + value, 0) / scores.length;
}

/** Blockers that still force `draft` once the editor's waiver has been taken into account. */
export function effectiveBlockers(blockingErrors: string[], waivedBlockers: string[] = []): string[] {
  const waived = new Set(waivedBlockers);
  return blockingErrors.filter((blocker) => !waived.has(blocker));
}

export function expectedStatusForQuality(
  finalScore: number,
  blockingErrors: string[],
  waivedBlockers: string[] = [],
  editorPublishes = false,
): EditorialStatus {
  if (effectiveBlockers(blockingErrors, waivedBlockers).length > 0) return 'draft';
  const score = Math.round(finalScore * GATE_PRECISION) / GATE_PRECISION;
  if (score >= 9.0) return 'published';
  // A publish override (source/editorial-waivers.yaml) lifts only review to published.
  if (score >= 8.0) return editorPublishes ? 'published' : 'review';
  return 'draft';
}

export function validateQualityAssessment(meta: EditorialMeta, collection?: CollectionCode): string[] {
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
  const waiver = quality.waiver;
  const waivedBlockers: string[] = [];
  if (waiver) {
    const rule = waiverById(waiver.id);
    if (!rule) {
      errors.push(`${meta.uid}: quality.waiver.id ${waiver.id} is not declared in source/editorial-waivers.yaml`);
    } else if (!Array.isArray(waiver.blockers) || waiver.blockers.length === 0) {
      errors.push(`${meta.uid}: quality.waiver.blockers must list the blockers it covers`);
    } else {
      for (const blocker of waiver.blockers) {
        if (!blockers.includes(blocker)) errors.push(`${meta.uid}: quality.waiver covers a blocker that is not in blocking_errors`);
        else if (!blockerIsCovered(rule, blocker)) errors.push(`${meta.uid}: waiver ${waiver.id} does not cover blocker "${blocker.slice(0, 60)}…"`);
        else waivedBlockers.push(blocker);
      }
      if (collection && !waiverConditionHolds(rule, collection, meta.uid)) {
        errors.push(`${meta.uid}: waiver ${waiver.id} no longer holds: ${rule.condition.layer} is not absent upstream at the pinned commit`);
      }
    }
  }
  const expectedStatus = expectedStatusForQuality(mean, blockers, waivedBlockers, Boolean(publishOverrideFor(collection, meta.uid)));
  if (meta.status !== expectedStatus) {
    errors.push(
      `${meta.uid}: status ${meta.status} does not match quality gate; expected ${expectedStatus} for mean ${mean.toFixed(2)} with ${effectiveBlockers(blockers, waivedBlockers).length} blocker(s)`,
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
