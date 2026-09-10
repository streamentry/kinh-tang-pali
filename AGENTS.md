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

Translation skill là chuẩn có thẩm quyền cho mục tiêu, hierarchy nguồn, provenance, phương pháp đối chiếu Pāli/English/Thích Minh Châu, nguyên tắc dễ hiểu, xử lý Hán–Việt, ambiguity, semantic audit và Definition of Done.

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
- Không tự chuyển nội dung sang `published` khi chưa có human review theo workflow của repo.

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
