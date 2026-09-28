/**
 * The pinned upstream manifest, read by the site.
 *
 * The site's job here is to be honest about what a reference layer does and does not
 * contain. That requires a distinction a file-existence test cannot make:
 *
 *   - the file is absent because the edition **does not publish this text** (1,596
 *     Khuddaka texts have no English anywhere on SuttaCentral), which is a property
 *     of the snapshot and nothing a translator can fix; versus
 *   - the file is absent because it **has not been fetched** into the local cache,
 *     which is a local state that will mislead anyone reading the page.
 *
 * Collapsing those two into "missing" is how a reader ends up believing a text has
 * no English reference when in fact nobody downloaded it. The manifest is the
 * authority: it is the git tree of the locked commit, committed to the repository, so
 * the site can answer the question without a network call and without guessing.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { loadLock } from './load';

const ROOT = process.cwd();

export interface UpstreamManifestEdition {
  layerId: string;
  language: string;
  translator: string;
  path: string;
  treeSha: string;
  fileCount: number;
  byteCount: number;
  files: Record<string, string>;
}

interface UpstreamManifest {
  commit: string;
  editions: UpstreamManifestEdition[];
}

let cached: UpstreamManifest | null = null;

function load(): UpstreamManifest | null {
  if (cached) return cached;
  const file = path.join(ROOT, 'source/upstream-manifest.json');
  if (!existsSync(file)) return null;
  cached = JSON.parse(readFileSync(file, 'utf8')) as UpstreamManifest;
  return cached;
}

export function manifestCommit(): string | null {
  return load()?.commit ?? null;
}

function editionFor(layerId: string): UpstreamManifestEdition | null {
  return load()?.editions.find((entry) => entry.layerId === layerId) ?? null;
}

/**
 * Does the pinned edition publish this file at the locked commit?
 *
 * Returns `true` when the manifest has the blob, `false` when it definitively does
 * not, and `null` when the question cannot be answered — no manifest, a layer that is
 * not upstream, or a manifest pinned to a different commit. `null` must never be
 * reported to a reader as "not published", because that would be inventing a fact.
 */
export function upstreamPublishes(layerId: string, upstreamPath: string): boolean | null {
  const manifest = load();
  if (!manifest || manifest.commit !== loadLock().commit) return null;
  const edition = editionFor(layerId);
  if (!edition) return null;
  if (!upstreamPath.startsWith(`${edition.path}/`)) return null;
  return edition.files[upstreamPath.slice(edition.path.length + 1)] !== undefined;
}
