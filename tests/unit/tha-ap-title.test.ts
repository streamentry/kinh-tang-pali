/**
 * `Therāpadāna`: the per-text title lives in two places, and they must agree.
 *
 * The hazard here is quiet and old. In `tha-ap`, segment `:0.3` **is** the title of that single
 * text. Elsewhere it is not the same thing: measured across the layer, only 1605/1652 `sn` and
 * 1112/1229 `an` texts have `translationTitle === :0.3`, and `dn`/`mn` have no `:0.3` key at all
 * — their bilara root carries no title segment, so there is nothing to compare. So this is a
 * `tha-ap` property and the suite below is scoped to it, with a test that fails if that scoping
 * assumption is quietly abandoned. `translationTitle` in the metadata is what feeds the site
 * `<h1>`, via `src/lib/canon/document.ts`.
 *
 * So for `tha-ap` the two must be identical, and they silently were not: at commit `8745f2ba`
 * fifty-five files had a number in `:0.3` that `translationTitle` did not — "8. Bài Kệ Tuyên
 * Ngôn Về Trưởng Lão…" in the reader's comparison column, the same text without the number as
 * the page heading. Nothing failed. `validate`, `test`, `check`, `build` and both audits were all
 * green, and the defect was only visible by diffing the two fields against each other.
 *
 * A second invariant is pinned here because it is the reason the first one drifted. `:0.3` must
 * carry an ordinal **exactly when** the Pāli at `:0.3` carries one. Five separate measurements of
 * that rule disagreed for a while — 66/275, 73/274, 127/291, 240/2, 66/115 — all of them reading
 * different cells of the same contingency table and all concluding "drop the number". The
 * settled rule is to follow the Pāli, which agrees on 367/367.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';
import { COLLECTIONS, loadCatalog, segmentMapForUid, sourcePathFor, upstreamFile } from '../../src/lib/canon/load';

const TRANSLATION_DIR = 'content/translation/vi/project/sutta/kn';
const META_DIR = 'content/meta/sutta/kn';

/** Pāli's leading ordinal at `:0.3`, or null when it has none. */
function paliOrdinal(pali: string | undefined): string | null {
  const m = /^\s*(\d+)\s/.exec(String(pali ?? '').trim());
  return m ? m[1] : null;
}

/** The Vietnamese leading ordinal at `:0.3`, or null. `5, thứ năm.` and `5. …` both yield "5". */
function vietnameseOrdinal(viet: string | undefined): string | null {
  const s = String(viet ?? '').trim();
  const head = /^\s*(\d+)[.,]?\s/.exec(s);
  if (head) return head[1];
  const tail = /,\s*thứ\s+(\S+?)\.?\s*$/.exec(s);
  if (tail) return tail[1];
  return null;
}

function readPali(code: string, uid: string): Record<string, string> {
  const item = loadCatalog(code).texts.find((t) => t.uid === uid);
  const sp = item && sourcePathFor(code, uid, item.sourcePath);
  if (!sp) return {};
  try {
    return segmentMapForUid(JSON.parse(readFileSync(upstreamFile(sp), 'utf8')), uid);
  } catch {
    return {};
  }
}

function readTitle(uid: string): string | null {
  const path = `${META_DIR}/${uid}.yaml`;
  if (!existsSync(path)) return null;
  const doc = parseYaml(readFileSync(path, 'utf8')) as { translationTitle?: unknown };
  return typeof doc?.translationTitle === 'string' ? doc.translationTitle : null;
}

test('tha-ap :0.3 carries an ordinal exactly when the Pāli does', () => {
  const files = existsSync(TRANSLATION_DIR)
    ? readdirSync(TRANSLATION_DIR).filter((f) => f.startsWith('tha-ap') && f.endsWith('.json'))
    : [];
  assert.ok(files.length > 0, 'no tha-ap translations found — the check would pass vacuously');

  let compared = 0;
  const offenders: string[] = [];
  for (const file of files) {
    const uid = file.split('_')[0];
    const vi = JSON.parse(readFileSync(`${TRANSLATION_DIR}/${file}`, 'utf8')) as Record<string, string>;
    const key = `${uid}:0.3`;
    if (!(key in vi)) continue;
    const pali = readPali('kn', uid)[key];
    if (typeof pali !== 'string' || !pali.trim()) continue; // no Pāli at this key: nothing to follow
    compared += 1;
    const want = paliOrdinal(pali);
    const got = vietnameseOrdinal(vi[key]);
    if (want !== got) {
      offenders.push(`${uid}: Pāli "${pali.trim()}" → ordinal ${want ?? 'none'} · Việt "${vi[key].trim()}" → ${got ?? 'none'}`);
    }
  }

  assert.ok(compared > 0, 'no comparable `:0.3` keys — the check would pass vacuously');
  assert.deepEqual(offenders, [], `\n${offenders.length}/${compared} tha-ap texts carry an ordinal the Pāli does not, or miss one it has:\n  ${offenders.join('\n  ')}`);
});

test('tha-ap translationTitle is the same string as its :0.3', () => {
  const files = existsSync(TRANSLATION_DIR)
    ? readdirSync(TRANSLATION_DIR).filter((f) => f.startsWith('tha-ap') && f.endsWith('.json'))
    : [];
  assert.ok(files.length > 0, 'no tha-ap translations found — the check would pass vacuously');

  const offenders: string[] = [];
  let compared = 0;
  for (const file of files) {
    const uid = file.split('_')[0];
    const vi = JSON.parse(readFileSync(`${TRANSLATION_DIR}/${file}`, 'utf8')) as Record<string, string>;
    const key = `${uid}:0.3`;
    const title = readTitle(uid);
    if (title === null || !(key in vi)) continue;
    compared += 1;
    if (title.trim() !== String(vi[key]).trim()) {
      offenders.push(`${uid}: translationTitle "${title.trim()}" ≠ :0.3 "${String(vi[key]).trim()}"`);
    }
  }

  assert.ok(compared > 0, 'no comparable metadata — the check would pass vacuously');
  assert.deepEqual(offenders, [], `\n${offenders.length}/${compared} tha-ap texts show one title in the reader's :0.3 column and another as the page heading:\n  ${offenders.slice(0, 20).join('\n  ')}`);
});

test('the title invariant is a tha-ap property, not a repository-wide one', () => {
  // Guards against this suite being "fixed" by widening it. In `dn` and `mn` there is no `:0.3`
  // key to compare against at all — their pinned bilara root carries no per-text title segment —
  // and in `sn`/`an` the two strings legitimately differ most of the time. Requiring equality
  // across the layer would either be vacuous (`dn`, `mn`) or fail on correct files (`sn`, `an`).
  const missingTitleKey: string[] = [];
  for (const code of ['dn', 'mn'] as const) {
    let found = 0;
    for (const item of loadCatalog(code).texts.slice(0, 20)) {
      const viPath = `content/translation/vi/project/sutta/${code}/${item.uid}_translation-vi-project.json`;
      if (!existsSync(viPath)) continue;
      const vi = JSON.parse(readFileSync(viPath, 'utf8')) as Record<string, string>;
      if (`${item.uid}:0.3` in vi) found += 1;
    }
    if (found > 0) missingTitleKey.push(`${code}: ${found} sampled texts now carry a :0.3 key`);
  }
  assert.deepEqual(
    missingTitleKey,
    [],
    'dn/mn now carry a :0.3 segment, so the assumption that this invariant is tha-ap-specific needs revisiting before widening the suite',
  );
});