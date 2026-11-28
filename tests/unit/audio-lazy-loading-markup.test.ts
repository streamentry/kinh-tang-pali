import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('JavaScript audio elements have no initial source; no-script native fallbacks keep their sources', () => {
  const sutta = fs.readFileSync('src/components/SuttaAudio.astro', 'utf8');
  const collection = fs.readFileSync('src/components/CollectionAudio.astro', 'utf8');
  const suttaAudio = sutta.match(/<audio\b[^>]*>/)?.[0] ?? '';
  const collectionAudio = collection.match(/<audio\b[^>]*>/)?.[0] ?? '';
  const suttaNoScript = sutta.match(/<noscript>([\s\S]*?)<\/noscript>/)?.[1] ?? '';
  const collectionNoScript = collection.match(/<noscript>([\s\S]*?)<\/noscript>/)?.[1] ?? '';

  assert.ok(suttaAudio.length > 0);
  assert.ok(collectionAudio.length > 0);
  assert.ok(suttaNoScript.length > 0);
  assert.ok(collectionNoScript.length > 0);
  assert.doesNotMatch(suttaAudio, /\ssrc=/);
  assert.doesNotMatch(collectionAudio, /\ssrc=/);
  assert.match(suttaNoScript, /<audio controls preload="none" src=\{original\.url\}/);
  assert.match(collectionNoScript, /<audio controls preload="none" src=\{original\?\.url \?\? first\.url\}/);
});
