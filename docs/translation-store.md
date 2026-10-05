# Translation store

Mọi bài kinh trong dự án được đọc qua **một store nhiều tầng**, khai báo tập trung trong
[`source/layers.yaml`](../source/layers.yaml). Mục tiêu: người dịch luôn nhìn thấy đủ bối
cảnh và biết chính xác nguồn gốc của từng câu, thay vì phải tự đi tìm.

```bash
npm run source:sync:manifest  # tải đúng danh sách file của commit đã pin
npm run verify:store          # đối soát + đếm, exit 1 nếu lệch
npm run store -- an4.59      # đọc một bài qua toàn bộ store
npm run audit:store          # kiểm kê store theo từng tầng
```

## Kiểm chứng bằng đếm, không bằng boolean

Bài học từ vòng trước: mọi kiểm tra cũ đều hỏi "file có tồn tại?" và đều **duyệt qua
catalog của chính dự án**. Nên khi catalog chỉ liệt kê 3.049 trong 5.764 file Pāli của
snapshot, tất cả đều báo xanh: 2.715 bài kinh đơn giản là không có trong repo, và không
kiểm tra nào nhìn thấy, vì cái mà cần kiểm tra chính là catalog.

Nên nay:

1. **Sự thật đến từ ngoài repo.** `source/upstream-manifest.json` là git tree của commit
   đã pin, kèm **git object hash từng file**. `verify:store` đối chiếu file local với
   hash đó: file có mặt mà sai byte cũng là lỗi.
2. **Mọi thứ đều đếm.** Không có cờ "looks fine". Mọi khẳng định in ra số, và lệch thì
   exit 1.
3. **Đối soát hai chiều.** Không chỉ "còn thiếu gì" mà cả "có thừa gì": file trên đĩa mà
   upstream không có, segment thừa so với Pāli, record gap đã lỗi thời.
4. **Bằng chứng lưu lại.** `docs/store-verification.json` là bản ghi số đo của commit đang
   pin, nên lần chạy sau đối chiếu được; `--check` fail nếu số đã dịch chuyển.

`verify:store` phân biệt rõ hai loại lệch:

- **failure** — cache không phải bản pin, segment thừa so với Pāli, edition đã pin thiếu
  segment, bản lấp English che bản đã pin, gap dưới ngưỡng mà chưa ghi nhận, authority bị
  đảo. Phải bằng 0.
- **advisory** — giới hạn của bản chụp upstream: edition không phủ hết bài, catalog chưa
  nhập hết. Được đếm và in ra, không bị giấu, nhưng không phải lỗi.

## Năm tầng, theo thứ tự đọc

| # | Tầng | Loại | Ngôn ngữ | Nguồn | Vai trò |
| --- | --- | --- | --- | --- | --- |
| 1 | `pali` | **authority** | pi-Latn | bilara `root/pli/ms`, commit đã pin | Quyết định nghĩa cuối cùng |
| 2 | `english-sujato` | reference | en | bilara `translation/en/sujato` | Tham khảo cú pháp, compound, sắc thái |
| 3 | `english-project` | project | en | `content/translation/en/project/` | Lấp chỗ Sujato chưa dịch |
| 4 | `vietnamese-current` | reference | vi | bilara `translation/vi/phantuananh` | Đối chiếu thuật ngữ truyền thống |
| 5 | `vietnamese-project` | project | vi | `content/translation/vi/project/` | Bản dịch canonical của dự án |

`authority: true` chỉ được gán cho tầng `root`. Test chặn việc một tầng tham khảo nào đó
tự nhận mình là chuẩn — `skill/translation.md` §2, §3.2 nói rõ Pāli là tie-breaker cuối.

## Tại sao cần tầng `english-project`

Tại commit `11c9d708978c`, Sujato là **bản Anh duy nhất** phủ cả 5 Nikāya Pāli, và nó để
trống 16.363 segment (13,5%), trong đó 6.442 rơi vào Pāli có nội dung. Ở những chỗ đó
người dịch mất hẳn tầng tham khảo: `mn42` chỉ còn 15%, `an4.46` 17%, `mn15` 23%.

