import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const uid = process.argv[2];
if (!uid || !/^(dn|mn|sn|an|kn)[a-z0-9.-]+$/.test(uid)) {
  throw new Error('Usage: npx tsx scripts/assemble-staged-translation.ts <uid> [--clean]');
}

const clean = process.argv.includes('--clean');
const collection = uid.match(/^[a-z]+/)?.[0];
if (!collection) throw new Error(`Cannot derive collection from ${uid}`);

const root = process.cwd();
const stagingDir = path.join(root, 'staging', uid);
if (!existsSync(stagingDir)) throw new Error(`Missing staging directory: ${stagingDir}`);

const partNames = readdirSync(stagingDir)
  .filter((name) => /^part\d+\.json$/.test(name))
  .sort((a, b) => Number(a.match(/\d+/)?.[0]) - Number(b.match(/\d+/)?.[0]));
if (partNames.length === 0) throw new Error(`No part*.json files found for ${uid}`);

const merged: Record<string, string> = {};
for (const name of partNames) {
  const file = path.join(stagingDir, name);
  const data = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
  for (const [key, value] of Object.entries(data)) {
    if (key in merged) throw new Error(`${uid}: duplicate segment ${key} in ${name}`);
    if (typeof value !== 'string' || value.trim() === '') throw new Error(`${uid}: empty/non-string value at ${key}`);
    if (value !== value.normalize('NFC')) throw new Error(`${uid}: non-NFC value at ${key}`);
    merged[key] = value;
  }
}

const lock = JSON.parse(readFileSync(path.join(root, 'source/suttacentral.lock.json'), 'utf8')) as { commit: string; rootEdition: string };
if (!/^[a-f0-9]{40}$/.test(lock.commit)) throw new Error('Pinned SuttaCentral commit is invalid');

const sourceUrl = `https://raw.githubusercontent.com/suttacentral/bilara-data/${lock.commit}/root/${lock.rootEdition}/sutta/${collection}/${uid}_root-pli-ms.json`;
const response = await fetch(sourceUrl);
if (!response.ok) throw new Error(`${uid}: failed to fetch pinned Pāli root (${response.status})`);
const source = await response.json() as Record<string, string>;

const sourceKeys = Object.keys(source);
const translationKeys = Object.keys(merged);
const missing = sourceKeys.filter((key) => !(key in merged));
const orphan = translationKeys.filter((key) => !(key in source));
if (missing.length || orphan.length) {
  throw new Error(`${uid}: exact key-set mismatch; missing=${missing.length} [${missing.slice(0, 12).join(', ')}], orphan=${orphan.length} [${orphan.slice(0, 12).join(', ')}]`);
}

const ordered: Record<string, string> = {};
for (const key of sourceKeys) ordered[key] = merged[key]!;
const outputDir = path.join(root, 'content/translation/vi/project/sutta', collection);
mkdirSync(outputDir, { recursive: true });
const outputFile = path.join(outputDir, `${uid}_translation-vi-project.json`);
writeFileSync(outputFile, `${JSON.stringify(ordered, null, 2)}\n`, 'utf8');

console.log(`${uid}: assembled ${translationKeys.length}/${sourceKeys.length} exact pinned Pāli segments from ${partNames.length} part(s).`);
if (clean) {
  rmSync(stagingDir, { recursive: true, force: true });
  console.log(`${uid}: removed staging directory.`);
}
