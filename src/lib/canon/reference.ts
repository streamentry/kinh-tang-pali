/**
 * Coverage of the English reference available for a text.
 *
 * Presence of the file is not enough, and neither is presence of the segment key.
 * Sujato leaves some segments with an English key but an empty value, because it
 * renders blockquoted passages and `…pe…` elisions as nothing and flows the
 * sentence around them. A text can therefore look fully aligned while offering no
 * English guidance at all across a large part of its body.
 *
 * The metric that matters for a translator is the share of *substantive* Pāli
 * segments — those carrying real prose rather than an enumeration marker, a title or
 * a vagga heading — for which some credited English layer actually has words.
 * Counting every segment would let thousands of dropped `Paṭhamaṁ.` markers
 * disguise a text whose entire teaching passage is untranslated.
 *
 * Two credited layers, per `source/layers.yaml`: the pinned Sujato edition, and our
 * own fill (`english-project`), which counts only once it is `published` in its own
 * right. A draft fill is work in progress, not a reference.
 */
import { existsSync, readFileSync } from 'node:fs';
import YAML from 'yaml';
import type { CollectionCode } from './types';
import { loadCatalog, loadLock, segmentMapForUid, sourcePathFor, englishPathFor, upstreamFile } from './load';
import { coverageCreditLayers, loadStoreManifest, resolveLayer } from './layers';

const readJson = <T>(file: string): T => JSON.parse(readFileSync(file, 'utf8')) as T;

/**
 * Pāli shorter than this is a label or enumerator, not content a translator must
 * interpret. Declared in `source/layers.yaml`; re-exported for tests and scripts.
 */
export const SUBSTANTIVE_PALI_MIN_CHARS = loadStoreManifest().englishCoverage.substantivePaliMinChars;

const prose = (value: string | undefined): number =>
  (typeof value === 'string' ? value : '').replace(/\s+/g, ' ').trim().length;

/**
 * Bilara marks the reference block of a text with path component `0`
 * (`dhp1:0.2`, `an4.46:0.1`, `mn118:0.1`): the book title, the vagga name, the sutta
 * name. Those are headings a translator resolves from the Pāli itself, and Sujato
 * often leaves the per-story ones blank, so counting them would report a Dhammapada
 * bundle as untranslated when only its story titles are missing.
 */
export function isReferenceBlock(segmentId: string): boolean {
  const path = segmentId.slice(segmentId.indexOf(':') + 1);
  return /^0(\.|$)/.test(path);
}

export function isSubstantive(segmentId: string, paliValue: string | undefined): boolean {
  const { englishCoverage } = loadStoreManifest();
  if (englishCoverage.excludeReferenceBlock && isReferenceBlock(segmentId)) return false;
  return prose(paliValue) >= englishCoverage.substantivePaliMinChars;
}

export interface EnglishCoverage {
  collection: CollectionCode;
  uid: string;
  /** True when the Pāli root is synced and readable. */
  resolved: boolean;
  paliSegments: number;
  /** Segments with an English key in the pinned Sujato edition, whatever its value. */
  englishSegments: number;
  /** Substantive Pāli segments: real prose, not a heading or an enumerator. */
  substantiveSegments: number;
  /** Substantive Pāli segments with no words in any credited English layer. */
  substantiveWithoutEnglish: number;
  /** substantiveSegments === 0 ? 1 : share of substantive segments with English words. */
  ratio: number;
  /** Which credited layers actually contributed words. */
  credited: string[];
  /** Worst single gap, useful for pointing a translator at the exact hole. */
  worstMissingSegment: string | null;
}

export interface ReferenceGapRecord {
  uid: string;
  collection: CollectionCode;
  substantiveSegments: number;
  substantiveWithoutEnglish: number;
  coverage: number;
  /** Optional per-text override of the file-level `defaultReason`. */
  reason?: string;
}

