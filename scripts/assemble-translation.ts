import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const uid = process.argv[2];
if (!uid || !/^mn\d+$/.test(uid)) {
  console.error('Usage: tsx scripts/assemble-translation.ts mnNN');
  process.exit(2);
}
const sourceFile = path.join(ROOT, `.cache/upstream/suttacentral/root/pli/ms/sutta/mn/${uid}_root-pli-ms.json`);
const tmFile = path.join(ROOT, `staging/${uid}/tm.json`);
const manualFile = path.join(ROOT, `staging/${uid}/manual.json`);
if (!existsSync(sourceFile)) throw new Error(`Missing pinned source: ${sourceFile}`);
if (!existsSync(manualFile)) throw new Error(`Missing manual layer: ${manualFile}`);

const source = JSON.parse(readFileSync(sourceFile, 'utf8')) as Record<string, string>;
const tm = existsSync(tmFile) ? JSON.parse(readFileSync(tmFile, 'utf8')) as Record<string, string> : {};
const manual = JSON.parse(readFileSync(manualFile, 'utf8')) as Record<string, string>;
const sourceIds = Object.keys(source);
const sourceSet = new Set(sourceIds);
for (const id of Object.keys(tm)) if (!sourceSet.has(id)) throw new Error(`${uid}: TM orphan ${id}`);
for (const id of Object.keys(manual)) if (!sourceSet.has(id)) throw new Error(`${uid}: manual orphan ${id}`);

const out: Record<string, string> = {};
const missing: string[] = [];
for (const id of sourceIds) {
  const value = (manual[id] ?? tm[id] ?? '').normalize('NFC').trim();
  if (!value) missing.push(id);
  out[id] = value;
}
if (missing.length) {
  console.error(`${uid}: ${missing.length} untranslated source segment(s): ${missing.join(', ')}`);
  process.exit(1);
}
const outputFile = path.join(ROOT, `content/translation/vi/project/sutta/mn/${uid}_translation-vi-project.json`);
writeFileSync(outputFile, JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log(`${uid}: canonical translation assembled with exact ${sourceIds.length}/${sourceIds.length} key coverage.`);
