/**
 * Runtime access to the generated traditional navigation (`content/navigation/traditional/*.json`).
 *
 * Read-only and memoised. Nothing here derives membership or order: both were fixed by
 * `npm run navigation:generate` from the pinned SuttaCentral tree and are checked in CI by
 * `navigation:check` and the independent `scripts/verify-navigation.py`. This module only walks
 * what was generated — ancestors for a breadcrumb, the texts of a group, the neighbours of a text
 * in traversal order — so the site cannot drift from the checked data.
 *
 * DN and MN have no middle layer; every function returns the empty answer for them, and their
 * pages keep the catalogue `order` they have always used.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { CollectionCode } from './types';
import {
  NAVIGATION_COLLECTIONS,
  type NavigationCollection,
  type NavigationCollectionCode,
  type NavigationGroupKind,
  type NavigationNode,
} from './navigation-types';

const cache = new Map<NavigationCollectionCode, NavigationCollection>();
const homeCache = new Map<NavigationCollectionCode, Map<string, string>>();

export function hasNavigation(code: CollectionCode): code is NavigationCollectionCode {
  return (NAVIGATION_COLLECTIONS as readonly string[]).includes(code);
}

export function loadNavigation(code: NavigationCollectionCode): NavigationCollection {
  const cached = cache.get(code);
  if (cached) return cached;
  const file = path.join(process.cwd(), 'content/navigation/traditional', `${code}.json`);
  const parsed = JSON.parse(readFileSync(file, 'utf8')) as NavigationCollection;
  cache.set(code, parsed);
  return parsed;
}

export function groupNode(code: NavigationCollectionCode, id: string): NavigationNode | undefined {
  return loadNavigation(code).nodes[id];
}

/** Every group below the collection root, in traversal (pre-)order. */
export function allGroups(code: NavigationCollectionCode): NavigationNode[] {
  const nav = loadNavigation(code);
  const out: NavigationNode[] = [];
  const walk = (id: string) => {
    const node = nav.nodes[id];
    if (id !== nav.rootId) out.push(node);
    for (const child of node.children) if (child.type === 'group') walk(child.id);
  };
  walk(nav.rootId);
  return out;
}

/** The group that lists `uid` directly. */
export function homeGroupId(code: NavigationCollectionCode, uid: string): string | undefined {
  let homes = homeCache.get(code);
  if (!homes) {
    homes = new Map();
    for (const node of Object.values(loadNavigation(code).nodes)) {
      for (const child of node.children) if (child.type === 'text') homes.set(child.uid, node.id);
    }
    homeCache.set(code, homes);
  }
  return homes.get(uid);
}

/** Ancestors of a group, root first, ending with the group itself. */
export function groupPath(code: NavigationCollectionCode, id: string): NavigationNode[] {
  const nav = loadNavigation(code);
  const out: NavigationNode[] = [];
  let cursor: string | null = id;
  while (cursor) {
    const node: NavigationNode | undefined = nav.nodes[cursor];
    if (!node) break;
    out.unshift(node);
    cursor = node.parentId;
  }
  return out;
}

/** Ancestors of a text, root first, ending with the group that lists it. Empty for DN/MN. */
export function textPath(code: CollectionCode, uid: string): NavigationNode[] {
  if (!hasNavigation(code)) return [];
  const home = homeGroupId(code, uid);
  return home ? groupPath(code, home) : [];
}

/** Text UIDs below a group, in traversal order. */
export function groupTexts(code: NavigationCollectionCode, id: string): string[] {
  const node = groupNode(code, id);
  if (!node) return [];
  return node.children.flatMap((child) => child.type === 'text' ? [child.uid] : groupTexts(code, child.id));
}

export function childGroups(code: NavigationCollectionCode, id: string): NavigationNode[] {
  const node = groupNode(code, id);
  if (!node) return [];
  return node.children.flatMap((child) => child.type === 'group' ? [groupNode(code, child.id)!] : []);
}

/** Groups whose children are texts only — the units continuous reading works on. */
export function isLeafGroup(node: NavigationNode): boolean {
  return node.children.length > 0 && node.children.every((child) => child.type === 'text');
}

/**
 * Previous and next text in the traversal order of the pinned tree.
 * `scope` limits the walk to one group the text belongs to; any other id is ignored.
 */
export function navigationNeighbours(code: NavigationCollectionCode, uid: string, scope?: string) {
  const inScope = scope && groupTexts(code, scope).includes(uid);
  const order = inScope ? groupTexts(code, scope) : loadNavigation(code).order;
  const index = order.indexOf(uid);
  return {
    previous: index > 0 ? order[index - 1] : undefined,
    next: index >= 0 && index < order.length - 1 ? order[index + 1] : undefined,
    scope: inScope ? scope : undefined,
  };
}

/** Previous and next sibling group, for walking a level without climbing back up. */
export function siblingGroups(code: NavigationCollectionCode, id: string) {
  const node = groupNode(code, id);
  if (!node?.parentId) return { previous: undefined, next: undefined };
  const siblings = childGroups(code, node.parentId);
  const index = siblings.findIndex((sibling) => sibling.id === id);
  return { previous: siblings[index - 1], next: siblings[index + 1] };
}

/**
 * Words for a level. AN and Itivuttaka count teachings (`Chương`); the verse collections of KN
 * count verses (`Nhóm`), the convention the editorial council fixed for Jātaka (C3).
 */
export function levelLabel(node: Pick<NavigationNode, 'kind' | 'collection' | 'id'>): string {
  const labels: Record<NavigationGroupKind, string> = {
    collection: 'Bộ',
    division: 'Thiên',
    samyutta: 'Tương ưng',
    nipata: node.collection === 'kn' && !node.id.startsWith('iti') ? 'Nhóm' : 'Chương',
    pannasaka: 'Nhóm năm mươi',
    vagga: 'Phẩm',
    peyyala: 'Phần lược',
    work: 'Tác phẩm',
    section: 'Phần',
  };
  return labels[node.kind];
}

/** What to call a group: its verified Vietnamese name, or its Pāli name with the level word. */
export function groupTitle(node: NavigationNode): { primary: string; pali: string | null; hasVietnamese: boolean } {
  const pali = node.name.pali?.text ?? null;
  if (node.name.vi) return { primary: node.name.vi.text, pali, hasVietnamese: true };
  return { primary: pali ? `${levelLabel(node)} ${pali}` : node.id, pali, hasVietnamese: false };
}

export function groupHref(code: NavigationCollectionCode, id: string): string {
  return `sutta/${code}/nhom/${id}/`;
}

export function groupReadingHref(code: NavigationCollectionCode, id: string): string {
  return `sutta/${code}/nhom/${id}/doc/`;
}

/** `SN12.11–SN12.20`, from the first and last reader URL below the group. */
export function groupRange(node: NavigationNode): string {
  const first = node.firstUid.toUpperCase();
  const last = node.lastUid.toUpperCase();
  return first === last ? first : `${first}–${last}`;
}
