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
  projectContentLicense,
  segmentMapForUid,
  sourcePathFor,
  upstreamFile,
  type EditionLicense,
  type ReferenceEdition,
} from './load';
import type { SourcePath } from './load';
import { manifestCommit } from './manifest';

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

/** The pinned edition that supplies an upstream layer, if the lock declares one. */
export function editionForLayer(layer: StoreLayer): ReferenceEdition | null {
  const location = layer.location;
  if (location.type !== 'upstream' || location.rootEdition) return null;
  return loadLock().referenceEditions.find((edition) => edition.path === location.path) ?? null;
}

/**
 * The terms an upstream layer is displayed under, or `null` when the layer is ours.
 *
 * The Pāli root is public domain, so it needs no licence. Every reference edition does,
 * and a reference layer with no declared terms is a compliance hole rather than a
 * stylistic gap — which is why `assertStoreIntegrity` treats it as an error.
 */
export function licenseForLayer(layer: StoreLayer): EditionLicense | null {
  if (layer.location.type !== 'upstream') return null;
  if (layer.location.rootEdition) {
    return {
      group: 'public-domain',
      spdx: 'NOASSERTION',
      holder: '—',
      basis: 'Original Pāli scripture is in the public domain and carries no copyright; SuttaCentral lists it under their third licence group.',
      statementFrom: 'translation/vi/site/licensing_translation-vi-site.json#licensing:23',
      attributionRequired: false,
    };
  }
  return editionForLayer(layer)?.license ?? null;
}

/** A one-line credit for a layer, safe to render in a panel header. */
/**
 * Where a displayed version actually came from, as separate facts.
 *
 * These are two different claims and collapsing them is how a credit goes wrong in both
 * directions. For the 26 Dhammapada texts the Vietnamese column is Bhikkhu Thích Minh Châu's
 * translation *distributed by SuttaCentral* — a statement about the translator and a
 * statement about the distributor, both true, neither derivable from the other. A credit
 * that names only the distributor hands TMC's work to SuttaCentral; one that names only the
 * author hides where the repository actually got it, which is the fact SuttaCentral asks to
 * be stated.
 */
export interface VersionProvenance {
  /** Who made the translation. Not a layer, not a column: the person. */
  author: string;
  /**
   * Who published or distributed the edition this copy came from.
   *
   * Deliberately separate from `author`, and `undefined` for the project's own work — we
   * distribute our translation ourselves, so naming a distributor would be a false claim
   * rather than a courtesy.
   */
  distributor?: string;
  /** The exact upstream file, relative to the pinned bilara commit. */
  sourcePath?: string;
  /** The pinned commit this copy was verified against. */
  commit?: string;
  /** How it may be reused, in a phrase a reader can act on. */
  terms: string;
  spdx?: string;
  group: 'public-domain' | 'suttacentral' | 'third-party';
  holder: string;
  attributionRequired: boolean;
}

export function provenanceForLayer(layer: StoreLayer): VersionProvenance {
  if (layer.location.type === 'upstream' && layer.location.rootEdition) {
    // No distributor: the Pāli root is SuttaCentral's own text and in the public domain, so
    // naming a distributor would be the same claim twice. "Distributed by" only means
    // something when the translator and the distributor are two different parties.
    return {
      author: 'SuttaCentral Mahāsaṅgīti (bilara, pli/ms)',
      sourcePath: layer.location.rootEdition,
      commit: loadLock().commit,
      terms: 'phạm vi công cộng — Pāli là nguồn chuẩn duy nhất',
      spdx: 'NOASSERTION',
      group: 'public-domain',
      holder: 'công cộng',
      attributionRequired: false,
    };
  }

  const edition = editionForLayer(layer);
  if (!edition) {
    return {
      author: projectContentLicense().holder ?? 'Kinh Tạng Pāli Việt project contributors',
      terms: 'CC0 1.0 — tác phẩm của chính dự án này',
      spdx: projectContentLicense().spdx,
      group: 'suttacentral',
      holder: projectContentLicense().holder ?? 'Kinh Tạng Pāli Việt project contributors',
      attributionRequired: false,
    };
  }

  const { license } = edition;
  const terms = license.group === 'public-domain'
    ? 'phạm vi công cộng'
    : license.spdx === 'CC0-1.0'
      ? 'CC0 1.0'
      : `bản quyền thuộc ${license.holder}; dùng theo giấy phép của dịch giả`;

  // The author is a person's name, never a directory slug. `translator` is a bilara path
  // component — "sujato", "phantuananh", "site" — and the English column's credit printed
  // `sujato` until this was fixed, while the layer title one line above correctly said
  // "Bhikkhu Sujato". The slug belongs in the path, which `sourcePath` already carries.
  const author = edition.translatorName ?? edition.license.holder;

  return {
    author,
    distributor: 'SuttaCentral',
    sourcePath: edition.path,
    commit: loadLock().commit,
    terms,
    spdx: license.spdx,
    group: license.group,
    holder: license.holder,
    attributionRequired: license.attributionRequired,
  };
}

/**
 * One line naming the translator, the distributor, the edition path, the pinned commit and
 * the terms.
 *
 * Author first, then distributor: a reader asking "whose translation is this?" must be able
 * to stop reading after the first clause.
 */
export function creditForLayer(layer: StoreLayer): string {
  const p = provenanceForLayer(layer);
  const origin = p.sourcePath ? `, ${p.sourcePath} @ ${p.commit?.slice(0, 12)}` : '';
  const who = p.distributor ? `${p.author} — lấy từ ${p.distributor}${origin}` : p.author;
  return `${who} (${p.terms})`;
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
    // A reference edition is displayed under terms we do not own, so those terms must be
    // recorded. A third-party translation without a declared licence is a compliance hole,
    // not a missing nicety, and the fix is a line in the lock rather than a guess here.
    if (!declared.license) {
      errors.push(`source/suttacentral.lock.json: edition ${path} has no license block; `
        + 'every pinned edition must state how it may be reused');
    } else {
      if (!declared.license.holder || !declared.license.basis || !declared.license.statementFrom) {
        errors.push(`source/suttacentral.lock.json: edition ${path} has an incomplete license block `
          + '(holder, basis and statementFrom are all required)');
      }
      if (declared.license.group === 'third-party' && declared.license.spdx === 'CC0-1.0') {
        errors.push(`source/suttacentral.lock.json: edition ${path} is third-party but claims CC0; `
          + 'SuttaCentral places most scripture translations under the translator\'s own copyright');
      }
    }
  }

  // The credits edition is not a store layer, but it is pinned, and it is what the
  // licence statements above cite. If it goes missing the citations dangle.
  const credits = loadLock().referenceEditions.find((edition) => edition.kind === 'credits');
  if (!credits) {
    errors.push('source/suttacentral.lock.json: no credits edition is pinned; '
      + 'the reference layers cite SuttaCentral\'s own licensing text and it must be verifiable');
  } else if (manifestCommit() !== loadLock().commit) {
    errors.push('source/upstream-manifest.json is not at the locked commit, so the credits edition '
      + 'cannot be verified against the pin');
  }

  for (const collection of COLLECTIONS.map((entry) => entry.code)) {
    if (!existsSync(path.join(ROOT, 'content/catalog/sutta', `${collection}.json`))) {
      errors.push(`source/layers.yaml: declared collection ${collection} has no catalog`);
    }
  }

  return errors;
}
