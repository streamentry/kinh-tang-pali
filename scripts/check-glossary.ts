/**
 * Cross-batch terminology consistency against the established precedent file.
 *
 * AGENTS.md requires the coordinator to cross-check every batch against the precedent
 * files before shipping and to *record* divergence rather than letting two batches
 * silently disagree. `scripts/validate.ts` only parses `content/glossary/pali-vi.yaml`
 * for well-formedness — nothing in the repository ever compared a translation against
 * it, so a term could be rendered five different ways across five batches and no
 * command would say so.
 *
 * This reads the glossary, then for every segment whose Pāli actually contains a
 * glossary term, checks the Vietnamese against `preferred` + `allowed`. It reports
 * counts and the concrete divergent segments. Default is advisory (exit 0) because the
 * corpus legitimately carries divergences recorded before the glossary existed;
 * `--strict` fails the run so a batch can be held to it, and `--json` gives the delta
 * tooling a machine-readable shape to diff before/after.
 *
 *   npm run glossary:check
 *   npx tsx scripts/check-glossary.ts --strict
 *   npx tsx scripts/check-glossary.ts --json > after.json
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import type { CanonCatalog, CollectionCode } from '../src/lib/canon/types';
import { segmentMapForUid, sourcePathFor } from '../src/lib/canon/load';

const ROOT = process.cwd();
const COLLECTIONS: CollectionCode[] = ['dn', 'mn', 'sn', 'an', 'kn'];

const strict = process.argv.includes('--strict');
const asJson = process.argv.includes('--json');
const limit = Number(process.argv.includes('--limit') ? process.argv[process.argv.indexOf('--limit') + 1] : 400);

interface GlossaryEntry {
  preferred?: string;
  allowed?: string[];
  severity?: string;
  note?: string;
}

interface Divergence {
  uid: string;
  segment: string;
  term: string;
  preferred: string;
  pali: string;
  vi: string;
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}

const glossaryFile = path.join(ROOT, 'content/glossary/pali-vi.yaml');
const glossary = YAML.parse(readFileSync(glossaryFile, 'utf8')) as Record<string, GlossaryEntry>;

const terms = Object.entries(glossary)
  .filter(([, e]) => typeof e?.preferred === 'string' && e.preferred.length > 0)
  .map(([term, entry]) => {
    const allowed = new Set<string>([entry.preferred as string, ...(entry.allowed ?? [])]);
    // Word-boundary match that respects Unicode letters: \b is ASCII-only even with /u.
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return {
      term,
      preferred: entry.preferred as string,
      allowed,
      severity: entry.severity ?? 'warn',
      re: new RegExp(`(^|[^\\p{L}\\p{M}])${escaped}($|[^\\p{L}\\p{M}])`, 'gu'),
    };
  });

const stats = new Map<string, { hits: number; ok: number; diverge: number; texts: Set<string> }>();
for (const t of terms) stats.set(t.term, { hits: 0, ok: 0, diverge: 0, texts: new Set() });

const divergences: Divergence[] = [];
let textsChecked = 0;
let segmentsChecked = 0;

for (const collection of COLLECTIONS) {
  const catalogFile = path.join(ROOT, 'content/catalog/sutta', `${collection}.json`);
  if (!existsSync(catalogFile)) continue;
  const catalog = readJson<CanonCatalog>(catalogFile);
  const dir = path.join(ROOT, 'content/translation/vi/project/sutta', collection);
  if (!existsSync(dir)) continue;

  for (const item of catalog.texts) {
    const uid = item.uid;
    if (!uid) continue;
    const translationFile = path.join(dir, `${uid}_translation-vi-project.json`);
    if (!existsSync(translationFile)) continue;

    const sourcePath = sourcePathFor(collection, uid, item.sourcePath);
    if (!sourcePath) continue;
    const sourceFile = path.join(ROOT, '.cache/upstream/suttacentral', sourcePath);
    if (!existsSync(sourceFile)) continue;

    const source = segmentMapForUid(readJson<Record<string, string>>(sourceFile), uid);
    const translation = readJson<Record<string, unknown>>(translationFile);
    textsChecked += 1;

    for (const [id, paliRaw] of Object.entries(source)) {
      const pali = String(paliRaw ?? '');
      if (!pali.trim()) continue;
      const viRaw = translation[id];
      if (viRaw === undefined || viRaw === null || !String(viRaw).trim()) continue;
      const vi = String(viRaw).normalize('NFC');
      segmentsChecked += 1;
      const paliN = pali.normalize('NFC');

      for (const t of terms) {
        t.re.lastIndex = 0;
        if (!t.re.test(paliN)) continue;
        const s = stats.get(t.term)!;
        s.hits += 1;
        s.texts.add(`${collection}/${uid}`);
        const hit = [...t.allowed].some((a) => vi.includes(a.normalize('NFC')));
        if (hit) {
          s.ok += 1;
        } else {
          s.diverge += 1;
          if (divergences.length < limit) {
            divergences.push({ uid: `${collection}/${uid}`, segment: id, term: t.term, preferred: t.preferred, pali: paliN, vi });
          }
        }
      }
    }
  }
}

const rows = [...stats.entries()]
  .filter(([, s]) => s.hits > 0)
  .map(([term, s]) => {
    const rate = s.hits ? Math.round((s.ok / s.hits) * 1000) / 10 : 100;
    /**
     * Ba loại lệch phải tách nhau, vì chúng khác người phải sửa:
     *
     *  - `glossary-unattested` — không bài nào dùng `preferred`, nên bản dịch không
     *    sai: chính mục từ điển lệch với corpus đã ấn hành. Sửa glossary.
     *  - `split` — CÓ bài dùng mà CÓ bài không: đây mới là mâu thuẫn giữa các lát,
     *    đúng thứ coordinator phải chặn trước khi merge.
     *  - `consistent` — không có chỗ nào lệch.
     */
    const cls = s.diverge === 0 ? 'consistent' : s.ok === 0 ? 'glossary-unattested' : 'split';
    return { term, hits: s.hits, ok: s.ok, diverge: s.diverge, texts: s.texts.size, rate, class: cls };
  })
  .sort((a, b) => {
    const rank: Record<string, number> = { split: 0, 'glossary-unattested': 1, consistent: 2 };
    return rank[a.class] - rank[b.class] || a.rate - b.rate || b.hits - a.hits;
  });

