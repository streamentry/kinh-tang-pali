/**
 * The two independent checks must be able to fail.
 *
 * `scripts/verify-navigation.py` is run on corrupted copies of the generated tree; each corruption
 * must exit 1 with a message naming it, and an unmodified copy must pass. `compareReadingPart`
 * (the core of `npm run reading:check`) is run on small built-page fixtures.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { compareReadingPart, segmentsOf } from '../../scripts/check-group-reading';

const python = spawnSync('python3', ['--version']).status === 0;
const cachesReady = existsSync('.cache/upstream/sc-data-navigation/structure/tree/sutta/an-tree.json')
  && existsSync('.cache/upstream/suttacentral/root/pli/ms/sutta/an/an1/an1.1-10_root-pli-ms.json');

function runVerifier(mutate?: (nav: Record<string, any>) => void, code = 'an'): { status: number | null; output: string } {
  const dir = mkdtempSync(path.join(tmpdir(), 'nav-verify-'));
  try {
    cpSync('content/navigation/traditional', dir, { recursive: true });
    if (mutate) {
      const file = path.join(dir, `${code}.json`);
      const nav = JSON.parse(readFileSync(file, 'utf8'));
      mutate(nav);
      writeFileSync(file, JSON.stringify(nav));
    }
    const result = spawnSync('python3', ['-I', 'scripts/verify-navigation.py', '--nav-dir', dir], { encoding: 'utf8' });
    return { status: result.status, output: `${result.stdout}${result.stderr}` };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const skip = (!python && 'python3 not available') || (!cachesReady && 'pinned caches not synced');

test('the Python verifier passes an unmodified copy', { skip }, () => {
  const result = runVerifier();
  assert.equal(result.status, 0, result.output);
});

test('the Python verifier fails on each corruption and names it', { skip }, () => {
  const cases: Array<[string, (nav: Record<string, any>) => void, RegExp, string?]> = [
    ['bundle order', (nav) => { const c = nav.nodes['an1-cittapariyadanavagga'].children; [c[0], c[1]] = [c[1], c[0]]; }, /an1-cittapariyadanavagga: children differ/],
    ['moved text', (nav) => { nav.nodes['an3-brahmanavagga'].children.push(nav.nodes['an3-mahavagga'].children.pop()); }, /children differ/],
    ['depth', (nav) => { nav.nodes['an3-mahavagga'].depth = 9; }, /an3-mahavagga: depth\/textCount/],
    ['textCount', (nav) => { nav.nodes.an3.textCount += 1; }, /an3: depth\/textCount/],
    ['counts', (nav) => { nav.counts.groups += 1; }, /counts .* differ/],
    ['forged name', (nav) => { nav.nodes['an3-mahavagga'].name.vi.text = 'Phẩm Sai'; }, /Vietnamese name 'Phẩm Sai'/],
    ['heading cited at the wrong segment', (nav) => { nav.nodes['an3-mahavagga'].name.vi.from.key = 'an3.61:0.3'; }, /cited heading an3\.61:0\.3 is not the Pāli name|Vietnamese name/],
    ['dropped reference name', (nav) => { nav.nodes.an3.name.vi = null; nav.nodes.an3.name.viMissing = true; }, /an3: the reference table of contents names this group/],
  ];
  for (const [label, mutate, expected] of cases) {
    const result = runVerifier(mutate);
    assert.equal(result.status, 1, `${label} should fail`);
    assert.match(result.output, expected, label);
  }
  const dropped = runVerifier((nav) => { nav.nodes.dhp.name.vi = null; nav.nodes.dhp.name.viMissing = true; }, 'kn');
  assert.equal(dropped.status, 1);
  assert.match(dropped.output, /dhp: SuttaCentral has a Vietnamese name/);
});

const article = (id: string, text: string, href = `#${id}`) =>
  `<article class="segment role-prose" id="${id}" data-segment-id="${id}"><div class="segment-id"><a href="${href}">${id}</a></div><div class="cell">${text}</div></article>`;
const pageHtml = (body: string, head = '<meta name="robots" content="noindex,follow">') => `<html><head>${head}</head><body>${body}</body></html>`;

test('reading-part comparison accepts an exact part and rejects every kind of drift', () => {
  const own = segmentsOf(article('x1.1:1.1', 'một') + article('x1.1:1.2', 'hai') + article('x1.2:1.1', 'ba'));
  const good = pageHtml(article('x1.1:1.1', 'một', '/p/x1.1/#x1.1:1.1') + article('x1.1:1.2', 'hai', '/p/x1.1/#x1.1:1.2') + article('x1.2:1.1', 'ba', '/p/x1.2/#x1.2:1.1'));
  assert.deepEqual(compareReadingPart('ok', good, own), []);
  const cases: Array<[string, string, RegExp]> = [
    ['missing segment', pageHtml(article('x1.1:1.1', 'một') + article('x1.2:1.1', 'ba')), /2 segments, expected 3/],
    ['altered text', pageHtml(article('x1.1:1.1', 'một') + article('x1.1:1.2', 'hai!') + article('x1.2:1.1', 'ba')), /segment 1 \(x1\.1:1\.2\) differs/],
    ['reordered', pageHtml(article('x1.1:1.2', 'hai') + article('x1.1:1.1', 'một') + article('x1.2:1.1', 'ba')), /segment 0/],
    ['duplicate id', pageHtml(article('x1.1:1.1', 'một') + article('x1.1:1.1', 'một') + article('x1.2:1.1', 'ba')), /duplicate id/],
    ['indexed', pageHtml(`<div data-pagefind-body>${article('x1.1:1.1', 'một') + article('x1.1:1.2', 'hai') + article('x1.2:1.1', 'ba')}</div>`), /Pagefind/],
    ['indexable', pageHtml(article('x1.1:1.1', 'một') + article('x1.1:1.2', 'hai') + article('x1.2:1.1', 'ba'), ''), /not noindex/],
  ];
  for (const [label, html, expected] of cases) {
    assert.ok(compareReadingPart(label, html, own).some((problem) => expected.test(problem)), label);
  }
  assert.ok(compareReadingPart('empty', pageHtml(''), []).some((problem) => problem.includes('expects no segment')));
});
