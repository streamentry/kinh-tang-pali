# Kiến trúc dự án — Kinh tạng Pāli bản dịch tiếng Việt

> **Trạng thái: CHỐT để scaffold**  
> Ngày: 2026-09-10  
> Mục tiêu: xây một nền tảng nội dung có thể sống hàng chục năm, xuất website + EPUB + PDF từ cùng dữ liệu, đối chiếu Pāli–Việt chính xác theo segment, và có đường tương thích với hệ sinh thái SuttaCentral/Bilara.

---

## 0. Quyết định kiến trúc cuối cùng

| Hạng mục | Quyết định chốt |
|---|---|
| Nguồn kinh văn Việt | **Bilara-compatible segmented JSON** |
| Nguồn Pāli | **SuttaCentral/Bilara upstream được pin theo commit**, read-only |
| ID bài kinh | **UID SuttaCentral nguyên bản**, không zero-pad: `mn1`, `mn118`, `sn56.11`, `an9.21` |
| ID căn chỉnh | **Segment ID bất biến**: `mn118:1.1`, `mn118:1.2`, ... |
| Markdown | Chỉ dùng cho guides/editorial prose; **không là canonical scripture format** |
| Website | **Astro 7.x SSG**, không backend/SSR ở giai đoạn đầu |
| Search | **Pagefind** |
| EPUB | **Pandoc EPUB 3** |
| PDF | **Pandoc + Typst**, một pipeline duy nhất lúc đầu |
| Hosting | **Cloudflare Pages** |
| CI/CD | **GitHub Actions** là pipeline chuẩn; Cloudflare là deployment target |
| Workflow biên tập | `draft → review → published` |
| Version nội dung | Git history + release tag; **không tạo v1/v2 trong cùng canonical translation** |
| License bản dịch mới | **CC0-1.0 nếu mục tiêu có khả năng đưa lên SuttaCentral** |
| License code | **MIT** |
| Font | **Literata** thân bài + **Be Vietnam Pro** UI, fallback Noto |

Đây là phương án mặc định. Chỉ đổi nếu xuất hiện một constraint mới đủ mạnh, ví dụ bắt buộc attribution pháp lý cho bản dịch hoặc người dịch nhất quyết phải sửa kinh văn bằng Markdown thuần.

---

## 1. Mục tiêu & nguyên tắc hệ thống

Dự án xây bản dịch Tipiṭaka Pāli sang tiếng Việt, ưu tiên dễ hiểu, dễ đọc, có thể duy trì lâu dài và phát hành đồng thời dưới ba dạng:

- website tĩnh để đọc, tìm kiếm và đối chiếu Pāli–Việt;
- EPUB 3 cho e-reader;
- PDF chất lượng cao cho tải về và in.

### 1.1. “Single source of truth” phải hiểu đúng

Không phải mọi thứ phải nằm trong một loại file. Quy tắc đúng là:

> **Mỗi lớp dữ liệu có đúng một nguồn có thẩm quyền, và mọi output đều được sinh ra, không sao chép thủ công.**

Cụ thể:

- Pāli root: upstream snapshot đã pin;
- bản dịch Việt: một file segmented JSON cho mỗi text;
- metadata biên tập: một file metadata cho mỗi text;
- glossary: một nguồn glossary;
- website / EPUB / PDF: derived artifacts, không bao giờ sửa trực tiếp.

### 1.2. Segment ID là “xương sống”

Bài kinh không chỉ được nhận diện bằng `mn118`; từng đoạn dịch được gắn vào segment chuẩn:

```json
{
  "mn118:1.1": "Tôi nghe như vầy—",
  "mn118:1.2": "Một thời, Thế Tôn trú tại ..."
}
```

Pāli upstream dùng cùng khóa:

```json
{
  "mn118:1.1": "Evaṁ me sutaṁ—",
  "mn118:1.2": "ekaṁ samayaṁ bhagavā ..."
}
```

Web, sách song ngữ, comments, variant và notes đều join bằng segment ID. Segment ID đã tồn tại thì **không tự ý đổi**.

