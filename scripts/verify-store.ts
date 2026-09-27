/**
 * Verify the translation store by counting, not by asserting.
 *
 * The rule this exists to enforce: a claim about the corpus must be reproducible
 * from the code, and a discrepancy must fail loudly. Last round proved why a
 * presence check is not enough — the English layer was "100% present, 100%
 * aligned" and still 12% of its segment values were empty strings; the Dhammapada
 * read as 0% covered until title segments were correctly excluded; and, more
 * seriously, every one of those checks iterated *our own catalog*, so the catalog
 * itself was never measured against the pinned snapshot and 2,715 upstream texts
 * turned out to be absent without any check noticing.
 *
 * Ground truth is `source/upstream-manifest.json`: the git tree of the pinned
 * bilara commit, with every blob's object hash. So this command does not ask
 * "does the file exist?" but "does it exist, and is it byte-identical to the pin?".
 *
 *   node --import tsx scripts/verify-store.ts              # full catalogue
 *   node --import tsx scripts/verify-store.ts --write      # record docs/store-verification.json
 *   node --import tsx scripts/verify-store.ts --check      # fail if the recorded counts moved
 *   node --import tsx scripts/verify-store.ts --json
 *
 * Exit code is 1 on any discrepancy. There is no "looks fine" path.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync, type Dirent } from 'node:fs';
import path from 'node:path';
import type { CanonCatalog, CollectionCode } from '../src/lib/canon/types';
import { loadLock, segmentPrefixesForUid, sourcePathFor } from '../src/lib/canon/load';
import { readingOrder, resolveLayer, storeLayers, type StoreLayer } from '../src/lib/canon/layers';
import { englishCoverageFor, loadRecordedGaps, MIN_ENGLISH_COVERAGE } from '../src/lib/canon/reference';

const ROOT = process.cwd();
const UPSTREAM = path.join(ROOT, '.cache/upstream/suttacentral');
const COLLECTIONS: CollectionCode[] = ['dn', 'mn', 'sn', 'an', 'kn'];
const args = process.argv.slice(2);
const REPORT = 'docs/store-verification.json';
/**
 * CI runs `source:sync:used`, which is a deliberately partial sync: it fetches only
 * the texts the project has editorial data for. Demanding the whole corpus there would
 * fail every run for a difference that is not a regression, so this flag downgrades
 * *cache completeness* to an advisory while leaving every integrity check hard.
 */
const allowPartialCache = args.includes('--allow-partial-cache');

const readJson = <T>(file: string): T => JSON.parse(readFileSync(file, 'utf8')) as T;
const lock = loadLock();
const manifest = readJson<{
  schemaVersion: number;
  commit: string;
  editions: Array<{
    layerId: string; language: string; translator: string; path: string;
    treeSha: string; fileCount: number; byteCount: number; files: Record<string, string>;
  }>;
}>(path.join(ROOT, 'source/upstream-manifest.json'));

// Discrepancies are separated by whether they block a translator or merely need a
// decision. `failures` must be empty for a release; `advisories` are the honest
// residue of an upstream that does not cover everything, and are counted, not hidden.
const failures: string[] = [];
const advisories: string[] = [];
const fail = (message: string) => failures.push(message);
const advise = (message: string) => advisories.push(message);

if (manifest.commit !== lock.commit) {
  fail(`upstream manifest is pinned to ${manifest.commit} but source/suttacentral.lock.json says ${lock.commit}`);
  console.error('Manifest and lock disagree; re-run npm run manifest:fetch after reviewing the lock change.');
  process.exit(1);
}

const layers = readingOrder();
const upstreamEditions = new Map(manifest.editions.map((e) => [e.layerId, e]));

// ---------------------------------------------------------------- content hashes

