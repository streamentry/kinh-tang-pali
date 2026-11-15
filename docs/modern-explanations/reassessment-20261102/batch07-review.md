# Tái đánh giá MN61–MN70: trẻ em và người lớn tuổi

Ngày: 2026-11-15

Trạng thái: **đã qua cổng local và kiểm tra reader local 40/40; chưa tạo PR, chưa merge, chưa kiểm tra reader public.** Không truy vấn GitHub Actions theo chỉ dẫn của người dùng.

## Điểm được chọn

Điểm người trưởng thành là lượt đã chọn trước, không phải review mới của lô này. Điểm thấp nhất của mỗi bài tính từ cả ba bản hiện hành.

| Bài | Trẻ em | Người trưởng thành | Người lớn tuổi | Thấp nhất |
| --- | ---: | ---: | ---: | ---: |
| MN61 | 9.49 | 9.71 (giữ cũ) | 9.56 | 9.49 |
| MN62 | 9.49 | 9.68 (giữ cũ) | 9.54 | 9.49 |
| MN63 | 9.48 | 9.71 (giữ cũ) | 9.57 | 9.48 |
| MN64 | 9.53 | 9.69 (giữ cũ) | 9.53 | 9.53 |
| MN65 | 9.56 | 9.69 (giữ cũ) | 9.64 | 9.56 |
| MN66 | 9.53 | 9.61 (giữ cũ) | 9.55 | 9.53 |
| MN67 | 9.56 | 9.66 (giữ cũ) | 9.56 | 9.56 |
| MN68 | 9.57 | 9.68 (giữ cũ) | 9.61 | 9.57 |
| MN69 | 9.56 | 9.73 (giữ cũ) | 9.55 | 9.55 |
| MN70 | 9.53 | 9.69 (giữ cũ) | 9.57 | 9.53 |

Cả 20 bản trẻ em/người lớn tuổi mới đều không có lỗi chặn; điểm trung bình và bốn tiêu chí trọng yếu đều vượt publication gate 9,0. Mẫu số toàn mục tiêu hiện là **140/304 bản đã rà lại**; còn **164 bản, bắt đầu MN71**. Trong số đó, **120 bản** đã thuộc các batch MN1–MN60 đã merge; batch07 còn local.

## Sửa và điểm cần giữ

- **MN61:** không sửa prose. Giữ ba thời điểm xét thân/lời/ý, lời nói dối cố ý khác lỗi do nhầm, và câu Pāli ở nhánh lời nói lành chỉ có hai vế không hại.
- **MN62:** sửa cụm khó hiểu về `asubha` thành “quán bất tịnh, nhìn rõ điều không hấp dẫn” ở cả hai bản. Không gán đối tượng cụ thể ngoài root; giữ niệm hơi thở tự nhiên, không biến 16 bước thành lời khuyên y tế.
- **MN63:** không sửa prose. Giữ năm cặp quan điểm, ví dụ mũi tên và ranh giới giữa điều chưa giảng với bốn chân lý đã giảng. Ghi rõ khóa Pāli `mn63:3.25` có vẻ chép lệch một vế; bản diễn giải theo mạch song song, chú giải nguồn giữ bất định.
- **MN64:** không sửa prose. Giữ `sakkāya` (hữu thân) khác `sakkāyadiṭṭhi` (thân kiến), và các chi tiết về khoảng không ở `mn64:12.5` dù một số bản tham khảo rút gọn.
- **MN65:** không sửa prose. Giữ điều kiện trong hai kiểu viễn ly, bốn kiểu xử lý giới luật và các điều kiện của hai kết quả tu chứng.
- **MN66:** thêm ghi chú đọc trước đoạn có lời mời tình dục và hình ảnh vết thương; thêm ghi chú rằng `mn66:7.4` có hai cách nối câu. Bản giải thích theo cách đọc được chú giải hỗ trợ; không quy sự tha thiết tu học thành nguyên nhân của trói buộc.
- **MN67:** thêm ghi chú trước phép ví “cá mập”, đặt nó trong bối cảnh người xuất gia sống độc thân và tập trung vào tâm người tu bị dục chi phối.
- **MN68:** không sửa prose. Giữ khác biệt của root giữa bốn phẩm chất được hồi tưởng trong một trường hợp nam cư sĩ và năm phẩm chất ở các trường hợp kế tiếp.
- **MN69:** không sửa prose. Giữ phạm vi nếp sống của người ở rừng và lời kết rằng người ở làng càng cần thực hành.
- **MN70:** thêm lưu ý trước lời nguyện mạnh về da, gân, xương và thịt máu; đây là ngôn ngữ trong kinh, không phải chỉ dẫn trẻ nhịn ăn hoặc làm đau mình.

## Nguồn và giới hạn

Pāli root là authority. Năm source dependency của từng bài đã khớp SHA-256 với nguồn trong hồ sơ. Đã đọc lại cả hai bản mục tiêu, bản đồ ý và các đoạn nguồn có rủi ro. English Sujato còn các đoạn trống; English-project fill là sản phẩm của dự án và không được tính như đối chiếu độc lập. Chi tiết khoảng trống theo bài nằm trong từng tệp `mn61`–`mn70-review-in-progress.json`.

Đây là đánh giá biên tập AI, không phải thẩm định độc lập của chuyên gia Pāli hoặc thử đọc hiểu với trẻ/người lớn tuổi thật. Không có human comprehension test.

## Cổng local

| Kiểm tra | Kết quả |
| --- | --- |
| `npm run validate` | Qua; 2.275 cảnh báo, 0 lỗi |
| Lịch sử quality | 5.840 hồ sơ, 0 lỗi |
| `explanations --check` | 558 bản published; 186/186 bài complete; 0 lỗi |
| `npm test` | 505 tổng; 501 đạt, 4 bỏ qua, 0 lỗi |
| `npm run check` | 281 tệp; 0 lỗi, 0 cảnh báo, 52 hints |
| `npm run build` | Qua; 7.814 tệp HTML; Pagefind lập chỉ mục 6.991 trang, 468.799 từ, 2 bộ lọc, 0 sort |
| Reader local | 40/40 ca: 10 bài × 2 nhóm × desktop 1440 và mobile 390; nội dung đoạn, điểm/ngày/người duyệt, source anchors và tràn ngang đều khớp |
| GitHub Actions | Không truy vấn hoặc chờ theo chỉ dẫn của người dùng |

Pagefind hiện chưa hỗ trợ stemming tiếng Việt. Reader check dùng bản build local; chưa xác minh trang public, không biết SHA build public. Báo cáo case: [reader-local-batch-07-20261115.json](reader-local-batch-07-20261115.json).

## Phát hành

Batch07 đã qua các kiểm tra local, nhưng chưa có PR, merge hoặc xác minh reader public. Người đọc thật chưa tham gia. Mục tiêu 304 bản vẫn chưa hoàn tất.
