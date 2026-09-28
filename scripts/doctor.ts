/**
 * Filesystem and cache doctor.
 *
 * This exists because the same APFS defect was diagnosed three times, by hand, at
 * hours of cost each time. Its shape is always the same: a directory entry that
 * `readdir` reports but that cannot be opened, created, or unlinked. The third
 * occurrence was the expensive one — it made `npm run build` appear to hang, and a
 * synchronous `mkdir` that never returns is indistinguishable from an infinite loop in
 * the page that precedes it, so the investigation went after the renderer for a long
 * time before a per-collection timing measurement pointed at the filesystem.
 *
 * So: detect the damage class in one command, and never be defeated by it.
 *
 *   npm run doctor              # scan, report, exit 1 on anything that needs a human
 *   npm run doctor -- --prune   # also remove cache files no layer reads
 *   npm run doctor:ci           # for CI, which syncs only part of the corpus
 *
 * Two deliberate limits, because a diagnostic that pretends to know more than it does is
 * worse than none:
 *
 *   1. It does **not** try to create a suspect name to prove it is unwritable. That
 *      operation is exactly what blocks forever, and a doctor that can hang is not a
 *      doctor. A ghost entry is reported by the fact that it cannot be read.
 *   2. A listed-but-unopenable entry is reported as a ghost, not as a file. It has no
 *      content, so it cannot shadow or corrupt a pinned file, and it must not be counted
 *      as one — that distinction is why the store verifier's extra-file check stays
 *      strict for anything that *can* be read.
 */
import { existsSync, readFileSync, readdirSync, renameSync, rmSync, statSync, type Dirent } from 'node:fs';
import path from 'node:path';
import { loadLock } from '../src/lib/canon/load';
import { manifestRootForLayer, storeLayers } from '../src/lib/canon/layers';
import { manifestCommit } from '../src/lib/canon/manifest';

const ROOT = process.cwd();
const UPSTREAM = path.join(ROOT, '.cache/upstream/suttacentral');
const prune = process.argv.includes('--prune');
/**
 * CI syncs only the texts the project works on, so a missing cache file there is a
 * deliberate scope rather than damage. Same flag, same reasoning as
 * `verify:store --allow-partial-cache`: cache completeness is a decision, filesystem
 * integrity is not, and only the second should fail a run.
 */
const allowPartialCache = process.argv.includes('--allow-partial-cache');

interface Ghost {
  /** Path relative to the scanned root. */
  at: string;
  /** What the entry claimed to be, versus what could actually be done with it. */
  kind: 'listed-but-unreadable' | 'listed-as-file-but-unstatable' | 'other-type';
}

interface Scan {
  root: string;
  files: number;
  bytes: number;
  ghosts: Ghost[];
  unreadableDirs: string[];
  entries: number;
}

/**
 * Walk a tree, counting what is really there.
 *
 * Every filesystem call is guarded. That is the whole point: the first version of the
 * store verifier used `find`, whose non-zero exit on one unreadable path was swallowed,
 * turning an entire layer into "0 files verified" without anybody noticing.
 */
function scan(root: string): Scan {
  const result: Scan = { root, files: 0, bytes: 0, ghosts: [], unreadableDirs: [], entries: 0 };

  const walk = (dir: string): void => {
    let entries: Dirent[];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      result.unreadableDirs.push(path.relative(root, dir) || '.');
      return;
    }
    for (const entry of entries) {
      if (entry.name.includes('.apfs-orphan')) continue;
      const full = path.join(dir, entry.name);
      const at = path.relative(root, full);
      result.entries += 1;
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!entry.isFile()) {
        result.ghosts.push({ at, kind: 'other-type' });
        continue;
      }
      // Listed as a file, so it must be openable. If it is not, the directory entry is
      // a ghost: `readdir` sees a name, and nothing can be done with it.
      try {
        const content = readFileSync(full);
        result.files += 1;
        result.bytes += content.length;
      } catch {
        result.ghosts.push({ at, kind: 'listed-but-unreadable' });
        continue;
      }
      try {
        statSync(full);
      } catch {
        result.ghosts.push({ at, kind: 'listed-as-file-but-unstatable' });
      }
    }
  };

  if (existsSync(root)) walk(root);
  return result;
}

/** Which manifest files the cache should hold, per layer, and what it actually holds. */
interface Reconciliation {
  layerId: string;
  expected: number;
  present: number;
  missing: string[];
}

