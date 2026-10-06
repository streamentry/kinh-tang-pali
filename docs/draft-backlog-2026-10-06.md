# Vì sao còn bài `draft` — snapshot 2026-10-06

Số liệu được tính từ catalog, metadata và snapshot Bilara đã ghim tại commit
`11c9d708978cde8ba61096d8a75f7ddfb846f639` sau khi đồng bộ nguồn.

## Kết quả kiểm kê

- Quality inventory sau build liệt kê 5.430 tệp dịch: 4.210 `published`, 14 `review`,
  1.204 `draft`. Hai tệp dịch (`an11.14`, `thag12.1`) chưa có metadata/status nên không
  được tính vào nhóm draft và cũng không được tự publish.
- 1.176 bài draft không có tệp English Sujato tại commit đã ghim. Tất cả thuộc Tiểu Bộ.
  Đây là giới hạn của edition đã ghim, không phải lỗi câu dịch. Theo quy tắc repository,
  thiếu tầng English là blocker khi chuyển sang `review` hoặc `published`; lớp
  `english-project` không thay thế được một tệp edition bị upstream bỏ hẳn.
- 28 bài draft còn lại có tệp English ghim: 17 Tương Ưng Bộ, 9 Tăng Chi Bộ và 2 Tiểu Bộ.
  Có những bài còn thiếu segment dịch, có tầng English lệch alignment, có bất định nghĩa
  chưa phân xử; một số blocker coverage trong scorecard cũ đã lỗi thời khi lớp lấp English
  được publish hoặc gap được ghi nhận. Cần full review trên nội dung hiện tại trước khi
  áp dụng status.
- `reference-gaps.yaml` hiện ghi nhận 773 gap trên 5.428 mục có metadata và `--check` xác
  nhận registry đồng bộ. Gap được ghi nhận chỉ xác nhận giới hạn của tầng English; nó
  không thay thế việc review nghĩa, segment, thuật ngữ hay technical gate.

Ví dụ về các blocker còn thật trong nhóm có English: `kn/cp35` chưa dịch đủ segment;
`kn/thig2.7` có các câu English tham khảo bị lệch segment; `an/an10.70` còn bốn câu kệ
uddāna chưa có cách đọc đủ căn cứ. Các status này vẫn phải là `draft`.

## Đã sửa và publish trong lượt này

- `an6.29`: blocker cũ chỉ ghi rằng các cổng kỹ thuật chưa được chạy. Review lại đủ bài
  phát hiện lỗi ở lời nhận xét về Udāyī, `kāmarāga`, danh sách thân thể, hai thuật ngữ xương
  và một tư thế được thêm ngoài Pāli. Đã sửa, lưu full assessment ngày 2026-10-06, điểm
  9.54, không còn blocker và status `published`.
- `sn22.26`: blocker coverage cũ không còn đúng sau khi năm segment trống được lớp
  `english-project` lấp đủ và registry gap được cập nhật. Review lại bắt lỗi gõ “Rối” và
  sửa cách diễn đạt ở phần tuyên bố giác ngộ. Đã lưu full assessment ngày 2026-10-06, điểm
  9.52, không còn blocker và status `published`.

Các lần chấm cũ vẫn nằm trong lịch sử; hai lượt mới có ngày, người chấm, ghi chú, điểm,
source/content fingerprint và ID riêng. Rubric cùng lịch sử hiện có trên trang web của
hai bài.

## Cổng xác nhận

- `npm test`: 336/336 pass.
- `npm run check`: 0 lỗi, 0 cảnh báo, 5 hint.
- `validate`: pass; các cảnh báo còn lại là giới hạn nguồn hoặc gap đã ghi nhận.
- Assessment history check: 5.421 tệp, 0 lỗi.
- Đồng bộ nguồn pinned: 5.428 mục có metadata, không có lỗi fetch; các đường dẫn ngoài phạm vi
  edition được báo riêng là không được upstream bao phủ.
- Astro build: 6.146 trang; Pagefind index: 6.136 trang, 453.506 từ.

**Kết luận:** phần lớn draft không thể publish hợp lệ vì thiếu hẳn English edition đã ghim.
Trong nhóm còn lại, chỉ publish sau khi blocker cũ được xác minh là lỗi thời, toàn bài được
review lại, nội dung cần sửa đã sửa và mọi cổng kỹ thuật đều qua. Không hạ luật validate
để đổi nhãn cho những bài còn blocker.