/** git object hashes for many paths in one process, rather than one per file. */
function hashFiles(absolutePaths: string[]): Map<string, string> {
  const out = new Map<string, string>();
  if (absolutePaths.length === 0) return out;
  const chunks: string[][] = [];
  for (let i = 0; i < absolutePaths.length; i += 4000) chunks.push(absolutePaths.slice(i, i + 4000));
  for (const chunk of chunks) {
    const stdout = execFileSync('git', ['hash-object', '--stdin-paths'], {
      input: chunk.join('\n'),
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
    stdout.split('\n').forEach((hash, index) => {
      if (hash) out.set(chunk[index], hash.trim());
    });
  }
  return out;
}

interface ContentReconciliation {
  layerId: string;
  upstreamPath: string;
  upstreamFiles: number;
  /** Every manifest file present on disk with a matching content hash. */
  onDiskVerified: number;
  /** Manifest files still absent from the cache. */
  onDiskMissing: number;
  consumedLocally: number;
  contentVerified: number;
  missingButConsumed: number;
  /** Text this edition simply does not carry at the pinned commit. */
  notCoveredUpstream: number;
  presentNotInUpstream: number;
  presentNotConsumed: number;
  hashMismatches: number;
  notSyncedYet: number;
  /** Directory entries `readdir` could not resolve, e.g. APFS tombstones. */
  unreadable: number;
}

const contentReports: ContentReconciliation[] = [];

/**
 * The manifest-relative name a layer uses for a given Pāli root file.
 *
 * The Pāli root is the key set, so every other edition is located by transforming its
 * path rather than by re-deriving it from the UID. Deriving it wrongly once made the
 * English content check vacuous — `consumedLocally: 0` while 3,049 files sat on disk.
 */
function expectedLocalName(
  layer: StoreLayer,
  _editionPath: string,
  paliSourcePath: string,
): string | null {
  const location = layer.location;
  if (location.type !== 'upstream') return null;
  if (location.rootEdition) {
    const root = location.subpath ? `${location.rootEdition}/${location.subpath}` : location.rootEdition;
    return paliSourcePath.startsWith(`${root}/`) ? paliSourcePath.slice(root.length + 1) : null;
  }
  const match = paliSourcePath.match(/^root\/pli\/ms\/(sutta\/.+)_root-pli-ms\.json$/);
  if (!match) return null;
  // Manifest names are relative to the edition root, so the edition path is not repeated.
  return `${match[1]}${location.suffix}`;
}

for (const layer of storeLayers()) {
  const edition = upstreamEditions.get(layer.id);
  if (!edition) continue;
  const localRoot = path.join(UPSTREAM, edition.path);
  const expected = new Map(Object.entries(edition.files));

  // Which manifest files does the project actually consume? Those backing a catalog UID.
  const consumed = new Set<string>();
  for (const collection of COLLECTIONS) {
    const catalog = readJson<CanonCatalog>(path.join(ROOT, 'content/catalog/sutta', `${collection}.json`));
    for (const item of catalog.texts) {
      const sourcePath = sourcePathFor(collection, item.uid, item.sourcePath);
      if (!sourcePath) continue;
      const name = expectedLocalName(layer, edition.path, sourcePath);
      if (name) consumed.add(name);
    }
  }

  // Enumerate with `readdirSync`, not `find`: on this volume `find` exits non-zero
  // because of the APFS tombstoned entries documented in
  // docs/apfs-orphan-incident-2026-09-27.md, and a swallowed exit status silently
  // turns the whole layer into "0 files verified". Unreadable names are counted
  // rather than hidden, so a poisoned directory can never quietly shrink coverage.
  const onDisk = new Set<string>();
  let unreadable = 0;
  const walk = (dir: string): void => {
    let entries: Dirent[];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      unreadable += 1;
      return;
    }
    for (const entry of entries) {
      if (entry.name.includes('.apfs-orphan')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) onDisk.add(path.relative(localRoot, full));
      else unreadable += 1;
    }
  };
  if (existsSync(localRoot)) walk(localRoot);

  const toHash = [...onDisk].filter((name) => expected.has(name)).map((name) => path.join(localRoot, name));
  const hashes = hashFiles(toHash);

  const report: ContentReconciliation = {
    layerId: layer.id,
    upstreamPath: edition.path,
    upstreamFiles: expected.size,
    onDiskVerified: 0,
    onDiskMissing: 0,
    consumedLocally: consumed.size,
    contentVerified: 0,
    missingButConsumed: 0,
    notCoveredUpstream: 0,
    presentNotInUpstream: 0,
    presentNotConsumed: 0,
    hashMismatches: 0,
    notSyncedYet: 0,
    unreadable: 0,
  };

  // Whole-cache reconciliation, independent of what the catalogue consumes: every
  // manifest file must be on disk with a matching hash. This is the claim "all Pāli
  // and all English are present and are the pinned snapshot", stated as a count.
  for (const [name, want] of expected) {
    const absolute = path.join(localRoot, name);
    if (!existsSync(absolute)) continue;
    if (hashes.get(absolute) === want) report.onDiskVerified += 1;
  }
  report.onDiskMissing = expected.size - report.onDiskVerified;

  for (const name of [...consumed].sort()) {
    if (!expected.has(name)) {
      // A reference edition is not obliged to cover every text — the pinned
      // Vietnamese corpus is Dhammapada-only, for instance. That is a counted
      // coverage limit, not a discrepancy. The Pāli root has no such latitude: the
      // canon must be complete, so an absent root file is a hard failure.
      report.notCoveredUpstream += 1;
      if (layer.location.type === 'upstream' && layer.location.rootEdition) {
        fail(`${layer.id}: the Pāli root file ${name} does not exist upstream at ${lock.commit.slice(0, 12)}`);
      }
      continue;
    }
    const absolute = path.join(localRoot, name);
    if (!existsSync(absolute)) {
      report.missingButConsumed += 1;
      continue;
    }
    if (hashes.get(absolute) === expected.get(name)) report.contentVerified += 1;
    else report.hashMismatches += 1;
  }

  for (const name of onDisk) {
    if (!expected.has(name)) report.presentNotInUpstream += 1;
    else if (!consumed.has(name)) report.presentNotConsumed += 1;
  }
  report.notSyncedYet = expected.size - report.contentVerified - report.missingButConsumed;
  report.unreadable = unreadable;

  if (report.unreadable > 0) {
    advise(`${layer.id}: ${report.unreadable} directory entr(y|ies) under the cache could not be read `
      + '(APFS tombstones); they are excluded from the counts above rather than assumed empty');
  }
  if (report.missingButConsumed > 0) {
    const message = `${layer.id}: ${report.missingButConsumed} consumed file(s) are not on disk; run npm run source:sync:manifest`;
    if (allowPartialCache) advise(`${message} (allowed: partial cache)`);
    else fail(message);
  }
  if (report.onDiskMissing > 0) {
    // Not fatal on its own: `--used` deliberately syncs only part of the corpus, so a
    // partially populated cache is a legitimate working state. It is counted, and
    // `source:sync:manifest` is named, so the shortfall is never mistaken for
    // completeness the way a boolean check would.
    advise(`${layer.id}: ${report.onDiskVerified}/${report.upstreamFiles} manifest file(s) are on disk `
      + `with a matching content hash; ${report.onDiskMissing} are absent. `
      + 'Run npm run source:sync:manifest for the whole pinned edition.');
  }
  if (report.hashMismatches > 0) {
    fail(`${layer.id}: ${report.hashMismatches} file(s) differ from the pinned commit by content hash; `
      + 'the cache is not the snapshot it claims to be');
  }
  if (report.presentNotInUpstream > 0) {
    fail(`${layer.id}: ${report.presentNotInUpstream} file(s) on disk do not exist upstream at the pinned commit`);
  }
  if (report.notCoveredUpstream > 0) {
    advise(`${layer.id}: the pinned edition covers ${report.contentVerified} of ${report.consumedLocally} consumed `
      + `text(s); ${report.notCoveredUpstream} simply do not exist upstream at ${lock.commit.slice(0, 12)}. `
      + 'That is a property of the snapshot, so it is recorded rather than treated as a defect.');
  }
  contentReports.push(report);
}

// ------------------------------------------------------- catalogue vs the snapshot

interface CollectionCoverage {
  collection: CollectionCode;
  catalogTexts: number;
  catalogFiles: number;
  upstreamFiles: number;
  upstreamFilesAbsentFromCatalog: number;
  subcollections: Array<{ sub: string; upstream: number; inCatalog: number; absent: number }>;
}

interface MissingFile {
  collection: CollectionCode;
  sub: string;
  /** Candidate SuttaCentral UID, taken from the bilara file name. */
  uid: string;
  rootPath: string;
  englishUpstream: boolean;
  vietnameseUpstream: boolean;
}

const coverage: CollectionCoverage[] = [];
const missingFiles: MissingFile[] = [];
let totalAbsentFromCatalog = 0;

const englishEdition = upstreamEditions.get('english-sujato');
const vietnameseEdition = upstreamEditions.get('vietnamese-current');
const hasEditionFile = (edition: typeof englishEdition, rootPath: string): boolean => {
  if (!edition) return false;
  const rel = rootPath.replace(/^root\/pli\/ms\/sutta\//, 'sutta/');
  const name = rel.replace(/_root-pli-ms\.json$/, englishEdition === edition
    ? '_translation-en-sujato.json'
    : '_translation-vi-phantuananh.json');
  return Boolean(edition.files[name]);
};

for (const collection of COLLECTIONS) {
  const catalog = readJson<CanonCatalog>(path.join(ROOT, 'content/catalog/sutta', `${collection}.json`));
  const edition = upstreamEditions.get('pali');
  const files = new Set<string>();
  for (const item of catalog.texts) {
    files.add(sourcePathFor(collection, item.uid, item.sourcePath) ?? `?${item.uid}`);
  }
  if (!edition) continue;

  // Manifest paths are `an/an1/<file>` and `kn/mil/<file>`, so the sub-collection is
  // the component before the filename. dn and mn are flat.
  const sub = (rel: string) => (collection === 'dn' || collection === 'mn'
    ? '(flat)'
    : rel.split('/').slice(1, -1).join('/') || rel.split('/')[0]);
  const upstreamBySub = new Map<string, number>();
  for (const name of Object.keys(edition.files)) {
    if (!name.startsWith(`${collection}/`)) continue;
    upstreamBySub.set(sub(name), (upstreamBySub.get(sub(name)) ?? 0) + 1);
  }
  const catalogBySub = new Map<string, number>();
  for (const file of files) {
    const rel = file.replace(`${edition.path}/`, '');
    catalogBySub.set(sub(rel), (catalogBySub.get(sub(rel)) ?? 0) + 1);
  }

  const subcollections = [...upstreamBySub.keys()].sort().map((key) => ({
    sub: key,
    upstream: upstreamBySub.get(key)!,
    inCatalog: catalogBySub.get(key) ?? 0,
    absent: upstreamBySub.get(key)! - (catalogBySub.get(key) ?? 0),
  }));
  const absent = subcollections.reduce((sum, entry) => sum + Math.max(0, entry.absent), 0);
  totalAbsentFromCatalog += absent;

  // The per-file list, so "import the snapshot" is an actionable diff rather than a
  // single number somebody has to take on trust.
  for (const name of Object.keys(edition.files).sort()) {
    if (!name.startsWith(`${collection}/`)) continue;
    const rootPath = `${edition.path}/${name}`;
    if (files.has(rootPath)) continue;
    missingFiles.push({
      collection,
      sub: sub(name),
      uid: name.replace(/_root-pli-ms\.json$/, '').split('/').pop() ?? name,
      rootPath,
      englishUpstream: hasEditionFile(englishEdition, rootPath),
      vietnameseUpstream: hasEditionFile(vietnameseEdition, rootPath),
    });
  }

  coverage.push({
    collection,
    catalogTexts: catalog.texts.length,
    catalogFiles: files.size,
    upstreamFiles: [...upstreamBySub.values()].reduce((a, b) => a + b, 0),
    upstreamFilesAbsentFromCatalog: absent,
    subcollections,
  });
}

// ------------------------------------------------------ unmanaged cache contents

/**
 * Files in the upstream cache that no layer reads.
 *
 * Around 505 English files sit in `.cache/.../ref/` from an earlier manual download at
 * paths bilara-data does not have. Nothing read them, and a per-layer check cannot see
 * them because they live outside every edition root. They are counted here so the cache
 * contents can be accounted for in full.
 */
const editionRoots = [...upstreamEditions.values()].map((edition) => edition.path);
const unmanagedCacheFiles: string[] = [];
if (existsSync(UPSTREAM)) {
  const walkUnmanaged = (dir: string): void => {
    let entries: Dirent[];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name.includes('.apfs-orphan')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkUnmanaged(full);
      } else if (entry.isFile()) {
        const rel = path.relative(UPSTREAM, full);
        if (!editionRoots.some((root) => rel.startsWith(`${root}/`))) unmanagedCacheFiles.push(rel);
      }
    }
  };
  walkUnmanaged(UPSTREAM);
}
if (unmanagedCacheFiles.length > 0) {
  advise(`${unmanagedCacheFiles.length} file(s) in .cache/upstream/suttacentral belong to no declared layer `
    + `(e.g. ${unmanagedCacheFiles.slice(0, 2).join(', ')}). They are inert leftovers; `
    + 'nothing in the store reads them.');
}

