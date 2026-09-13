# MN66 và MN77: review toàn văn, 2026-09-13

Đã đối chiếu toàn văn hai bài kinh với Pāli đã pin, Bhikkhu Sujato và bản HT. Thích Minh Châu. Đây là hai bài mới được review toàn văn tiếp sau DN29/MN76 của đợt trước, không phải xác nhận toàn bộ DN/MN đã hoàn tất.

| Bài | Số đoạn đọc đối chiếu | Số đoạn dịch sửa | Điểm chấm lại |
| --- | ---: | ---: | ---: |
| [MN66: Kinh Ví Dụ Chim Cút](mn66.md) | 202 | 189 | 9.40 |
| [MN77: Đại Kinh Sakuludāyī](mn77.md) | 390 | 369 | 9.45 |
| Tổng | 592 | 558 | Không tính điểm trung bình gộp để xuất bản |

## Những việc đã sửa

MN66: tên chim, thành ngữ pannaloma, hiri/ottappa, mệnh đề người giàu có thể từ bỏ dù bị ràng buộc, nghĩa sanh y, vị trí câu “gốc rễ của khổ”, và công thức thiền. MN77: bảy giác chi thay cho bốn, phủ định/tính hữu hạn trong các thắng xứ, nội dung kinh bị rút thành dấu ba chấm, công cụ/vị trí trong câu dùng đầu gối, hắt hơi/ho, các ví dụ và chuỗi các trí.

Các chú thích cũ có nội dung giải thích sai cũng được thay. Những cách đọc khác nhau quan trọng vẫn được ghi nhận: MN66:7.4, từ ngữ về y, minh chứng, hao mòn của thân và hình ảnh da rắn trong MN77. Không chọn một bản trung gian rồi xem đó là kết luận chắc chắn của Pāli.

## Bằng chứng kỹ thuật

Trên bản làm việc có thay đổi của đợt này, đã chạy thành công:

- `npm run validate`: 0 cảnh báo.
- `npm test`: 21/21 test đạt, gồm 4 test hồi quy mới cho hai bài này.
- `npm run check`: 0 lỗi, 0 cảnh báo; 1 gợi ý cũ về script của trang tìm kiếm.
- `npm run build`: thành công; Pagefind vẫn có giới hạn cũ là chưa hỗ trợ stemming tiếng Việt.

Môi trường cục bộ dùng cây mã `fa8f8a4` cộng các sửa đã merge ở PR52 và thay đổi đợt này. Sáu file nội dung trước khi sửa đã được so hash chính xác với baseline GitHub `5b8aae8`; các thay đổi AN/SN/KN đồng thời trên main không bị ghi đè. Vì cây main có cập nhật song song, CI trên nhánh/PR là lớp kiểm chứng thêm, không được suy từ log cục bộ rằng mọi cây main tương lai đều đã được kiểm tra.

Các kiểm thử chỉ ngăn tái phát những lỗi đã biết. Chúng không đọc hiểu Pāli và không chứng minh một bản dịch đáng được 9.x.

## Hồ sơ để kiểm tra lại

[Manifest nguồn, hash và điểm](manifest.json); [danh sách đoạn sửa](changed-segments.json); [căn cứ MN66](mn66.md); [căn cứ MN77](mn77.md). Chỉ sửa canonical JSON và metadata hiện có, không tạo bộ kinh cạnh tranh. Giữ nguyên UID và thứ tự đoạn.

## Giới hạn của điểm số

Điểm chấm bởi cùng AI đã biên tập, sau một lượt tự phản biện riêng; chưa có đánh giá độc lập của chuyên gia Pāli. Các điểm mới 9.40 và 9.45 thay điểm 9.64 cũ dựa trên căn cứ mới, không nhằm tối đa hóa số điểm. Chỉ giữ `published` khi không có blocker đã biết và các kiểm tra bắt buộc đạt. Đánh giá sẽ phải cập nhật khi có bằng chứng mới.
