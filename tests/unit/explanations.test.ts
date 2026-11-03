import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { closeSync, mkdirSync, mkdtempSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test, { type TestContext } from 'node:test';
import {
  AUDIENCES, EXPLANATION_SCORE_KEYS, auditExplanations, emptyExplanationMetadata,
  explanationContentHash, explanationPaths, explanationScore, explanationStatus,
  validateExplanationReview, type Audience, type ExplanationContent,
  type ExplanationMetadata, type ExplanationReview, type ExplanationScores,
} from '../../src/lib/canon/explanations';

const HASH = (bytes: string) => createHash('sha256').update(bytes).digest('hex');
const BLOB = (bytes: string) => createHash('sha1').update(`blob ${Buffer.byteLength(bytes)}\0`).update(bytes).digest('hex');
const encode = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
const scores = (value = 9): ExplanationScores => Object.fromEntries(EXPLANATION_SCORE_KEYS.map(key => [key, value])) as ExplanationScores;
const rationale = () => Object.fromEntries(EXPLANATION_SCORE_KEYS.map(key => [key, `Synthetic fixture evidence for criterion ${key}.`])) as ExplanationReview['rationale'];

/** Deliberately tiny synthetic source maps test contracts; these are not scripture reviews. */
function fixture(t: TestContext) {
  const root = mkdtempSync(path.join(tmpdir(), 'kinh-explanations-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const write = (relative: string, value: unknown) => {
    const file = path.join(root, relative);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, typeof value === 'string' ? value : encode(value));
  };
  const paliPath = '.cache/upstream/suttacentral/root/pli/ms/sutta/mn/mn61_root-pli-ms.json';
  const viPath = 'content/translation/vi/project/sutta/mn/mn61_translation-vi-project.json';
  const pali = encode({ 'mn61:0.1': 'Synthetic title', 'mn61:1.1': 'Synthetic context', 'mn61:2.1': 'Synthetic first branch', 'mn61:2.2': 'Synthetic second branch' });
  const vi = encode({ 'mn61:0.1': 'Đề kiểm thử', 'mn61:1.1': 'Bối cảnh kiểm thử', 'mn61:2.1': 'Nhánh thứ nhất', 'mn61:2.2': 'Nhánh thứ hai' });
  const lock = { commit: 'a'.repeat(40), referenceEditions: [{ role: 'english', path: 'translation/en/sujato', language: 'en', translator: 'sujato' }], legacyHtml: { path: 'html_text/vi/pli/sutta' } };
  const manifest = { commit: lock.commit, editions: [{ path: 'root/pli/ms', files: { 'sutta/mn/mn61_root-pli-ms.json': BLOB(pali) } }] };
  write(paliPath, pali); write(viPath, vi);
  write('source/suttacentral.lock.json', lock);
  write('source/upstream-manifest.json', manifest);
  write('source/tooling.yaml', 'assistance:\n  - id: gpt-6-astra-pro\n    name: Fixture reviewer\n    vendor: Test fixture\n    release: null\n');
  write('content/catalog/sutta/mn.json', { texts: [{ uid: 'mn61' }] });
  write('content/catalog/sutta/dn.json', { texts: [{ uid: 'dn31' }] });
  const content: ExplanationContent = {
    schemaVersion: 1, uid: 'mn61',
    sourceDependencies: [
      { role: 'pali', path: paliPath, sha256: HASH(pali), commit: lock.commit },
      { role: 'vietnamese-project', path: viPath, sha256: HASH(vi) },
    ],
    meaningUnits: [
      { id: 'context', title: 'Bối cảnh', summary: 'Bối cảnh của mẫu kiểm thử.', segments: ['mn61:0.1', 'mn61:1.1'] },
      { id: 'branches', title: 'Các nhánh', summary: 'Giữ cả hai nhánh của mẫu.', segments: ['mn61:2.1', 'mn61:2.2'] },
    ],
    audiences: Object.fromEntries(AUDIENCES.map(audience => [audience, {
      title: `Mẫu ${audience}`, authors: ['gpt-6-astra-pro'], sections: [
        { id: 'context', kind: 'teaching', paragraphs: [`Bối cảnh dành cho ${audience}.`], meaningUnits: ['context'] },
        { id: 'branches', kind: 'teaching', paragraphs: [`Hai nhánh dành cho ${audience}.`], meaningUnits: ['branches'] },
        { id: 'example', kind: 'example', heading: 'Ví dụ hiện đại', paragraphs: ['Đây là ví dụ kiểm thử do người biên soạn đặt ra.'], meaningUnits: ['branches'] },
      ],
    }])) as ExplanationContent['audiences'],
  };
  const files = explanationPaths('mn', 'mn61', { root });
  const saveContent = () => write(path.relative(root, files.content), content);
  const saveMeta = (meta: ExplanationMetadata) => write(path.relative(root, files.metadata), meta);
  const review = (audience: Audience, value = 9): ExplanationReview => ({
    id: `fixture-${audience}`, audience, reviewedAt: '2026-10-18', reviewers: ['gpt-6-astra-pro'],
    scores: scores(value), rationale: rationale(), blockingErrors: [], notes: 'Synthetic review used only to exercise validation.',
    contentHash: explanationContentHash(content, audience),
    sourceHashes: content.sourceDependencies.map(({ path: sourcePath, sha256 }) => ({ path: sourcePath, sha256 })),
  });
  const publish = () => {
    const meta = emptyExplanationMetadata('mn61');
    meta.reviews = AUDIENCES.map(audience => review(audience));
    for (const entry of meta.reviews) meta.audiences[entry.audience] = { status: 'published', selectedReviewId: entry.id };
    saveMeta(meta); return meta;
  };
  saveContent();
  return { root, write, content, files, lock, manifest, paliPath, viPath, pali, vi, review, publish, saveContent, saveMeta,
    audit: () => auditExplanations('mn', 'mn61', { root })! };
}

test('unreviewed content has no invented grade and is not exposed as published prose', t => {
  const f = fixture(t); const audit = f.audit();
  assert.deepEqual(audit.errors, []);
  assert.equal(audit.bundle.complete, false); assert.equal(audit.bundle.minimumScore, null);
  for (const audience of AUDIENCES) {
    assert.equal(audit.bundle.audiences[audience].status, 'draft');
    assert.equal(audit.bundle.audiences[audience].score, null);
    assert.equal(audit.bundle.audiences[audience].content, undefined);
  }
});

test('three current selected reviews publish independently and aggregate by minimum', t => {
  const f = fixture(t); const meta = f.publish();
  meta.reviews[1].scores = scores(9.2); meta.reviews[2].scores = scores(9.4); f.saveMeta(meta);
  const audit = f.audit(); assert.deepEqual(audit.errors, []);
  assert.equal(audit.bundle.complete, true); assert.equal(audit.bundle.minimumScore, 9);
  for (const audience of AUDIENCES) {
    assert.ok(audit.bundle.audiences[audience].content);
    assert.deepEqual(audit.bundle.audiences[audience].reviewers, ['Fixture reviewer · Test fixture']);
  }
});

test('a missing audience is pending, never counted as a complete sutta', t => {
  const f = fixture(t); const meta = f.publish();
  delete f.content.audiences.adults; meta.audiences.adults = { status: 'draft' }; f.saveContent(); f.saveMeta(meta);
  const audit = f.audit(); assert.deepEqual(audit.errors, []);
  assert.equal(audit.bundle.audiences.adults.status, 'not-started');
  assert.equal(audit.bundle.audiences.children.status, 'published');
  assert.equal(audit.bundle.complete, false); assert.equal(audit.bundle.minimumScore, null);
});

test('editing one audience invalidates only that audience and hides its old score', t => {
  const f = fixture(t); f.publish();
  f.content.audiences.children!.sections[0].paragraphs[0] += ' Nội dung đã sửa.'; f.saveContent();
  const audit = f.audit();
  assert.equal(audit.bundle.audiences.children.status, 'stale');
  assert.equal(audit.bundle.audiences.children.content, undefined);
  assert.equal(audit.bundle.audiences.children.score, null);
  assert.equal(audit.bundle.audiences.adults.status, 'published');
  assert.equal(audit.bundle.audiences['older-adults'].status, 'published');
  assert.match(audit.errors.join('\n'), /published state lacks/);
});

test('meaning-map changes invalidate every dependent audience', t => {
  const f = fixture(t); f.publish(); f.content.meaningUnits[1].summary += ' Thêm giới hạn.'; f.saveContent();
  const audit = f.audit();
  assert.ok(AUDIENCES.every(audience => audit.bundle.audiences[audience].status === 'stale'));
});

test('unrelated repository edits and identical-byte upstream repins preserve reviews', t => {
  const f = fixture(t); f.publish();
  f.write('docs/unrelated.md', 'Unrelated documentation.');
  f.lock.commit = 'b'.repeat(40); f.manifest.commit = f.lock.commit;
  f.content.sourceDependencies[0].commit = f.lock.commit;
  f.write('source/suttacentral.lock.json', f.lock); f.write('source/upstream-manifest.json', f.manifest); f.saveContent();
  const audit = f.audit(); assert.deepEqual(audit.errors, []); assert.equal(audit.bundle.complete, true);
});

test('metadata publication selection does not self-invalidate the content fingerprint', t => {
  const f = fixture(t); const before = explanationContentHash(f.content, 'children');
  const meta = f.publish(); meta.reviews[0].reviewedAt = '2026-10-19'; f.saveMeta(meta);
  assert.equal(explanationContentHash(f.content, 'children'), before);
  assert.equal(f.audit().bundle.audiences.children.status, 'published');
});

test('source bytes are checked from disk rather than trusting declared fingerprints', t => {
  const f = fixture(t); f.publish(); f.write(f.viPath, `${f.vi} `);
  const audit = f.audit(); assert.match(audit.errors.join('\n'), /source bytes changed/);
  assert.ok(AUDIENCES.every(audience => audit.bundle.audiences[audience].status === 'stale'));
  assert.equal(audit.bundle.minimumScore, null);
});

test('a forged matching SHA256 cannot bless Pāli that differs from the current pinned git blob', t => {
  const f = fixture(t); const modified = f.pali.replace('Synthetic context', 'Modified synthetic context');
  f.write(f.paliPath, modified); f.content.sourceDependencies[0].sha256 = HASH(modified); f.saveContent(); f.publish();
  const audit = f.audit(); assert.match(audit.errors.join('\n'), /current pinned git blob/); assert.equal(audit.bundle.complete, false);
});

test('full actual Pāli coverage rejects an omitted segment, including title metadata', t => {
  const f = fixture(t); f.content.meaningUnits[0].segments.shift(); f.saveContent(); f.publish();
  const audit = f.audit(); assert.match(audit.errors.join('\n'), /meaning map omits.*mn61:0.1/);
  assert.ok(AUDIENCES.every(audience => !audit.bundle.audiences[audience].content));
});

test('invented segments and meaning-unit references are rejected', t => {
  const f = fixture(t);
  f.content.meaningUnits[0].segments.push('mn62:1.1');
  f.content.audiences.children!.sections[0].meaningUnits = ['invented-unit']; f.saveContent();
  const errors = f.audit().errors.join('\n'); assert.match(errors, /unknown Pāli segment mn62:1.1/); assert.match(errors, /unknown meaning unit invented-unit/);
});

test('examples alone cannot stand in for the teaching and unknown kinds are rejected', t => {
  const f = fixture(t); f.content.audiences.children!.sections[1].kind = 'example';
  f.content.audiences.adults!.sections[1].kind = 'quotation' as never; f.saveContent(); f.publish();
  const audit = f.audit(); assert.match(audit.errors.join('\n'), /teaching\/clarification omits meaning units: branches/);
  assert.match(audit.errors.join('\n'), /unknown section kind/); assert.equal(audit.bundle.complete, false);
});

test('raw mean, critical criterion floors and blockers all govern publication', () => {
  assert.equal(explanationStatus({ scores: scores(9), blockingErrors: [] }), 'published');
  const below = scores(9); below.clarity = 8.99;
  assert.equal(explanationScore(below)?.toFixed(2), '9.00');
  assert.equal(explanationStatus({ scores: below, blockingErrors: [] }), 'review');
  const weakSource = scores(10); weakSource.source_fidelity = 8.9;
  assert.ok(explanationScore(weakSource)! > 9);
  assert.equal(explanationStatus({ scores: weakSource, blockingErrors: [] }), 'review');
  assert.equal(explanationStatus({ scores: scores(10), blockingErrors: ['Known error.'] }), 'draft');
  assert.equal(explanationStatus({ scores: scores(7.9), blockingErrors: [] }), 'draft');
});

test('decimal threshold is exact despite floating-point summation', () => {
  const exact = scores(9);
  Object.assign(exact, { source_fidelity: 9.2, semantic_fidelity: 9.1, core_coverage: 9.2, logic_context: 9.2, terminology: 8.9, audience_fit: 8.3, clarity: 8.7, editorial_separation: 9.1, practical_integrity: 9.2, technical_integrity: 9.1 });
  assert.ok(explanationScore(exact)! < 9, 'fixture reproduces binary undershoot');
  assert.equal(explanationStatus({ scores: exact, blockingErrors: [] }), 'published');
  exact.clarity = 8.699999999999998;
  assert.equal(explanationStatus({ scores: exact, blockingErrors: [] }), 'review');
  const eight = scores(8); eight.clarity = 7.999999999999999;
  assert.equal(explanationStatus({ scores: eight, blockingErrors: [] }), 'draft');
});

test('incomplete, nonfinite and out-of-range scores cannot receive a grade', () => {
  for (const value of [Number.NaN, Number.POSITIVE_INFINITY, -1, 10.1]) {
    const invalid = scores(); invalid.clarity = value; assert.equal(explanationScore(invalid), null);
  }
  const missing = scores(); delete (missing as Partial<ExplanationScores>).clarity; assert.equal(explanationScore(missing), null);
  assert.equal(explanationScore({ ...scores(), invented: 10 } as ExplanationScores), null);
});

test('each criterion needs specific evidence and reviewers must use registry identities', t => {
  const f = fixture(t); const review = f.review('children');
  review.rationale = Object.fromEntries(EXPLANATION_SCORE_KEYS.map(key => [key, 'Looks good.'])) as ExplanationReview['rationale'];
  review.reviewers = ['unregistered-model'];
  const errors = validateExplanationReview(review, new Set(['gpt-6-astra-pro'])).join('\n');
  assert.match(errors, /rationales must not repeat/); assert.match(errors, /registered tooling IDs/);
});

test('unknown authors, mislabeled audiences and another audience review do not publish', t => {
  const f = fixture(t); const meta = f.publish();
  f.content.audiences.children!.authors = ['unknown-author'];
  (f.content.audiences as Record<string, unknown>).kids = f.content.audiences.children;
  meta.audiences.adults!.selectedReviewId = 'fixture-children'; f.saveContent(); f.saveMeta(meta);
  const audit = f.audit(); assert.match(audit.errors.join('\n'), /authors must be registered/);
  assert.match(audit.errors.join('\n'), /unknown audience key/); assert.match(audit.errors.join('\n'), /belongs to another audience/);
  assert.equal(audit.bundle.complete, false);
});

test('a published label without a review or without audience prose is rejected', t => {
  const f = fixture(t); const meta = emptyExplanationMetadata('mn61');
  meta.audiences.children = { status: 'published' }; meta.audiences.adults = { status: 'published' };
  delete f.content.audiences.adults; f.saveContent(); f.saveMeta(meta);
  const audit = f.audit(); assert.match(audit.errors.join('\n'), /published state lacks/);
  assert.match(audit.errors.join('\n'), /absent audience cannot be published/); assert.equal(audit.bundle.audiences.children.score, null);
});

test('unsafe or unrelated source paths are rejected without reading them', t => {
  const f = fixture(t); f.content.sourceDependencies[0].path = '../../etc/passwd';
  f.content.sourceDependencies[1].path = 'content/translation/vi/project/sutta/mn/mn62_translation-vi-project.json'; f.saveContent();
  const errors = f.audit().errors.join('\n'); assert.match(errors, /invalid source dependency path/); assert.match(errors, /not the current source for this sutta/);
});

test('a tampered review source fingerprint is stale even if its prose fingerprint matches', t => {
  const f = fixture(t); const meta = f.publish(); meta.reviews[0].sourceHashes[0].sha256 = 'f'.repeat(64); f.saveMeta(meta);
  assert.equal(f.audit().bundle.audiences.children.status, 'stale');
});

test('the completion score stays absent until all three reviews are publishable', t => {
  const f = fixture(t); const meta = f.publish();
  meta.reviews[0].scores.source_fidelity = 8.9;
  meta.audiences.children!.status = 'review'; f.saveMeta(meta);
  const audit = f.audit(); assert.deepEqual(audit.errors, []);
  assert.ok(AUDIENCES.every(audience => audit.bundle.audiences[audience].score !== null));
  assert.equal(audit.bundle.complete, false); assert.equal(audit.bundle.minimumScore, null);
});

test('same-sutta project notes and editorial decisions are real hash-bound dependencies', t => {
  const f = fixture(t);
  for (const [sourcePath, bytes] of [
    ['content/comment/vi/project/sutta/mn/mn61_comment-vi-project.json', encode({ 'mn61:1.1': 'Synthetic note.' })],
    ['docs/editorial-council-2026-10.md', 'Synthetic editorial decision.'],
  ]) {
    f.write(sourcePath, bytes); f.content.sourceDependencies.push({ role: 'reference', path: sourcePath, sha256: HASH(bytes) });
  }
  f.saveContent(); f.publish(); assert.deepEqual(f.audit().errors, []);
  f.write('docs/editorial-council-2026-10.md', 'Changed synthetic decision.');
  assert.match(f.audit().errors.join('\n'), /source bytes changed: docs\/editorial/);
});

test('pinned commentary outside the main manifest needs an exact supplemental git blob', t => {
  const f = fixture(t);
  const relative = 'comment/en/sujato/sutta/mn/mn61_comment-en-sujato.json';
  const sourcePath = `.cache/upstream/suttacentral/${relative}`;
  const bytes = encode({ 'mn61:1.1': 'Synthetic commentary reference.' });
  f.write(sourcePath, bytes); f.content.sourceDependencies.push({ role: 'reference', path: sourcePath, sha256: HASH(bytes), commit: f.lock.commit });
  f.saveContent(); f.publish(); assert.match(f.audit().errors.join('\n'), /current pinned git blob/);
  const manifest = { schemaVersion: 1, commit: f.lock.commit, files: { [relative]: BLOB(bytes) } };
  f.write('source/explanation-references.json', manifest); assert.deepEqual(f.audit().errors, []);
  manifest.commit = 'b'.repeat(40); f.write('source/explanation-references.json', manifest);
  assert.match(f.audit().errors.join('\n'), /reference manifest does not match/);
});

test('CLI records only supplied reviews, requires explicit selection, and refuses stale apply', t => {
  const f = fixture(t);
  const script = path.resolve('scripts/explanations.ts');
  // The CLI is an ordinary subprocess, not another worker in node:test's output protocol.
  const environment = { ...process.env };
  delete environment.NODE_TEST_CONTEXT;
  const run = (...args: string[]) => {
    // File descriptors also work in execution environments that restrict child-process pipes.
    const outputPath = path.join(f.root, 'cli-stdout.txt');
    const errorPath = path.join(f.root, 'cli-stderr.txt');
    const output = openSync(outputPath, 'w'); const error = openSync(errorPath, 'w');
    try {
      const result = spawnSync(process.execPath, ['--import', import.meta.resolve('tsx'), script, ...args], { cwd: f.root, env: environment, stdio: ['ignore', output, error] });
      assert.equal(result.error, undefined, result.error?.message);
      return { ...result, stdout: readFileSync(outputPath, 'utf8'), stderr: readFileSync(errorPath, 'utf8') };
    } finally { closeSync(output); closeSync(error); }
  };
  const review = f.review('children'); f.write('review-input.json', review);
  const recorded = run('--record', 'mn61', 'children', 'review-input.json'); assert.equal(recorded.status, 0, recorded.stderr);
  let meta = JSON.parse(readFileSync(f.files.metadata, 'utf8')) as ExplanationMetadata;
  assert.equal(meta.reviews.length, 1); assert.equal(meta.audiences.children?.status, 'draft'); assert.equal(meta.audiences.children?.selectedReviewId, undefined);
  const applied = run('--apply', 'mn61', 'children', meta.reviews[0].id); assert.equal(applied.status, 0, applied.stderr);
  meta = JSON.parse(readFileSync(f.files.metadata, 'utf8')) as ExplanationMetadata;
  assert.equal(meta.audiences.children?.status, 'published'); assert.equal(f.audit().bundle.complete, false);
  const report = run('--report'); assert.equal(report.status, 0, report.stderr);
  assert.ok(report.stdout.trim(), `Report produced no JSON: ${report.stderr}`);
  const data = JSON.parse(report.stdout); assert.equal(data.scope.suttas, 2); assert.equal(data.counts.published, 1); assert.equal(data.completeSuttas, 0);
  f.content.audiences.children!.sections[0].paragraphs[0] += ' Đã thay đổi.'; f.saveContent();
  const stale = run('--apply', 'mn61', 'children', meta.reviews[0].id); assert.notEqual(stale.status, 0); assert.match(stale.stderr, /Review is stale/);
});
