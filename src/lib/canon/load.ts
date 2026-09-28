import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import type {
  CanonCatalog,
  CollectionCode,
  CollectionDefinition,
  EditorialMeta,
} from './types';

const ROOT = process.cwd();
const UPSTREAM = path.join(ROOT, '.cache/upstream/suttacentral');

/**
 * Upstream path of the pinned Pāli root for a text, relative to the bilara-data
 * checkout (e.g. `root/pli/ms/sutta/mn/mn118_root-pli-ms.json`).
 */
export type SourcePath = string;

export const REFERENCE_ROOT_PATH = 'root/pli/ms';

export const COLLECTIONS: CollectionDefinition[] = [
  { code: 'dn', titlePali: 'Dīgha Nikāya', titleVi: 'Kinh Trường Bộ', description: 'Các bài kinh dài.' },
  { code: 'mn', titlePali: 'Majjhima Nikāya', titleVi: 'Kinh Trung Bộ', description: 'Ưu tiên biên dịch hiện tại: 152 bài kinh.' },
  { code: 'sn', titlePali: 'Saṁyutta Nikāya', titleVi: 'Kinh Tương Ưng Bộ', description: 'Các bài kinh được nhóm theo chủ đề tương ưng.' },
  { code: 'an', titlePali: 'Aṅguttara Nikāya', titleVi: 'Kinh Tăng Chi Bộ', description: 'Các bài kinh được tổ chức theo pháp số.' },
  { code: 'kn', titlePali: 'Khuddaka Nikāya', titleVi: 'Kinh Tiểu Bộ', description: 'Tập hợp nhiều bộ kinh và thi kệ nhỏ.' },
];

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}

/**
 * Catalogues and editorial metadata, memoised.
 *
 * Both are read-only for the lifetime of a process, and both are large: the Aṅguttara
 * and Khuddaka catalogues are a quarter of a megabyte each. `resolveLayer` loads a
 * catalogue per call and the comparison document resolves five layers per text, so
 * without this the static build re-parses several megabytes of JSON per page — enough
 * to turn a two-minute build into one that never finishes.
 */
const catalogCache = new Map<CollectionCode, CanonCatalog>();
const metaCache = new Map<string, EditorialMeta | null>();

export function loadCatalog(collection: CollectionCode): CanonCatalog {
  const cached = catalogCache.get(collection);
  if (cached) return cached;
  const parsed = readJson<CanonCatalog>(path.join(ROOT, 'content/catalog/sutta', `${collection}.json`));
  catalogCache.set(collection, parsed);
  return parsed;
}

export function loadMeta(collection: CollectionCode, uid: string): EditorialMeta | null {
  const key = `${collection}/${uid}`;
  if (metaCache.has(key)) return metaCache.get(key) ?? null;
  const file = path.join(ROOT, 'content/meta/sutta', collection, `${uid}.yaml`);
  const parsed = existsSync(file) ? YAML.parse(readFileSync(file, 'utf8')) as EditorialMeta : null;
  metaCache.set(key, parsed);
  return parsed;
}

/**
 * Parsed upstream and content segment files, keyed by path.
 *
 * The comparison document reads each text's Pāli file more than once — once for the
 * authority column and once to establish the segment key set — and the store resolves
 * the same edition files again per layer. Over 6,136 pages that is tens of thousands of
 * redundant reads and re-parses of the same JSON, which is slow enough to matter. The
 * cache is bounded and evicts in insertion order, so a full build cannot grow without
 * limit while a single page still gets the reuse.
 */
const SEGMENT_CACHE_LIMIT = 64;
const segmentCache = new Map<string, Record<string, string>>();

export function loadSegmentMap(file: string): Record<string, string> {
  const cached = segmentCache.get(file);
  if (cached) return cached;
  if (!existsSync(file)) return {};
  const parsed = readJson<Record<string, string>>(file);
  if (segmentCache.size >= SEGMENT_CACHE_LIMIT) {
    const oldest = segmentCache.keys().next().value;
    if (oldest !== undefined) segmentCache.delete(oldest);
  }
  segmentCache.set(file, parsed);
  return parsed;
}

export interface ReferenceEdition {
  role: 'english' | 'vietnamese-current';
  language: string;
  translator: string;
  /** Human-readable translator name, where upstream records one. */
  translatorName?: string;
  path: string;
  authority: false;
  requiredFor: string[];
  note?: string;
}

export interface SourceLock {
  repo: string;
  ref: string;
  commit: string;
  rootEdition: string;
  paths: string[];
  referenceEditions: ReferenceEdition[];
  pinnedAt: string;
}

export function loadLock(): SourceLock {
  return readJson<SourceLock>(path.join(ROOT, 'source/suttacentral.lock.json'));
}

export function englishEdition(): ReferenceEdition {
  const edition = loadLock().referenceEditions.find((entry) => entry.role === 'english');
  if (!edition) throw new Error('source/suttacentral.lock.json: no english reference edition is pinned');
  return edition;
}

/**
 * Upstream path of the English reference translation for a text.
 *
 * bilara-data names every edition file after the same SuttaCentral UID, so the
 * English path is a pure transform of the Pāli root path. Deriving it instead of
 * re-deriving it from the UID keeps bundled texts (`an5.308-1152`, `sn12.93-213`,
 * `dhp1-20`) and the nested `sn/an/kn` folder layout from drifting apart.
 */
export function englishPathFor(
  collection: CollectionCode,
  uid: string,
  explicit?: string,
): string | null {
  return referencePathForEdition(englishEdition(), collection, uid, explicit);
}

