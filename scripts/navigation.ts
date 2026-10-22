/**
 * Generate and check the traditional navigation tree of SN, AN and KN.
 *
 *   npm run navigation:generate   build from the pinned cache, write content/navigation/traditional/*.json
 *   npm run navigation:check      rebuild in memory and compare; exit 1 on any difference, write nothing
 *   npm run navigation:check -- --reference   also re-download the reference TOC pages and check
 *                                             every recorded entry is still there verbatim
 *
 * Inputs, all pinned: the tree and name files in `source/navigation.lock.json` (each re-hashed
 * here before use), the catalogues, the bilara Pāli cache (for bundle order and headings), the
 * project's own translation headings, and `content/navigation/names/vi-reference.yaml`.
 * `generate` writes nothing unless all three collections build without a problem, and writes each
 * file through a temporary file, so a failure leaves the previous valid output in place.
 */
import { existsSync, readFileSync, renameSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { loadCatalog, loadMeta, segmentBelongsToUid, upstreamFile } from '../src/lib/canon/load';
import type { CatalogText } from '../src/lib/canon/types';
import {
  NAVIGATION_COLLECTIONS,
  type NavigationCollection,
  type NavigationCollectionCode,
  type SourceRef,
  type VietnameseName,
} from '../src/lib/canon/navigation-types';
import {
  gitBlobHash,
  loadNavigationLock,
  navigationCacheFile,
  sha256,
  type NavigationLock,
} from '../src/lib/canon/navigation-source';
import {
  buildNavigation,
  checkNavigation,
  NavigationError,
  sourceKeyOf,
  type HeadingResult,
  type NameSources,
  type TreeFile,
} from './lib/navigation-build';

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, 'content/navigation/traditional');
const REFERENCE_NAMES = 'content/navigation/names/vi-reference.yaml';
const HEADING_EXCLUSIONS = 'content/navigation/names/heading-exclusions.yaml';
export const UPSTREAM_PREFIX = 'sc-data:';

export function outputPath(collection: NavigationCollectionCode): string {
  return path.join(OUTPUT_DIR, `${collection}.json`);
}

/** Read a locked file from the cache, refusing it unless its bytes are the ones the lock records. */
export function readLocked(lock: NavigationLock, relative: string, cacheDir?: string): unknown {
  const entry = lock.files.find((file) => file.path === relative);
  if (!entry) throw new Error(`${relative}: not listed in source/navigation.lock.json`);
  const full = navigationCacheFile(relative, cacheDir);
  if (!existsSync(full)) throw new Error(`${relative}: missing from .cache/upstream/sc-data-navigation — run: npm run navigation:sync`);
  const bytes = readFileSync(full);
  if (sha256(bytes) !== entry.sha256 || gitBlobHash(bytes) !== entry.gitBlob) {
    throw new Error(`${relative}: cached bytes differ from the lock (SHA-256 or git blob) — run: npm run navigation:sync`);
  }
  return JSON.parse(bytes.toString('utf8'));
}

/**
 * Typographic normalisation of SuttaCentral's Vietnamese site names, each change stated on the
 * name it touched. `Ð` (U+00D0) is a legacy encoding of `Đ` (U+0110); `(Pali)` tells SuttaCentral's
 * menu the Pāli collection from its Chinese parallel and says nothing on a Pāli-only site; and one
 * entry starts in lower case. No word is changed.
 */
export function normalizeSiteName(raw: string): { text: string; normalized: string[] } {
  const normalized: string[] = [];
  let text = raw.normalize('NFC').trim();
  if (text.includes('\u00d0')) { text = text.replace(/\u00d0/g, '\u0110'); normalized.push('Ð (U+00D0) → Đ (U+0110)'); }
  if (/\s*\(Pali\)$/.test(text)) { text = text.replace(/\s*\(Pali\)$/, ''); normalized.push('bỏ hậu tố "(Pali)"'); }
  if (text && text[0] !== text[0].toLocaleUpperCase('vi')) { text = text[0].toLocaleUpperCase('vi') + text.slice(1); normalized.push('viết hoa chữ đầu'); }
  return { text, normalized };
}