Các dịch giả Anh khác trên SuttaCentral không lấp được: `soma` chỉ có thig, `kelly` chỉ có
mil, `patton` chỉ có Māgama Trung Hoa, `brahmali` không có file sutta nào.

Vì vậy dự án tự dịch những đoạn đó. Đây là **một bản dịch độc lập**, không phải nguồn của
SuttaCentral, và được quản lý như một sản phẩm độc lập:

- chỉ được điền cho segment mà **tầng English đã pin để trống**;
- **không bao giờ** ghi đè Sujato — `validate` chặn, và `audit:store` báo `SHADOWING`;
- có trạng thái và quality scorecard riêng tại `content/meta/en/<collection>/<uid>.yaml`;
- chỉ được tính vào coverage khi `published` (xem `countsOnlyWhenStatus` trong `layers.yaml`).

### Không tự đánh bài của mình

Nếu bản lấp English và bản dịch Việt cùng do một người (hoặc một agent) chấm, thì bản lấp
**không phải một cách đọc English độc lập**. `validate` cảnh báo khi `assessed_by` của hai
lớp trùng nhau, và scorecard tiếng Việt của bài đó không được tuyên bố đã đối chiếu English.

## Đo coverage như thế nào

`source/layers.yaml` khai báo `englishCoverage`. Ngưỡng và cách đo lấy từ audit, không chọn
tùy tiện:

```yaml
substantivePaliMinChars: 40
excludeReferenceBlock: true
floor: 0.8
creditLayers: [english-sujato, english-project]
```

**Vì sao bỏ qua block tham chiếu (`excludeReferenceBlock`).** Bilara đánh dấu phần tiêu đề
bằng thành phần đường dẫn `0` (`mn118:0.1`, `an4.46:0.3`, `dhp1:0.2`). Sujato bỏ trống
phần lớn tiêu đề từng câu chuyện trong Dhammapada. Nếu tính chúng, `dhp44-59` và
`dhp100-115` bị báo là "mất 100% tầng tham khảo" trong khi thực ra chỉ thiếu tên các câu
chuyện — nội dung kinh đã có bản dịch đầy đủ. Sau khi loại block tham chiếu, hai bài này
biến khất khỏi danh sách gap.

**Vì sao lấy 40 ký tự.** Sujato bỏ trống hàng nghìn dấu `Paṭhamaṁ.`, `Dutiyaṁ.`,
`Tatiyaṁ.` Đếm mọi segment sẽ báo `an1.1` — 12 segment, một nửa rỗng — là mất phủ,
trong khi cả 4 segment có nội dung đều đã được dịch (100%).

**Vì sao ngưỡng 0.8.** Phân bố thực đo trên **4.540 bài có bản Anh đã ghim**
(toàn catalogue, `2026-10-04` tại `9a0aa4e9`):

| coverage | số bài | |
| --- | --- | --- |
| ≥ 99% | 4186 | nguyên vẹn |
| 80–99% | 138 | nguyên vẹn |
| 50–80% | 167 | mất tham khảo |
| 1–50% | 49 | mất nặng |
| 0% | 0 | không có English nào |

4.186 bài đã ở ≥ 99%, nên 0.8 chỉ đúng vào **216 bài** thực sự mất tầng tham khảo.
Nới lên 0.5 sẽ âm thầm chấp nhận thêm 49 bài nữa.

⚠️ **Con số 216 là phạm vi toàn catalogue.** Cổng `audit:reference` luôn chạy với
`--used` nên trong CI chỉ báo 147 tại `b73dc54f` — đó là 216 bài trừ đi các bài chưa
có bản dịch Việt. Số trong scope `used` **phình ra mỗi khi thêm bài** (143 lúc
`9a0aa4e9`, 147 lúc `b73dc54f`), nên nó tăng lên mà *tiến độ không hề tăng* — đừng đọc
nó là cải thiện.
Muốn đo đúng 216 thì chạy `node --import tsx scripts/audit-reference.ts` không kèm cờ.
Cột `80–99%` ở bảng cũ (216 bài) là con số của phép đo trước đây, **đã bị thay**:
216 nay là *tổng số bài dưới ngưỡng*, không phải số bài trong khoảng 80–99%.

