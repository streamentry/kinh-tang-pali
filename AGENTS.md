# AGENTS.md

Repository này xây bản dịch Kinh tạng Pāli tiếng Việt mới, ưu tiên **Kinh Trung Bộ (Majjhima Nikāya)** trước, đồng thời giữ cấu trúc mở rộng cho năm Nikāya.

## Bắt buộc đọc trước khi làm việc

Mọi tác vụ liên quan đến dịch, sửa/review bản dịch, chọn thuật ngữ, viết chú thích hoặc đổi trạng thái `draft` / `review` / `published` **phải đọc đầy đủ [`skill/translation.md`](skill/translation.md) trước khi chỉnh nội dung**.

`skill/translation.md` là chuẩn có thẩm quyền cho mục tiêu dịch, hierarchy nguồn, provenance, phương pháp đối chiếu Pāli/English/Thích Minh Châu, semantic audit, văn phong và Definition of Done. Phương pháp QC/chấm điểm và quality gate quyết định trạng thái xuất bản nằm ở [`docs/quality-assessments.md`](docs/quality-assessments.md); mục **Translation Quality Gate** bên dưới chỉ tóm tắt.

## Chuẩn thiết kế website

Mọi tác vụ sửa giao diện, trang, component, CSS, điều hướng hoặc reader phải đọc
đầy đủ [`DESIGN.md`](DESIGN.md) trước khi chỉnh. Đây là chuẩn thiết kế duy nhất:
registry token ở `source/design-tokens.json`, CSS sinh bằng `npm run design:generate`,
component dùng chung `public/styles/global.css`; `npm run design:check` là cổng CI.
Giữ các contract provenance, segment, layer, tra cứu toàn văn và audio bên dưới.
Không đổi kinh văn hay trạng thái chất lượng trong một tác vụ chỉ sửa thiết kế.
Trước khi hoàn tất redesign, kiểm tra browser desktop/mobile và các mode reader
như ma trận trong `DESIGN.md`; không coi build pass là bằng chứng giao diện đã đúng.

## Invariants của repository

