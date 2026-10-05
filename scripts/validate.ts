import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import type { CanonCatalog, CollectionCode, EditorialMeta } from '../src/lib/canon/types';
import { englishPathFor, segmentMapForUid, sourcePathFor, upstreamFile } from '../src/lib/canon/load';
import { MIN_ENGLISH_COVERAGE, englishCoverageFor, loadRecordedGaps } from '../src/lib/canon/reference';
import { assertStoreIntegrity, contentMetaPathForLayer, fillableSegments, resolveLayer, storeLayer } from '../src/lib/canon/layers';
import { sharedCredit } from '../src/lib/canon/tooling';
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

// The store registry is the contract every layer resolution goes through, so its
// coherence is checked before anything is read through it.
errors.push(...assertStoreIntegrity());

const recordedGaps = loadRecordedGaps();

/**
 * Validate our own English fill layer.
 *
 * This layer is a translation we produce, not an upstream source, so the rules are
 * about honesty rather than completeness: it may only fill passages the pinned
 * edition left blank, it may never shadow a passage that edition translated, and it
 * carries its own editorial state and scorecard like any other project deliverable.
 */
function validateEnglishFill(collection: CollectionCode, uid: string, sourceIds: Set<string>): void {
  const layer = storeLayer('english-project');
  const file = path.join(ROOT, 'content/translation/en/project/sutta', collection, `${uid}_translation-en-project.json`);
  if (!existsSync(file)) return;

  const metaFile = contentMetaPathForLayer(layer, collection, uid);
  if (!metaFile || !existsSync(metaFile)) {
    errors.push(`${uid}: English fill exists without metadata at ${path.relative(ROOT, file)}; it needs its own status and scorecard`);
    return;
  }
  let meta: EditorialMeta;
  try {
    meta = YAML.parse(readFileSync(metaFile, 'utf8')) as EditorialMeta;
  } catch (error) {
    errors.push(`${path.relative(ROOT, metaFile)}: invalid YAML: ${error}`);
    return;
  }
  if (meta.uid !== uid) errors.push(`${path.relative(ROOT, metaFile)}: uid ${meta.uid} must match filename ${uid}`);
  if (!['draft', 'review', 'published'].includes(meta.status)) {
    errors.push(`${path.relative(ROOT, metaFile)}: invalid status ${meta.status}`);
  }
  errors.push(...validateQualityAssessment(meta).map((e) => `${path.relative(ROOT, metaFile)}: ${e}`));
  if (meta.status === 'review' || meta.status === 'published') {
    if (!meta.translators || meta.translators.length === 0) {
      errors.push(`${path.relative(ROOT, metaFile)}: a reviewable English fill needs a translator`);
    }
  }

  checkNfc(file);
  const fill = readJson<Record<string, unknown>>(file);
  errors.push(...validateSegmentMap(fill, {
    uid,
    sourceIds,
    requireComplete: false,
    requireLatinScript: true,
  }));

  const sujato = resolveLayer('english-sujato', collection, uid);
  const fillable = new Set(fillableSegments(collection, uid));
  for (const [id, value] of Object.entries(fill)) {
    if (typeof value === 'string' && value.trim() === '') {
      errors.push(`${uid}: English fill ${id} is empty; a blank is a gap still to be filled, not a value`);
      continue;
    }
    if (!fillable.has(id)) {
      const reason = sujato?.present && String(sujato.segments[id] ?? '').trim() !== ''
        ? 'the pinned Sujato edition already translates it'
        : 'it is not a segment of this text in the Pāli root';
      errors.push(`${uid}: English fill ${id} must not be written here because ${reason}; the fill layer only covers passages the pinned edition left blank`);
    }
  }
}


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

    // Our own English fill is validated independently of the Vietnamese deliverable:
    // it is a translation in its own right, with its own state and scorecard.
    validateEnglishFill(collection, uid, sourceIds);

    // An English fill authored by whoever wrote the Vietnamese is not an independent
    // second reading. The coverage floor is still satisfied, but the Vietnamese text
    // must not claim English triangulation on that basis.
    const fillMetaFile = contentMetaPathForLayer(storeLayer('english-project'), collection, uid);
    if (fillMetaFile && existsSync(fillMetaFile)) {
      const fillMeta = YAML.parse(readFileSync(fillMetaFile, 'utf8')) as EditorialMeta;
      const fillStatus = resolveLayer('english-project', collection, uid)?.status;
      if (fillStatus === 'published') {
        const fillAuthors = new Set([
          ...(fillMeta.quality?.assessed_by ?? []),
          ...(fillMeta.translators ?? []),
        ]);
        const viAuthors = new Set([
          ...(meta.quality?.assessed_by ?? []),
          ...(meta.translators ?? []),
          ...(meta.reviewers ?? []),
        ]);
        // Compared as tools, not as strings: the same tool is credited under several
        // spellings (`Muse Spark`, `Space Bunny`, `OpenCode Space Bunny Free (agent)`),
        // and an exact comparison reported a fill written by the same tool as an
        // independent reading.
        const shared = sharedCredit([...viAuthors], [...fillAuthors]);
        if (shared.length > 0) {
          warnings.push(
            `${uid}: English coverage here rests on our own fill, assessed by ${shared.join(', ')} — `
            + 'the same author as the Vietnamese. That fill is not an independent English reading, '
            + 'so the Vietnamese scorecard must not claim English triangulation for this text.',
          );
        }
      }
    }

    // Triangulation against a pinned English SuttaCentral edition is part of the
    // definition of done (skill/translation.md 2, 7/1; AGENTS.md criterion 6), so a
    // text cannot reach review or published without it. Warning-only below that,
    // where the text may still be a fresh draft.
    const englishPath = englishPathFor(collection, uid, item.sourcePath);
    if (!englishPath) {
      warnings.push(`${uid}: no deterministic English reference path; catalog entry must supply sourcePath before review`);
    } else {
      const englishFile = upstreamFile(englishPath);
      const needsEnglish = meta.status === 'review' || meta.status === 'published';
      if (!existsSync(englishFile)) {
        const message = `${uid}: pinned English reference missing (${englishPath}); run npm run source:sync:used`;
        if (needsEnglish) errors.push(message);
        else warnings.push(message);
      } else {
        const englishIds = new Set(Object.keys(segmentMapForUid(readJson<Record<string, string>>(englishFile), uid)));
        const unmatched = [...sourceIds].filter((id) => !englishIds.has(id));
        if (unmatched.length > 0) {
          const message = `${uid}: pinned English reference lacks ${unmatched.length} of ${sourceIds.size} segment(s)`
            + ` (${unmatched.slice(0, 3).join(' ')}${unmatched.length > 3 ? ' …' : ''}); the reference layer is incomplete`;
          if (needsEnglish) errors.push(message);
          else warnings.push(message);
        }

        // A present, fully aligned file can still carry no English words where the
        // Pāli has prose: Sujato leaves blockquotes and `…pe…` elisions empty. That
        // is not a sync failure, but it is a real loss of the reference layer, so a
        // text may only sit below the coverage floor if the loss is on record.
        const coverage = englishCoverageFor(collection, uid);
        if (coverage?.resolved && coverage.substantiveSegments > 0 && coverage.ratio < MIN_ENGLISH_COVERAGE) {
          const measured = `${(coverage.ratio * 100).toFixed(0)}% of ${coverage.substantiveSegments} substantive Pāli segment(s)`
            + ` (${coverage.substantiveWithoutEnglish} without English words, worst ${coverage.worstMissingSegment})`;
          const recorded = recordedGaps.get(`${collection}/${uid}`);
          if (!recorded) {
            const message = `${uid}: English reference covers only ${measured}, below the `
              + `${(MIN_ENGLISH_COVERAGE * 100).toFixed(0)}% floor, and the gap is not recorded in `
              + 'content/meta/reference-gaps.yaml; run npm run reference:gaps to record it';
            if (needsEnglish) errors.push(message);
            else warnings.push(message);
          } else {
            // Recorded means reviewed and accepted, not repaired: the passage still
            // has to be translated from the Pāli alone, so it stays visible.
            warnings.push(
              `${uid}: English reference covers only ${measured}; recorded as an acknowledged `
              + `reference gap in content/meta/reference-gaps.yaml`,
            );
          }
        }
      }
    }

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