/**
 * Upstream path of a pinned reference edition for a text.
 *
 * bilara-data names every edition file after the same SuttaCentral UID, so the
 * reference path is a pure transform of the Pāli root path. Deriving it instead of
 * re-deriving it from the UID keeps bundled texts (`an5.308-1152`, `sn12.93-213`,
 * `dhp1-20`) and the nested `sn/an/kn` folder layout from drifting apart.
 */
export function referencePathForEdition(
  edition: ReferenceEdition,
  collection: CollectionCode,
  uid: string,
  explicit?: string,
): string | null {
  const sourcePath = sourcePathFor(collection, uid, explicit);
  if (!sourcePath) return null;
  return referencePathForSourcePath(edition, sourcePath);
}

export function referencePathForSourcePath(
  edition: ReferenceEdition,
  sourcePath: SourcePath,
): string | null {
  const match = sourcePath.match(/^root\/pli\/ms\/(sutta\/.+)_root-pli-ms\.json$/);
  if (!match) return null;
  const [, suttaPath] = match;
  return `${edition.path}/${suttaPath}_translation-${edition.language}-${edition.translator}.json`;
}

/** Backwards-compatible alias kept for the pinned English edition. */
export function englishPathForSourcePath(sourcePath: SourcePath): string | null {
  return referencePathForSourcePath(englishEdition(), sourcePath);
}

export function upstreamFile(relativePath: string): string {
  return path.join(UPSTREAM, relativePath);
}

export interface EnglishReference {
  edition: ReferenceEdition;
  commit: string;
  sourcePath: string;
  segments: Record<string, string>;
  present: boolean;
}

export function loadEnglishReference(collection: CollectionCode, uid: string): EnglishReference | null {
  const catalog = loadCatalog(collection);
  const item = catalog.texts.find((text) => text.uid === uid);
  if (!item) throw new Error(`UID ${uid} is not in ${collection} catalog`);
  const englishPath = englishPathFor(collection, uid, item.sourcePath);
  if (!englishPath) return null;
  const file = upstreamFile(englishPath);
  const present = existsSync(file);
  return {
    edition: englishEdition(),
    commit: loadLock().commit,
    sourcePath: englishPath,
    segments: present ? segmentMapForUid(loadSegmentMap(file), uid) : {},
    present,
  };
}

/**
 * Segment-ID prefixes that can carry a text's content.
 *
 * bilara-data uses two different conventions for range UIDs, and a text may be
 * filed under either:
 *
 * - merged bundles (`an5.308-1152`, `sn56.126-128`) label their segments with the
 *   range UID itself: `an5.308-1152:1.0`;
 * - bookmark bundles (`sn12.83-92`, `dhp1-20`) ship one file covering several
 *   suttas, each labelled with its own prefix: `sn12.83:0.1` … `sn12.92:1.6`.
 *
 * The literal UID is always a candidate; the expanded per-sutta prefixes are
 * added when the UID parses as a range. Both conventions are harmless to include
 * at once, because a prefix that the file does not use simply matches nothing.
 */
export function segmentPrefixesForUid(uid: string): string[] {
  const range = uid.match(/^([a-z]+[\d.]*?)(\d+)-(\d+)$/);
  if (range) {
    const [, base, startText, endText] = range;
    const start = Number(startText);
    const end = Number(endText);
    if (Number.isFinite(start) && Number.isFinite(end) && end >= start && end - start <= 2000) {
      const prefixes: string[] = [uid];
      for (let n = start; n <= end; n += 1) {
        const prefix = `${base}${n}`;
        if (!prefixes.includes(prefix)) prefixes.push(prefix);
      }
      return prefixes;
    }
  }
  return [uid];
}

export function segmentMapForUid(
  segments: Record<string, string>,
  uid: string,
): Record<string, string> {
  const prefixes = segmentPrefixesForUid(uid).map((prefix) => `${prefix}:`);
  return Object.fromEntries(
    Object.entries(segments).filter(([id]) => prefixes.some((prefix) => id.startsWith(prefix))),
  );
}

export function sourcePathFor(collection: CollectionCode, uid: string, explicit?: string): string | null {
  if (explicit) return explicit;
  if (collection === 'dn' || collection === 'mn') {
    return `root/pli/ms/sutta/${collection}/${uid}_root-pli-ms.json`;
  }
  if (collection === 'sn') {
    const match = uid.match(/^sn(\d+)\./);
    return match ? `root/pli/ms/sutta/sn/sn${match[1]}/${uid}_root-pli-ms.json` : null;
  }
  if (collection === 'an') {
    const match = uid.match(/^an(\d+)\./);
    return match ? `root/pli/ms/sutta/an/an${match[1]}/${uid}_root-pli-ms.json` : null;
  }
  return null;
}

export function listCollection(collection: CollectionCode) {
  const catalog = loadCatalog(collection);
  return catalog.texts.map((item) => {
    const meta = loadMeta(collection, item.uid);
    return {
      ...item,
      title: meta?.translationTitle || item.uid.toUpperCase(),
      status: meta?.status ?? 'not-started',
      hasProjectData: meta !== null,
    };
  });
}

export function collectionProgress(collection: CollectionCode) {
  const items = listCollection(collection);
  return {
    total: items.length,
    started: items.filter((x) => x.status !== 'not-started').length,
    review: items.filter((x) => x.status === 'review').length,
    published: items.filter((x) => x.status === 'published').length,
  };
}
