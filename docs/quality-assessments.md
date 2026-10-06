# Rubric và lịch sử đánh giá

Mỗi trang kinh hiển thị rubric bản dịch (10 tiêu chí trong AGENTS.md), scorecard lịch sử
trong metadata và mọi lần đánh giá bổ sung. Trung Bộ và Trường Bộ có rubric tóm tắt
riêng, gồm 10 tiêu chí, không ảnh hưởng publication gate của lời kinh. Tương Ưng Bộ,
Tăng Chi Bộ và Tiểu Bộ chỉ hiển thị rubric bản dịch.

## Lưu một lần chấm mới

Lịch sử nằm ở `content/meta/assessments/<collection>/<uid>.json`. Không ghi đè scorecard cũ
hoặc đổi người dịch lịch sử. Một bài có thể được đánh giá nhiều lần, kể cả cùng ngày;
mỗi lần có ID riêng, ngày, người/công cụ chấm, ghi chú, điểm, lỗi chặn, SHA-256 nội dung
và commit Pāli. Dấu vân tay tóm tắt bao gồm cả bản dịch mà nó tóm tắt. Web cảnh báo khi
nội dung hoặc nguồn đã đổi; đánh giá cũ vẫn còn để tra cứu.

Sau khi đọc store toàn bài và thực hiện review đối kháng theo `skill/translation.md`,
chuẩn bị JSON gồm các trường:

- `target`: `translation` hoặc `summary` (chỉ MN/DN có tóm tắt).
- `scope`: `full`.
- `assessed_at`: ngày thực tế, dạng `YYYY-MM-DD`.
- `assessed_by`: danh sách người/công cụ thực sự đánh giá.
- `notes`: ghi chú review, segment quan trọng, nguồn đã đọc, giới hạn và lỗi phát hiện.
- `scores`: đúng 10 key của rubric trong `src/lib/canon/quality.ts`, mỗi điểm 0–10.
- `blocking_errors`: mảng lỗi chặn, hoặc mảng rỗng khi đã kiểm và không phát hiện.

Chạy `npm run quality -- --record <uid> <assessment.json>`. Công cụ tự sinh ID, tính
mean thô, ghim nội dung và nguồn. `npm run quality:check` kiểm cấu trúc toàn lịch sử;
được gọi trong `npm run validate`, nên CI cũng kiểm.

Lịch sử bổ sung là bằng chứng đánh giá, **không tự thay đổi status**. Khi chốt lại
publication gate, người đánh giá cập nhật `meta.quality` và status từ lượt full review
đúng nội dung hiện tại, sau các technical gate. Không dùng lượt kiểm tra tự động để
nâng trạng thái hoặc tự tuyên bố đã review nghĩa.

## Kiểm tra kỹ thuật toàn corpus

`npm run quality -- --audit-all YYYY-MM-DD` lưu một lượt kỹ thuật cho mỗi bản dịch
trong catalog có tệp canonical, và mỗi tóm tắt MN/DN có nội dung. Ngày phải là ngày
thực tế chạy. Chạy lại cùng ngày với cùng nội dung và kết quả không thêm bản trùng.

Bản dịch: kiểm segment ID, tính đầy đủ, giá trị, NFC, hệ chữ Latin. Tóm tắt: kiểm số từ,
đoạn văn, văn xuôi thuần và NFC. Các tiêu chí không đọc/đo được là `null`, hiển thị
“Chưa đánh giá”; `final_score` cũng là `null`. Điểm kỹ thuật 10 chỉ có nghĩa các phép
kiểm đã mô tả đạt, không chứng minh nghĩa đúng hoặc toàn bộ bộ kiểm phát hành đã đạt.

Scorecard cũ không có hash hay ghi chú được hiển thị nguyên trạng, có nhãn lịch sử;
không gắn ngày mới để biến nó thành một lượt chấm lại. Muốn chấm đầy đủ toàn corpus
phải đọc và lưu full review từng bài; audit hàng loạt không thay được bước này.

## Đối chiếu nội dung đang chờ chốt kỹ thuật

`scope: content` ghi chín tiêu chí nội dung của bản dịch, `technical_integrity: null`
và `final_score: null`. Dùng khi đã đọc toàn bài và review đối kháng nhưng chưa thể
xác nhận cổng kỹ thuật. Không tính vào số bài đã chấm đầy đủ, không nâng status.
Ghi rõ các nguồn thực sự đã đọc, điểm cần phân xử và vì sao còn chờ trong `notes`.
Một lượt `full` sau đó phải là bản ghi mới; giữ lại lượt trước để tra cứu.

`npm run quality -- --report` xuất inventory từ catalog và lịch sử đang có: bài nào
đã audit, bài nào đã đọc nội dung, bài nào có full review khớp nội dung, và bước tiếp
theo. Inventory là snapshot, cần sinh lại sau khi bản dịch hoặc lịch sử thay đổi.

Lần đầu ghi lịch sử, công cụ còn lưu nguyên scorecard hiện có vào `legacy_quality`.
Đây là bản lưu metadata, không phải một lượt review mới: không gán hash hoặc ngày
mới cho kết quả cũ. Khi cập nhật `meta.quality` sau này, scorecard cũ vẫn còn trong
lịch sử và trên web; kết quả giống nhau chỉ hiện một lần.

## Chọn full review cho quality gate chính thức

Sau khi ghi một lượt `full` cho **bản dịch**, dùng
`npm run quality -- --apply <uid> <assessment-id>` để cập nhật `meta.quality` và
status theo mean thô/lỗi chặn. Chỉ áp dụng review đúng nội dung và nguồn hiện tại;
`content`/`technical` hoặc review cũ bị từ chối. Điểm cũ vẫn trong archive; danh
sách người dịch giữ nguyên và các reviewer trước được giữ trong `reviewers`.

Phải ghi đúng kết quả technical gate thực tế: test/check/build bắt buộc fail thì
lưu lỗi chặn, chấm technical thấp và status là draft. Không bỏ qua lỗi toàn repo
để tự gán published. Lượt full có điểm đầy đủ vẫn có thể ghi nhận bản chất lượng
thấp/lỗi chặn; “đã chấm” không đồng nghĩa “đã đạt”. `quality.assessment_id` liên
kết scorecard chính thức với lịch sử; validator chặn nếu bị lệch hoặc đã đổi text.
