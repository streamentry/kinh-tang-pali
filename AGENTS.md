# AGENTS.md

Repository này xây bản dịch Kinh tạng Pāli tiếng Việt mới, ưu tiên **Kinh Trung Bộ (Majjhima Nikāya)** trước, đồng thời giữ cấu trúc mở rộng cho năm Nikāya.

## Bắt buộc đọc trước khi làm việc

### Dịch thuật

Mọi tác vụ có liên quan đến:

- dịch Pāli → tiếng Việt;
- sửa hoặc review bản dịch;
- lựa chọn/chuẩn hóa thuật ngữ;
- thêm chú thích dịch thuật;
- thay đổi trạng thái `draft`, `review`, `published` của nội dung dịch;

**phải đọc đầy đủ [`skill/translation.md`](skill/translation.md) trước khi chỉnh nội dung.**

Translation skill là chuẩn có thẩm quyền cho mục tiêu, hierarchy nguồn, provenance, phương pháp đối chiếu Pāli/English/Thích Minh Châu, nguyên tắc dễ hiểu, xử lý Hán–Việt, ambiguity, semantic audit, quality gate và Definition of Done.

## Invariants của repository

- Pāli source là snapshot SuttaCentral/Bilara được pin bởi `source/suttacentral.lock.json`; không dùng một bản Pāli không rõ provenance làm authority.
- Canonical Vietnamese scripture là segmented JSON trong `content/translation/vi/project/`.
- Giữ nguyên canonical SuttaCentral UID và segment ID; không zero-pad hoặc tự phát minh ID.
- Không copy Pāli vào translation JSON.
- Workflow dịch mặc định là **đối chiếu Pāli root + ít nhất một bản English SuttaCentral phù hợp + bản Hòa thượng Thích Minh Châu khi có**, rồi viết một bản tiếng Việt mới.
- English và bản Thích Minh Châu là reference layers quan trọng; **Pāli root là authority cuối cùng** khi các nguồn bất đồng.
- Không chỉ dịch vòng English → Vietnamese rồi bỏ qua Pāli.
- Không chỉ hiện đại hóa hoặc thay từ đồng nghĩa trên bản Thích Minh Châu rồi coi đó là bản dịch mới.
- Có thể giữ thuật ngữ/cách diễn đạt Hán–Việt từ truyền thống khi nó đúng, quen thuộc và súc tích; giảm Hán–Việt khi nó làm câu khó hiểu mà không thêm độ chính xác.
- Không tự thêm explanatory meaning để làm câu “dễ hiểu”. Chỗ giải thích, alternative reading hoặc uncertainty thuộc lớp comment/glossary.
- Không copy nguyên văn dài từ bản dịch bên thứ ba vào canonical translation; mọi nguồn tham khảo quan trọng phải có provenance phù hợp.

## Quality gate bắt buộc cho bản dịch

Trước khi quyết định trạng thái của **mỗi bài kinh hoàn chỉnh**, agent/reviewer phải tự chấm chất lượng theo 10 tiêu chí dưới đây. Mỗi tiêu chí chấm từ **0.0 đến 10.0**, dựa trên bằng chứng thực tế trong source và output, không chấm theo cảm giác chung.

1. **Fidelity với Pāli** — câu Việt phản ánh đúng nghĩa Pāli, không tự thêm hoặc làm mất semantic unit.
2. **Độ chính xác logic/ngữ pháp** — đúng speaker, chủ thể, đối tượng, phủ định, scope, điều kiện, nhân quả, thời gian, số lượng, mức độ, so sánh, compound và particle quan trọng.
3. **Đối chiếu nguồn** — đã thực sự triangulate Pāli + English SuttaCentral + Thích Minh Châu khi có; disagreement quan trọng được phân xử bằng Pāli/context.
4. **Provenance & segment integrity** — đúng UID/segment ID, đúng pinned source, đủ provenance và có thể truy ngược từng chi tiết quan trọng.
5. **Thuật ngữ Phật học** — chính xác theo context, không làm phẳng distinction, nhất quán hợp lý với glossary và các formula liên quan.
6. **Độ rõ ràng tiếng Việt** — người Việt hiện đại đọc tự nhiên, hiểu đúng ngay, không bị văn dịch cổ hoặc calque làm tối nghĩa.
7. **Cân bằng Hán–Việt & súc tích** — giữ Hán–Việt khi kỹ thuật/súc tích, thay khi cổ hoặc khó hiểu; không thuần Việt hóa cực đoan và không giả cổ.
8. **Tính nhất quán cấu trúc** — formula, danh xưng, proper names, repetition, quotation nesting, danh sách và các đoạn song song được xử lý nhất quán.
9. **Xử lý ambiguity & biên tập trung thực** — không làm câu chắc chắn hơn Pāli; chỗ chưa chắc hoặc disagreement đáng kể có comment/note phù hợp.
10. **Toàn vẹn kỹ thuật** — không thiếu segment bắt buộc; JSON/data contract hợp lệ; `npm run validate`, `npm test`, `npm run check` pass; build pass khi thay đổi ảnh hưởng website/build pipeline.

### Cách tính điểm

```text
raw_average = (score_1 + ... + score_10) / 10
```

Điểm phải được lưu hoặc báo cáo đủ để người khác biết vì sao bài được `published`, `review` hay `draft`.

### Blocking errors

Các lỗi sau **không được phép bị che bởi điểm trung bình cao**:

- có ý quan trọng trong bản Việt không được Pāli hỗ trợ, hoặc làm mất/sai một ý quan trọng của Pāli;
- sai UID/segment mapping, dùng nhầm source hoặc provenance không kiểm chứng được;
- thiếu segment bắt buộc;
- unresolved ambiguity/disagreement có khả năng làm thay đổi đáng kể nghĩa hoặc giáo nghĩa;
- hallucinate Pāli, dictionary meaning, translator, source, parallel hoặc citation;
- copy dài nội dung bên thứ ba không phù hợp provenance/license;
- validation/test/check bắt buộc không pass.

Nếu có ít nhất một blocking error thì:

```text
final_score = min(raw_average, 9.0)
```

và **không được `published`** cho đến khi blocker được sửa.

Nếu không có blocker:

```text
final_score = raw_average
```

### Quy tắc trạng thái

- **`final_score > 9.0/10`** → chuyển thẳng sang **`published`**, **không cần giữ `draft` và không bắt buộc human review trước khi publish**.
- **`8.0 <= final_score <= 9.0`** → giữ **`review`** để tiếp tục audit/cải thiện.
- **`final_score < 8.0`** → giữ **`draft`**.

Ngưỡng `> 9.0` là **strictly greater than 9.0**; điểm đúng `9.0` chưa đủ publish.

Human review vẫn được khuyến khích cho các bài quan trọng hoặc chỗ Pāli khó, nhưng không còn là điều kiện bắt buộc nếu bài đã vượt quality gate trên và không có blocker.

## Trước khi hoàn tất thay đổi nội dung

Chạy tối thiểu:

```bash
npm run validate
npm test
npm run check
```

Nếu thay đổi ảnh hưởng website/build pipeline, chạy thêm:

```bash
npm run build
```

Kiến trúc nền tảng và data contract nằm tại [`docs/architecture.md`](docs/architecture.md).