### 1.3. Không tự phát minh ID hoặc thứ tự kinh

Canonical UID phải lấy nguyên từ catalog/upstream: `mn1`, không phải `mn01`; `sn56.11`, không phải số decimal dùng để sort.

Không dùng `number: 56.11` làm khóa sort. Thứ tự đọc lấy từ canonical catalog/tree snapshot.

---

## 2. Mô hình dữ liệu

### 2.1. Bản dịch Việt — canonical content

Ví dụ:

```text
content/translation/vi/project/sutta/mn/mn118_translation-vi-project.json
```

```json
{
  "mn118:0.1": "Trung Bộ Kinh 118",
  "mn118:0.2": "Kinh Niệm Hơi Thở",
  "mn118:1.1": "Tôi nghe như vầy—",
  "mn118:1.2": "Một thời, Thế Tôn trú tại Sāvatthī ..."
}
```

Quy tắc:

- UTF-8;
- normalize Unicode về NFC trước validate/commit;
- key phải là segment ID có thật trong root source;
- key order theo canonical source để diff dễ đọc;
- không nhét Pāli vào file dịch;
- không nhét HTML/layout vào bản dịch;
- markup nội tuyến chỉ dùng subset đã định nghĩa rõ và có validator.

### 2.2. Metadata biên tập — một file/text

```text
content/meta/sutta/mn/mn118.yaml
```

```yaml
uid: mn118
status: review
translationTitle: "Kinh Niệm Hơi Thở"
translators:
  - "Nguyễn Văn A"
reviewers:
  - "Nguyễn Văn B"
reviewedAt: 2026-09-10
tags:
  - anapanasati
  - satipatthana
```

Không lưu lại những dữ liệu có thể lấy chắc chắn từ canonical catalog như Pāli title, collection hierarchy hoặc canonical order, trừ khi đây là override có chủ ý.

Không cần trường `revision` bằng số. Git commit, tag và release manifest là revision history thực.

### 2.3. Ghi chú người dịch

Nếu cần footnote/comment theo segment:

```text
content/comment/vi/project/sutta/mn/mn118_comment-vi-project.json
```

```json
{
  "mn118:1.2": "Thuật ngữ này có thể dịch theo hai cách ..."
}
```

Giữ comment tách khỏi translation giúp bản dịch sạch, diff rõ và có thể bật/tắt chú giải theo từng output.

### 2.4. Glossary

```text
content/glossary/pali-vi.yaml
```

```yaml
citta:
  preferred: "tâm"
  allowed: ["tâm", "tâm ý"]
  severity: warn
  note: "Không cưỡng ép một từ Việt cho mọi ngữ cảnh."

vedana:
  preferred: "thọ"
  severity: warn
```

**Glossary mặc định là QA warning, không phải regex luật sắt.** Pāli phụ thuộc ngữ cảnh. Chỉ một danh sách nhỏ `severity: error` được phép block CI khi nhóm biên tập chủ động xác nhận đó là invariant.

---

## 3. Nguồn Pāli & provenance

Không copy Pāli thủ công vào từng bài dịch.

Dùng một manifest pin upstream:

```text
source/suttacentral.lock.json
```

```json
{
  "repo": "https://github.com/suttacentral/bilara-data.git",
  "ref": "published",
  "commit": "<exact-commit-sha>",
  "paths": [
    "root/pli/ms",
    "html/pli/ms"
  ]
}
```

`scripts/sync-source.ts` fetch đúng commit và đúng path cần dùng vào cache build:

```text
.cache/upstream/suttacentral/
```

Không fetch `latest` trong build release.

Mỗi release phải ghi lại:

- source repository;
- exact commit;
- root edition/source;
- license/provenance tương ứng;
- hash của source manifest.

Nếu một phần Vinaya/Abhidhamma hoặc nguồn khác không nằm trong cùng corpus/schema, viết **adapter** vào internal model; không phát minh quy ước ID mới để ép dữ liệu vào MN/SN model.

---

## 4. Internal Canon Model