- Pāli source là snapshot SuttaCentral/Bilara được pin bởi `source/suttacentral.lock.json`; không dùng bản Pāli không rõ provenance làm authority.
- Mọi tầng tham khảo (English SuttaCentral) cũng phải được pin cùng commit trong `source/suttacentral.lock.json` dưới `referenceEditions`, với `authority: false`, và phải sync/audit ở **mức segment**; thiếu tầng tham khảo là lỗi chặn đối với `review`/`published`.
- **Mọi edition đã ghim phải khai `license`.** SuttaCentral đặt "đại đa số các bản dịch kinh văn" vào nhóm bản quyền của bên thứ ba, nên hiển thị bản tham khảo mà không nói điều khoản là lỗ hổng tuân thủ, không phải thiếu hình thức. `assertStoreIntegrity` chặn khi thiếu `holder`, `basis` hoặc `statementFrom`, và chặn cả khi một bản tham khảo bên thứ ba lại ghi `CC0-1.0`.
- Khi không có giấy phép máy đọc được, ghi `NOASSERTION` — **đừng đoán**. `translation/vi/phantuananh/` và `translation/en/sujato/` không kèm trường giấy phép tại commit đã ghim.
- Công cụ hỗ trợ chỉ được khai trong `source/tooling.yaml`, và **mọi trang phải đọc từ đó** — không viết tên công cụ vào markup. Ba chỗ từng ghi tay đã lệch nhau (561 file metadata ghi ChatGPT, file mới ghi OpenCode, website chỉ ghi ChatGPT) và không gì bắt được. `tests/unit/tooling.test.ts` chặn cả hai chiều: công cụ nào nêu trong `content/meta` thì phải khai, và công cụ nào khai thì phải được ghi ở đâu đó trên site.
- **Không sửa attribution lịch sử.** 561 file metadata ghi ChatGPT vì đó là công cụ đã làm ra chúng; đổi sang công cụ sau là bịa bộ sử lịch sử. Số file theo từng công cụ được pin trong test.
- Tên phiên bản mà repository không kiểm chứng được (ví dụ `Muse Spark 1.3 Free`) phải mang `declaredBy: user-declared`, và site nói thẳng là do người biên tập khai.
- **Giấy phép của chính dự án khai ở `source/suttacentral.lock.json` dưới `projectLicense`, không gõ tay vào trang.** Code và nội dung dịch vốn đã mang hai điều khoản khác nhau — `LICENSE` là MIT, còn bản dịch là CC0-1.0 — và CC0 từng xuất hiện ở bốn chỗ, hai cách viết. `npm run license:generate` sinh `NOTICE` từ lock; `npm run license:check` (đã có trong CI) fail nếu file đó lệch. **Đổi giấy phép là việc của người biên tập, sửa lock chứ đừng sửa trang.**
- **`NOTICE` không được để CC0 của ta nuốt mất bản dịch của người khác.** Sujato và Thích Minh Châu phải luôn được ghi là *không* thuộc điều khoản CC0 của dự án, và phải nêu tên người nắm bản quyền. `tests/unit/licence-notice.test.ts` chặn cả việc đưa một đường dẫn upstream vào `projectLicense.content.covers`, lẫn việc gán CC0 cho một edition bên thứ ba.
- Bản `NOTICE` phục vụ trên site là `/notice.txt`, sinh từ **cùng hàm** với file trong repo, nên không thể lệch; test so byte-for-byte khi `dist/` đã có.
- **Credit là HAI sự thật, không phải một chuỗi: ai dịch, và lấy từ đâu.** Không suy cái này từ cái kia. Với 26 chương Pháp Cú, câu phải đủ nghĩa *"của Hòa thượng Thích Minh Châu"* **và** *"lấy từ SuttaCentral"* — bỏ vế đầu là trao tác phẩm của Ngài cho SuttaCentral. Tác giả đứng trước để người đọc dừng lại được. Tác phẩm của dự án thì **không** có "nơi lấy": chính mình phân phối, ghi vào là khẳng định sai. Chi tiết và ví dụ: `skill/translation.md` §7.1.
- **Nguồn Việt ngoài SuttaCentral phải ghi tác giả theo từng bài, không theo trang.** `budsas.org/uni/` phân phối 5 bộ Nikāya của Hòa thượng Thích Minh Châu, nhưng tập Tiểu Bộ II thuộc **GS Trần Phương Lan**, tập VI–VII **hai người cùng dịch**, tập VIII là GS Trần Phương Lan. Ghi chung một tên cho cả bộ là ghi công cho Ngài những trang Ngài không dịch. Đây là lý do credit phải là **per-text**, không phải per-layer. `skill/translation.md` §7.2.
- **Nguồn sao chép phải được ghi là nguồn sao chép.** Bản gốc in 1973–1991 (Đại Tạng Kinh Việt Nam) và 2026 vẫn có bản in thương mại; `budsas.org` là bản sao của bên thứ ba. `NOTICE` phải tách *tác giả* · *nguồn lấy* · *bản xuất bản gốc* và nói thẳng đây là nguồn sao chép — đúng thứ SuttaCentral yêu cầu ở `licensing:10`.
- **Không có giấy phép máy đọc được thì `NOASSERTION`, kèm lý do.** `budsas.org` không có tuyên bố quyền tác giả. Không suy ra CC0, không suy ra "dùng tự do". `assertStoreIntegrity` đã chặn bản tham khảo bên thứ ba tự nhận CC0.
- **Nguồn không phải git thì ghim yếu hơn, và phải gọi đúng tên là yếu hơn.** Tầng này ghi URL · thời điểm tải · SHA-256 từng file · `ETag`/`Last-Modified`. Tái tải thấy khác thì cảnh báo, nhưng **không** chứng minh được lịch sử nội dung như một commit git. Không được trình bày pin đó ngang hàng pin bilara.
- **Nguồn tra cứu toàn văn khai ở `source/external-references.yaml`, KHÔNG phải ở `layers.yaml`.** Tầng store thì hàm ý có text ở mức segment; một trang văn xuôi liên tục thì không, và đưa nhầm vào đó sẽ làm **coverage tăng vì text không so sánh được ở mức segment** mà không ai nhận ra. `tests/unit/external-reference.test.ts` chặn cả hai chiều và so snapshot trước/sau khi resolve. `alignment: none` là nghĩa đen — đừng hạ xuống thành giá trị khác.
- **Việt hiện hành: phân đoạn thì vào cột, nguyên bài thì xuống cuối trang.** Quyết định của người biên tập ngày 2026-10-08; xem mục *Việt hiện hành: cột và nguyên bài* bên dưới trước khi đụng vào cột Việt hiện hành, mục Tra cứu toàn văn hay `legacyHtml`.
- **Cắt HTML thành segment ID phải chứng minh được, không giả định.** Cắt lệch một đoạn thì bốn cột đối chiếu hiện sai âm thầm và người đọc không có cách nào biết. Không cắt tay rồi tin; phải đếm được bao nhiêu segment khớp và bao nhiêu không.
- Một tầng tham khảo có file và key đúng vẫn có thể **không có prose** ở những đoạn Pāli có nội dung. Vì vậy phải đo coverage trên Pāli có nội dung; dưới ngưỡng thì `review`/`published` bị chặn trừ khi mất mát đã được **ghi nhận** trong `content/meta/reference-gaps.yaml`. Không được coi chỗ English rỗng là sự đồng thuận về cách dịch.
- Canonical Vietnamese scripture là segmented JSON trong `content/translation/vi/project/`.
- Giữ nguyên canonical SuttaCentral UID và segment ID; không zero-pad hoặc tự phát minh ID.
- Không copy Pāli vào translation JSON.
- Workflow dịch mặc định là đối chiếu **Pāli root + ít nhất một bản English SuttaCentral phù hợp + bản Hòa thượng Thích Minh Châu khi có**, rồi viết một bản tiếng Việt mới.
- English và bản Thích Minh Châu là reference layers quan trọng; **Pāli root là authority cuối cùng** khi các nguồn bất đồng.
- Không chỉ dịch vòng English → Vietnamese rồi bỏ qua Pāli.
- Không chỉ hiện đại hóa hoặc thay từ đồng nghĩa trên bản Thích Minh Châu rồi coi đó là bản dịch mới.
- Có thể giữ Hán–Việt khi đúng, quen thuộc và súc tích; giảm Hán–Việt khi nó làm câu tối nghĩa mà không tăng độ chính xác.
- Không tự thêm explanatory meaning để làm câu “dễ hiểu”. Giải thích, alternative reading và uncertainty thuộc lớp comment/glossary.
- Không copy nguyên văn dài từ bản dịch bên thứ ba vào canonical translation; mọi nguồn tham khảo quan trọng phải có provenance phù hợp.

