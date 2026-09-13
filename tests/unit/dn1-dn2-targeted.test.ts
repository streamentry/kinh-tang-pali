import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function scripture(uid: string): Record<string, string> {
  return JSON.parse(readFileSync(`content/translation/vi/project/sutta/dn/${uid}_translation-vi-project.json`, 'utf8'));
}
const dn1 = scripture('dn1');
const dn2 = scripture('dn2');

// These are regression guards for identified defects, not semantic certification.
test('DN1/DN2 keep their canonical segment counts, UIDs and NFC text', () => {
  for (const [uid, text, count] of [['dn1', dn1, 662], ['dn2', dn2, 650]] as const) {
    assert.equal(Object.keys(text).length, count);
    for (const [id, value] of Object.entries(text)) {
      assert.ok(id.startsWith(`${uid}:`));
      assert.equal(typeof value, 'string');
      assert.equal(value, value.normalize('NFC'));
      assert.ok(!value.includes('\uFFFD'));
    }
  }
});

test('plant propagation and bedding do not regress to fruit, hand or tiger errors', () => {
  for (const value of [dn1['dn1:1.11.2'], dn2['dn2:46.2']]) {
    assert.match(value, /đốt/);
    assert.doesNotMatch(value, /từ quả/);
  }
  for (const value of [dn1['dn1:1.15.2'], dn2['dn2:50.2']]) {
    for (const item of ['voi', 'ngựa', 'xe']) assert.ok(value.includes(item));
    assert.doesNotMatch(value, /trải tay|da cọp/);
  }
});

test('all six royal departures preserve neither accepting nor rejecting', () => {
  for (const id of ['dn2:18.7', 'dn2:21.7', 'dn2:24.7', 'dn2:27.7', 'dn2:30.7', 'dn2:33.10']) {
    assert.match(dn2[id], /[Kk]hông (chấp nhận|công nhận)/);
    assert.match(dn2[id], /không bác bỏ/);
    assert.doesNotMatch(dn2[id], /chỉ ghi nhận|vẫn giữ nguyên|không bẻ gãy/);
  }
});

test('sensual pleasures and submerged lotuses preserve the corrected distinctions', () => {
  for (const value of [dn1['dn1:3.20.2'], dn2['dn2:35.6'], dn2['dn2:37.9']]) {
    assert.match(value, /năm/);
    assert.match(value, /dục lạc/);
    assert.doesNotMatch(value, /dục công đức/);
  }
  assert.match(dn2['dn2:80.1'], /không vươn khỏi mặt nước/);
  assert.doesNotMatch(dn2['dn2:78.1'], /mưa đúng thời/);
});

test('DN2 colophon comment is attached to its source segment, not the confession', () => {
  const notes: Record<string, string> = JSON.parse(readFileSync('content/comment/vi/project/sutta/dn/dn2_comment-vi-project.json', 'utf8'));
  assert.match(notes['dn2:102.7'], /Sāmaññaphalasutta/);
  assert.ok(!notes['dn2:99.7'] || !/niṭṭhitaṃ dutiyaṃ/.test(notes['dn2:99.7']));
});
