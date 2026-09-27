import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { CanonCatalog, CollectionCode } from '../src/lib/canon/types';
import {
  loadLock,
  sourcePathFor,
  upstreamFile,
  type SourcePath,
} from '../src/lib/canon/load';
import { storeLayer, storeLayers } from '../src/lib/canon/layers';

const ROOT = process.cwd();
const lock = loadLock();
const { commit } = lock;

function loadCatalog(collection: CollectionCode): CanonCatalog {
  return JSON.parse(readFileSync(path.join(ROOT, 'content/catalog/sutta', `${collection}.json`), 'utf8')) as CanonCatalog;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const collectionIndex = args.indexOf('--collection');
  const collection = collectionIndex >= 0 ? args[collectionIndex + 1] as CollectionCode : undefined;
  return { used: args.includes('--used'), all: args.includes('--all'), force: args.includes('--force'), collection };
}

function usedTargets(): Array<{ collection: CollectionCode; uid: string; sourcePath?: string }> {
  const targets: Array<{ collection: CollectionCode; uid: string; sourcePath?: string }> = [];
  const collections: CollectionCode[] = ['dn', 'mn', 'sn', 'an', 'kn'];
  for (const collection of collections) {
    const dir = path.join(ROOT, 'content/meta/sutta', collection);
    if (!existsSync(dir)) continue;
    const catalog = loadCatalog(collection);
    for (const name of readdirSync(dir)) {
      if (!name.endsWith('.yaml')) continue;
      const uid = name.replace(/\.yaml$/, '');
      const item = catalog.texts.find((entry) => entry.uid === uid);
      if (item) targets.push({ collection, uid, sourcePath: item.sourcePath });
    }
  }
  return targets;
}

const ATTEMPTS = 4;

/** Upstream answering 404 means this edition simply does not cover this text. */
class NotCoveredError extends Error {}

async function fetchPinned(relativePath: SourcePath): Promise<string> {
  const url = `https://raw.githubusercontent.com/suttacentral/bilara-data/${commit}/${relativePath}`;
  let lastError: unknown;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { 'user-agent': 'kinh-tang-pali-build' } });
      if (response.status === 404) throw new NotCoveredError(relativePath);
      if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
      const text = await response.text();
      JSON.parse(text);
      return text.normalize('NFC');
    } catch (error) {
      if (error instanceof NotCoveredError) throw error;
      lastError = error;
      if (attempt < ATTEMPTS) await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
    }
  }
  throw new Error(`Failed ${relativePath}: ${String(lastError)} (${url})`);
}

async function syncOne(relativePath: SourcePath, force: boolean): Promise<boolean> {
  const destination = upstreamFile(relativePath);
  if (existsSync(destination) && !force) return false;
  const text = await fetchPinned(relativePath);
  mkdirSync(path.dirname(destination), { recursive: true });
  writeFileSync(destination, text, 'utf8');
  return true;
}

/** Bounded-concurrency map; GitHub raw throttles aggressively at full parallelism. */
async function pool<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index]);
    }
  });
  await Promise.all(runners);
  return results;
}

interface LayerStats {
  required: number;
  downloaded: number;
  /** Upstream has no file for these paths: this edition does not cover the text. */
  notCovered: string[];
  unmappable: string[];
  failed: Array<{ path: string; error: string }>;
}

type SyncOutcome =
  | { ok: true; downloaded: boolean }
  | { ok: false; notCovered: true }
  | { ok: false; notCovered: false; error: string };

async function syncLayer(
  label: string,
  targets: Array<{ collection: CollectionCode; uid: string; sourcePath?: string }>,
  resolve: (target: { collection: CollectionCode; uid: string; sourcePath?: string }) => string | null,
  force: boolean,
  concurrency: number,
): Promise<LayerStats> {
  const paths: SourcePath[] = [];
  const unmappable: string[] = [];
  for (const target of targets) {
    const relativePath = resolve(target);
    if (relativePath) paths.push(relativePath);
    else unmappable.push(target.uid);
  }

  const outcomes = await pool(paths, concurrency, async (relativePath): Promise<SyncOutcome> => {
    try {
      return { ok: true, downloaded: await syncOne(relativePath, force) };
    } catch (error) {
      if (error instanceof NotCoveredError) return { ok: false, notCovered: true };
      return { ok: false, notCovered: false, error: String(error) };
    }
  });

  const failed: Array<{ path: string; error: string }> = [];
  const notCovered: string[] = [];
  let downloaded = 0;
  outcomes.forEach((outcome, index) => {
    if (outcome.ok) {
      if (outcome.downloaded) downloaded += 1;
    } else if (outcome.notCovered) {
      notCovered.push(paths[index]);
    } else {
      failed.push({ path: paths[index], error: outcome.error });
    }
  });

  const stats: LayerStats = { required: paths.length, downloaded, notCovered, unmappable, failed };
  const detail = [
    `${stats.required} path(s)`,
    `${stats.downloaded} downloaded`,
    stats.notCovered.length > 0 ? `${stats.notCovered.length} not covered upstream` : null,
    stats.unmappable.length > 0 ? `${stats.unmappable.length} unmappable` : null,
    stats.failed.length > 0 ? `${stats.failed.length} failed` : null,
  ].filter(Boolean).join(', ');
  console.log(`  ${label}: ${detail}`);
  return stats;
}