---

# Việt hiện hành: cột và nguyên bài (quyết định 2026-10-08)

Người biên tập đã quyết định, **đừng làm lại theo cách khác** nếu chưa hỏi lại:

1. **Bản Việt nào SuttaCentral có *phân đoạn* (bilara-data, `translation/vi/<dịch giả>/`) thì hiện
   trong cột "Việt hiện hành", từng segment.** Đây là tầng `vietnamese-current` trong
   `source/layers.yaml`. Tại commit đang ghim, và cả ở bilara-data `published` ngày 2026-10-07,
   chỉ có một bản như vậy: Pháp Cú, `phantuananh`, 26 tệp.
2. **Bản Việt *không phân đoạn* (HTML nguyên bài) thì KHÔNG vào cột.** Nó hiện nguyên bài ở mục
   *Tra cứu toàn văn* **cuối trang**, dưới bảng đối chiếu. Thẻ cột Việt hiện hành khi trống có một
   dòng chỉ xuống đó (`#tra-cuu-toan-van`). Đừng đưa mục này lên trên bảng, đừng gom nó vào cột.
3. **Không tự căn lề bản nguyên bài vào segment**, kể cả "căn tự động có gắn nhãn". Người biên tập
   đã được hỏi và chọn không làm. Lý do đã đo, không phải đoán:
   - SuttaCentral tự nó không chia các bản này theo câu: API ghi `segmented: false` cho cả 4.815 tệp.
   - MN chỉ có neo `sc1…` theo cách đánh số cũ, bilara không dùng (mn1: 26 neo, Pāli 194 đoạn).
   - DN có neo `pts-cs` nhưng chỉ khớp 769/1.489 với tệp `reference/` của bilara, số lượng cũng lệch.
   - SN (`vi-n`, `pts`), AN (`ttc`), KN (`bjt`) dùng hệ neo không có trong bilara.
   - Số khối HTML bằng số đoạn Pāli chỉ ở 1/152 MN và 0/34 DN.