function nameMap(lock: NavigationLock, role: 'name-root' | 'name-vi'): Map<string, { text: string; from: SourceRef; normalized?: string[] }> {
  const out = new Map<string, { text: string; from: SourceRef; normalized?: string[] }>();
  for (const file of lock.files.filter((entry) => entry.role === role)) {
    const data = readLocked(lock, file.path) as Record<string, string>;
    for (const [key, value] of Object.entries(data)) {
      const match = key.match(/^[^:]+:\d+\.(.+)$/);
      if (!match) throw new Error(`${file.path}: unexpected name key ${key}`);
      const { text, normalized } = role === 'name-vi' ? normalizeSiteName(value) : { text: value.normalize('NFC').trim(), normalized: [] };
      if (!text) continue;
      // The collection's own registry is more specific than super-name; keep the first one read
      // only when the later one is the generic registry.
      if (!out.has(match[1]) || !file.path.includes('/super-name')) {
        out.set(match[1], { text, from: { path: `${UPSTREAM_PREFIX}${file.path}`, key }, ...(normalized.length ? { normalized } : {}) });
      }
    }
  }
  return out;
}

interface ReferenceFile {
  sources: Record<string, { url: string; author: string; retrievedAt: string; lastModified: string; sha256: string; license: string }>;
  names: Record<string, { text: string; source: string; entry: string }>;
}

export function loadReferenceNames(): ReferenceFile {
  return YAML.parse(readFileSync(path.join(ROOT, REFERENCE_NAMES), 'utf8')) as ReferenceFile;
}

function referenceMap(): Map<string, { text: string; from: SourceRef; author: string }> {
  const file = loadReferenceNames();
  const out = new Map<string, { text: string; from: SourceRef; author: string }>();
  for (const [id, entry] of Object.entries(file.names)) {
    const source = file.sources[entry.source];
    if (!source) throw new Error(`${REFERENCE_NAMES}: ${id} cites unknown source ${entry.source}`);
    if (!source.author || !source.url || !entry.entry) throw new Error(`${REFERENCE_NAMES}: ${id} lacks author, url or verbatim entry`);
    out.set(id, { text: entry.text.normalize('NFC').trim(), from: { path: REFERENCE_NAMES, key: id }, author: source.author });
  }
  return out;
}

const headingKey = (value: string) => value.normalize('NFC').replace(/^\s*[\dIVXivx]+\.\s*/, '').replace(/[\s.,;:]+$/, '')
  .toLowerCase().replace(/ṃ/g, 'ṁ').trim();

interface HeadingExclusion { group: string; segment: string; text: string; note: string }

export function loadHeadingExclusions(): HeadingExclusion[] {
  return (YAML.parse(readFileSync(path.join(ROOT, HEADING_EXCLUSIONS), 'utf8')) as { exclusions: HeadingExclusion[] }).exclusions ?? [];
}

/**
 * The project's Vietnamese heading for a group: the segment of the group's first text whose Pāli
 * heading is the group's Pāli name, read at the same segment ID in the project's translation.
 * Exact match only — a heading that names something else (bilara's `Rūpādivagga` where the tree
 * says `Cittapariyādānavagga`) yields nothing rather than a near guess. A heading that only
 * repeats the Pāli is refused as untranslated, and one listed in the exclusion file is refused
 * with its recorded reason; `used` collects the exclusions that matched, so stale ones show.
 */
