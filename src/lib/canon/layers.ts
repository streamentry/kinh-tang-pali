/**
 * The translation store: every layer a text is read through, in one place.
 *
 * Four layers, in reading order:
 *
 *   1. Pāli root            — the authority, nothing outranks it
 *   2. English (Sujato)     — pinned upstream reference
 *   3. English (project)    — our own fill where Sujato left a passage blank
 *   4. Vietnamese current   — Thích Minh Châu, pinned upstream reference
 *   5. Vietnamese (project) — our canonical deliverable
 *
 * Layers are declared in `source/layers.yaml` rather than hard-coded here, so
 * provenance is asserted in one reviewable place. `source/layers.yaml` also declares
 * which layers count toward the English coverage floor; the project English layer
 * only counts once it has been published in its own right, because a draft fill is
 * not yet a reference.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import type { CollectionCode, CanonCatalog } from './types';
import {
  COLLECTIONS,
  loadCatalog,
  loadLock,
  loadSegmentMap,
  segmentMapForUid,
  sourcePathFor,
  upstreamFile,
} from './load';
import type { SourcePath } from './load';

const ROOT = process.cwd();

export type LayerKind = 'root' | 'reference' | 'project';
export type LayerLocation =
  | { type: 'upstream'; rootEdition?: string; subpath?: string; path: string; suffix: string }
  | { type: 'content'; dir: string; suffix: string; metaDir: string };

export interface StoreLayer {
  id: string;
  title: string;
  kind: LayerKind;
  language: string;
  authority: boolean;
  location: LayerLocation;
  role: string;
  note?: string;
  countsTowardCoverage?: boolean;
  countsOnlyWhenStatus?: string;
}

/**
 * The upstream directory this layer reads, which is what the pinned manifest records.
 * Reference layers map to their own edition root; the Pāli root is the edition root
 * narrowed to the subpath the project actually consumes.
 */
export function manifestRootForLayer(layer: StoreLayer): string | null {
  if (layer.location.type !== 'upstream') return null;
  if (!layer.location.rootEdition) return layer.location.path;
  return layer.location.subpath
    ? `${layer.location.rootEdition}/${layer.location.subpath}`
    : layer.location.rootEdition;
}

export interface StoreManifest {
  schemaVersion: number;
  layers: StoreLayer[];
  readingOrder: string[];
  englishCoverage: {
    substantivePaliMinChars: number;
    excludeReferenceBlock: boolean;
    floor: number;
    creditLayers: string[];
    note?: string;
  };
}

let cached: StoreManifest | null = null;

export function loadStoreManifest(): StoreManifest {
  if (!cached) {
    const file = path.join(ROOT, 'source/layers.yaml');
    if (!existsSync(file)) throw new Error('source/layers.yaml is missing; the translation store cannot be resolved');
    cached = YAML.parse(readFileSync(file, 'utf8')) as StoreManifest;
  }
  return cached;
}

export function storeLayers(): StoreLayer[] {
  return loadStoreManifest().layers;
}

export function storeLayer(id: string): StoreLayer {
  const layer = storeLayers().find((entry) => entry.id === id);
  if (!layer) throw new Error(`Unknown store layer '${id}'. Declared: ${storeLayers().map((l) => l.id).join(', ')}`);
  return layer;
}

export function readingOrder(): StoreLayer[] {
  const { readingOrder: order } = loadStoreManifest();
  const byId = new Map(storeLayers().map((layer) => [layer.id, layer]));
  return order.map((id) => {
    const layer = byId.get(id);
    if (!layer) throw new Error(`source/layers.yaml readingOrder names unknown layer '${id}'`);
    return layer;
  });
}

/** Upstream layers mirror the Pāli root path, so they resolve by the same transform. */
function upstreamPathForLayer(layer: StoreLayer, sourcePath: SourcePath): string | null {
  if (layer.location.type !== 'upstream') return null;
  if (layer.location.rootEdition) {
    // The Pāli root itself: identity.
    return sourcePath.startsWith(`${layer.location.rootEdition}/`) ? sourcePath : null;
  }
  const match = sourcePath.match(/^(?:root\/pli\/ms|root\/[^/]+\/[^/]+)\/(sutta\/.+)_root-pli-ms\.json$/);
  if (!match) return null;
  return `${layer.location.path}/${match[1]}${layer.location.suffix}`;
}

