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
import { loadLock, sourcePathFor } from '../../src/lib/canon/load';
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

const SC_IDS = ['suttacentral-vi-minh-chau-binh-anson', 'suttacentral-vi-minh-chau', 'suttacentral-vi-indacanda'];
const scReferences = SC_IDS.map((id) => referenceById(id));

test('the SuttaCentral Vietnamese texts are whole-text references, credited to who made each one', () => {
  for (const reference of scReferences) {
    assert.equal(reference.kind, 'whole-text-reference', `${reference.id}: is a reference`);
    assert.equal(reference.alignment, 'none', `${reference.id}: claims no segment alignment`);
    assert.equal(reference.localCopy, 'legacyHtml', `${reference.id}: held in the pinned checkout`);
    assert.equal(reference.licence.spdx, 'NOASSERTION', `${reference.id}: no licence is asserted`);
    assert.equal(reference.licence.statementFrom, null);
    assert.equal(reference.attribution.distributorIsPublisher, false);
    const credit = creditForReference(reference);
    assert.match(credit, /bản sao chép bên thứ ba/);
    assert.match(credit, /Không theo segment/);
    assert.ok(!/CC0|public domain|phạm vi công cộng/i.test(credit), `${reference.id}: credit implies free reuse`);
  }
  const [revised, chau, indacanda] = scReferences;
  // Majjhima and Dīgha files name Bình Anson as reviser; Saṁyutta and Aṅguttara files do not.
  assert.equal(revised.attribution.translator, 'Hòa thượng Thích Minh Châu');
  assert.equal(revised.attribution.reviser, 'Bình Anson');
  assert.match(creditForReference(revised), /hiệu đính Bình Anson/);
  assert.equal(chau.attribution.translator, 'Hòa thượng Thích Minh Châu');
  assert.equal(chau.attribution.reviser, undefined, 'no reviser is named where the files name none');
  assert.doesNotMatch(creditForReference(chau), /hiệu đính/);
  // Most of Khuddaka is Bhikkhu Indacanda's. Crediting it to Thích Minh Châu would hand him a
  // translation he did not make; the files themselves say otherwise.
  assert.equal(indacanda.attribution.translator, 'Bhikkhu Indacanda');
  assert.doesNotMatch(creditForReference(indacanda), /Minh Châu/);
  assert.match(indacanda.urlTemplate, /\/vi\/indacanda$/, 'SuttaCentral files these under the author id indacanda');
  assert.match(chau.urlTemplate, /\/vi\/minh_chau$/);
  assert.match(revised.urlTemplate, /\/vi\/minh_chau$/);
});

test('every legacy text belongs to exactly one SuttaCentral reference, and the pin counts them all', () => {
  const owner = new Map<string, string>();
  for (const reference of scReferences) {
    for (const uids of Object.values(reference.verifiedUids ?? {})) {
      for (const uid of uids) {
        assert.equal(owner.has(uid), false, `${uid} is claimed by both ${owner.get(uid)} and ${reference.id}`);
        owner.set(uid, reference.id);
      }
    }
    const listed = Object.values(reference.verifiedUids ?? {}).reduce((n, uids) => n + uids.length, 0);
    assert.equal(reference.verified?.matched, listed, `${reference.id}: matched count equals the list`);
    assert.equal(reference.verified?.checked, listed, `${reference.id}: checked count equals the list`);
  }
  assert.equal(owner.size, loadLock().legacyHtml.fileCount, 'the lists together are exactly the files the pin records');
});

test('every verified SuttaCentral uid is a catalogued text or the pinned Pāli file one is read from', () => {
  for (const reference of scReferences) {
    for (const [collection, uids] of Object.entries(reference.verifiedUids ?? {})) {
      assert.ok(reference.collections.includes(collection), `${reference.id}: ${collection} is declared`);
      const catalog = JSON.parse(readFileSync(`content/catalog/sutta/${collection}.json`, 'utf8')) as {
        texts: Array<{ uid: string; sourcePath?: string }>;
      };
      // A ranged file such as `an1.1-10` is not a catalogued uid; it is the Pāli file `an1.1`
      // to `an1.10` are read from, and SuttaCentral files their Vietnamese under the same name.
      const known = new Set<string>();
      for (const item of catalog.texts) {
        known.add(item.uid);
        const sourcePath = sourcePathFor(collection as 'mn', item.uid, item.sourcePath) ?? '';
        known.add(sourcePath.split('/').pop()?.replace(/_root-pli-ms\.json$/, '') ?? item.uid);
      }
      const missing = uids.filter((uid) => !known.has(uid));
      assert.deepEqual(missing, [], `${reference.id}: uids with no pinned Pāli in ${collection}`);
    }
  }
});

