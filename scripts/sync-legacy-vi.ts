/**
 * Fetch the pinned SuttaCentral legacy Vietnamese HTML into `.cache/upstream/sc-data`.
 *
 *   npm run legacy:sync     fetch (or repair) the checkout so it equals the pin
 *   npm run legacy:check    verify only; exit 1 when the cache is missing or is not the pin
 *
 * Why a sparse git checkout and not 4,815 raw-file requests: git verifies every object it
 * receives against its hash, so a file that arrives is the file at the pinned commit. A
 * download loop would have to re-implement that, and would not notice a truncated body.
 *
 * The pin lives in `source/suttacentral.lock.json` under `legacyHtml`. Nothing is
 * read from `main`: the commit is fetched by its full hash.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { loadLock } from '../src/lib/canon/load';
import { LEGACY_CACHE_DIR } from '../src/lib/canon/legacy-vi';

const pin = loadLock().legacyHtml;
const checkOnly = process.argv.includes('--check');

/**
 * The environment git runs with. Every `GIT_*` variable is dropped: run from inside a hook,
 * `GIT_DIR` or `GIT_INDEX_FILE` would point these commands at the project repository instead
 * of the cache. Global and system config are ignored too, so a user's hooks or aliases never
 * run against the cache.
 */
function gitEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith('GIT_')) env[key] = value;
  }
  return { ...env, GIT_TERMINAL_PROMPT: '0', GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' };
}

function git(args: string[]): string {
  return execFileSync('git', ['-c', 'core.hooksPath=/dev/null', ...args], {
    cwd: LEGACY_CACHE_DIR,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: gitEnv(),
  }).trim();
}

function countHtml(dir: string): number {
  if (!existsSync(dir)) return 0;
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) total += countHtml(full);
    else if (entry.name.endsWith('.html')) total += 1;
  }
  return total;
}

interface State {
  ok: boolean;
  problems: string[];
}

/** Compare the cache with the pin: right commit, right file count, nothing modified. */
function verify(): State {
  const problems: string[] = [];
  if (!existsSync(path.join(LEGACY_CACHE_DIR, '.git'))) {
    return { ok: false, problems: ['no checkout at .cache/upstream/sc-data'] };
  }
  let head = '';
  try { head = git(['rev-parse', 'HEAD']); } catch { problems.push('the checkout has no HEAD'); }
  if (head && head !== pin.commit) problems.push(`HEAD is ${head.slice(0, 12)}, the pin is ${pin.commit.slice(0, 12)}`);
  const files = countHtml(path.join(LEGACY_CACHE_DIR, pin.path));
  if (files !== pin.fileCount) problems.push(`${files} html files present, the pin records ${pin.fileCount}`);
  if (head === pin.commit) {
    const dirty = git(['status', '--porcelain', '--', pin.path]);
    if (dirty) problems.push(`${dirty.split('\n').length} file(s) differ from the pinned commit`);
  }
  return { ok: problems.length === 0, problems };
}

function fetchPin(): void {
  mkdirSync(LEGACY_CACHE_DIR, { recursive: true });
  if (!existsSync(path.join(LEGACY_CACHE_DIR, '.git'))) {
    git(['init', '-q']);
    git(['remote', 'add', 'origin', pin.repo]);
  }
  // The lock may name a different repository than the one this cache was first made from.
  git(['remote', 'set-url', 'origin', pin.repo]);
  git(['config', 'core.sparseCheckout', 'true']);
  // sc-data is large and the project reads one sub-tree. A blob-less fetch brings the commit
  // and tree objects, and the checkout then downloads only the blobs the sparse path names.
  git(['config', 'remote.origin.promisor', 'true']);
  git(['config', 'remote.origin.partialclonefilter', 'blob:none']);
  writeFileSync(path.join(LEGACY_CACHE_DIR, '.git/info/sparse-checkout'), `${pin.path}/\n`);
  git(['fetch', '-q', '--depth', '1', '--filter=blob:none', 'origin', pin.commit]);
  git(['checkout', '-q', '-f', '--detach', pin.commit]);
}

const before = verify();
if (before.ok) {
  console.log(`legacy Vietnamese HTML is at the pin (${pin.commit.slice(0, 12)}, ${pin.fileCount} files).`);
  process.exit(0);
}
if (checkOnly) {
  console.error('legacy Vietnamese HTML does not match the pin:');
  for (const problem of before.problems) console.error(`  - ${problem}`);
  console.error('Run: npm run legacy:sync');
  process.exit(1);
}

console.log(`fetching ${pin.repo} @ ${pin.commit.slice(0, 12)} (${pin.path}) …`);
fetchPin();
const after = verify();
if (!after.ok) {
  console.error('the fetched checkout still does not match the pin:');
  for (const problem of after.problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log(`synced ${pin.fileCount} files at ${pin.commit.slice(0, 12)}.`);
