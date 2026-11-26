/**
 * Build the traditional navigation tree of one collection from pinned inputs.
 *
 * Everything here is a pure function of its arguments, so the negative cases (a missing leaf, a
 * node with two parents, an overlapping bundle, a name without provenance) can be tested against
 * small fixtures instead of the corpus. `scripts/navigation.ts` supplies the real inputs.
 *
 * Membership and branch order come from the SuttaCentral tree unchanged. The one ordering the
 * tree cannot give is the order of reader URLs inside an AN bundle file (`an1.1-10` serves ten
 * URLs); that order is read from the pinned Pāli file itself, by which segment each URL owns
 * first under `segmentBelongsToUid`. UID strings are never sorted.
 */
import path from 'node:path';
import { segmentBelongsToUid } from '../../src/lib/canon/load';
import type { CatalogText } from '../../src/lib/canon/types';
import {
  NAVIGATION_SCHEMA_VERSION,
  type NavigationChild,
  type NavigationCollection,
  type NavigationCollectionCode,
  type NavigationGroupKind,
  type NavigationGroupName,
  type NavigationNode,
  type RejectedVietnameseName,
  type SourceRef,
  type VietnameseName,
} from '../../src/lib/canon/navigation-types';

export type HeadingResult = { name: VietnameseName } | { rejected: RejectedVietnameseName } | null;

export interface TreeFile {
  path: string;
  /** The parsed JSON of the tree file. */
  tree: unknown;
  /** The node the file's top-level group hangs under; `null` when the file holds the root itself. */
  parentId: string | null;
}

export interface NameSources {
  pali: ReadonlyMap<string, { text: string; from: SourceRef }>;
  site: ReadonlyMap<string, { text: string; from: SourceRef; normalized?: string[] }>;
  reference: ReadonlyMap<string, { text: string; from: SourceRef; author: string }>;
  /** The project's own heading for a group, found from the group's first text. */
  heading: (groupId: string, paliName: string, firstUid: string) => HeadingResult;
}

export interface BuildInput {
  collection: NavigationCollectionCode;
  repo: string;
  commit: string;
  rootId: string;
  /** Present when the root is not itself a node of any tree file (KN: the super-tree's `kn`). */
  rootTreePath?: string;
  trees: TreeFile[];
  catalog: readonly CatalogText[];
  /** Segment IDs of a pinned Pāli file, in file order. */
  segmentKeys: (sourceKey: string) => readonly string[];
  names: NameSources;
}

export function sourceKeyOf(text: CatalogText): string {
  if (!text.sourcePath) throw new Error(`${text.uid}: catalogue entry has no sourcePath`);
  const base = path.posix.basename(text.sourcePath);
  if (!base.endsWith('_root-pli-ms.json')) throw new Error(`${text.uid}: unexpected sourcePath ${text.sourcePath}`);
  return base.slice(0, -'_root-pli-ms.json'.length);
}

/** Level of a group from the suffix of its verified Pāli name; `section` when the name does not say. */
export function kindForPaliName(name: string | null): NavigationGroupKind {
  if (!name) return 'section';
  const value = name.normalize('NFC').toLowerCase().replace(/ṃ/g, 'ṁ').trim();
  if (value.endsWith('vaggasaṁyutta')) return 'division';
  if (value.endsWith('saṁyutta')) return 'samyutta';
  if (value.endsWith('nipāta')) return 'nipata';
  if (/paṇṇāsa(ka)?$/.test(value)) return 'pannasaka';
  if (value.endsWith('vagga')) return 'vagga';
  if (value.includes('peyyāla')) return 'peyyala';
  return 'section';
}

interface RawGroup { id: string; parentId: string | null; treePath: string; children: Array<{ type: 'group'; id: string } | { type: 'leaf'; key: string }> }

/** Walk one tree file. Strings are leaves; objects map group ids to their children. */
function parseTree(file: TreeFile, groups: Map<string, RawGroup>, problems: string[]): void {
  const visit = (value: unknown, parent: RawGroup | null, where: string): void => {
    if (typeof value === 'string') {
      if (!parent) { problems.push(`${file.path}: leaf ${value} outside any group`); return; }
      parent.children.push({ type: 'leaf', key: value });
      return;
    }
    if (Array.isArray(value)) {
      for (const child of value) visit(child, parent, where);
      return;
    }
    if (value && typeof value === 'object') {
      for (const [id, children] of Object.entries(value as Record<string, unknown>)) {
        const parentId = parent ? parent.id : file.parentId;
        if (groups.has(id)) {
          const other = groups.get(id)!;
          problems.push(`${file.path}: group ${id} appears twice (parents ${other.parentId ?? '∅'} and ${parentId ?? '∅'})`);
          continue;
        }
        const group: RawGroup = { id, parentId, treePath: file.path, children: [] };
        groups.set(id, group);
        if (parent) parent.children.push({ type: 'group', id });
        visit(children, group, `${where}/${id}`);
      }
      return;
    }
    problems.push(`${file.path}: unexpected value at ${where}: ${JSON.stringify(value)}`);
  };
  visit(file.tree, null, '');
}