**Nguồn nguyên bài.** Kho `suttacentral/sc-data`, `html_text/vi/pli/sutta`, ghim theo commit ở
`legacyHtml` trong `source/suttacentral.lock.json` (4.815 tệp). `npm run legacy:sync` tải về
`.cache/upstream/sc-data` bằng sparse git checkout (git tự xác minh từng tệp; script kiểm HEAD, số tệp,
tệp bị sửa); `npm run legacy:check` chỉ kiểm. CI chạy `legacy:sync` trước test; `build` và `dev`
cũng chạy. Bộ trích xuất `src/lib/canon/legacy-vi.ts` chỉ lấy chữ, không bao giờ đưa HTML lên trang.

**Ghi công đọc từ chân trang của từng tệp, không suy từ bộ kinh.** Ba khai báo trong
`source/external-references.yaml`:

| Khai báo | Dòng tác giả trong tệp | Tệp |
| --- | --- | --- |
| `suttacentral-vi-minh-chau-binh-anson` | Hòa thượng Thích Minh Châu dịch Việt; Bình Anson hiệu đính | 187 (MN, DN, snp3.7) |
| `suttacentral-vi-minh-chau` | Hòa thượng Thích Minh Châu | 3.211 (SN, AN, 11 KN) |
| `suttacentral-vi-indacanda` | Bhikkhu Indacanda | 1.417 (KN); URL dùng mã `indacanda`, không phải `minh_chau` |

Gần như toàn bộ Tiểu Bộ ở đó là của **Bhikkhu Indacanda**; ghi cho Hòa thượng Thích Minh Châu là ghi
công sai. Chỉ MN/DN mang dòng Bình Anson. Chân trang được in nguyên văn dưới bản văn.
"Used by kind permission" là sự cho phép dành cho SuttaCentral, **không phải giấy phép cho dự án**:
điều khoản vẫn là `NOASSERTION`.

**Tệp gộp.** SuttaCentral gộp nhiều bài vào một tệp (`an1.1`–`an1.10` là `an1.1-10`), trùng với tệp
Pāli đã ghim (`CanonDocument.sourceKey`). Trang `an1.5` hiện cả tệp chung và nói rõ đã gộp, không tách.

**Phạm vi đã đếm** (trang đọc có bản nguyên bài): MN 152/152, DN 34/34, SN 1.805/1.819, AN 1.768/1.781
(411 qua tệp gộp), KN 1.429/2.351. `tests/unit/external-reference.test.ts` khoá các số này.

