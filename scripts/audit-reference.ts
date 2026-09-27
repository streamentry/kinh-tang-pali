/**
 * Audit the pinned English reference layer against the pinned Pāli root.
 *
 * File presence is not enough: bilara-data packs many UIDs into one bundled file
 * (`an5.308-1152`, `sn12.93-213`, `dhp1-20`), so a text can look "synced" while
 * the English file is missing part of that text. This reports both the
 * file-level coverage and the segment-level alignment, because a translator who
 * trusts a green file-level check but reads a holey English text is exactly the
 * failure mode that produces a wrong Vietnamese line.
 *
 *   node --import tsx scripts/audit-reference.ts                # all catalog texts
 *   node --import tsx scripts/audit-reference.ts --used         # texts with project data
 *   node --import tsx scripts/audit-reference.ts --used --json  # machine-readable
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import type { CanonCatalog, CollectionCode } from '../src/lib/canon/types';
import {
  englishEdition,
  englishPathFor,
  loadLock,
  segmentMapForUid,
  sourcePathFor,
  upstreamFile,
} from '../src/lib/canon/load';
import { MIN_ENGLISH_COVERAGE, loadRecordedGaps } from '../src/lib/canon/reference';

const ROOT = process.cwd();
const COLLECTIONS: CollectionCode[] = ['dn', 'mn', 'sn', 'an', 'kn'];
const args = process.argv.slice(2);
const usedOnly = args.includes('--used');
const asJson = args.includes('--json');

const readJson = <T>(file: string): T => JSON.parse(readFileSync(file, 'utf8')) as T;
const loadCatalog = (collection: CollectionCode): CanonCatalog =>
  readJson<CanonCatalog>(path.join(ROOT, 'content/catalog/sutta', `${collection}.json`));

function usedUids(collection: CollectionCode): Set<string> {
  const dir = path.join(ROOT, 'content/meta/sutta', collection);
  if (!existsSync(dir)) return new Set();
  return new Set(
    readdirSync(dir).filter((name) => name.endsWith('.yaml')).map((name) => name.slice(0, -5)),
  );
}

interface TextRow {
  collection: CollectionCode;
  uid: string;
  hasProjectData: boolean;
  paliFile: string | null;
  englishFile: string | null;
  paliSegments: number;
  englishSegments: number;
  missingInEnglish: string[];
  missingInPali: string[];
  englishWithoutProse: number;
  englishWithoutProseSubstantive: number;
  coverage: number;
  recordedGap: boolean;
  problem: string | null;
}

/**
 * A segment can be present and aligned yet carry no English prose. Sujato renders
 * blockquoted passages and `…pe…` elisions as empty strings, so the English file
 * flows the sentence around them. Those segments exist, are correctly joined, and
 * simply cannot help a translator decide the wording — the Pāli must carry them
 * alone. Counted and reported, never treated as a coverage failure.
 */
function proseLength(value: string | undefined): number {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().length : 0;
}

const edition = englishEdition();
const lock = loadLock();
const recordedGaps = loadRecordedGaps();
const rows: TextRow[] = [];