test('a SuttaCentral link is given only for the reference that owns the uid', () => {
  const [revised, chau, indacanda] = scReferences;
  assert.equal(pageUrlFor(revised, 'mn1', 'mn'), 'https://suttacentral.net/mn1/vi/minh_chau');
  assert.equal(pageUrlFor(revised, 'dn34', 'dn'), 'https://suttacentral.net/dn34/vi/minh_chau');
  assert.equal(pageUrlFor(revised, 'snp3.7', 'kn'), 'https://suttacentral.net/snp3.7/vi/minh_chau');
  assert.equal(pageUrlFor(chau, 'sn1.1', 'sn'), 'https://suttacentral.net/sn1.1/vi/minh_chau');
  // A range uid keeps its range: SuttaCentral lists an1.1-10 as one text.
  assert.equal(pageUrlFor(chau, 'an1.1-10', 'an'), 'https://suttacentral.net/an1.1-10/vi/minh_chau');
  assert.equal(pageUrlFor(chau, 'kp1', 'kn'), 'https://suttacentral.net/kp1/vi/minh_chau');
  assert.equal(pageUrlFor(indacanda, 'thag1.1', 'kn'), 'https://suttacentral.net/thag1.1/vi/indacanda');
  // SuttaCentral files an1.1–an1.10 as one text. A page for an1.5 resolves to that ranged text
  // through the Pāli file it is read from — and only through it.
  assert.equal(pageUrlFor(chau, 'an1.5', 'an', 'an1.1-10'), 'https://suttacentral.net/an1.1-10/vi/minh_chau');
  assert.equal(pageUrlFor(chau, 'an1.5', 'an'), null, 'an1.5 is not itself a verified uid');
  // Pāli is pinned for these, but SuttaCentral has no Vietnamese for them: no link.
  assert.equal(pageUrlFor(chau, 'sn3.15', 'sn', 'sn3.15'), null, 'sn3.15 has no Vietnamese text');
  assert.equal(pageUrlFor(chau, 'an9.113-432', 'an', 'an9.113-432'), null, 'an9.113-432 has no Vietnamese text');
  // A Khuddaka text is not credited to the wrong translator through the other reference.
  assert.equal(pageUrlFor(indacanda, 'kp1', 'kn'), null, 'kp1 is Thích Minh Châu\'s, not Indacanda\'s');
  assert.equal(pageUrlFor(chau, 'thag1.1', 'kn'), null, 'thag1.1 is Indacanda\'s, not Thích Minh Châu\'s');
  // Outside the declared collections.
  assert.equal(pageUrlFor(revised, 'dhp1-20', 'kn'), null);
  assert.equal(pageUrlFor(chau, 'mn1', 'mn'), null);
});

test('the reader shows legacy text as text, from the declaration, and never as markup', () => {
  const reader = readFileSync('src/components/SuttaReader.astro', 'utf8');
  const component = readFileSync('src/components/LegacyViText.astro', 'utf8');
  assert.match(reader, /LegacyViText/);
  // The empty Việt hiện hành card points down at the whole text instead of only saying "none".
  assert.match(reader, /tra-cuu-toan-van/);
  // A source with a checked uid list is listed only on the texts it holds.
  assert.match(reader, /entry\.url \|\| !\(entry\.reference\.verifiedUids \|\| entry\.reference\.urlByUid\)/);
  assert.match(reader, /localCopy/);
  for (const [name, source] of [['SuttaReader.astro', reader], ['LegacyViText.astro', component]] as const) {
    assert.ok(!/set:html|innerHTML/.test(source), `${name} must not inject third-party HTML`);
  }
  // Credit comes from the declaration and from the file's own footer, not from typed names.
  assert.ok(!/Indacanda|Bình Anson/.test(component), 'LegacyViText.astro names no one; the footer does');
});

test('the number of reader pages that show a legacy Vietnamese text is counted, not assumed', () => {
  // Every catalogued text, resolved the way the reader resolves it: by uid, or by the ranged
  // Pāli file it is read from. The totals are what the site actually shows.
  const shown: Record<string, number> = {};
  const total: Record<string, number> = {};
  for (const collection of ['mn', 'dn', 'sn', 'an', 'kn'] as const) {
    const catalog = JSON.parse(readFileSync(`content/catalog/sutta/${collection}.json`, 'utf8')) as {
      texts: Array<{ uid: string; sourcePath?: string }>;
    };
    for (const item of catalog.texts) {
      total[collection] = (total[collection] ?? 0) + 1;
      const sourcePath = sourcePathFor(collection, item.uid, item.sourcePath) ?? '';
      const sourceKey = sourcePath.split('/').pop()?.replace(/_root-pli-ms\.json$/, '') ?? item.uid;
      const owners = scReferences.filter((reference) => pageUrlFor(reference, item.uid, collection, sourceKey));
      assert.ok(owners.length <= 1, `${item.uid} resolves through ${owners.map((o) => o.id).join(' and ')}`);
      if (owners.length === 1) shown[collection] = (shown[collection] ?? 0) + 1;
    }
  }
  assert.deepEqual(shown, { mn: 152, dn: 34, sn: 1805, an: 1768, kn: 1429 });
  assert.deepEqual(total, { mn: 152, dn: 34, sn: 1819, an: 1781, kn: 2351 });
});
