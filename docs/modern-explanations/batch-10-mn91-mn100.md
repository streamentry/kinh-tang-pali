# Lô 10 — MN91–MN100

Ngày kiểm local: **2026-11-15**. Phạm vi gồm 10 bài và 20 lượt đánh giá mới cho `children` và `older-adults`. Bản `adults` cùng đánh giá đang chọn được giữ nguyên. Toàn bộ lô có 30 bản ghi audience ở trạng thái `published` trong local metadata; đây chưa phải xác nhận PR, merge hay production.

## Điểm

Điểm mỗi bản là trung bình của mười tiêu chí, không làm tròn trước khi xét. Publication gate cần trung bình từ 9,0, bốn điểm trọng yếu từ 9,0 và không có blocker. Điểm hoàn tất từng bài là mức thấp nhất trong ba audience.

| Bài | Trẻ em | Người trưởng thành | Người lớn tuổi | Thấp nhất |
| --- | ---: | ---: | ---: | ---: |
| [MN91](../../content/meta/explanations/sutta/mn/mn91.json) | 9,43 | 9,77 | 9,56 | 9,43 |
| [MN92](../../content/meta/explanations/sutta/mn/mn92.json) | 9,51 | 9,79 | 9,60 | 9,51 |
| [MN93](../../content/meta/explanations/sutta/mn/mn93.json) | 9,49 | 9,79 | 9,60 | 9,49 |
| [MN94](../../content/meta/explanations/sutta/mn/mn94.json) | 9,46 | 9,71 | 9,60 | 9,46 |
| [MN95](../../content/meta/explanations/sutta/mn/mn95.json) | 9,45 | 9,75 | 9,56 | 9,45 |
| [MN96](../../content/meta/explanations/sutta/mn/mn96.json) | 9,47 | 9,76 | 9,59 | 9,47 |
| [MN97](../../content/meta/explanations/sutta/mn/mn97.json) | 9,46 | 9,74 | 9,56 | 9,46 |
| [MN98](../../content/meta/explanations/sutta/mn/mn98.json) | 9,47 | 9,81 | 9,59 | 9,47 |
| [MN99](../../content/meta/explanations/sutta/mn/mn99.json) | 9,48 | 9,80 | 9,58 | 9,48 |
| [MN100](../../content/meta/explanations/sutta/mn/mn100.json) | 9,45 | 9,78 | 9,54 | 9,45 |

Tất cả 20 lượt được chọn mới có đủ mười điểm, bốn điểm trọng yếu đạt ít nhất 9,0 và không có blocker. MN92 và MN95 có `audience_fit` 8,9 cho trẻ vì nội dung dài, dày khái niệm; điểm tổng của mỗi bản vẫn vượt publication gate. Trong MN91, một lượt trẻ em tạm thời được ghi trước khi đếm lại độ dài cuối; lượt đã chọn được ghi lại với số 2.946 đơn vị đúng. Lượt cũ vẫn được giữ trong lịch sử. Những điểm về độ phù hợp là nhận định biên tập, không phải kết quả thử với trẻ hoặc người lớn tuổi.

## Phạm vi nguồn

Đã đối chiếu **508 đơn vị nghĩa và 2.510 khóa Pāli**. Mỗi bài dùng Pāli root Mahāsaṅgīti và các dependency có SHA-256 trong file giải thích: bản Việt dự án, English Sujato, HTML Thích Minh Châu và chú thích dự án. Pāli ở commit `11c9d708978cde8ba61096d8a75f7ddfb846f639` là authority. HTML tham khảo được đọc như toàn văn, không căn chỉnh giả theo segment. Snapshot không có bản Việt hiện hành cho các bài MN91–MN100.

