import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const partsRoot = path.join(root, 'work/dn-parts');
const outRoot = path.join(root, 'content/translation/vi/project/sutta/dn');

if (!existsSync(partsRoot)) throw new Error('work/dn-parts does not exist');
mkdirSync(outRoot, { recursive: true });

const dirs = readdirSync(partsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /^dn\d+$/.test(entry.name))
  .map((entry) => entry.name)
  .sort((a, b) => Number(a.slice(2)) - Number(b.slice(2)));

for (const uid of dirs) {
  const dir = path.join(partsRoot, uid);
  const files = readdirSync(dir).filter((name) => name.endsWith('.json')).sort();
  const merged = {};
  for (const name of files) {
    const part = JSON.parse(readFileSync(path.join(dir, name), 'utf8'));
    for (const [id, value] of Object.entries(part)) {
      if (!id.startsWith(`${uid}:`)) throw new Error(`${name}: foreign segment ${id}`);
      if (Object.hasOwn(merged, id)) throw new Error(`${uid}: duplicate segment ${id}`);
      if (typeof value !== 'string' || !value.trim()) throw new Error(`${uid}: empty translation at ${id}`);
      merged[id] = value.normalize('NFC');
    }
  }
  const out = path.join(outRoot, `${uid}_translation-vi-project.json`);
  writeFileSync(out, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
  console.log(`${uid}: ${Object.keys(merged).length} translated segments from ${files.length} part(s)`);
}