## Gap được ghi nhận, không được che

136 bài dưới ngưỡng nằm trong [`content/meta/reference-gaps.yaml`](../content/meta/reference-gaps.yaml).
Đây là **record, không phải repair** — nó không tạo ra prose mà SuttaCentral không ship.
Vai trò của nó là phân biệt *"đã biết và đã chấp nhận"* với *"chưa ai nhìm"*:

- `review`/`published` + dưới ngưỡng + **không** có record → lỗi chặn;
- có record → cảnh báo vẫn in ra;
- `draft` → cảnh báo.

Sinh bằng `npm run reference:gaps`, kiểm tra độ cũ bằng `npm run reference:gaps:check`
(chạy trong CI). Test khoá **cả hai chiều**: không được có bài dưới ngưỡng mà thiếu record,
và không được có record cho bài đã lên ngưỡng.

## Trạng thái tại 2026-09-28

Toàn bộ corpus, đối chiếu với git tree của commit `11c9d708978c`:

| tầng | file trong manifest | có trên đĩa, hash khớp | catalog dùng | không phủ |
| --- | --- | --- | --- | --- |
| `pali` | 5.764 | **5.764** | 5.764 | 0 |
| `english-sujato` | 4.291 | **4.291** | 4.168 | 1.596 (xem dưới) |
| `vietnamese-current` | 26 | **26** | 26 | 5.738 (xem dưới) |

Catalog: **6.137 text**, phủ **100%** file Pāli của snapshot (5.764 file; một file có thể
chứa nhiều UID). Tổng segment Pāli: **284.574**.

| | số |
| --- | --- |
| text | 6.137 |
| text có dữ liệu biên tập (`content/meta/sutta`) | **5.432** |
| text Pāli không resolve được segment | 1 (`sn12.93-213`, defect upstream — xem `docs/prompts/goal.md`) |
| text không có bản English nào ở upstream | 1.596 (toàn bộ là `kn`) |
| segment English **có key nhưng rỗng** | 19.762 (trong đó **30.529** là Pāli ≥ 40 ký tự) |
| text dưới ngưỡng 80% — toàn catalogue | **216** (143 trong scope `--used`, đều đã ghi nhận; 73 còn lại chưa có bản dịch Việt) |

### Tầng dự án — đo ở `186e0c74`

Hai tầng do dự án tự sinh. Số ở đây **đo** trên worktree sạch, không suy từ catalogue:

| tầng | tệp | nội dung |
| --- | --- | --- |
| `vietnamese-project` | **5.432** | bài **đủ mọi khoá Pāli**: **5.386** · còn thiếu **750** bài / **126.490** khoá |
| `english-project` (lớp lấp) | **770** | còn thiếu **225** text / **5.713** segment |

⚠️ `text dưới ngưỡng 80% = 216` và `engq` **dưới sàn = 143** là **hai phép khác mẫu** — đừng đem trừ.

⚠️ Cột `bài đủ mọi khoá` **không** đạt `6.136` (= 6.137 − 1 vì `sn12.93-213` không đo được). Vì vậy tiêu
chí *"bài còn thiếu = 0"* của dự án **chưa đủ**: phải kiểm thêm `đủ + thiếu + không đo được = catalogue`.
Cổng `tests/unit/catalog-measurable.test.ts` giữ bất biến đó.

### Vì sao 1.596 bài không có English

Toàn bộ nằm ở `kn`, và là các bộ ngoài Niết bàng chính thống mà SuttaCentral không dịch:
`tha-ap` (563), `mil` (248), `vv` (85), `pv` (51), `thi-ap` (40), `ne` (37), `ps` (31),
`bv` (29), `cnd` (23), `mnd` (16), `pe` (9). Đây là giới hạn của bản chụp upstream, được
đếm và in ra, không phải thiếu sót của repo. Với các bài này, tầng tham khảo tiếng Anh
**không tồn tại** và người dịch phải dựa vào Pāli.

