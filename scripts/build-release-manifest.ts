import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const lock = JSON.parse(readFileSync(path.join(root, 'source/suttacentral.lock.json'), 'utf8'));
const exportDir = path.join(root, 'exports');
const files = readdirSync(exportDir).filter((name) => !name.endsWith('.manifest.json'));
const artifacts = files.map((name) => {
  const data = readFileSync(path.join(exportDir, name));
  return { name, sha256: createHash('sha256').update(data).digest('hex'), bytes: data.length };
});
writeFileSync(path.join(exportDir, 'release.manifest.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  suttacentralCommit: lock.commit,
  artifacts,
}, null, 2) + '\n');
