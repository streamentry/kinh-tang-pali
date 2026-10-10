import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import test from 'node:test';

const tokens = JSON.parse(readFileSync('source/design-tokens.json', 'utf8'));
const luminance = (name: string) => tokens[name].$value.components
  .map((value: number) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
  .reduce((sum: number, value: number, index: number) => sum + value * [.2126, .7152, .0722][index], 0);
const contrast = (foreground: string, background: string) => {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + .05) / (values[1] + .05);
};

test('essential design text pairs retain WCAG AA contrast', () => {
  for (const background of ['paper', 'surface', 'surface-soft', 'accent-soft']) {
    for (const foreground of ['ink', 'muted', 'accent']) {
      assert.ok(contrast(foreground, background) >= 4.5, `${foreground} on ${background}`);
    }
  }
  for (const [foreground, background] of [
    ['on-accent', 'accent'], ['on-accent', 'accent-hover'],
    ['warning', 'warning-soft'], ['reference', 'reference-soft'],
  ]) assert.ok(contrast(foreground, background) >= 4.5, `${foreground} on ${background}`);
  for (const foreground of ['control-border', 'focus']) {
    for (const background of ['paper', 'surface']) {
      assert.ok(contrast(foreground, background) >= 3, `${foreground} on ${background}`);
    }
  }
});

test('generated design tokens match the registry and component CSS has no separate palette', () => {
  execFileSync(process.execPath, ['scripts/design-tokens.mjs', '--check']);
  const css = readFileSync('public/styles/global.css', 'utf8');
  assert.doesNotMatch(css, /#[\da-f]{3,8}\b|rgba?\(|hsla?\(/i);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /forced-colors/);
});

test('self-hosted fonts cover ordinary Latin, Pāli diacritics and Vietnamese with original licenses', () => {
  const css = readFileSync('public/styles/fonts.css', 'utf8');
  for (const family of ['noto-serif', 'be-vietnam-pro']) {
    for (const subset of ['latin', 'latin-ext', 'vietnamese']) {
      assert.match(css, new RegExp(`${family}-${subset}-400-normal\\.woff2`));
    }
    assert.match(readFileSync(`public/fonts/${family}-OFL.txt`, 'utf8'), /SIL OPEN FONT LICENSE/);
  }
  for (const match of css.matchAll(/url\('\.\.\/fonts\/([^']+)'\)/g)) {
    assert.ok(existsSync(`public/fonts/${match[1]}`), `Missing font: ${match[1]}`);
  }
});

test('homepage images retain pinned provenance and do not assign project CC0 to the supplied artwork', () => {
  const registry = JSON.parse(readFileSync('source/visual-assets.json', 'utf8'));
  for (const image of registry.images) {
    assert.equal(createHash('sha256').update(readFileSync(image.file)).digest('hex'), image.sha256, image.id);
    assert.ok(image.sourcePage && image.sourceUrl && image.alt && image.rightsNote);
  }
  const artwork = registry.images.find((image: { id: string }) => image.id === 'thay-minh-tue');
  assert.equal(artwork.sourceUrl, 'https://bantranh.com/wp-content/uploads/2025/07/IMG_1756.jpeg');
  assert.equal(artwork.license, 'NOASSERTION');
  assert.equal(artwork.author, null);
  const buddha = registry.images.find((image: { id: string }) => image.id === 'samadhi-buddha');
  assert.equal(buddha.author, 'Price Zero');
  assert.equal(buddha.license, 'CC0-1.0');
});