Build pipeline không để Astro hay Pandoc tự hiểu raw files. Một lớp domain duy nhất compose dữ liệu:

```ts
export interface CanonSegment {
  id: string;              // mn118:1.1
  pali?: string;
  vi: string;
  commentVi?: string;
  blockType?: "title" | "heading" | "paragraph" | "verse" | "list";
}

export interface CanonDocument {
  uid: string;             // mn118
  pitaka: string;
  collection: string;      // mn
  canonicalOrder: number;
  paliTitle?: string;
  viTitle: string;
  status: "draft" | "review" | "published";
  segments: CanonSegment[];
}
```

Tất cả output chỉ đọc `CanonDocument[]`.

Đây là seam quan trọng nhất của hệ thống: nếu sau này đổi source corpus, Astro, Pandoc hoặc editor, nội dung và business rules không phải đổi cùng lúc.

---

## 5. Cấu trúc repository chốt

```text
pali-canon/
├── package.json
├── package-lock.json
├── astro.config.mjs
│
├── src/
│   ├── content.config.ts            # guides/site content nếu dùng Astro Content Layer
│   ├── components/
│   │   ├── SuttaHeader.astro
│   │   ├── Segment.astro
│   │   ├── PaliToggle.astro
│   │   ├── ParallelView.astro
│   │   └── NavCanon.astro
│   ├── layouts/
│   │   └── Base.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── sutta/[...slug].astro
│   │   └── search.astro
│   ├── lib/
│   │   └── canon/
│   │       ├── types.ts
│   │       ├── catalog.ts
│   │       ├── source.ts
│   │       ├── compose.ts
│   │       └── load.ts
│   └── styles/
│       ├── typography.css
│       └── prose.css
│
├── content/
│   ├── translation/
│   │   └── vi/project/...
│   ├── meta/...
│   ├── comment/
│   │   └── vi/project/...
│   ├── glossary/
│   │   └── pali-vi.yaml
│   └── guides/
│       ├── quy-uoc-dich.md
│       ├── editorial-workflow.md
│       └── markup.md
│
├── source/
│   ├── suttacentral.lock.json
│   └── catalog.snapshot.json
│
├── books/
│   ├── mn-vol-1.yaml
│   ├── dn-vol-1.yaml
│   └── dhp.yaml
│
├── pandoc/
│   ├── epub.defaults.yaml
│   ├── pdf.defaults.yaml
│   ├── epub.css
│   └── templates/
│       └── book.typ
│
├── scripts/
│   ├── sync-source.ts
│   ├── validate.ts
│   ├── build-book.ts
│   ├── build-release-manifest.ts
│   └── check-font-glyphs.ts
│
├── public/
│   └── fonts/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│       ├── prose/
│       ├── verse/
│       └── long-sutta/
│
├── .cache/                          # gitignore
├── dist/                            # gitignore
└── exports/                         # gitignore
```

---

## 6. Website

### 6.1. Stack

- Astro **7.x current stable**, lock exact dependency version bằng package lock;
- static output / SSG;
- TypeScript strict;
- không database;
- không SSR;
- không authentication ở public reader;
- client-side JS chỉ cho search, Pāli toggle và interaction thật sự cần thiết.

Astro Content Layer có thể dùng cho `guides/`, nhưng **canonical scripture data đi qua `src/lib/canon`**, không ép qua Markdown renderer.

### 6.2. URL

Canonical URL:

```text
/sutta/mn/mn118/
/sutta/sn/sn56/sn56.11/
```

URL dùng exact UID. Không zero-pad chỉ để Finder sort đẹp.

### 6.3. Pāli–Việt reader

Ba mode:

- Việt only;
- interlinear: Pāli rồi Việt theo segment;
- parallel: hai cột trên desktop, stacked theo segment trên mobile.

Không làm “một khối Pāli + một khối Việt”. Căn chỉnh luôn ở segment level.

### 6.4. Search

Pagefind index HTML sau Astro build.

Index:

