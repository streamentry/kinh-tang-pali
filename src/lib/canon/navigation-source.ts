/**
 * The pinned SuttaCentral structure files the navigation tree is generated from.
 *
 * Navigation has its own lock, `source/navigation.lock.json`, separate from the bilara pin
 * (the Pāli authority) and from `legacyHtml` (the whole-text Vietnamese). It may share a
 * commit with `legacyHtml` today, but replacing a reference text must never silently replace
 * how texts are grouped, so the two pins move independently.
 *
 * The lock names every file the generator reads, and for each one the git blob hash and the
 * SHA-256 of its bytes. `npm run navigation:sync` proves commit → tree → blob → bytes for all
 * of them; nothing is read from a branch name.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { EditionLicense } from './load';

const ROOT = process.cwd();

export const NAVIGATION_LOCK_PATH = path.join(ROOT, 'source/navigation.lock.json');
export const NAVIGATION_CACHE_DIR = path.join(ROOT, '.cache/upstream/sc-data-navigation');

/** What a pinned file is used for. Each role has its own licence statement in the lock. */
export type NavigationFileRole = 'readme' | 'tree' | 'name-root' | 'name-vi' | 'licensing';

export interface NavigationLockFile {
  path: string;
  role: NavigationFileRole;
  /** git blob hash (`git hash-object`) of the file at the pinned commit. */
  gitBlob: string;
  sha256: string;
  bytes: number;
}

export interface NavigationLock {
  repo: string;
  ref: string;
  commit: string;
  pinnedAt: string;
  /** Sparse-checkout patterns; every locked file must fall under one of them. */
  sparsePaths: string[];
  /** Which upstream tree files make up each collection, in reading order. */
  collections: {
    sn: { trees: string[] };
    an: { trees: string[] };
    /** KN has no single tree file: its works are the children of `kn` in the super-tree. */
    kn: { superTreeNode: string };
  };
  licenses: Record<NavigationFileRole, EditionLicense>;
  files: NavigationLockFile[];
  note: string;
}

export function loadNavigationLock(file = NAVIGATION_LOCK_PATH): NavigationLock {
  return JSON.parse(readFileSync(file, 'utf8')) as NavigationLock;
}

export function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

/** git's blob hash of a byte string, computed without git so it can check git's own answer. */
export function gitBlobHash(bytes: Buffer): string {
  return createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
}

export function navigationCacheFile(relativePath: string, cacheDir = NAVIGATION_CACHE_DIR): string {
  return path.join(cacheDir, relativePath);
}

/**
 * A GitHub `git/trees` listing. The API cuts long recursive listings and says so with
 * `truncated: true`; a cut listing is missing files, so it is never accepted as complete.
 */
export interface TreeListing {
  sha: string;
  truncated: boolean;
  tree: Array<{ path: string; type: string; sha: string }>;
}

export function assertCompleteTreeListing(listing: TreeListing, label: string): void {
  if (listing.truncated !== false) {
    throw new Error(`${label}: the tree listing is truncated (truncated=${String(listing.truncated)}); fetch the sub-tree instead of trusting a partial list`);
  }
}
