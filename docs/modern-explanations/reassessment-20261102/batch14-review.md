# Tái đánh giá lô 14 — MN131–MN140

Ngày: **2026-11-15**. Nhánh local: `codex/mn-kids-seniors-reassessment-main-batch14-20261115`. PR #2065 đã merge MN81–MN130 tại `8b81a1fd3f2cc263650ddeb11cbe59673c9b40d5`; batch14 vẫn local và chưa có PR.

**Kết quả nội dung:** 20 bản trẻ em/người lớn tuổi đã được đọc trọn, đối chiếu nguồn, chấm 10 tiêu chí và chọn bằng CLI. Cả 20 đạt gate: mean ít nhất 9,0, bốn tiêu chí trọng yếu đầu ít nhất 9,0, không blocker. Mean thấp nhất **9,26/10**, cao nhất **9,53/10**. Audience-fit thấp nhất 7,90 ở các bài dài/nhiều tầng thiền, đặc biệt MN140 trẻ em; đây là phán đoán biên tập, không phải thử hiểu với độc giả thật.

| Bài | Trẻ em | Người lớn tuổi |
| --- | ---: | ---: |
| MN131 | 9,45 | 9,53 |
| MN132 | 9,41 | 9,52 |
| MN133 | 9,36 | 9,52 |
| MN134 | 9,37 | 9,52 |
| MN135 | 9,33 | 9,48 |
| MN136 | 9,27 | 9,46 |
| MN137 | 9,27 | 9,43 |
| MN138 | 9,26 | 9,45 |
| MN139 | 9,39 | 9,50 |
| MN140 | 9,32 | 9,47 |

## Nguồn và phạm vi

Đã rà soát **435 đơn vị nghĩa và 1,620 khóa Pāli**. Pāli root tại Bilara commit `11c9d708978cde8ba61096d8a75f7ddfb846f639` là authority. Đã đối chiếu English Sujato, bản Việt dự án, HTML Thích Minh Châu nguyên bài và ghi chú nguồn; HTML liên tục không được căn giả vào segment. Năm dependency SHA của mỗi bài khớp, **50/50**.

| Bài | Đơn vị nghĩa | Khóa Pāli |
| --- | ---: | ---: |
| MN131 | 30 | 77 |
| MN132 | 43 | 104 |
| MN133 | 41 | 232 |
| MN134 | 26 | 122 |
| MN135 | 39 | 137 |
| MN136 | 43 | 161 |
| MN137 | 48 | 195 |
| MN138 | 49 | 152 |
| MN139 | 54 | 201 |
| MN140 | 62 | 239 |

Ba ghi chú nguồn dùng chung của MN136–MN138 có lỗi định dạng ở đường dẫn được in trong câu provenance (tiền tố `pli/ms` lặp lại). Các `sourceDependencies` có cấu trúc trỏ đúng tệp pinned và hash của cả 50 dependency đã khớp. Không đổi ghi chú dùng chung vì điều đó sẽ làm stale cả ba nhóm audience, trong đó adult reviews được giữ nguyên. `MN137` ghi nhận thêm lựa chọn dịch của `atammayatā`; diễn giải giải thích giới hạn cách đọc thay vì coi thuật ngữ đã hết bất định.

## Lượt đọc và sửa

- **MN131:** giữ kệ chung với MN132–MN134, ba cặp quá khứ/tương lai/hiện tại và hai mươi quan hệ của năm uẩn với ngã. Không sửa prose.
- **MN132:** giữ riêng lời Ānanda thuật lại và phần Đức Phật khen rồi tự giảng; không nhập hai lượt nói làm một. Không sửa prose.
- **MN133:** giữ chuyển từ bài kệ sang phân tích sáu căn, tham luyến và ba thời; lưu ví dụ thành kind riêng. Không sửa prose.
- **MN134:** giữ Candana là người nhớ bài kệ đã nghe trên cõi trời Ba mươi ba, còn hai bên chưa thuộc phần tóm lược/phân tích; không trộn với MN133. Không sửa prose.
- **MN135:** giữ đủ bảy cặp nghiệp–quả, khung tái sinh/trở lại làm người và lời nhắc không dùng hoàn cảnh để phán xét người khác. Không sửa prose.
- **MN136:** giữ ba thọ, bốn trường hợp trái chiều, giới hạn của điều quan sát được và nghiệp trước/sau hoặc kiến lúc chết; không khái quát từ một trường hợp. Không sửa prose.
- **MN137:** giữ 18/36 phân biệt, bảy nấc buông bỏ, ba niệm xứ và tám hướng chứng đạt. Thuật ngữ atammayatā vẫn có cách đọc khác nhau trong nguồn; điểm không giả định đã có cách giải duy nhất. Không sửa prose.
- **MN138:** sửa riêng children và older-adults: “bậc Phạm thiên” được làm rõ là danh xưng tôn kính của Phật, không phải vị trời Candana trong chuyện mở đầu. Câu adult giữ nguyên.
- **MN139:** giữ sự khác nhau giữa nói về hành vi/pháp và khen chê con người; giữ ba tiêu chí lời nói kín/trực diện cùng đúng thời, nhịp nói và danh xưng địa phương. Không sửa prose.
- **MN140:** giữ sáu giới, cảm thọ theo xúc, bốn chứng đạt, sự xả bỏ sanh y và kết quả Bất hoàn của Pukkusāti; phân biệt upadhi với upādāna theo ghi chú nguồn. Không sửa prose.

Cả mười bản `adults` và selected adult review ID không đổi. Canonical sutta text, shared meaning map và audio không đổi.

## Kiểm tra local

| Cổng | Kết quả |
| --- | --- |
| Source manifest sync | 10.093 đường dẫn; 0 tải mới |
| Explanation source sync | 2 nguồn xác minh; 0 tải mới |
| Legacy Việt | 4.815 tệp đúng pin |
| Dependency hashes | 50/50 khớp |
| Validator | `node --import tsx scripts/validate.ts`: exit 0; 2.275 advisory hiện có |
| Quality history | 5.840 lịch sử; 0 lỗi |
| Explanations | 558 bản published; 186/186 bài đầy đủ; 0 lỗi |
| Unit tests | 505 tổng; 501 đạt; 4 bỏ qua; 0 lỗi |
| Astro check | 281 file; 0 lỗi, 0 warnings, 52 hints |
| Astro build | 7.814 trang; exit 0 |
| Pagefind | 6.991 trang; 468.799 từ; 2 bộ lọc |
| Static reader | [20/20 panel đạt](reader-static-batch-14-20261115.json): đoạn văn đúng thứ tự, điểm/ngày/người kiểm tra và nhãn published khớp |

`npm run build` wrapper từng gặp `EPERM` khi launcher `tsx` mở IPC. Bước source sync, validate, quality/explanation checks, `astro build` và Pagefind được chạy tuần tự trực tiếp; tất cả pass sau khi chọn reviews. `npm test` và `npm run check` pass sau khi chọn. `dist/` là output local bị `.gitignore` loại, đo 5,2 GB (4,2 GB `_astro`, 964 MB `sutta`); không có media nào được thêm vào Git.

Reader report chỉ kiểm HTML dựng local; không có viewport/public-site check, không có thử hiểu với trẻ/người lớn tuổi hay thẩm định độc lập của học giả Pāli.

## Tiến độ

Đã đọc lại **280/304 bản**, còn **24**, tiếp theo **MN141**. Metadata `published` là trạng thái local; batch14 chưa có PR, merge hoặc production verification.
