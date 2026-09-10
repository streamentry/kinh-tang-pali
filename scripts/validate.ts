import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import type { CanonCatalog, CollectionCode, EditorialMeta } from '../src/lib/canon/types';
import { sourcePathFor } from '../src/lib/canon/load';
import { validateSegmentMap } from './lib/validation';

const ROOT = process.cwd();
const errors: string[] = [];
const warnings: string[] = [];
const collections: CollectionCode[] = ['dn', 'mn', 'sn', 'an', 'kn'];
const QUALITY_SCORE_KEYS = [
  'fidelityPali',
  'logicGrammar',
  'sourceTriangulation',
  'provenanceSegments',
  'buddhistTerminology',
  'vietnameseClarity',
  'sinoVietnameseBalance',
  'structuralConsistency',
  'ambiguityIntegrity',
  'technicalIntegrity',
] as const;

function readJson<T>(file: string): T {
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as T;
  } catch (error) {
    throw new Error(`${file}: invalid JSON: ${error}`);
  }
}

function checkNfc(file: string) {
  const text = readFileSync(file, 'utf8');
  if (text !== text.normalize('NFC')) errors.push(`${file}: file is not NFC-normalized`);
}

function validateQualityGate(meta: EditorialMeta, metaFile: string) {
  const quality = meta.quality;
  if (!quality) {
    if (meta.status === 'review' || meta.status === 'published') {
      errors.push(`${metaFile}: ${meta.status} status requires quality gate metadata`);
    }
    return;
  }

  if (!quality.scores || typeof quality.scores !== 'object') {
    errors.push(`${metaFile}: quality.scores must contain all 10 quality criteria`);
    return;
  }

  const scoreRecord = quality.scores as unknown as Record<string, unknown>;
  const values: number[] = [];
  for (const key of QUALITY_SCORE_KEYS) {
    const value = scoreRecord[key];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 10) {
      errors.push(`${metaFile}: quality.scores.${key} must be a number from 0 to 10`);
      continue;
    }
    values.push(value);
  }

  const extraKeys = Object.keys(scoreRecord).filter((key) => !QUALITY_SCORE_KEYS.includes(key as typeof QUALITY_SCORE_KEYS[number]));
  if (extraKeys.length > 0) errors.push(`${metaFile}: unknown quality score key(s): ${extraKeys.join(', ')}`);
  if (values.length !== QUALITY_SCORE_KEYS.length) return;

  const computedRaw = values.reduce((sum, value) => sum + value, 0) / QUALITY_SCORE_KEYS.length;
  if (typeof quality.rawAverage !== 'number' || Math.abs(quality.rawAverage - computedRaw) > 0.005) {
    errors.push(`${metaFile}: quality.rawAverage must equal arithmetic mean ${computedRaw.toFixed(2)}`);
  }

  if (!Array.isArray(quality.blockingErrors) || quality.blockingErrors.some((item) => typeof item !== 'string')) {
    errors.push(`${metaFile}: quality.blockingErrors must be an array of strings`);
    return;
  }

  const computedFinal = quality.blockingErrors.length > 0 ? Math.min(computedRaw, 9.0) : computedRaw;
  if (typeof quality.finalScore !== 'number' || Math.abs(quality.finalScore - computedFinal) > 0.005) {
    errors.push(`${metaFile}: quality.finalScore must equal ${computedFinal.toFixed(2)} after blocker cap`);
  }

  const expectedStatus = computedFinal > 9.0
    ? 'published'
    : computedFinal >= 8.0
      ? 'review'
      : 'draft';
  if (meta.status !== expectedStatus) {
    errors.push(`${metaFile}: status ${meta.status} conflicts with quality gate; score ${computedFinal.toFixed(2)} requires ${expectedStatus}`);
  }

  if (!quality.scoredBy?.trim()) warnings.push(`${meta.uid}: quality gate has no scoredBy attribution`);
  if (!quality.scoredAt?.trim()) warnings.push(`${meta.uid}: quality gate has no scoredAt date`);
}

const lock = readJson<{ commit: string }>(path.join(ROOT, 'source/suttacentral.lock.json'));
if (!/^[a-f0-9]{40}$/.test(lock.commit)) errors.push('source/suttacentral.lock.json: commit must be an exact 40-char SHA');

