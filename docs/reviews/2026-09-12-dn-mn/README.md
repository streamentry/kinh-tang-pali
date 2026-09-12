# DN/MN quality review, 2026-09-12

## Kết quả và giới hạn

**Đây là đợt sửa đầu tiên, không phải xác nhận tất cả DN/MN đã đạt trên 9/10.**

| Phạm vi | Kết quả |
| --- | --- |
| Kiểm kê kỹ thuật toàn bộ DN/MN | 186 bài, 43.596 segment: DN 16.401; MN 27.195 |
| Review nghĩa toàn bài, đọc đối kháng và chấm lại | [DN29](dn29.md), [MN76](mn76.md): 705 segment |
| Sửa cục bộ | [MN66/MN77](targeted-repairs.md): 7 segment |
| Bài chưa hoàn tất review toàn bài trong đợt này | 184/186, gồm cả hai bài sửa cục bộ |

Bản trước có điểm cao và kiểm thử kỹ thuật đều qua, nhưng vẫn sai người nói, sai thuật ngữ, lệch nội dung giữa các ID và sai con số. **Điểm có sẵn trong metadata không được dùng làm bằng chứng rằng review nghĩa đã hoàn tất.** DN29 và MN76 có scorecard mới kèm căn cứ; các bài khác chỉ có điểm đã được ghi trước đó.

## Có thể kiểm tra lại

- Baseline repository: `fa8f8a4c1effa490f4fe4d6e7bcb0332c4d356bf`.
- Pāli và English: pinned `11c9d708978cde8ba61096d8a75f7ddfb846f639`.
- [Manifest nguồn và phạm vi](manifest.json).
- [Kiểm kê từng bài](inventory.json), được tạo bằng `npm run audit:dn-mn`.
- [Danh sách segment thay đổi](changed-segments.json), so với đúng baseline trên.
- Các sửa đổi nằm trong canonical JSON hiện có; không có bộ bản dịch thứ hai.

## Các bước kiểm tra đã chạy

`npm run validate`, `npm test`, `npm run check`, `npm run build` đều đạt trên bản sửa. Suite có **17 test**, gồm kiểm thử chữ ngoại lai và lỗi đã tìm thấy. Astro check: 0 lỗi, 0 cảnh báo, 1 gợi ý cũ. Pagefind chưa hỗ trợ stemming tiếng Việt; đây là giới hạn tìm kiếm, không phải lỗi build.

Validator mới chặn chữ cái ngoài hệ Latin và ký tự thay thế hỏng trong bản kinh tiếng Việt. Tên Pāli dùng chữ Latin vẫn hợp lệ; chú thích có thể dẫn chữ của ngôn ngữ khác. Guard này **không phát hiện hết English sót lại, không kiểm chứng Pāli và không chứng minh đúng nghĩa**. Các test hồi quy là ví dụ cụ thể, không phải máy chấm dịch.

## Điều kiện để đóng toàn bộ yêu cầu

Mỗi bài còn lại cần được đọc toàn văn theo ba lớp nguồn, kiểm tra từng segment, làm lượt đọc đối kháng, ghi bất định và chấm đủ 10 tiêu chí với các kiểm tra kỹ thuật đạt. Không đánh dấu hoàn thành chỉ nhờ quét tự động, sửa vài câu hoặc tái sử dụng điểm 9.x cũ. Bài có blocker phải sửa hoặc hạ `draft` theo AGENTS.md.

Ưu tiên bước biên tập tiếp theo: hoàn tất MN66 và MN77, sau đó trở về DN1/MN1 theo thứ tự. Đây là backlog công khai, **không phải một tác vụ đang chạy nền**.
