import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { CanonCatalog, CollectionCode } from '../src/lib/canon/types';
import { sourcePathFor } from '../src/lib/canon/load';

const ROOT = process.cwd();
const lock = JSON.parse(readFileSync(path.join(ROOT, 'source/suttacentral.lock.json'), 'utf8')) as {
  commit: string;
};

function loadCatalog(collection: CollectionCode): CanonCatalog {
  return JSON.parse(readFileSync(path.join(ROOT, 'content/catalog/sutta', `${collection}.json`), 'utf8')) as CanonCatalog;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const collectionIndex = args.indexOf('--collection');
  const collection = collectionIndex >= 0 ? args[collectionIndex + 1] as CollectionCode : undefined;
  return { used: args.includes('--used'), force: args.includes('--force'), collection };
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

async function syncOne(target: { collection: CollectionCode; uid: string; sourcePath?: string }, force: boolean) {
  const sourcePath = sourcePathFor(target.collection, target.uid, target.sourcePath);
  if (!sourcePath) {
    throw new Error(`No deterministic SuttaCentral source path for ${target.uid}; add sourcePath to its canonical catalog entry.`);
  }
  const destination = path.join(ROOT, '.cache/upstream/suttacentral', sourcePath);
  if (existsSync(destination) && !force) return { uid: target.uid, cached: true };

  const url = `https://raw.githubusercontent.com/suttacentral/bilara-data/${lock.commit}/${sourcePath}`;
  const response = await fetch(url, { headers: { 'user-agent': 'kinh-tang-pali-build' } });
  if (!response.ok) throw new Error(`Failed ${target.uid}: ${response.status} ${response.statusText} (${url})`);
  const text = await response.text();
  JSON.parse(text);
  mkdirSync(path.dirname(destination), { recursive: true });
  writeFileSync(destination, text.normalize('NFC'), 'utf8');
  return { uid: target.uid, cached: false };
}

const args = parseArgs();
let targets: Array<{ collection: CollectionCode; uid: string; sourcePath?: string }> = [];

if (args.collection) {
  const catalog = loadCatalog(args.collection);
  targets = catalog.texts.map((entry) => ({ collection: args.collection!, uid: entry.uid, sourcePath: entry.sourcePath }));
} else if (args.used) {
  targets = usedTargets();
} else {
  console.error('Choose --used or --collection <dn|mn|sn|an|kn>.');
  process.exit(2);
}

if (targets.length === 0) {
  console.log('No source targets to sync.');
  process.exit(0);
}

let downloaded = 0;
for (const target of targets) {
  const result = await syncOne(target, args.force);
  if (!result.cached) downloaded += 1;
}
console.log(`Pinned source ready: ${targets.length} text(s), ${downloaded} downloaded, commit ${lock.commit.slice(0, 12)}.`);
