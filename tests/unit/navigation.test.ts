/**
 * Contract of the traditional navigation tree (SN / AN / KN middle layer).
 *
 * Two halves. The fixture tests feed small hand-made trees to the pure builder and assert that
 * every failure the goal names is caught: a changed source byte, a missing leaf, a UID outside the
 * catalogue, a wrong sourcePath, two parents, a cycle, a duplicate id, an overlapping bundle, a
 * name without provenance, a truncated API listing, a missing cache. The corpus tests read the
 * generated files and the pinned caches, and pin the cases that are easy to get wrong: AN bundle
 * order, ranges that stay one URL, the Dhammapada chapters, `thig10.1`, paṇṇāsaka boundaries.
 *
 * The independent re-derivation (no shared code) is `scripts/verify-navigation.py`, run in CI.
 */
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  buildNavigation,
  checkNavigation,
  kindForPaliName,
  NavigationError,
  resolveLeaf,
  type BuildInput,
} from '../../scripts/lib/navigation-build';
import { buildAll, normalizeSiteName, readLocked, serialize } from '../../scripts/navigation';
import {
  assertCompleteTreeListing,
  gitBlobHash,
  loadNavigationLock,
  NAVIGATION_CACHE_DIR,
  sha256,
} from '../../src/lib/canon/navigation-source';
import type { NavigationCollection } from '../../src/lib/canon/navigation-types';
import {
  groupNode,
  groupPath,
  groupTexts,
  groupTitle,
  hasNavigation,
  homeGroupId,
  levelLabel,
  loadNavigation,
  navigationNeighbours,
  textPath,
} from '../../src/lib/canon/groups';
import { loadCatalog } from '../../src/lib/canon/load';

// ---------------------------------------------------------------- fixtures

const ref = (key: string) => ({ path: 'sc-data:fixture.json', key });

function fixture(overrides: Partial<BuildInput> = {}): BuildInput {
  const pali = new Map(['x', 'x1', 'x2'].map((id) => [id, { text: `${id}vagga`, from: ref(id) }]));
  return {
    collection: 'sn',
    repo: 'fixture',
    commit: '0'.repeat(40),
    rootId: 'x',
    trees: [{ path: 'x-tree.json', parentId: null, tree: { x: [{ x1: ['x1.1', 'x1.2'] }, { x2: ['x2.1-3'] }] } }],
    catalog: [
      { uid: 'x1.1', order: 1, sourcePath: 'root/pli/ms/sutta/x/x1.1_root-pli-ms.json' },
      { uid: 'x1.2', order: 2, sourcePath: 'root/pli/ms/sutta/x/x1.2_root-pli-ms.json' },
      // Catalogue order deliberately disagrees with the file: x2.3 before x2.2.
      { uid: 'x2.1', order: 3, sourcePath: 'root/pli/ms/sutta/x/x2.1-3_root-pli-ms.json' },
      { uid: 'x2.3', order: 4, sourcePath: 'root/pli/ms/sutta/x/x2.1-3_root-pli-ms.json' },
      { uid: 'x2.2', order: 5, sourcePath: 'root/pli/ms/sutta/x/x2.1-3_root-pli-ms.json' },
    ],
    segmentKeys: (key) => key === 'x2.1-3' ? ['x2.1:0.1', 'x2.1:1.1', 'x2.2:1.1', 'x2.3:1.1', 'x2.3:1.2'] : [],
    names: {
      pali,
      site: new Map(),
      reference: new Map([['x1', { text: 'Phẩm Một', from: { path: 'names.yaml', key: 'x1' }, author: 'Tác giả' }]]),
      heading: () => null,
    },
    ...overrides,
  };
}

const problemsOf = (input: BuildInput): string[] => {
  try {
    buildNavigation(input);
    return [];
  } catch (error) {
    assert.ok(error instanceof NavigationError, String(error));
    return error.problems;
  }
};