- Vietnamese translation;
- Pāli text;
- Vietnamese/Pāli title;
- UID;
- metadata filters: pitaka, collection, status.

Để `exactDiacritics=false` mặc định để người dùng gõ không dấu vẫn có cơ hội tìm được từ có dấu. UI tiếng Việt dùng Pagefind localization.

---

## 7. EPUB / PDF pipeline

### 7.1. Publication manifest là schema của dự án, không phải Pandoc defaults

```text
books/mn-vol-1.yaml
```

```yaml
id: mn-vol-1
title: "Trung Bộ Kinh — Tập I"
lang: vi
selection:
  from: mn1
  to: mn50
statuses: [published]
pali: none                 # none | interlinear | parallel
comments: endnotes
cover: public/covers/mn-vol-1.jpg
license: CC0-1.0
```

`build-book.ts` đọc manifest, load `CanonDocument`, rồi sinh intermediate document vào `.cache/books/`.

Intermediate là generated artifact, **không commit và không sửa tay**.

### 7.2. Pandoc defaults tách riêng

```text
pandoc/epub.defaults.yaml
pandoc/pdf.defaults.yaml
```

Ví dụ EPUB:

```yaml
from: markdown
standalone: true
toc: true
toc-depth: 2
to: epub3
css:
  - pandoc/epub.css
```

Ví dụ PDF:

```yaml
from: markdown
standalone: true
toc: true
pdf-engine: typst
template: pandoc/templates/book.typ
```

Invocation:

```sh
pandoc --defaults pandoc/epub.defaults.yaml \
  .cache/books/mn-vol-1.md \
  -o exports/mn-vol-1.epub

pandoc --defaults pandoc/pdf.defaults.yaml \
  .cache/books/mn-vol-1.md \
  -o exports/mn-vol-1.pdf
```

Không đặt `input-files` vào publication metadata rồi gọi nó bằng `--metadata-file`.

### 7.3. PDF engine

**Typst là engine duy nhất ở v1.**

Không thêm WeasyPrint song song trước khi có một lỗi layout in thực tế mà Typst không giải quyết tốt. Hai engine đồng thời tạo hai hệ typography cần QA, một dạng complexity chưa có bằng chứng cần thiết.

---

## 8. Typography

### Web

- Body: Literata;
- UI: Be Vietnam Pro;
- fallback: Noto Serif / system;
- body 18–19px;
- line-height khoảng 1.7–1.8;
- measure khoảng 68–72ch;
- Pāli có thể dùng cùng serif để tránh baseline mismatch.

### Print

- body 11–11.5pt;
- line-height khoảng 1.4–1.5;
- spacing và heading scale được kiểm soát trong Typst template.

### CI glyph test

Validator phải kiểm tra font chứa các glyph tối thiểu:

```text
ề ệ ở ứ ự đ
ā ī ū ṃ ṅ ñ ṭ ḍ ṇ ḷ
```

Trước release đầu tiên: smoke test trên Apple Books + ít nhất một Kindle/e-ink reader.

---

## 9. Workflow biên tập

```text
draft → review → published
```

### Quy tắc

`draft`: người dịch/AI đang làm; có thể thiếu segment.  
`review`: đủ segment cần thiết, đang được con người rà.  
`published`: được phép vào production website và sách release.

Preview deployment có thể hiển thị `draft/review` với banner rõ ràng. Production public mặc định chỉ index và đưa vào sách `published`.

Một PR chuyển `status` sang `published` phải pass toàn bộ blocking checks.

---

## 10. Validation — phần phải nghiêm nhất

### Blocking checks

- UID hợp lệ và tồn tại trong pinned catalog;
- translation file path khớp UID;
- mọi segment ID thuộc đúng UID;
- segment ID tồn tại trong root source;
- không duplicate/orphan segment;
- JSON/YAML/schema hợp lệ;
- Unicode NFC;
- published text không thiếu translation segment ngoài whitelist structural segments;
- title metadata không mâu thuẫn canonical identity;
- comment reference không orphan;
- link nội bộ không broken;
- web build thành công;
- EPUB/PDF smoke build trên representative fixtures thành công.

