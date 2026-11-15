# Tái đánh giá lô 16 — MN151–MN152

Ngày: **2026-11-15**. Hai bài cuối cùng của phạm vi 152 bài đã được đọc, đối chiếu nguồn, chấm và chọn qua CLI. Cả bốn phiên bản đạt gate: mean ít nhất 9,0, bốn tiêu chí đầu ít nhất 9,0, không blocker. Điểm thấp nhất **9,34/10**, cao nhất **9,49/10**.

| Bài | Trẻ em | Người lớn tuổi |
| --- | ---: | ---: |
| MN151 | 9,34 | 9,49 |
| MN152 | 9,36 | 9,48 |

## Phạm vi và đối chiếu

Pāli root tại Bilara commit `11c9d708978cde8ba61096d8a75f7ddfb846f639` là authority. Đã đối chiếu Sujato, bản Việt dự án, HTML Thích Minh Châu toàn bài và ghi chú. **11/11 dependency SHA** của MN151–MN152 khớp.

Hai ghi chú nguồn dùng chung in đường dẫn root có tiền tố `pli/ms` lặp trong phần provenance. Các dependency có cấu trúc trỏ đúng tệp pinned và đã hash-check. Không đổi ghi chú dùng chung để tránh làm stale adult reviews.

## Lượt đọc

- **MN151:** giữ ba chặng tự xét quanh việc khất thực, phân biệt điều cần bỏ/hiểu/tu/chứng và nhắc việc đã làm được vẫn cần được nuôi dưỡng. Không sửa prose.
- **MN152:** giữ ba phần tu tập, phân biệt bậc đang học với bậc đã thuần thục, năm cách nhận diện và lời dặn tu thiền. Không sửa prose.

Cả hai bản adults và selected review ID không đổi. Canonical sutta text, shared meaning map và audio không đổi.

## Kiểm tra local

Các cổng cuối của toàn lô được chạy lại trên nhánh chứa MN131–MN152:

- Validator: pass; 2.275 advisory hiện có.
- Quality history: 5.840 kiểm tra, 0 lỗi. Explanation audit: 558 bản published, 186/186 bài đủ, 0 lỗi.
- Unit tests: 505 tổng; 501 đạt, 4 bỏ qua, 0 lỗi. Astro check: 281 file; 0 lỗi, 0 warnings, 52 hints.
- Astro build: 7.814 trang. Pagefind: 6.991 trang, 468.799 từ, 2 bộ lọc.
- Static reader: [4/4 panel đạt](reader-static-batch-16-20261115.json), khớp nội dung, score, ngày, reviewer và trạng thái.

Build launcher `npm run build` từng gặp sandbox `tsx` IPC EPERM; các bước sync, validate, tests/check, Astro build và Pagefind được chạy trực tiếp, tuần tự và đều pass. `dist/` là output local bị `.gitignore` loại; không có media được thêm vào Git. Không có public-site/viewport test, thử hiểu với độc giả thật hoặc thẩm định độc lập của học giả Pāli.

## Toàn bộ phạm vi

Đã chọn review cho **304/304** phiên bản; `progress.json` đánh dấu phần review hoàn chỉnh. MN81–MN130 đã merge qua PR #2065. PR #2066 cho MN131–MN140 đang mở; MN141–MN152 vẫn local trên nhánh batch15, chưa được đẩy hoặc đưa vào PR. Vì vậy việc phát hành toàn bộ phạm vi vẫn chờ merge các PR còn mở.
