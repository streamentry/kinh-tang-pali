import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { assessmentIsCurrent, contentDigest, loadAssessmentHistory, rubricFor, validateAssessmentHistory, type Assessment, type AssessmentHistory } from '../../src/lib/canon/quality';
import { loadLock } from '../../src/lib/canon/load';

function full(target: 'translation' | 'summary' = 'translation'): Assessment {
  return { id: 'test-review', target, scope: 'full', assessed_at: '2026-10-05', assessed_by: ['test'], notes: 'Review evidence.', scores: Object.fromEntries(rubricFor(target).map(([key]) => [key, 9.2])), final_score: 9.2, blocking_errors: [], content_sha256: contentDigest('mn', 'mn1', target), source_commit: loadLock().commit };
}
function history(...assessments: Assessment[]): AssessmentHistory { return { schemaVersion: 1, uid: 'mn1', assessments }; }
test('history permits multiple reviews on the same day with distinct ids', () => {
  const first = full();
  assert.deepEqual(validateAssessmentHistory(history(first, { ...first, id: 'second' }), 'mn', 'mn1'), []);
  assert.ok(validateAssessmentHistory(history(first, first), 'mn', 'mn1').some(x => x.includes('duplicate')));
});
test('raw mean, valid dates, notes and assessors are required', () => {
  for (const patch of [{ final_score: 9.21 }, { assessed_at: '2026-02-30' }, { notes: '' }, { assessed_by: [] }, { scores: { ...full().scores, invented: 10 } }]) {
    assert.ok(validateAssessmentHistory(history({ ...full(), ...patch }), 'mn', 'mn1').length);
  }
});
test('technical audit cannot claim semantic scores or overall mean', () => {
  const entry = { ...full(), scope: 'technical' as const, final_score: null, scores: Object.fromEntries(rubricFor('translation').map(([key]) => [key, key === 'segment_alignment' ? 10 : null])) };
  assert.deepEqual(validateAssessmentHistory(history(entry), 'mn', 'mn1'), []);
  assert.ok(validateAssessmentHistory(history({ ...entry, scores: { ...entry.scores, semantic_fidelity: 10 } }), 'mn', 'mn1').length);
  assert.ok(validateAssessmentHistory(history({ ...entry, final_score: 10 }), 'mn', 'mn1').length);
});
test('source or content changes invalidate an assessment without deleting history', () => {
  const entry = full();
  assert.equal(assessmentIsCurrent('mn', 'mn1', entry), true);
  assert.equal(assessmentIsCurrent('mn', 'mn1', { ...entry, content_sha256: '0'.repeat(64) }), false);
  assert.equal(assessmentIsCurrent('mn', 'mn1', { ...entry, source_commit: '0'.repeat(40) }), false);
  assert.notEqual(contentDigest('mn', 'mn1', 'summary'), contentDigest('mn', 'mn1', 'translation'));
});
test('summary rubric is separate and forbidden for other collections', () => {
  assert.equal(rubricFor('summary').length, 10);
  assert.notDeepEqual(rubricFor('summary'), rubricFor('translation'));
  assert.ok(validateAssessmentHistory({ schemaVersion: 1, uid: 'sn1.1', assessments: [full('summary')] }, 'sn', 'sn1.1').some(x => x.includes('DN/MN')));
});
test('reader gates summary section and preserves historical quality display', () => {
  const reader = readFileSync('src/pages/sutta/[collection]/[uid].astro', 'utf8');
  assert.ok(reader.includes("['mn', 'dn'].includes(collection.code)"));
  assert.ok(reader.includes('target="summary"'));
  assert.ok(reader.includes('legacy={legacyScores}'));
  assert.ok(reader.includes('target="translation"'));
});