### Warning checks

- glossary preferred terms;
- câu quá dài bất thường;
- punctuation/quote style;
- Pāli token còn sót trong Vietnamese segment ngoài whitelist;
- translator/reviewer metadata thiếu nhưng chưa đến trạng thái published.

### Golden fixtures

Luôn có ít nhất ba text đại diện trong CI:

1. prose bình thường;
2. verse/gāthā;
3. text dài có heading/comment/footnote.

Mục tiêu là pipeline sách không bị “đến ngày release mới phát hiện hỏng”.

---

## 11. License & provenance

### Bản dịch mới của dự án

**Chốt CC0-1.0** nếu khả năng đóng góp hoặc đồng bộ với SuttaCentral là mục tiêu thật sự.

Trade-off: CC0 cho phép phổ biến tối đa nhưng không ép attribution/share-alike bằng license. Attribution vẫn có thể là chuẩn đạo đức/editorial của dự án và được ghi trong metadata, nhưng không phải constraint pháp lý kiểu CC BY-SA.

Nếu sau này xác định **bắt buộc attribution pháp lý**, đổi quyết định license trước khi phát hành public corpus đầu tiên. Không đổi license tùy tiện sau khi đã có nhiều contributor.

### Code

MIT.

### Upstream / fonts / covers / existing Vietnamese translations

Mỗi loại giữ license/provenance riêng. Không suy ra rằng vì repository hoặc dự án dùng CC0 thì mọi third-party material cũng tự động là CC0.

Không nhập bản dịch Việt hiện có nếu chưa có license hoặc permission phù hợp.

---

## 12. CI/CD chốt

### Pull Request

GitHub Actions chạy:

```text
sync pinned source
→ validate
→ unit/integration tests
→ Astro build
→ Pagefind build
→ smoke EPUB
→ smoke PDF
```

Sau đó tạo preview deployment.

### Merge `main`

```text
validate full corpus
→ Astro SSG
→ Pagefind
→ deploy Cloudflare Pages
```

### Tag `v*`

```text
validate full corpus
→ build all publication manifests
→ EPUB + PDF
→ generate release manifest + checksums
→ attach GitHub Release artifacts
```

Sách đầy đủ chỉ build trên release tag, nhưng **smoke book build vẫn chạy mỗi PR**.

---

## 13. Những gì cố ý KHÔNG làm ở v1

Không backend/database.  
Không CMS.  
Không SSR.  
Không hai PDF engine.  
Không nhiều Vietnamese translation versions trong cùng project namespace.  
Không hard-enforce toàn bộ glossary.  
Không copy Pāli vào translation files.  
Không zero-pad UID.  
Không tạo manual hierarchy riêng nếu canonical catalog đã có.  
Không tối ưu mobile app/offline app trước khi reader web và content pipeline ổn định.

---

## 14. Vertical slice phải làm trước

Không scaffold toàn bộ Tipiṭaka ngay. Build **một lát cắt hoàn chỉnh bằng MN 118** vì nó đủ để kiểm tra identity, segment alignment, Pāli toggle, prose, search, EPUB/PDF và workflow review.

Definition of Done cho vertical slice:

```text
pinned upstream source
+ mn118 Vietnamese segmented JSON
+ metadata draft/review/published
+ Astro page /sutta/mn/mn118/
+ Việt / interlinear / parallel modes
+ Pagefind search
+ one EPUB
+ one PDF Typst
+ validation rejects a deliberately broken segment ID
+ CI green
+ Cloudflare preview deployed
```

Chỉ sau khi vertical slice pass mới import/scaffold hàng nghìn text.

---

## 15. Stop/continue gate

### Continue

Kiến trúc được xem là đạt khi:

- sửa một Vietnamese segment → web + EPUB + PDF đều phản ánh đúng mà không copy tay;
- Pāli và Việt luôn align bằng segment ID;
- đổi upstream commit là một thao tác explicit, reproducible;
- build lại cùng commit + same lockfile cho cùng nội dung;
- contributor không thể publish một text có segment orphan/missing nghiêm trọng;
- một release có manifest + checksums + source provenance.

