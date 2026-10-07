# Phương pháp QC và chấm điểm bản dịch

File này là **chuẩn duy nhất** cho việc chấm điểm, lỗi chặn, publication gate và lưu lịch sử
đánh giá. `AGENTS.md`, `skill/translation.md` và `README.md` chỉ tóm tắt và trỏ về đây; khi
có khác biệt, **file này và code thắng**.

Nguồn sự thật máy đọc được:

| Nội dung | Nơi định nghĩa |
| --- | --- |
| Key + mô tả rubric bản dịch / tóm tắt | `src/lib/canon/quality.ts` (`TRANSLATION_RUBRIC`, `SUMMARY_RUBRIC`) |
| Danh sách key scorecard trong metadata | `src/lib/canon/types.ts` (`TRANSLATION_QUALITY_KEYS`) |
| Ngưỡng status, kiểm `meta.quality` | `scripts/lib/quality.ts` (`expectedStatusForQuality`, `validateQualityAssessment`) |
| Kiểm lịch sử đánh giá | `src/lib/canon/quality.ts` (`validateAssessmentHistory`, `assessmentIsCurrent`) |
| CLI ghi/áp dụng/kiểm | `scripts/assess-quality.ts` (`npm run quality`, `npm run quality:check`) |

`tests/unit/quality-doc.test.ts` chặn khi bảng rubric hoặc ngưỡng dưới đây lệch khỏi code.

---

## 1. Quy trình tóm tắt

1. Đọc bài qua toàn bộ store (`npm run store -- <uid>`) và dịch theo `skill/translation.md`.
2. Chạy technical gate: `npm run validate`, `npm test`, `npm run check` (+ `npm run build` nếu bài
   sẽ `published` hoặc thay đổi chạm website/build).
3. Làm **một lượt review đối kháng riêng** — mục tiêu là tìm lỗi, không bảo vệ bản vừa viết.
   Không chấm khi bản dịch còn dang dở.
4. Kiểm **blocking errors** (§4) trước, rồi chấm đủ 10 tiêu chí (§2).
5. Ghi lượt chấm vào lịch sử: `npm run quality -- --record <uid> <assessment.json>` (§7).
6. Áp dụng lượt `full` làm scorecard chính thức: `npm run quality -- --apply <uid> <id>` (§8).
   Công cụ tự đặt `status` theo §5. **Không sửa tay `meta.quality` hay `status`.**

---

## 2. Rubric bản dịch — 10 tiêu chí, mỗi tiêu chí 0–10

| # | Key | Tên | Câu hỏi khi chấm |
| --- | --- | --- | --- |
| 1 | `source_provenance` | Nguồn & xuất xứ | Đúng UID, đúng Pāli/commit đã ghim; English và bản Thích Minh Châu xác định đúng; claim về nguồn kiểm lại được. |
| 2 | `semantic_fidelity` | Đúng nghĩa Pāli | Giữ đủ semantic unit; không thêm/bớt ý, không lệch giáo nghĩa, không biến diễn giải thành nguyên văn. |
| 3 | `grammar_logic` | Ngữ pháp & logic | Đúng người nói, chủ thể, đối tượng, phủ định và scope, điều kiện, nhân quả, thời gian, số lượng, mức độ, modality, so sánh. |
| 4 | `segment_alignment` | Đủ đoạn & căn chỉnh | Đủ segment, đúng segment ID, không orphan/lệch; lặp và dấu lược không làm mất nghĩa canonical. |
| 5 | `terminology` | Thuật ngữ | Đúng ngữ cảnh, không làm phẳng các phân biệt quan trọng; tên riêng/danh xưng nhất quán; glossary dùng/cập nhật hợp lý. |
| 6 | `triangulation` | Đối chiếu nguồn | Đã đối chiếu Pāli + English SuttaCentral + Thích Minh Châu khi có; bất đồng quan trọng phân xử bằng Pāli/ngữ cảnh, khi cần thì từ điển/ngữ pháp/parallel. |
| 7 | `vietnamese_clarity` | Tiếng Việt sáng rõ | Người Việt hiện đại hiểu ngay; câu tự nhiên, không calque máy móc, không giả cổ, vẫn giữ sắc thái nguyên bản. |
| 8 | `han_viet_balance` | Hán–Việt & súc tích | Giữ Hán–Việt khi chính xác/súc tích/quen thuộc; thay khi tối nghĩa; không dài dòng chỉ để né thuật ngữ. |
| 9 | `ambiguity_integrity` | Bất định & trung thực | Không che giấu bất định; cách hiểu khác đáng kể được ghi comment; không bịa Pāli, nguồn, parallel, nghĩa từ điển. |
| 10 | `technical_integrity` | Kỹ thuật & phát hành | JSON/YAML hợp lệ, NFC, metadata đúng, provenance/licence ổn, mọi validation/test/check/build bắt buộc đều pass. |