### Vì sao `vietnamese-current` chỉ phủ 26 bài

Tại commit đang pin, corpus Thích Minh Châu trong bilara-data **chỉ có Pháp Cú**. 5.738 bài
còn lại không có bản Việt hiện hành trong snapshot. `sync-source` báo `not covered
upstream` chứ không coi là lỗi, và `verify:store` xếp vào advisory.

## Nhập snapshot chuẩn vào catalog

Catalog trước đây mới liệt kê 3.049/5.764 file Pāli. Theo `docs/roadmap.md` phase 2 —
*"Không phát minh catalog SN/AN/KN bằng arithmetic. Khi bắt đầu mỗi bộ, import canonical
tree/UID/source paths từ pinned SuttaCentral snapshot"* — `scripts/import-canonical-catalogs.ts`
làm đúng việc đó, lấy danh sách file từ manifest:

```bash
npm run catalog:import    # thêm 2.715 entry
npm run catalog:check     # CI: catalog phải phủ 100% snapshot
```

| collection | trước | thêm | sau | file upstream | trong đó có English |
| --- | --- | --- | --- | --- | --- |
| `dn` | 34 | 0 | 34 | 34 | 34 |
| `mn` | 152 | 0 | 152 | 152 | 152 |
| `sn` | 1.819 | 0 | 1.819 | 1.819 | 1.819 |
| `an` | 1.117 | 664 | 1.781 | 1.408 | 664 |
| `kn` | 300 | 2.051 | 2.351 | 2.351 | 455 |
| **tổng** | 3.422 | **2.715** | **6.137** | 5.764 | |

**Quy tắc UID: một entry cho mỗi file bilara, UID = thành phần UID của chính tên file.**
Điều này được *kiểm tra*, không giả định: SuttaCentral phục vụ
`/api/bilarasuttas/an1.1-10`, `ud1.1`, `thag1.100`, `an6.100` (có thật), còn tên bịa ra như
`an6.1-10` hay `thag1` trả về `Not Found` — tức là tên file upstream vốn đã là UID chuẩn.
Cả hai kiểu gộp vẫn resolve được qua `segmentPrefixesForUid`.

`order` chỉ là chỉ số: giá trị cũ không bao giờ được đánh lại, entry mới nối tiếp từ số
lớn nhất hiện tại theo thứ tự phân bộ rồi UID. Không có gì đang đọc catalog hôm nay bị
đổi với 3.049 text đã có.

## Hàng đợi lấp English

Sắp theo số segment Pāli có nội dung còn thiếu English, nhỏ trước để có thể kiểm chứng
từng bài. Cột "còn lại" là số segment theo `npm run audit:reference`, không phải suy đoán.

**Đã xong (7 bài / 18 segment), tất cả đạt 100% coverage:**

| bài | segment lấp | vì sao Sujato để trống |
| --- | --- | --- |
| `an3.149` | 1 | `…pe…` bị Sujato nuốt |
| `an3.153` | 1 | idem |
| `an4.59` | 3 | idem |
| `an4.116` | 5 | Sujato gộp cả ba mục (thân/khẩu/ý) vào một câu ở `1.3`, nên `1.5`/`1.7` trống |
| `ud7.3` | 3 | `…pe…` và các mục đếm bị bỏ |
| `sn3.6` | 3 | `…pe…` bị Sujato nuốt |
| `sn11.24` | 2 | các tỳ-kheo dẫn lại đoạn mở đầu; Sujato không dịch phần dẫn lại |

**Còn lại, theo thứ tự nhỏ trước:**

1. `sn3.9` (2), `an4.40` (2), `ud8.9` (2), `an4.29` (3), `an5.20` (3), `iti81` (3)
2. Các bài lớn: `mn42` (72), `an4.46` (15), `an3.112` (22), `mn15` (163)

Tổng còn **3.093 segment** trên **132 bài** (tại 2026-09-28). Con số này do
`npm run audit:reference` in ra ở dòng *English fill queue*, nên không phải ai tính tay:
sửa xong một bài thì chạy lại lệnh đó, đừng sửa con số.

