/**
 * Generate `content/meta/reference-gaps.yaml` from the pinned English edition.
 *
 * The file is a record, not a repair: it cannot create English prose that
 * SuttaCentral does not ship. Its job is to make the limitation explicit and
 * reviewable, so `validate` can tell "acknowledged gap" apart from "nobody
 * looked". Re-run it whenever the pinned commit or a text's coverage changes.
 *
 *   node --import tsx scripts/record-reference-gaps.ts          # write the file
 *   node --import tsx scripts/record-reference-gaps.ts --check  # fail if stale
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { existsSync } from 'node:fs';
import YAML from 'yaml';
import type { CollectionCode } from '../src/lib/canon/types';
import {
  MIN_ENGLISH_COVERAGE,
  SUBSTANTIVE_PALI_MIN_CHARS,
  englishCoverageFor,
  referenceLockSummary,
  type ReferenceGapRecord,
} from '../src/lib/canon/reference';

const ROOT = process.cwd();
const COLLECTIONS: CollectionCode[] = ['dn', 'mn', 'sn', 'an', 'kn'];
const checkOnly = process.argv.includes('--check');
const OUT = `${ROOT}/content/meta/reference-gaps.yaml`;

const REASON = 'Sujato ships no English words for these segments: the pinned bilara commit renders '
  + 'blockquote passages and `…pe…` elisions as empty strings and flows the sentence around them. '
  + 'SuttaCentral publishes no other English edition covering this text at this commit, so the '
  + 'Pāli root carried these passages alone. Triangulation for this text relied on the Pāli root '
  + 'plus the traditional Vietnamese reference, and the gap is not evidence that any wording was agreed.';

const lock = referenceLockSummary();
const gaps: ReferenceGapRecord[] = [];
const considered: Array<{ collection: CollectionCode; uid: string; ratio: number; substantive: number; without: number }> = [];

for (const collection of COLLECTIONS) {
  const metaDir = `${ROOT}/content/meta/sutta/${collection}`;
  if (!existsSync(metaDir)) continue;
  const uids = readdirSync(metaDir)
    .filter((name) => name.endsWith('.yaml'))
    .map((name) => name.slice(0, -5));
  for (const uid of uids) {
    const coverage = englishCoverageFor(collection, uid);
    if (!coverage?.resolved) continue;
    considered.push({
      collection,
      uid,
      ratio: coverage.ratio,
      substantive: coverage.substantiveSegments,
      without: coverage.substantiveWithoutEnglish,
    });
    if (coverage.ratio < MIN_ENGLISH_COVERAGE && coverage.substantiveSegments > 0) {
      gaps.push({
        uid,
        collection,
        substantiveSegments: coverage.substantiveSegments,
        substantiveWithoutEnglish: coverage.substantiveWithoutEnglish,
        coverage: Number(coverage.ratio.toFixed(4)),
      });
    }
  }
}

gaps.sort((a, b) => a.coverage - b.coverage || a.collection.localeCompare(b.collection)
  || a.uid.localeCompare(b.uid));

const distribution = new Map<string, number>();
for (const entry of considered) {
  const bucket = entry.substantive === 0 ? 'no substantive segment'
    : entry.ratio >= 0.99 ? '>= 99%'
      : entry.ratio >= MIN_ENGLISH_COVERAGE ? '80–99%'
        : entry.ratio >= 0.5 ? '50–80%'
          : entry.ratio > 0 ? '1–50%'
            : '0%';
  distribution.set(bucket, (distribution.get(bucket) ?? 0) + 1);
}

// The per-gap paragraph is hoisted into `defaultReason`; `reason` on an individual
// gap is reserved for the rare text whose cause genuinely differs.
const document = {
  schemaVersion: 1,
  generatedBy: 'scripts/record-reference-gaps.ts',
  pinnedCommit: lock.commit,
  englishTranslator: lock.translator,
  minCoverage: MIN_ENGLISH_COVERAGE,
  substantivePaliMinChars: SUBSTANTIVE_PALI_MIN_CHARS,
  scope: 'texts with project data under content/meta/sutta',
  note: 'Acknowledged absence of English prose in the pinned English edition. This file does not '
    + 'repair anything: it records which texts lost their English reference layer so that a '
    + 'review/published status rests on an acknowledged limitation rather than an unexamined gap. '
    + 'Re-run the generator after any change to the pinned commit.',
  defaultReason: REASON,
  textsConsidered: considered.length,
  coverageDistribution: Object.fromEntries([...distribution.entries()].sort()),
  gaps,
};

const serialised = `${YAML.stringify(document, { lineWidth: 0 })}\n`;

if (checkOnly) {
  const current = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  if (current !== serialised) {
    console.error('content/meta/reference-gaps.yaml is stale. Run: node --import tsx scripts/record-reference-gaps.ts');
    process.exit(1);
  }
  console.log(`Reference gap record is current: ${gaps.length} acknowledged gap(s) of ${considered.length} text(s).`);
  process.exit(0);
}

writeFileSync(OUT, serialised, 'utf8');
console.log(`Wrote content/meta/reference-gaps.yaml`);
console.log(`  texts considered : ${considered.length}`);
console.log(`  coverage spread  : ${Object.entries(document.coverageDistribution).map(([k, v]) => `${k}=${v}`).join('  ')}`);
console.log(`  acknowledged gaps: ${gaps.length} (threshold ${MIN_ENGLISH_COVERAGE})`);
if (gaps.length > 0) {
  console.log(`  worst: ${gaps.slice(0, 5).map((g) => `${g.collection}/${g.uid} ${(g.coverage * 100).toFixed(0)}%`).join(', ')}`);
}
