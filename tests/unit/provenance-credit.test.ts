/**
 * A credit is two facts — who translated it, and where this copy came from — and neither may
 * be inferred from the other.
 *
 * This file exists because that rule was written down and then not enforced, which is how
 * every other rule in this repository rots. Two defects it caught when first written:
 *
 *   - The English column's credit read `sujato`. That is a bilara directory slug, not a
 *     person's name; the correct name, `Bhikkhu Sujato`, was sitting in the lock unused.
 *   - The Pāli root credited "SuttaCentral" twice, as author and as distributor, which
 *     implies someone else published the Pāli.
 *
 * It also encodes the finding that forced the rule. budsas.org/uni/ distributes the five Pāli
 * Nikāyas in Vietnamese, and the translations *within* it are not one person's: Khuddaka II
 * is GS Trần Phương Lan, VI–VII are TMC and Trần Phương Lan jointly, VIII is Trần Phương
 * Lan. So the translator cannot be derived from the distributor even in principle, and a
 * credit has to be recorded per text rather than per layer.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { loadLock } from '../../src/lib/canon/load';
import { creditForLayer, provenanceForLayer, storeLayer, storeLayers } from '../../src/lib/canon/layers';
import { PROJECT_TRANSLATION_CREDIT, composeDocument } from '../../src/lib/canon/document';

const lock = loadLock();
const layers = storeLayers();

test('provenance names the author and the distributor as separate facts', () => {
  for (const layer of layers) {
    const p = provenanceForLayer(layer);
    assert.ok(p.author, `${layer.id}: has an author`);
    assert.ok(p.terms, `${layer.id}: states its terms`);
    assert.ok(p.group, `${layer.id}: states a licence group`);
    assert.ok(p.holder, `${layer.id}: names a rights holder`);
    // They are separate fields, and where both exist they are different claims.
    if (p.distributor) {
      assert.notEqual(
        p.author,
        p.distributor,
        `${layer.id}: author and distributor are identical ("${p.author}") — one party cannot be both`,
      );
    }
  }
});

test('an author is never a bilara directory slug', () => {
  // `translator` is a path component. Printing it in a credit that a reader sees tells them
  // nothing and looks like an oversight, which is how "sujato" reached the English column.
  const slugs = new Set(lock.referenceEditions.map((edition) => edition.translator));
  for (const layer of layers) {
    const p = provenanceForLayer(layer);
    assert.ok(
      !slugs.has(p.author),
      `${layer.id}: credit names the directory slug "${p.author}" instead of a person`,
    );
  }
});

test('the English reference credits Bhikkhu Sujato, not "sujato"', () => {
  const p = provenanceForLayer(storeLayer('english-sujato'));
  assert.equal(p.author, 'Bhikkhu Sujato');
  assert.equal(p.distributor, 'SuttaCentral');
  assert.match(creditForLayer(storeLayer('english-sujato')), /^Bhikkhu Sujato — lấy từ SuttaCentral/);
});

test('the Vietnamese reference credits both the translator and SuttaCentral', () => {
  // The Dhammapada text is TMC's translation *distributed by SuttaCentral*. Both statements
  // are true; dropping either one misattributes the work or hides where it came from.
  const p = provenanceForLayer(storeLayer('vietnamese-current'));
  assert.equal(p.author, 'Bhikkhu Thích Minh Châu');
  assert.equal(p.distributor, 'SuttaCentral');
  assert.equal(p.sourcePath, 'translation/vi/phantuananh');
  assert.equal(p.group, 'third-party');
  assert.match(p.terms, /bản quyền thuộc/);
});

test("the project's own work claims no distributor", () => {
  // We distribute our translation ourselves. Naming a distributor here would be a false
  // claim, not a courtesy — and it is the mistake of a different kind from the two above.
  const p = provenanceForLayer(storeLayer('vietnamese-project'));
  assert.equal(p.distributor, undefined);
  assert.match(p.author, /Kinh Tạng Pāli Việt/);
  assert.match(creditForLayer(storeLayer('vietnamese-project')), /^Kinh Tạng Pāli Việt/);
});

test('the Pāli root is authored by SuttaCentral, not distributed by it', () => {
  // The Pāli is SuttaCentral's own text. Crediting them as the distributor of it implies a
  // separate rights holder, which would misstate the position of a public-domain source.
  const p = provenanceForLayer(storeLayer('pali'));
  assert.equal(p.distributor, undefined);
  assert.equal(p.group, 'public-domain');
  assert.match(p.author, /Mahāsaṅgīti/);
});

test('every upstream edition names a distributor, because upstream means someone else published it', () => {
  // Project layers are our own work and correctly name no distributor. The rule is about
  // editions we hold a copy *of* — for those, saying where the copy came from is mandatory.
  for (const layer of layers) {
    const location = layer.location;
    if (location.type !== 'upstream' || location.rootEdition) continue; // Pāli root handled above
    assert.equal(
      provenanceForLayer(layer).distributor,
      'SuttaCentral',
      `${layer.id}: an upstream edition must name who published the copy we hold`,
    );
  }
});

test('a credit never credits a reference translation to the project', () => {
  // The bug this repository already had once: inferring a layer from `standing` sent our own
  // Vietnamese column to the `vietnamese-current` edition, so our translation was credited to
  // Bhikkhu Thích Minh Châu. The same inference in the other direction would be no better.
  const project = provenanceForLayer(storeLayer('vietnamese-project'));
  assert.ok(
    !/Thích Minh Châu|Sujato|SuttaCentral/.test(project.author),
    `our own translation is attributed to "${project.author}"`,
  );
  assert.match(PROJECT_TRANSLATION_CREDIT, /dự án/);
  assert.ok(
    !/Thích Minh Châu/.test(PROJECT_TRANSLATION_CREDIT),
    'the project credit line must not name a reference translator',
  );
});

test('a third-party edition is never shown as freely reusable', () => {
  for (const edition of lock.referenceEditions) {
    if (edition.license.group !== 'third-party') continue;
    assert.notEqual(edition.license.spdx, 'CC0-1.0', `${edition.translator} claims CC0`);
  }
});

test('a text with no Vietnamese reference says so instead of crediting nobody', () => {
  // 6,111 of 6,137 texts have no Vietnamese current layer. The panel has to show an honest
  // absence; a credit line with a name on a text we cannot show that text for is the failure
  // mode. Checked on a text outside the Dhammapada, where the layer is genuinely absent.
  const doc = composeDocument('mn', 'mn118');
  const viCurrent = doc.layers.find((layer) => layer.id === 'viCurrent');
  assert.ok(viCurrent, 'the document exposes a Việt hiện hành column');
  assert.equal(viCurrent.reason, 'not-published-upstream');
  assert.equal(viCurrent.withText, 0);
  // `total` stays the Pāli segment count — it is what *could* have been filled, not what was.
  assert.ok(viCurrent.total > 0, 'the text has Pāli segments to fill');
  // The defect this asserts: mn118 contains no Vietnamese current text at all, so printing
  // "Bhikkhu Thích Minh Châu — lấy từ SuttaCentral" in its legend credits a translator whose
  // work the page does not show, and implies the translation drew on it. 6,111 of 6,137 texts
  // are in exactly this position, so a per-layer credit misstates almost the whole corpus.
  assert.equal(
    viCurrent.credit,
    undefined,
    'a text with no content from a reference layer must not carry that layer\'s credit',
  );
});

test('a text that does have Vietnamese reference credits it on that text', () => {
  // The mirror of the above, and the reason credit is per-text rather than global.
  const doc = composeDocument('kn', 'dhp1-20');
  const viCurrent = doc.layers.find((layer) => layer.id === 'viCurrent');
  assert.ok(viCurrent, 'the document exposes a Việt hiện hành column');
  assert.ok(viCurrent.withText > 0, 'the Dhammapada has Vietnamese reference prose');
  assert.ok(viCurrent.credit, 'and so it is credited on this text');
  assert.match(viCurrent.credit, /Thích Minh Châu/);
  assert.match(viCurrent.credit, /SuttaCentral/);
});

test('every displayed version on every sampled text carries a credit', () => {
  // A column that is present must say whose work it is. The one that must not is a column
  // that is absent, which the absence reason already covers.
  for (const [collection, uid] of [['mn', 'mn118'], ['kn', 'dhp1-20'], ['sn', 'sn1.1']] as const) {
    const doc = composeDocument(collection, uid);
    for (const layer of doc.layers) {
      const present = layer.withText > 0 || layer.id === 'pali';
      assert.equal(
        Boolean(layer.credit),
        present,
        `${collection}/${uid} ${layer.id}: a credit exists exactly when the layer supplied text`,
      );
    }
  }
});