Ràng buộc khi chấm:

- `technical_integrity` phải phản ánh **kết quả máy thực tế**. Lệnh bắt buộc fail → ghi lỗi chặn,
  chấm thấp. Không chạy được lệnh → không được tuyên bố đã pass (chấm thấp hơn 10, ghi lý do).
- Bản lấp English (`english-project`) chấm `triangulation` thấp hơn bình thường vì không có bản Anh
  độc lập để đối chiếu.
- Khi bản lấp English và bản Việt cùng một người/agent chấm, scorecard tiếng Việt **không được**
  tuyên bố đã đối chiếu English độc lập (`validate` cảnh báo khi trùng `assessed_by`).

## 3. Rubric tóm tắt — chỉ MN/DN

Tóm tắt có rubric 10 tiêu chí riêng, **không ảnh hưởng publication gate của lời kinh**. SN, AN, KN
chỉ có rubric bản dịch.

| Key | Tên |
| --- | --- |
| `source_fidelity` | Bám sát bài kinh |
| `core_coverage` | Đủ ý chính |
| `argument_structure` | Cấu trúc lập luận |
| `context` | Bối cảnh & người nói |
| `terminology` | Thuật ngữ |
| `clarity` | Sáng rõ & tự nhiên |
| `concision` | Súc tích (≤ 500 từ) |
| `editorial_separation` | Tách biệt lời kinh |
| `ambiguity_integrity` | Bất định & trung thực |
| `technical_integrity` | Kỹ thuật & trình bày |

Mô tả đầy đủ từng tiêu chí: `SUMMARY_RUBRIC` trong `src/lib/canon/quality.ts`.

---

## 4. Blocking errors

Blocker **luôn thắng điểm số**: có ít nhất một blocker thì bài là `draft`, kể cả khi điểm 10/10.
Không được "bù" blocker bằng điểm cao ở tiêu chí khác.

1. **Sai hoặc không xác minh được source/provenance** — sai UID, nhầm Pāli, sai commit đã ghim,
   nguồn quan trọng bị gán provenance sai.
2. **Sai nghĩa trọng yếu** — lỗi đã biết làm đổi nghĩa Pāli/giáo nghĩa: phủ định, chủ thể, quan hệ
   logic, số lượng, điều kiện, kết luận.
3. **Thiếu/sai segment** — thiếu segment bắt buộc, orphan, sai UID, lệch, hỏng cấu trúc canonical.
4. **Hallucination / thêm không căn cứ** — bịa nội dung, nguồn, nghĩa Pāli/từ điển/parallel, hoặc đưa
   lời giải thích vào lời kinh như nguyên văn.
5. **Validation failure** — `npm run validate` hoặc test/check/build bắt buộc cho thay đổi đó fail.
6. **Bất định trọng yếu chưa giải quyết** — có thể đổi đáng kể nghĩa đoạn kinh mà chưa được phân xử
   hoặc ghi nhận đủ để bảo vệ câu chữ canonical.
7. **Vi phạm provenance/licence** — copy nội dung bên thứ ba vượt phạm vi cho phép hoặc không truy
   nguồn hợp lệ được.

`blocking_errors` là mảng chuỗi không rỗng; mảng rỗng nghĩa là **đã kiểm và không phát hiện**,
không phải "chưa kiểm".

## 5. Tính điểm và status

```text
final_score = (score_1 + … + score_10) / 10      # trung bình số học thô
```

