# AGENTS.md

Repository này xây bản dịch Kinh tạng Pāli tiếng Việt mới, ưu tiên **Kinh Trung Bộ (Majjhima Nikāya)** trước, đồng thời giữ cấu trúc mở rộng cho năm Nikāya.

## Bắt buộc đọc trước khi làm việc

Mọi tác vụ liên quan đến dịch, sửa/review bản dịch, chọn thuật ngữ, viết chú thích hoặc đổi trạng thái `draft` / `review` / `published` **phải đọc đầy đủ [`skill/translation.md`](skill/translation.md) trước khi chỉnh nội dung**.

`skill/translation.md` là chuẩn có thẩm quyền cho mục tiêu dịch, hierarchy nguồn, provenance, phương pháp đối chiếu Pāli/English/Thích Minh Châu, semantic audit, văn phong và Definition of Done. File này định nghĩa thêm **quality gate bắt buộc** để quyết định trạng thái xuất bản.

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
| Việt dự án | **bản canonical** — bản đang biên tập |

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
- Sách/EPUB chỉ lấy Pāli + Việt dự án; English và Việt tham khảo không được rò vào bản
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

## 10 tiêu chí, mỗi tiêu chí chấm 0–10

Sau khi hoàn tất một bài kinh, agent phải thực hiện **một lượt review đối kháng riêng** rồi chấm đủ đúng 10 tiêu chí sau. Không được chấm điểm trong khi bản dịch còn đang dang dở.

1. **Source & provenance integrity**  
   Đúng UID, đúng pinned Pāli source/commit, nguồn English và bản Thích Minh Châu tham khảo được xác định đúng; các claim về nguồn có thể kiểm tra lại.

2. **Semantic fidelity to Pāli**  
   Bản Việt giữ đúng các semantic units của Pāli, không thêm/bớt ý, không làm lệch giáo nghĩa, không biến diễn giải thành nguyên văn.

3. **Grammar & logical precision**  
   Đúng speaker, chủ thể, đối tượng, phủ định và scope, điều kiện, quan hệ nhân quả, thời gian, số lượng, mức độ, modality và so sánh.

4. **Segment completeness & alignment**  
   Đủ các segment cần thiết, đúng exact segment ID, không orphan/misaligned segment; repetition/ellipsis không làm mất canonical meaning.

5. **Terminology precision & consistency**  
   Thuật ngữ Pāli được dịch đúng context, distinctions quan trọng không bị làm phẳng, tên riêng/danh xưng nhất quán, glossary được dùng/cập nhật hợp lý.

6. **Reference triangulation & research quality**  
   Đã đối chiếu Pāli + English SuttaCentral + Thích Minh Châu khi có; disagreement quan trọng được quay lại Pāli/context và, khi cần, dictionary/grammar/parallel để phân xử.

7. **Vietnamese clarity & naturalness**  
   Người Việt hiện đại đọc hiểu được ngay, câu tự nhiên, không calque máy móc, không giả cổ, nhưng vẫn giữ đúng sắc thái nguyên bản.

8. **Hán–Việt balance & concision**  
   Giữ Hán–Việt khi nó chính xác/súc tích/quen thuộc; thay khi tối nghĩa; câu không dài dòng chỉ để né thuật ngữ kỹ thuật.

9. **Ambiguity & editorial integrity**  
   Không che giấu bất định; chỗ có nhiều cách hiểu đáng kể được ghi comment; không hallucinate Pāli, source, parallel, dictionary meaning hay explanatory content.

10. **Technical & release integrity**  
    JSON/YAML hợp lệ, NFC, metadata đúng, provenance/license không có vấn đề, các validation/test/check/build bắt buộc đều pass.

### Cách tính điểm

- Mỗi tiêu chí: `0.0–10.0`.
- `final_score = (score_1 + ... + score_10) / 10`.
- Dùng **trung bình số học thô**, không dùng điểm đã làm tròn để quyết định status.
- Có thể hiển thị `final_score` với 2 chữ số thập phân, nhưng publication gate dùng giá trị thực.
- **Điểm đúng `9.0` KHÔNG đủ để published. Phải `final_score > 9.0`.**

## Blocking errors

Blocking error **luôn thắng điểm số**. Nếu có ít nhất một blocker, bài **bắt buộc `draft`**, kể cả khi final score là 10/10.

Các lỗi sau là blocking:

1. **Sai hoặc không xác minh được source/provenance**: sai UID, dùng nhầm Pāli, sai pinned commit, hoặc source quan trọng bị gán provenance sai.
2. **Sai nghĩa trọng yếu**: có lỗi đã biết làm thay đổi nghĩa Pāli/giáo nghĩa, gồm sai phủ định, chủ thể, quan hệ logic, số lượng, điều kiện hoặc kết luận quan trọng.
3. **Thiếu/sai segment**: thiếu segment bắt buộc, orphan segment, wrong UID, misalignment hoặc canonical structure bị hỏng.
4. **Hallucination / unsupported addition**: bịa nội dung, bịa nguồn, bịa nghĩa Pāli/dictionary/parallel, hoặc đưa lời giải thích không có trong kinh vào canonical scripture như thể là nguyên văn.
5. **Validation failure**: `npm run validate` fail; hoặc test/check/build bắt buộc cho thay đổi đó fail.
6. **Unresolved high-impact ambiguity**: còn bất định có thể thay đổi đáng kể nghĩa đoạn kinh nhưng chưa được phân xử hoặc ghi nhận đầy đủ để canonical wording có thể bảo vệ được.
7. **Provenance/license violation**: copy nội dung bên thứ ba vượt phạm vi cho phép hoặc không thể truy nguồn hợp lệ.

Không được “bù” một blocker bằng điểm cao ở tiêu chí khác.

## Status rule

Sau khi blockers đã được kiểm tra:

- **Có blocker** → `draft` bất kể điểm.
- **Không blocker và `final_score > 9.0`** → `published` **trực tiếp**.
- **Không blocker và `8.0 <= final_score <= 9.0`** → `review`.
- **Không blocker và `final_score < 8.0`** → `draft`.
- Chưa có scorecard đầy đủ → `draft`.

**Human review được khuyến khích nhưng không phải điều kiện bắt buộc để `published`.** Một agent có thể publish trực tiếp nếu và chỉ nếu bài vượt quality gate ở trên và không có blocking error.

## Metadata quality scorecard

Khi một bài đã được chấm, lưu scorecard trong `content/meta/sutta/<collection>/<uid>.yaml`:

```yaml
quality:
  scores:
    source_provenance: 9.5
    semantic_fidelity: 9.3
    grammar_logic: 9.2
    segment_alignment: 10.0
    terminology: 9.1
    triangulation: 9.2
    vietnamese_clarity: 9.4
    han_viet_balance: 9.3
    ambiguity_integrity: 9.1
    technical_integrity: 10.0
  final_score: 9.41
  blocking_errors: []
  assessed_at: "2026-09-10"
  assessed_by:
    - "GPT-5.6 Sol"
```

`final_score` phải khớp trung bình số học của đúng 10 score. Validator có quyền từ chối metadata nếu status không khớp score/blockers.

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

Chỉ sau khi technical gate pass mới được coi tiêu chí 10 là đạt và mới được đổi status theo bảng trên.

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
