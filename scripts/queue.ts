/**
 * What to translate next, measured.
 *
 * The remaining work is large enough that "which text next" cannot be a matter of taste:
 * 201,498 Vietnamese segments across 4,547 texts, and 3,093 English segments across 132
 * texts. Picking by eye means the same large texts get deferred indefinitely and the queue
 * never moves.
 *
 * So this prints the queue smallest-first for both layers, with the counts, and the
 * remainder after each. Smallest-first is not a preference — a text of six segments gets
 * finished and closed the same day it is started, whereas a 400-segment text of the same
 * quality can sit half-done for weeks and its status stays ambiguous. Finishing texts is
 * worth more than starting them.
 *
 *   npm run queue                 both layers, next 20 of each
 *   npm run queue -- --layer vi   one layer
 *   npm run queue -- --limit 50
 *   npm run queue -- --json       machine-readable, for measuring progress
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { loadCatalog, loadSegmentMap, segmentMapForUid, sourcePathFor, upstreamFile } from '../src/lib/canon/load';
import { isSubstantive, SUBSTANTIVE_PALI_MIN_CHARS } from '../src/lib/canon/reference';
import { resolveLayer } from '../src/lib/canon/layers';
import { COLLECTIONS } from '../src/lib/canon/load';
import type { CollectionCode } from '../src/lib/canon/types';

const ROOT = process.cwd();

interface QueueRow {
  collection: CollectionCode;
  uid: string;
  /** Substantive Pāli segments with no wording yet — the set the coverage metric counts. */
  missing: number;
  /** Substantive Pāli segments in the text, for context. */
  substantive: number;
  /**
   * Every Pāli segment still without wording, including short ones.
   *
   * This is the larger number and it is the one that describes the work. A segment holding
   * "Yes, Bhante." is not substantive by the coverage definition, but leaving it untranslated
   * still leaves the text unfinished and the reader sees a hole. Reporting only the coverage
   * figure would understate the work and, worse, would let a text be called complete while
   * short segments are blank.
   */
  missingAll: number;
  status: string;
  titleVi: string;
}

function readStatus(collection: CollectionCode, uid: string): string {
  const file = path.join(ROOT, 'content/meta/sutta', collection, `${uid}.yaml`);
  if (!existsSync(file)) return 'no-metadata';
  const text = readFileSync(file, 'utf8');
  const match = /^status:\s*(\S+)/m.exec(text);
  return match ? match[1] : 'unknown';
}

function readTitle(collection: CollectionCode, uid: string): string {
  const file = path.join(ROOT, 'content/meta/sutta', collection, `${uid}.yaml`);
  if (existsSync(file)) {
    const text = readFileSync(file, 'utf8');
    const match = /^translationTitle:\s*"?([^"\n]+)"?/m.exec(text);
    if (match) return match[1].trim();
  }
  return '';
}

function build(layer: 'en' | 'vi'): { rows: QueueRow[]; totalSegments: number; totalTexts: number } {
  const rows: QueueRow[] = [];
  let totalSegments = 0;

  const target = layer === 'en' ? 'english-project' : 'vietnamese-project';

  for (const { code: collection } of COLLECTIONS) {
    const catalog = loadCatalog(collection);
    for (const text of catalog.texts) {
      const sourcePath = sourcePathFor(collection, text.uid, text.sourcePath);
      if (!sourcePath) continue;
      const pali = segmentMapForUid(loadSegmentMap(upstreamFile(sourcePath)), text.uid);

      // Substantive Pāli, decided by the repository's own predicate rather than a local
      // threshold. A second definition here would be a second number, and the project forbids
      // writing a figure code cannot reproduce.
      const substantive = Object.keys(pali).filter((id) => isSubstantive(id, pali[id]));
      if (!substantive.length) continue;

      // The target layer's own text, if it has any. For English this is our fill, which
      // counts toward coverage once published; for Vietnamese it is our translation.
      // A text may legitimately have no file for the target layer at all; that is an absent
      // layer, which the reader reports honestly, and every segment is then still missing.
      const resolved = resolveLayer(target, collection, text.uid);
      const filled = resolved
        ? substantive.filter((id) => (resolved.segments[id] ?? '').trim().length > 0)
        : [];
      const missing = substantive.length - filled.length;

      // Every segment with Pāli, regardless of length. A `:0` title block is excluded
      // because the reader shows the title separately and a translation file does not carry
      // it; reference and heading blocks are included, because a reader still reads them.
      const allWithPali = Object.keys(pali).filter(
        (id) => !id.endsWith(':0') && pali[id].trim().length > 0,
      );
      const missingAll = resolved
        ? allWithPali.filter((id) => !(resolved.segments[id] ?? '').trim()).length
        : allWithPali.length;
      if (!missing && !missingAll) continue;

      rows.push({
        collection,
        uid: text.uid,
        missing,
        substantive: substantive.length,
        missingAll,
        status: readStatus(collection, text.uid),
        titleVi: readTitle(collection, text.uid),
      });
      totalSegments += missing;
    }
  }

  // Smallest first, so a queue always moves. Ties broken by collection then uid so the
  // order is stable and two runs of the same state produce the same list.
  rows.sort((a, b) => a.missing - b.missing
    || a.collection.localeCompare(b.collection)
    || a.uid.localeCompare(b.uid));
  return { rows, totalSegments, totalTexts: rows.length };
}