function headingResolver(
  collection: NavigationCollectionCode,
  catalog: readonly CatalogText[],
  exclusions: readonly HeadingExclusion[],
  used: Set<HeadingExclusion>,
): NameSources['heading'] {
  const byUid = new Map(catalog.map((text) => [text.uid, text]));
  return (groupId, paliName, firstUid): HeadingResult => {
    const text = byUid.get(firstUid);
    if (!text?.sourcePath) return null;
    const paliFile = upstreamFile(text.sourcePath);
    if (!existsSync(paliFile)) throw new Error(`${text.sourcePath}: pinned Pāli missing from the cache — run: npm run source:sync:manifest`);
    const pali = JSON.parse(readFileSync(paliFile, 'utf8')) as Record<string, string>;
    const wanted = headingKey(paliName);
    const key = Object.keys(pali).find((id) => segmentBelongsToUid(firstUid, id) && /:0\.\d+$/.test(id) && headingKey(pali[id]) === wanted);
    if (!key) return null;
    const relative = `content/translation/vi/project/sutta/${collection}/${firstUid}_translation-vi-project.json`;
    const file = path.join(ROOT, relative);
    if (!existsSync(file)) return null;
    const vi = (JSON.parse(readFileSync(file, 'utf8')) as Record<string, string>)[key];
    if (!vi) return null;
    const value = vi.normalize('NFC').replace(/^\s*\d+\.\s*/, '').trim();
    if (!value) return null;
    const from = { path: relative, key };
    if (headingKey(value) === wanted) return { rejected: { text: value, from, reason: 'untranslated' } };
    const exclusion = exclusions.find((entry) => entry.group === groupId && entry.segment === key && entry.text === value);
    if (exclusion) {
      used.add(exclusion);
      return { rejected: { text: value, from, reason: 'excluded', note: exclusion.note } };
    }
    return { name: { text: value, origin: 'project-heading', from, status: loadMeta(collection, firstUid)?.status ?? 'not-started' } };
  };
}

function segmentKeysFor(catalog: readonly CatalogText[]): (sourceKey: string) => string[] {
  const pathOf = new Map(catalog.map((text) => [sourceKeyOf(text), text.sourcePath!]));
  return (sourceKey) => {
    const relative = pathOf.get(sourceKey);
    if (!relative) return [];
    const file = upstreamFile(relative);
    if (!existsSync(file)) throw new Error(`${relative}: pinned Pāli missing from the cache — run: npm run source:sync:manifest`);
    return Object.keys(JSON.parse(readFileSync(file, 'utf8')));
  };
}

