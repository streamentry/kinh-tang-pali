/**
 * Import the canonical snapshot into the project catalogues.
 *
 * The catalogues were hand-built per collection and drifted: they named 3,049 of the
 * 5,764 Pāli files the pinned commit contains, so 2,715 texts simply were not in the
 * repository. Every existing check iterated the catalogue, so nothing noticed — the
 * catalogue was the blind spot, not the data.
 *
 * `docs/roadmap.md` phase 2 already says the rule: do not invent SN/AN/KN catalogues
 * arithmetically, import the canonical tree/UID/source paths from the pinned
 * SuttaCentral snapshot. This is that import, and it takes its list of files from
 * `source/upstream-manifest.json` — the git tree of the locked commit — so nothing is
 * guessed and every entry can be checked back to a blob.
 *
 * UID rule: one entry per bilara file, UID = the file's own UID component. bilara
 * filenames are SuttaCentral UIDs, which was verified rather than assumed — SuttaCentral
 * serves `/api/bilarasuttas/an1.1-10`, `ud1.1`, `thag1.100` and `an6.100` while inventing a
 * name like `an6.1-10` returns Not Found, so the files upstream are already the canonical
 * ones. Both bundling conventions stay resolvable through `segmentPrefixesForUid`.
 *
 * `order` is only an index: existing values are never renumbered, and new entries
 * continue from the current maximum in sub-collection then UID order. Nothing that reads
 * the catalogues today changes for the 3,049 texts already there.
 *
 *   node --import tsx scripts/import-canonical-catalogs.ts           # write
 *   node --import tsx scripts/import-canonical-catalogs.ts --check   # fail if any file is missing
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { CanonCatalog, CatalogText, CollectionCode } from '../src/lib/canon/types';
import { loadLock, sourcePathFor } from '../src/lib/canon/load';

const ROOT = process.cwd();
const COLLECTIONS: CollectionCode[] = ['dn', 'mn', 'sn', 'an', 'kn'];
const checkOnly = process.argv.includes('--check');

const readJson = <T>(file: string): T => JSON.parse(readFileSync(file, 'utf8')) as T;
const lock = loadLock();
const manifest = readJson<{
  commit: string;
  editions: Array<{ layerId: string; path: string; files: Record<string, string> }>;
}>(path.join(ROOT, 'source/upstream-manifest.json'));

if (manifest.commit !== lock.commit) {
  console.error(`source/upstream-manifest.json is pinned to ${manifest.commit}, lock says ${lock.commit}.`);
  process.exit(2);
}
const pali = manifest.editions.find((edition) => edition.layerId === 'pali');
if (!pali) {
  console.error('source/upstream-manifest.json has no `pali` edition.');
  process.exit(2);
}

/**
 * Compare a sub-collection key numerically where possible so `an9` sorts before `an10`,
 * and keep the sort total and stable so repeated runs produce identical files.
 */
const naturalKey = (value: string): [number, string][] =>
  value.split(/(\d+)/).map((part) => (/^\d+$/.test(part) ? [1, part.padStart(12, '0')] : [0, part]) as [number, string]);

const compareNatural = (a: string, b: string): number => {
  const left = naturalKey(a);
  const right = naturalKey(b);
  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    const l = left[i];
    const r = right[i];
    if (!l) return -1;
    if (!r) return 1;
    if (l[0] !== r[0]) return l[0] - r[0];
    if (l[1] !== r[1]) return l[1] < r[1] ? -1 : 1;
  }
  return 0;
};

/** dn and mn are flat; the others nest one level, e.g. `an/an1/…`, `kn/mil/…`. */
const subOf = (collection: CollectionCode, name: string): string => (
  collection === 'dn' || collection === 'mn' ? '(flat)' : name.split('/').slice(1, -1).join('/')
);

const catalogueFile = (collection: CollectionCode) =>
  path.join(ROOT, 'content/catalog/sutta', `${collection}.json`);

interface Summary {
  collection: CollectionCode;
  before: number;
  added: number;
  after: number;
  upstream: number;
  stillAbsent: number;
  addedWithEnglish: number;
  subcollections: string[];
}

const summaries: Summary[] = [];
let anyAbsent = 0;