**Khi đổi pin bilara.** `npm run manifest:fetch` ghi `vietnameseTranslators` (mọi thư mục dưới
`translation/vi` tại commit ghim). `tests/unit/vietnamese-segmented.test.ts` fail nếu có dịch giả Việt
phân đoạn mới mà chưa tầng nào đọc: khi đó **mở rộng tầng `vietnamese-current`** và khai giấy phép trong
lock, để bài đó vào cột theo quy tắc 1. Nếu một bài có cả bản phân đoạn lẫn nguyên bài, cột hiện bản
phân đoạn và nguyên bài vẫn ở cuối trang.

**Khi đổi pin `sc-data`.** Cập nhật `commit` và `fileCount` trong `legacyHtml`, chạy lại nhóm tác giả
theo chân trang, rồi cập nhật `verifiedUids` của ba khai báo; test chặn uid trùng, tác giả lệch, số tệp lệch.

---

# Mục tiêu đang chạy: Translation store và lớp English của dự án

## Vì sao

Để mọi câu dịch đều có bối cảnh đầy đủ và truy ngược được về đúng nguồn, mỗi bài kinh phải
được đọc qua **một store nhiều tầng** thay vì lần lượt đi tìm từng bản dịch. Đồng thời, tại
commit bilara đang pin, bản Anh Sujato **để trống** nhiều đoạn Pāli có nội dung (blockquotes
và đoạn lược `…pe…`), và SuttaCentral không có bản Anh nào khác phủ được. Người dịch vì vậy
mất hẳn tầng tham khảo ở 136 bài. Dự án sẽ **tự dịch những đoạn đó sang English**.

## Store: năm tầng, một registry

Khai báo tập trung trong [`source/layers.yaml`](source/layers.yaml), theo thứ tự đọc:

| # | Tầng | Loại | Vai trò |
| --- | --- | --- | --- |
| 1 | `pali` | **authority** | Quyết định nghĩa cuối cùng |
| 2 | `english-sujato` | reference | Cú pháp, compound, sắc thái |
| 3 | `english-project` | project | Lấp chỗ Sujato chưa dịch |
| 4 | `vietnamese-current` | reference | Thuật ngữ truyền thống Việt |
| 5 | `vietnamese-project` | project | Bản dịch canonical của dự án |

Quy tắc bất di bất dịch:

- chỉ tầng `root` được `authority: true`; không tầng tham khảo nào được tự nhận là chuẩn;
- Pāli root là authority **cuối cùng** khi các tầng khác bất đồng;
- mọi tầng phải resolve được, và phải audit được ở **mức segment**, không chỉ mức file.

## Điều kiện bắt buộc trước khi bắt đầu dịch một bài

```bash
npm run store -- <uid>        # đọc bài qua toàn bộ store, kèm coverage
npm run audit:store           # kiểm kê mọi tầng
npm run audit:reference       # chi tiết coverage English
npm run verify:store          # đối soát bằng git hash, đếm mọi segment
```

Một bài chỉ nên bắt đầu dịch khi đã biết rõ: tầng nào có, tầng nào không có, coverage
English bao nhiêu, và chỗ nào phải dựa vào Pāli một mình.

## Bốn bản trong web reader

Trang bài kinh hiện ra **bốn bản** đối chiếu nhau, theo thứ tự đọc:

| cột | vai trò |
| --- | --- |
| Pāli | **nguồn chuẩn** |
| English | tham khảo (Sujato, chỗ trống thì bù bằng bản lấp của dự án) |
| Việt hiện hành | tham khảo (HT. Thích Minh Châu) |
| Việt 2026 | **bản canonical** — bản đang biên tập |

Quy tắc khi sửa reader:

- Pāli là tập key; mọi bản khác căn theo nó, nên đối chiếu luôn ở **mức segment**.
- Cột English ghép hai lớp theo đúng thứ tự `fillableSegments` dùng (Sujato trước, bản
  lấp của dự án chỉ đóng chỗ Sujato im lặng), và **mỗi segment mang theo lớp đã cung
  cấp nó** (`enFrom`). Đoạn do dự án bù phải được gắn nhãn là bản nháp của chúng ta,
  không bao giờ trộn vào bản Sujato đã xuất bản.