function findNode(value: unknown, key: string): unknown {
  if (Array.isArray(value)) {
    for (const child of value) {
      const found = findNode(child, key);
      if (found !== undefined) return found;
    }
  } else if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (key in record) return record[key];
    for (const child of Object.values(record)) {
      const found = findNode(child, key);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

export function buildAll(lock = loadNavigationLock()): Record<NavigationCollectionCode, NavigationCollection> {
  const pali = nameMap(lock, 'name-root');
  const site = nameMap(lock, 'name-vi');
  const reference = referenceMap();
  const exclusions = loadHeadingExclusions();
  const usedExclusions = new Set<HeadingExclusion>();
  const treeFile = (work: string) => `structure/tree/sutta/${work}-tree.json`;
  const out = {} as Record<NavigationCollectionCode, NavigationCollection>;
  for (const collection of NAVIGATION_COLLECTIONS) {
    const catalog = loadCatalog(collection).texts;
    let trees: TreeFile[];
    let rootTreePath: string | undefined;
    if (collection === 'kn') {
      rootTreePath = 'structure/tree/super-tree.json';
      const works = findNode(readLocked(lock, rootTreePath), lock.collections.kn.superTreeNode);
      if (!Array.isArray(works) || !works.every((work) => typeof work === 'string')) throw new Error('super-tree: kn is not a list of works');
      trees = (works as string[]).map((work) => ({ path: treeFile(work), tree: readLocked(lock, treeFile(work)), parentId: 'kn' }));
    } else {
      trees = lock.collections[collection].trees.map((work) => ({ path: treeFile(work), tree: readLocked(lock, treeFile(work)), parentId: null }));
    }
    out[collection] = buildNavigation({
      collection,
      repo: lock.repo,
      commit: lock.commit,
      rootId: collection,
      rootTreePath,
      trees,
      catalog,
      segmentKeys: segmentKeysFor(catalog),
      names: { pali, site, reference, heading: headingResolver(collection, catalog, exclusions, usedExclusions) },
    });
  }
  const stale = exclusions.filter((entry) => !usedExclusions.has(entry));
  if (stale.length) {
    throw new NavigationError(stale.map((entry) => `${HEADING_EXCLUSIONS}: ${entry.group} ${entry.segment} "${entry.text}" no longer matches the translation — review the new heading and remove the entry`));
  }
  return out;
}

export function serialize(nav: NavigationCollection): string {
  return `${JSON.stringify(nav, null, 1)}\n`;
}

function summary(all: Record<NavigationCollectionCode, NavigationCollection>): void {
  console.log('collection  groups  texts  sourceFiles  bundles  textsInBundles  groupsWithoutVi');
  for (const code of NAVIGATION_COLLECTIONS) {
    const c = all[code].counts;
    console.log(`${code.padEnd(10)}  ${String(c.groups).padStart(6)}  ${String(c.texts).padStart(5)}  ${String(c.sourceFiles).padStart(11)}  ${String(c.bundles).padStart(7)}  ${String(c.textsInBundles).padStart(14)}  ${String(c.groupsWithoutVietnameseName).padStart(15)}`);
  }
}

async function checkReferencePages(): Promise<string[]> {
  const file = loadReferenceNames();
  const problems: string[] = [];
  for (const [id, source] of Object.entries(file.sources)) {
    const response = await fetch(source.url, { headers: { 'User-Agent': 'Mozilla/5.0 (kinh-tang-pali navigation check)' } });
    if (!response.ok) { problems.push(`${id}: HTTP ${response.status} for ${source.url}`); continue; }
    const lastModified = response.headers.get('last-modified');
    if (lastModified && lastModified !== source.lastModified) console.warn(`warning: ${id}: Last-Modified is now ${lastModified}, recorded ${source.lastModified}`);
    const page = (await response.text()).replace(/<[^>]+>/g, '\n').replace(/&nbsp;/g, ' ').replace(/[ \t\r]+/g, ' ');
    for (const [nameId, entry] of Object.entries(file.names).filter(([, value]) => value.source === id)) {
      if (!page.includes(entry.entry)) problems.push(`${nameId}: "${entry.entry}" no longer appears in ${source.url}`);
    }
  }
  return problems;
}

async function main(): Promise<void> {
  const mode = process.argv[2];
  if (mode !== 'generate' && mode !== 'check') {
    console.error('usage: tsx scripts/navigation.ts generate|check [--reference]');
    process.exit(2);
  }
  let all: Record<NavigationCollectionCode, NavigationCollection>;
  try {
    all = buildAll();
  } catch (error) {
    console.error(error instanceof NavigationError ? error.message : `navigation: ${(error as Error).message}`);
    process.exit(1);
  }
  summary(all);
  if (mode === 'generate') {
    mkdirSync(OUTPUT_DIR, { recursive: true });
    for (const code of NAVIGATION_COLLECTIONS) {
      const target = outputPath(code);
      writeFileSync(`${target}.tmp`, serialize(all[code]));
      renameSync(`${target}.tmp`, target);
    }
    console.log(`wrote ${NAVIGATION_COLLECTIONS.map((code) => path.relative(ROOT, outputPath(code))).join(', ')}`);
    return;
  }
  const problems: string[] = [];
  for (const code of NAVIGATION_COLLECTIONS) {
    const target = outputPath(code);
    if (!existsSync(target)) { problems.push(`${path.relative(ROOT, target)} is missing — run: npm run navigation:generate`); continue; }
    const committed = readFileSync(target, 'utf8');
    const expected = serialize(all[code]);
    if (committed !== expected) {
      const a = committed.split('\n');
      const b = expected.split('\n');
      const line = a.findIndex((value, index) => value !== b[index]);
      problems.push(`${path.relative(ROOT, target)} differs from the pinned snapshot at line ${line + 1}: committed ${JSON.stringify(a[line])}, expected ${JSON.stringify(b[line])} — run: npm run navigation:generate`);
    }
    try {
      problems.push(...checkNavigation(JSON.parse(committed) as NavigationCollection, loadCatalog(code).texts).map((problem) => `${code}: ${problem}`));
    } catch (error) {
      problems.push(`${code}: committed file is not valid JSON (${(error as Error).message})`);
    }
  }
  if (process.argv.includes('--reference')) problems.push(...await checkReferencePages());
  if (problems.length) {
    console.error('navigation check failed:');
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }
  console.log('navigation matches the pinned snapshot; every catalogue URL has exactly one traditional path.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(ROOT, 'scripts/navigation.ts')) {
  await main();
}