/**
 * Reader URLs served by one tree leaf, in reading order.
 *
 * A leaf is a pinned Pāli file. When one catalogue URL reads it, that URL must be the leaf
 * itself. When several do (an AN bundle), each must own at least one segment, no segment may be
 * owned twice, and every segment must be owned — otherwise part of the file would be shown twice
 * or never. Their order is the order in which each first owns a segment.
 */
export function resolveLeaf(
  leaf: string,
  members: readonly CatalogText[],
  segmentKeys: readonly string[],
): { uids: string[]; problems: string[] } {
  const problems: string[] = [];
  if (members.length === 0) return { uids: [], problems: [`leaf ${leaf}: no catalogue URL reads this source file`] };
  if (members.length === 1) {
    if (members[0].uid !== leaf) problems.push(`leaf ${leaf}: the only URL reading it is ${members[0].uid}`);
    return { uids: [members[0].uid], problems };
  }
  if (segmentKeys.length === 0) return { uids: [], problems: [`leaf ${leaf}: bundle of ${members.length} URLs but the pinned Pāli file has no segments (cache missing?)`] };
  const first = new Map<string, number>();
  segmentKeys.forEach((key, index) => {
    const owners = members.filter((member) => segmentBelongsToUid(member.uid, key));
    if (owners.length === 0) problems.push(`leaf ${leaf}: segment ${key} belongs to no URL`);
    if (owners.length > 1) problems.push(`leaf ${leaf}: segment ${key} belongs to ${owners.map((owner) => owner.uid).join(' and ')}`);
    for (const owner of owners) if (!first.has(owner.uid)) first.set(owner.uid, index);
  });
  for (const member of members) if (!first.has(member.uid)) problems.push(`leaf ${leaf}: ${member.uid} owns no segment of the file`);
  const uids = [...members].filter((member) => first.has(member.uid))
    .sort((a, b) => first.get(a.uid)! - first.get(b.uid)!)
    .map((member) => member.uid);
  return { uids, problems };
}