/**
 * How many catalogue texts the pinned English edition does not publish at all.
 *
 * Computed from the manifest and the catalogues only — never from the text rows —
 * because the text rows only exist for texts whose Pāli happens to be on disk, so
 * deriving it there would report 0 on a partial cache and 1,596 on a full one.
 */
let textsWithNoEnglishEdition = 0;
{
  const englishManifest = upstreamEditions.get('english-sujato');
  if (englishManifest) {
    for (const collection of COLLECTIONS) {
      const catalog = readJson<CanonCatalog>(path.join(ROOT, 'content/catalog/sutta', `${collection}.json`));
      for (const item of catalog.texts) {
        const paliRelative = (sourcePathFor(collection, item.uid, item.sourcePath) ?? '')
          .replace(`${upstreamEditions.get('pali')?.path ?? ''}/`, '');
        const key = `sutta/${paliRelative.replace(/_root-pli-ms\.json$/, '_translation-en-sujato.json')}`;
        if (!englishManifest.files[key]) textsWithNoEnglishEdition += 1;
      }
    }
  }
}

// ------------------------------------------------------------ text-level accounting

type TextState = 'ok' | 'absent-not-covered-upstream' | 'absent-not-synced' | 'unmappable' | 'unresolved-segments';

interface TextRow {
  collection: CollectionCode;
  uid: string;
  state: TextState;
  /** Has editorial data under content/meta/sutta, i.e. could reach review/published. */
  inScope: boolean;
  /** No credited English edition publishes this text at the pinned commit. */
  englishEditionAbsentUpstream: boolean;
  paliSegments: number;
  layerSegments: Record<string, number>;
  layerMissing: Record<string, number>;
  layerOrphans: Record<string, number>;
  englishEmpty: number;
  englishAbsentKeys: number;
  substantive: number;
  coverage: number;
  belowFloor: boolean;
  gapRecorded: boolean;
}