`dhp383-423` cố ý **không** làm: segment duy nhất còn thiếu là bản mục lục
`dhp423:8`, và cách đọc con số tổng kết của nó là một điểm văn bản còn tranh luận
(`tīṇi vathusatāni`). Không điền một con số tổng mà mình không bảo vệ được.

## Quy trình lấp một đoạn

```bash
npm run store -- an4.59 --from 4 --limit 3     # xem Pāli + mọi tầng
# viết content/translation/en/project/sutta/an/an4.59_translation-en-project.json
# tạo content/meta/en/an/an4.59.yaml với status + quality scorecard
npm run validate                               # chặn nếu ghi đè Sujato hoặc lệch segment
npm run audit:store
npm run reference:gaps                        # cập nhật record gap
```

Nguyên tắc khi lấp: dịch từ **Pāli**, dùng bản Việt hiện hành để đối chiếu nghĩa, giữ nguyên
dấu lược `…` của Pāli thay vì mở rộng, và chấm `triangulation` thấp hơn bình thường vì
không có bản Anh độc lập nào để đối chiếu.

**Hai luật không được bỏ qua**, cả hai đều vì đã bắt trúng một lần:

1. **Đọc segment trong bối cảnh bài, không dịch segment lẻ.** `sn11.24:1.7` đọc riêng rất
   dễ thành *"một tỳ-kheo là bậc trên về học"* — nghe như bài kinh về thứ bậc, và mâu thuẫn
   với bản Việt đã publish. Thực ra `1.7–1.8` là các tỳ-kheo **dẫn lại đoạn mở đầu**;
   Sujato dịch `Accayasutta` là *"Transgression"* và cùng cấu trúc ở `1.2–1.5` mang đúng
   nghĩa đó.
2. **Pāli đã xuất hiện ở nơi khác trong cùng bài thì phải dùng lại cách dịch đã có.**
   Ở `sn11.24` điều này quyết định cả nghĩa, vì `1.7` chính là `1.2`+`1.3` được dẫn lại.

Cả hai được `tests/unit/english-fill.test.ts` kiểm.

## Bốn bản trong web reader

`npm run store -- <uid>` in ra store dạng CLI. Người đọc web cần bốn bản cạnh nhau để
đối chiếu, và `src/lib/canon/document.ts` dựng ra đúng bốn bản đó:

| cột | lớp store | vai trò |
| --- | --- | --- |
| Pāli | `pali` | **nguồn chuẩn** — quyết định nghĩa |
| English | `english-sujato` + `english-project` | tham khảo (Sujato, chỗ trống thì bù bằng bản lấp của dự án) |
| Việt hiện hành | `vietnamese-current` | tham khảo (HT. Thích Minh Châu) |
| Việt dự án | `vietnamese-project` | **bản canonical** — bản đang biên tập |

Pāli là tập key: mọi bản khác đều căn theo nó, nên một dòng của bảng so sánh là một
segment Pāli và tương ứng của cả ba bản kia. Cột English ghép hai lớp theo đúng thứ tự
`fillableSegments` dùng — Sujato trước, bản lấp của dự án chỉ đóng chỗ Sujato im lặng —
và **mỗi segment mang theo lớp đã cung cấp nó** (`enFrom`), nên đoạn do dự án bù được
gắn nhãn *bản lấp của dự án* chứ không bao giờ trộn với bản Sujato đã xuất bản.

### Vắng mặt phải nói thật

Đây là phần dễ sai nhất, nên nó được quyết định từ manifest chứ không từ cache:

| `reason` | nghĩa là gì |
| --- | --- |
| `not-published-upstream` | bản chụp đã pin **không có** bản dịch cho bài này — giới hạn của upstream |
| `not-synced` | upstream có, nhưng tệp chưa tải về cache — trạng thái local, ai cũng sửa được |
| `not-started` | lớp của dự án chưa có nội dung cho bài này |