export function buildNavigation(input: BuildInput): NavigationCollection {
  const problems: string[] = [];
  const groups = new Map<string, RawGroup>();
  if (input.rootTreePath) groups.set(input.rootId, { id: input.rootId, parentId: null, treePath: input.rootTreePath, children: [] });
  for (const file of input.trees) {
    const before = new Set(groups.keys());
    parseTree(file, groups, problems);
    if (file.parentId) {
      const parent = groups.get(file.parentId);
      if (!parent) problems.push(`${file.path}: parent ${file.parentId} is unknown`);
      else for (const id of groups.keys()) if (!before.has(id) && groups.get(id)!.parentId === file.parentId) parent.children.push({ type: 'group', id });
    }
  }
  const root = groups.get(input.rootId);
  if (!root) throw new NavigationError([`root ${input.rootId} is not in the tree`, ...problems]);

  const bySource = new Map<string, CatalogText[]>();
  const catalogUids = new Set<string>();
  for (const text of input.catalog) {
    if (catalogUids.has(text.uid)) problems.push(`catalogue lists ${text.uid} twice`);
    catalogUids.add(text.uid);
    let key: string;
    try { key = sourceKeyOf(text); } catch (error) { problems.push((error as Error).message); continue; }
    const list = bySource.get(key) ?? [];
    list.push(text);
    bySource.set(key, list);
  }

  const nodes: Record<string, NavigationNode> = {};
  const order: string[] = [];
  const seenLeaves = new Set<string>();
  const visiting = new Set<string>();
  const build = (group: RawGroup, depth: number): NavigationNode => {
    if (visiting.has(group.id)) throw new NavigationError([`cycle through ${group.id}`]);
    visiting.add(group.id);
    const children: NavigationChild[] = [];
    const uids: string[] = [];
    for (const child of group.children) {
      if (child.type === 'group') {
        const sub = groups.get(child.id)!;
        const node = build(sub, depth + 1);
        children.push({ type: 'group', id: node.id });
        if (node.textCount > 0) uids.push(...descendantUids(nodes, node.id));
      } else {
        if (seenLeaves.has(child.key)) problems.push(`leaf ${child.key} appears twice in the tree`);
        seenLeaves.add(child.key);
        const members = bySource.get(child.key) ?? [];
        const resolved = resolveLeaf(child.key, members, members.length > 1 ? input.segmentKeys(child.key) : []);
        problems.push(...resolved.problems);
        for (const uid of resolved.uids) {
          children.push({ type: 'text', uid, sourceKey: child.key });
          uids.push(uid);
          order.push(uid);
        }
      }
    }
    visiting.delete(group.id);
    const pali = input.names.pali.get(group.id) ?? null;
    const isRoot = group.id === input.rootId;
    const kind: NavigationGroupKind = isRoot ? 'collection'
      : input.collection === 'kn' && group.parentId === input.rootId ? 'work'
        : kindForPaliName(pali?.text ?? null);
    const node: NavigationNode = {
      id: group.id,
      collection: input.collection,
      kind,
      origin: 'traditional',
      parentId: group.parentId,
      depth,
      children,
      name: { pali, vi: null, viMissing: true },
      textCount: uids.length,
      firstUid: uids[0] ?? '',
      lastUid: uids[uids.length - 1] ?? '',
      treePath: group.treePath,
    };
    if (uids.length === 0) problems.push(`group ${group.id} contains no text`);
    if (!isRoot) {
      if (!pali) problems.push(`group ${group.id} has no Pāli name in the root name registry`);
      node.name = groupName(group.id, pali, node.firstUid, input.names);
    }
    nodes[group.id] = node;
    return node;
  };
  build(root, 0);

  for (const group of groups.values()) if (!nodes[group.id]) problems.push(`group ${group.id} is not reachable from ${input.rootId}`);
  for (const key of bySource.keys()) if (!seenLeaves.has(key)) problems.push(`source file ${key} (${bySource.get(key)!.map((text) => text.uid).join(', ')}) is not a leaf of the tree`);
  if (problems.length) throw new NavigationError(problems);

  const bundles = [...bySource.values()].filter((members) => members.length > 1);
  const collection: NavigationCollection = {
    schemaVersion: NAVIGATION_SCHEMA_VERSION,
    collection: input.collection,
    origin: 'traditional',
    source: { repo: input.repo, commit: input.commit, files: [...new Set([...(input.rootTreePath ? [input.rootTreePath] : []), ...input.trees.map((file) => file.path)])] },
    rootId: input.rootId,
    counts: {
      groups: Object.keys(nodes).length - 1,
      texts: order.length,
      sourceFiles: seenLeaves.size,
      bundles: bundles.length,
      textsInBundles: bundles.reduce((sum, members) => sum + members.length, 0),
      groupsWithoutVietnameseName: Object.values(nodes).filter((node) => node.id !== input.rootId && node.name.viMissing).length,
    },
    nodes,
    order,
  };
  const check = checkNavigation(collection, input.catalog);
  if (check.length) throw new NavigationError(check);
  return collection;
}

/**
 * Pāli and Vietnamese name of a group. Vietnamese sources in order of precedence: SuttaCentral's
 * own Vietnamese site names, then an attributed reference table of contents, then the project's
 * own heading. A refused heading is kept in `viRejected` instead of disappearing.
 */
function groupName(id: string, pali: NavigationGroupName['pali'], firstUid: string, names: NameSources): NavigationGroupName {
  const site = names.site.get(id);
  if (site) return { pali, vi: { text: site.text, origin: 'suttacentral-site', from: site.from, ...(site.normalized?.length ? { normalized: site.normalized } : {}) }, viMissing: false };
  const reference = names.reference.get(id);
  if (reference) return { pali, vi: { text: reference.text, origin: 'reference-toc', from: reference.from, author: reference.author }, viMissing: false };
  const heading = pali && firstUid ? names.heading(id, pali.text, firstUid) : null;
  if (heading && 'name' in heading) return { pali, vi: heading.name, viMissing: false };
  if (heading && 'rejected' in heading) return { pali, vi: null, viMissing: true, viRejected: [heading.rejected] };
  return { pali, vi: null, viMissing: true };
}

/** Text UIDs below a node, in traversal order. */
export function descendantUids(nodes: Record<string, NavigationNode>, id: string): string[] {
  const node = nodes[id];
  if (!node) return [];
  return node.children.flatMap((child) => child.type === 'text' ? [child.uid] : descendantUids(nodes, child.id));
}

export class NavigationError extends Error {
  constructor(readonly problems: string[]) {
    super(`navigation is not valid:\n  - ${problems.slice(0, 50).join('\n  - ')}${problems.length > 50 ? `\n  … ${problems.length - 50} more` : ''}`);
  }
}

/**
 * Structural invariants of a navigation collection, against the catalogue it must cover.
 * Returns every problem found; an empty list means the tree is sound.
 */
