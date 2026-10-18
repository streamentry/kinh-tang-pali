/**
 * Apply the editor's waivers (source/editorial-waivers.yaml) to scorecards.
 *
 *   npm run quality:waive              # write
 *   npm run quality:waive -- --dry-run # report only
 *
 * A text with no blocker at all has its status recomputed from the scorecard (a stale waiver is dropped).
 * For every text whose scorecard carries a blocker a waiver covers, and whose waiver
 * condition holds at the pinned commit, record `quality.waiver` and recompute `status` with
 * the same gate function `validate` uses. Scores, notes and blockers are never touched: the
 * blocker stays on record, only its power to force `draft` is lifted. A text that still has
 * any other blocker stays `draft`.
 */
import { randomUUID } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import type { CollectionCode, EditorialMeta } from '../src/lib/canon/types';
import { eligibleWaiver, publishOverrideFor } from '../src/lib/canon/waivers';
import { arithmeticMean, expectedStatusForQuality, validateQualityAssessment } from './lib/quality';

const COLLECTIONS: CollectionCode[] = ['dn', 'mn', 'sn', 'an', 'kn'];
const dryRun = process.argv.includes('--dry-run');
const tally: Record<string, number> = {};
const bump = (key: string) => { tally[key] = (tally[key] ?? 0) + 1; };

for (const collection of COLLECTIONS) {
  const dir = path.join(process.cwd(), 'content/meta/sutta', collection);
  if (!existsSync(dir)) continue;
  for (const name of readdirSync(dir).filter((file) => file.endsWith('.yaml')).sort()) {
    const uid = name.slice(0, -5);
    const file = path.join(dir, name);
    const original = readFileSync(file, 'utf8');
    const document = YAML.parseDocument(original);
    const meta = document.toJSON() as EditorialMeta;
    const quality = meta.quality;
    if (!quality) continue;
    if (!Array.isArray(quality.blocking_errors) || quality.blocking_errors.length === 0) {
      // No blocker left (an audit resolved them all): the recorded status must still follow the
      // scorecard, and a waiver with nothing to waive is stale. Scores and notes are never touched.
      if (!quality.scores) continue;
      const cleanMean = arithmeticMean(Object.values(quality.scores) as number[]);
      const cleanStatus = expectedStatusForQuality(cleanMean, quality.blocking_errors ?? [], [], Boolean(publishOverrideFor(collection, uid)));
      if (cleanStatus === meta.status && !quality.waiver) continue;
      const { waiver: _stale, ...cleanQuality } = quality;
      const cleanNext = { ...meta, quality: cleanQuality, status: cleanStatus };
      const cleanErrors = validateQualityAssessment(cleanNext, collection);
      if (cleanErrors.length) { bump('refused'); console.error(`${collection}/${uid}: ${cleanErrors.join('; ')}`); continue; }
      bump(`no-blocker ${meta.status}->${cleanStatus}`);
      if (dryRun) continue;
      if (quality.waiver) document.deleteIn(['quality', 'waiver']);
      document.set('status', cleanStatus);
      const cleanTemporary = `${file}.${randomUUID()}.tmp`;
      try {
        writeFileSync(cleanTemporary, document.toString(), { flag: 'wx' });
        if (readFileSync(file, 'utf8') !== original) throw new Error(`${uid}: metadata changed during apply; kept the concurrent edit`);
        renameSync(cleanTemporary, file);
      } finally { if (existsSync(cleanTemporary)) unlinkSync(cleanTemporary); }
      continue;
    }
    const waiver = eligibleWaiver(collection, uid, quality.blocking_errors);
    if (!waiver) { bump('not-eligible'); continue; }
    const mean = arithmeticMean(Object.values(quality.scores) as number[]);
    const status = expectedStatusForQuality(mean, quality.blocking_errors, waiver.blockers, Boolean(publishOverrideFor(collection, uid)));
    if (status === meta.status && JSON.stringify(quality.waiver) === JSON.stringify(waiver)) { bump('already-applied'); continue; }
    // A waiver that leaves a draft a draft (another blocker, or a score under 8.0) changes nothing.
    // A text that was review/published but no longer passes the gate (an audit found a new blocker or
    // lowered the score) IS brought down, so the recorded status never outruns the scorecard.
    if (status === 'draft' && meta.status === 'draft') { bump('still-draft'); continue; }
    const keepWaiver = status !== 'draft';
    const { waiver: _old, ...qualityWithoutWaiver } = quality;
    const next = { ...meta, quality: keepWaiver ? { ...quality, waiver } : qualityWithoutWaiver, status };
    const errors = validateQualityAssessment(next, collection);
    if (errors.length) { bump('refused'); console.error(`${collection}/${uid}: ${errors.join('; ')}`); continue; }
    bump(`${meta.status}->${status}`);
    if (dryRun) continue;
    if (keepWaiver) document.setIn(['quality', 'waiver'], document.createNode(waiver));
    else document.deleteIn(['quality', 'waiver']);
    document.set('status', status);
    const temporary = `${file}.${randomUUID()}.tmp`;
    try {
      writeFileSync(temporary, document.toString(), { flag: 'wx' });
      if (readFileSync(file, 'utf8') !== original) throw new Error(`${uid}: metadata changed during apply; kept the concurrent edit`);
      renameSync(temporary, file);
    } finally { if (existsSync(temporary)) unlinkSync(temporary); }
  }
}
console.log(dryRun ? 'dry run:' : 'applied:', tally);