for (const collection of COLLECTIONS) {
  const catalog = loadCatalog(collection);
  const used = usedUids(collection);
  for (const item of catalog.texts) {
    const uid = item.uid;
    const hasProjectData = used.has(uid);
    if (usedOnly && !hasProjectData) continue;

    const paliPath = sourcePathFor(collection, uid, item.sourcePath);
    const englishPath = englishPathFor(collection, uid, item.sourcePath);
    const problems: string[] = [];

    if (!paliPath) problems.push('no deterministic Pāli source path');
    if (!englishPath) problems.push('no deterministic English source path');

    let pali: Record<string, string> = {};
    let english: Record<string, string> = {};

    if (paliPath) {
      const file = upstreamFile(paliPath);
      if (!existsSync(file)) problems.push('Pāli root file not synced');
      else pali = segmentMapForUid(readJson<Record<string, string>>(file), uid);
    }
    if (englishPath) {
      const file = upstreamFile(englishPath);
      if (!existsSync(file)) problems.push('English reference file not synced');
      else english = segmentMapForUid(readJson<Record<string, string>>(file), uid);
    }

    const paliIds = Object.keys(pali);
    const englishIds = Object.keys(english);

    // Distinguish "the file is absent" from "the file is present but upstream
    // labelled its segments with a UID this text does not own". The second case is
    // a bilara-data defect, and guessing a mapping would fabricate provenance.
    const describeUnmatched = (label: string, relativePath: string | null, filtered: Record<string, string>) => {
      if (!relativePath || !existsSync(upstreamFile(relativePath))) return;
      if (Object.keys(filtered).length > 0) return;
      const raw = readJson<Record<string, string>>(upstreamFile(relativePath));
      if (Object.keys(raw).filter((id) => id.startsWith(`${uid}:`)).length > 0) {
        problems.push(`${label} file has no segment for this UID`);
        return;
      }
      const foreign = [...new Set(Object.keys(raw).map((id) => id.replace(/:\d+(\.\d+)?$/, '')))];
      problems.push(
        `${label} file is synced but upstream labels its ${Object.keys(raw).length} segment(s) with foreign `
        + `UID(s) ${foreign.slice(0, 3).join(' ')}${foreign.length > 3 ? ' …' : ''} (upstream bilara-data defect)`,
      );
    };
    describeUnmatched('Pāli root', paliPath, pali);
    describeUnmatched('English reference', englishPath, english);

    const paliSet = new Set(paliIds);
    const englishSet = new Set(englishIds);
    const bothSynced = (paliPath !== null && existsSync(upstreamFile(paliPath)))
      && (englishPath !== null && existsSync(upstreamFile(englishPath)));
    const missingInEnglish = bothSynced ? paliIds.filter((id) => !englishSet.has(id)) : [];
    const missingInPali = bothSynced ? englishIds.filter((id) => !paliSet.has(id)) : [];
    if (missingInEnglish.length > 0) problems.push(`${missingInEnglish.length} Pāli segment(s) absent from English`);
    if (missingInPali.length > 0) problems.push(`${missingInPali.length} English segment(s) absent from Pāli`);

    const aligned = bothSynced;
    const englishWithoutProse = aligned ? paliIds.filter((id) => proseLength(english[id]) === 0).length : 0;
    const englishWithoutProseSubstantive = aligned
      ? paliIds.filter((id) => proseLength(english[id]) === 0 && proseLength(pali[id]) >= 40).length
      : 0;
    const substantive = aligned ? paliIds.filter((id) => proseLength(pali[id]) >= 40).length : 0;
    const coverage = substantive === 0 ? 1 : (substantive - englishWithoutProseSubstantive) / substantive;

    rows.push({
      collection,
      uid,
      hasProjectData,
      paliFile: paliPath,
      englishFile: englishPath,
      paliSegments: paliIds.length,
      englishSegments: englishIds.length,
      missingInEnglish,
      missingInPali,
      englishWithoutProse,
      englishWithoutProseSubstantive,
      coverage,
      recordedGap: recordedGaps.has(`${collection}/${uid}`),
      problem: problems.length > 0 ? problems.join('; ') : null,
    });
  }
}

const broken = rows.filter((row) => row.problem !== null);
const totalPaliSegments = rows.reduce((sum, row) => sum + row.paliSegments, 0);
const totalWithoutProse = rows.reduce((sum, row) => sum + row.englishWithoutProse, 0);
const totalWithoutProseSubstantive = rows.reduce((sum, row) => sum + row.englishWithoutProseSubstantive, 0);
// Coverage is only meaningful per text. Averaging across the catalogue would let the
// 1,070 healthy texts hide the few that lost their reference layer almost entirely.
const comparable = rows.filter((row) => row.problem === null && row.englishSegments > 0);
const belowFloor = comparable
  .filter((row) => row.englishWithoutProseSubstantive > 0 && row.coverage < MIN_ENGLISH_COVERAGE)
  .sort((a, b) => a.coverage - b.coverage);
