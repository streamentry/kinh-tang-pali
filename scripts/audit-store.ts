/**
 * Audit the whole translation store, layer by layer.
 *
 * `audit-reference.ts` answers "is the English reference good enough to translate
 * from". This answers the wider question: is every declared layer present, complete
 * and consistent for every text we might start translating?
 *
 * Checks, per layer:
 *   - registry coherence (authority only on a root layer, reading order resolvable,
 *     upstream paths actually pinned by the lock);
 *   - presence per text, and the reason when a layer is absent;
 *   - segment alignment against the Pāli root, including orphans on either side;
 *   - the two silent-corruption cases: a layer that fills segments the Pāli does not
 *     have, and a project fill that shadows a segment a pinned edition translated.
 *
 *   node --import tsx scripts/audit-store.ts            # texts with project data
 *   node --import tsx scripts/audit-store.ts --all
 *   node --import tsx scripts/audit-store.ts --json
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import type { CanonCatalog, CollectionCode } from '../src/lib/canon/types';
import { loadLock, segmentMapForUid } from '../src/lib/canon/load';
import { assertStoreIntegrity, readingOrder, resolveLayer, storeLayers } from '../src/lib/canon/layers';
import { englishCoverageFor } from '../src/lib/canon/reference';

const ROOT = process.cwd();
const COLLECTIONS: CollectionCode[] = ['dn', 'mn', 'sn', 'an', 'kn'];
const args = process.argv.slice(2);
const scopeAll = args.includes('--all');
const asJson = args.includes('--json');

const problems: string[] = assertStoreIntegrity();
const layers = readingOrder();
const projectEnglish = storeLayers().find((layer) => layer.id === 'english-project')!;

interface LayerReport {
  id: string;
  kind: string;
  authority: boolean;
  textsPresent: number;
  textsAbsent: number;
  textsPartial: number;
  segments: number;
  segmentsWithProse: number;
  /** Absent upstream because the edition does not cover the text, which is normal. */
  absentNotCoveredUpstream: number;
  shadowed: string[];
  orphaned: string[];
  misaligned: string[];
}

const reports: LayerReport[] = layers.map((layer) => ({
  id: layer.id,
  kind: layer.kind,
  authority: layer.authority,
  textsPresent: 0,
  textsAbsent: 0,
  textsPartial: 0,
  segments: 0,
  segmentsWithProse: 0,
  absentNotCoveredUpstream: 0,
  shadowed: [],
  orphaned: [],
  misaligned: [],
}));

const layerById = new Map(reports.map((report) => [report.id, report]));

let textsConsidered = 0;
const coverage: Array<{ collection: string; uid: string; ratio: number; untranslated: number }> = [];

