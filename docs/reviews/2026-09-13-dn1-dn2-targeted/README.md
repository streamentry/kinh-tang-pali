# DN1 và DN2: sửa cục bộ, 2026-09-13

**Đợt này sửa 17 đoạn, không phải hoàn tất review toàn văn hai bài và không phải chứng nhận điểm trên 9/10.**

| Bài | Đoạn dịch thay đổi | Review toàn văn được xác nhận trong đợt này |
| --- | ---: | --- |
| DN1, Kinh Phạm Võng | 5 | Chưa |
| DN2, Kinh Sa-môn Quả | 12 | Chưa |

## Nội dung thay đổi

- DN1 `1.11.2`, DN2 `46.2`: phân biệt phaḷubīja (đốt/khúc cây) với cách dịch sai thành quả.
- DN1 `1.13.2`, `1.14.2`: sửa các mục lặp/thêm hoặc đặt nhầm trong danh sách biểu diễn và trò chơi; không tự thêm tính chất trận đánh giả. Những tên cổ có nhiều cách đọc được ghi chú, không khẳng định đã giải quyết dứt điểm.
- DN1 `1.15.2`, DN2 `50.2`: khôi phục các tấm trải cho voi, ngựa và xe; bỏ cách dịch "trải tay" và mục "da cọp" không có trong nguồn. Ghi khác biệt cách hiểu các loại đồ trải cổ.
- DN1 `3.20.2`, DN2 `35.6`, `37.9`: dùng "năm thứ dục lạc" thay cho "dục công đức". Đoạn DN1 vẫn là quan điểm được dẫn lại trong kinh, không phải lời xác nhận rằng hưởng dục là Niết-bàn.
- DN2 `18.7`, `21.7`, `24.7`, `27.7`, `30.7`, `33.10`: giữ đầy đủ phủ định về chấp nhận và bác bỏ, không đổi thành "chỉ ghi nhận", "giữ nguyên" hoặc "không bẻ gãy".
- DN2 `78.1`, `80.1`: làm rõ giả định không có mưa rào và các hoa sen không vươn khỏi mặt nước; giữ phép so sánh về thiền, không thêm hướng dẫn thực hành.

Chú thích DN2 về kết tên bài được chuyển từ ID sai `99.7` sang đúng `102.7`; sửa lời bình đếm sai các phẩm tính vua cha ở `99.6`. Các giải thích mới nằm trong comment JSON, không nhập vào lời kinh.

## Nguồn và kiểm chứng

Baseline GitHub: `36062aa37ecb4081092168b50d5f8a87b02a99d0`. Hai bản dịch cũ được so hash chính xác với bản có trong workspace, không coi gói bảo toàn rỗng là bản dịch đã hoàn tất.

Pāli và English Bhikkhu Sujato: SuttaCentral/Bilara commit `11c9d708978cde8ba61096d8a75f7ddfb846f639`. Bản HT. Thích Minh Châu: `buddhanussati/loicuaducphat`, commit `9a9fdc135c83be0fd78df5353c55267d6b0ea7fd`, `dn/dn1.html` và `dn/dn2.html`.

[changes.json](changes.json) ghi 17 giá trị thay thế, các chỉnh chú thích, sáu hash nguồn và bốn hash file trước khi sửa. Chỉ áp dụng khi hash file gốc và source pin còn khớp; không ghi đè công việc song song. Diff Git là bản đối chiếu trước/sau. Không sao chép toàn văn nguồn bên thứ ba vào PR.

Các đoạn thuộc phạm vi được đọc cùng Pāli, Sujato và đoạn tương ứng của bản Thích Minh Châu; sau biên tập kiểm lại phủ định, danh sách và tính tự nhiên của tiếng Việt. Đó là đối chiếu cục bộ, không được quy đổi thành số bài đã review toàn văn.

## Kiểm thử và giới hạn

Các bước nghiệm thu: kiểm tra hash và ID, `npm run source:sync:used`, `npm run validate`, `npm test`, `npm run check`, `npm run build`, `git diff --check`. Kết quả thực tế phải lấy từ workflow run/CI của PR, không suy ra chỉ vì các lệnh được liệt kê ở đây.

Các test hồi quy chỉ giữ cấu trúc và phòng các lỗi cụ thể; chúng không chấm nghĩa Pāli và không chứng minh chất lượng 9.x. Không đóng băng toàn bộ câu dịch theo snapshot, để lần biên tập có căn cứ sau vẫn có thể cải tiến.

**Không thay scorecard hoặc trạng thái xuất bản hiện có trong đợt sửa cục bộ này. Không xác nhận lại các điểm cũ. DN1/DN2 chưa được cộng vào tổng số bài đã hoàn tất review toàn văn.** Việc nghiệm thu toàn bài theo AGENTS.md vẫn còn phải thực hiện; mục tiêu toàn bộ DN/MN trên 9/10 chưa được tuyên bố hoàn tất.
