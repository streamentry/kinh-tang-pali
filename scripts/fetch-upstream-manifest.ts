/**
 * Fetch the authoritative file manifest for every pinned upstream edition.
 *
 * Why this exists: a check that only asks "does this file exist?" proved nothing
 * last round. The English layer was 100% present, 100% segment-aligned, and still
 * 12% of its segment values were empty strings. And ~600 English files sat in the
 * cache at paths nothing reads. Neither is visible to a presence test.
 *
 * So the ground truth comes from outside the repository: for each edition, the git
 * tree of the pinned commit, recording every blob's **git object hash**. A local file
 * can then be verified byte-for-byte against the pin with `git hash-object`, which
 * catches a file that is present but wrong, truncated, or edited.
 *
 * The output is committed as `source/upstream-manifest.json` so the expected shape of
 * the snapshot is reviewable in a diff, and `verify-store` reconciles against it.
 *
 *   node --import tsx scripts/fetch-upstream-manifest.ts
 *   node --import tsx scripts/fetch-upstream-manifest.ts --check
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { loadLock } from '../src/lib/canon/load';
import { manifestRootForLayer, storeLayers } from '../src/lib/canon/layers';

const OUT = 'source/upstream-manifest.json';
const API = 'https://api.github.com/repos/suttacentral/bilara-data';

interface Manifest {
  schemaVersion: number;
  repo: string;
  commit: string;
  fetchedAt: string;
  /** Human note about how the counts were produced. */
  method: string;
  editions: Array<{
    layerId: string;
    language: string;
    translator: string;
    /** Upstream directory the layer reads, e.g. `root/pli/ms/sutta`. */
    path: string;
    treeSha: string;
    fileCount: number;
    byteCount: number;
    /** path (relative to that directory) -> git blob hash. */
    files: Record<string, string>;
  }>;
}

function token(): string | undefined {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  try {
    return execFileSync('gh', ['auth', 'token'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || undefined;
  } catch {
    return undefined;
  }
}

async function api(pathOrUrl: string): Promise<unknown> {
  const headers: Record<string, string> = {
    'user-agent': 'kinh-tang-pali-verify',
    accept: 'application/vnd.github+json',
  };
  const auth = token();
  if (auth) headers.authorization = `Bearer ${auth}`;
  const response = await fetch(pathOrUrl, { headers });
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status} ${response.statusText} for ${pathOrUrl}`);
  }
  return response.json();
}

interface TreeEntry { type: string; name?: string; path: string; sha: string; size?: number; url: string }

/**
 * Git object hash of a directory path at a commit.
 *
 * The contents API returns a directory's *listing*, so the sha has to be read off
 * the parent listing and followed down one segment at a time.
 */
async function subtreeSha(rootPath: string, commit: string): Promise<string> {
  const segments = rootPath.split('/').filter(Boolean);
  let parent = '';
  let sha = '';
  for (const segment of segments) {
    const listing = await api(`${API}/contents/${parent}?ref=${commit}`) as TreeEntry[];
    if (!Array.isArray(listing)) throw new Error(`cannot list ${parent} at ${commit}`);
    const entry = listing.find((candidate) => candidate.name === segment);
    if (!entry) throw new Error(`${rootPath} does not exist at ${commit} (missing ${parent}/${segment})`);
    if (entry.type !== 'dir') throw new Error(`${rootPath}: ${parent}/${segment} is a file, not a directory`);
    sha = entry.sha;
    parent = parent ? `${parent}/${segment}` : segment;
  }
  return sha;
}

async function treeBlobs(sha: string): Promise<TreeEntry[]> {
  const response = await api(`${API}/git/trees/${sha}?recursive=1`) as { tree: TreeEntry[]; truncated: boolean };
  if (response.truncated) {
    throw new Error(`tree ${sha} was truncated by the API; cannot build a complete manifest`);
  }
  return response.tree.filter((entry) => entry.type === 'blob');
}

const lock = loadLock();
const editions: Manifest['editions'] = [];

for (const layer of storeLayers()) {
  if (layer.location.type !== 'upstream') continue;
  const upstreamRoot = manifestRootForLayer(layer);
  if (!upstreamRoot) continue;
  const edition = lock.referenceEditions.find((entry) => upstreamRoot.startsWith(entry.path));

  process.stdout.write(`fetching ${upstreamRoot} ... `);
  const treeSha = await subtreeSha(upstreamRoot, lock.commit);
  const blobs = await treeBlobs(treeSha);
  const files: Record<string, string> = {};
  let byteCount = 0;
  for (const blob of blobs) {
    files[blob.path] = blob.sha;
    byteCount += blob.size ?? 0;
  }
  console.log(`${blobs.length} file(s), ${(byteCount / 1e6).toFixed(2)} MB`);
  editions.push({
    layerId: layer.id,
    language: layer.language,
    translator: edition?.translator ?? '(root edition)',
    path: upstreamRoot,
    treeSha,
    fileCount: blobs.length,
    byteCount,
    files,
  });
}

const manifest: Manifest = {
  schemaVersion: 1,
  repo: lock.repo,
  commit: lock.commit,
  fetchedAt: new Date().toISOString(),
  method: 'GitHub trees API recursive listing of each pinned edition at the locked commit. '
    + '`files` maps each blob path to its git object hash, so a local file can be verified '
    + 'byte-for-byte against the pin with `git hash-object`.',
  editions,
};

const serialised = `${JSON.stringify(manifest, null, 1)}\n`;

if (process.argv.includes('--check')) {
  const current = readFileSync(OUT, 'utf8');
  const currentParsed = JSON.parse(current) as Manifest;
  if (currentParsed.commit !== lock.commit) {
    console.error(`${OUT}: commit ${currentParsed.commit} does not match the lock ${lock.commit}`);
    process.exit(1);
  }
  if (current === serialised) {
    console.log(`Upstream manifest is current: ${editions.reduce((n, e) => n + e.fileCount, 0)} file(s) across ${editions.length} edition(s).`);
    process.exit(0);
  }
  // Tree hashes change only when upstream content changes, so compare those rather
  // than the fetchedAt timestamp, which would make the file permanently dirty.
  const before = JSON.stringify(editions.map((e) => [e.path, e.treeSha, e.fileCount]));
  const after = JSON.stringify(currentParsed.editions.map((e) => [e.path, e.treeSha, e.fileCount]));
  if (before === after) {
    console.log('Upstream manifest is current (tree hashes unchanged).');
    process.exit(0);
  }
  console.error(`${OUT} is stale. Run: node --import tsx scripts/fetch-upstream-manifest.ts`);
  process.exit(1);
}

writeFileSync(OUT, serialised, 'utf8');
console.log(`Wrote ${OUT}`);
for (const edition of editions) {
  console.log(`  ${edition.layerId.padEnd(19)} ${String(edition.fileCount).padStart(5)} file(s)  tree ${edition.treeSha.slice(0, 12)}`);
}