- Gate dùng **giá trị thô**, không dùng điểm đã làm tròn. Có thể hiển thị 2 chữ số thập phân.
- Trong `meta.quality`, `final_score` được phép lệch mean tối đa `0.005` (làm tròn hiển thị);
  trong lịch sử `full`, `final_score` phải bằng mean (sai số `1e-6`) — công cụ tự tính.

Thứ tự quyết định:

| Điều kiện | Status |
| --- | --- |
| Có blocker | `draft` |
| Không blocker, `final_score > 9.0` | `published` (trực tiếp) |
| Không blocker, `8.0 <= final_score <= 9.0` | `review` |
| Không blocker, `final_score < 8.0` | `draft` |
| Chưa có scorecard đủ 10 tiêu chí | `draft` |

**Đúng `9.0` không đủ để `published` — phải lớn hơn 9.0.** Human review được khuyến khích nhưng
không bắt buộc; agent được publish trực tiếp nếu vượt gate và không có blocker. Bài `review`/
`published` phải có `assessed_at` và `assessed_by`.

`published` không có nghĩa "không bao giờ sửa". Phát hiện blocker sau khi publish → sửa ngay hoặc
hạ về `draft` bằng một lượt `full` mới.

---

## 6. Nơi lưu

| Dữ liệu | Đường dẫn | Ghi bằng |
| --- | --- | --- |
| Scorecard chính thức + status bản Việt | `content/meta/sutta/<collection>/<uid>.yaml` → `quality`, `status` | `npm run quality -- --apply` |
| Lịch sử mọi lượt chấm (chỉ thêm, không ghi đè) | `content/meta/assessments/<collection>/<uid>.json` | `npm run quality -- --record` / `--audit-all` |
| Scorecard lớp lấp English | `content/meta/en/<collection>/<uid>.yaml` → `quality`, `status` | sửa trực tiếp; cùng rubric và gate §2–§5 |
| Ghi chú review dài theo bài (tuỳ chọn) | `docs/translation-notes/<uid>.md` | tay |

Dạng `meta.quality` (do `--apply` sinh ra):

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
    - "<người hoặc công cụ thực sự chấm>"
  assessment_id: "<id của lượt full trong lịch sử>"
