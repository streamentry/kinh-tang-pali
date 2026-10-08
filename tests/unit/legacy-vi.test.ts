/**
 * The legacy Vietnamese extractor and the pinned checkout it reads.
 *
 * The extractor's contract is narrow: text in, text out. These tests pin the parts a reader
 * would silently get wrong — that edition page markers do not leak into the prose, that a
 * verse keeps its line breaks, that no markup survives, and that authorship comes from the
 * file's own footer. The checkout tests skip when `.cache/upstream/sc-data` has not been
 * synced; CI runs `npm run legacy:check` first, so there they cannot be skipped by accident.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { externalReferences } from '../../src/lib/canon/external';
import { loadLock } from '../../src/lib/canon/load';
import {
  legacyViIndex,
  legacyViSynced,
  loadLegacyVi,
  parseLegacyHtml,
} from '../../src/lib/canon/legacy-vi';

const SN1_2 = `<!DOCTYPE html>
<html><head><meta charset='UTF-8'><meta name='author' content='Thích Minh Châu'><title></title></head>
<body>
<article id='sn1.2' lang='vi'>
<header><ul><li class='division'>Chương 1: Tương Ưng Chư Thiên</li><li>I: Phẩm Cây Lau</li></ul>
<h1>1.2. Giải Thoát</h1></header>
<p><a class='pts' id='S.i.2' href='#S.i.2'></a>… Ở <i lang='pli' translate='no'>Sāvatthi</i>. Rồi một vị Thiên đến Thế Tôn &amp; đảnh lễ.</p>
<p>—Thưa Tôn giả, Ngài có biết không? <a class='ref vi-n' id='vi-n1' href='#vi-n1'>Vi-n 1.</a></p>
<blockquote class='gatha'>
<p>Hỷ, tái sanh đoạn tận,<br>
Tưởng, thức được trừ diệt,<br>
Các thọ diệt, tịch tịnh.</p>
</blockquote>
<footer>
<p>Bộ kinh đã được <span class='author'>Hòa thượng Thích Minh Châu</span> dịch, phát hành <span class='publication-date'>1980</span>.</p>
<p>Prepared for SuttaCentral by <span class='editor'>Blake Walsh</span>.</p>
</footer>
</article>
</body></html>`;

test('prose is extracted as text, without edition markers or markup', () => {
  const text = parseLegacyHtml('sn1.2', SN1_2);
  assert.equal(text.articles.length, 1);
  const [article] = text.articles;
  assert.equal(article.id, 'sn1.2');
  assert.equal(article.title, '1.2. Giải Thoát');
  assert.deepEqual(article.divisions, ['Chương 1: Tương Ưng Chư Thiên', 'I: Phẩm Cây Lau']);
  assert.deepEqual(article.blocks.map((block) => block.kind), ['paragraph', 'paragraph', 'verse']);
  assert.equal(article.blocks[0].text, '… Ở Sāvatthi. Rồi một vị Thiên đến Thế Tôn & đảnh lễ.');
  // The `Vi-n 1.` anchor is an edition marker, not part of the sutta.
  assert.equal(article.blocks[1].text, '—Thưa Tôn giả, Ngài có biết không?');
  for (const block of article.blocks) assert.ok(!/[<>]/.test(block.text), `markup leaked: ${block.text}`);
});

test('a verse keeps its line breaks and nothing else', () => {
  const [verse] = parseLegacyHtml('sn1.2', SN1_2).articles[0].blocks.filter((block) => block.kind === 'verse');
  assert.equal(verse.text, 'Hỷ, tái sanh đoạn tận,\nTưởng, thức được trừ diệt,\nCác thọ diệt, tịch tịnh.');
});

test('authorship comes from the file footer, which is kept verbatim', () => {
  const text = parseLegacyHtml('sn1.2', SN1_2);
  assert.equal(text.author, 'Hòa thượng Thích Minh Châu');
  assert.equal(text.editor, 'Blake Walsh');
  assert.equal(text.publicationDate, '1980');
  assert.deepEqual(text.footer, [
    'Bộ kinh đã được Hòa thượng Thích Minh Châu dịch, phát hành 1980.',
    'Prepared for SuttaCentral by Blake Walsh.',
  ]);
});

test('a range file keeps each of its texts as its own article', () => {
  const html = `<body>
<article id='an1.1'><header><h1>1.1. Một</h1></header><p>Đoạn một.</p></article>
<article id='an1.2'><header><h1>1.2. Hai</h1></header><p>Đoạn hai.</p></article>
<footer><p>Chân trang.</p></footer></body>`;
  const text = parseLegacyHtml('an1.1-2', html);
  assert.deepEqual(text.articles.map((article) => article.id), ['an1.1', 'an1.2']);
  assert.deepEqual(text.articles.map((article) => article.blocks[0].text), ['Đoạn một.', 'Đoạn hai.']);
  assert.deepEqual(text.footer, ['Chân trang.']);
});

test('script and style never reach the output', () => {
  const html = `<body><article id='x'><header><h1>T</h1></header>
<script>alert(1)</script><style>p{}</style><p>Văn bản.</p></article></body>`;
  const [article] = parseLegacyHtml('x', html).articles;
  assert.deepEqual(article.blocks, [{ kind: 'paragraph', text: 'Văn bản.' }]);
});

test('text outside any block is kept, not dropped', () => {
  const html = `<body><article id='sn1.13'><header><h1>T</h1></header>
<span class='add'>(Tạp 36.14, Ðại 2,263b)</span>
<p>Đoạn.</p></article></body>`;
  const [article] = parseLegacyHtml('sn1.13', html).articles;
  assert.deepEqual(article.blocks.map((block) => block.text), ['(Tạp 36.14, Ðại 2,263b)', 'Đoạn.']);
});

test('stanzas in a verse are kept apart by a blank line', () => {
  const html = `<body><article id='x'><header><h1>T</h1></header>
<blockquote class='gatha'><p>Dòng một,<br>dòng hai.</p><p><span class='speaker'>(Thế Tôn):</span> Dòng ba.</p></blockquote>
</article></body>`;
  const [verse] = parseLegacyHtml('x', html).articles[0].blocks;
  assert.equal(verse.text, 'Dòng một,\ndòng hai.\n\n(Thế Tôn): Dòng ba.');
});

test('an edition marker that never closes does not swallow what follows', () => {
  const html = `<body><article id='x'><header><h1>T</h1></header>
<p>Một <a class='ref sc' id='sc1'>SC 1</p><p>Hai.</p></article></body>`;
  const [article] = parseLegacyHtml('x', html).articles;
  assert.deepEqual(article.blocks.map((block) => block.text), ['Một', 'Hai.']);
});

test('every author line is collected, and an impossible entity is left as written', () => {
  const html = `<body><article id='x'><header><h1>T</h1></header><p>&#99999999; &#x41;</p>
<footer><p><span class='author'>A</span> và <span class='author'>B</span></p></footer></article></body>`;
  const text = parseLegacyHtml('x', html);
  assert.deepEqual(text.authors, ['A', 'B']);
  assert.equal(text.articles[0].blocks[0].text, '&#99999999; A');
});

const synced = legacyViSynced();
const skip = synced ? false : 'run `npm run legacy:sync` to fetch the pinned checkout';

test('the pinned checkout holds exactly the files the lock records, one per uid', { skip }, () => {
  assert.equal(legacyViIndex().size, loadLock().legacyHtml.fileCount);
});

test('every declared uid has a file, and the file names the author the declaration says', { skip }, () => {
  for (const reference of externalReferences().filter((entry) => entry.localCopy === 'legacyHtml')) {
    const allowed = new Set(reference.fileAuthors);
    assert.ok(allowed.size > 0, `${reference.id}: declares which author lines its files carry`);
    for (const uids of Object.values(reference.verifiedUids ?? {})) {
      for (const uid of uids) {
        const text = loadLegacyVi(uid);
        assert.ok(text, `${reference.id}: ${uid} has no file in the checkout`);
        // Every author line counts, not only the last: a co-translated file must not pass
        // because the one allowed name happens to come last.
        assert.ok(text.authors.length > 0, `${reference.id}: ${uid} names no author`);
        for (const author of text.authors) {
          assert.ok(allowed.has(author), `${reference.id}: ${uid} names '${author}', not one of ${[...allowed].join(' | ')}`);
        }
        assert.ok(text.footer.length > 0, `${uid}: the footer carrying the credit is present`);
      }
    }
  }
});

test('real texts extract to the structure the file has', { skip }, () => {
  const mn1 = loadLegacyVi('mn1')!;
  assert.equal(mn1.articles[0].title, '1. Kinh Pháp Môn Căn Bản');
  assert.equal(mn1.articles[0].blocks.filter((block) => block.kind === 'paragraph').length, 35);
  assert.match(mn1.footer.join(' '), /Bình Anson hiệu đính/);
  const sn12 = loadLegacyVi('sn1.2')!;
  assert.deepEqual(sn12.articles[0].blocks.map((block) => block.kind), ['paragraph', 'paragraph', 'paragraph', 'paragraph', 'verse']);
  assert.equal(loadLegacyVi('thag1.1')!.author, 'Bhikkhu Indacanda');
});

test('the pinned files with no body text are counted, and are exactly these', { skip }, () => {
  // These carry a header and a footer only. The page says so instead of opening an empty text.
  const empty = [...legacyViIndex().keys()]
    .filter((uid) => loadLegacyVi(uid)!.articles.every((article) => article.blocks.length === 0))
    .sort();
  assert.deepEqual(empty, ['sn35.161', 'sn48.137-146', 'sn48.147-158', 'sn48.159-168', 'sn53.13-22', 'sn53.35-44']);
});

test('no extracted block carries markup', { skip }, () => {
  for (const uid of ['mn1', 'dn1', 'sn22.1', 'an1.1-10', 'thag1.1', 'kp1', 'mil1']) {
    const text = loadLegacyVi(uid);
    assert.ok(text, `${uid} is in the checkout`);
    for (const article of text.articles) {
      for (const block of article.blocks) assert.ok(!/<[a-z/]/i.test(block.text), `${uid}: markup in ${block.text.slice(0, 60)}`);
    }
  }
});
