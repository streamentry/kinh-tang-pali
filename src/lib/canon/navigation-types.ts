/**
 * Data contract of the generated navigation tree (`content/navigation/traditional/*.json`).
 *
 * Navigation groups texts; it is not a version of any text, so it lives outside
 * `source/layers.yaml` and never carries scripture. A node names its children by id or UID and
 * nothing else. A child is either a group or a text, and the two never mix: a group id such as
 * `sn12` is not a reader UID, and the discriminated `type` keeps code from treating it as one.
 */
import type { CollectionCode } from './types';

export const NAVIGATION_SCHEMA_VERSION = 1;

/** The three collections that have a middle layer. DN and MN keep their flat directories. */
export type NavigationCollectionCode = Extract<CollectionCode, 'sn' | 'an' | 'kn'>;
export const NAVIGATION_COLLECTIONS: readonly NavigationCollectionCode[] = ['sn', 'an', 'kn'];

/**
 * Where a grouping comes from. Only `traditional` exists today: membership and branch order are
 * SuttaCentral's menu tree, unchanged. `edition-volume` (a printed volume's boundaries) and
 * `editorial` (a reading selection the project makes) are reserved so they can be added as
 * separate relations later without being mistaken for the traditional path.
 */
export type NavigationOrigin = 'traditional' | 'edition-volume' | 'editorial';

/**
 * The level of a group, read from the suffix of its verified Pāli name (see `kindForPaliName`).
 * `section` is the honest answer when the name does not say.
 */
export type NavigationGroupKind =
  | 'collection'
  | 'division'
  | 'samyutta'
  | 'nipata'
  | 'pannasaka'
  | 'vagga'
  | 'peyyala'
  | 'work'
  | 'section';

export type NavigationChild =
  | { type: 'group'; id: string }
  | {
    type: 'text';
    uid: string;
    /**
     * The pinned Pāli file the text is read from. Equal to `uid` except for AN bundles, where
     * one file (`an1.1-10`) serves several reader URLs (`an1.1` … `an1.10`).
     */
    sourceKey: string;
  };

export interface SourceRef {
  /** Repository-relative path of the file the value was read from. */
  path: string;
  /** Key or segment ID inside that file. */
  key: string;
}

/** Why a Vietnamese group name is what it is. Each origin has a different kind of evidence. */
export type VietnameseNameOrigin =
  /** SuttaCentral's own Vietnamese site translation, pinned in the navigation lock. */
  | 'suttacentral-site'
  /** A table of contents of a published Vietnamese translation, recorded with its page hash. */
  | 'reference-toc'
  /** The heading segment of the project's own translation whose Pāli heading is this name. */
  | 'project-heading';

export interface VietnameseName {
  text: string;
  origin: VietnameseNameOrigin;
  from: SourceRef;
  /** For `reference-toc`: who wrote the name. Never inferred from the distributor. */
  author?: string;
  /** For `project-heading`: the editorial status of the translation the heading is part of. */
  status?: string;
  /** Typographic normalisations applied to the source string, stated so the change is visible. */
  normalized?: string[];
}

/** A Vietnamese name a source offered and the generator refused, kept with its evidence. */
export interface RejectedVietnameseName {
  text: string;
  from: SourceRef;
  reason: 'untranslated' | 'excluded';
  /** For `excluded`: why, from `content/navigation/names/heading-exclusions.yaml`. */
  note?: string;
}

export interface NavigationGroupName {
  /** The Pāli name from SuttaCentral's root name registry; `null` when the registry has none. */
  pali: { text: string; from: SourceRef } | null;
  /** `null` with `viMissing: true` when no verified Vietnamese name exists. Never guessed. */
  vi: VietnameseName | null;
  viMissing: boolean;
  /** Names that were offered and refused. Recorded so a fix upstream or in the corpus is noticed. */
  viRejected?: RejectedVietnameseName[];
}

export interface NavigationNode {
  id: string;
  collection: NavigationCollectionCode;
  kind: NavigationGroupKind;
  origin: NavigationOrigin;
  parentId: string | null;
  /** 0 for the collection root. */
  depth: number;
  children: NavigationChild[];
  name: NavigationGroupName;
  /** Distinct reader URLs below this node. */
  textCount: number;
  firstUid: string;
  lastUid: string;
  /** The upstream tree file this node was read from. */
  treePath: string;
}

export interface NavigationCollection {
  schemaVersion: typeof NAVIGATION_SCHEMA_VERSION;
  collection: NavigationCollectionCode;
  origin: 'traditional';
  source: { repo: string; commit: string; files: string[] };
  rootId: string;
  counts: {
    /** Group nodes below the collection root. */
    groups: number;
    /** Reader URLs (catalogue entries). */
    texts: number;
    /** Distinct pinned Pāli files those URLs are read from (= upstream tree leaves). */
    sourceFiles: number;
    /** Source files that serve more than one reader URL. */
    bundles: number;
    /** Reader URLs served from such bundles. */
    textsInBundles: number;
    /** Groups with no verified Vietnamese name. */
    groupsWithoutVietnameseName: number;
  };
  nodes: Record<string, NavigationNode>;
  /** Every reader UID in traversal order of the pinned tree. Replaces nothing; `order` stays. */
  order: string[];
}