export function checkNavigation(nav: NavigationCollection, catalog: readonly CatalogText[]): string[] {
  const problems: string[] = [];
  const nodes = nav.nodes;
  const root = nodes[nav.rootId];
  if (!root) return [`root ${nav.rootId} is missing`];
  if (root.parentId !== null || root.depth !== 0) problems.push(`root ${nav.rootId} has a parent or non-zero depth`);
  const parents = new Map<string, string[]>();
  const textHomes = new Map<string, string[]>();
  for (const [key, node] of Object.entries(nodes)) {
    if (node.id !== key) problems.push(`node keyed ${key} has id ${node.id}`);
    if (node.collection !== nav.collection) problems.push(`${key}: collection ${node.collection} in ${nav.collection}`);
    for (const child of node.children) {
      if (child.type === 'group') {
        if (!nodes[child.id]) problems.push(`${key}: child group ${child.id} does not exist`);
        parents.set(child.id, [...(parents.get(child.id) ?? []), key]);
      } else {
        textHomes.set(child.uid, [...(textHomes.get(child.uid) ?? []), key]);
      }
    }
    if (key !== nav.rootId) {
      if (node.name.vi === null && !node.name.viMissing) problems.push(`${key}: no Vietnamese name but not marked missing`);
      if (node.name.vi && (!node.name.vi.from?.path || !node.name.vi.from?.key || !node.name.vi.text.trim())) problems.push(`${key}: Vietnamese name without provenance`);
      if (node.name.vi && node.name.viMissing) problems.push(`${key}: Vietnamese name present but marked missing`);
      if (!node.name.pali || !node.name.pali.from?.path || !node.name.pali.from?.key) problems.push(`${key}: Pāli name without provenance`);
    }
  }
  for (const [key, node] of Object.entries(nodes)) {
    if (key === nav.rootId) continue;
    const listedBy = parents.get(key) ?? [];
    if (listedBy.length !== 1) problems.push(`${key}: listed as a child by ${listedBy.length} groups (${listedBy.join(', ') || 'none'})`);
    if (node.parentId === null || !nodes[node.parentId]) problems.push(`${key}: parent ${node.parentId} does not exist`);
    else {
      if (listedBy.length === 1 && listedBy[0] !== node.parentId) problems.push(`${key}: parentId ${node.parentId} but listed by ${listedBy[0]}`);
      if (node.depth !== nodes[node.parentId].depth + 1) problems.push(`${key}: depth ${node.depth} under depth ${nodes[node.parentId].depth}`);
    }
    // Walking up must reach the root without revisiting a node.
    const seen = new Set<string>();
    let cursor: string | null = key;
    while (cursor && cursor !== nav.rootId) {
      if (seen.has(cursor)) { problems.push(`${key}: ancestor cycle through ${cursor}`); break; }
      seen.add(cursor);
      cursor = nodes[cursor]?.parentId ?? null;
    }
    if (cursor !== nav.rootId) problems.push(`${key}: does not reach the root`);
  }
  const catalogUids = new Set(catalog.map((text) => text.uid));
  const sourceOf = new Map(catalog.map((text) => [text.uid, text.sourcePath ? sourceKeyOf(text) : '']));
  for (const uid of catalogUids) {
    const homes = textHomes.get(uid) ?? [];
    if (homes.length !== 1) problems.push(`${uid}: in ${homes.length} groups (${homes.join(', ') || 'none'})`);
  }
  for (const [uid] of textHomes) if (!catalogUids.has(uid)) problems.push(`${uid}: in the tree but not in the catalogue`);
  for (const node of Object.values(nodes)) {
    for (const child of node.children) {
      if (child.type === 'text' && sourceOf.has(child.uid) && sourceOf.get(child.uid) !== child.sourceKey) {
        problems.push(`${child.uid}: sourceKey ${child.sourceKey}, the catalogue reads ${sourceOf.get(child.uid)}`);
      }
    }
  }
  const traversal = descendantUids(nodes, nav.rootId);
  if (traversal.join('\n') !== nav.order.join('\n')) problems.push('order differs from the depth-first traversal of the tree');
  for (const node of Object.values(nodes)) {
    const uids = descendantUids(nodes, node.id);
    if (node.textCount !== uids.length) problems.push(`${node.id}: textCount ${node.textCount}, has ${uids.length}`);
    if ((uids[0] ?? '') !== node.firstUid || (uids[uids.length - 1] ?? '') !== node.lastUid) problems.push(`${node.id}: first/last UID do not match its texts`);
  }
  if (nav.counts.texts !== catalogUids.size) problems.push(`counts.texts ${nav.counts.texts}, catalogue has ${catalogUids.size}`);
  if (nav.counts.groups !== Object.keys(nodes).length - 1) problems.push(`counts.groups ${nav.counts.groups}, has ${Object.keys(nodes).length - 1}`);
  return problems;
}