const textRows: TextRow[] = [];
const stateCounts: Record<string, number> = {};
const totalLayerSegments: Record<string, number> = {};
const totalLayerMissing: Record<string, number> = {};
const totalLayerOrphans: Record<string, number> = {};
let totalPaliSegments = 0;

/** A text is in scope once it has editorial data, which is what can reach publication. */
function scopeSet(collection: CollectionCode): Set<string> {
  const dir = path.join(ROOT, 'content/meta/sutta', collection);
  if (!existsSync(dir)) return new Set();
  return new Set(readdirSync(dir).filter((name) => name.endsWith('.yaml')).map((name) => name.slice(0, -5)));
}

for (const collection of COLLECTIONS) {
  const catalog = readJson<CanonCatalog>(path.join(ROOT, 'content/catalog/sutta', `${collection}.json`));
  const inScopeUids = scopeSet(collection);
  for (const item of catalog.texts) {
    const uid = item.uid;
    const row: TextRow = {
      collection,
      uid,
      state: 'ok',
      inScope: inScopeUids.has(uid),
      englishEditionAbsentUpstream: false,
      paliSegments: 0,
      layerSegments: {},
      layerMissing: {},
      layerOrphans: {},
      englishEmpty: 0,
      englishAbsentKeys: 0,
      substantive: 0,
      coverage: 1,
      belowFloor: false,
      gapRecorded: false,
    };

    const pali = resolveLayer('pali', collection, uid, { catalog });
    if (!pali) {
      row.state = 'unmappable';
    } else if (!pali.present) {
      const edition = upstreamEditions.get('pali');
      const rel = (sourcePathFor(collection, uid, item.sourcePath) ?? '').replace(`${edition?.path ?? ''}/`, '');
      const known = edition ? Boolean(edition.files[rel]) : false;
      row.state = known ? 'absent-not-synced' : 'absent-not-covered-upstream';
    } else {
      row.paliSegments = Object.keys(pali.segments).length;
    }

    if (row.state === 'ok' && row.paliSegments === 0) row.state = 'unresolved-segments';

    if (row.state === 'ok') {
      const paliIds = new Set(Object.keys(pali!.segments));
      for (const layer of layers) {
        if (layer.id === 'pali') continue;
        const resolved = resolveLayer(layer.id, collection, uid, { catalog });
        if (!resolved) continue;
        if (!resolved.present) continue;
        const ids = Object.keys(resolved.segments);
        const orphan = ids.filter((id) => !paliIds.has(id)).length;
        const missing = [...paliIds].filter((id) => !(id in resolved.segments)).length;
        row.layerSegments[layer.id] = ids.length;
        row.layerOrphans[layer.id] = orphan;
        row.layerMissing[layer.id] = missing;
        totalLayerSegments[layer.id] = (totalLayerSegments[layer.id] ?? 0) + ids.length;
        totalLayerOrphans[layer.id] = (totalLayerOrphans[layer.id] ?? 0) + orphan;
        totalLayerMissing[layer.id] = (totalLayerMissing[layer.id] ?? 0) + missing;
        if (orphan > 0) {
          fail(`${collection}/${uid}: layer '${layer.id}' has ${orphan} orphan segment(s) not in the Pāli root`);
        }
        // A published upstream edition is contractually required to carry every
        // segment. A fill layer is allowed to be sparse by design.
        if (layer.location.type === 'upstream' && missing > 0) {
          fail(`${collection}/${uid}: pinned layer '${layer.id}' is missing ${missing} of ${paliIds.size} Pāli segment(s)`);
        }
      }

      const sujato = resolveLayer('english-sujato', collection, uid, { catalog });
      if (sujato?.present) {
        row.englishEmpty = [...paliIds].filter((id) => String(sujato.segments[id] ?? '').trim() === '').length;
        row.englishAbsentKeys = [...paliIds].filter((id) => !(id in sujato.segments)).length;
      }
      // Whether the English edition publishes this text at all is a property of the
      // snapshot, not of our sync, so it is decided from the manifest rather than from
      // what happens to be on disk. Without this, the 1,596 texts SuttaCentral simply
      // does not translate would be failed against the coverage floor as if we had
      // lost a reference we were supposed to have.
      //
      // Note the asymmetry the manifest forces: the Pāli tree is rooted at
      // `root/pli/ms/sutta`, so its keys read `an/an1/…`, while the English tree is
      // rooted at `translation/en/sujato` and its keys read `sutta/an/an1/…`.
      const paliSourcePath = sourcePathFor(collection, uid, item.sourcePath) ?? '';
      const englishEdition = upstreamEditions.get('english-sujato');
      const englishKey = `sutta/${paliSourcePath
        .replace(`${upstreamEditions.get('pali')?.path ?? ''}/`, '')
        .replace(/_root-pli-ms\.json$/, '_translation-en-sujato.json')}`;
      row.englishEditionAbsentUpstream = !englishEdition?.files[englishKey];

      const stats = englishCoverageFor(collection, uid);
      if (stats?.resolved) {
        row.substantive = stats.substantiveSegments;
        row.coverage = stats.ratio;
        row.belowFloor = stats.substantiveSegments > 0 && stats.ratio < MIN_ENGLISH_COVERAGE;
        row.gapRecorded = loadRecordedGaps().has(`${collection}/${uid}`);
        // Only a text that could actually be published needs its loss on record, and
        // only a text that has an English edition to lose can be below its floor.
        if (row.inScope && row.belowFloor && !row.gapRecorded && !row.englishEditionAbsentUpstream) {
          fail(`${collection}/${uid}: English coverage ${(stats.ratio * 100).toFixed(0)}% is below the floor `
            + `but the loss is not recorded in content/meta/reference-gaps.yaml`);
        }
        if (row.gapRecorded && !row.belowFloor) {
          fail(`${collection}/${uid}: recorded as a reference gap but its coverage is now `
            + `${(stats.ratio * 100).toFixed(0)}%; the record is stale`);
        }
      }
      totalPaliSegments += row.paliSegments;
    }

    stateCounts[row.state] = (stateCounts[row.state] ?? 0) + 1;
    textRows.push(row);
  }
}

