import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { resolveLayer } from './layers';
import { upstreamPublishes } from './manifest';
import type { CollectionCode } from './types';

/**
 * Editorial waivers: named decisions by the editor that relax exactly one gate rule.
 * Declared in `source/editorial-waivers.yaml`. A waiver never changes a score and never
 * removes a blocker from the record; it only stops one class of blocker from forcing `draft`.
 */
export interface EditorialWaiver {
  id: string;
  decidedBy: string;
  decidedAt: string;
  title: string;
  rationale: string;
  blockerPattern: string;
  excludePattern: string;
  condition: { layer: string; mustBe: 'not-published-upstream' };
  unchanged: string[];
}

export interface QualityWaiver {
  id: string;
  /** The exact `blocking_errors` strings this waiver covers, copied from the scorecard. */
  blockers: string[];
}

/**
 * The editor's decision to publish one named text whose score stays under the threshold.
 * It never edits a score, never covers a blocker and only lifts `review` to `published`.
 */
export interface PublishOverride {
  uid: string;
  collection: CollectionCode;
  decidedBy: string;
  decidedAt: string;
  reason: string;
}

const FILE = path.join(process.cwd(), 'source/editorial-waivers.yaml');
let cache: { waivers: EditorialWaiver[]; publishOverrides: PublishOverride[] } | null = null;

function loadRegistry(): { waivers: EditorialWaiver[]; publishOverrides: PublishOverride[] } {
  if (cache) return cache;
  // No registry (a scratch checkout, a fixture) means no waiver and no override, never a guess.
  if (!existsSync(FILE)) return { waivers: [], publishOverrides: [] };
  const parsed = YAML.parse(readFileSync(FILE, 'utf8')) as { schemaVersion: number; waivers: EditorialWaiver[]; publishOverrides?: PublishOverride[] };
  if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.waivers)) throw new Error('source/editorial-waivers.yaml: unsupported schema');
  const publishOverrides = parsed.publishOverrides ?? [];
  for (const entry of publishOverrides) {
    if (!entry.uid || !entry.collection || !entry.decidedBy || !entry.decidedAt || !entry.reason?.trim()) {
      throw new Error(`source/editorial-waivers.yaml: publish override ${entry.uid ?? '?'} needs uid, collection, decidedBy, decidedAt and reason`);
    }
  }
  cache = { waivers: parsed.waivers, publishOverrides };
  return cache;
}

export function loadWaivers(): EditorialWaiver[] {
  return loadRegistry().waivers;
}

export function publishOverrideFor(collection: CollectionCode | undefined, uid: string): PublishOverride | undefined {
  return loadRegistry().publishOverrides.find((entry) => entry.uid === uid && (!collection || entry.collection === collection));
}

export function waiverById(id: string): EditorialWaiver | undefined {
  return loadWaivers().find((waiver) => waiver.id === id);
}

/** True when this blocker is the kind the waiver is allowed to cover. */
export function blockerIsCovered(waiver: EditorialWaiver, blocker: string): boolean {
  return new RegExp(waiver.blockerPattern, 'i').test(blocker) && !new RegExp(waiver.excludePattern, 'i').test(blocker);
}

/**
 * Whether the fact that justifies the waiver holds for this text right now, decided from the
 * pinned manifest and never from the local cache. `null` upstream answers (no manifest, other
 * commit) count as "does not hold": a waiver must never rest on a guess.
 */
export function waiverConditionHolds(waiver: EditorialWaiver, collection: CollectionCode, uid: string): boolean {
  const resolved = resolveLayer(waiver.condition.layer, collection, uid);
  if (!resolved?.upstreamPath) return false;
  return upstreamPublishes(waiver.condition.layer, resolved.upstreamPath) === false;
}

/**
 * The waiver a scorecard may carry: every covered blocker listed, but only when the condition
 * holds and at least one blocker is covered. Returns undefined otherwise.
 */
export function eligibleWaiver(collection: CollectionCode, uid: string, blockers: string[]): QualityWaiver | undefined {
  for (const waiver of loadWaivers()) {
    const covered = blockers.filter((blocker) => blockerIsCovered(waiver, blocker));
    if (covered.length === 0) continue;
    if (!waiverConditionHolds(waiver, collection, uid)) continue;
    return { id: waiver.id, blockers: covered };
  }
  return undefined;
}
