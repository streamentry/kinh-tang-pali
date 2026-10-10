import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import test from 'node:test';

test('brand assets stay linked to canonical geometry and palette', () => {
  execFileSync(process.execPath, ['scripts/brand-assets.mjs', '--check']);
  const mark = JSON.parse(readFileSync('source/brand-mark.json', 'utf8'));
  const component = readFileSync('src/components/BrandMark.astro', 'utf8');
  assert.match(component, /source\/brand-mark\.json/);
  assert.match(component, /currentColor/);
  assert.match(component, /aria-hidden="true"/);
  for (const name of ['logo', 'favicon']) {
    const svg = readFileSync(`public/${name}.svg`, 'utf8');
    for (const path of mark.paths) assert.ok(svg.includes(`d="${path}"`));
    assert.doesNotMatch(svg, /<text|<script|https?:\/\/(?!www\.w3\.org)/);
  }
});

test('packaged favicon fallbacks have real sizes and intact ICO frames', () => {
  const dimensions = (data: Buffer) => {
    assert.equal(data.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    return [data.readUInt32BE(16), data.readUInt32BE(20)];
  };
  assert.deepEqual(dimensions(readFileSync('public/favicon-32.png')), [32, 32]);
  assert.deepEqual(dimensions(readFileSync('public/apple-touch-icon.png')), [180, 180]);
  const ico = readFileSync('public/favicon.ico');
  assert.equal(ico.readUInt16LE(2), 1);
  assert.equal(ico.readUInt16LE(4), 2);
  for (const [index, size] of [16, 32].entries()) {
    const entry = 6 + 16 * index;
    assert.equal(ico[entry], size);
    const bytes = ico.readUInt32LE(entry + 8);
    const offset = ico.readUInt32LE(entry + 12);
    assert.ok(offset >= 38 && offset + bytes <= ico.length);
    assert.deepEqual(dimensions(ico.subarray(offset, offset + bytes)), [size, size]);
  }
  const layout = readFileSync('src/layouts/Base.astro', 'utf8');
  for (const file of ['favicon.svg', 'favicon.ico', 'favicon-32.png', 'apple-touch-icon.png']) {
    assert.ok(layout.includes(`withBase('${file}')`), `${file} must respect the deployed base path`);
  }
});
