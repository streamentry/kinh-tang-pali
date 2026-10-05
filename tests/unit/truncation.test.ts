/**
 * An ellipsis the Pāli does not have is a translation that gave up.
 *
 * The rule this enforces is the project's own: an elision marker is never introduced. Pāli
 * marks a gap with `…pe…` and the Vietnamese renders it as exactly one `…`; Pāli with no `…`
 * anywhere has a segment that was written out in full, and a `…` in the Vietnamese at that
 * same segment means content was dropped and hidden behind a mark.
 *
 * It is worth a test because of what it cost to notice. At `e45ebbb3`, 321 segments across 67
 * published texts did this, and the ten-criteria scorecard scored them between 9.30 and 9.77 —
 * the median was 9.51. The worst cases were not subtle:
 *
 *   `mn10:42.6` — Pāli 327 characters enumerating a `pītisambojjhaṅga` in full, rendered as
 *     `hỷ giác chi …`, thirteen characters. A 25× loss, published.
 *   `mn22:16.5` — Pāli `saṅkhāre 'netaṁ mama, nesohamasmi, na meso attā'ti samanupassati;`
 *     rendered as `hành …`. The entire contemplation of non-self, gone.
 *   `mn1:7.2` — Pāli lists five ways of regarding; the Vietnamese keeps two, then `…`.
 *
 * So `semantic_fidelity` was being scored on texts that had silently lost up to 96% of the
 * Pāli, and nothing in the suite noticed. That is the failure this file exists to prevent.
 *
 * The gate does not forbid the pattern — 321 segments still carry it, and repairing them is
 * translation work in its own right. It requires that any text exhibiting it is `draft` with
 * a blocking error, because losing Pāli is a meaning error and `AGENTS.md` says a blocker
 * outranks any score. Sixty-seven published texts were downgraded to `draft` on that basis.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';
import { loadCatalog, segmentMapForUid, sourcePathFor, upstreamFile } from '../../src/lib/canon/load';
import type { CollectionCode } from '../../src/lib/canon/types';

/**
 * Ceiling on segments that truncate. Lower it as texts are repaired — never raise it.
 * A repair does not have to touch this file; the coordinator lowers the number in the same
 * commit as the repair.
 */
const TRUNCATION_CEILING = 186;

const TRANSLATION_ROOT = 'content/translation/vi/project/sutta';
const META_ROOT = 'content/meta/sutta';

interface Offence {
  collection: string;
  uid: string;
  segment: string;
  paliLength: number;
  vietLength: number;
}

/** Fold runs of whitespace, so a length comparison is not counting the root file's wrapping. */
function length(text: string): number {
  return text.replace(/\s+/gu, ' ').trim().length;
}

function readPali(code: CollectionCode, uid: string): Record<string, string> {
  const item = loadCatalog(code).texts.find((t) => t.uid === uid);
  const sp = item && sourcePathFor(code, uid, item.sourcePath);
  if (!sp || !existsSync(upstreamFile(sp))) return {};
  try {
    return segmentMapForUid(JSON.parse(readFileSync(upstreamFile(sp), 'utf8')), uid);
  } catch {
    return {};
  }
}

/** Every segment whose Vietnamese carries an ellipsis the Pāli at that same segment lacks. */
function truncations(): Offence[] {
  const out: Offence[] = [];
  for (const code of ['dn', 'mn', 'sn', 'an', 'kn'] as CollectionCode[]) {
    const dir = `${TRANSLATION_ROOT}/${code}`;
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir).filter((f) => f.endsWith('_translation-vi-project.json'))) {
      const uid = file.split('_')[0];
      const viet = JSON.parse(readFileSync(`${dir}/${file}`, 'utf8')) as Record<string, unknown>;
      const pali = readPali(code, uid);
      for (const [key, value] of Object.entries(viet)) {
        if (typeof value !== 'string' || !value.includes('…')) continue;
        const source = pali[key];
        if (typeof source !== 'string' || source.includes('…')) continue;
        out.push({
          collection: code,
          uid,
          segment: key.slice(key.indexOf(':') + 1),
          paliLength: length(source),
          vietLength: length(value),
        });
      }
    }
  }
  return out;
}

function metaFile(collection: string, uid: string): string {
  return `${META_ROOT}/${collection}/${uid}.yaml`;
}

test('a text that truncates its Pāli is draft with a blocking error', () => {
  const offences = truncations();
  const byText = new Map<string, Offence[]>();
  for (const offence of offences) {
    const key = `${offence.collection}/${offence.uid}`;
    if (!byText.has(key)) byText.set(key, []);
    byText.get(key)!.push(offence);
  }

  const offenders: string[] = [];
  for (const [key, list] of [...byText].sort()) {
    const [collection, uid] = key.split('/');
    const file = metaFile(collection, uid);
    if (!existsSync(file)) {
      offenders.push(`${key}: truncates ${list.length} segment(s) and has no metadata at all`);
      continue;
    }
    const doc = parseYaml(readFileSync(file, 'utf8')) as {
      status?: unknown;
      quality?: { blocking_errors?: unknown };
    };
    if (doc?.status !== 'draft') {
      offenders.push(
        `${key}: ${list.length} segment(s) carry an ellipsis the Pāli lacks ` +
          `(worst ${(Math.max(...list.map((o) => o.paliLength / Math.max(o.vietLength, 1)))).toFixed(1)}×) ` +
          `but status is "${String(doc?.status)}"`,
      );
      continue;
    }
    const blockers = doc?.quality?.blocking_errors;
    if (!Array.isArray(blockers) || !blockers.some((b) => typeof b === 'string' && b.includes(uid))) {
      offenders.push(`${key}: draft but no blocking error names it`);
    }
  }

  assert.deepEqual(offenders, [], `\n${offenders.length} text(s) truncate their Pāli without being blocked:\n  ${offenders.join('\n  ')}`);
});

test('the number of truncating segments does not grow', () => {
  // A ceiling, not a count. Every repair lowers it; nothing may raise it. Without this the
  // first test would keep passing while the defect spread to new texts, since each new one
  // could simply be marked `draft`.
  const offences = truncations();
  assert.ok(
    offences.length > 0,
    'no truncating segments found — the check would pass vacuously, which means it is reading the wrong files',
  );
  const worst = offences.reduce(
    (a, b) => (a.paliLength / Math.max(a.vietLength, 1)) >= (b.paliLength / Math.max(b.vietLength, 1)) ? a : b,
  );
  assert.ok(
    offences.length <= TRUNCATION_CEILING,
    `${offences.length} segments truncate their Pāli, over the ceiling of ${TRUNCATION_CEILING}. ` +
      `Worst: ${worst.collection}/${worst.uid}:${worst.segment} — Pāli ${worst.paliLength} characters, ` +
      `Vietnamese ${worst.vietLength}.`,
  );
});