- Vắng mặt phải phân biệt `not-published-upstream` (giới hạn của bản chụp) với
  `not-synced` (tệp chưa tải về cache) với `not-started` (lớp dự án chưa có nội dung).
  Quyết định từ `source/upstream-manifest.json`, và trả "không biết" chứ không trả
  "không có" khi không suy ra được.
- Một bản tham khảo **im lặng ở một segment** phải hiện là lỗ hổng của bản dịch đó,
  khác với bản vắng mặt cả bài.
- Không giấu bản nào khỏi tìm kiếm; thay vào đó cho phép lọc theo bản và ghi rõ kết
  quả tìm được ở bản nào.
- Sách/EPUB chỉ lấy Pāli + Việt 2026; English và Việt tham khảo không được rò vào bản
  phát hành.

## Lớp `english-project`: bản dịch English của chính dự án

Đây là **bản dịch độc lập**, không phải nguồn SuttaCentral. Ràng buộc:

- chỉ điền cho segment mà tầng English đã pin **để trống**;
- **không bao giờ** ghi đè bản đã pin — `validate` chặn, `audit:store` báo `SHADOWING`;
- có trạng thái và quality scorecard riêng ở `content/meta/en/<collection>/<uid>.yaml`;
- chỉ tính vào coverage khi `published`;
- dịch từ Pāli, dùng bản Việt hiện hành để đối chiếu nghĩa, **giữ nguyên dấu lược** `…`
  của Pāli thay vì mở rộng;
- chấm `triangulation` thấp hơn bình thường, vì không có bản Anh độc lập để đối chiếu.

**Đừng dịch một segment khi tách nó khỏi bài.** Đây là cái bẫy thật sự của lớp lấp, và đã
bắt trúng một lần khi làm `sn11.24`:

- `sn11.24:1.7` là `“idha, bhette, dve bhikkhū sampayojesuṁ, tatreko bhikkhu accasarā.`
  Đọc riêng, `tatreko bhikkhu accasarā` rất dễ thành *"một tỳ-kheo là bậc trên về học"*
  và `accayaṁ accayato deseti` thành *"định nghĩa chữ 'bậc dưới'"* — nghe rất như một bài
  kinh về thứ bậc, và sẽ **mâu thuẫn với bản Việt đã publish** của chính bài đó.
- Không phải vậy. `1.7–1.8` là các tỳ-kheo **dẫn lại đoạn mở đầu** cho Đức Thế Tôn:
  `1.7` lặp lại `1.2` + `1.3`, `1.8` lặp lại `1.4` + `1.5`. Sujato dịch tiêu đề
  `Accayasutta` là *"Transgression"*, và cùng cấu trúc đó ở `1.2–1.5` mang đúng nghĩa đó.

Nên hai luật bắt buộc khi lấp:

1. **Segment nào Pāli đã xuất hiện ở nơi khác trong cùng bài thì phải dùng lại cách dịch
   đã có** cho chỗ đó, không dịch lại từ đầu. Nếu không, bài kinh sẽ tự mâu thuẫn.
2. **Trước khi dịch một segment, đọc nó trong bối cảnh bài** — segment liền trước và sau,
   tiêu đề bài, và bản Việt canonical. Chỉ `…pe…` mới được phép cắt khỏi bối cảnh.

Cả hai được kiểm bằng `tests/unit/english-fill.test.ts`.

**Không tự đánh bài của mình.** Khi bản lấp English và bản dịch Việt cùng do một người
hoặc một agent chấm, bản lấp **không phải cách đọc English độc lập**. `validate` cảnh báo
khi hai lớp trùng `assessed_by`, và scorecard tiếng Việt của bài đó **không được** tuyên bố
đã đối chiếu English.

