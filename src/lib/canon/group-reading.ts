/**
 * Continuous reading of a group: which groups get it, and how their texts split into parts.
 *
 * Only a group whose children are all texts is read continuously. A larger group is a table of
 * contents whose sub-groups each have their own reading, so no page ever holds a whole saṁyutta or
 * nipāta. The segment count of a text is the key set the reader renders for it — the pinned Pāli
 * segments its UID owns — so the budget is measured in what the page will actually contain.
 */
import { listCollection, loadCatalog, loadSegmentMap, segmentMapForUid, sourcePathFor, upstreamFile } from './load';
import { groupNode, groupTexts, isLeafGroup, loadNavigation } from './groups';
import type { NavigationCollectionCode, NavigationNode } from './navigation-types';
import { planReadingParts, type ReadingEntry } from './reading-budget';

const countCache = new Map<string, number>();
const readingCache = new Map<NavigationCollectionCode, NavigationNode[]>();
const listingCache = new Map<NavigationCollectionCode, Map<string, ReturnType<typeof listCollection>[number]>>();

export function paliSegmentCount(code: NavigationCollectionCode, uid: string): number {
  const key = `${code}/${uid}`;
  const cached = countCache.get(key);
  if (cached !== undefined) return cached;
  const item = loadCatalog(code).texts.find((text) => text.uid === uid);
  const sourcePath = item ? sourcePathFor(code, uid, item.sourcePath) : null;
  const count = sourcePath ? Object.keys(segmentMapForUid(loadSegmentMap(upstreamFile(sourcePath)), uid)).length : 0;
  countCache.set(key, count);
  return count;
}

/** Parts of a group's continuous reading, or `null` when the group is not read continuously. */
export function groupReadingPlan(code: NavigationCollectionCode, id: string): ReadingEntry[][] | null {
  const node = groupNode(code, id);
  if (!node || !isLeafGroup(node)) return null;
  const parts = planReadingParts(groupTexts(code, id).map((uid) => ({ uid, segments: paliSegmentCount(code, uid) })));
  return parts.some((part) => part.some((entry) => entry.type === 'text')) ? parts : null;
}

/** Groups read continuously, in traversal order of the tree. */
export function readingGroups(code: NavigationCollectionCode): NavigationNode[] {
  const cached = readingCache.get(code);
  if (cached) return cached;
  const nav = loadNavigation(code);
  const out: NavigationNode[] = [];
  const walk = (id: string) => {
    const node = nav.nodes[id];
    if (id !== nav.rootId && isLeafGroup(node)) out.push(node);
    for (const child of node.children) if (child.type === 'group') walk(child.id);
  };
  walk(nav.rootId);
  const groups = out.filter((node) => groupReadingPlan(code, node.id) !== null);
  readingCache.set(code, groups);
  return groups;
}

/** The reading group before and after this one, crossing parent boundaries in tree order. */
export function adjacentReadingGroups(code: NavigationCollectionCode, id: string) {
  const groups = readingGroups(code);
  const index = groups.findIndex((node) => node.id === id);
  return { previous: index > 0 ? groups[index - 1] : undefined, next: index >= 0 ? groups[index + 1] : undefined };
}

export interface GroupStats {
  texts: number;
  withProjectText: number;
  byStatus: Record<string, number>;
}

/** Counts over the distinct reader URLs below a group; a URL is counted once however deep. */
export function groupStats(code: NavigationCollectionCode, id: string): GroupStats {
  const uids = new Set(groupTexts(code, id));
  let listing = listingCache.get(code);
  if (!listing) {
    listing = new Map(listCollection(code).map((item) => [item.uid, item]));
    listingCache.set(code, listing);
  }
  const items = [...uids].map((uid) => listing!.get(uid)!).filter(Boolean);
  const byStatus: Record<string, number> = {};
  for (const item of items) byStatus[item.status] = (byStatus[item.status] ?? 0) + 1;
  return { texts: uids.size, withProjectText: items.filter((item) => item.hasProjectData).length, byStatus };
}
