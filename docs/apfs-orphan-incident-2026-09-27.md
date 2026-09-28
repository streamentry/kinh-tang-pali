# APFS orphaned directory entries on `/Volumes/SSD` — incident 2026-09-27

## Symptom

`git stash` failed with `error: unable to create temporary file: No such file or directory`,
and `git status` showed 34 tracked files as deleted that were present in `HEAD`.

## Root cause

The APFS volume `/Volumes/SSD` (`/dev/disk5s1`) has **orphaned (tombstoned) directory
entries**. A name remains in the directory index — so `getdirents(2)` returns it — but the
inode is marked unlinked, so `lstat`/`open(O_CREAT)` fail with `ENOENT`.

Consequences seen in this repo:

| Effect | Explanation |
| --- | --- |
| `git stash` cannot create `.git/index.stash.<pid>` | the name resolves into a poisoned directory entry |
| 34 files reported deleted but not in `ls` | their names were still in the parent index, already tombstoned |
| `git fsck` reported ~30 missing objects | the loose object files behind those names were tombstoned, not absent |
| `an1.12_comment-vi-project.json` unreadable (`EILSEQ`) | a partly-written file left mid-delete |

`ls` hides these entries (it stats each one and skips failures), which is why the
directory looked healthy while the names were unusable. Detection requires comparing
`os.listdir()` against `os.stat()`.

This is the known APFS delete-churn bug: mass deletion in a single transaction
exhausts the directory's delete-counter space and leaves entries permanently
unresolvable. This volume is `noowners` and holds `node_modules`, `.cache`, `dist`
and heavy per-batch file rewrites, all of which churn hard.

SMART reports `Verified`, so this is a filesystem-metadata bug, not media failure.

## Repair applied

Affected directories cannot be repaired in place — a tombstoned entry can never be
`unlink`ed or `rmdir`ed. The working fix is to rebuild the directory:

1. `rename(dir, dir.apfs-orphan)` — a rename always succeeds, even with ghosts inside.
2. `mkdir(dir)` — fresh directory index, poisoned names gone.
3. Move back every entry that still `lstat`s.
4. The quarantine dir holds only unremovable tombstones; exclude it from git.

**Caveat learned the hard way:** some entries are reachable by direct path lookup but
are *absent from `readdir`*. A rebuild that trusts `os.listdir()` alone will silently
drop them — this is how `.git/objects/pack` and `.git/objects/info` were lost during
the first attempt. Always cross-check with `st_nlink` (which APFS sets to
`2 + number of subdirectories`) before and after.

Actions taken:

- `.git` object store: recovered 187 object directories that `readdir` had hidden,
  restored `pack`/`info`, rebuilt 7 poisoned `objects/xx` dirs, removed 4 dangling
  cache-tree objects left by the failed `stash`. `git fsck` is now clean.
- Recovered missing objects from a fresh clone in a scratch directory, so no history
  was actually lost — local `main` (`36062aa`) is an ancestor of `origin/main`.
- Restored all 34 deleted files plus the corrupt `an1.12_comment-vi-project.json`
  from the index. `git status` is clean.
- Re-ran the pinned source sync (60 files re-downloaded from the locked bilara commit).
- Reinstalled `node_modules` from `package-lock.json`; `npm ci` itself stalls on this
  volume retrying one tarball's integrity check, so the tree was finished by hand.
- `npm run validate` / `npm test` (21/21) / `npm run check` (0 errors) all pass.

## Outstanding — needs `fsck_apfs`

The orphaned entries are **not reclaimable** in place, and rebuilding directories
only works around them. They are removed by a B-tree repair, which requires the
volume to be unmounted.

Device layout for this drive (confirm with `diskutil list` before running):

| Device | Role |
| --- | --- |
| `/dev/disk4` | physical, external, whole disk |
| `/dev/disk5` | APFS container (synthesized) — **repair this** |
| `/dev/disk5s1` | the `SSD` volume itself |

```sh
diskutil unmountDisk /Volumes/SSD
fsck_apfs -y -T -D /dev/disk5      # container: repair + B-tree node repairs
fsck_apfs -y -T -D /dev/disk5s1    # then the volume itself
diskutil mount /Volumes/SSD
```

Flag notes, from `man fsck_apfs` (Mac OS X, May 6 2023):

- `-y` attempt repairs (required; `-T` is ignored in a pure check pass)
- `-T` enable **B-tree node repairs** — the repair class that reclaims orphaned
  directory entries, since APFS directories are B-trees
- `-D` with `-T`, also search free blocks for replacement nodes
- `-S` **skips snapshot iteration**; it is *not* an orphan-repair switch
- `-l` live verification can check a mounted read-write volume, but makes no repairs

There is no dedicated orphan flag in this man page. Disk Utility → First Aid on the
volume is the supported GUI equivalent if you prefer not to use the CLI.

`-T`/`-D` need free blocks to relocate into, so run the container pass first. Until
this is done, the leftover `*.apfs-orphan*/` directories cannot be deleted and will
keep accumulating on further heavy delete churn. They are listed in
`.git/info/exclude` (local-only, not committed).

**Do not run this while the volume is in use.** Repairs are refused on a mounted
read-write volume (`-l` can only check), and force-unmounting a drive holding live
sessions risks data loss. This drive carries other active work, so run it from a
shell on the internal disk after quitting everything with a working directory there.