## Coverage và gap

- Coverage đo trên **Pāli có nội dung** (≥ 40 ký tự, bỏ block tham chiếu `:0`), không phải
  mọi segment; ngưỡng khai trong `source/layers.yaml`.
- Bài `review`/`published` có coverage dưới ngưỡng mà chưa có entry trong
  `content/meta/reference-gaps.yaml` là **lỗi chặn**.
- Một ô English rỗng **không phải** sự đồng thuận về cách dịch. Chỗ đó Pāli phải tự đứng vững.

## Mọi khẳng định về corpus phải đếm được

Không được viết số vào tài liệu mà code không tái lập được. Trước khi nói "đã đủ" về một tầng,
chạy:

```bash
npm run verify:store     # đối soát bằng git hash, đếm và đối soát mọi segment
npm run catalog:check    # catalog phải phủ 100% snapshot đã pin
```

Sự thật đến từ `source/upstream-manifest.json` — git tree của commit đã pin, kèm git object
hash từng file — chứ không từ cache của chính dự án. Lý do: một vòng kiểm tra trước đã báo
xanh trong khi 2.715 bài kinh vốn không có trong repo, vì mọi kiểm tra đều duyệt qua catalog
mà không ai đo catalog ấy.

- Lệch **phải sửa** thì `verify:store` exit 1: cache không phải bản pin, segment thừa so với
  Pāli, edition đã pin thiếu segment, bản lấp English che bản đã pin, gap dưới ngưỡng chưa
  ghi nhận, authority bị đảo.
- **Giới hạn của upstream** thì in ra dưới dạng advisory, có số đếm cụ thể: edition không
  phủ hết bài (1.596 bài `kn` không có English; `vietnamese-current` chỉ có Pháp Cú). Không
  được trình bày như thiếu sót của repo, cũng không được bỏ qua.

## Definition of Done cho một lần lấp English

- [ ] Segment nằm trong `fillableSegments` (tầng đã pin để trống).
- [ ] Dịch từ Pāli; dấu lược `…` giữ nguyên.
- [ ] `content/meta/en/<collection>/<uid>.yaml` có `status` + quality scorecard 10 tiêu chí.
- [ ] `npm run validate` pass, không cảnh báo shadowing.
- [ ] `npm run reference:gaps` đã chạy lại; record gap không còn thừa.
- [ ] `npm run audit:store` không báo vấn đề nào.

Chi tiết store, số đo và hàng đợi: [`docs/translation-store.md`](docs/translation-store.md).

---

# Translation Quality Gate

**Chuẩn đầy đủ: [`docs/quality-assessments.md`](docs/quality-assessments.md).** Rubric 10 tiêu chí,
blocking errors, công thức điểm, bảng status, ba loại scope (`full` / `content` / `technical`), nơi
lưu và lệnh `npm run quality` đều định nghĩa ở đó, khớp với code trong `src/lib/canon/quality.ts` và
`scripts/lib/quality.ts`. `tests/unit/quality-doc.test.ts` chặn khi doc lệch code. Phần dưới chỉ là
những điều không được quên:

- Sau khi bài hoàn tất, làm **một lượt review đối kháng riêng** rồi mới chấm đủ 10 tiêu chí (0–10).
  Không chấm khi bản dịch còn dang dở.
- `final_score` = **trung bình số học thô** của 10 điểm; gate không dùng điểm đã làm tròn.
- **Blocker luôn thắng điểm**: có blocker → `draft`, kể cả 10/10. Không "bù" blocker bằng điểm khác.
- Không blocker: `> 9.0` → `published` trực tiếp · `8.0–9.0` → `review` · `< 8.0` → `draft`.
  **Đúng `9.0` không đủ để publish.** Chưa có scorecard đủ → `draft`.