function reconcile(manifest: { editions: Array<{ layerId: string; path: string; files: Record<string, string> }> }): Reconciliation[] {
  return manifest.editions.map((edition) => {
    const localRoot = path.join(UPSTREAM, edition.path);
    const missing: string[] = [];
    let present = 0;
    for (const name of Object.keys(edition.files)) {
      const absolute = path.join(localRoot, name);
      try {
        if (readFileSync(absolute).length > 0 || edition.files[name].length >= 0) present += 1;
      } catch {
        missing.push(name);
      }
    }
    return { layerId: edition.layerId, expected: Object.keys(edition.files).length, present, missing };
  });
}

/** Files in the cache that no declared layer reads — inert leftovers from a bad download. */
function unmanagedFiles(editionRoots: string[]): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    let entries: Dirent[];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name.includes('.apfs-orphan')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) {
        try {
          readFileSync(full);
        } catch {
          continue; // a ghost, already reported by scan()
        }
        const relative = path.relative(UPSTREAM, full);
        if (!editionRoots.some((root) => relative.startsWith(`${root}/`))) out.push(relative);
      }
    }
  };
  if (existsSync(UPSTREAM)) walk(UPSTREAM);
  return out;
}

/**
 * Remove a file, renaming it aside first if it refuses to go.
 *
 * On a volume with orphaned B-tree nodes, `rm` fails where `rename` succeeds, so the
 * rename is the only route. The renamed copy is then deleted, and if that also fails the
 * path is reported rather than swallowed.
 */
function removeWithRenameFallback(target: string): 'removed' | 'renamed-away' | 'failed' {
  try {
    rmSync(target, { force: true });
    return 'removed';
  } catch {
    /* fall through to the rename route */
  }
  const aside = `${target}.doctor-away`;
  try {
    renameSync(target, aside);
  } catch {
    return 'failed';
  }
  try {
    rmSync(aside, { recursive: true, force: true });
    return 'renamed-away';
  } catch {
    return 'failed';
  }
}

const manifestCommitId = manifestCommit();
const lock = loadLock();
let problems = 0;
let notes = 0;

/**
 * The mounted volume the repository lives on.
 *
 * `path.parse().root` is always `/` on macOS, which names the boot volume rather than
 * the one actually at risk — and the whole point of this command is to name that one.
 */
function volumeOf(target: string): string {
  const parts = target.split(path.sep).filter(Boolean);
  if (parts[0] === 'Volumes' && parts[1]) return `/${parts[0]}/${parts[1]}`;
  return path.parse(target).root;
}

console.log(`Filesystem and cache doctor`);
console.log(`  repository : ${ROOT}`);
console.log(`  volume     : ${volumeOf(ROOT)}`);
console.log(`  commit     : ${lock.commit.slice(0, 12)}${manifestCommitId === lock.commit ? '' : '  (MANIFEST MISMATCH)'}`);
if (manifestCommitId !== lock.commit) {
  console.error('  source/upstream-manifest.json does not match the lock. Run npm run manifest:fetch.');
  process.exit(1);
}
console.log('');

// --- 1. the upstream cache -----------------------------------------------------

const editionRoots = storeLayers().map(manifestRootForLayer).filter((value): value is string => value !== null);
const manifestFile = path.join(ROOT, 'source/upstream-manifest.json');
const manifest = JSON.parse(readFileSync(manifestFile, 'utf8')) as {
  editions: Array<{ layerId: string; path: string; files: Record<string, string> }>;
};

for (const reconciliation of reconcile(manifest)) {
  const missing = reconciliation.missing.length;
  if (missing === 0) {
    console.log(`  cache  ${reconciliation.layerId.padEnd(19)} ${reconciliation.present}/${reconciliation.expected} file(s) present and readable`);
  } else if (allowPartialCache) {
    console.log(`  cache  ${reconciliation.layerId.padEnd(19)} ${reconciliation.present}/${reconciliation.expected}  ${missing} absent (partial cache, allowed)`);
  } else {
    problems += 1;
    console.log(`  cache  ${reconciliation.layerId.padEnd(19)} ${reconciliation.present}/${reconciliation.expected}  ${missing} MISSING`);
    for (const name of reconciliation.missing.slice(0, 5)) console.log(`           missing: ${name}`);
    if (missing > 5) console.log(`           … and ${missing - 5} more`);
    console.log(`           fix: npm run source:sync:manifest`);
  }
}

