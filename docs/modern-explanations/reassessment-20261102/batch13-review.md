# Tái đánh giá lô 13 — MN121–MN130

Ngày: **2026-11-15**. Nhánh `codex/mn-kids-seniors-reassessment-main-batch13-20261115`, commit `d9f785721`. [PR #2065](https://github.com/streamentry/kinh-tang-pali/pull/2065) đang mở; chưa merge hoặc xác minh production.

**Kết quả nội dung:** 20 bản trẻ em/người lớn tuổi đã được đọc lại toàn văn, đối chiếu nguồn, chấm 10 tiêu chí và chọn bằng CLI. Tất cả đạt publication gate hiện hành: mean ít nhất 9,0, bốn tiêu chí trọng yếu đầu ít nhất 9,0, không blocker. Mean thấp nhất **9,37/10**, cao nhất **9,65/10**. Điểm audience-fit thấp nhất 8,4 ở MN129/MN130 trẻ em vì văn bản dài và có hình ảnh bạo lực; đây là đánh giá biên tập, không phải kết quả thử hiểu.

| Bài | Trẻ em | Người lớn tuổi |
| --- | ---: | ---: |
| MN121 | 9,43 | 9,52 |
| MN122 | 9,37 | 9,54 |
| MN123 | 9,48 | 9,59 |
| MN124 | 9,50 | 9,58 |
| MN125 | 9,45 | 9,56 |
| MN126 | 9,53 | 9,65 |
| MN127 | 9,46 | 9,63 |
| MN128 | 9,47 | 9,61 |
| MN129 | 9,42 | 9,53 |
| MN130 | 9,43 | 9,56 |

## Phạm vi và đối chiếu

Đã rà soát **515 đơn vị nghĩa và 1,710 khóa Pāli**. Pāli root tại Bilara commit `11c9d708978cde8ba61096d8a75f7ddfb846f639` là authority. Đã đối chiếu English Sujato, bản Việt dự án và HTML liên tục Thích Minh Châu cùng chú thích nguồn; HTML nguyên bài không bị căn giả vào segment. Cả **50/50 dependency SHA** của mười bài khớp bytes đã ghim.

| Bài | Đơn vị nghĩa | Khóa Pāli |
| --- | ---: | ---: |
| MN121 | 47 | 102 |
| MN122 | 66 | 172 |
| MN123 | 41 | 107 |
| MN124 | 38 | 71 |
| MN125 | 59 | 145 |
| MN126 | 43 | 181 |
| MN127 | 48 | 147 |
| MN128 | 53 | 279 |
| MN129 | 66 | 303 |
| MN130 | 54 | 203 |

## Lượt đọc và sửa

- **MN121:** giữ các bậc quán Không, phân biệt điều vắng với điều vẫn còn, và đặt đoạn tận lậu ở đúng chặng cuối. Không sửa prose.
- **MN122:** giữ năm lượt hỏi đáp thực có trong bài dù nhan đề nói sáu; giữ riêng danh sách 27 đề tài và 10 đề tài có ích. Không sửa prose.
- **MN123:** giữ 19 điều được Ānanda thuật quanh đản sinh và điều thứ 20 về cảm thọ, tưởng, suy nghĩ sinh–hiện–diệt; không nhập lời thuật với phần Đức Phật xác nhận. Không sửa prose.
- **MN124:** thêm clarification cho hai nhóm về cụm “còn mang nợ”: các bản dịch hiểu khác nhau và kinh không giải thêm; giữ rõ bảy ngày khất thực rồi ngày thứ tám chánh trí.
- **MN125:** thêm clarification cho hai nhóm rằng dụng cụ/cách thuần voi thuộc phép ví cổ, không phải chỉ dẫn bắt chước với người hay động vật; tiến trình tu tập trong bài vẫn tách riêng.
- **MN126:** giữ lời Bhūmija thừa nhận ông không nghe câu trả lời của Đức Phật, và giữ phương pháp thực hành là điểm phân định trong bốn cặp ví dụ. Không sửa prose.
- **MN127:** giữ khác biệt giữa bốn tâm vô lượng và định được làm lớn, cùng các điều kiện tái sinh theo từng nhóm. Không sửa prose.
- **MN128:** giữ ba lần từ chối, các trở ngại đối với ánh sáng/tri kiến và phần giải quyết bất hòa; không rút bài thành lời khuyên hòa thuận chung. Không sửa prose.
- **MN129:** thêm lưu ý biên tập riêng cho trẻ và người lớn tuổi trước phần hình phạt/địa ngục: bối cảnh kể cổ không phải cách phạt trẻ hay căn cứ để phán xét người nghèo, người khuyết tật, phụ nữ hoặc người đang sống.
- **MN130:** thêm lưu ý biên tập riêng cho hai nhóm trước phần mô tả địa ngục; trẻ có thể đọc cùng người lớn tin cậy hoặc dừng, còn người lớn tuổi không dùng cảnh phạt để đe dọa, biện minh gây hại hay quy nguyên nhân đau khổ cho người sống.

Bản `adults` và selected review ID của người lớn trưởng thành **không đổi** ở cả mười bài. Kinh văn canonical, meaning map chung và audio không bị sửa.

## Kiểm tra kỹ thuật local

| Cổng | Kết quả |
| --- | --- |
| Source manifest sync | 10.093 đường dẫn; 0 tải mới |
| Explanation source sync | 2 nguồn xác minh; 0 tải mới |
| Legacy Việt | 4.815 tệp ở đúng pin |
| Dependency SHA | 50/50 khớp |
| Validator | `node --import tsx scripts/validate.ts`: exit 0; 2.275 advisory hiện có |
| Quality history | 5.840 lịch sử; 0 lỗi |
| Explanations | 558 bản published; 186/186 bài đầy đủ; 0 lỗi |
| Unit tests | 505 tổng; 501 đạt; 4 bỏ qua; 0 lỗi |
| Astro check | 281 file; 0 lỗi, 0 warnings, 52 hints |
| Astro build | 7.814 trang; exit 0 |
| Pagefind | 6.991 trang; 468.799 từ; 2 bộ lọc |
| Static reader | [20/20 panel đạt](reader-static-batch-13-20261115.json): đoạn văn đúng thứ tự, điểm/ngày/người kiểm tra và nhãn published khớp |

`npm run build` đã pass một lượt trước khi chọn các review cuối. Lượt cuối sau khi chọn review gặp `EPERM` tại launcher `tsx` trước bước sync; các bước tương đương được chạy tuần tự trực tiếp bằng Node/CLI cục bộ, gồm sync, validate, check quality/explanations, `astro build` và Pagefind, tất cả exit 0. `npm test` và `npm run check` cũng pass sau khi chọn review. `dist/` là output local sinh ra, không phải media được commit; thư mục này đo 5,2 GB (4,2 GB trong `_astro`, 964 MB trong `sutta`) và bị `.gitignore` loại khỏi Git.

Reader report kiểm HTML build local; không có viewport cases, public-site/build-SHA verification, thử đọc hiểu với trẻ/người lớn tuổi hoặc thẩm định độc lập của học giả Pāli. Điểm `published` là trạng thái local cho đến khi có PR/merge.

## Tiến độ

Đã đọc lại **260/304 bản**, còn **44**, tiếp theo **MN131**. PR #2065 đã merge; production verification chưa có.