export function contentPathForLayer(layer: StoreLayer, collection: CollectionCode, uid: string): string | null {
  if (layer.location.type !== 'content') return null;
  return path.join(ROOT, layer.location.dir, collection, `${uid}${layer.location.suffix}`);
}

export function contentMetaPathForLayer(layer: StoreLayer, collection: CollectionCode, uid: string): string | null {
  if (layer.location.type !== 'content' || !layer.location.metaDir) return null;
  return path.join(ROOT, layer.location.metaDir, collection, `${uid}.yaml`);
}

export interface ResolvedLayer {
  layer: StoreLayer;
  /** Path inside `.cache/upstream/suttacentral`, or null when the layer is local. */
  upstreamPath: string | null;
  /** Absolute local content path, or null when the layer is upstream. */
  contentPath: string | null;
  file: string;
  present: boolean;
  segments: Record<string, string>;
  /** Editorial status, for project layers that carry their own metadata. */
  status: string | null;
}

function projectStatusFor(layer: StoreLayer, collection: CollectionCode, uid: string): string | null {
  const metaFile = contentMetaPathForLayer(layer, collection, uid);
  if (!metaFile || !existsSync(metaFile)) return null;
  const meta = YAML.parse(readFileSync(metaFile, 'utf8')) as { status?: string };
  return meta.status ?? null;
}

export function resolveLayer(
  layerId: string,
  collection: CollectionCode,
  uid: string,
  options: { catalog?: CanonCatalog } = {},
): ResolvedLayer | null {
  const layer = storeLayer(layerId);
  const catalog = options.catalog ?? loadCatalog(collection);
  const item = catalog.texts.find((text) => text.uid === uid);
  if (!item) throw new Error(`UID ${uid} is not in ${collection} catalog`);
  const sourcePath = sourcePathFor(collection, uid, item.sourcePath);

  let upstreamPath: string | null = null;
  let contentPath: string | null = null;
  let file: string;

  if (layer.location.type === 'upstream') {
    if (!sourcePath) return null;
    upstreamPath = upstreamPathForLayer(layer, sourcePath);
    if (!upstreamPath) return null;
    file = upstreamFile(upstreamPath);
  } else {
    contentPath = contentPathForLayer(layer, collection, uid);
    if (!contentPath) return null;
    file = contentPath;
  }

  const present = existsSync(file);
  const segments = present ? segmentMapForUid(loadSegmentMap(file), uid) : {};

  return {
    layer,
    upstreamPath,
    contentPath,
    file,
    present,
    segments,
    status: layer.location.type === 'content' ? projectStatusFor(layer, collection, uid) : null,
  };
}

export interface StoreView {
  collection: CollectionCode;
  uid: string;
  commit: string;
  layers: Array<{
    id: string;
    title: string;
    kind: LayerKind;
    language: string;
    authority: boolean;
    present: boolean;
    status: string | null;
    /** Share of this text's segments that carry actual words. */
    proseShare: number;
    source: string;
  }>;
}

/** Every declared layer for one text, in reading order, with presence and fill rate. */
export function storeView(collection: CollectionCode, uid: string): StoreView {
  const catalog = loadCatalog(collection);
  const pali = resolveLayer('pali', collection, uid, { catalog });
  const total = pali ? Object.keys(pali.segments).length : 0;
  return {
    collection,
    uid,
    commit: loadLock().commit,
    layers: readingOrder().map((layer) => {
      const resolved = resolveLayer(layer.id, collection, uid, { catalog });
      const segments = resolved?.segments ?? {};
      const withProse = Object.values(segments).filter((value) => String(value).trim() !== '').length;
      return {
        id: layer.id,
        title: layer.title,
        kind: layer.kind,
        language: layer.language,
        authority: layer.authority,
        present: resolved?.present ?? false,
        status: resolved?.status ?? null,
        proseShare: total === 0 ? 0 : withProse / total,
        source: resolved?.upstreamPath ?? resolved?.contentPath?.replace(`${ROOT}/`, '') ?? '(unresolved)',
      };
    }),
  };
}