const args = parseArgs();
const concurrencyIndex = process.argv.indexOf('--concurrency');
const concurrency = concurrencyIndex >= 0 ? Number(process.argv[concurrencyIndex + 1]) : 12;
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 32) {
  console.error('--concurrency must be an integer between 1 and 32.');
  process.exit(2);
}
let targets: Array<{ collection: CollectionCode; uid: string; sourcePath?: string }> = [];

if (args.collection) {
  const catalog = loadCatalog(args.collection);
  targets = catalog.texts.map((entry) => ({ collection: args.collection!, uid: entry.uid, sourcePath: entry.sourcePath }));
} else if (args.used) {
  targets = usedTargets();
} else if (args.all) {
  for (const collection of ['dn', 'mn', 'sn', 'an', 'kn'] as CollectionCode[]) {
    const catalog = loadCatalog(collection);
    targets.push(...catalog.texts.map((entry) => ({ collection, uid: entry.uid, sourcePath: entry.sourcePath })));
  }
} else {
  console.error('Choose --used, --all, or --collection <dn|mn|sn|an|kn>.');
  process.exit(2);
}

if (targets.length === 0) {
  console.log('No source targets to sync.');
  process.exit(0);
}

console.log(`Syncing pinned bilara-data commit ${commit.slice(0, 12)} for ${targets.length} text(s)...`);

const rootStats = await syncLayer(
  'Pāli root',
  targets,
  (target) => sourcePathFor(target.collection, target.uid, target.sourcePath),
  args.force,
  concurrency,
);

// Every pinned upstream layer is a first-class part of the store: triangulation is
// part of the definition of done, so a missing English or existing-Vietnamese file
// must be as visible as a missing Pāli root rather than something a translator
// discovers by hand. Local project layers are produced here, never downloaded.
const referenceStats: Record<string, LayerStats> = {};
for (const layer of storeLayers()) {
  if (layer.location.type !== 'upstream' || layer.location.rootEdition) continue;
  const location = layer.location;
  referenceStats[layer.id] = await syncLayer(
    `store/${layer.id} (${layer.language})`,
    targets,
    (target) => {
      const pali = sourcePathFor(target.collection, target.uid, target.sourcePath);
      if (!pali) return null;
      const match = pali.match(/^(?:root\/pli\/ms|root\/[^/]+\/[^/]+)\/(sutta\/.+)_root-pli-ms\.json$/);
      if (!match) return null;
      return `${location.path}/${match[1]}${location.suffix}`;
    },
    args.force,
    concurrency,
  );
}

const totalFailed = rootStats.failed.length
  + Object.values(referenceStats).reduce((sum, stats) => sum + stats.failed.length, 0);
const totalUnmappable = rootStats.unmappable.length
  + Object.values(referenceStats).reduce((sum, stats) => sum + stats.unmappable.length, 0);

if (totalFailed > 0 || totalUnmappable > 0) {
  for (const stats of [rootStats, ...Object.values(referenceStats)]) {
    for (const failure of stats.failed) console.error(`FAILED: ${failure.path}: ${failure.error}`);
    for (const uid of stats.unmappable) console.error(`UNMAPPABLE: ${uid}: no pinned upstream path for this layer`);
  }
  process.exit(1);
}

const totalNotCovered = Object.values(referenceStats).reduce((sum, stats) => sum + stats.notCovered.length, 0);
console.log(`Pinned source ready: ${targets.length} text(s), commit ${commit.slice(0, 12)}.`);
if (totalNotCovered > 0) {
  console.log(`${totalNotCovered} path(s) are simply not covered by their edition upstream; that is a property of the snapshot, not a sync failure.`);
}
