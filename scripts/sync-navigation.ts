/**
 * Fetch the pinned SuttaCentral structure files into `.cache/upstream/sc-data-navigation`.
 *
 *   npm run navigation:sync          fetch (or repair) the cache, then verify every locked file
 *   npm run navigation:sync -- --check   verify only; exit 1 when the cache is missing or differs
 *   npm run navigation:sync -- --remote  also compare the lock with GitHub's tree API
 *   npm run navigation:sync -- --write-lock   record the file list and hashes of a new pin
 *
 * Same method as `legacy:sync`: a blob-less sparse git checkout of one commit, so git verifies
 * every object it receives. On top of that each locked file is checked three ways — the bytes'
 * own blob hash, the blob the pinned commit's tree names for that path, and the hash the lock
 * recorded — and its SHA-256. A file that disagrees anywhere fails the run with its path.
 *
 * `--write-lock` is for moving the pin, which is an editorial decision: it only rewrites the
 * `files` list for the commit already named in the lock, and never changes the commit itself.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  NAVIGATION_CACHE_DIR,
  NAVIGATION_LOCK_PATH,
  assertCompleteTreeListing,
  gitBlobHash,
  loadNavigationLock,
  navigationCacheFile,
  sha256,
  type NavigationFileRole,
  type NavigationLock,
  type NavigationLockFile,
  type TreeListing,
} from '../src/lib/canon/navigation-source';

const args = new Set(process.argv.slice(2));
const checkOnly = args.has('--check');
const writeLock = args.has('--write-lock');
const remote = args.has('--remote');
const lock = loadNavigationLock();

function gitEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith('GIT_')) env[key] = value;
  }
  return { ...env, GIT_TERMINAL_PROMPT: '0', GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' };
}

function git(gitArgs: string[]): string {
  return execFileSync('git', ['-c', 'core.hooksPath=/dev/null', ...gitArgs], {
    cwd: NAVIGATION_CACHE_DIR,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: gitEnv(),
    maxBuffer: 64 * 1024 * 1024,
  }).trim();
}

/** Blob hashes the pinned commit's tree records, for the given paths. */
function committedBlobs(paths: string[]): Map<string, string> {
  const out = new Map<string, string>();
  if (paths.length === 0) return out;
  const listing = git(['ls-tree', '-r', lock.commit, '--', ...paths]);
  for (const line of listing.split('\n').filter(Boolean)) {
    const match = line.match(/^\d+ blob ([0-9a-f]{40})\t(.+)$/);
    if (match) out.set(match[2], match[1]);
  }
  return out;
}