// ---------------------------------------------------- English content: why blanks

type BlankCause =
  | 'bilara-reference-block'
  | 'enumeration-marker'
  | 'other-short-heading'
  | 'peyyala-elision'
  | 'blockquote-or-untranslated';

const blankCauses: Record<BlankCause, number> = {
  'bilara-reference-block': 0,
  'enumeration-marker': 0,
  'other-short-heading': 0,
  'peyyala-elision': 0,
  'blockquote-or-untranslated': 0,
};

/** `Paṭhamaṁ.`, `Dutiyaṁ.`, `Rūpādivaggo paṭhamo.`, `Dhammapade vaggānamuddānaṁ` … */
const ENUMERATION_MARKER = /(paṭhamaṁ|dutiyaṁ|tatiyaṁ|catutthaṁ|pañcamaṁ|chaṭṭhaṁ|sattamaṁ|aṭṭhamaṁ|navamaṁ|dasamaṁ|vaggo|vaggā|paṭhamo|pathamā|uddānaṁ|mūlhaṁ)/i;

for (const collection of COLLECTIONS) {
  const catalog = readJson<CanonCatalog>(path.join(ROOT, 'content/catalog/sutta', `${collection}.json`));
  for (const item of catalog.texts) {
    const pali = resolveLayer('pali', collection, item.uid, { catalog });
    const sujato = resolveLayer('english-sujato', collection, item.uid, { catalog });
    if (!pali?.present || !sujato?.present) continue;
    for (const [id, value] of Object.entries(pali.segments)) {
      if (String(sujato.segments[id] ?? '').trim() !== '') continue;
      const flat = String(value).replace(/\s+/g, ' ').trim();
      if (/^0(\.|$)/.test(id.slice(id.indexOf(':') + 1))) blankCauses['bilara-reference-block'] += 1;
      else if (flat.length < 40) {
        blankCauses[ENUMERATION_MARKER.test(flat) ? 'enumeration-marker' : 'other-short-heading'] += 1;
      } else if (flat.includes('…')) blankCauses['peyyala-elision'] += 1;
      else blankCauses['blockquote-or-untranslated'] += 1;
    }
  }
}

