import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root = fileURLToPath(new URL('../../..', import.meta.url));
const app = fileURLToPath(new URL('..', import.meta.url));
const mark = JSON.parse(readFileSync(path.join(root, 'source/brand-mark.json'), 'utf8'));
const tokens = JSON.parse(readFileSync(path.join(root, 'source/design-tokens.json'), 'utf8'));
const color = key => '#' + tokens[key].$value.components.map(n => Math.round(n * 255).toString(16).padStart(2, '0')).join('');
const svg = (background, foreground, inset = 0) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${background ? `<rect width="64" height="64" fill="${background}"/>` : ''}<g transform="translate(${inset} ${inset}) scale(${(64 - 2 * inset) / 64})">${mark.paths.map(d => `<path d="${d}" fill="${foreground}"/>`).join('')}</g></svg>`;
const sources = {
  'icon.png': [svg(color(mark.iconBackground), color(mark.iconForeground)), 1024],
  'adaptive-icon.png': [svg(null, color(mark.iconForeground), 12), 1024],
  'splash-icon.png': [svg(null, color(mark.foreground)), 256],
};
const directory = path.join(app, 'assets');
const hash = value => createHash('sha256').update(value).digest('hex');
if (process.argv.includes('--check')) {
  const lock = JSON.parse(readFileSync(path.join(directory, 'brand.lock.json'), 'utf8'));
  for (const [name, [source]] of Object.entries(sources)) {
    if (lock[name]?.source !== hash(source) || lock[name]?.file !== hash(readFileSync(path.join(directory, name)))) {
      throw new Error(`Stale mobile brand asset: ${name}. Run npm run assets in apps/mobile after npm ci at the repository root.`);
    }
  }
  console.log('Mobile icons match the website brand registries.');
} else {
  // Reuse Astro's existing image tool; no second branding source or copied SVG.
  const { default: sharp } = await import('sharp');
  mkdirSync(directory, { recursive: true });
  const lock = {};
  for (const [name, [source, size]] of Object.entries(sources)) {
    const image = await sharp(Buffer.from(source)).resize(size, size).png().toBuffer();
    writeFileSync(path.join(directory, name), image);
    lock[name] = { source: hash(source), file: hash(image) };
  }
  writeFileSync(path.join(directory, 'brand.lock.json'), JSON.stringify(lock, null, 2) + '\n');
  console.log('Generated mobile icons from the website Pāli Folio mark.');
}
