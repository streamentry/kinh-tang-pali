import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function translation(uid: string): Record<string, string> {
  const collection = uid.replace(/\d+$/, '');
  return JSON.parse(readFileSync(
    `content/translation/vi/project/sutta/${collection}/${uid}_translation-vi-project.json`, 'utf8',
  ));
}

// These fixtures guard identified editorial regressions. They do not certify whole-sutta meaning.
test('DN29 preserves the five faculties rather than substituting the five precepts', () => {
  const text = translation('dn29')['dn29:17.3'];
  assert.match(text, /(?:ngũ|năm) căn/i);
  assert.match(text, /(?:ngũ|năm) lực/i);
  assert.doesNotMatch(text, /(?:ngũ|năm) giới/i);
});

test('MN76 keeps the corpse, footprints and bones aligned to their actual segment IDs', () => {
  const text = translation('mn76');
  assert.match(text['mn76:7.4'], /cáng/);
  assert.match(text['mn76:7.5'], /dấu chân/);
  assert.match(text['mn76:7.6'], /Xương/);
  assert.match(text['mn76:11.3'], /bánh xe/);
  assert.match(text['mn76:11.4'], /bờ nam/);
  assert.match(text['mn76:11.5'], /bờ bắc/);
});

test('MN76 retains 8.4 million great eons in both occurrences of the quoted doctrine', () => {
  const text = translation('mn76');
  for (const id of ['mn76:16.11', 'mn76:17.14']) {
    assert.match(text[id], /8\.400\.000/);
    assert.doesNotMatch(text[id], /(?<![\d.])84\.000(?![\d.])/);
  }
});

test('MN76 translates the thread-ball image without residual English', () => {
  const text = translation('mn76');
  for (const id of ['mn76:16.14', 'mn76:17.16']) {
    assert.match(text[id], /cuộn chỉ/);
    assert.doesNotMatch(text[id], /unraveling|quả bột chỉ/);
  }
});

test('MN66 and MN77 corrected passages contain no non-Latin letters', () => {
  for (const uid of ['mn66', 'mn77']) {
    for (const [id, value] of Object.entries(translation(uid))) {
      assert.equal([...value].some(c => /\p{Letter}/u.test(c) && !/\p{Script=Latin}/u.test(c)), false, id);
    }
  }
});
