# Tái đánh giá MN51–MN60: trẻ em và người lớn tuổi

Ngày: 2026-11-14

Trạng thái: PR #2062 đã merge; public reader đạt 40/40 ca desktop/mobile. SHA build đang phục vụ chưa biết; chưa thử đọc hiểu với độc giả thật.

## Điểm được chọn

Mỗi điểm là trung bình thô của mười tiêu chí. Bốn tiêu chí trọng yếu đều đạt ít nhất 9,0; 20 đánh giá mới không ghi lỗi chặn. Cột người trưởng thành giữ điểm đã chọn trước đó, không phải lượt chấm mới trong batch này. Điểm hoàn tất bài là điểm thấp nhất trong ba nhóm.

| Bài | Trẻ em | Người trưởng thành, giữ nguyên | Người lớn tuổi | Thấp nhất |
| --- | ---: | ---: | ---: | ---: |
| MN51 | 9,55 | 9,63 | 9,60 | 9,55 |
| MN52 | 9,57 | 9,65 | 9,62 | 9,57 |
| MN53 | 9,57 | 9,63 | 9,62 | 9,57 |
| MN54 | 9,60 | 9,65 | 9,64 | 9,60 |
| MN55 | 9,68 | 9,71 | 9,70 | 9,68 |
| MN56 | 9,53 | 9,61 | 9,60 | 9,53 |
| MN57 | 9,48 | 9,63 | 9,46 | 9,46 |
| MN58 | 9,46 | 9,64 | 9,50 | 9,46 |
| MN59 | 9,46 | 9,68 | 9,50 | 9,46 |
| MN60 | 9,44 | 9,67 | 9,53 | 9,44 |

## Các điểm cần giữ

- **MN51–MN55:** giữ đúng các nhánh có điều kiện và người nói; làm rõ nguy cơ an toàn, giới hạn của ví dụ và phạm vi những điều kinh khẳng định. MN52 vẫn để mở đối tượng của câu Pāli khó; MN55 không mở lời dạy về thịt thành luật chung.
- **MN56:** phân biệt ý định với việc làm qua thân; lời buộc tội của nhân vật và các điều kiện về thần thông không biến thành kết luận của người biên soạn.
- **MN57:** thu hẹp câu giải thích nghiệp vào các việc qua thân, lời và tâm. Công thức “một hữu tình sinh khởi từ một hữu tình” vẫn được ghi là khó; không thêm một khẳng định về sự tiếp nối.
- **MN58:** câu gài giữ đủ hai nhánh, ba điều kiện lời nói và yêu cầu đúng thời. Ví dụ đứa trẻ không được trình bày như hướng dẫn sơ cứu. 21 đoạn English fill là sản phẩm của dự án, không phải nguồn độc lập.
- **MN59:** giữ hai và ba cảm thọ như hai phép phân loại có căn cứ. Chuỗi chín so sánh không bị rút gọn thành kỹ thuật thư giãn; lạc ở đoạn diệt tưởng/thọ được phân biệt với lạc thọ.
- **MN60:** giữ các quan điểm như điều kinh đang xét, không biến chúng thành chỉ dẫn. Các khả năng ở hai cặp cuối vẫn là khả năng. Sửa danh hiệu đầu bài để “không ai sánh bằng” mô tả bậc hướng dẫn. Những phần được mở từ dấu lược được chỉ rõ trong bản đồ và nguồn; 20 đoạn English fill không được tính là đối chiếu độc lập.

## Nguồn và giới hạn

Pāli là thẩm quyền cuối cùng. Mỗi bài giữ bản đồ ý và năm hash nguồn: Pāli đã ghim, English Sujato, Việt dự án, HTML Việt Thích Minh Châu và chú giải dự án. MN58, MN59 và MN60 lần lượt có 21, 21 và 20 đoạn English Sujato để trống; English fill của dự án không được gọi là nguồn độc lập. Chỗ Pāli lược hoặc dùng công thức khó được ghi rõ thay vì gán phần mở rộng cho nguyên văn.

Đây là đánh giá biên tập, không phải thử nghiệm khả năng hiểu. Chưa có trẻ em hoặc người lớn tuổi thật tham gia; chưa có thẩm định Pāli độc lập. `published` trong metadata chỉ phản ánh điểm và blocker của từng bản; merge, public reader và đọc hiểu là các lớp bằng chứng riêng. Bản tóm tắt reader public được tái ghi từ bằng chứng bàn giao trước đó; raw report từng được ghi tại `/private/tmp/mn-batch06-reader-production-attempt1-20261114.json` (SHA-256 `d43cfdd459c177b618dea7a217ed6bd2cc35e54a3eb2ddf533d536579ca56535`) nhưng không còn trong checkout chính.

## Cổng local

| Kiểm tra | Kết quả |
| --- | --- |
| Đồng bộ manifest nguồn | 10.093 đường dẫn trên 4 edition đã kiểm; 0 tải mới |
| Đồng bộ chú giải English bổ sung | 2/2 tệp xác minh; 0 tải mới |
| Đồng bộ HTML Việt | Đúng commit `4d481d7cfbaeccad19fa85adc215d3c15ff43457`; 4.815 tệp |
| Validate | Qua; 2.275 cảnh báo, 0 lỗi (1.596 English không có trong edition đã ghim; 679 English fill do cùng công cụ đánh giá) |
| Lịch sử đánh giá bản dịch | 5.840 hồ sơ; 0 lỗi |
| Kiểm tra diễn giải | 558 bản published, 186/186 bài complete, 0 lỗi |
| Unit tests | 505 tổng; 501 đạt, 4 bỏ qua, 0 lỗi |
| Astro check | 151 tệp; 0 lỗi, 0 cảnh báo, 5 hints |
| Production build | Qua; 7.814 trang |
| Pagefind | 6.991 trang được lập chỉ mục; 468.799 từ, 2 bộ lọc |
| `git diff --check` | Qua |
| GitHub Actions | Không truy vấn hoặc chờ theo chỉ dẫn của người dùng |

Lần chạy standalone `npm run validate` ban đầu bị sandbox chặn socket IPC của `tsx`. Validator và hai lượt kiểm đi kèm sau đó chạy bằng Node trực tiếp; lệnh `npm run build` chính thức cũng hoàn tất sau khi cho phép socket local và chạy lại toàn bộ bước build. Các cảnh báo là giới hạn edition English và English fill cùng công cụ; chúng không phải lỗi cổng batch.

Pagefind ghi nhận tiếng Việt chưa được hỗ trợ stemming; tìm kiếm vẫn hoạt động nhưng không khớp các từ theo gốc biến thể. Đây là giới hạn của bộ tìm kiếm, không phải lỗi batch.

## Trạng thái phát hành

PR #2062 đã merge vào `main` tại `02333006687b6f18083d96a7a4407985492b7934`; 48 tệp đã khớp snapshot đã kiểm. Public reader đạt 40/40 ca desktop/mobile theo [bản tóm tắt verifier](reader-production-batch-06-attempt1-20261114-summary.json). Không biết SHA build đang phục vụ; không có thử đọc hiểu với người thật. Tại thời điểm chốt lô 06, tiến độ là 120/304; phần tiếp theo bắt đầu MN61.
