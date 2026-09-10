import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const uid = process.argv[2];
if (!uid || !/^mn\d+$/.test(uid)) {
  throw new Error('Usage: node scripts/assemble-staged-translation.mjs mnNN');
}

const tmpDir = 'tmp';
const partPattern = new RegExp(`^${uid}-part(\\d+)\\.json$`);
const partFiles = readdirSync(tmpDir)
  .map((name) => ({ name, match: name.match(partPattern) }))
  .filter((item) => item.match)
  .sort((a, b) => Number(a.match[1]) - Number(b.match[1]))
  .map((item) => path.join(tmpDir, item.name));

if (partFiles.length === 0) throw new Error(`No staged parts found for ${uid}`);

const sourceFile = `.cache/upstream/suttacentral/root/pli/ms/sutta/mn/${uid}_root-pli-ms.json`;
if (!existsSync(sourceFile)) throw new Error(`Pinned source missing: ${sourceFile}`);
const source = JSON.parse(readFileSync(sourceFile, 'utf8'));
const sourceIds = Object.keys(source);

const merged = {};
for (const file of partFiles) {
  const part = JSON.parse(readFileSync(file, 'utf8'));
  for (const [id, value] of Object.entries(part)) {
    if (Object.prototype.hasOwnProperty.call(merged, id)) throw new Error(`Duplicate segment across staged parts: ${id}`);
    if (!id.startsWith(`${uid}:`)) throw new Error(`Wrong UID prefix: ${id}`);
    if (typeof value !== 'string' || value.trim() === '') throw new Error(`Empty/non-string translation: ${id}`);
    if (value !== value.normalize('NFC')) throw new Error(`Non-NFC translation: ${id}`);
    merged[id] = value;
  }
}

const translationIds = Object.keys(merged);
const missing = sourceIds.filter((id) => !Object.prototype.hasOwnProperty.call(merged, id));
const orphan = translationIds.filter((id) => !Object.prototype.hasOwnProperty.call(source, id));
if (missing.length || orphan.length || sourceIds.length !== translationIds.length) {
  throw new Error([
    `${uid} exact-key validation failed.`,
    `source=${sourceIds.length}, translation=${translationIds.length}`,
    `missing=${missing.join(', ') || 'none'}`,
    `orphan=${orphan.join(', ') || 'none'}`,
  ].join('\n'));
}

const ordered = Object.fromEntries(sourceIds.map((id) => [id, merged[id]]));
const outputFile = `content/translation/vi/project/sutta/mn/${uid}_translation-vi-project.json`;
writeFileSync(outputFile, `${JSON.stringify(ordered, null, 2)}\n`, 'utf8');
console.log(`Assembled ${uid}: ${translationIds.length}/${sourceIds.length} exact Pāli-aligned segments -> ${outputFile}`);
