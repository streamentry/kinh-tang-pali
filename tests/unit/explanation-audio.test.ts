import test from 'node:test';
import assert from 'node:assert/strict';
import { explanationNarrationSource, allDNExplanationNarrationSources, allMNExplanationNarrationSources, EXPLANATION_EDITORIAL_NOTE } from '../../src/lib/canon/explanation-audio';
import { loadExplanations } from '../../src/lib/canon/explanations';

test('MN explanation audio source uses only the current selected published audience prose', () => {
  const source = explanationNarrationSource('mn1', 'children');
  const bundle = loadExplanations('mn', 'mn1');
  const view = bundle?.audiences.children;
  assert.equal(source.policy, 'explanation-audience-v1');
  assert.equal(source.summary, '');
  assert.equal(source.audience, 'children');
  assert.equal(source.selected_review_id, view?.reviewId);
  assert.equal(source.review_date, view?.reviewedAt);
  assert.match(source.source_sha256, /^[0-9a-f]{64}$/);
  assert.ok(source.segments.some(([, text]) => text === EXPLANATION_EDITORIAL_NOTE));
  assert.ok(source.segments.some(([, text]) => text === view?.content?.title));
  for (const section of view!.content!.sections) {
    for (const paragraph of section.paragraphs) assert.ok(source.segments.some(([, text]) => text === paragraph));
  }
  const spoken = source.segments.map(([, text]) => text).join('\n');
  assert.ok(!spoken.includes(source.selected_review_id));
  assert.ok(!spoken.includes(source.review_date));
  assert.ok(!('scores' in source));
  assert.ok(!('reviewers' in source));
  assert.throws(() => explanationNarrationSource('mn0', 'children'));
  assert.throws(() => explanationNarrationSource('mn153', 'children'));
});

test('explanation audio preflight source covers every MN and audience without provider calls', () => {
  const sources = allMNExplanationNarrationSources();
  assert.equal(sources.length, 456);
  assert.equal(new Set(sources.map((source) => `${source.uid}/${source.audience}`)).size, 456);
  assert.ok(sources.every((source) => source.policy === 'explanation-audience-v1' && /^[0-9a-f]{64}$/.test(source.source_sha256)));
});

test('DN explanation audio source uses the current selected published audience prose', () => {
  const source = explanationNarrationSource('dn1', 'children', 'dn');
  const bundle = loadExplanations('dn', 'dn1');
  const view = bundle?.audiences.children;
  assert.equal(source.collection, 'dn');
  assert.equal(source.uid, 'dn1');
  assert.equal(source.selected_review_id, view?.reviewId);
  assert.equal(source.review_date, view?.reviewedAt);
  assert.ok(source.segments.some(([, text]) => text === view?.content?.title));
  assert.throws(() => explanationNarrationSource('dn0', 'children', 'dn'));
  assert.throws(() => explanationNarrationSource('dn35', 'children', 'dn'));
});

test('DN explanation audio preflight covers all 34 suttas and three audiences without provider calls', () => {
  const sources = allDNExplanationNarrationSources();
  assert.equal(sources.length, 102);
  assert.equal(new Set(sources.map((source) => `${source.uid}/${source.audience}`)).size, 102);
  assert.ok(sources.every((source) => source.collection === 'dn' && source.policy === 'explanation-audience-v1'));
  assert.ok(sources.every((source) => /^[0-9a-f]{64}$/.test(source.source_sha256) && source.selected_review_id));
});