### Stop và thiết kế lại nếu

- translator workflow với raw JSON tạo ma sát lớn đến mức lỗi cú pháp/escaping trở thành bottleneck thường xuyên;
- SuttaCentral segment model không bao phủ hợp lý corpus mục tiêu ở một pitaka lớn;
- Typst không đáp ứng yêu cầu in thực tế sau khi đã thử custom template;
- build time/memory của full corpus vượt ngưỡng thực tế của CI/hosting.

Nếu vấn đề đầu tiên xảy ra, **không đổi canonical format về Markdown ngay**; ưu tiên làm editor nhỏ hoặc form-based editing ghi ra Bilara JSON. Canonical data model vẫn giữ nguyên.

---

## 16. ADR tóm tắt

| ADR | Quyết định | Trạng thái |
|---|---|---|
| ADR-001 | Exact SuttaCentral UID, không zero-pad | ✅ Chốt |
| ADR-002 | Immutable segment IDs là alignment key | ✅ Chốt |
| ADR-003 | Bilara-compatible JSON là canonical Vietnamese scripture | ✅ Chốt |
| ADR-004 | Markdown chỉ cho guides/editorial prose | ✅ Chốt |
| ADR-005 | Pāli upstream pinned commit, read-only | ✅ Chốt |
| ADR-006 | Astro 7.x SSG | ✅ Chốt |
| ADR-007 | Pagefind static search | ✅ Chốt |
| ADR-008 | Pandoc EPUB + Typst PDF | ✅ Chốt |
| ADR-009 | Publication manifest tách khỏi Pandoc defaults | ✅ Chốt |
| ADR-010 | Cloudflare Pages + GitHub Actions | ✅ Chốt |
| ADR-011 | draft/review/published, Git là revision history | ✅ Chốt |
| ADR-012 | Glossary warning-first | ✅ Chốt |
| ADR-013 | CC0 translation text nếu giữ mục tiêu SuttaCentral interoperability | ✅ Chốt |
| ADR-014 | Vertical slice MN118 trước khi scale | ✅ Chốt |

---

## 17. Các lỗi trong bản draft cũ đã sửa trong kiến trúc này

1. `dn01`, `mn01`, `an01.01` không phải canonical SuttaCentral UID; bỏ zero-padding.
2. Ví dụ `mn10 = Ānāpānassati Sutta` sai identity; Ānāpānassati là `mn118`, còn `mn10` là Satipaṭṭhānasutta.
3. `content.config.ts` chuyển vào `src/content.config.ts` nếu dùng Astro Content Layer.
4. Không phụ thuộc remark plugin/fenced div làm canonical data contract.
5. `status=translated` bị dùng trong pipeline nhưng không có trong schema; chuẩn hóa về `draft/review/published`.
6. `input-files` là Pandoc defaults option, không trộn với publication metadata.
7. Glossary không được phép hard-fail mọi khác biệt ngữ nghĩa.
8. Không chạy hai PDF pipelines khi chưa có nhu cầu thật.
9. Pāli–Việt phải align theo segment, không chỉ đặt hai block cạnh nhau.
10. License được chốt theo mục tiêu interoperability thay vì chọn mặc định CC BY-SA mà chưa xét SuttaCentral contribution path.

---

## 18. Tài liệu kỹ thuật đã kiểm chứng khi chốt

- SuttaCentral Bilara data model: https://github.com/suttacentral/bilara-data
- Example `mn1` segmented Pāli: https://github.com/suttacentral/bilara-data/blob/published/root/pli/ms/sutta/mn/mn1_root-pli-ms.json
- Astro 7: https://astro.build/blog/astro-7/
- Astro content loaders: https://docs.astro.build/en/reference/content-loader-reference/
- Pandoc manual: https://pandoc.org/MANUAL.html
- Pagefind multilingual/search config: https://pagefind.app/docs/multilingual/
- Cloudflare Pages + Astro: https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/
