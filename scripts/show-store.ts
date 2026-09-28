/**
 * Read one text through the whole translation store.
 *
 * Prints every declared layer for a text side by side, in reading order, with the
 * provenance and fill rate of each. This is the working surface the store exists for:
 * Pāli first, then the pinned English edition, then our own English fill, then the
 * existing Vietnamese, then the project's Vietnamese.
 *
 *   node --import tsx scripts/show-store.ts mn118
 *   node --import tsx scripts/show-store.ts an4.59 --from 4 --limit 6
 *   node --import tsx scripts/show-store.ts an3.149 --json
 *
 * A blank cell never means "the file is missing". It usually means the pinned English
 * edition deliberately left that passage blank, which is why the coverage line and the
 * layer table are printed before the text.
 */
import type { CollectionCode } from '../src/lib/canon/types';
import { COLLECTIONS, loadCatalog } from '../src/lib/canon/load';
import { MIN_ENGLISH_COVERAGE, englishCoverageFor, loadRecordedGaps } from '../src/lib/canon/reference';
import { readingOrder, resolveLayer, storeView } from '../src/lib/canon/layers';

const args = process.argv.slice(2);

function flag(name: string): string | undefined {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
}

const valueFlags = new Set(['from', 'limit', 'collection']);
const positional = args.filter((value, index) => {
  if (value.startsWith('--')) return false;
  const previous = args[index - 1];
  return !(previous?.startsWith('--') && valueFlags.has(previous.slice(2)));
});

const uid = positional[0];
if (!uid) {
  console.error(`Usage: tsx scripts/show-store.ts <uid> [--collection <${COLLECTIONS.map((c) => c.code).join('|')}>] [--from <index>] [--limit <n>] [--json]`);
  process.exit(2);
}

const inferred: CollectionCode = uid.startsWith('dn') ? 'dn'
  : uid.startsWith('mn') ? 'mn'
    : uid.startsWith('sn') ? 'sn'
      : uid.startsWith('an') ? 'an'
        : 'kn';
const collection = (flag('collection') as CollectionCode | undefined) ?? inferred;

const catalog = loadCatalog(collection);
if (!catalog.texts.some((text) => text.uid === uid)) {
  console.error(`${uid} is not in the ${collection} catalog. Pass --collection if the UID is filed elsewhere.`);
  process.exit(2);
}

const view = storeView(collection, uid);
const coverage = englishCoverageFor(collection, uid);
const recordedGap = loadRecordedGaps().get(`${collection}/${uid}`);

if (args.includes('--json')) {
  console.log(JSON.stringify({
    ...view,
    englishCoverage: coverage,
    recordedGap: recordedGap ?? null,
    layers: view.layers.map((layer) => ({
      ...layer,
      segments: resolveLayer(layer.id, collection, uid, { catalog })?.segments ?? {},
    })),
  }, null, 2));
  process.exit(0);
}

const pct = (value: number) => `${(value * 100).toFixed(0)}%`.padStart(4);
console.log(`# ${uid} · ${collection.toUpperCase()} · bilara commit ${view.commit.slice(0, 12)}`);
console.log(`\nStore layers (reading order):`);
for (const layer of view.layers) {
  const marks = [
    layer.authority ? 'AUTHORITY' : layer.kind,
    layer.present ? 'present' : 'absent',
    layer.status ? `status=${layer.status}` : null,
  ].filter(Boolean).join(' · ');
  console.log(
    `  ${layer.id.padEnd(19)} ${pct(layer.proseShare)} filled  ${marks}`,
  );
  console.log(`  ${''.padEnd(19)} ${layer.title}`);
  console.log(`  ${''.padEnd(19)} ${layer.source}`);
}

if (coverage?.resolved && coverage.substantiveSegments > 0) {
  const floor = (MIN_ENGLISH_COVERAGE * 100).toFixed(0);
  const state = coverage.ratio >= MIN_ENGLISH_COVERAGE
    ? `at or above floor (${floor}%)`
    : recordedGap
      ? `BELOW floor (${floor}%) · recorded in reference-gaps.yaml`
      : `BELOW floor (${floor}%) · NOT recorded`;
  console.log(
    `\nEnglish coverage: ${(coverage.ratio * 100).toFixed(0)}% of ${coverage.substantiveSegments} substantive Pāli segment(s)`
    + ` (${coverage.substantiveWithoutEnglish} untranslated) · ${state}`,
  );
  console.log(`  credited layers: ${coverage.credited.join(', ') || '(none present)'}`);
  if (coverage.worstMissingSegment) {
    const pali = resolveLayer('pali', collection, uid, { catalog });
    console.log(`  largest remaining hole: ${coverage.worstMissingSegment}`);
    console.log(`    Pāli: ${String(pali?.segments[coverage.worstMissingSegment] ?? '').replace(/\s+/g, ' ').trim().slice(0, 100)}…`);
  }
} else if (coverage?.resolved) {
  console.log('\nEnglish coverage: no substantive Pāli segment in this text (headings and enumerations only).');
}

const layers = readingOrder()
  .map((layer) => ({ layer, resolved: resolveLayer(layer.id, collection, uid, { catalog }) }))
  .filter((entry) => entry.resolved?.present);

const pali = resolveLayer('pali', collection, uid, { catalog });
const ids = pali?.present ? Object.keys(pali.segments) : [];
if (ids.length === 0) {
  console.error(`\n${uid}: the pinned Pāli root resolves to no segment for this UID.`);
  process.exit(1);
}

const from = Math.max(0, Number(flag('from') ?? 0));
const limit = Number(flag('limit') ?? Number.POSITIVE_INFINITY);

const width = Math.max(18, Math.min(40, Math.floor((110 - 22) / Math.max(1, layers.length))));
const flatten = (value: string | undefined) => {
  if (value === undefined) return '·absent';
  const flat = value.replace(/\s+/g, ' ').trim();
  if (flat === '') return '·blank';
  return flat.length > width ? `${flat.slice(0, width - 1)}…` : flat;
};
const cell = (value: string | undefined) => flatten(value).padEnd(width);

console.log(`\nsegments ${ids.length} · showing ${Math.min(limit, Math.max(0, ids.length - from))} from index ${from}\n`);
const header = `${'segment'.padEnd(20)}${layers.map(({ layer }) => layer.id.slice(0, width - 1).padEnd(width)).join('')}`;
console.log(header);
console.log('-'.repeat(header.length));
for (const id of ids.slice(from, from + limit)) {
  console.log(`${id.padEnd(20)}${layers.map(({ resolved }) => cell(resolved!.segments[id])).join('')}`);
}

const blankByLayer = layers.map(({ layer, resolved }) => {
  const total = ids.length;
  const withProse = ids.filter((id) => String(resolved!.segments[id] ?? '').trim() !== '').length;
  return `${layer.id} ${withProse}/${total}`;
});
console.log(`\ncoverage by layer: ${blankByLayer.join(' · ')}`);
if (recordedGap) {
  const reason = recordedGap.reason ?? '';
  console.log(`recorded reference gap: ${recordedGap.substantiveWithoutEnglish}/${recordedGap.substantiveSegments} substantive segment(s) untranslated`
    + `${reason ? ` — ${reason.slice(0, 120)}…` : ''}`);
}