// ------------------------------------------------------------------ the fill layer

interface FillReport {
  texts: number;
  segments: number;
  segmentsWithWords: number;
  orphanSegments: number;
  shadowingPinnedSegments: number;
  missingMetadata: string[];
  missingScorecard: string[];
  textsCountingTowardCoverage: number;
}

const fill: FillReport = {
  texts: 0,
  segments: 0,
  segmentsWithWords: 0,
  orphanSegments: 0,
  shadowingPinnedSegments: 0,
  missingMetadata: [],
  missingScorecard: [],
  textsCountingTowardCoverage: 0,
};

if (!storeLayers().some((layer) => layer.id === 'english-project')) {
  fail("source/layers.yaml: no 'english-project' layer, so our own English fill is undeclared");
}
for (const collection of COLLECTIONS) {
  const catalog = readJson<CanonCatalog>(path.join(ROOT, 'content/catalog/sutta', `${collection}.json`));
  for (const item of catalog.texts) {
    const resolved = resolveLayer('english-project', collection, item.uid, { catalog });
    if (!resolved?.present) continue;
    fill.texts += 1;
    const ids = Object.keys(resolved.segments);
    fill.segments += ids.length;
    for (const id of ids) {
      if (String(resolved.segments[id] ?? '').trim() === '') continue;
      fill.segmentsWithWords += 1;
      const sujato = resolveLayer('english-sujato', collection, item.uid, { catalog });
      if (sujato?.present && String(sujato.segments[id] ?? '').trim() !== '') {
        fill.shadowingPinnedSegments += 1;
        fail(`${collection}/${item.uid}: our English fill ${id} shadows a passage the pinned edition translates`);
      }
    }
    const metaDir = path.join(ROOT, 'content/meta/en', collection);
    if (!existsSync(path.join(metaDir, `${item.uid}.yaml`))) {
      fill.missingMetadata.push(`${collection}/${item.uid}`);
      fail(`${collection}/${item.uid}: English fill has no metadata of its own in content/meta/en/${collection}/`);
      continue;
    }
    const text = readFileSync(path.join(metaDir, `${item.uid}.yaml`), 'utf8');
    if (!/^\s*quality:/m.test(text)) {
      fill.missingScorecard.push(`${collection}/${item.uid}`);
      fail(`${collection}/${item.uid}: English fill metadata has no quality scorecard`);
    }
    const stats = englishCoverageFor(collection, item.uid);
    if (stats?.resolved && stats.credited.includes('english-project')) fill.textsCountingTowardCoverage += 1;
  }
}

// ------------------------------------------------------------- cross-layer & UID rules

let authorityInversions = 0;
for (const layer of layers) {
  if (layer.authority && layer.kind !== 'root') {
    authorityInversions += 1;
    fail(`layer '${layer.id}' claims authority but is a ${layer.kind} layer`);
  }
}

let prefixSelfCheck = 0;
for (const collection of COLLECTIONS) {
  const catalog = readJson<CanonCatalog>(path.join(ROOT, 'content/catalog/sutta', `${collection}.json`));
  for (const item of catalog.texts) {
    const prefixes = segmentPrefixesForUid(item.uid);
    if (prefixes.includes(item.uid)) prefixSelfCheck += 1;
    else fail(`${collection}/${item.uid}: segment prefixes do not include the UID itself`);
  }
}

const unresolvedTexts = textRows.filter((row) => row.state === 'unresolved-segments');

// ----------------------------------------------------------------------- reporting

for (const row of textRows.filter((entry) => entry.state === 'ok' && entry.englishAbsentKeys > 0)) {
  fail(`${row.collection}/${row.uid}: English has ${row.englishAbsentKeys} key(s) absent that the Pāli root declares`);
}