const args = process.argv.slice(2);
const layerArg = args.indexOf('--layer');
const limitArg = args.indexOf('--limit');
const layer = layerArg >= 0 ? (args[layerArg + 1] as 'en' | 'vi') : null;
const limit = limitArg >= 0 ? Number(args[limitArg + 1]) : 20;
const asJson = args.includes('--json');

const layers: Array<'en' | 'vi'> = layer ? [layer] : ['en', 'vi'];
const report = {} as Record<string, unknown>;

for (const name of layers) {
  const { rows, totalSegments, totalTexts } = build(name);
  const shown = rows.slice(0, limit);
  const shownSegments = shown.reduce((sum, row) => sum + row.missing, 0);

  report[name] = {
    texts: totalTexts,
    segments: totalSegments,
    segmentsAll: rows.reduce((sum, row) => sum + row.missingAll, 0),
    shown: shown.map((row) => `${row.collection}/${row.uid}`),
    shownSegments,
    remainderSegments: totalSegments - shownSegments,
    remainderTexts: totalTexts - shown.length,
  };

  if (asJson) continue;

  const heading = name === 'en'
    ? 'Bản lấp English của dự án (Sujato để trống)'
    : 'Bản dịch Việt của dự án';
  console.log(`\n${'='.repeat(78)}\n${heading}\n${'='.repeat(78)}`);
  console.log(`  (chỉ tính Pāli có nội dung: ≥ ${SUBSTANTIVE_PALI_MIN_CHARS} ký tự, bỏ khối :0)`);
  const allSegments = rows.reduce((sum, row) => sum + row.missingAll, 0);
  console.log(`  còn ${totalTexts} bài`);
  console.log(`  ${totalSegments} segment có nội dung Pāli ≥ ${SUBSTANTIVE_PALI_MIN_CHARS} ký tự chưa dịch  ← coverage metric`);
  console.log(`  ${allSegments} segment chưa dịch tính cả segment ngắn                    ← việc thật\n`);
  if (!rows.length) {
    console.log('  (hết — tầng này đã phủ hết Pāli có nội dung)');
    continue;
  }
  console.log(`  ${'bài'.padEnd(16)}${'thiếu'.padStart(6)}${'/nội dung'.padStart(11)}${'tất cả'.padStart(9)}  ${'trạng thái'.padEnd(13)}tiêu đề`);
  for (const row of shown) {
    const id = `${row.collection}/${row.uid}`.padEnd(16);
    console.log(`  ${id}${String(row.missing).padStart(6)}${`/${row.substantive}`.padStart(11)}${String(row.missingAll).padStart(9)}  ${row.status.padEnd(13)}${row.titleVi.slice(0, 36)}`);
  }
  console.log(`\n  → sau ${shown.length} bài này còn ${totalTexts - shown.length} bài · ${allSegments - shown.reduce((s, r) => s + r.missingAll, 0)} segment`);
}

if (asJson) console.log(JSON.stringify(report, null, 2));