const catalogs = new Map<CollectionCode, CanonCatalog>();
for (const collection of collections) {
  const file = path.join(ROOT, 'content/catalog/sutta', `${collection}.json`);
  checkNfc(file);
  const catalog = readJson<CanonCatalog>(file);
  catalogs.set(collection, catalog);
  if (catalog.collection !== collection) errors.push(`${file}: collection field mismatch`);
  const uids = new Set<string>();
  const orders = new Set<number>();
  for (const item of catalog.texts) {
    if (uids.has(item.uid)) errors.push(`${file}: duplicate UID ${item.uid}`);
    if (orders.has(item.order)) errors.push(`${file}: duplicate order ${item.order}`);
    uids.add(item.uid);
    orders.add(item.order);
  }
}

const mn = catalogs.get('mn')!;
if (mn.texts.length !== 152) errors.push(`MN catalog must contain 152 texts, got ${mn.texts.length}`);
for (let i = 1; i <= 152; i += 1) {
  const item = mn.texts[i - 1];
  if (!item || item.uid !== `mn${i}` || item.order !== i) errors.push(`MN catalog broken at canonical order ${i}`);
}

for (const collection of collections) {
  const catalog = catalogs.get(collection)!;
  const metaDir = path.join(ROOT, 'content/meta/sutta', collection);
  if (!existsSync(metaDir)) continue;

  for (const name of readdirSync(metaDir)) {
    if (!name.endsWith('.yaml')) continue;
    const uid = name.replace(/\.yaml$/, '');
    const metaFile = path.join(metaDir, name);
    checkNfc(metaFile);
    let meta: EditorialMeta;
    try {
      meta = YAML.parse(readFileSync(metaFile, 'utf8')) as EditorialMeta;
    } catch (error) {
      errors.push(`${metaFile}: invalid YAML: ${error}`);
      continue;
    }
    if (meta.uid !== uid) errors.push(`${metaFile}: uid ${meta.uid} must match filename ${uid}`);
    const item = catalog.texts.find((entry) => entry.uid === uid);
    if (!item) {
      errors.push(`${metaFile}: UID ${uid} not present in pinned project catalog`);
      continue;
    }
    if (!['draft', 'review', 'published'].includes(meta.status)) errors.push(`${metaFile}: invalid status ${meta.status}`);

    const translationFile = path.join(ROOT, 'content/translation/vi/project/sutta', collection, `${uid}_translation-vi-project.json`);
    const commentFile = path.join(ROOT, 'content/comment/vi/project/sutta', collection, `${uid}_comment-vi-project.json`);
    const translation = existsSync(translationFile) ? readJson<Record<string, unknown>>(translationFile) : {};
    const comments = existsSync(commentFile) ? readJson<Record<string, unknown>>(commentFile) : {};
    if (existsSync(translationFile)) checkNfc(translationFile);
    if (existsSync(commentFile)) checkNfc(commentFile);

    const sourcePath = sourcePathFor(collection, uid, item.sourcePath);
    if (!sourcePath) {
      warnings.push(`${uid}: no deterministic source path yet; catalog entry must supply sourcePath before translation starts`);
      continue;
    }
    const sourceFile = path.join(ROOT, '.cache/upstream/suttacentral', sourcePath);
    if (!existsSync(sourceFile)) {
      errors.push(`${uid}: pinned Pāli source missing; run npm run source:sync:used`);
      continue;
    }
    const source = readJson<Record<string, string>>(sourceFile);
    const sourceIds = new Set(Object.keys(source));
    errors.push(...validateSegmentMap(translation, {
      uid,
      sourceIds,
      requireComplete: meta.status === 'review' || meta.status === 'published',
    }));
    errors.push(...validateSegmentMap(comments, { uid, sourceIds, requireComplete: false }));

    validateQualityGate(meta, metaFile);

    if ((meta.status === 'review' || meta.status === 'published') && (!meta.translators || meta.translators.length === 0)) {
      errors.push(`${uid}: ${meta.status} text needs at least one translator`);
    }
    if (meta.reviewers?.length && !meta.reviewedAt) {
      warnings.push(`${uid}: reviewers are recorded but reviewedAt is missing`);
    }
  }
}

const glossaryFile = path.join(ROOT, 'content/glossary/pali-vi.yaml');
try {
  YAML.parse(readFileSync(glossaryFile, 'utf8'));
  checkNfc(glossaryFile);
} catch (error) {
  errors.push(`${glossaryFile}: invalid YAML: ${error}`);
}

for (const warning of warnings) console.warn(`WARN: ${warning}`);
if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  console.error(`Validation failed with ${errors.length} error(s).`);
  process.exit(1);
}
console.log(`Validation passed. ${warnings.length} warning(s).`);