```

`quality.assessment_id` nối scorecard chính thức với lịch sử; validator chặn nếu lệch hoặc text đã
đổi sau lượt chấm.

---

## 7. Ghi một lượt chấm vào lịch sử

Mỗi lượt có ID riêng, ngày, người/công cụ chấm, ghi chú, điểm, lỗi chặn, SHA-256 nội dung và commit
Pāli. Dấu vân tay của tóm tắt gồm cả bản dịch mà nó tóm tắt. Web cảnh báo khi nội dung hoặc nguồn đã
đổi; lượt cũ vẫn còn để tra cứu. Một bài chấm được nhiều lần, kể cả cùng ngày.

Chuẩn bị JSON:

| Trường | Giá trị |
| --- | --- |
| `target` | `translation` hoặc `summary` (chỉ MN/DN) |
| `scope` | `full`, `content` hoặc `technical` (xem dưới) |
| `assessed_at` | ngày thực tế, `YYYY-MM-DD` |
| `assessed_by` | danh sách người/công cụ **thực sự** đánh giá |
| `notes` | segment quan trọng, nguồn đã đọc, giới hạn, lỗi phát hiện — bắt buộc, không rỗng |
| `scores` | đúng 10 key của rubric tương ứng, mỗi điểm 0–10 hoặc `null` theo scope |
| `blocking_errors` | mảng lỗi chặn, hoặc `[]` khi đã kiểm và không phát hiện |

Chạy `npm run quality -- --record <uid> <assessment.json>`. Công cụ tự sinh ID, tính mean thô, ghim
nội dung và nguồn.

### Ba loại scope

| Scope | Khi nào | Điểm | `final_score` | Được `--apply`? |
| --- | --- | --- | --- | --- |
| `full` | Đã đọc toàn bài, review đối kháng **và** đã có kết quả technical gate | đủ 10 | mean thô | có (chỉ `translation`) |
| `content` | Đã đọc toàn bài, review đối kháng, nhưng chưa xác nhận được technical gate | 9 tiêu chí nội dung; `technical_integrity: null` | `null` | không |
| `technical` | Kiểm tự động bằng máy | bản dịch: chỉ `segment_alignment`; tóm tắt: chỉ `technical_integrity`; còn lại `null` | `null` | không |

- `content` không tính vào số bài đã chấm đầy đủ và không nâng status. Ghi rõ nguồn đã đọc, điểm cần
  phân xử và vì sao còn chờ trong `notes`. Lượt `full` sau đó là **bản ghi mới**, giữ lượt cũ.
- `technical` điểm 10 chỉ nghĩa các phép kiểm đã mô tả đạt, **không** chứng minh nghĩa đúng hay toàn
  bộ bộ kiểm phát hành đã đạt. Tiêu chí không đo được là `null`, web hiển thị "Chưa đánh giá".

### Kiểm tra kỹ thuật toàn corpus

`npm run quality -- --audit-all YYYY-MM-DD` ghi một lượt `technical` cho mỗi bản dịch trong catalog
có tệp canonical và mỗi tóm tắt MN/DN có nội dung. Ngày phải là ngày thực tế chạy; chạy lại cùng ngày
với cùng nội dung không thêm bản trùng.

- Bản dịch: kiểm segment ID, tính đầy đủ, giá trị, NFC, hệ chữ Latin.
- Tóm tắt: kiểm số từ, đoạn văn, văn xuôi thuần, NFC.

Audit hàng loạt **không thay được** full review từng bài.

### Scorecard cũ (legacy)

Lần đầu ghi lịch sử, công cụ lưu nguyên scorecard hiện có vào `legacy_quality`. Đây là bản lưu
metadata, không phải lượt review mới: không gán hash hay ngày mới cho kết quả cũ. Scorecard cũ không
có hash/ghi chú được hiển thị nguyên trạng, có nhãn lịch sử. Kết quả giống nhau chỉ hiện một lần.

---

## 8. Áp dụng lượt `full` làm quality gate chính thức

```bash
npm run quality -- --apply <uid> <assessment-id>
```

- Chỉ nhận lượt `full` của **bản dịch**, đúng nội dung và nguồn hiện tại; `content`/`technical`
  hoặc lượt đã cũ bị từ chối.
- Cập nhật `meta.quality` và `status` theo §5. Danh sách người dịch giữ nguyên; reviewer trước được
  giữ trong `reviewers`; điểm cũ vẫn trong lịch sử.
- Lịch sử bổ sung **không tự đổi status** — chỉ `--apply` mới đổi.
- Lượt `full` có thể ghi nhận bản chất lượng thấp hoặc có lỗi chặn; "đã chấm" không đồng nghĩa
  "đã đạt". Không bỏ qua lỗi toàn repo để tự gán `published`.

## 9. Báo cáo và kiểm tra

| Lệnh | Việc |
| --- | --- |
| `npm run quality -- --report` | Inventory: bài nào đã audit, đã đọc nội dung, có full review khớp nội dung, bước tiếp theo. Là snapshot — sinh lại sau khi bản dịch/lịch sử đổi. |
| `npm run quality:check` | Kiểm cấu trúc toàn bộ lịch sử. Được gọi trong `npm run validate`, nên CI cũng kiểm. |
| `npm run validate` | Gồm `validateQualityAssessment`: status phải khớp điểm/blocker, `final_score` phải khớp mean. |

## 10. Không được làm

- Sửa tay `meta.quality` hoặc `status` thay vì `--record` + `--apply`.
- Ghi đè hay xoá lượt chấm cũ; gắn ngày mới cho scorecard cũ để biến nó thành lượt chấm lại.
- Đổi tên người dịch/công cụ lịch sử.
- Dùng lượt `technical`/`content` để nâng status hoặc tuyên bố đã review nghĩa.
- Tự nâng điểm để vượt ngưỡng; chấm `technical_integrity` cao khi chưa chạy hoặc đã fail lệnh bắt buộc.
- Ghi `assessed_by` khác người/công cụ thực sự đã chấm.