test('builds membership from the tree and bundle order from the Pāli file, not from UID strings or catalogue order', () => {
  const nav = buildNavigation(fixture());
  assert.deepEqual(nav.order, ['x1.1', 'x1.2', 'x2.1', 'x2.2', 'x2.3']);
  assert.deepEqual(nav.nodes.x2.children, [
    { type: 'text', uid: 'x2.1', sourceKey: 'x2.1-3' },
    { type: 'text', uid: 'x2.2', sourceKey: 'x2.1-3' },
    { type: 'text', uid: 'x2.3', sourceKey: 'x2.1-3' },
  ]);
  assert.equal(nav.counts.bundles, 1);
  assert.equal(nav.counts.textsInBundles, 3);
  assert.equal(nav.counts.sourceFiles, 3);
  assert.equal(nav.nodes.x1.name.vi?.text, 'Phẩm Một');
  assert.equal(nav.nodes.x2.name.viMissing, true, 'no verified Vietnamese name is marked missing, never invented');
  assert.deepEqual(checkNavigation(nav, fixture().catalog), []);
});

test('a catalogue text whose source file is not a leaf of the tree is reported', () => {
  const input = fixture();
  input.catalog = [...input.catalog, { uid: 'x9.1', order: 9, sourcePath: 'root/pli/ms/sutta/x/x9.1_root-pli-ms.json' }];
  assert.ok(problemsOf(input).some((problem) => problem.includes('x9.1') && problem.includes('not a leaf')));
});

test('a tree leaf no catalogue URL reads is reported (missing leaf / UID not in catalogue)', () => {
  const input = fixture({ trees: [{ path: 'x-tree.json', parentId: null, tree: { x: [{ x1: ['x1.1', 'x1.2', 'x1.3'] }, { x2: ['x2.1-3'] }] } }] });
  assert.ok(problemsOf(input).some((problem) => problem.includes('leaf x1.3')));
});

test('a wrong sourcePath is reported', () => {
  const input = fixture();
  input.catalog = input.catalog.map((text) => text.uid === 'x1.2' ? { ...text, sourcePath: 'root/pli/ms/sutta/x/x1.1_root-pli-ms.json' } : text);
  const problems = problemsOf(input);
  assert.ok(problems.some((problem) => problem.includes('leaf x1.1')), problems.join('\n'));
  input.catalog = input.catalog.map((text) => text.uid === 'x1.2' ? { ...text, sourcePath: 'not-a-pali-path.json' } : text);
  assert.ok(problemsOf(input).some((problem) => problem.includes('unexpected sourcePath')));
});

test('a group listed twice (two parents / duplicate id) is reported', () => {
  const input = fixture({ trees: [{ path: 'x-tree.json', parentId: null, tree: { x: [{ x1: ['x1.1', { x2: ['x1.2'] }] }, { x2: ['x2.1-3'] }] } }] });
  assert.ok(problemsOf(input).some((problem) => problem.includes('group x2 appears twice')));
});

test('checkNavigation catches a cycle, a second parent, a missing child and a duplicate text', () => {
  const good = buildNavigation(fixture());
  const clone = (): NavigationCollection => JSON.parse(JSON.stringify(good));

  const cyclic = clone();
  cyclic.nodes.x1.parentId = 'x2';
  cyclic.nodes.x2.parentId = 'x1';
  assert.ok(checkNavigation(cyclic, fixture().catalog).some((problem) => /cycle|reach the root|parentId/.test(problem)));

  const twoParents = clone();
  twoParents.nodes.x1.children.push({ type: 'group', id: 'x2' });
  assert.ok(checkNavigation(twoParents, fixture().catalog).some((problem) => problem.includes('x2: listed as a child by 2 groups')));

  const dangling = clone();
  dangling.nodes.x2.children.push({ type: 'group', id: 'x7' });
  assert.ok(checkNavigation(dangling, fixture().catalog).some((problem) => problem.includes('child group x7 does not exist')));

  const duplicate = clone();
  duplicate.nodes.x1.children.push({ type: 'text', uid: 'x2.2', sourceKey: 'x2.1-3' });
  assert.ok(checkNavigation(duplicate, fixture().catalog).some((problem) => problem.startsWith('x2.2: in 2 groups')));

  const foreign = clone();
  foreign.nodes.x1.children.push({ type: 'text', uid: 'zz9', sourceKey: 'zz9' });
  assert.ok(checkNavigation(foreign, fixture().catalog).some((problem) => problem.includes('zz9: in the tree but not in the catalogue')));
});

