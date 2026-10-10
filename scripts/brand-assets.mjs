import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// The mark has one geometry source; every colour comes from the design registry.
const mark = JSON.parse(readFileSync('source/brand-mark.json', 'utf8'));
const tokens = JSON.parse(readFileSync('source/design-tokens.json', 'utf8'));
const hash = data => createHash('sha256').update(data).digest('hex');
const colour = name => {
  const token = tokens[name];
  if (token?.$type !== 'color' || token.$value.colorSpace !== 'srgb' || token.$value.alpha !== 1) throw new Error(`Invalid brand colour: ${name}`);
  return '#' + token.$value.components.map(value => Math.round(value * 255).toString(16).padStart(2, '0')).join('');
};
const paths = fill => mark.paths.map(d => `<path fill="${fill}" d="${d}"/>`).join('');
const svg = content => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${mark.viewBox}">${content}</svg>\n`;
const logo = svg(paths(colour(mark.foreground)));
const icon = radius => svg(`<rect width="64" height="64" rx="${radius}" fill="${colour(mark.iconBackground)}"/>${paths(colour(mark.iconForeground))}`);
const favicon = icon(tokens['radius-md'].$value.value * 16);
const touchIcon = icon(0); // iOS supplies its own corner mask.
const vectors = { 'public/logo.svg': logo, 'public/favicon.svg': favicon };

if (process.argv.includes('--check')) {
  for (const [file, content] of Object.entries(vectors)) {
    if (readFileSync(file, 'utf8') !== content) throw new Error(`${file} differs from the brand/token registries. Run npm run design:generate.`);
  }
  const raster = JSON.parse(readFileSync('source/brand-raster.lock.json', 'utf8'));
  if (raster.faviconSource !== hash(favicon) || raster.touchSource !== hash(touchIcon)) throw new Error('Brand raster sources are stale. Run npm run design:generate.');
  for (const [file, digest] of Object.entries(raster.files)) {
    if (hash(readFileSync(file)) !== digest) throw new Error(`Brand raster changed: ${file}`);
  }
  console.log('Logo and favicon assets match the brand and design registries.');
} else {
  for (const [file, content] of Object.entries(vectors)) writeFileSync(file, content);
  // Sharp is already supplied by Astro's image pipeline. Rendering is a local
  // generation step; CI verifies hashes instead of comparing platform encoders.
  const { default: sharp } = await import('sharp');
  const png = (source, size) => sharp(Buffer.from(source)).resize(size, size).png().toBuffer();
  const small = await png(favicon, 16);
  const medium = await png(favicon, 32);
  const touch = await png(touchIcon, 180);
  const frames = [small, medium];
  const sizes = [16, 32];
  const header = Buffer.alloc(6 + 16 * frames.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(frames.length, 4);
  let offset = header.length;
  for (const [index, frame] of frames.entries()) {
    const entry = 6 + 16 * index;
    header[entry] = sizes[index]; header[entry + 1] = sizes[index];
    header.writeUInt16LE(1, entry + 4); header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(frame.length, entry + 8); header.writeUInt32LE(offset, entry + 12);
    offset += frame.length;
  }
  const rasters = {
    'public/favicon.ico': Buffer.concat([header, ...frames]),
    'public/favicon-32.png': medium,
    'public/apple-touch-icon.png': touch,
  };
  for (const [file, data] of Object.entries(rasters)) writeFileSync(file, data);
  writeFileSync('source/brand-raster.lock.json', JSON.stringify({
    faviconSource: hash(favicon), touchSource: hash(touchIcon),
    files: Object.fromEntries(Object.entries(rasters).map(([file, data]) => [file, hash(data)])),
  }, null, 2) + '\n');
  console.log('Generated SVG logo, SVG/ICO/PNG favicons and Apple touch icon.');
}