/** Layers whose fill counts toward the English coverage floor for this text. */
export function coverageCreditLayers(): StoreLayer[] {
  const { englishCoverage } = loadStoreManifest();
  return englishCoverage.creditLayers
    .map((id) => storeLayers().find((layer) => layer.id === id))
    .filter((layer): layer is StoreLayer => Boolean(layer));
}

/**
 * The Pāli segments the project fill layer is allowed to write: those where no
 * **pinned upstream** layer has words.
 *
 * Only upstream layers count here. Crediting our own fill would be circular — once a
 * segment is filled it would stop looking fillable, and the validator would reject the
 * very text it is meant to protect. The rule is about shadowing a pinned edition, so
 * that is what it compares against.
 */
export function fillableSegments(collection: CollectionCode, uid: string): string[] {
  const catalog = loadCatalog(collection);
  const pali = resolveLayer('pali', collection, uid, { catalog });
  if (!pali?.present) return [];
  const upstream = coverageCreditLayers()
    .filter((layer) => layer.location.type === 'upstream' && !layer.location.rootEdition)
    .map((layer) => resolveLayer(layer.id, collection, uid, { catalog }))
    .filter((resolved): resolved is ResolvedLayer => Boolean(resolved?.present));
  const hasProse = (id: string) => upstream.some((resolved) => String(resolved.segments[id] ?? '').trim() !== '');
  return Object.keys(pali.segments).filter((id) => !hasProse(id));
}

export function assertStoreIntegrity(): string[] {
  const errors: string[] = [];
  const { schemaVersion, layers, readingOrder: order, englishCoverage } = loadStoreManifest();
  if (schemaVersion !== 1) errors.push(`source/layers.yaml: unsupported schemaVersion ${schemaVersion}`);

  const ids = layers.map((layer) => layer.id);
  if (new Set(ids).size !== ids.length) errors.push('source/layers.yaml: duplicate layer id');
  for (const id of order) {
    if (!ids.includes(id)) errors.push(`source/layers.yaml: readingOrder names unknown layer '${id}'`);
  }

  for (const layer of layers) {
    if (layer.authority && layer.kind !== 'root') {
      errors.push(`source/layers.yaml: layer '${layer.id}' claims authority but is a ${layer.kind} layer`);
    }
    if (layer.kind === 'root' && !layer.authority) {
      errors.push(`source/layers.yaml: root layer '${layer.id}' must be the authority`);
    }
  }

  for (const id of englishCoverage.creditLayers) {
    if (!ids.includes(id)) errors.push(`source/layers.yaml: creditLayers names unknown layer '${id}'`);
  }
  if (englishCoverage.floor <= 0 || englishCoverage.floor > 1) {
    errors.push(`source/layers.yaml: englishCoverage.floor must be in (0, 1], got ${englishCoverage.floor}`);
  }

  // The pinned lock and the store must agree about which upstream editions exist,
  // or the store would advertise a layer nothing ever downloads.
  for (const layer of layers) {
    if (layer.location.type !== 'upstream' || layer.location.rootEdition) continue;
    const path = layer.location.path;
    const declared = loadLock().referenceEditions.find((edition) => edition.path === path);
    if (!declared) {
      errors.push(`source/layers.yaml: layer '${layer.id}' points at ${path}, which the lock does not pin`);
      continue;
    }
    if (declared.language !== layer.language) {
      errors.push(`source/layers.yaml: layer '${layer.id}' says ${layer.language} but the pinned edition says ${declared.language}`);
    }
    // The suffix must be the one upstream actually uses, or every fetch would 404.
    const expected = `_translation-${declared.language}-${declared.translator}.json`;
    if (layer.location.suffix !== expected) {
      errors.push(`source/layers.yaml: layer '${layer.id}' suffix '${layer.location.suffix}' should be '${expected}'`);
    }
  }

  for (const collection of COLLECTIONS.map((entry) => entry.code)) {
    if (!existsSync(path.join(ROOT, 'content/catalog/sutta', `${collection}.json`))) {
      errors.push(`source/layers.yaml: declared collection ${collection} has no catalog`);
    }
  }

  return errors;
}