const totalHits = rows.reduce((n, r) => n + r.hits, 0);
const totalDiverge = rows.reduce((n, r) => n + r.diverge, 0);
const split = rows.filter((r) => r.class === 'split');
const unattested = rows.filter((r) => r.class === 'glossary-unattested');
const consistent = rows.filter((r) => r.class === 'consistent');

if (asJson) {
  console.log(JSON.stringify({
    textsChecked,
    segmentsChecked,
    termsUsed: rows.length,
    totalHits,
    totalDiverge,
    counts: { split: split.length, glossaryUnattested: unattested.length, consistent: consistent.length },
    rows,
    divergences,
  }, null, 2));
} else {
  console.log(`Glossary cross-check — ${path.relative(ROOT, glossaryFile)}`);
  console.log(`  texts checked        ${textsChecked}`);
  console.log(`  segments checked     ${segmentsChecked}`);
  console.log(`  glossary terms used  ${rows.length} / ${terms.length}`);
  console.log(`  term occurrences     ${totalHits}`);
  console.log(`  divergences          ${totalDiverge}`);
  console.log('');
  console.log(`  split (cÓ bài dùng, cÓ bài không — mâu thuẫn giữa các lát): ${split.length}`);
  console.log(`  glossary-unattested (không bài nào dùng preferred — mục từ điển sai): ${unattested.length}`);
  console.log(`  consistent: ${consistent.length}`);
  console.log('');
  console.log('  ⚠ đọc kèm cột %đúng: một thuật ngữ ở 0% là glossary chưa phản ánh corpus');
  console.log('    (vd `sāriputta` glossary ghi "Xá-lợi-phất" nhưng corpus dùng `Sāriputta` 948 lần),');
  console.log('    còn thuật ngữ ở 30–70% mới là chỗ các lát dịch thực sự bất đồng.');
  console.log('');

  if (split.length) {
    console.log('  ── MÂU THUẪN THẬT (ưu tiên xử lý) ─────────────────────────');
    console.log('  thuật ngữ            hits   lệch   %đúng   bài');
    for (const r of split) {
      console.log(`  ${r.term.padEnd(20)} ${String(r.hits).padStart(5)} ${String(r.diverge).padStart(6)} ${String(r.rate).padStart(7)} ${String(r.texts).padStart(5)}`);
    }
    console.log('');
  }
  if (unattested.length) {
    console.log('  ── GLOSSARY CHƯA ĐƯỢC BẤT KỲ BÀI NÀO DÙNG (sửa glossary) ──');
    console.log('  thuật ngữ            hits   lệch   bài   preferred');
    for (const r of unattested) {
      const pref = glossary[r.term]?.preferred ?? '';
      console.log(`  ${r.term.padEnd(20)} ${String(r.hits).padStart(5)} ${String(r.diverge).padStart(6)} ${String(r.texts).padStart(5)}   "${pref}"`);
    }
    console.log('');
  }

  if (totalDiverge > 0) {
    console.log(`  ${divergences.length} ví dụ lệch (dùng --strict để chặn, --json để lấy đầy đủ):`);
    for (const d of divergences.slice(0, 30)) {
      console.log(`   - ${d.segment} · \`${d.term}\` → cần "${d.preferred}"`);
      console.log(`       P: ${d.pali.slice(0, 110)}`);
      console.log(`       V: ${d.vi.slice(0, 110)}`);
    }
    if (totalDiverge > divergences.length) console.log(`   … và ${totalDiverge - divergences.length} ví dụ nữa (--limit để nới)`);
  }
}

/**
 * `--strict` fails only on `split` — the case where some texts follow the glossary and
 * others do not, which is a genuine cross-batch disagreement. `glossary-unattested` is
 * a problem with the precedent file, not with the translations, so it must not block:
 * the corpus was published before the entry existed. `--strict-all` covers both.
 */
const strictAll = process.argv.includes('--strict-all');
if ((strict && split.length > 0) || (strictAll && totalDiverge > 0)) {
  console.error(
    `\n[glossary:check] ${split.length} term(s) split across batches` +
      (strictAll ? `, ${totalDiverge} divergence(s) total` : '') +
      ` — strict mode.`,
  );
  process.exit(1);
}
