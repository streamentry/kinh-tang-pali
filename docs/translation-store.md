# Translation store

Mọi bài kinh trong dự án được đọc qua **một store nhiều tầng**, khai báo tập trung trong
[`source/layers.yaml`](../source/layers.yaml). Mục tiêu: người dịch luôn nhìn thấy đủ bối
cảnh và biết chính xác nguồn gốc của từng câu, thay vì phải tự đi tìm.

```bash
npm run source:sync:all     # tải mọi tầng upstream đã pin
npm run store -- an4.59     # đọc một bài qua toàn bộ store
npm run audit:store         # kiểm kê store theo từng tầng
```

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

**Vì sao ngưỡng 0.8.** Phân bố thực đo trên 1.589 bài có bản dịch:

| coverage | số bài | |
| --- | --- | --- |
| ≥ 99% | 1073 | nguyên vẹn |
| 80–99% | 216 | nguyên vẹn |
| 50–80% | 119 | mất tham khảo |
| 1–50% | 16 | mất nặng |
| 0% | 1 | không có English nào |

1.073 bài đã ở ≥ 99%, nên 0.8 chỉ đúng vào 136 bài thực sự mất tầng tham khảo. Nới lên 0.5
sẽ âm thầm chấp nhận 119 bài kế tiếp.

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

## Trạng thái tại 2026-09-27

| tầng | bài có dữ liệu | segment | có prose |
| --- | --- | --- | --- |
| `pali` | 1589/1589 | 82.995 | 82.993 |
| `english-sujato` | 1589/1589 | 82.995 | 73.033 |
| `english-project` | 3 | 5 | 5 |
| `vietnamese-current` | 26 | 2.234 | 2.185 |
| `vietnamese-project` | 1589/1589 | 82.995 | 82.995 |

- English coverage: 1.234/1.589 bài không còn Pāli có nội dung nào chưa có English.
- Bản lấp của dự án: 3 bài, 5 segment — hạt giống chứng minh pipeline chạy đúng.
- `vietnamese-current` chỉ phủ 26 bài: tại commit đang pin, corpus Thích Minh Châu trong
  bilara-data **chỉ có Pháp Cú**. 1.563 bài còn lại không có bản Việt hiện hành trong
  snapshot upstream. Đây là đặc điểm của snapshot, không phải thiếu sót của repo, và
  `sync-source` báo `not covered upstream` chứ không coi là lỗi.

## Hàng đợi lấp English

Sắp theo số segment Pāli có nội dung còn thiếu English, nhỏ trước để có thể kiểm chứng
từng bài:

1. `an3.149` (1), `an3.153` (1), `an4.59` (3) — **đã làm xong**, xem `content/translation/en/project/`
2. `an4.116` (2), `ud7.3` (2), `sn3.6` (2), `sn3.9` (2), `sn11.24` (2)
3. `an4.40` (2), `ud8.9` (2), `an4.59`→đã xong, `an4.29` (3), `an5.20` (3), `iti81` (3)
4. Các bài lớn: `mn42` (72), `mn15` (163), `an4.46` (15), `an3.112` (22)

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