for (const collection of COLLECTIONS) {
  const catalog = readJson<CanonCatalog>(catalogueFile(collection));
  // dn and mn entries carry no `sourcePath` because it is derivable from the UID, so
  // compare against the *effective* path. Using `item.sourcePath` directly would mark
  // every dn/mn file as missing and then collide on the first UID.
  const existingPaths = new Set<string>();
  for (const item of catalog.texts) {
    const effective = sourcePathFor(collection, item.uid, item.sourcePath);
    if (effective) existingPaths.add(effective);
  }

  const upstream = Object.keys(pali.files)
    .filter((name) => name.startsWith(`${collection}/`))
    .map((name) => ({ name, rootPath: `${pali.path}/${name}` }));

  const missing = upstream
    .filter((entry) => !existingPaths.has(entry.rootPath))
    .sort((a, b) => {
      const subDelta = compareNatural(subOf(collection, a.name), subOf(collection, b.name));
      if (subDelta !== 0) return subDelta;
      return compareNatural(a.name, b.name);
    });

  const maxOrder = catalog.texts.reduce((max, item) => Math.max(max, item.order), 0);
  let nextOrder = maxOrder;
  const added: CatalogText[] = [];
  const seenUids = new Set(catalog.texts.map((item) => item.uid));

  for (const entry of missing) {
    const uid = entry.name.replace(/_root-pli-ms\.json$/, '').split('/').pop()!;
    if (seenUids.has(uid)) {
      // Two files resolving to one UID would make the catalogue ambiguous. Refuse
      // rather than pick a winner.
      console.error(`${collection}: ${entry.name} would duplicate UID ${uid}; resolve this by hand.`);
      process.exit(1);
    }
    seenUids.add(uid);
    nextOrder += 1;
    added.push({ uid, order: nextOrder, sourcePath: entry.rootPath });
  }

  summaries.push({
    collection,
    before: catalog.texts.length,
    added: added.length,
    after: catalog.texts.length + added.length,
    upstream: upstream.length,
    stillAbsent: upstream.length - (catalog.texts.length ? new Set([...existingPaths]).size : 0) - added.length,
    addedWithEnglish: 0,
    subcollections: [...new Set(upstream.map((entry) => subOf(collection, entry.name)))].sort(compareNatural),
  });
  anyAbsent += summaries[summaries.length - 1].stillAbsent;

  if (!checkOnly && added.length > 0) {
    // Match whatever shape the file already has. dn and mn are stored minified, the
    // rest with two-space indent; rewriting a catalogue that gained nothing would be
    // thousands of lines of cosmetic diff for no semantic change.
    const current = readFileSync(catalogueFile(collection), 'utf8');
    const indentMatch = current.match(/\n(\s+)"/);
    const indent = indentMatch ? indentMatch[1] : 0;
    const serialised = indent
      ? `${JSON.stringify({ ...catalog, texts: [...catalog.texts, ...added] }, null, 2)}\n`
      : `${JSON.stringify({ ...catalog, texts: [...catalog.texts, ...added] })}\n`;
    writeFileSync(catalogueFile(collection), serialised, 'utf8');
  }
}

// English availability for the newly added texts, so the import reports what a
// translator would actually have to work with.
const english = manifest.editions.find((edition) => edition.layerId === 'english-sujato');
for (const summary of summaries) {
  const catalog = readJson<CanonCatalog>(catalogueFile(summary.collection));
  const addedUids = new Set(catalog.texts.slice(summary.before).map((item) => item.uid));
  if (!english) continue;
  for (const item of catalog.texts) {
    if (!addedUids.has(item.uid) || !item.sourcePath) continue;
    const rel = item.sourcePath.replace(`${pali.path}/`, 'sutta/');
    const name = rel.replace(/_root-pli-ms\.json$/, '_translation-en-sujato.json');
    if (english.files[name]) summary.addedWithEnglish += 1;
  }
}

const totalBefore = summaries.reduce((sum, s) => sum + s.before, 0);
const totalAdded = summaries.reduce((sum, s) => sum + s.added, 0);

if (checkOnly) {
  if (anyAbsent > 0) {
    console.error(`${anyAbsent} upstream Pāli file(s) still have no catalogue entry.`);
    console.error('Run: node --import tsx scripts/import-canonical-catalogs.ts');
    process.exit(1);
  }
  console.log(`Catalogues cover every one of the ${totalBefore} pinned upstream file(s).`);
  process.exit(0);
}

console.log(`Imported the pinned snapshot into the catalogues (commit ${lock.commit.slice(0, 12)})`);
console.log(`  ${'collection'.padEnd(11)}${'before'.padStart(7)}${'added'.padStart(7)}${'after'.padStart(7)}${'upstreamFiles'.padStart(14)}${'addedWithEnglish'.padStart(17)}`);
for (const summary of summaries) {
  console.log(
    `  ${summary.collection.padEnd(11)}${String(summary.before).padStart(7)}${String(summary.added).padStart(7)}`
    + `${String(summary.after).padStart(7)}${String(summary.upstream).padStart(14)}`
    + `${String(summary.addedWithEnglish).padStart(17)}`,
  );
}
console.log(`  ${'TOTAL'.padEnd(11)}${String(totalBefore).padStart(7)}${String(totalAdded).padStart(7)}`
  + `${String(totalBefore + totalAdded).padStart(7)}`);
if (anyAbsent > 0) {
  console.error(`\nWARNING: ${anyAbsent} upstream file(s) still have no catalogue entry.`);
  process.exitCode = 1;
}