- Human review khuyến khích nhưng **không bắt buộc**; agent được publish nếu vượt gate, không blocker.
- Ghi bằng `npm run quality -- --record`, chốt bằng `npm run quality -- --apply`. **Không sửa tay
  `meta.quality` hay `status` của bản Việt**, không ghi đè lịch sử chấm cũ. (Lớp lấp English
  ghi scorecard thẳng vào `content/meta/en/…`, cùng rubric và gate.)

## Trước khi hoàn tất hoặc publish nội dung

Chạy tối thiểu:

```bash
npm run validate
npm test
npm run check
```

Nếu thay đổi ảnh hưởng website/build pipeline hoặc bài sẽ `published`, chạy thêm:

```bash
npm run build
```

Chỉ sau khi technical gate pass mới được coi tiêu chí 10 là đạt và mới được đổi status theo quality gate.

## Push và CI: cổng thật là CI, không phải pre-push

ECC pre-push (`~/.codex/git-hooks/pre-push`) từng chạy `npm test` (~22s) và `npm run build`
(~3 phút: sync + validate + astro build + pagefind) cho **mỗi** `git push`, rồi CI chạy lại
đúng chừng đó cộng mười kiểm tra nội dung khác. Repo này đã tắt phần Node của hook đó, có
chủ đích:

```bash
git config ecc.prepush.skipNode true   # đã chạy trong clone chính; clone/worktree mới tự chạy lại
```

- Lệnh nằm ở `.git/config`, không theo repo — nên clone mới, worktree mới đều cần chạy một lần.
- Chỉ pre-push bị chặn; **pre-commit của ECC (quét secret) vẫn chạy** bình thường.
- Muốn buộc chạy lại toàn bộ battery cho đúng một lần push:
  `git -c ecc.prepush.skipNode=false push`.

Cổng thật là [`.github/workflows/ci.yml`](.github/workflows/ci.yml):

- chạy trên **mọi push ở mọi nhánh** lẫn `pull_request`, có `cancel-in-progress` nên lượt
  cũ bị thay — push không có PR vẫn phải xanh CI;
- chứa `validate` (qua `build`), `test`, `check`, `manifest:check`, `catalog:check`,
  `verify:store:partial`, `reference:gaps:check`, `license:check`, `audit:store`,
  `audit:reference`, `glossary:check`, `doctor:ci`, `build`;
- kiểm tra mới đưa vào CI chứ **không** đưa vào hook — hook chỉ dành cho những gì người ta
  muốn biết trước khi lệnh push rời máy.

Nhiệm vụ local trước khi gộp vẫn là `validate` / `test` / `check` như mục trên; đối soát đầy
dủ (store, licence, catalog, gap, build) là việc của CI.

Kiến trúc nền tảng và data contract nằm tại [`docs/architecture.md`](docs/architecture.md).


## Cấu hình audio đã duyệt — bắt buộc giữ nhất quán

- Cấu hình duy nhất là `source/narration-profile.json`, profile `vi-charon-mn1-v1`, được người biên tập duyệt giọng và nhịp ngày 2026-10-10 theo mẫu MP3 MN1.
- Mọi audio dùng đúng model, Charon, style prompt, giới hạn chunk, khoảng nghỉ, encoding và tốc độ mặc định của profile. Không ghi đè qua CLI/env, không fallback sang model/giọng khác, không tự tăng/giảm tốc MP3.
- Generator và uploader phải đi qua `scripts/narration_config.py`; không bỏ qua pin SHA-256. Thay profile/pin chỉ khi người biên tập yêu cầu và đã duyệt mẫu mới.
- Duyệt giọng/nhịp không đồng nghĩa duyệt nội dung toàn bài. Giữ `review_status: pending` cho đến khi nghe duyệt đầy đủ.
- Đọc `docs/audio.md` trước mọi tác vụ tạo hoặc upload audio. Nghe đối chiếu mẫu MN1 vì tốc độ TTS là hướng dẫn bằng prompt, không có bảo đảm nhịp tuyệt đối giữa các lần sinh.
