import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
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