const unrecorded = belowFloor.filter((row) => !row.recordedGap);
const summary = {
  commit: lock.commit,
  englishEdition: `${edition.path} (${edition.translator}, authority: ${edition.authority})`,
  scope: usedOnly ? 'used' : 'all-catalog',
  texts: rows.length,
  withProjectData: rows.filter((row) => row.hasProjectData).length,
  englishFileMissing: broken.filter((row) => row.englishFile !== null && !existsSync(upstreamFile(row.englishFile))).length,
  paliSegments: totalPaliSegments,
  englishSegments: rows.reduce((sum, row) => sum + row.englishSegments, 0),
  textsWithSegmentGaps: broken.filter((row) => row.missingInEnglish.length > 0 || row.missingInPali.length > 0).length,
  englishAlignedButWithoutProse: totalWithoutProse,
  englishAlignedButWithoutProseSubstantive: totalWithoutProseSubstantive,
  minEnglishCoverage: MIN_ENGLISH_COVERAGE,
  textsBelowCoverageFloor: belowFloor.length,
  textsBelowFloorUnrecorded: unrecorded.length,
  broken: broken.length,
};

const percent = (part: number) => (totalPaliSegments > 0 ? `${((100 * part) / totalPaliSegments).toFixed(1)}%` : '0%');
const share = (part: number, whole: number) => (whole > 0 ? `${((100 * part) / whole).toFixed(1)}%` : '0%');

if (asJson) {
  console.log(JSON.stringify({
    summary,
    belowFloor: belowFloor.map((row) => ({
      collection: row.collection,
      uid: row.uid,
      coverage: Number(row.coverage.toFixed(4)),
      substantiveSegmentsWithoutEnglish: row.englishWithoutProseSubstantive,
      recorded: row.recordedGap,
    })),
    texts: rows.filter((row) => row.problem !== null),
  }, null, 2));
} else {
  console.log(`Pinned English reference: ${summary.englishEdition}`);
  console.log(`Commit ${summary.commit.slice(0, 12)} · scope ${summary.scope} · ${summary.texts} text(s), ${summary.withProjectData} with project data`);
  for (const collection of COLLECTIONS) {
    const scoped = rows.filter((row) => row.collection === collection);
    if (scoped.length === 0) continue;
    const bad = scoped.filter((row) => row.problem !== null);
    const pali = scoped.reduce((sum, row) => sum + row.paliSegments, 0);
    const eng = scoped.reduce((sum, row) => sum + row.englishSegments, 0);
    const noProse = scoped.reduce((sum, row) => sum + row.englishWithoutProse, 0);
    console.log(
      `  ${collection.padEnd(3)} texts=${String(scoped.length).padStart(5)}  `
      + `pāliSegments=${String(pali).padStart(7)}  englishSegments=${String(eng).padStart(7)}  `
      + `noEnglishProse=${String(noProse).padStart(6)} (${share(noProse, pali)})  `
      + `unmatched=${bad.length}`,
    );
  }
  console.log(
    `\nEnglish layer is present and segment-aligned for every audited text except ${summary.broken} upstream defect(s).`,
  );
  console.log(
    `${totalWithoutProse}/${totalPaliSegments} segments (${percent(totalWithoutProse)}) carry no English prose: `
    + `${edition.translator} leaves blockquotes and \`…pe…\` elisions empty and flows the sentence around them. `
    + `${totalWithoutProseSubstantive} (${percent(totalWithoutProseSubstantive)}) sit on substantive Pāli of 40+ characters. `
    + 'These are aligned and usable as join keys, but the Pāli alone must carry their wording.',
  );
  console.log(
    `\nCoverage floor ${(MIN_ENGLISH_COVERAGE * 100).toFixed(0)}% of substantive Pāli carrying English words: `
    + `${belowFloor.length} of ${comparable.length} text(s) fall below it`
    + `${unrecorded.length > 0 ? ` (${unrecorded.length} not yet recorded)` : ' (all recorded)'}.`,
  );
  if (unrecorded.length > 0) {
    console.error(`  ${unrecorded.length} text(s) below the floor with no entry in content/meta/reference-gaps.yaml:`);
    for (const row of unrecorded.slice(0, 20)) {
      console.error(`    ${row.collection}/${row.uid} ${(row.coverage * 100).toFixed(0)}% `
        + `(${row.englishWithoutProseSubstantive} substantive segment(s) without English words)`);
    }
    if (unrecorded.length > 20) console.error(`    … and ${unrecorded.length - 20} more`);
  }
  if (broken.length > 0) {
    console.error(`\n${broken.length} text(s) need attention:`);
    for (const row of broken) console.error(`  ${row.collection}/${row.uid}: ${row.problem}`);
  }
}

if (broken.length > 0) process.exitCode = 1;