// --- 2. the damage class -------------------------------------------------------

if (existsSync(UPSTREAM)) {
  const result = scan(UPSTREAM);
  if (result.ghosts.length > 0) {
    problems += 1;
    console.log(`\n  GHOST ENTRIES  ${result.ghosts.length} directory entr(y|ies) are listed but cannot be opened`);
    for (const ghost of result.ghosts.slice(0, 10)) console.log(`           ${ghost.kind.padEnd(30)} ${ghost.at}`);
    if (result.ghosts.length > 10) console.log(`           … and ${result.ghosts.length - 10} more`);
    console.log('           These are APFS orphans. They have no content, so nothing they touch can be read or');
    console.log('           written. A file you still need will also be reported as MISSING above.');
  }
  if (result.unreadableDirs.length > 0) {
    problems += 1;
    console.log(`\n  UNREADABLE DIRECTORIES  ${result.unreadableDirs.length}`);
    for (const dir of result.unreadableDirs.slice(0, 5)) console.log(`           ${dir}`);
  }
  if (result.ghosts.length === 0 && result.unreadableDirs.length === 0) {
    console.log(`\n  ghost entries   none — ${result.files} file(s), ${(result.bytes / 1e6).toFixed(1)} MB, all readable`);
  }
}

// --- 3. files no layer reads ---------------------------------------------------

const unmanaged = unmanagedFiles(editionRoots);
if (unmanaged.length > 0) {
  notes += 1;
  console.log(`\n  UNMANAGED CACHE FILES  ${unmanaged.length} file(s) belong to no declared layer`);
  const byDir = new Map<string, number>();
  for (const file of unmanaged) {
    const dir = file.split('/').slice(0, 2).join('/');
    byDir.set(dir, (byDir.get(dir) ?? 0) + 1);
  }
  for (const [dir, count] of [...byDir.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)) {
    console.log(`           ${String(count).padStart(5)}  ${dir}/`);
  }
  if (prune) {
    let removed = 0;
    let failed = 0;
    const failedPaths: string[] = [];
    for (const file of unmanaged) {
      const outcome = removeWithRenameFallback(path.join(UPSTREAM, file));
      if (outcome === 'failed') {
        failed += 1;
        if (failedPaths.length < 5) failedPaths.push(file);
        continue;
      }
      removed += 1;
    }
    console.log(`           pruned ${removed}, ${failed} could not be removed`);
    for (const file of failedPaths) console.log(`           could not remove: ${file}`);
    if (failed > 0) {
      problems += 1;
      console.log('           these need `fsck_apfs -y -T` on the unmounted volume');
    }
  } else {
    console.log(`           inert: nothing in the store reads them. Prune with: npm run doctor -- --prune`);
  }
}

// --- 4. build output -----------------------------------------------------------

if (existsSync(path.join(ROOT, 'dist'))) {
  const dist = scan(path.join(ROOT, 'dist'));
  if (dist.ghosts.length > 0 || dist.unreadableDirs.length > 0) {
    problems += 1;
    console.log(`\n  DIST DAMAGED  ${dist.ghosts.length} ghost entr(y|ies), ${dist.unreadableDirs.length} unreadable director(y|ies)`);
    console.log('           This is what makes `npm run build` appear to hang: a synchronous mkdir against a');
    console.log('           damaged B-tree node never returns, which looks exactly like an infinite loop in the');
    console.log('           page that precedes it. Clear it, do not debug the renderer.');
    console.log('           rm fails here; rename does not. Move it aside and rebuild:');
    console.log('             mv dist ../kinh-tang-pali-dist-damaged-$(date +%F)');
  } else {
    console.log(`\n  dist           clean — ${dist.files} file(s)`);
  }
}

// --- verdict -------------------------------------------------------------------

console.log('');
if (problems === 0) {
  console.log(`No action needed.${notes > 0 ? ` ${notes} note(s) above are informational.` : ''}`);
  process.exit(0);
}
console.log(`${problems} problem(s) need attention. The persistent fix for APFS orphans is`);
console.log('`diskutil unmount /Volumes/SSD && fsck_apfs -y -T /dev/disk<N>` from the internal disk.');
console.log('Do not run it while the volume is in use; repairs are refused on a mounted volume.');
process.exit(1);
