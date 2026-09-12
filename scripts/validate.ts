import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import type { CanonCatalog, CollectionCode, EditorialMeta } from '../src/lib/canon/types';
import { segmentMapForUid, sourcePathFor } from '../src/lib/canon/load';
import { validateSegmentMap } from './lib/validation';
import { validateQualityAssessment } from './lib/quality';

const ROOT = process.cwd();
const errors: string[] = [];
const warnings: string[] = [];
const collections: CollectionCode[] = ['dn', 'mn', 'sn', 'an', 'kn'];

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
    errors.push(...validateQualityAssessment(meta));

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
    const source = segmentMapForUid(readJson<Record<string, string>>(sourceFile), uid);
    const sourceIds = new Set(Object.keys(source));
    if (sourceIds.size === 0) {
      errors.push(`${uid}: pinned Pāli source contains no segments for this UID`);
      continue;
    }
    errors.push(...validateSegmentMap(translation, {
      uid,
      sourceIds,
      requireComplete: meta.status === 'review' || meta.status === 'published',
      requireLatinScript: true,
    }));
    errors.push(...validateSegmentMap(comments, { uid, sourceIds, requireComplete: false }));

    if (meta.status === 'review' && (!meta.translators || meta.translators.length === 0)) {
      warnings.push(`${uid}: review status without translator metadata`);
    }
    if (meta.status === 'published') {
      if (!meta.translators || meta.translators.length === 0) errors.push(`${uid}: published text needs at least one translator`);
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
