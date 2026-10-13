/**
 * Xưng hô trong lời quy y (quyết định của người biên tập, 2026-10-13).
 *
 * Người quy y tự xưng **"đệ tử"** ("chúng đệ tử" khi nhiều người): trong bài Tam Quy (kp1),
 * và trong công thức văn xuôi `esāhaṁ … saraṇaṁ gacchāmi` / `upāsakaṁ maṁ … dhāretu` khi thưa
 * với Đức Phật hay một vị tỳ-kheo. Trước đó kho có 41 đoạn "tôi", 10 đoạn "chúng tôi" và hơn
 * một trăm đoạn "con" cho cùng một công thức.
 *
 * Ngoại lệ có chủ ý: khi lời quy y được nói với người ngang hàng thì giữ cách xưng của cuộc
 * thoại đó. `mn85:61.15–16` là Vương tử Bodhi kể với bạn mình là Sañjikāputta. Các bài kệ
 * Vv/Pv mà người hay ngạ quỷ quy y khi đang nói với một vị trời (`pv17:19.4` "ngài là thầy của
 * tôi") cũng vậy; mẫu bên dưới chỉ bắt công thức văn xuôi nên không chạm vào chúng.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const ROOT = 'content/translation/vi/project/sutta';

function* translations(): Generator<[string, string]> {
  for (const collection of readdirSync(ROOT)) {
    for (const file of readdirSync(join(ROOT, collection))) {
      if (!file.endsWith('.json')) continue;
      const segments: Record<string, string> = JSON.parse(readFileSync(join(ROOT, collection, file), 'utf8'));
      yield* Object.entries(segments);
    }
  }
}

function translation(uid: string): Record<string, string> {
  // Khuddaka texts (kp, dhp, …) live under `kn/`, so find the file rather than derive the folder.
  const file = `${uid}_translation-vi-project.json`;
  const collection = readdirSync(ROOT).find(dir => readdirSync(join(ROOT, dir)).includes(file));
  assert.ok(collection, `${file} not found under ${ROOT}`);
  return JSON.parse(readFileSync(join(ROOT, collection, file), 'utf8'));
}

const PEER_REFUGE = new Set(['mn85:61.15', 'mn85:61.16']);

const PROSE_REFUGE_PRONOUN = new RegExp(
  String.raw`(?<!\p{L})(tôi|con|chúng tôi|chúng con)\s+(xin|đi|bạch)\s+(quy y|quy ngưỡng|nương tựa)`
  + String.raw`|(?<!\p{L})(ghi nhận|nhận|nhớ(?: đến)?|ghi nhớ)\s+(tôi|con|chúng tôi|chúng con)\s+(là|làm)\s+`
  + String.raw`(?:(?:một|các|những|người)\s+)*(?:(?:nam|nữ)\s+)?(cư sĩ|đệ tử cư sĩ|Phật tử)`,
  'iu',
);

test('kp1 Tam Quy: the reciter calls themself "đệ tử" in all nine refuges', () => {
  const kp1 = translation('kp1');
  for (const round of ['2', '3', '4']) {
    for (const line of ['1', '2', '3']) {
      const text = kp1[`kp1:${round}.${line}`];
      assert.match(text, /(?<!\p{L})[Đđ]ệ tử quy y (Phật|Pháp|Tăng)/u, `kp1:${round}.${line}`);
      assert.doesNotMatch(text, /(?<!\p{L})(tôi|con)(?!\p{L})/iu, `kp1:${round}.${line}`);
    }
  }
});

test('prose refuge formula never has the declarant say "tôi" or "con"', () => {
  const offenders: string[] = [];
  for (const [id, text] of translations()) {
    if (!PEER_REFUGE.has(id) && PROSE_REFUGE_PRONOUN.test(text)) offenders.push(`${id}: ${text}`);
  }
  assert.deepEqual(offenders, []);
});

test('the peer-refuge exception is still where it is documented', () => {
  const mn85 = translation('mn85');
  assert.match(mn85['mn85:61.15'], /Sañjikāputta/);
  assert.match(mn85['mn85:61.16'], /ghi nhận tôi/);
});

test('lay people and devas addressing a monk say "con", not "tôi", in passages fixed with this rule', () => {
  const cases: Record<string, string[]> = {
    'an8.21': ['an8.21:3.3', 'an8.21:5.1', 'an8.21:10.1'],
    'an9.41': ['an9.41:3.1', 'an9.41:3.3'],
    'sn55.27': ['sn55.27:3.3', 'sn55.27:12.1'],
    'mn146': ['mn146:5.5'],
    'vv30': ['vv30:4.2', 'vv30:4.3', 'vv30:11.1'],
    'pv6': ['pv6:2.1'],
    // Verse addressed to the Buddha (vocative mahāvīra/mahāmune in the Pāli).
    'thi-ap28': ['thi-ap28:8.1', 'thi-ap28:13.4', 'thi-ap28:27.1'],
    'thi-ap32': ['thi-ap32:15.1', 'thi-ap32:38.2'],
    'mn91': ['mn91:29.9'],
  };
  for (const [uid, ids] of Object.entries(cases)) {
    const text = translation(uid);
    for (const id of ids) {
      assert.match(text[id], /(?<!\p{L})[Cc]on(?!\p{L})/u, id);
      assert.doesNotMatch(text[id].replace(/‘[^’]*’/gu, ''), /(?<!\p{L})tôi(?!\p{L})/iu, id);
    }
  }
  // Quoted words of someone else keep their own pronoun.
  assert.match(translation('an8.21')['an8.21:9.6'], /đến gặp tôi/);
});

test('the Buddha refers to himself as "Ta", not "tôi", in passages fixed with this rule', () => {
  const cases: Record<string, string[]> = {
    'sn17.23': ['sn17.23:1.5', 'sn17.23:1.8'],
    'sn17.24': ['sn17.24:1.5', 'sn17.24:1.8'],
    'sn42.7': ['sn42.7:2.1', 'sn42.7:2.2', 'sn42.7:2.4', 'sn42.7:4.1', 'sn42.7:4.2', 'sn42.7:4.4'],
    'sn42.9': ['sn42.9:4.5', 'sn42.9:4.10'],
  };
  for (const [uid, ids] of Object.entries(cases)) {
    const text = translation(uid);
    for (const id of ids) {
      assert.match(text[id], /(?<!\p{L})Ta(?!\p{L})/u, id);
      assert.doesNotMatch(text[id], /(?<!\p{L})tôi(?!\p{L})/iu, id);
    }
  }
});