function verify(files: NavigationLockFile[]): string[] {
  if (!existsSync(path.join(NAVIGATION_CACHE_DIR, '.git'))) return ['no checkout at .cache/upstream/sc-data-navigation'];
  const problems: string[] = [];
  let head = '';
  try { head = git(['rev-parse', 'HEAD']); } catch { problems.push('the checkout has no HEAD'); }
  if (head && head !== lock.commit) problems.push(`HEAD is ${head.slice(0, 12)}, the pin is ${lock.commit.slice(0, 12)}`);
  if (problems.length) return problems;
  if (files.length === 0) return ['the lock lists no files; run with --write-lock once for this pin'];
  const committed = committedBlobs(files.map((file) => file.path));
  for (const file of files) {
    if (!lock.sparsePaths.some((prefix) => file.path === prefix || file.path.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`))) {
      problems.push(`${file.path}: not covered by any sparse path in the lock`);
      continue;
    }
    const full = navigationCacheFile(file.path);
    if (!existsSync(full)) { problems.push(`${file.path}: missing from the cache`); continue; }
    const bytes = readFileSync(full);
    const blob = gitBlobHash(bytes);
    const fromTree = committed.get(file.path);
    if (!fromTree) problems.push(`${file.path}: the pinned commit has no such file`);
    else if (fromTree !== file.gitBlob) problems.push(`${file.path}: the commit tree names blob ${fromTree.slice(0, 12)}, the lock records ${file.gitBlob.slice(0, 12)}`);
    if (blob !== file.gitBlob) problems.push(`${file.path}: bytes hash to blob ${blob.slice(0, 12)}, the lock records ${file.gitBlob.slice(0, 12)}`);
    if (bytes.length !== file.bytes) problems.push(`${file.path}: ${bytes.length} bytes, the lock records ${file.bytes}`);
    if (sha256(bytes) !== file.sha256) problems.push(`${file.path}: SHA-256 differs from the lock`);
  }
  return problems;
}

function fetchPin(): void {
  mkdirSync(NAVIGATION_CACHE_DIR, { recursive: true });
  if (!existsSync(path.join(NAVIGATION_CACHE_DIR, '.git'))) {
    git(['init', '-q']);
    git(['remote', 'add', 'origin', lock.repo]);
  }
  git(['remote', 'set-url', 'origin', lock.repo]);
  git(['config', 'core.sparseCheckout', 'true']);
  git(['config', 'core.sparseCheckoutCone', 'false']);
  git(['config', 'remote.origin.promisor', 'true']);
  git(['config', 'remote.origin.partialclonefilter', 'blob:none']);
  const patterns = lock.sparsePaths.map((entry) => `/${entry}`).join('\n');
  writeFileSync(path.join(NAVIGATION_CACHE_DIR, '.git/info/sparse-checkout'), `${patterns}\n`);
  git(['fetch', '-q', '--depth', '1', '--filter=blob:none', 'origin', lock.commit]);
  git(['checkout', '-q', '-f', '--detach', lock.commit]);
}

/** The files a pin needs: the README, the trees of the three collections, and their names. */
function requiredFiles(): Array<{ path: string; role: NavigationFileRole }> {
  const superTree = JSON.parse(readFileSync(navigationCacheFile('structure/tree/super-tree.json'), 'utf8'));
  const works = findNode(superTree, lock.collections.kn.superTreeNode);
  if (!Array.isArray(works) || !works.every((work) => typeof work === 'string')) {
    throw new Error(`super-tree: node ${lock.collections.kn.superTreeNode} is not a flat list of works`);
  }
  const trees = [...lock.collections.sn.trees, ...lock.collections.an.trees, ...works as string[]];
  const present = new Set(git(['ls-tree', '-r', '--name-only', lock.commit, '--', ...lock.sparsePaths]).split('\n'));
  const required: Array<{ path: string; role: NavigationFileRole }> = [
    { path: 'structure/README.md', role: 'readme' },
    { path: 'structure/tree/super-tree.json', role: 'tree' },
    ...trees.map((work) => ({ path: `structure/tree/sutta/${work}-tree.json`, role: 'tree' as const })),
    { path: 'sc_bilara_data/root/misc/site/name/super-name_root-misc-site.json', role: 'name-root' },
    ...trees.map((work) => ({ path: `sc_bilara_data/root/misc/site/name/sutta/${work}-name_root-misc-site.json`, role: 'name-root' as const })),
    { path: 'sc_bilara_data/translation/vi/site/name/super-name_translation-vi-site.json', role: 'name-vi' },
    ...trees
      .map((work) => `sc_bilara_data/translation/vi/site/name/sutta/${work}-name_translation-vi-site.json`)
      .filter((file) => present.has(file))
      .map((file) => ({ path: file, role: 'name-vi' as const })),
    { path: 'sc_bilara_data/translation/vi/site/licensing_translation-vi-site.json', role: 'licensing' },
  ];
  const missing = required.filter((file) => !present.has(file.path));
  if (missing.length) throw new Error(`the pinned commit lacks required files:\n  ${missing.map((file) => file.path).join('\n  ')}`);
  return required;
}

function findNode(value: unknown, key: string): unknown {
  if (Array.isArray(value)) {
    for (const child of value) {
      const found = findNode(child, key);
      if (found !== undefined) return found;
    }
  } else if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (key in record) return record[key];
    for (const child of Object.values(record)) {
      const found = findNode(child, key);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

function writeLockFiles(): void {
  const files = requiredFiles().map(({ path: file, role }) => {
    const bytes = readFileSync(navigationCacheFile(file));
    return { path: file, role, gitBlob: gitBlobHash(bytes), sha256: sha256(bytes), bytes: bytes.length };
  });
  const next: NavigationLock = { ...lock, files };
  const tmp = `${NAVIGATION_LOCK_PATH}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(next, null, 2)}\n`);
  renameSync(tmp, NAVIGATION_LOCK_PATH);
  console.log(`wrote ${files.length} files to source/navigation.lock.json`);
}

async function githubJson(url: string): Promise<unknown> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json', 'User-Agent': 'kinh-tang-pali-navigation' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.json();
}

/** Cross-check the locked tree files against GitHub's own listing of the pinned commit. */
async function verifyRemote(): Promise<string[]> {
  const repo = lock.repo.replace(/^https:\/\/github\.com\//, '').replace(/\.git$/, '');
  const api = `https://api.github.com/repos/${repo}/git/trees`;
  const top = await githubJson(`${api}/${lock.commit}`) as TreeListing;
  assertCompleteTreeListing(top, 'commit root');
  const structure = top.tree.find((entry) => entry.path === 'structure' && entry.type === 'tree');
  if (!structure) return ['the pinned commit has no structure/ tree'];
  const listing = await githubJson(`${api}/${structure.sha}?recursive=1`) as TreeListing;
  assertCompleteTreeListing(listing, 'structure/');
  const blobs = new Map(listing.tree.map((entry) => [`structure/${entry.path}`, entry.sha]));
  const problems: string[] = [];
  for (const file of lock.files.filter((entry) => entry.path.startsWith('structure/'))) {
    const sha = blobs.get(file.path);
    if (!sha) problems.push(`${file.path}: absent from GitHub's listing of the pinned commit`);
    else if (sha !== file.gitBlob) problems.push(`${file.path}: GitHub lists blob ${sha.slice(0, 12)}, the lock records ${file.gitBlob.slice(0, 12)}`);
  }
  console.log(`remote: ${listing.tree.length} structure entries, truncated=false; ${lock.files.filter((entry) => entry.path.startsWith('structure/')).length} locked tree files compared.`);
  return problems;
}

function fail(title: string, problems: string[]): never {
  console.error(title);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

let problems = verify(lock.files);
if (problems.length && !checkOnly) {
  console.log(`fetching ${lock.repo} @ ${lock.commit.slice(0, 12)} (${lock.sparsePaths.length} sparse paths) …`);
  fetchPin();
  if (writeLock) writeLockFiles();
  problems = verify(loadNavigationLock().files);
} else if (writeLock) {
  writeLockFiles();
  problems = verify(loadNavigationLock().files);
}
if (problems.length) {
  fail(checkOnly ? 'navigation sources do not match the pin (run: npm run navigation:sync):' : 'the fetched navigation sources still do not match the pin:', problems);
}
console.log(`navigation sources are at the pin (${lock.commit.slice(0, 12)}, ${loadNavigationLock().files.length} files verified commit → tree → blob → bytes).`);
if (remote) {
  const remoteProblems = await verifyRemote();
  if (remoteProblems.length) fail('the lock disagrees with GitHub:', remoteProblems);
}