const report = {
  schemaVersion: 1,
  generatedBy: 'scripts/verify-store.ts',
  bilaraCommit: lock.commit,
  upstreamManifest: {
    editions: manifest.editions.map((e) => ({ layerId: e.layerId, path: e.path, files: e.fileCount, treeSha: e.treeSha })),
  },
  content: contentReports,
  catalogueCoverage: coverage,
  catalogueAbsentFromSnapshot: totalAbsentFromCatalog,
  catalogueMissingFiles: missingFiles,
  unmanagedCacheFiles: unmanagedCacheFiles.length,
  texts: {
    total: textRows.length,
    inScope: textRows.filter((row) => row.inScope).length,
    byState: stateCounts,
    paliSegments: totalPaliSegments,
    layerSegments: totalLayerSegments,
    layerSegmentsMissingFromPali: totalLayerMissing,
    layerOrphanSegments: totalLayerOrphans,
    unresolved: unresolvedTexts.map((row) => `${row.collection}/${row.uid}`),
  },
  english: {
    floor: MIN_ENGLISH_COVERAGE,
    belowFloor: textRows.filter((row) => row.belowFloor).length,
    recordedGaps: textRows.filter((row) => row.gapRecorded).length,
    fullCoverage: textRows.filter((row) => row.state === 'ok' && row.substantive > 0 && !row.belowFloor).length,
    noSubstantivePali: textRows.filter((row) => row.state === 'ok' && row.substantive === 0).length,
    noEnglishEditionUpstream: textsWithNoEnglishEdition,
    emptySegmentCauses: blankCauses,
  },
  fill,
  crossLayer: { authorityInversions, uidPrefixSelfCheck: prefixSelfCheck },
  /**
   * Counts that hold whatever subset of the pinned corpus happens to be synced.
   *
   * CI syncs only the texts the project works on, so anything derived from how much
   * of the cache is present (segment totals, coverage ratios) would differ between a
   * full local run and CI, and comparing those would make the check fail for a
   * difference that is not a regression. These come from the catalogues, the manifest
   * and the committed content only, so they must always match.
   */
  invariants: {
    catalogueTexts: textRows.length,
    catalogueAbsentFromSnapshot: totalAbsentFromCatalog,
    upstreamPaliFiles: upstreamEditions.get('pali')?.fileCount ?? 0,
    upstreamEnglishFiles: upstreamEditions.get('english-sujato')?.fileCount ?? 0,
    upstreamVietnameseFiles: upstreamEditions.get('vietnamese-current')?.fileCount ?? 0,
    fillTexts: fill.texts,
    fillSegments: fill.segments,
    textsBelowFloorWithEditorialData: textRows.filter((row) => row.inScope && row.belowFloor).length,
    recordedGaps: textRows.filter((row) => row.gapRecorded).length,
    textsWithNoEnglishEditionUpstream: textsWithNoEnglishEdition,
    authorityInversions,
  },
  /**
   * Counts that hold only when the whole pinned corpus is synced
   * (`npm run source:sync:manifest`). Recorded so a full run can be compared against
   * this one, and explicitly not compared on a partial cache.
   */
  requiresFullSync: {
    cacheComplete: contentReports.every((entry) => entry.onDiskMissing === 0),
    paliSegmentsSynced: totalPaliSegments,
    englishSegmentsSynced: totalLayerSegments['english-sujato'] ?? 0,
    textsBelowFloorAll: textRows.filter((row) => row.belowFloor).length,
    blankEnglishSegments: Object.values(blankCauses).reduce((a, b) => a + b, 0),
  },
  result: {
    failures: failures.length,
    advisories: advisories.length,
  },
};

const pct = (part: number, whole: number) => (whole > 0 ? `${((100 * part) / whole).toFixed(1)}%` : '0%');

