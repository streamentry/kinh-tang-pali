/**
 * Licence and provenance declarations cannot drift apart.
 *
 * There are now four places in this repository that state what the translated text is
 * released under: the reader's credit line, the credits page, and two book manifests. They
 * were typed independently, in two different spellings — `CC0 1.0` in prose and `CC0-1.0` as
 * SPDX — which is the condition this file exists to end. If the maintainer ever changes the
 * terms, three of the four would otherwise keep claiming the old ones.
 *
 * So the licence is declared once, in the lock, and this test checks that every existing
 * declaration still agrees with it. It does not decide what the terms should be.
 *
 * It also checks the second half of "make the copyright clear": the upstream terms. The Pāli
 * root is public domain and the two reference translations are not this project's to
 * relicense, and NOTICE has to say so in those words — the failure this guards against is a
 * CC0 dedication that reads as though it covered Sujato's English.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import YAML from 'yaml';
import { loadLock, projectContentLicense } from '../../src/lib/canon/load';
import { generateNotice } from '../../scripts/generate-notice';
import { PROJECT_TRANSLATION_CREDIT } from '../../src/lib/canon/document';
import { externalReferences } from '../../src/lib/canon/external';

/** SPDX is `CC0-1.0`; the hyphen is an identifier convention, not the licence's name. */
const humanise = (spdx: string): string => spdx.replace(/-(\d)/, ' $1');

const lock = loadLock();
const notice = readFileSync('NOTICE', 'utf8');

/** Book manifests, which declare the licence of the artefacts they produce. */
function bookManifests(): Array<{ file: string; data: Record<string, unknown> }> {
  return readdirSync('books')
    .filter((name) => name.endsWith('.yaml'))
    .map((name) => ({
      file: `books/${name}`,
      data: YAML.parse(readFileSync(`books/${name}`, 'utf8')) as Record<string, unknown>,
    }));
}

test('NOTICE is exactly what the lock generates', () => {
  // The generated text is compared, not re-implemented, so a change to the generator is
  // visible as a change to this assertion rather than silently accepted.
  assert.equal(
    notice,
    generateNotice(),
    'NOTICE is stale. Run: npm run license:generate',
  );
});

test('every pinned edition is named in NOTICE with its upstream path', () => {
  // A reference layer that exists in the store but is absent from the notice is material
  // the site displays without a stated origin — the specific thing SuttaCentral asks about.
  for (const edition of lock.referenceEditions) {
    assert.ok(
      notice.includes(edition.path),
      `${edition.translator} (${edition.path}) is pinned but NOTICE does not mention its path`,
    );
  }
});

test('NOTICE records who states each edition\'s terms', () => {
  // A copyright claim with no source is an assertion. Every edition has to point at the
  // upstream statement that supports it.
  for (const edition of lock.referenceEditions) {
    assert.ok(
      edition.license.statementFrom,
      `${edition.translator}: no statementFrom — the terms are untraceable`,
    );
    assert.ok(
      notice.includes(edition.license.statementFrom),
      `${edition.translator}: NOTICE does not cite ${edition.license.statementFrom}`,
    );
  }
});

test('NOTICE does not let the CC0 dedication swallow the reference translations', () => {
  // The precise risk: a public-domain dedication on our own work, sitting next to two
  // third-party translations, in a document a reader may take at face value. Both reference
  // translations must be marked as not covered, and by name.
  for (const edition of lock.referenceEditions) {
    if (edition.license.group !== 'third-party') continue;
    const block = notice.slice(notice.indexOf(edition.path));
    assert.ok(
      block.includes('NOT covered by this project'),
      `${edition.translator}: NOTICE does not exclude it from our CC0 dedication`,
    );
    assert.ok(
      block.includes(edition.license.holder),
      `${edition.translator}: NOTICE does not name ${edition.license.holder} as the holder`,
    );
  }
});

test('NOTICE says the Pāli root is the only authority, and why that matters legally', () => {
  assert.match(notice, /Pāli/i);
  assert.match(notice, /public domain/i);
  // The decision rule, not just the fact. With five layers the rule is the load-bearing part.
  assert.match(notice, /Pāli decides/i);
});

test('an unasserted licence stays unasserted', () => {
  // Where bilara carries no machine-readable licence field, the terms are recorded as
  // NOASSERTION. This asserts the honesty rather than the guess: a third-party edition must
  // never acquire a confident SPDX id it does not have upstream.
  for (const edition of lock.referenceEditions) {
    if (edition.license.spdx !== 'NOASSERTION') continue;
    assert.equal(
      edition.license.group,
      'third-party',
      `${edition.translator}: NOASSERTION with a non-third-party group is incoherent`,
    );
    assert.ok(
      !/SPDX:\s*CC0/i.test(notice.slice(notice.indexOf(edition.path), notice.indexOf(edition.path) + 600)),
      `${edition.translator}: NOTICE must not print a licence id upstream does not state`,
    );
  }
});

test('the code licence is reported from LICENSE, not invented', () => {
  // The root LICENSE is MIT. The lock records that fact; it does not get to decide one.
  const license = readFileSync('LICENSE', 'utf8');
  assert.match(license, /MIT License/);
  assert.equal(lock.projectLicense.code.spdx, 'MIT');
  assert.equal(lock.projectLicense.code.statedBy, 'LICENSE');
  assert.match(notice, /Code — MIT/);
});