Gộp hai cái đầu thành "không có" là cách khiến người đọc tưởng một bài mất tham khảo
trong khi thực ra chỉ là chưa ai tải. `src/lib/canon/manifest.ts` đọc
`source/upstream-manifest.json` để trả lời câu hỏi đó, và trả `null` — không phải
`false` — khi không biết, vì `null` đã bị dùng để chỉ "không suy ra được".

Một bản tham khảo **có mặt nhưng im lặng ở một segment** (`dhp1:0.4`) là lỗ hổng của
bản dịch đó, khác hẳn với bản vắng mặt cả bài — và đúng trường hợp mà lớp lấp English
sinh ra để xử lý. Ô trống được đánh dấu là lỗ hổng của bản tham khảo, không phải dấu
hiệu "không có gì để dịch".

### Bốn cột không lúc nào cũng đọc được

Bốn cột kinh văn trên một màn hình là không đọc nổi, và trên điện thoại là vô dụng. Nên:

- **rộng** (`>1100px`): bốn cột, nhưng cột nào **không có bất kỳ nội dung nào** thì bị
  thu gọn, để phần còn lại chiếm hết bề ngang. Số cột còn lại quyết định ở build time
  (`data-open-columns`), vì vậy `mil1` chỉ có cột Pāli chứ không phải một cột Pāli
  bằng 1/4 màn hình.
- **hẹp** (`≤1100px`): một cột mỗi lần, chọn bằng nút tập trung. Không có JavaScript thì
  cả bốn cột xếp chồng và vẫn đọc được — nội dung luôn nằm trong markup.
- **chế độ** `Bốn bản` (mặc định) · `Đối chiếu` (một segment, bốn bản xếp dọc) ·
  `Chỉ Việt` (Pāli + Việt dự án, để đọc).

Cột vắng mặt không biến mất lặng lẽ: thẻ bản vẫn hiện ở `0/N`, bị khoá
(`aria-disabled`) kèm lý do, và thẻ giải thích trong `layer-legend` nói rõ giới hạn
của bản chụp.

### Tìm kiếm

Cả bốn bản đều được Pagefind index — không bản nào bị giấu khỏi tìm kiếm. Đổi lại, một
truy vấn Pāli và một truy vấn English đều dẫn tới cùng một bài, nên:

- mỗi ô mang `data-pagefind-filter="version:<tên bản>"`, và trang tìm kiếm có bộ chọn
  bản để thu hẹp phạm vi;
- mỗi kết quả ghi rõ **trang đó có những bản nào**, để không ai đọc kết quả trúng English
  là "bài này nói vậy bằng tiếng Việt".

### Sách/EPUB không đổi

`scripts/build-book.ts` chỉ đọc `segment.pali` và `segment.vi`, nên sách vẫn ra Pāli +
Việt dự án và **không** rò English hay Việt tham khảo vào bản phát hành. Đã kiểm trên
`mn-vol-1` và `mn118-smoke`.

## Nguồn, giấy phép và ghi công

Sutacentral yêu cầu, trong trang giấy phép tiếng Việt của chính họ: **"Ghi rõ nguồn gốc xuất
xứ"** (mục `licensing:10`). Đó là lý do có:

- **`source/suttacentral.lock.json`** khai `license` cho **mọi** edition đã ghim. Thiếu khối
  này là **lỗi chặn** (`assertStoreIntegrity`), không phải thiếu sót hình thức: hai bản tham
  khảo thuộc nhóm "tác phẩm của bên thứ ba" — *"đại đa số các bản dịch kinh văn"* — nên bản
  quyền thuộc dịch giả, và hiển thị chúng mà không nói điều đó là lỗ hổng tuân thủ.
- **Một edition `credits`** ghim `translation/vi/site/` — chính là trang giấy phép, ghi công và
  hướng dẫn trích dẫn tiếng Việt của SuttaCentral (12 file). Không phải kinh văn; đây là các
  điều khoản mà hai bản tham khảo được hiển thị dưới, nên nó phải được ghim và kiểm bằng
  hash chứ không để bằng một đoạn văn của chúng ta. Tổng cache: **10.093** path / 4 edition.
