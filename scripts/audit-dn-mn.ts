import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { segmentMapForUid, sourcePathFor } from '../src/lib/canon/load';
import type { CanonCatalog, EditorialMeta } from '../src/lib/canon/types';
import { validateSegmentMap } from './lib/validation';
import { validateQualityAssessment } from './lib/quality';

const directory = 'docs/reviews/2026-09-12-dn-mn';
const readJson = <T>(file: string): T => JSON.parse(readFileSync(file, 'utf8')) as T;
const manifest = readJson<{
  baseCommit: string;
  paliCommit: string;
  assessedAt: string;
  fullSemanticReviews: Record<string, { segments: number; report: string }>;
  targetedRepairs: Record<string, { segmentIds: string[]; report: string }>;
}>(`${directory}/manifest.json`);
const lock = readJson<{ commit: string }>('source/suttacentral.lock.json');
if (lock.commit !== manifest.paliCommit) {
  throw new Error('Pinned source has changed: this dated review must not silently certify a new source.');
}

const rows = [];
for (const collection of ['dn', 'mn'] as const) {
  const catalog = readJson<CanonCatalog>(`content/catalog/sutta/${collection}.json`);
  for (const item of catalog.texts) {
    const uid = item.uid;
    const translationPath = `content/translation/vi/project/sutta/${collection}/${uid}_translation-vi-project.json`;
    const metaPath = `content/meta/sutta/${collection}/${uid}.yaml`;
    const relativeSource = sourcePathFor(collection, uid, item.sourcePath);
    if (!relativeSource) throw new Error(`${uid}: deterministic Pāli source is required`);
    const sourcePath = path.join('.cache/upstream/suttacentral', relativeSource);
    if (!existsSync(sourcePath)) throw new Error(`${uid}: source missing; run npm run source:sync:used`);
    const source = segmentMapForUid(readJson<Record<string, string>>(sourcePath), uid);
    const text = readFileSync(translationPath, 'utf8');
    const translation = JSON.parse(text) as Record<string, string>;
    const meta = YAML.parse(readFileSync(metaPath, 'utf8')) as EditorialMeta;
    const errors = [
      ...validateSegmentMap(translation, {
        uid, sourceIds: new Set(Object.keys(source)), requireComplete: true, requireLatinScript: true,
      }),
      ...validateQualityAssessment(meta),
    ];
    const full = manifest.fullSemanticReviews[uid];
    const targeted = manifest.targetedRepairs[uid];
    if (full && full.segments !== Object.keys(source).length) errors.push(`${uid}: reviewed segment count changed`);
    rows.push({
      uid,
      segmentCount: Object.keys(source).length,
      translationSha256: createHash('sha256').update(text).digest('hex'),
      statusRecorded: meta.status,
      scoreRecorded: meta.quality?.final_score ?? null,
      semanticReviewScope: full ? 'full-sutta' : targeted ? 'targeted-only' : 'not-reassessed',
      scoreReassessedInThisPass: Boolean(full),
      report: full?.report ?? targeted?.report ?? null,
      targetedSegmentIds: targeted?.segmentIds ?? [],
      structuralChecksPassed: errors.length === 0,
      errors,
    });
  }
}
const report = {
  schemaVersion: 1,
  baseCommit: manifest.baseCommit,
  paliCommit: manifest.paliCommit,
  reviewDate: manifest.assessedAt,
  disclaimer: 'Recorded scores are not automatically verified. Structural checks do not establish semantic quality. Only two full-sutta reviews were completed in this pass.',
  summary: {
    suttas: rows.length,
    segments: rows.reduce((sum, row) => sum + row.segmentCount, 0),
    dnSegments: rows.filter(row => row.uid.startsWith('dn')).reduce((sum, row) => sum + row.segmentCount, 0),
    mnSegments: rows.filter(row => row.uid.startsWith('mn')).reduce((sum, row) => sum + row.segmentCount, 0),
    fullSemanticReviews: rows.filter(row => row.semanticReviewScope === 'full-sutta').length,
    targetedOnly: rows.filter(row => row.semanticReviewScope === 'targeted-only').length,
    notReassessed: rows.filter(row => row.semanticReviewScope === 'not-reassessed').length,
    structuralFailures: rows.filter(row => !row.structuralChecksPassed).length,
  },
  suttas: rows,
};
writeFileSync(`${directory}/inventory.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary, null, 2));
if (report.summary.structuralFailures > 0) process.exitCode = 1;