test('a Vietnamese or Pāli name without provenance is reported', () => {
  const nav: NavigationCollection = JSON.parse(JSON.stringify(buildNavigation(fixture())));
  nav.nodes.x1.name.vi = { text: 'Phẩm Một', origin: 'reference-toc', from: { path: '', key: '' } };
  assert.ok(checkNavigation(nav, fixture().catalog).some((problem) => problem.includes('x1: Vietnamese name without provenance')));
  nav.nodes.x2.name.pali = null;
  assert.ok(checkNavigation(nav, fixture().catalog).some((problem) => problem.includes('x2: Pāli name without provenance')));
  const missing = fixture();
  missing.names = { ...missing.names, pali: new Map() };
  assert.ok(problemsOf(missing).some((problem) => problem.includes('no Pāli name')));
});

test('bundle resolution refuses overlapping, unowned and orphan segments', () => {
  const members = [
    { uid: 'an9.1', order: 1, sourcePath: 'p/an9.1-3_root-pli-ms.json' },
    { uid: 'an9.1-2', order: 2, sourcePath: 'p/an9.1-3_root-pli-ms.json' },
  ];
  assert.ok(resolveLeaf('an9.1-3', members, ['an9.1:1.1']).problems.some((problem) => problem.includes('belongs to an9.1 and an9.1-2')));
  const disjoint = [members[0], { uid: 'an9.2', order: 2, sourcePath: 'p/an9.1-3_root-pli-ms.json' }];
  assert.ok(resolveLeaf('an9.1-3', disjoint, ['an9.1:1.1', 'an9.3:1.1']).problems.some((problem) => problem.includes('an9.3:1.1 belongs to no URL')));
  assert.ok(resolveLeaf('an9.1-3', disjoint, ['an9.1:1.1']).problems.some((problem) => problem.includes('an9.2 owns no segment')));
  assert.ok(resolveLeaf('an9.1-3', disjoint, []).problems.some((problem) => problem.includes('cache missing')));
  // A range member owns the composite sub-range inside the bundle (the an1.296-305 shape).
  assert.deepEqual(resolveLeaf('an9.1-5', [
    { uid: 'an9.1', order: 1, sourcePath: 'p/an9.1-5_root-pli-ms.json' },
    { uid: 'an9.2-5', order: 2, sourcePath: 'p/an9.1-5_root-pli-ms.json' },
  ], ['an9.1:1.1', 'an9.2-5:1.1']), { uids: ['an9.1', 'an9.2-5'], problems: [] });
});

test('a truncated tree listing is refused', () => {
  assert.throws(() => assertCompleteTreeListing({ sha: 'x', truncated: true, tree: [] }, 'structure/'), /truncated/);
  assert.doesNotThrow(() => assertCompleteTreeListing({ sha: 'x', truncated: false, tree: [] }, 'structure/'));
});