- **`/credits/`** dựng từ lock + manifest, nên không thể lệch với thứ store thực sự giữ.
  Trang này trích nguyên văn các đoạn của SuttaCentral, kể cả yêu cầu ghi nguồn và bốn
  ghi công cho công việc tiếng Việt.

Bốn người SuttaCentral ghi công cho tiếng Việt, trích từ
`translation/vi/site/acknowledgments_translation-vi-site.json` đã ghim:

| Người | Công việc SuttaCentral ghi |
| --- | --- |
| Tỳ-kheo Indacanda (Nguyệt Thiên) | Dịch thuật tiếng Việt |
| Bình Anson | Chuẩn bị văn bản cho dịch thuật tiếng Việt |
| Ken Yifer | Các đoạn kinh Pháp Cú trong Đại Chính tạng |
| Mark Lin | Cố vấn kinh Pháp Cú bản tiếng Trung và tiếng Phạn |

Và điều này giải thích vì sao bản Việt trên SuttaCentral chỉ còn Pháp Cú: danh sách tình
nguyện viên của SuttaCentral còn ghi **Sister Uppalavanna** là người đã cung cấp *"bản dịch sơ
bộ của hầu hết các bộ kinh nikaya"*. Bản dịch sơ bộ đó không được đưa vào bilara-data, nên
phần thiếu là **do cách phân phối**, không phải do bỏ sót.

## Công cụ hỗ trợ

Khai trong **`source/tooling.yaml`**, và **mọi trang đọc từ đó** — không có tên công cụ nào
viết tay trong markup. Điều này không phải thẩm mỹ: trước đó ba chỗ ghi tên AI bằng tay
(trang chủ, footer, scorecard bản lấp English) và chúng **đã lệch nhau** — 561 file metadata
ghi ChatGPT, file mới nhất ghi OpenCode, còn website chỉ ghi ChatGPT. Không có gì bắt được,
vì không có gì so sánh chúng.

Bốn công cụ corpus thực sự dùng, theo số file metadata:

| Công cụ | Số file metadata | Vai trò |
| --- | --- | --- |
| ChatGPT (OpenAI) | 561 | phương án dịch, đối chiếu, QA |
| GPT-5.6 Sol (OpenAI) | 99 | translators / assessed_by |
| GPT-6 Astra Pro (OpenAI) | 4 | translators / assessed_by |
| OpenCode Space Bunny Free (agent) | 14 | bản lấp English, reader, scripts |

`tests/unit/tooling.test.ts` kiểm **cả hai chiều**: công cụ nào được nêu trong `content/meta`
thì phải được khai, và công cụ nào khai thì phải được ghi ở đâu đó trên site — để danh sách
không mục ruỗng. Test này ngay khi viết ra đã tìm thấy **GPT-5.6 Sol** và **GPT-6 Astra
Pro** chưa khai ở đâu cả, dù metadata có ghi.

**Hai điều không được làm:**

1. **Không sửa 561 file metadata ghi ChatGPT** thành công cụ mới. Đó là hồ sơ thật về cách
   từng bài được làm ra; đổi nó là bịa bộ sử lịch sử. Test
   *"the sutta metadata that predates this tooling is left as history"* nói rõ điều này để
   agent sau không "sửa cho đẹp".
2. **Không trình bày tên phiên bản như đã xác minh.** `Muse Spark 1.3 Free` là tên do người
   biên tập khai; repository không kiểm chứng được, nên nó mang `declaredBy: user-declared`
   và trang credits nói thẳng điều đó. Một test ép mọi công cụ có `release` phải là
   `user-declared`.

## Tra cứu toàn văn: budsas.org (không phải tầng store)

Đã điều tra và **khai dùng để tra cứu** — không nhập vào store, và không lấp vào cột nào.
Khai trong [`source/external-references.yaml`](../source/external-references.yaml).