export function englishCoverageFor(collection: CollectionCode, uid: string): EnglishCoverage | null {
  const catalog = loadCatalog(collection);
  const item = catalog.texts.find((text) => text.uid === uid);
  if (!item) throw new Error(`UID ${uid} is not in ${collection} catalog`);

  const paliPath = sourcePathFor(collection, uid, item.sourcePath);
  const englishPath = englishPathFor(collection, uid, item.sourcePath);
  if (!paliPath || !englishPath) return null;

  const paliFile = upstreamFile(paliPath);
  if (!existsSync(paliFile)) {
    return {
      collection,
      uid,
      resolved: false,
      paliSegments: 0,
      englishSegments: 0,
      substantiveSegments: 0,
      substantiveWithoutEnglish: 0,
      ratio: 0,
      credited: [],
      worstMissingSegment: null,
    };
  }

  const pali = segmentMapForUid(readJson<Record<string, string>>(paliFile), uid);
  const englishSegments = existsSync(upstreamFile(englishPath))
    ? Object.keys(segmentMapForUid(readJson<Record<string, string>>(upstreamFile(englishPath)), uid)).length
    : 0;

  // A credited layer contributes only once it is in the state `layers.yaml` demands:
  // the pinned edition whenever it is present, our own fill once it is published.
  const credited = coverageCreditLayers()
    .map((layer) => ({ layer, resolved: resolveLayer(layer.id, collection, uid, { catalog }) }))
    .filter(({ layer, resolved }) => {
      if (!resolved?.present) return false;
      if (!layer.countsOnlyWhenStatus) return true;
      return resolved.status === layer.countsOnlyWhenStatus;
    })
    .map(({ layer, resolved }) => ({
      id: layer.id,
      prose: (id: string) => prose(resolved!.segments[id]),
    }));

  const ids = Object.keys(pali);
  let substantive = 0;
  let without = 0;
  let worstMissingSegment: string | null = null;
  for (const id of ids) {
    if (!isSubstantive(id, pali[id])) continue;
    substantive += 1;
    if (credited.some((layer) => layer.prose(id) > 0)) continue;
    without += 1;
    // Report the most substantial hole, not merely the first one.
    if (!worstMissingSegment || prose(pali[id]) > prose(pali[worstMissingSegment])) {
      worstMissingSegment = id;
    }
  }

  return {
    collection,
    uid,
    resolved: true,
    paliSegments: ids.length,
    englishSegments,
    substantiveSegments: substantive,
    substantiveWithoutEnglish: without,
    ratio: substantive === 0 ? 1 : (substantive - without) / substantive,
    credited: credited.map((layer) => layer.id),
    worstMissingSegment,
  };
}

/**
 * Minimum share of substantive Pāli segments that must carry English words before a
 * text may reach `review` or `published`.
 *
 * Single-sourced from `source/layers.yaml` so the registry stays the one place the
 * threshold is declared. It was set from the audit: at 0.8 it flags only the texts
 * that genuinely lost their reference layer and leaves the healthy majority untouched.
 * Relaxing it to 0.5 would silently accept the 121 texts sitting between 50% and 80%.
 */
export const MIN_ENGLISH_COVERAGE = loadStoreManifest().englishCoverage.floor;

export function loadRecordedGaps(): Map<string, ReferenceGapRecord> {
  const file = `${process.cwd()}/content/meta/reference-gaps.yaml`;
  if (!existsSync(file)) return new Map();
  const parsed = YAML.parse(readFileSync(file, 'utf8')) as {
    defaultReason?: string;
    gaps?: ReferenceGapRecord[];
  };
  const records = new Map<string, ReferenceGapRecord>();
  for (const record of parsed.gaps ?? []) {
    records.set(`${record.collection}/${record.uid}`, {
      ...record,
      reason: record.reason ?? parsed.defaultReason ?? '',
    });
  }
  return records;
}

export function referenceLockSummary(): { commit: string; translator: string; minCoverage: number } {
  const edition = loadLock().referenceEditions.find((entry) => entry.role === 'english');
  return {
    commit: loadLock().commit,
    translator: edition?.translator ?? '(none pinned)',
    minCoverage: MIN_ENGLISH_COVERAGE,
  };
}
