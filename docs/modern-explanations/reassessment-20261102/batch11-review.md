# Tái đánh giá lô 11 — MN101–MN110

Ngày: **2026-11-15**.

Trạng thái: **20 bản trẻ em/người lớn tuổi đã được đọc lại, sửa khi cần, chấm và chọn qua quality gate ở local metadata.** Bản người trưởng thành cùng nội dung và lượt chấm được giữ nguyên. Nhánh hiện hành là `codex/mn-kids-seniors-reassessment-main-batch11-20261115`, tại base `ae33b8fa1012882d2adf260987e74bd367cc3e28`. Lô này chưa được đẩy, mở PR, merge hoặc xác minh trên production.

## Điểm được chọn

Điểm từng bản là trung bình thô của mười tiêu chí. Bốn tiêu chí trọng yếu đầu tiên đều từ 9,0 trở lên, không có blocker. Điểm hoàn tất từng bài là mức thấp nhất của ba bản; điểm người trưởng thành chỉ là bản nền, không được chấm lại trong lô này.

| Bài | Trẻ em | Người trưởng thành | Người lớn tuổi | Thấp nhất |
| --- | ---: | ---: | ---: | ---: |
| [MN101](../../content/meta/explanations/sutta/mn/mn101.json) | 9,58 | 9,72 (giữ cũ) | 9,69 | 9,58 |
| [MN102](../../content/meta/explanations/sutta/mn/mn102.json) | 9,58 | 9,73 (giữ cũ) | 9,68 | 9,58 |
| [MN103](../../content/meta/explanations/sutta/mn/mn103.json) | 9,71 | 9,80 (giữ cũ) | 9,74 | 9,71 |
| [MN104](../../content/meta/explanations/sutta/mn/mn104.json) | 9,64 | 9,75 (giữ cũ) | 9,71 | 9,64 |
| [MN105](../../content/meta/explanations/sutta/mn/mn105.json) | 9,64 | 9,74 (giữ cũ) | 9,73 | 9,64 |
| [MN106](../../content/meta/explanations/sutta/mn/mn106.json) | 9,50 | 9,80 (giữ cũ) | 9,66 | 9,50 |
| [MN107](../../content/meta/explanations/sutta/mn/mn107.json) | 9,63 | 9,82 (giữ cũ) | 9,73 | 9,63 |
| [MN108](../../content/meta/explanations/sutta/mn/mn108.json) | 9,59 | 9,76 (giữ cũ) | 9,73 | 9,59 |
| [MN109](../../content/meta/explanations/sutta/mn/mn109.json) | 9,74 | 9,79 (giữ cũ) | 9,78 | 9,74 |
| [MN110](../../content/meta/explanations/sutta/mn/mn110.json) | 9,69 | 9,81 (giữ cũ) | 9,76 | 9,69 |

Mức thấp nhất của cả lô là **9,50/10** ở bản trẻ em MN106. Đây là đánh giá biên tập, không phải phép đo khả năng hiểu của trẻ hay người lớn tuổi.

## Phạm vi đọc và sửa

Đã đối chiếu **452 đơn vị nghĩa và 1.613 khóa Pāli**. Root Pāli Mahāsaṅgīti tại Bilara commit `11c9d708978cde8ba61096d8a75f7ddfb846f639` là thẩm quyền cuối. English Sujato cùng commit được đọc để đối chiếu; chỗ English lấp của dự án không được tính là nguồn Anh độc lập. Snapshot không có bản Việt hiện hành phân đoạn cho MN. Các tệp nguồn được khai trong từng explanation có fingerprint khớp với bytes; bản Việt Thích Minh Châu HTML là văn bản liên tục, không tự căn vào segment.

| Bài | Đơn vị nghĩa | Khóa Pāli |
| --- | ---: | ---: |
| MN101 | 73 | 362 |
| MN102 | 48 | 161 |
| MN103 | 36 | 128 |
| MN104 | 48 | 166 |
| MN105 | 58 | 188 |
| MN106 | 33 | 127 |
| MN107 | 40 | 104 |
| MN108 | 42 | 160 |
| MN109 | 42 | 117 |
| MN110 | 32 | 100 |
| **Tổng** | **452** | **1.613** |

Các sửa nội dung trong lô:

- **MN101:** sửa lời giải thích “bất thiện” để không thu hẹp thành chỉ việc gây hại; làm tự nhiên hơn mô tả mũi tên phủ dày chất độc trong ví dụ. Bản người lớn tuổi không cần sửa prose.
- **MN102:** sửa bản trẻ để trình bày “Niết-bàn ngay trong đời này” là chủ trương đang được xem xét, không khẳng định mỗi người nói đã tự chứng.
- **MN103:** giữ cả hai bản theo Pāli tại 11.2: người góp ý không bị phiền nhưng người nghe bị tổn thương. Câu English Sujato khác ở vế này; bản Việt dự án cùng Pāli root hỗ trợ cách chọn hiện tại.
- **MN104:** giữ lời “tàn sát” như ẩn dụ, đủ bảy cách dàn xếp và hai ngoại lệ của cách che rơm; không thay đổi prose.
- **MN105:** phân biệt phép ví đầu còn độc dư với phép ví sau đã hết dư. Thêm câu báo trước trong cả hai bản: các chi tiết chăm vết thương thuộc phép ví cổ, không phải hướng dẫn y tế hôm nay.
- **MN106:** giữ các kết quả thiền như khả năng có điều kiện; phân biệt xả còn bị chấp với xả không chấp. Ghi giới hạn cách hiểu ở `paññāya adhimuccati` và `sakkāya`; không ép một lối dịch thành chắc chắn tuyệt đối.
- **MN107:** giữ các bước huấn luyện và thời nghỉ; phân biệt người hướng dẫn với người phải tự đi đường. “Một lúc” được giữ theo Pāli ở ví dụ đường Rājagaha; tên thực vật kālānusāri không bị chốt theo phỏng đoán.
- **MN108:** giữ câu trả lời phủ định về người kế nhiệm và người hiện được kính trọng; nương Pháp; phân biệt các kiểu thiền Phật chê với bốn thiền Ngài khen.
- **MN109:** giữ năm uẩn, phạm vi của từng uẩn, đủ hai mươi cách chấp ngã và phần phủ định tương ứng. Kết quả khoảng sáu mươi vị được ghi là xảy ra trong lúc bài giảng đang nói.
- **MN110:** giữ tám mặt cho mỗi nếp sống, mười điều trong tà kiến, năm nét bố thí và cảnh tái sinh; không biến kết quả tái sinh thành lời hứa Niết-bàn.

Cả 20 bản đều giữ ví dụ và thực hành trong phần có nhãn riêng. Không đổi kinh văn canonical, bản đồ nghĩa, source dependencies, bản người trưởng thành, audio hoặc trạng thái human review.

## Cổng local

| Cổng | Kết quả |
| --- | --- |
| Source manifest sync | 10.093 đường dẫn tại pin; 0 tải mới |
| Explanation source sync | 2 nguồn được xác minh; 0 tải mới |
| Legacy Việt | 4.815 tệp khớp pin `sc-data` |
| Validate | `node --import tsx scripts/validate.ts`: exit 0; 2.275 cảnh báo hiện hữu, 0 lỗi |
| Quality history / explanation check | 5.840 lượt quality, 0 lỗi; 558 bản published, 186/186 bài đủ, 0 lỗi |
| Unit tests | 505 tổng; 501 đạt, 4 bỏ qua, 0 lỗi |
| Astro check | 281 tệp; 0 lỗi, 0 cảnh báo, 52 hints |
| Astro build | exit 0; 7.814 trang trong 6 phút 40 giây |
| Pagefind | 6.991 trang, 468.799 từ, 2 bộ lọc, 0 kiểu sắp xếp |
| Static reader | 20/20 panel khớp nguyên văn các đoạn, điểm, ngày, nhãn trạng thái và credit người đánh giá. [Báo cáo](reader-static-batch-11-20261115.json) |

`npm run validate` không khởi chạy trong sandbox vì lệnh `tsx` cố tạo IPC pipe và nhận `EPERM`; các script nền tương ứng đã chạy trực tiếp với `node --import tsx` và qua. `manifest:check` gọi GitHub API nhưng không chạy được vì DNS tới `api.github.com` không có trong môi trường; source manifest đã sync từ cache ghim, không tải thêm bytes. Đây không phải kết quả CI.

Lần static audit đầu kiểm ID công cụ nội bộ thay vì credit hiển thị trên trang nên không đạt. Tôi giữ báo cáo đó tại [attempt1](reader-static-batch-11-attempt1-20261115.json), sửa audit để kiểm đúng nhãn “Codex · OpenAI”; lượt cuối đạt 20/20 và không sửa sản phẩm để làm audit qua.

Static reader report kiểm tra HTML dựng trên máy, không kiểm tra kích thước responsive hoặc website công khai. SHA chính xác đang phục vụ chưa biết. Chưa có trẻ/người lớn tuổi tham gia thử hiểu và chưa có thẩm định độc lập của học giả Pāli.

## Tiếp tục

Tiến độ nội dung được đọc lại là **220/304 bản**, còn **84 bản**; bài kế tiếp là **MN111**. Metadata `published` ở local không đồng nghĩa PR, merge hay public release. Mục tiêu toàn bộ Trung Bộ vẫn chưa hoàn tất.
