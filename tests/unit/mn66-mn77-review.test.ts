import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (uid: string, layer = 'translation'): Record<string, string> => JSON.parse(readFileSync(
  `content/${layer}/vi/project/sutta/mn/${uid}_${layer}-vi-project.json`, 'utf8',
));

// These are regression fixtures, not an automated semantic certification.
test('MN66 restores the quail, calm idiom and the acquisition-root claim at its own segment', () => {
  const v = read('mn66');
  assert.match(v['mn66:0.2'], /Chim Cút/);
  assert.match(v['mn66:9.4'], /bình thản/);
  assert.doesNotMatch(v['mn66:9.4'], /tóc rụng/);
  assert.match(v['mn66:17.1'], /gốc rễ của khổ/);
  assert.match(v['mn66:17.2'], /giải thoát/);
  assert.match(v['mn66:12.8'], /tuy bị ràng buộc, vẫn có thể từ bỏ/);
  assert.match(read('mn66', 'comment')['mn66:7.4'], /Sujato/);
});

test('MN77 retains seven awakening factors, their qualifiers and the ten kasinas', () => {
  const v = read('mn77');
  assert.match(v['mn77:20.1'], /bảy giác chi/);
  for (let i = 2; i <= 8; i++) {
    assert.match(v[`mn77:20.${i}`], /viễn ly/);
    assert.match(v[`mn77:20.${i}`], /ly tham/);
    assert.match(v[`mn77:20.${i}`], /buông xả/);
  }
  assert.match(v['mn77:24.1'], /mười biến xứ/);
  assert.match(v['mn77:24.11'], /biến xứ thức/);
  assert.match(v['mn77:23.5'], /vô lượng/);
  assert.match(v['mn77:23.8'], /Không có tưởng về sắc/);
});

test('MN77 full source passages are not replaced with editorial ellipses', () => {
  const v = read('mn77');
  for (const id of ['8.6', '9.3', '25.5', '26.2', '28.1', '29.10', '30.11', '31.1', '31.5', '32.3', '34.1', '35.1', '36.2', '36.3']) {
    assert.doesNotMatch(v[`mn77:${id}`], /…|\.{3}/, id);
  }
  assert.match(v['mn77:34.1'], /một trăm nghìn đời/);
  assert.match(v['mn77:34.1'], /thức ăn/);
  assert.match(v['mn77:35.1'], /tà kiến/);
  assert.match(v['mn77:35.1'], /chánh kiến/);
  assert.match(v['mn77:36.3'], /tuệ giải thoát/);
});

test('MN77 keeps the instrument, snake skin and source-specific similes', () => {
  const v = read('mn77');
  assert.match(v['mn77:6.60'], /dùng đầu gối/);
  assert.match(v['mn77:6.62'], /hắt hơi/);
  assert.match(v['mn77:30.8'], /da lột/);
  assert.doesNotMatch(v['mn77:30.8'], /giỏ/);
  assert.match(v['mn77:32.2'], /tù và/);
  assert.match(v['mn77:35.2'], /hai ngôi nhà/);
  assert.doesNotMatch(v['mn77:6.33'], /phá hoại Pháp/);
});
