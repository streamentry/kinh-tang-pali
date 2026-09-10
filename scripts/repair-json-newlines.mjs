import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const roots = [
  'content/translation/vi/project',
  'content/comment/vi/project',
];

function filesUnder(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const file = path.join(dir, name);
    if (statSync(file).isDirectory()) out.push(...filesUnder(file));
    else if (file.endsWith('.json')) out.push(file);
  }
  return out;
}

function repairControlCharactersInsideStrings(text) {
  let output = '';
  let inString = false;
  let escaped = false;

  for (const char of text) {
    if (!inString) {
      output += char;
      if (char === '"') inString = true;
      continue;
    }

    if (escaped) {
      output += char;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      output += char;
      escaped = true;
      continue;
    }

    if (char === '"') {
      output += char;
      inString = false;
      continue;
    }

    if (char === '\n' || char === '\r' || char === '\t') {
      output += ' ';
      continue;
    }

    output += char;
  }

  return output;
}

let repaired = 0;
for (const root of roots) {
  for (const file of filesUnder(root)) {
    const original = readFileSync(file, 'utf8');
    try {
      JSON.parse(original);
      continue;
    } catch {
      const candidate = repairControlCharactersInsideStrings(original);
      let parsed;
      try {
        parsed = JSON.parse(candidate);
      } catch (error) {
        console.error(`Could not safely repair ${file}: ${error}`);
        process.exitCode = 1;
        continue;
      }
      writeFileSync(file, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8');
      console.log(`Repaired ${file}`);
      repaired += 1;
    }
  }
}

console.log(`Repaired ${repaired} invalid JSON file(s).`);