test('a cached source with one changed byte, or no cache at all, is refused', () => {
  const lock = loadNavigationLock();
  const entry = lock.files.find((file) => file.path === 'structure/tree/sutta/kp-tree.json')!;
  const dir = mkdtempSync(path.join(tmpdir(), 'nav-cache-'));
  try {
    assert.throws(() => readLocked(lock, entry.path, dir), /navigation:sync/);
    const source = path.join(NAVIGATION_CACHE_DIR, entry.path);
    const bytes = existsSync(source) ? readFileSync(source) : Buffer.from('{"kp":["kp1"]}');
    const tampered = Buffer.from(bytes);
    tampered[tampered.length - 2] = tampered[tampered.length - 2] === 0x5d ? 0x7d : 0x5d;
    mkdirSync(path.dirname(path.join(dir, entry.path)), { recursive: true });
    writeFileSync(path.join(dir, entry.path), tampered);
    assert.throws(() => readLocked(lock, entry.path, dir), /differ from the lock/);
    if (existsSync(source)) {
      writeFileSync(path.join(dir, entry.path), bytes);
      assert.deepEqual(readLocked(lock, entry.path, dir), JSON.parse(bytes.toString('utf8')));
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the lock records blob and SHA-256 that match each other for every file', () => {
  for (const file of loadNavigationLock().files) {
    const full = path.join(NAVIGATION_CACHE_DIR, file.path);
    if (!existsSync(full)) continue;
    const bytes = readFileSync(full);
    assert.equal(gitBlobHash(bytes), file.gitBlob, file.path);
    assert.equal(sha256(bytes), file.sha256, file.path);
  }
});

test('level of a group is read from its Pāli name, with an honest fallback', () => {
  assert.equal(kindForPaliName('Nidānavaggasaṁyutta'), 'division');
  assert.equal(kindForPaliName('Nidānasaṁyutta'), 'samyutta');
  assert.equal(kindForPaliName('Tikanipāta'), 'nipata');
  assert.equal(kindForPaliName('Dutiyapaṇṇāsaka'), 'pannasaka');
  assert.equal(kindForPaliName('Mūlapaṇṇāsa'), 'pannasaka');
  assert.equal(kindForPaliName('Āhāravagga'), 'vagga');
  assert.equal(kindForPaliName('Gaṅgāpeyyālavagga'), 'vagga');
  assert.equal(kindForPaliName('Peyyāla'), 'peyyala');
  assert.equal(kindForPaliName('Dānapāramī'), 'section');
  assert.equal(kindForPaliName(null), 'section');
});

test('SuttaCentral site names are normalised typographically and say so', () => {
  assert.deepEqual(normalizeSiteName('Kinh Pháp Cú (Pali)'), { text: 'Kinh Pháp Cú', normalized: ['bỏ hậu tố "(Pali)"'] });
  assert.deepEqual(normalizeSiteName('Ðại nghĩa tích'), { text: 'Đại nghĩa tích', normalized: ['Ð (U+00D0) → Đ (U+0110)'] });
  assert.deepEqual(normalizeSiteName('kinh Mi Tiên vấn đáp'), { text: 'Kinh Mi Tiên vấn đáp', normalized: ['viết hoa chữ đầu'] });
  assert.deepEqual(normalizeSiteName('Kinh tập'), { text: 'Kinh tập', normalized: [] });
});

// ---------------------------------------------------------------- corpus

const cachesReady = existsSync(path.join(NAVIGATION_CACHE_DIR, 'structure/tree/sutta/an-tree.json'))
  && existsSync('.cache/upstream/suttacentral/root/pli/ms/sutta/an/an1/an1.1-10_root-pli-ms.json');

test('generated navigation equals a fresh build from the pinned caches (no drift, deterministic)', { skip: !cachesReady && 'pinned caches not synced (npm run navigation:sync, npm run source:sync:manifest)' }, () => {
  const fresh = buildAll();
  for (const code of ['sn', 'an', 'kn'] as const) {
    assert.equal(serialize(fresh[code]), readFileSync(`content/navigation/traditional/${code}.json`, 'utf8'), code);
    assert.deepEqual(checkNavigation(fresh[code], loadCatalog(code).texts), []);
  }
});

test('every SN/AN/KN catalogue URL has exactly one traditional path; DN and MN have none', () => {
  for (const code of ['sn', 'an', 'kn'] as const) {
    const nav = loadNavigation(code);
    const uids = loadCatalog(code).texts.map((text) => text.uid);
    assert.equal(nav.order.length, uids.length, code);
    assert.equal(new Set(nav.order).size, uids.length, code);
    assert.deepEqual([...nav.order].sort(), [...uids].sort(), code);
    for (const uid of uids) assert.ok(homeGroupId(code, uid), `${uid} has a home`);
  }
  assert.equal(hasNavigation('dn'), false);
  assert.equal(hasNavigation('mn'), false);
  assert.deepEqual(textPath('mn', 'mn1'), []);
});

test('published counts reproduce the research baseline and are stated in the right unit', () => {
  const counts = Object.fromEntries((['sn', 'an', 'kn'] as const).map((code) => [code, loadNavigation(code).counts]));
  assert.deepEqual(
    Object.fromEntries(Object.entries(counts).map(([code, c]) => [code, [c.texts, c.sourceFiles, c.groups, c.bundles, c.textsInBundles]])),
    { sn: [1819, 1819, 300, 0, 0], an: [1781, 1408, 229, 38, 411], kn: [2351, 2351, 325, 0, 0] },
  );
});

test('SN12: Thiên Nhân Duyên → Tương Ưng Nhân Duyên → Āhāravagga holds SN12.11–20 and SN12.15', () => {
  assert.deepEqual(textPath('sn', 'sn12.15').map((node) => node.id), ['sn', 'sn-nidanavaggasamyutta', 'sn12', 'sn12-aharavagga']);
  assert.deepEqual(groupTexts('sn', 'sn12-aharavagga'), Array.from({ length: 10 }, (_, i) => `sn12.${i + 11}`));
  assert.equal(groupTitle(groupNode('sn', 'sn-nidanavaggasamyutta')!).primary, 'Thiên Nhân Duyên');
  assert.equal(groupTitle(groupNode('sn', 'sn12')!).primary, 'Tương Ưng Nhân Duyên');
  // The project heading has a known typo; it is refused and recorded, so the Pāli name shows.
  const ahara = groupNode('sn', 'sn12-aharavagga')!;
  assert.equal(groupTitle(ahara).primary, 'Phẩm Āhāravagga');
  assert.equal(ahara.name.viRejected?.[0].reason, 'excluded');
  // Ranges that are one URL stay one URL.
  assert.equal(homeGroupId('sn', 'sn12.93-213') !== undefined, true);
});

test('AN3: paṇṇāsaka tier, Mahāvagga AN3.61–70, and the second fifty is not cut at 100', () => {
  assert.deepEqual(textPath('an', 'an3.65').map((node) => node.id), ['an', 'an3', 'an3-dutiyapannasaka', 'an3-mahavagga']);
  assert.deepEqual(groupTexts('an', 'an3-mahavagga'), Array.from({ length: 10 }, (_, i) => `an3.${i + 61}`));
  const second = groupNode('an', 'an3-dutiyapannasaka')!;
  assert.equal(second.kind, 'pannasaka');
  assert.equal(second.firstUid, 'an3.51');
  assert.equal(second.lastUid, 'an3.102');
  assert.equal(second.textCount, 52);
  assert.equal(levelLabel(second), 'Nhóm năm mươi');
  assert.equal(groupTitle(groupNode('an', 'an3')!).primary, 'Chương Ba Pháp');
});

test('AN bundles: an1.1-10 resolves to an1.1 … an1.10 in Pāli order; ranges stay single URLs', () => {
  const vagga = groupNode('an', 'an1-cittapariyadanavagga')!;
  assert.deepEqual(vagga.children.map((child) => child.type === 'text' && child.uid), Array.from({ length: 10 }, (_, i) => `an1.${i + 1}`));
  assert.ok(vagga.children.every((child) => child.type === 'text' && child.sourceKey === 'an1.1-10'));
  for (const uid of ['an1.296-305', 'an5.308-1152']) assert.ok(homeGroupId('an', uid), uid);
});

test('AN traversal follows the source, not the historical catalogue order (an2.1 → an2.10 → an2.100)', () => {
  const order = loadNavigation('an').order.filter((uid) => uid.startsWith('an2.'));
  const first = (uid: string) => Number(uid.slice(4).split('-')[0]);
  for (let i = 1; i < order.length; i += 1) assert.ok(first(order[i]) > first(order[i - 1]), `${order[i - 1]} → ${order[i]}`);
  const historical = loadCatalog('an').texts.filter((text) => text.uid.startsWith('an2.')).sort((a, b) => a.order - b.order).map((text) => text.uid);
  assert.notDeepEqual(historical, order, 'the catalogue order is left as it was, not rewritten');
});

test('Suttanipāta Aṭṭhakavagga holds SNP4.1–16 in order', () => {
  assert.deepEqual(textPath('kn', 'snp4.1').map((node) => node.id), ['kn', 'snp', 'snp-atthakavagga']);
  assert.deepEqual(groupTexts('kn', 'snp-atthakavagga'), Array.from({ length: 16 }, (_, i) => `snp4.${i + 1}`));
});

test('KN regressions: thig10.1 is in the eleven-verse chapter; Dhammapada keeps 26 chapter leaves; Khuddakapāṭha has no vagga', () => {
  assert.equal(homeGroupId('kn', 'thig10.1'), 'thig-ekadasanipata');
  assert.equal(groupNode('kn', 'thig-ekadasanipata')!.name.pali?.text, 'Ekādasakanipāta');
  const dhp = groupNode('kn', 'dhp')!;
  assert.equal(dhp.children.length, 26);
  assert.ok(dhp.children.every((child) => child.type === 'text'));
  assert.equal(dhp.children[0].type === 'text' && dhp.children[0].uid, 'dhp1-20');
  assert.ok(groupNode('kn', 'kp')!.children.every((child) => child.type === 'text'));
  assert.equal(loadNavigation('kn').nodes.kn.children.length, 20, 'twenty work nodes, as the super-tree lists them');
  assert.equal(groupTitle(groupNode('kn', 'dhp')!).primary, 'Kinh Pháp Cú');
});

test('single-text groups, peyyāla tiers and long UIDs resolve', () => {
  const singles = (['sn', 'an', 'kn'] as const).flatMap((code) => Object.values(loadNavigation(code).nodes).filter((node) => node.textCount === 1));
  assert.ok(singles.length > 0, 'the corpus has single-text groups');
  for (const node of singles) assert.equal(groupTexts(node.collection, node.id).length, 1);
  assert.ok(Object.values(loadNavigation('an').nodes).some((node) => node.kind === 'peyyala'));
  const longest = (['sn', 'an', 'kn'] as const).flatMap((code) => loadNavigation(code).order.map((uid) => [code, uid] as const))
    .sort((a, b) => b[1].length - a[1].length)[0];
  assert.ok(textPath(longest[0], longest[1]).length > 1, longest[1]);
});

test('neighbours follow traversal; a group scope stops at its edges and an unrelated scope is ignored', () => {
  assert.deepEqual(navigationNeighbours('an', 'an1.10'), { previous: 'an1.9', next: 'an1.11', scope: undefined });
  assert.deepEqual(navigationNeighbours('sn', 'sn12.11', 'sn12-aharavagga'), { previous: undefined, next: 'sn12.12', scope: 'sn12-aharavagga' });
  assert.deepEqual(navigationNeighbours('sn', 'sn12.20', 'sn12-aharavagga'), { previous: 'sn12.19', next: undefined, scope: 'sn12-aharavagga' });
  assert.equal(navigationNeighbours('sn', 'sn12.20', 'sn1-nalavagga').scope, undefined);
  const order = loadNavigation('kn').order;
  assert.equal(navigationNeighbours('kn', order[0]).previous, undefined);
  assert.equal(navigationNeighbours('kn', order[order.length - 1]).next, undefined);
});

test('breadcrumb paths start at the collection root and every group path is consistent', () => {
  for (const code of ['sn', 'an', 'kn'] as const) {
    for (const node of Object.values(loadNavigation(code).nodes)) {
      const trail = groupPath(code, node.id);
      assert.equal(trail[0].id, code);
      assert.equal(trail[trail.length - 1].id, node.id);
      assert.equal(trail.length, node.depth + 1);
    }
  }
});