// Run the real CLI in a small isolated fixture, never against the shared translations.
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
test('record CLI appends, preserves previous entries and leaves legacy metadata intact', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'pali-assessment-'));
  const script = path.resolve('scripts/assess-quality.ts');
  const tsx = path.resolve('node_modules/tsx/dist/loader.mjs');
  try {
    for (const section of ['content/catalog/sutta', 'content/meta/sutta/mn', 'content/translation/vi/project/sutta/mn', 'source']) mkdirSync(path.join(dir, section), { recursive: true });
    for (const code of ['dn','mn','sn','an','kn']) writeFileSync(path.join(dir, `content/catalog/sutta/${code}.json`), JSON.stringify({ collection: code, texts: code === 'mn' ? [{ uid: 'mn1', order: 1 }] : [] }));
    writeFileSync(path.join(dir, 'source/suttacentral.lock.json'), JSON.stringify({ commit: loadLock().commit }));
    writeFileSync(path.join(dir, 'content/translation/vi/project/sutta/mn/mn1_translation-vi-project.json'), '{"mn1:1.1":"Tôi nghe như vầy."}');
    const legacy = { scores: full().scores, final_score: 9.2, blocking_errors: [], assessed_at: '2026-09-11', assessed_by: ['previous reviewer'] };
    const meta = 'uid: mn1\nstatus: published\nsummary: Bản tóm tắt thử.\nquality: ' + JSON.stringify(legacy) + '\n';
    writeFileSync(path.join(dir, 'content/meta/sutta/mn/mn1.yaml'), meta);
    const input = path.join(dir, 'input.json');
    writeFileSync(input, JSON.stringify(full()));
    const run = (args: string[]) => spawnSync(process.execPath, ['--import', tsx, script, ...args], { cwd: dir, encoding: 'utf8' });
    assert.equal(run(['--record', 'mn1', input]).status, 0);
    const file = path.join(dir, 'content/meta/assessments/mn/mn1.json');
    const before = JSON.parse(readFileSync(file, 'utf8'));
    assert.equal(run(['--record', 'mn1', input]).status, 0);
    const after = JSON.parse(readFileSync(file, 'utf8'));
    assert.equal(after.assessments.length, 2);
    assert.deepEqual(after.legacy_quality, legacy);
    assert.deepEqual(after.assessments[0], before.assessments[0]);
    assert.notEqual(after.assessments[0].id, after.assessments[1].id);
    assert.equal(readFileSync(path.join(dir, 'content/meta/sutta/mn/mn1.yaml'), 'utf8'), meta);
    const stable = readFileSync(file, 'utf8');
    writeFileSync(input, JSON.stringify({ ...full(), notes: '' }));
    assert.notEqual(run(['--record', 'mn1', input]).status, 0);
    assert.equal(readFileSync(file, 'utf8'), stable);
    assert.equal(run(['--check']).status, 0);
    // An official metadata update must not erase the first archived scorecard.
    writeFileSync(path.join(dir, 'content/meta/sutta/mn/mn1.yaml'), meta.replace('previous reviewer', 'new reviewer'));
    writeFileSync(input, JSON.stringify(full()));
    assert.equal(run(['--record', 'mn1', input]).status, 0);
    assert.deepEqual(JSON.parse(readFileSync(file, 'utf8')).legacy_quality, legacy);
    // A failed release gate always produces draft, while preserving prior assessors.
    const blocked = { ...full(), blocking_errors: ['Required tests fail'], scores: { ...full().scores, technical_integrity: 2 } };
    writeFileSync(input, JSON.stringify(blocked));
    assert.equal(run(['--record', 'mn1', input]).status, 0);
    const selected = JSON.parse(readFileSync(file, 'utf8')).assessments.at(-1);
    assert.equal(run(['--apply', 'mn1', selected.id]).status, 0);
    const applied = readFileSync(path.join(dir, 'content/meta/sutta/mn/mn1.yaml'), 'utf8');
    assert.ok(applied.includes('status: draft'));
    assert.ok(applied.includes('assessment_id: ' + selected.id));
    assert.ok(applied.includes('new reviewer'));
    assert.equal(run(['--check']).status, 0);
    const translationFile = path.join(dir, 'content/translation/vi/project/sutta/mn/mn1_translation-vi-project.json');
    writeFileSync(translationFile, '{"mn1:1.1":"Nội dung đã thay đổi."}');
    assert.notEqual(run(['--apply', 'mn1', selected.id]).status, 0);
    assert.equal(readFileSync(path.join(dir, 'content/meta/sutta/mn/mn1.yaml'), 'utf8'), applied);
    assert.notEqual(run(['--check']).status, 0);

  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('content review remains pending and cannot pretend to pass the release gate', () => {
  const entry = { ...full(), scope: 'content' as const, final_score: null, scores: { ...full().scores, technical_integrity: null } };
  assert.deepEqual(validateAssessmentHistory(history(entry), 'mn', 'mn1'), []);
  assert.ok(validateAssessmentHistory(history({ ...entry, final_score: 9.2 }), 'mn', 'mn1').length);
  assert.ok(validateAssessmentHistory(history({ ...entry, scores: { ...entry.scores, technical_integrity: 10 } }), 'mn', 'mn1').length);
  assert.ok(validateAssessmentHistory(history({ ...entry, scores: { ...entry.scores, semantic_fidelity: null } }), 'mn', 'mn1').length);
});
