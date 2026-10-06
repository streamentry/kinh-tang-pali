/**
 * A whole-text reference must stay a reference.
 *
 * The hazard being guarded against is quiet. Nothing breaks if a whole page of continuous
 * prose is declared as a store layer: the build passes, the reader renders, coverage goes
 * up. But coverage would then be counting text that is not segment-comparable, and the
 * comparison view would show columns that do not line up, with no way for a reader to
 * detect either. So these tests check the boundary rather than the content.
 *
 * The attribution tests encode a finding, not a preference. budsas.org's Majjhima Nikāya
 * carries, on every page sampled: *"Bình Anson hiệu đính, dựa theo bản Anh ngữ … Tỳ khẻo
 * Nanamoli"*. Crediting Hòa thượng Thích Minh Châu alone — the obvious thing to write — is
 * the same mistake this repository already made once in reverse, where our own translation
 * was credited to him.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  caveatForReference,
  creditForReference,
  externalReferenceRules,
  externalReferences,
  loadExternalReferences,
  pageUrlFor,
  referenceById,
} from '../../src/lib/canon/external';
import { storeLayer, storeLayers } from '../../src/lib/canon/layers';
import { composeDocument } from '../../src/lib/canon/document';

const references = externalReferences();
const budsas = referenceById('budsas-mn');

test('the manifest is well formed and every entry is a reference, not a layer', () => {
  assert.equal(loadExternalReferences().schemaVersion, 1);
  assert.ok(references.length > 0, 'there is at least one declared reference');
  for (const reference of references) {
    assert.equal(reference.kind, 'whole-text-reference', `${reference.id}: is a reference`);
    // `alignment: none` is the whole point. Anything else would claim a correspondence
    // between prose paragraphs and bilara segments that has not been demonstrated.
    assert.equal(reference.alignment, 'none', `${reference.id}: claims no segment alignment`);
    assert.ok(reference.title, `${reference.id}: has a title`);
    assert.ok(reference.purpose, `${reference.id}: says what it is for`);
    assert.ok(reference.licence.holder, `${reference.id}: names a rights holder`);
    assert.ok(reference.licence.basis, `${reference.id}: says why the licence is what it is`);
  }
});

test('a whole-text reference never becomes a store layer', () => {
  // The boundary, asserted directly. If this file were ever moved into layers.yaml, the
  // coverage metric and the column composer would start treating unaligned prose as
  // segment-addressable text, and nothing else would notice.
  const layerIds = new Set(storeLayers().map((layer) => layer.id));
  for (const reference of references) {
    assert.equal(
      layerIds.has(reference.id),
      false,
      `${reference.id} is declared as a reference but is also a store layer`,
    );
  }
  const layersYaml = readFileSync('source/layers.yaml', 'utf8');
  for (const reference of references) {
    assert.ok(
      !layersYaml.includes(reference.id),
      `source/layers.yaml mentions ${reference.id}; whole-text references must not be layers`,
    );
  }
});

test('declaring a reference changes no text, no segment and no coverage', () => {
  // The property that matters. If a reference could contribute text, this would differ.
  const before = composeDocument('mn', 'mn118');
  // A whole-text reference carries no segments, so the strongest statement available is that
  // composing the document before and after resolving one is byte-identical: same segment
  // count, same per-version text, same totals.
  const snapshot = (doc: typeof before) => JSON.stringify({
    segmentCount: doc.segments.length,
    // The four per-segment version fields, which is where text could leak in.
    text: doc.segments.map((segment) => [segment.id, segment.pali, segment.en, segment.viCurrent, segment.vi]),
    totals: doc.layers.map((layer) => [layer.id, layer.withText, layer.total, layer.sourceLayers]),
  });
  const beforeText = snapshot(before);
  // Reference resolution is on the same path the reader uses, so exercise it.
  assert.ok(pageUrlFor(budsas, 'mn118'));
  const after = composeDocument('mn', 'mn118');
  assert.equal(snapshot(after), beforeText, 'resolving an external reference must not alter any column');
  // A whole-text reference must not become a fifth column, and must not land in any of the
  // four. The concrete case: Majjhima has a whole-text reference, and no segment-addressable
  // Vietnamese from that translator, so `viCurrent` stays empty.
  assert.equal(
    after.layers.find((layer) => layer.id === 'viCurrent')?.withText,
    0,
    'a whole-text reference must not fill the Việt hiện hành column',
  );
  const filled = new Set<string>();
  for (const segment of after.segments) {
    for (const field of ['pali', 'en', 'viCurrent', 'vi'] as const) {
      if ((segment as unknown as Record<string, unknown>)[field]) filled.add(field);
    }
  }
  assert.deepEqual(
    [...filled].sort(),
    ['en', 'pali', 'vi'],
    `mn118 fills exactly the three segment-addressable versions; got ${[...filled].sort()}`,
  );
  // And no layer claims the reference as one of its sources.
  for (const column of before.layers) {
    assert.ok(
      !column.sourceLayers.includes(budsas.id),
      `column ${column.id} lists the whole-text reference as a source layer`,
    );
  }
});

test('the licence stays NOASSERTION, and says why', () => {
  // The source states no machine-readable terms. Recording that is correct; guessing CC0 or
  // "free to use" is the failure the project's own rules name as a blocking error.
  assert.equal(budsas.licence.spdx, 'NOASSERTION');
  assert.equal(budsas.licence.statementFrom, null, 'nothing machine-readable exists to cite');
  assert.match(budsas.licence.basis, /NOASSERTION/);
  assert.equal(budsas.licence.attributionRequired, true);
  const credit = creditForReference(budsas);
  assert.match(credit, /NOASSERTION/);
  assert.ok(
    !/CC0|public domain|phạm vi công cộng/i.test(credit),
    `the credit must not imply free reuse: ${credit}`,
  );
});

test('a third-party copy is labelled a third-party copy', () => {
  assert.equal(budsas.attribution.distributorIsPublisher, false);
  const credit = creditForReference(budsas);
  assert.match(credit, /bản sao chép bên thứ ba/);
  // The original edition is named so the reader knows what they are not looking at.
  assert.match(budsas.originalPublication, /1973/);
  assert.match(budsas.originalPublication, /1986/);
  assert.match(
    caveatForReference(budsas).join(' '),
    /bản sao của bên thứ ba, không phải bản xuất bản/,
  );
});

test('the translator and the reviser are both named', () => {
  // Every sampled page carries "Bình Anson hiệu đính, dựa theo bản Anh ngữ …". Crediting
  // Hòa thượng Thích Minh Châu alone would credit him with text revised by someone else.
  const credit = creditForReference(budsas);
  assert.match(credit, /Hòa thượng Thích Minh Châu/);
  assert.match(credit, /hiệu đính Bình Anson/);
  assert.ok(budsas.attribution.reviserBasis, 'the basis for the revision is recorded');
  assert.match(budsas.attribution.reviserBasis, /Nanamoli/);
});

test('the credit says it cannot be compared segment by segment', () => {
  // A reader about to compare this text against a segment must not be able to miss that
  // they cannot. The caveat is part of the credit, not a footnote elsewhere.
  const credit = creditForReference(budsas);
  assert.match(credit, /Không theo segment/);
  const caveats = caveatForReference(budsas);
  assert.ok(caveats.length >= 3, 'the caveat states more than one thing');
  assert.match(caveats.join(' '), /văn xuôi liên tục/i);
});

test('the uid → URL mapping is only claimed where it was checked', () => {
  // Verified: the Majjhima index lists exactly 152 links, trung01..trung152, 1..152, no
  // duplicates, no gaps. Twelve were additionally checked by Pāli name; ten matched and
  // the two that did not are typos in the site's own titles, recorded as such.
  assert.deepEqual(budsas.collections, ['mn']);
  assert.equal(budsas.mappedRange, 'mn1..mn152');
  assert.ok(budsas.verified, 'the mapping records how it was established');
  assert.equal(budsas.verified.checked, 12);
  assert.equal(budsas.verified.matched, 10);
  assert.equal(budsas.verified.exceptions?.length, 2);
  for (const exception of budsas.verified.exceptions ?? []) {
    assert.match(exception.note, /lỗi chính tả/);
  }
  // The unverified collections must be named as unverified, not silently absent.
  const unverified = new Set((budsas.unverifiedCollections ?? []).map((u) => u.collection));
  for (const collection of ['dn', 'sn', 'an', 'kn']) {
    assert.ok(unverified.has(collection), `${collection} is listed as unverified`);
  }
});

test('a uid outside the verified mapping gets no link rather than a guessed one', () => {
  // Zero-padding to two, so single digits gain a zero and three-digit numbers do not. Both
  // `trung18.htm` and `trung118.htm` are listed in the index and return 200.
  assert.equal(pageUrlFor(budsas, 'mn118'), 'https://www.budsas.org/uni/u-kinh-trungbo/trung118.htm');
  assert.equal(pageUrlFor(budsas, 'mn18'), 'https://www.budsas.org/uni/u-kinh-trungbo/trung18.htm');
  assert.equal(pageUrlFor(budsas, 'mn1'), 'https://www.budsas.org/uni/u-kinh-trungbo/trung01.htm');
  assert.equal(pageUrlFor(budsas, 'mn152'), 'https://www.budsas.org/uni/u-kinh-trungbo/trung152.htm');
  // Not mapped, so no link. A link to the wrong sutta is worse than none: the reader opens
  // one text and gets another, and cannot tell.
  for (const uid of ['sn1.1', 'an1.1', 'kn1.1', 'dn1']) {
    assert.equal(pageUrlFor(budsas, uid), null, `${uid} is outside the verified mapping`);
  }
});

test('the rules say the things that must not be forgotten', () => {
  const rules = externalReferenceRules().join(' ');
  assert.match(rules, /Không phải tầng store/);
  assert.match(rules, /NOASSERTION/);
  assert.match(rules, /nguồn sao chép/i);
  assert.match(rules, /không.*đối chiếu.*segment|segment/i);
});

test('the reader renders a whole-text reference from the declaration, not from markup', () => {
  // The same anti-drift rule as for support tooling: names come from a declared file, so a
  // second name cannot appear on one surface only. The sutta page is where a per-text
  // reference belongs, so that is the surface checked.
  const reader = readFileSync('src/components/SuttaReader.astro', 'utf8');
  assert.ok(
    /externalReference|creditForReference|pageUrlFor|caveatForReference/.test(reader),
    'SuttaReader.astro must render whole-text references from source/external-references.yaml',
  );
  // No raw translator name for *this* reference may be typed into the reader's body. The
  // SuttaCentral layer's credit is a different concern and is checked in provenance-credit.
  const bodyStart = reader.indexOf('---', 3);
  const body = bodyStart >= 0 ? reader.slice(bodyStart) : reader;
  assert.ok(
    !/Nanamoli|Bình Anson hiệu đính/.test(body),
    'SuttaReader.astro names the reviser in markup; read it from the declaration',
  );
});

test('the store layer list is unchanged by any of this', () => {
  // Five layers, as before: Pāli plus four. A whole-text reference adds a way to reach a
  // translation, not a fifth column.
  assert.equal(storeLayers().length, 5);
  assert.equal(storeLayer('pali').id, 'pali');
});

test('chapter references are scoped to explicitly reviewed UIDs and do not fill reader columns', () => {
  const reference = referenceById('budsas-sn1-reviewed');
  assert.equal(pageUrlFor(reference, 'sn1.3'), 'https://budsas.net/uni/u-kinh-tuongungbo/tu1-01.htm');
  assert.equal(pageUrlFor(reference, 'sn1.11'), null);
  assert.equal(pageUrlFor(reference, 'sn2.1'), null);
  assert.equal(reference.attribution.translator, 'Hòa thượng Thích Minh Châu');
  assert.equal(reference.licence.spdx, 'NOASSERTION');
  assert.equal(reference.attribution.distributorIsPublisher, false);
  const document = composeDocument('sn', 'sn1.3');
  assert.equal(document.layers.find(layer => layer.id === 'viCurrent')?.withText, 0);
  assert.equal(document.layers.some(layer => layer.sourceLayers.includes(reference.id)), false);
});


test('reviewed 2016 Vietnamese references resolve only the two verified texts', () => {
  const ref = referenceById('suttacentral-2016-an6-sn22-reviewed');
  for (const uid of ['an6.29', 'sn22.26']) {
    assert.equal(pageUrlFor(ref, uid), `https://www.dhammatalks.net/suttacentral/sc2016/sc/vn/${uid}.html`);
  }
  for (const uid of ['an6.28', 'sn22.27', 'mn1', 'dhp1-20']) assert.equal(pageUrlFor(ref, uid), null);
  assert.equal(ref.alignment, 'none');
  assert.equal(ref.licence.spdx, 'NOASSERTION');
  assert.equal(ref.attribution.translator, 'Hòa thượng Thích Minh Châu');
  assert.match(creditForReference(ref), /bản sao chép bên thứ ba/);
});