test('the content licence is declared once and every existing declaration agrees', () => {
  // This is the anti-drift check. Four places state the content terms; all four are compared
  // against the single declaration in the lock.
  const declared = projectContentLicense();
  assert.equal(declared.spdx, 'CC0-1.0');

  // The reader credit line, checked by its rendered value rather than by searching the
  // source. It is built from the declaration, so asserting the string appears in the file
  // would only prove the source mentions it — the value is what a reader sees.
  assert.ok(
    PROJECT_TRANSLATION_CREDIT.includes(humanise(declared.spdx)),
    `the reader credit line does not state ${humanise(declared.spdx)}: ${PROJECT_TRANSLATION_CREDIT}`,
  );

  // The credits page, likewise checked as rendered text where possible. Its table cell is
  // rendered from the same declaration, so the source must not contain a typed licence at
  // all — that is the drift this replaces.
  const creditsPage = readFileSync('src/pages/credits.astro', 'utf8');
  assert.ok(
    creditsPage.includes('projectLicense.spdx'),
    'the credits page should render the content licence from the declaration',
  );
  assert.ok(
    !/CC0 1\.0 \(tác phẩm/.test(creditsPage),
    'the credits page still types the content licence instead of reading the declaration',
  );

  // The book manifests, as SPDX.
  const books = bookManifests();
  assert.ok(books.length > 0, 'there are book manifests to check');
  for (const book of books) {
    assert.equal(
      book.data.license,
      declared.spdx,
      `${book.file}: licence does not match the declaration in the lock`,
    );
  }
});

test('the content dedication is scoped to what this project wrote', () => {
  // A dedication that said only "CC0" would be read as covering Sujato and Thích Minh Châu.
  // The lock names the directories it covers, and they must be this project's own output —
  // never a `referenceEditions` path.
  const covered = Object.keys(lock.projectLicense.content.covers);
  assert.ok(covered.length > 0, 'the content licence says what it covers');
  for (const dir of covered) {
    const collision = lock.referenceEditions.find((edition) => dir.startsWith(edition.path));
    assert.equal(
      collision,
      undefined,
      `${dir} is claimed in our dedication but is upstream path ${collision?.path}`,
    );
  }
  assert.ok(
    covered.includes('content/translation/vi/project'),
    'the canonical Vietnamese translation is the main thing being dedicated',
  );
});

test('NOTICE credits SuttaCentral\'s Vietnamese contributors by name', () => {
  // Taken from the pinned acknowledgements file, not invented. If the pin changes and the
  // names change, this fails and the notice is regenerated.
  for (const name of ['Indacanda', 'Bình Anson', 'Ken Yifer', 'Mark Lin', 'Uppalavanna']) {
    assert.ok(notice.includes(name), `NOTICE omits ${name}, whom SuttaCentral credits`);
  }
});

test('SuttaCentral\'s reuse request is quoted, not paraphrased', () => {
  // "Ghi rõ nguồn gốc xuất xứ" is the instruction the whole notice exists to satisfy. A
  // paraphrase of it would not satisfy it.
  assert.ok(
    notice.includes('Ghi rõ nguồn gốc xuất xứ'),
    'NOTICE must quote SuttaCentral\'s reuse request verbatim',
  );
  assert.ok(
    notice.includes('Giữ nguyên tinh thần đạo Phật'),
    'NOTICE must quote the second request verbatim',
  );
});

test('the support tooling is named in NOTICE and none of it is called a source', () => {
  assert.match(notice, /Support tooling|SUPPORT TOOLING/i);
  assert.match(notice, /never a source of scripture/i);
});

test('the served notice is byte-identical to the file in the repository', async () => {
  // The site links to /notice.txt, generated by an endpoint that calls the same function.
  // That indirection is exactly where a divergence would hide, so it is checked against the
  // committed file rather than assumed. Only meaningful once `dist/` exists, which is after
  // the build in CI's job order.
  if (!existsSync('dist/notice.txt')) {
    console.log('  note: dist/notice.txt absent (pre-build); endpoint identity checked at build time');
    return;
  }
  assert.equal(
    readFileSync('dist/notice.txt', 'utf8'),
    readFileSync('NOTICE', 'utf8'),
    'the served NOTICE has drifted from the committed one — the endpoint adds or trims bytes',
  );
});

test('the served notice is plain text, not a page wearing a legal notice', async () => {
  if (!existsSync('dist/notice.txt')) return;
  const served = readFileSync('dist/notice.txt', 'utf8');
  // It has to survive being copied somewhere else intact, so no HTML wrapper, and no
  // absolute links back to this site.
  assert.ok(!served.includes('<'), 'the notice must not contain markup');
  assert.ok(!/href="http/.test(served), 'the notice must not depend on this site to be read');
});

test('NOTICE names every declared whole-text reference, and calls it a reference', () => {
  // A source a reader can consult is still a source. It has to appear in NOTICE with its
  // terms, and it has to be marked as not a layer — otherwise the file reads as though
  // everything listed in it feeds a version of the text.
  const references = externalReferences();
  assert.ok(references.length > 0, 'there is at least one declared reference');
  for (const reference of references) {
    assert.ok(notice.includes(reference.title), `NOTICE omits ${reference.id}`);
    assert.ok(notice.includes(reference.licence.spdx), `NOTICE omits ${reference.id}'s terms`);
    assert.ok(
      notice.includes(reference.attribution.translator),
      `NOTICE omits who translated ${reference.id}`,
    );
  }
  assert.match(notice, /WHOLE-TEXT REFERENCES/);
  assert.match(notice, /alignment\s+none/);
  // The distinction must be stated as a rule, not left for the reader to infer from wording.
  assert.match(notice, /not store layers and supply no text/);
});

test('NOTICE marks a third-party copy as a third-party copy', () => {
  for (const reference of externalReferences()) {
    if (reference.attribution.distributorIsPublisher) continue;
    const block = notice.slice(notice.indexOf(reference.title));
    assert.match(
      block.slice(0, 700),
      /third-party copy, not the publisher/,
      `${reference.id}: NOTICE does not say the source is a copy rather than the publisher`,
    );
  }
});
