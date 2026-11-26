# Tái đánh giá lô 12 — MN111–MN120

Ngày: **2026-11-15**.

Trạng thái: **20 bản trẻ em/người lớn tuổi đã được đọc lại, sửa khi cần, chấm và chọn qua quality gate trong local metadata.** Bản người trưởng thành cùng selected review ID được giữ nguyên. Nhánh hiện hành là `codex/mn-kids-seniors-reassessment-main-batch12-20261115`, dựa trên `0ec724f100859871af0498659863046eaaf8d998`. Nội dung hiện là local; báo cáo này chưa hàm ý PR, merge hoặc production verification.

## Điểm được chọn

Điểm mỗi bản là trung bình thô của mười tiêu chí. Bốn tiêu chí trọng yếu đầu đều ít nhất 9,0; mọi mean đều ít nhất 9,0; không có blocker. Điểm bài là mức thấp hơn giữa hai bản đang tái đánh giá; bản người trưởng thành giữ điểm cũ.

| Bài | Trẻ em | Người trưởng thành | Người lớn tuổi | Thấp nhất trong hai bản mới |
| --- | ---: | ---: | ---: | ---: |
| [MN111](../../content/meta/explanations/sutta/mn/mn111.json) | 9,52 | 9,80 (giữ cũ) | 9,60 | 9,52 |
| [MN112](../../content/meta/explanations/sutta/mn/mn112.json) | 9,50 | 9,84 (giữ cũ) | 9,55 | 9,50 |
| [MN113](../../content/meta/explanations/sutta/mn/mn113.json) | 9,49 | 9,83 (giữ cũ) | 9,57 | 9,49 |
| [MN114](../../content/meta/explanations/sutta/mn/mn114.json) | 9,49 | 9,77 (giữ cũ) | 9,55 | 9,49 |
| [MN115](../../content/meta/explanations/sutta/mn/mn115.json) | 9,53 | 9,80 (giữ cũ) | 9,56 | 9,53 |
| [MN116](../../content/meta/explanations/sutta/mn/mn116.json) | 9,47 | 9,81 (giữ cũ) | 9,55 | 9,47 |
| [MN117](../../content/meta/explanations/sutta/mn/mn117.json) | 9,47 | 9,82 (giữ cũ) | 9,58 | 9,47 |
| [MN118](../../content/meta/explanations/sutta/mn/mn118.json) | 9,53 | 9,84 (giữ cũ) | 9,65 | 9,53 |
| [MN119](../../content/meta/explanations/sutta/mn/mn119.json) | 9,46 | 9,76 (giữ cũ) | 9,56 | 9,46 |
| [MN120](../../content/meta/explanations/sutta/mn/mn120.json) | 9,52 | 9,78 (giữ cũ) | 9,57 | 9,52 |

Mean thấp nhất của lô là **9,46/10** ở MN119 trẻ em. Điểm phù hợp độc giả thấp hơn ở các bài dài, nhiều danh sách hoặc có hình ảnh khó; đó là nhận định biên tập, không phải kết quả thử đọc với trẻ/người lớn tuổi.

## Phạm vi và cách đối chiếu

Đã rà soát **471 đơn vị nghĩa và 1.786 khóa Pāli**. Pāli root Mahāsaṅgīti tại Bilara commit `11c9d708978cde8ba61096d8a75f7ddfb846f639` là thẩm quyền cuối. English Sujato cùng commit và ghi chú nguồn được dùng để đối chiếu những chỗ có lựa chọn dịch; bản Việt Thích Minh Châu là HTML toàn bài tại `sc-data` commit `4d481d7cfbaeccad19fa85adc215d3c15ff43457`, không được căn giả vào segment. Năm dependency SHA của cả mười bài đều khớp bytes hiện có. Source manifest sync xác nhận 10.093 đường dẫn tại pin và không tải bytes mới.

| Bài | Đơn vị nghĩa | Khóa Pāli |
| --- | ---: | ---: |
| MN111 | 35 | 97 |
| MN112 | 60 | 147 |
| MN113 | 33 | 218 |
| MN114 | 79 | 373 |
| MN115 | 44 | 158 |
| MN116 | 23 | 96 |
| MN117 | 62 | 152 |
| MN118 | 48 | 154 |
| MN119 | 48 | 190 |
| MN120 | 39 | 201 |
| **Tổng** | **471** | **1.786** |

## Những sửa đổi và lưu ý