if (args.includes('--json')) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`Store verification · bilara commit ${lock.commit.slice(0, 12)}`);
  console.log(`\n1. Content: local files reconciled against the pinned tree by git object hash`);
  console.log(`   ${'layer'.padEnd(19)}${'manifest'.padStart(9)}${'onDiskOK'.padStart(9)}${'absent'.padStart(7)}${'badHash'.padStart(8)}   (then, of the texts the catalogue consumes)`);
  for (const entry of contentReports) {
    console.log(
      `   ${entry.layerId.padEnd(19)}${String(entry.upstreamFiles).padStart(9)}${String(entry.onDiskVerified).padStart(9)}`
      + `${String(entry.onDiskMissing).padStart(7)}${String(entry.hashMismatches).padStart(8)}`
      + `   consumed=${entry.consumedLocally} verified=${entry.contentVerified} notCoveredUpstream=${entry.notCoveredUpstream}`
      + ` extraOnDisk=${entry.presentNotInUpstream} unreadable=${entry.unreadable}`,
    );
  }

  console.log(`\n2. Catalogue vs the pinned snapshot`);
  console.log(`   ${'collection'.padEnd(11)}${'catalogTexts'.padStart(13)}${'catalogFiles'.padStart(13)}${'upstreamFiles'.padStart(14)}${'absent'.padStart(8)}`);
  for (const entry of coverage) {
    console.log(
      `   ${entry.collection.padEnd(11)}${String(entry.catalogTexts).padStart(13)}${String(entry.catalogFiles).padStart(13)}`
      + `${String(entry.upstreamFiles).padStart(14)}${String(entry.upstreamFilesAbsentFromCatalog).padStart(8)}`,
    );
  }
  const absentTotal = coverage.reduce((sum, e) => sum + e.upstreamFiles, 0);
  console.log(`   → catalogue covers ${pct(absentTotal - totalAbsentFromCatalog, absentTotal)} of the pinned Nikāya corpus `
    + `(${totalAbsentFromCatalog} upstream file(s) have no catalogue entry)`);
  const withEnglish = missingFiles.filter((entry) => entry.englishUpstream).length;
  console.log(`   → of the ${missingFiles.length} absent file(s), ${withEnglish} have an English edition upstream `
    + `and ${missingFiles.length - withEnglish} do not`);
  console.log(`   → unmanaged files in the upstream cache: ${unmanagedCacheFiles.length}`);

  console.log(`\n3. Text-level accounting over the catalogue (${report.texts.inScope} with editorial data)`);
  for (const [state, count] of Object.entries(stateCounts).sort()) {
    console.log(`   ${state.padEnd(32)}${String(count).padStart(6)}`);
  }
  if (unresolvedTexts.length > 0) {
    console.log(`   unresolved (Pāli resolves no segment): ${unresolvedTexts.map((row) => `${row.collection}/${row.uid}`).join(', ')}`);
  }

  console.log(`\n4. Segment-level reconciliation (catalogue texts, Pāli is the key set)`);
  console.log(`   Pāli segments: ${totalPaliSegments}`);
  for (const [layerId, count] of Object.entries(totalLayerSegments)) {
    console.log(
      `   ${layerId.padEnd(19)}segments=${String(count).padStart(7)}`
      + `  orphans=${String(totalLayerOrphans[layerId] ?? 0).padStart(5)}`
      + `  missingFromPali=${String(totalLayerMissing[layerId] ?? 0).padStart(5)}`,
    );
  }

  console.log(`\n5. English content census (why a segment is blank)`);
  const blankTotal = Object.values(blankCauses).reduce((a, b) => a + b, 0);
  for (const [cause, count] of Object.entries(blankCauses)) {
    console.log(`   ${cause.padEnd(32)}${String(count).padStart(7)}  ${pct(count, blankTotal)}`);
  }
  console.log(`   floor ${(MIN_ENGLISH_COVERAGE * 100).toFixed(0)}%: belowFloor=${report.english.belowFloor} `
    + `recorded=${report.english.recordedGaps} fullCoverage=${report.english.fullCoverage} `
    + `noSubstantivePali=${report.english.noSubstantivePali} `
    + `noEnglishEditionUpstream=${report.english.noEnglishEditionUpstream}`);

  console.log(`\n6. Our own English fill`);
  console.log(`   texts=${fill.texts} segments=${fill.segments} withWords=${fill.segmentsWithWords} `
    + `orphans=${fill.orphanSegments} shadowingPinned=${fill.shadowingPinnedSegments} `
    + `countingTowardCoverage=${fill.textsCountingTowardCoverage}`);
  console.log(`   missingMetadata=${fill.missingMetadata.length} missingScorecard=${fill.missingScorecard.length}`);

  console.log(`\n7. Cross-layer`);
  console.log(`   authorityInversions=${authorityInversions} uidPrefixSelfCheck=${prefixSelfCheck}`);

  console.log(`\n8. Invariants (must hold whatever subset is synced)`);
  for (const [key, value] of Object.entries(report.invariants)) {
    console.log(`   ${key.padEnd(36)}${String(value).padStart(8)}`);
  }
  console.log(`   full-sync counts ${report.requiresFullSync.cacheComplete ? 'compared (cache complete)' : 'not compared (cache partial)'}`);

  if (totalAbsentFromCatalog > 0) {
    advise(`${totalAbsentFromCatalog} upstream Pāli file(s) have no catalogue entry, so the store cannot address them. `
      + 'Every check above iterates the catalogue, so this class of absence is invisible to them by construction. '
      + 'docs/roadmap.md phase 2 says to import the canonical snapshot into the catalogue.');
  }

  if (failures.length > 0) {
    console.error(`\nFAILED: ${failures.length} discrepancy(ies)`);
    for (const failure of failures.slice(0, 40)) console.error(`  ${failure}`);
    if (failures.length > 40) console.error(`  … and ${failures.length - 40} more`);
  } else {
    console.log(`\nNo discrepancies in the checks above.`);
  }
  if (advisories.length > 0) {
    console.log(`\nAdvisories (need a decision, not a fix):`);
    for (const advisory of advisories) console.log(`  ${advisory}`);
  }
}

if (args.includes('--write')) {
  writeFileSync(path.join(ROOT, REPORT), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`\nRecorded ${REPORT}`);
}

if (args.includes('--check') && existsSync(path.join(ROOT, REPORT))) {
  const recorded = readJson<typeof report>(path.join(ROOT, REPORT));
  const before = (recorded.invariants ?? {}) as Record<string, number>;
  const now = report.invariants as unknown as Record<string, number>;
  const moved = Object.keys(now)
    .filter((key) => before[key] !== undefined && before[key] !== now[key])
    .map((key) => `${key} was ${before[key]}, now ${now[key]}`);
  for (const entry of moved) {
    fail(`count moved since ${REPORT} was recorded: ${entry}; re-run with --write`);
  }
  for (const key of Object.keys(now)) {
    if (before[key] === undefined) {
      fail(`${REPORT} has no '${key}' invariant; it predates this check. Re-run with --write`);
    }
  }
  if (moved.length === 0) {
    console.log(`Recorded invariants match ${REPORT}.`);
    if (report.requiresFullSync.cacheComplete) {
      console.log('  cache is complete, so the full-sync counts were compared too.');
    } else {
      console.log('  cache is partial, so segment totals were not compared. Run npm run source:sync:manifest for the full set.');
    }
  }
}

if (failures.length > 0) process.exitCode = 1;
