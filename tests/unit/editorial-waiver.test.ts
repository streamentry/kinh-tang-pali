import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import YAML from 'yaml';
import type { CollectionCode, EditorialMeta } from '../../src/lib/canon/types';
import { blockerIsCovered, eligibleWaiver, loadWaivers, waiverById } from '../../src/lib/canon/waivers';
import { expectedStatusForQuality, validateQualityAssessment } from '../../scripts/lib/quality';

const waiver = waiverById('no-upstream-english')!;

const ENGLISH_ABSENT = 'noEnglishEditionUpstream: Không có tầng tham khảo tiếng Anh tại commit đã ghim.';
const DEFECT = 'Bất định chưa phân xử được ở `5.1`; bài không có bản Anh ở commit đã ghim để quyết.';

test('the waiver is declared, dated and carries what it does not change', () => {
  assert.ok(waiver, 'no-upstream-english must be declared');
  assert.match(waiver.decidedAt, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(waiver.decidedBy.trim().length > 0);
  assert.ok(waiver.unchanged.length >= 3);
  assert.equal(new Set(loadWaivers().map((item) => item.id)).size, loadWaivers().length);
});

test('it covers the missing-English blocker and nothing that reports a defect', () => {
  assert.equal(blockerIsCovered(waiver, ENGLISH_ABSENT), true);
  assert.equal(blockerIsCovered(waiver, DEFECT), false);
  assert.equal(blockerIsCovered(waiver, 'Bốn khoá uddāna không phân xử được từ Pāli đã ghim.'), false);
});

test('a waived blocker no longer forces draft, but score and other blockers still do', () => {
  assert.equal(expectedStatusForQuality(9.2, [ENGLISH_ABSENT]), 'draft');
  assert.equal(expectedStatusForQuality(9.2, [ENGLISH_ABSENT], [ENGLISH_ABSENT]), 'published');
  assert.equal(expectedStatusForQuality(9.0, [ENGLISH_ABSENT], [ENGLISH_ABSENT]), 'review');
  assert.equal(expectedStatusForQuality(7.9, [ENGLISH_ABSENT], [ENGLISH_ABSENT]), 'draft');
  assert.equal(expectedStatusForQuality(9.5, [ENGLISH_ABSENT, DEFECT], [ENGLISH_ABSENT]), 'draft');
});

test('a text whose English edition exists upstream cannot be waived', () => {
  // dn22 is translated by Sujato, so the pinned manifest publishes it.
  assert.equal(eligibleWaiver('dn', 'dn22', [ENGLISH_ABSENT]), undefined);
});

function scores(value: number) {
  return Object.fromEntries(['source_provenance', 'semantic_fidelity', 'grammar_logic', 'segment_alignment', 'terminology',
    'triangulation', 'vietnamese_clarity', 'han_viet_balance', 'ambiguity_integrity', 'technical_integrity'].map((key) => [key, value]));
}

test('validation rejects a waiver that names a blocker the scorecard does not have, or an unknown id', () => {
  const base = { uid: 'x', status: 'published', translators: ['t'], quality: { scores: scores(9.5), final_score: 9.5, blocking_errors: [ENGLISH_ABSENT], assessed_at: '2026-10-11', assessed_by: ['a'] } } as unknown as EditorialMeta;
  const stray = { ...base, quality: { ...base.quality!, waiver: { id: 'no-upstream-english', blockers: ['something else'] } } } as EditorialMeta;
  assert.ok(validateQualityAssessment(stray).some((error) => /not in blocking_errors/.test(error)));
  const unknown = { ...base, quality: { ...base.quality!, waiver: { id: 'made-up', blockers: [ENGLISH_ABSENT] } } } as EditorialMeta;
  assert.ok(validateQualityAssessment(unknown).some((error) => /not declared/.test(error)));
  const fine = { ...base, quality: { ...base.quality!, waiver: { id: 'no-upstream-english', blockers: [ENGLISH_ABSENT] } } } as EditorialMeta;
  assert.deepEqual(validateQualityAssessment(fine), []);
  assert.ok(validateQualityAssessment(base).some((error) => /does not match quality gate/.test(error)), 'without the waiver the same card must stay draft');
});

test('every waived text in the repository still satisfies the waiver condition and the gate', () => {
  let waived = 0;
  for (const collection of ['dn', 'mn', 'sn', 'an', 'kn'] as CollectionCode[]) {
    const dir = path.join(process.cwd(), 'content/meta/sutta', collection);
    for (const name of readdirSync(dir).filter((file) => file.endsWith('.yaml'))) {
      const meta = YAML.parse(readFileSync(path.join(dir, name), 'utf8')) as EditorialMeta;
      if (!meta.quality?.waiver) continue;
      waived += 1;
      assert.deepEqual(validateQualityAssessment(meta, collection), [], `${collection}/${meta.uid}`);
      assert.notEqual(meta.status, 'draft', `${collection}/${meta.uid}: a waiver on a draft changes nothing`);
    }
  }
  assert.ok(waived >= 0);
});