- **MN111:** không sửa prose. Giữ phân biệt giữa các pháp được biết sinh-trụ-diệt, bảy tầng đầu còn xuất ly cao hơn và hai tầng cuối dẫn đến đoạn lậu hoặc; giới hạn sắc thái của `hāsapaññā` được giữ.
- **MN112:** không sửa prose. Giữ năm lượt hỏi theo văn kinh dù nhan đề nói Sáu Pháp Thanh Tịnh; các tuyên bố về giải thoát vẫn là tình huống và lời đáp mẫu, không thành chứng nhận một nhân vật cụ thể.
- **MN113:** làm rõ `yathāsanthatika` ở hai bản mới là nhận chỗ nghỉ đã được sắp, thay câu mơ hồ “ngủ nơi có chỗ trải nằm”. Bản người trưởng thành và meaning map dùng chung không đổi để giữ hiệu lực review người lớn. Giữ cách dịch `atammayatā` theo Pāli/Sujato và nêu khác biệt với cách hiểu HT. Thích Minh Châu trong ghi chú nguồn.
- **MN114:** không đổi meaning map hoặc bản người trưởng thành. Thêm clarification riêng cho trẻ: danh sách về quan hệ tình dục thuộc bối cảnh xã hội trong bài kinh, không phải hướng dẫn đầy đủ về quan hệ/an toàn thân thể cho trẻ hiện nay. Làm rõ thức ăn khất thực là thức ăn nhận từ người cúng khi đi khất thực. Giữ bất định ở `apariniṭṭhitabhāvāya` trong ghi chú nguồn, không ép một cách đọc thành chắc chắn.
- **MN115:** không sửa prose. Phân biệt “chấp một hành là lạc” như quan điểm với việc nhận biết một cảm giác dễ chịu; giữ đủ các nhóm giới, duyên khởi hai chiều và các mệnh đề có thể/không thể trong đúng phạm vi.
- **MN116:** không sửa prose. Giữ Isigili “nuốt ẩn sĩ” là cách người ta giải thích tên núi; giữ tên riêng theo Pāli root ở các chỗ khác bản Việt/Anh đọc khác, không tuyên bố danh sách đã nêu đủ 500 vị.
- **MN117:** không sửa prose. Giữ hai loại chánh kiến, phân biệt tám chi của bậc hữu học với mười chi của A-la-hán, và đủ mười lý lẽ của đoạn phản bác. Ghi cách đọc Vassa–Bhañña theo bản Việt/Ñāṇamoli–Bodhi và khác biệt của Sujato.
- **MN118:** không sửa prose. Kiểm đủ mười sáu bước theo bốn nhóm thân–thọ–tâm–pháp, mối nối qua bốn niệm xứ và bảy giác chi đến minh/giải thoát. Bài tập thở đời thường không bị đồng nhất với toàn bộ con đường.
- **MN119:** không sửa prose ngoài clarification riêng cho trẻ về phép quán thân/thi thể: đây là phép quán của người xuất gia, không phải yêu cầu cho trẻ; trẻ có thể đọc cùng người lớn tin cậy hoặc dừng nếu thấy khó chịu. Giữ đủ 31 phần thân, chín cảnh thi thể, bốn thiền, ba ví dụ về Māra và mười lợi ích.
- **MN120:** không sửa prose. Giữ điều kiện năm phẩm chất cùng việc đặt/tu tập tâm, các hành và cách an trú; một nguyện vọng đơn độc không được nói là bảo đảm tái sinh. Phần lậu tận hiện đời được phân biệt với các nguyện sinh vào cõi khác.

Ví dụ, clarification và practice có `kind` riêng trong dữ liệu. Chưa có trẻ em/người lớn tuổi thử đọc; chưa có thẩm định độc lập của học giả Pāli. Điểm là nhận định biên tập của Codex, không phải đo khả năng hiểu.

## Kiểm tra local

| Cổng | Kết quả |
| --- | --- |
| Source manifest sync | 10.093 đường dẫn tại pin; 0 tải mới |
| Explanation source sync | 2 nguồn được xác minh; 0 tải mới |
| Legacy Việt | 4.815 tệp khớp pin `sc-data` |
| Dependency hashes | 50/50 SHA khớp bytes |
| Validate | `node --import tsx scripts/validate.ts`: exit 0; 2.275 advisories, 0 errors |
| Quality history | 5.840 lịch sử, 0 errors |
| Explanation check | 558 bản published, 186/186 bài đầy đủ, 0 errors |
| Unit tests | 505 tổng; 501 đạt, 4 bỏ qua, 0 lỗi |
| Astro check | 281 file; 0 lỗi, 0 warnings, 52 hints |
| Full build | `npm run build`: exit 0; 7.814 trang; Pagefind 6.991 trang, 468.799 từ, 2 bộ lọc |
| Static reader | [20/20 panel đạt](reader-static-batch-12-20261115.json): đoạn văn, nhãn, điểm, ngày, người kiểm tra và liên kết nguồn khớp |
| Cumulative static reader | [80/80 panel đạt](reader-static-batch-09-12-20261115.json) cho MN81–MN120 trong cùng build |

Một lần chạy `npm run validate` song song với các kiểm tra khác gặp `EPERM` khi tsx mở IPC. Script validate trực tiếp đạt exit 0, và lần chạy `npm run build` tuần tự sau đó đã chạy qua validate cùng Astro build/Pagefind. `fetch-upstream-manifest.ts --check` không kết nối được `api.github.com` (`ENOTFOUND`); đây không phải kết quả CI. Static reader check dùng HTML dựng local, không kiểm tra viewport hoặc website công khai. Chưa có thử hiểu với độc giả thật hay production verification.

## Tiếp tục

Tiến độ nội dung mới được rà soát là **240/304 bản**, còn **64 bản**; tiếp theo là **MN121**. Metadata `published` là trạng thái local, không đồng nghĩa đã có PR, merge hoặc hiển thị production. Mục tiêu 152 bài Trung Bộ vẫn chưa hoàn tất.