**Sự thật đã đếm:** bilara tại commit đã ghim chỉ có 27 file `translation/vi/` — 26 chương Pháp
Cú (2.234 segment, so khớp từng segment với Pāli: thiếu 0, thừa 0) và 1 tên hiển thị. Nên
**6.111 / 6.137 bài** không có tầng Việt hiện hành — Đại kinh 0/34, Trung bộ 0/152, Tăng bộ
0/1.819, Tiểu bộ 0/1.781, Kinh nhỏ 26/2.351.

**Vì sao là tra cứu chứ không phải tầng:** đo trên 7 bài Trung Bộ, budsas cho **0,20–0,58 đoạn
văn cho mỗi segment Pāli**:

| Bài | Đoạn budsas | Segment Pāli | Tỉ lệ |
| --- | --- | --- | --- |
| mn1 | 99 | 334 | 0,30 |
| mn2 | 72 | 125 | 0,58 |
| mn3 | 25 | 128 | 0,20 |
| mn5 | 55 | 203 | 0,27 |
| mn10 | 98 | 235 | 0,42 |
| mn20 | 33 | 87 | 0,38 |
| mn30 | 37 | 163 | 0,23 |

Cứ 10 segment Pāli thì có 2–6 đoạn. Đặt cạnh nhau ở mức segment thì đa số segment trống, và
chỗ một đoạn phủ nhiều segment thì phải **chọn** segment nào nhận nó — đó là quyết định biên
tập, và làm tay thì hỏng âm thầm. Nên: **không có căn cứ alignment thì không dựng cột.**

**Ai làm, và điều đó phải ghi cả hai.** Cả 7/7 trang mẫu đều ghi:

> *(Bình Anson hiệu đính, dựa theo bản Anh ngữ "The Middle Length Discourses of the Buddha", Tỳ kheo Nanamoli)*

Đây là **bản Bình Anson hiệu đính lại bản dịch Hòa thượng Thích Minh Châu, có đối chiếu bản
Anh của Tỳ khẻo Nanamoli** — ba bên, không phải một. Ghi công một mình cho Hòa thượng Thích
Minh Châu là lặp lại đúng lỗi PR #97 vừa sửa, chỉ theo hướng ngược. `mn2` còn bị chính trang đó
đánh dấu **"(Tóm lược)"**.

**Bản đồ uid → URL: chỉ Trung Bộ, và đã đối chiếu.** Trang mục `trung00.htm` liệt kê đúng
**152** link `trung01.htm`..`trung152.htm`, số thứ tự 1..152, không trùng, không thiếu. Mười
hai trang đối chiếu thêm bằng **tên Pāli** in trên trang so với Pāli root của bilara: **10/12
khớp**; hai lệch đều là lỗi chính tả của trang (`Vtakkasanthàna` mất chữ *i*,
`Mahàsakuludàyin` thừa chữ *n*) — ghi lại trong `verified.exceptions` để lần audit sau không
"sửa" bản đồ theo lỗi của trang.

Đại kinh, Tăng bộ, Tiểu bộ, Kinh nhỏ **không khai là có**, vì chưa đối chiếu. Kinh nhỏ còn
thêm một lý do: ngoài Pháp Cú, dịch giả thay đổi theo tập (Tiểu Bộ II và VIII là GS Trần
Phương Lan; tập VI–VII hai người cùng dịch) — phải ghi tác giả *từng bài* trước khi khai.

**Điều khoản:** `NOASSERTION`. Trang không có tuyên bố quyền tác giả máy đọc được. Đoán CC0
hay "dùng tự do" là bịa. Nó cũng là **bản sao của bên thứ ba, không phải bản xuất bản** — bản
gốc in 1973 (tập I) và tái in 1986, nay vẫn tái bản thương mại.

**Ranh giới được test giữ.** `tests/unit/external-reference.test.ts` (12 test) chặn cả hai
chiều: một tra cứu toàn văn không bao giờ thành tầng store, và một tầng store không được khai
ở đây. Test quan trọng nhất so **snapshot trước/sau** khi resolve — nếu một tra cứu toàn văn
lọt vào cột, số segment và nội dung từng phiên bản sẽ khác, và test bắt được.

Quy tắc chi tiết: `skill/translation.md` §7.1–§7.2 và `source/external-references.yaml` `rules:`.
