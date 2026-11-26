/**
 * Continuous reading and group statistics.
 *
 * The budget is a contract: a reading part never exceeds it, every text of a group lands in
 * exactly one part in the group's order, and a text too long to copy is linked instead of
 * duplicated. Segment counts must be what the reader actually renders, including AN bundles and
 * range UIDs, and group statistics count distinct reader URLs once however deep they sit.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';
import { CONTINUOUS_READING_BUDGET, planReadingParts, readingPartPath } from '../../src/lib/canon/reading-budget';
import { adjacentReadingGroups, groupReadingPlan, groupStats, paliSegmentCount, readingGroups } from '../../src/lib/canon/group-reading';
import { childGroups, groupTexts, isLeafGroup, loadNavigation } from '../../src/lib/canon/groups';
import { composeDocument } from '../../src/lib/canon/document';

test('parts keep order, hold every text once, respect the budget and link oversized texts', () => {
  const items = [
    { uid: 'a', segments: 300 }, { uid: 'b', segments: 400 }, { uid: 'c', segments: 200 },
    { uid: 'd', segments: 5000 }, { uid: 'e', segments: 10 },
  ];
  const parts = planReadingParts(items);
  assert.deepEqual(parts.flat().map((entry) => entry.uid), ['a', 'b', 'c', 'd', 'e']);
  assert.deepEqual(parts.map((part) => part.map((entry) => entry.uid)), [['a', 'b'], ['c', 'd', 'e']]);
  assert.equal(parts[1][1].type, 'link');
  for (const part of parts) {
    assert.ok(part.length > 0);
    assert.ok(part.length <= CONTINUOUS_READING_BUDGET.maxTextsPerPart);
    assert.ok(part.reduce((sum, entry) => sum + (entry.type === 'text' ? entry.segments : 0), 0) <= CONTINUOUS_READING_BUDGET.maxSegmentsPerPart);
  }
  assert.deepEqual(planReadingParts([]), []);
  const many = Array.from({ length: 65 }, (_, index) => ({ uid: `t${index}`, segments: 1 }));
  assert.deepEqual(planReadingParts(many).map((part) => part.length), [30, 30, 5]);
});

test('part paths keep the plain URL for part one', () => {
  assert.equal(readingPartPath('sutta/sn/nhom/sn12-aharavagga/', 0), 'sutta/sn/nhom/sn12-aharavagga/doc/');
  assert.equal(readingPartPath('sutta/sn/nhom/sn12-aharavagga/', 2), 'sutta/sn/nhom/sn12-aharavagga/doc/3/');
});

const synced = existsSync('.cache/upstream/suttacentral/root/pli/ms/sutta/an/an1/an1.1-10_root-pli-ms.json');

test('segment counts are what the reader renders, for plain, bundled and ranged UIDs', { skip: !synced && 'pinned Pāli not synced' }, () => {
  for (const [code, uid] of [['sn', 'sn12.15'], ['an', 'an1.5'], ['an', 'an1.296-305'], ['an', 'an5.308-1152'], ['kn', 'dhp1-20'], ['kn', 'thig10.1']] as const) {
    assert.equal(paliSegmentCount(code, uid), composeDocument(code, uid).segments.length, uid);
  }
});

test('every reading group covers its texts exactly once, in order, within budget', { skip: !synced && 'pinned Pāli not synced' }, () => {
  for (const code of ['sn', 'an', 'kn'] as const) {
    const groups = readingGroups(code);
    assert.ok(groups.length > 0);
    for (const node of groups) {
      const plan = groupReadingPlan(code, node.id)!;
      assert.deepEqual(plan.flat().map((entry) => entry.uid), groupTexts(code, node.id), node.id);
      for (const part of plan) {
        const segments = part.reduce((sum, entry) => sum + (entry.type === 'text' ? entry.segments : 0), 0);
        assert.ok(segments <= CONTINUOUS_READING_BUDGET.maxSegmentsPerPart, `${node.id}: ${segments}`);
        assert.ok(part.length <= CONTINUOUS_READING_BUDGET.maxTextsPerPart, node.id);
      }
    }
    // A group with sub-groups is never read as one page.
    for (const node of Object.values(loadNavigation(code).nodes)) {
      if (!isLeafGroup(node)) assert.equal(groupReadingPlan(code, node.id), null, node.id);
    }
  }
  assert.deepEqual(groupReadingPlan('sn', 'sn12-aharavagga')!.map((part) => part.map((entry) => entry.uid)), [Array.from({ length: 10 }, (_, i) => `sn12.${i + 11}`)]);
  assert.deepEqual(groupReadingPlan('kn', 'snp-atthakavagga')!.flat().map((entry) => entry.uid), Array.from({ length: 16 }, (_, i) => `snp4.${i + 1}`));
  // Mahāniddesa is far above the budget: it is split, and its longest texts are linked.
  const mnd = groupReadingPlan('kn', 'mnd')!;
  assert.ok(mnd.length > 1);
  assert.ok(mnd.flat().some((entry) => entry.type === 'link'));
});

test('reading groups chain across parents in tree order with clear edges', { skip: !synced && 'pinned Pāli not synced' }, () => {
  const groups = readingGroups('sn');
  assert.equal(adjacentReadingGroups('sn', groups[0].id).previous, undefined);
  assert.equal(adjacentReadingGroups('sn', groups[groups.length - 1].id).next, undefined);
  // Last vagga of SN11 leads to the first of SN12, across the thiên boundary.
  const sn11Last = groups.filter((node) => node.id.startsWith('sn11-')).pop()!;
  assert.equal(adjacentReadingGroups('sn', sn11Last.id).next?.id.startsWith('sn12-'), true);
});

test('group statistics count distinct reader URLs once', () => {
  for (const code of ['sn', 'an', 'kn'] as const) {
    const nav = loadNavigation(code);
    const top = childGroups(code, nav.rootId);
    assert.equal(top.reduce((sum, node) => sum + groupStats(code, node.id).texts, 0), nav.counts.texts, code);
    const stats = groupStats(code, top[0].id);
    assert.equal(Object.values(stats.byStatus).reduce((sum, count) => sum + count, 0), stats.texts);
  }
});
