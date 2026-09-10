# AGENTS.md

Repository này xây bản dịch Kinh tạng Pāli tiếng Việt mới, ưu tiên **Kinh Trung Bộ (Majjhima Nikāya)** trước, đồng thời giữ cấu trúc mở rộng cho năm Nikāya.

## Bắt buộc đọc trước khi làm việc

Mọi tác vụ liên quan đến dịch, sửa/review bản dịch, chọn thuật ngữ, viết chú thích hoặc đổi trạng thái `draft` / `review` / `published` **phải đọc đầy đủ [`skill/translation.md`](skill/translation.md) trước khi chỉnh nội dung**.

`skill/translation.md` là chuẩn có thẩm quyền cho mục tiêu dịch, hierarchy nguồn, provenance, phương pháp đối chiếu Pāli/English/Thích Minh Châu, semantic audit, văn phong và Definition of Done. File này định nghĩa thêm **quality gate bắt buộc** để quyết định trạng thái xuất bản.

## Invariants của repository

- Pāli source là snapshot SuttaCentral/Bilara được pin bởi `source/suttacentral.lock.json`; không dùng bản Pāli không rõ provenance làm authority.
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

Kiến trúc nền tảng và data contract nằm tại [`docs/architecture.md`](docs/architecture.md).
