import { readFileSync, writeFileSync } from 'node:fs';

const uid = 'mn36';
const partFiles = Array.from({ length: 6 }, (_, i) => `tmp/mn36-part${i + 1}.json`);
const outputFile = 'content/translation/vi/project/sutta/mn/mn36_translation-vi-project.json';
const sourceFile = '.cache/upstream/suttacentral/root/pli/ms/sutta/mn/mn36_root-pli-ms.json';

const merged = {};
for (const file of partFiles) {
  const part = JSON.parse(readFileSync(file, 'utf8'));
  for (const [id, value] of Object.entries(part)) {
    if (Object.prototype.hasOwnProperty.call(merged, id)) {
      throw new Error(`Duplicate segment across parts: ${id}`);
    }
    if (!id.startsWith(`${uid}:`)) throw new Error(`Wrong UID prefix: ${id}`);
    if (typeof value !== 'string' || value.trim() === '') throw new Error(`Empty/non-string translation: ${id}`);
    if (value !== value.normalize('NFC')) throw new Error(`Non-NFC translation: ${id}`);
    merged[id] = value;
  }
}

const source = JSON.parse(readFileSync(sourceFile, 'utf8'));
const sourceIds = Object.keys(source);
const translationIds = Object.keys(merged);
if (translationIds.length !== 360) {
  throw new Error(`Expected 360 staged MN36 segments, got ${translationIds.length}`);
}
const missing = sourceIds.filter((id) => !Object.prototype.hasOwnProperty.call(merged, id));
const orphan = translationIds.filter((id) => !Object.prototype.hasOwnProperty.call(source, id));
if (missing.length || orphan.length) {
  throw new Error(`MN36 key mismatch. Missing: ${missing.join(', ') || 'none'}; orphan: ${orphan.join(', ') || 'none'}`);
}
if (sourceIds.length !== translationIds.length) {
  throw new Error(`Source/translation size mismatch: ${sourceIds.length} vs ${translationIds.length}`);
}

const ordered = Object.fromEntries(sourceIds.map((id) => [id, merged[id]]));
writeFileSync(outputFile, `${JSON.stringify(ordered, null, 2)}\n`, 'utf8');
console.log(`Assembled ${translationIds.length} exact Pāli-aligned segments into ${outputFile}`);
