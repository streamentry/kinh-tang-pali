import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const ROOT = process.cwd();
const targetUid = process.argv[2];
if (!targetUid || !/^mn\d+$/.test(targetUid)) {
  console.error('Usage: tsx scripts/translation-memory.ts mnNN');
  process.exit(2);
}

const sourceDir = path.join(ROOT, '.cache/upstream/suttacentral/root/pli/ms/sutta/mn');
const metaDir = path.join(ROOT, 'content/meta/sutta/mn');
const trDir = path.join(ROOT, 'content/translation/vi/project/sutta/mn');
const targetSourceFile = path.join(sourceDir, `${targetUid}_root-pli-ms.json`);
if (!existsSync(targetSourceFile)) throw new Error(`Missing pinned source ${targetSourceFile}`);

const norm = (s: string) => s.normalize('NFC').trim().replace(/\s+/g, ' ');
const reusable = (pali: string) => {
  const s = norm(pali);
  return s.length >= 40 && !s.includes('…') && !/\.\.\.|\bpe\b/i.test(s);
};

type Candidate = { values: Set<string>; sources: Set<string> };
const memory = new Map<string, Candidate>();

for (const name of readdirSync(metaDir).filter((n) => /^mn\d+\.yaml$/.test(n))) {
  const uid = name.replace(/\.yaml$/, '');
  if (uid === targetUid) continue;
  const meta = YAML.parse(readFileSync(path.join(metaDir, name), 'utf8')) as { status?: string };
  if (meta.status !== 'published') continue;
  const srcFile = path.join(sourceDir, `${uid}_root-pli-ms.json`);
  const viFile = path.join(trDir, `${uid}_translation-vi-project.json`);
  if (!existsSync(srcFile) || !existsSync(viFile)) continue;
  const src = JSON.parse(readFileSync(srcFile, 'utf8')) as Record<string, string>;
  const vi = JSON.parse(readFileSync(viFile, 'utf8')) as Record<string, string>;
  for (const [id, paliRaw] of Object.entries(src)) {
    if (!reusable(paliRaw)) continue;
    const viRaw = vi[id];
    if (typeof viRaw !== 'string' || !viRaw.trim()) continue;
    const key = norm(paliRaw);
    const c = memory.get(key) ?? { values: new Set<string>(), sources: new Set<string>() };
    c.values.add(viRaw.trim().normalize('NFC'));
    c.sources.add(uid);
    memory.set(key, c);
  }
}

const target = JSON.parse(readFileSync(targetSourceFile, 'utf8')) as Record<string, string>;
const scaffold: Record<string, string> = {};
const provenance: Record<string, string[]> = {};
let matched = 0;
let skippedConflict = 0;
for (const [id, paliRaw] of Object.entries(target)) {
  const c = reusable(paliRaw) ? memory.get(norm(paliRaw)) : undefined;
  if (c && c.values.size === 1) {
    scaffold[id] = [...c.values][0];
    provenance[id] = [...c.sources].sort();
    matched += 1;
  } else {
    scaffold[id] = '';
    if (c && c.values.size > 1) skippedConflict += 1;
  }
}

const outDir = path.join(ROOT, 'staging', targetUid);
mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, 'tm.json'), JSON.stringify(scaffold, null, 2) + '\n');
writeFileSync(path.join(outDir, 'tm-provenance.json'), JSON.stringify(provenance, null, 2) + '\n');
writeFileSync(path.join(outDir, 'tm-report.json'), JSON.stringify({
  uid: targetUid,
  total: Object.keys(target).length,
  matched,
  unmatched: Object.keys(target).length - matched,
  coverage: Number((matched / Object.keys(target).length).toFixed(4)),
  skippedConflicts: skippedConflict,
  policy: 'exact normalized Pali >=40 chars; no ellipsis; only published sources; conflicting Vietnamese candidates skipped'
}, null, 2) + '\n');
console.log(`${targetUid}: ${matched}/${Object.keys(target).length} segments filled from conservative translation memory`);