English-project chỉ lấp những segment English Sujato để trống; phần này không được tính là nguồn Anh độc lập. Với MN92, các mục từ PTS và chú giải Caṅkī được tra cứu thêm để cân nhắc `brahmabhūto`, `kaṇhābhijātiko` và `nāgā`. Với MN98, PTS Pali-English Dictionary được tra cứu để ghi nhận vaṇṇa có thể chỉ màu sắc hoặc thứ bậc xã hội. Đây là tài liệu trực tuyến không pin, chỉ là nguồn phụ; mọi cách diễn giải vẫn đặt dưới Pāli root. [PTS Pali-English Dictionary](https://ancient-buddhist-texts.net/Reference/PTS/Pali-English-Dictionary.pdf), [chú giải Sela Sutta](https://epitaka.org/en/book/Ps-ii/2.-selasuttava%E1%B9%87%E1%B9%87an%C4%81-1169), [ghi chú bản dịch Sela](https://www.themindingcentre.org/dharmafarer/wp-content/uploads/2013/04/45.7a-Sela-S-m92-piya.pdf).

## Những điểm đã sửa

| Bài | Sửa đổi hoặc kết luận phản biện |
| --- | --- |
| MN91 | Đưa ghi chú về tướng mạo và bộ phận sinh dục lên trước lần nhắc đầu tiên trong bản trẻ; cho phép đọc cùng người lớn tin cậy hoặc tạm dừng. |
| MN92 | Diễn `brahmabhūto` là bậc tối thượng theo chú giải đã ghi; đặt `kaṇhābhijātiko` trong thứ bậc xã hội cổ; lược cách gọi khó hiểu “đại tượng” bằng hành động các vị tỳ-kheo đảnh lễ. Thêm ghi chú trước mô tả cơ thể cho trẻ. |
| MN93 | Thêm ghi chú trước phần nói về kinh nguyệt, mang thai và thụ thai trong bản trẻ; nội dung giữ gandhabba trong phạm vi cách nói của kinh. |
| MN94 | Bỏ diễn giải phụ “tự thân trở nên cao quý”; giữ cách nói của nguồn “sống với tự thân đã trở thành Phạm”. |
| MN95 | Giữ prose; chấm lại các căn cứ truyền thống, giới hạn của lời tự nhận và khác biệt giữa gìn giữ, giác ngộ, đạt được sự thật. |
| MN96 | Giữ prose; chấm lại các quy định phục vụ/tài sản theo đẳng cấp và tiêu chuẩn về hành động, phẩm chất được nuôi lớn. |
| MN97 | Thêm ghi chú trước các mô tả khổ hạnh và đau dữ dội; nói rõ đây là lời thuật trong kinh, không phải khuyến nghị tu tập hay hướng dẫn y tế. |
| MN98 | Thêm ghi chú trước danh sách bộ phận cơ thể trong bản trẻ; đặt lời “trắng/đen” trong câu tự nhận đang bị chất vấn, không làm thành thước đo giá trị. |
| MN99 | Giữ prose; chấm lại sự phân biệt giữa căn cứ, tự biết và thực hành tới giải thoát. |
| MN100 | Thêm ghi chú trước mô tả nhịn ăn, hành xác và đau dữ dội trong cả hai bản; phân biệt lời kể với chỉ dẫn y tế hoặc cách tu phải bắt chước. |

Kāpaṭika, Saṅgārava và những nhân vật khác vẫn giữ đúng vai trò người nói. Các ví dụ hiện đại và gợi ý thực hành tiếp tục có nhãn riêng; không sửa canonical Pāli, bản dịch Việt, scorecard người trưởng thành hoặc audio.

## Kiểm tra local

| Cổng | Kết quả |
| --- | --- |
| `npm run validate` | exit 0; 2.275 cảnh báo dữ liệu hiện có, 0 lỗi. Lệnh gồm kiểm lịch sử assessment (5.840, 0 lỗi) và `explanations --check` (558 published, 186/186 complete, 0 lỗi). |
| `npm test` | 505 test; 501 đạt, 4 bỏ qua, 0 lỗi. |
| `npm run check` | exit 0; 281 tệp, 0 lỗi, 0 cảnh báo, 52 hints. |
| `npm run build` | exit 0; 7.814 trang tạo xong. Pagefind lập chỉ mục 6.991 trang, 468.799 từ, 2 bộ lọc, 0 kiểu sắp xếp. |
| Kiểm HTML tĩnh | 20/20 panel trẻ/người lớn tuổi: đoạn văn khớp theo thứ tự; điểm, ngày, người đánh giá và nhãn published hiện đúng. [Báo cáo](reader-static-batch-10-20261115.json). |
| Hash sau cổng | 20/20 file nội dung và metadata được hash trước/sau cổng, không đổi. |

HTML tĩnh không phải kiểm tra trình duyệt responsive. Không có kiểm tra viewport, không xác định SHA chính xác của bản được phục vụ, không thử hiểu với độc giả thật và không có thẩm định độc lập của học giả Pāli.

## Tình trạng phát hành

Batch10 đã qua các cổng local trên nhánh `codex/mn-kids-seniors-reassessment-main-batch10-20261115`; MN101 là bài kế tiếp. Batch10 chưa được push, mở PR, merge hay xác minh production; CI cũng chưa được kiểm. Không tính nội dung local này là đã phát hành. Tiến độ tổng là **200/304**, còn **104 bản**. Mục tiêu đầy đủ vẫn đang tiếp tục.
