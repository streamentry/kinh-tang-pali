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

Translation skill là chuẩn có thẩm quyền cho mục tiêu, hierarchy nguồn, provenance, nguyên tắc dễ hiểu, xử lý Hán–Việt, ambiguity, semantic audit và Definition of Done.

## Invariants của repository

- Pāli source là snapshot SuttaCentral/Bilara được pin bởi `source/suttacentral.lock.json`; không dịch từ một bản copy không rõ provenance.
- Canonical Vietnamese scripture là segmented JSON trong `content/translation/vi/project/`.
- Giữ nguyên canonical SuttaCentral UID và segment ID; không zero-pad hoặc tự phát minh ID.
- Không copy Pāli vào translation JSON.
- Không dịch vòng từ English hoặc hiện đại hóa một bản dịch tiếng Việt có sẵn rồi coi đó là bản dịch mới.
- Các bản dịch trước, kể cả bản Hòa thượng Thích Minh Châu, chỉ được dùng như nguồn đối chiếu sau khi đã dịch độc lập từ Pāli; không phải authority thay cho Pāli root.
- Chỗ giải thích, alternative reading hoặc uncertainty thuộc lớp comment, không được lén đưa vào canonical translation như thể là nguyên văn.
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