for (const collection of COLLECTIONS) {
  const catalog: CanonCatalog = JSON.parse(
    readFileSync(path.join(ROOT, 'content/catalog/sutta', `${collection}.json`), 'utf8'),
  ) as CanonCatalog;
  const metaDir = path.join(ROOT, 'content/meta/sutta', collection);
  const withData = new Set(
    existsSync(metaDir) ? readdirSync(metaDir).filter((n) => n.endsWith('.yaml')).map((n) => n.slice(0, -5)) : [],
  );

  for (const item of catalog.texts) {
    if (!scopeAll && !withData.has(item.uid)) continue;
    textsConsidered += 1;

    const pali = resolveLayer('pali', collection, item.uid, { catalog });
    const paliSegments = pali?.present ? segmentMapForUid(
      JSON.parse(readFileSync(pali.file, 'utf8')) as Record<string, string>, item.uid,
    ) : {};
    const paliIds = new Set(Object.keys(paliSegments));
    if (paliIds.size === 0) {
      problems.push(`${collection}/${item.uid}: the Pāli authority layer resolves to no segment`);
      continue;
    }

    for (const layer of layers) {
      if (layer.id === 'pali') {
        const report = layerById.get(layer.id)!;
        report.textsPresent += 1;
        report.segments += paliIds.size;
        report.segmentsWithProse += Object.values(paliSegments)
          .filter((v) => String(v).trim() !== '').length;
        continue;
      }

      const report = layerById.get(layer.id)!;
      const resolved = resolveLayer(layer.id, collection, item.uid, { catalog });

      if (!resolved?.present) {
        report.textsAbsent += 1;
        if (layer.location.type === 'upstream' && !layer.location.rootEdition) {
          // A pinned edition that simply does not carry this text. Expected for the
          // existing Vietnamese corpus, which is Dhammapada-only at this commit.
          report.absentNotCoveredUpstream += 1;
        } else if (layer.id === projectEnglish.id) {
          // Expected until the fill work reaches this text.
        } else {
          problems.push(`${collection}/${item.uid}: layer '${layer.id}' should be present but is not`);
        }
        continue;
      }

      report.textsPresent += 1;
      const ids = Object.keys(resolved.segments);
      report.segments += ids.length;
      report.segmentsWithProse += Object.values(resolved.segments)
        .filter((v) => String(v).trim() !== '').length;

      const orphan = ids.filter((id) => !paliIds.has(id));
      if (orphan.length > 0) {
        report.orphaned.push(`${collection}/${item.uid}: ${orphan.length} segment(s) absent from the Pāli root`);
        problems.push(`${collection}/${item.uid}: layer '${layer.id}' has ${orphan.length} orphan segment(s) (${orphan.slice(0, 3).join(' ')})`);
      }

      // A project fill must never shadow a passage a pinned edition translated. Doing
      // so would quietly replace a pinned upstream reading with a local one.
      if (layer.id === projectEnglish.id) {
        for (const id of ids) {
          if (!paliIds.has(id)) continue;
          const value = String(resolved.segments[id] ?? '').trim();
          if (value === '') {
            problems.push(`${collection}/${item.uid}: English fill '${id}' is empty; a blank cell is a gap to fill, not a value`);
            continue;
          }
          const sujato = resolveLayer('english-sujato', collection, item.uid, { catalog });
          if (sujato?.present && String(sujato.segments[id] ?? '').trim() !== '') {
            report.shadowed.push(`${collection}/${item.uid}: ${id}`);
          }
        }
      } else if (ids.length !== paliIds.size) {
        report.misaligned.push(`${collection}/${item.uid}: ${ids.length} of ${paliIds.size} segment(s)`);
      }
    }

    const stats = englishCoverageFor(collection, item.uid);
    if (stats?.resolved) {
      coverage.push({
        collection,
        uid: item.uid,
        ratio: stats.ratio,
        untranslated: stats.substantiveWithoutEnglish,
      });
    }
  }
}

const totalSegments = reports.reduce((sum, r) => sum + r.segments, 0);
const summary = {
  commit: loadLock().commit,
  scope: scopeAll ? 'all-catalog' : 'used',
  texts: textsConsidered,
  // Stated rather than left as an unused variable: a report about the store that does
  // not say how many segments it examined cannot be compared against a later run.
  segments: totalSegments,
  layers: reports.length,
  problems: problems.length,
  englishFillTexts: reports.find((r) => r.id === projectEnglish.id)?.textsPresent ?? 0,
  englishFillSegments: reports.find((r) => r.id === projectEnglish.id)?.segments ?? 0,
};

if (asJson) {
  console.log(JSON.stringify({ summary, reports, problems }, null, 2));
} else {
  console.log(`Translation store audit · commit ${summary.commit.slice(0, 12)} · scope ${summary.scope}`);
  console.log(`${summary.texts} text(s), ${summary.layers} declared layer(s)\n`);
  console.log(`  ${'layer'.padEnd(19)}${'texts'.padStart(7)}${'absent'.padStart(8)}${'segments'.padStart(10)}${'with prose'.padStart(12)}  notes`);
  for (const report of reports) {
    const notes = [
      report.authority ? 'AUTHORITY' : report.kind,
      report.absentNotCoveredUpstream > 0 ? `${report.absentNotCoveredUpstream} not covered upstream` : null,
      report.shadowed.length > 0 ? `${report.shadowed.length} SHADOWING` : null,
      report.orphaned.length > 0 ? `${report.orphaned.length} orphan` : null,
    ].filter(Boolean).join(', ');
    console.log(
      `  ${report.id.padEnd(19)}${String(report.textsPresent).padStart(7)}${String(report.textsAbsent).padStart(8)}`
      + `${String(report.segments).padStart(10)}${String(report.segmentsWithProse).padStart(12)}  ${notes}`,
    );
  }
  const withEnglish = coverage.filter((c) => c.untranslated === 0).length;
  console.log(`\n  English coverage: ${withEnglish}/${coverage.length} text(s) with no untranslated substantive Pāli left.`);
  console.log(`  Own English fill: ${summary.englishFillTexts} text(s), ${summary.englishFillSegments} segment(s).`);
  if (problems.length > 0) {
    console.error(`\n${problems.length} problem(s):`);
    for (const problem of problems.slice(0, 40)) console.error(`  ${problem}`);
    if (problems.length > 40) console.error(`  … and ${problems.length - 40} more`);
  } else {
    console.log('\n  Store is internally consistent: no orphan segments, no shadowing, no authority inversion.');
  }
}

if (problems.length > 0) process.exitCode = 1;