The same damage affects other trees on this volume — the nvm-managed Node installs at
`/Volumes/SSD/symlinks/nvm-versions/` have lost bundled npm modules, which is why
`npm` appears broken. `/opt/homebrew/bin/npm` is also a dangling symlink into a
missing `/opt/homebrew/Cellar/node/26.3.0`.

---

## Recurrence, 2026-09-28: a ghost entry that cannot be read, created, or renamed

A second, narrower form of the same defect, found by `npm run verify:store` when a
build failed on a file that `readdir` listed but nothing could open.

**Symptom.** `sn6.2_translation-en-sujato.json` in the upstream cache was listed by
`readdir` and reported as a regular file by `readdirSync(withFileTypes)`, yet
`existsSync` was `false`, `readFileSync` and `openSync` raised `ENOENT`, and
`git hash-object` refused it. No other file in the 10,081-file cache was affected.

**What it broke, and what it taught.**

- `git hash-object --stdin-paths` aborts the whole batch if any one path cannot be
  opened, so the verifier used to *crash* rather than report. It now reads and hashes
  in process (`gitBlobHash`) and counts unreadable files as a number.
- `source:sync` decided a file was cached from `existsSync`, skipped the download, and
  then failed on the read. It now treats a file it cannot read as absent.
- The directory entry for that one name could not be replaced at all: writing it,
  and `rename()`-ing a temporary file onto it, both raised `ENOENT`. Any other filename
  in the same directory worked normally.

**Recovery used.** Build a clean sibling directory containing only the files that can
actually be read, `rename` the broken directory aside, `rename` the clean one into
place, re-sync, then delete what could be deleted. That restored the cache to 10,081
files, all hash-verified. The directory that was renamed aside holds one ghost entry
that cannot be unlinked — `rm -rf` reports the directory as not empty — and it stays
until `fsck_apfs -y -T` runs on the unmounted volume.

**Why this is not a repository defect.** A ghost entry has no content, so it cannot
shadow a pinned file, and it lives in `.cache`, which is gitignored. `verify:store`
therefore counts a listed-but-unopenable entry separately and reports it as an advisory
naming the path, while a file that *can* be read but is absent from the pinned manifest
still fails. That distinction is deliberate: relaxing the extra-file check to
accommodate a local filesystem defect would also hide a real file that is genuinely
not in the snapshot.

---

## Recurrence, 2026-09-28, second wave: the same defect reached `dist/`

The ghost-entry defect was not confined to the upstream cache. It reached the Astro
build output, and there it was far more damaging than in `.cache`.

**Symptom.** `npm run build` appeared to hang rather than slow down. It stopped at the
same page every run — `sutta/an/an6.87/` — and never finished. Because the log was
buffered, the last flushed line always named the same page, which made it look like a
rendering problem in that one text.

**What it actually was.** `dist/sutta/an/an6.86/` held ghost entries. `mkdir` for
`an6.87` then blocked indefinitely on the corrupted B-tree node. A synchronous
`mkdir` that never returns looks exactly like an infinite loop in the page that
precedes it, which is why the diagnosis went the wrong way for a while.

**How it was found.** Only by bisecting `getStaticPaths` to one collection at a time:
`mn` 159 pages in 4.5 s, `kn` 2,358 pages in 9.7 s, `an` 1,781 pages in over 30
minutes. A collection that is slow *only* when rendered and fast when composed points
at the filesystem, not the code. Composing all 6,137 documents in-process took 5.1 s,
which ruled out the document layer.

**Recovery.** `dist` was renamed aside with a same-volume `mv` — a rename succeeds
where `unlink` and `rmdir` do not — and the build then completed in 8.8 s for `an` and
1m07s in full, unchanged from before the damage. The damaged tree is unremovable: 21
directories survive `rm -rf`, some of them holding entries that cannot be unlinked at
all. It was renamed to `/Volumes/SSD/kinh-tang-pali-dist.damaged-2026-09-28`, outside
the repository, and will stay there until `fsck_apfs -y -T` runs on the unmounted
volume.

**Two real code defects it did expose**, both worth keeping fixed:

1. `git hash-object --stdin-paths` aborts the entire batch when any single path cannot
   be opened, so the verifier used to abort rather than report. It now reads and
   hashes in process and counts unreadable files.
2. `source:sync` decided a file was cached from `existsSync`, skipped the download, and
   then failed on the read. It now treats a file it cannot read as absent, which is
   what recovered the lost `sn6.2_translation-en-sujato.json`.

**The lesson worth keeping.** A hang that always lands on the same item is a symptom,
not a diagnosis. Measure the thing you suspect before you edit it: per-collection build
timings and in-process composition times settled in two commands what an hour of
reading the template could not.

## Damage summary so far

| path | state | cleared by |
| --- | --- | --- |
| `.cache/upstream/.../ref/*.apfs-orphan*/` | leftover from the 2026-09-27 churn | `fsck_apfs -y -T` |
| `node_modules/` (recreated via `npm ci`) | healthy | — |
| `/Volumes/SSD/kinh-tang-pali-dist.damaged-2026-09-28` | unremovable, inert | `fsck_apfs -y -T` |

Everything under `.cache/`, `dist/`, and the book output is regenerable, so the
operational cost so far is build time, not data. No tracked file has been lost. The
volume should not be trusted for further heavy write churn until it has been repaired.
