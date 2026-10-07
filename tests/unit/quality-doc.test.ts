import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { SUMMARY_RUBRIC, TRANSLATION_RUBRIC } from '../../src/lib/canon/quality';
import { TRANSLATION_QUALITY_KEYS } from '../../src/lib/canon/types';
import { expectedStatusForQuality } from '../../scripts/lib/quality';

/**
 * docs/quality-assessments.md is the single written authority for the QC method. AGENTS.md and
 * skill/translation.md only point at it, so if its rubric tables or thresholds drift from the
 * code that enforces them, nothing else would notice.
 */
const DOC = readFileSync('docs/quality-assessments.md', 'utf8');

function tableKeys(heading: string): string[] {
  const start = DOC.indexOf(heading);
  assert.ok(start >= 0, `missing section: ${heading}`);
  const section = DOC.slice(start + heading.length).split('\n## ')[0];
  // First backticked token of each row, optionally after a leading `| # |` column.
  return [...section.matchAll(/^\|(?:[^|`\n]*\|)?\s*`([a-z_]+)`/gm)].map((m) => m[1]);
}

test('translation rubric table lists exactly the enforced keys, in order', () => {
  const keys = TRANSLATION_RUBRIC.map(([key]) => key);
  assert.deepEqual([...TRANSLATION_QUALITY_KEYS], keys);
  assert.deepEqual(tableKeys('## 2. Rubric bản dịch'), keys);
});

test('summary rubric table lists exactly the enforced keys, in order', () => {
  assert.deepEqual(tableKeys('## 3. Rubric tóm tắt'), SUMMARY_RUBRIC.map(([key]) => key));
});

test('status thresholds in the doc match expectedStatusForQuality', () => {
  assert.match(DOC, /`final_score > 9\.0`\s*\|\s*`published`/);
  assert.match(DOC, /`8\.0 <= final_score <= 9\.0`\s*\|\s*`review`/);
  assert.match(DOC, /`final_score < 8\.0`\s*\|\s*`draft`/);
  assert.equal(expectedStatusForQuality(9.0, []), 'review');
  assert.equal(expectedStatusForQuality(9.0001, []), 'published');
  assert.equal(expectedStatusForQuality(8.0, []), 'review');
  assert.equal(expectedStatusForQuality(7.99, []), 'draft');
  assert.equal(expectedStatusForQuality(10, ['x']), 'draft');
});

test('AGENTS.md and the translation skill defer to the doc', () => {
  for (const file of ['AGENTS.md', 'skill/translation.md']) {
    assert.match(readFileSync(file, 'utf8'), /docs\/quality-assessments\.md/, `${file} must point at the QC doc`);
  }
});
