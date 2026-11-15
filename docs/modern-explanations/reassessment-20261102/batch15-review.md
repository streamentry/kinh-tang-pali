# Tái đánh giá lô 15 — MN141–MN150

Ngày: **2026-11-15**. Nhánh local: `codex/mn-kids-seniors-reassessment-main-batch15-20261115`. PR #2066 đang mở cho MN131–MN140; batch15 chưa được đẩy.

**Kết quả nội dung:** 20 bản trẻ em/người lớn tuổi đã được đọc toàn văn, đối chiếu nguồn, chấm mười tiêu chí và chọn qua CLI. Cả 20 đạt gate: mean ít nhất 9,0, bốn tiêu chí trọng yếu đầu ít nhất 9,0, không blocker. Mean thấp nhất **9,33/10**, cao nhất **9,64/10**. Audience-fit thấp nhất 8,10 ở các bài dài, có nội dung tự sát hoặc khái niệm dày; đây là nhận định biên tập, không phải thử hiểu với độc giả thật.

| Bài | Trẻ em | Người lớn tuổi |
| --- | ---: | ---: |
| MN141 | 9,45 | 9,53 |
| MN142 | 9,44 | 9,56 |
| MN143 | 9,39 | 9,49 |
| MN144 | 9,40 | 9,53 |
| MN145 | 9,33 | 9,50 |
| MN146 | 9,39 | 9,51 |
| MN147 | 9,55 | 9,64 |
| MN148 | 9,36 | 9,49 |
| MN149 | 9,42 | 9,54 |
| MN150 | 9,44 | 9,54 |

## Nguồn và phạm vi

Đã rà soát **259 đơn vị nghĩa và 1,492 khóa Pāli**. Pāli root tại Bilara commit `11c9d708978cde8ba61096d8a75f7ddfb846f639` là authority. Đã đối chiếu Sujato, bản Việt dự án, HTML Thích Minh Châu toàn bài và chú thích. 51/51 dependency hash khớp.

Tám ghi chú nguồn dùng chung của MN143–MN150 in đường dẫn Pāli root có tiền tố `pli/ms` bị lặp trong phần văn xuôi. Các dependency có cấu trúc vẫn trỏ đúng file pinned và hash khớp. Vì đó là ghi chú dùng chung, sửa nó sẽ làm stale adult review đang được giữ nguyên; lỗi đường dẫn trong ghi chú đã được ghi lại nhưng không đổi nội dung adult trong lô này.

| Bài | Đơn vị nghĩa | Khóa Pāli |
| --- | ---: | ---: |
| MN141 | 36 | 122 |
| MN142 | 42 | 141 |
| MN143 | 44 | 193 |
| MN144 | 20 | 86 |
| MN145 | 18 | 83 |
| MN146 | 35 | 361 |
| MN147 | 17 | 115 |
| MN148 | 20 | 227 |
| MN149 | 17 | 105 |
| MN150 | 10 | 59 |

## Lượt đọc

- **MN141:** giữ bốn Thánh đế, định nghĩa khổ nhiều tầng và tám chi; không sửa prose.
- **MN142:** giữ ba lượt dâng bộ vải, phân biệt 14 cách cho cá nhân với bảy cách hướng Tăng và bốn trường hợp thanh tịnh; không sửa prose.
- **MN143:** giữ lời dạy về buông chấp bên cạnh việc nhờ người chăm sóc, bệnh nặng và kết cục sau khi qua đời; không suy rằng ông khỏi bệnh hay chứng A-la-hán.
- **MN144:** giữ lời ngăn Channa, chăm sóc đề nghị, câu hỏi sáu cửa và lời xác nhận riêng của Phật. Bản trẻ có cảnh báo không bắt chước tự hại; bản người lớn tuổi không biến trường hợp này thành lời khuyên chung.
- **MN145:** giữ mức độ giả định tăng dần và chuyện Puṇṇa thực sự đến Sunāparanta. Các lưu ý an toàn không khuyên ở lại nơi nguy hiểm hay xem tự hại là tu tập.
- **MN146:** giữ hai buổi dạy và ba nhóm sáu; nêu đúng mức Dự lưu được Phật xác nhận cho vị ni cuối cùng, không cho cả nhóm.
- **MN147:** giữ sáu cửa và ba câu hỏi, phân biệt Rāhula giải thoát với pháp nhãn của chư thiên.
- **MN148:** giữ sáu nhóm, ba tùy miên, điều kiện để dứt và các cảm thọ; ví dụ không trở thành tuyên bố đã hết tùy miên.
- **MN149:** giữ hai nhánh không biết/biết như thật và kết nối với các nhóm tu tập; không suy khổ của một người thành lỗi nghiệp riêng.
- **MN150:** giữ câu hỏi về người đáng kính cùng căn cứ được nêu, bao gồm “đã lìa” hoặc “đang tu điều phục”; không dùng nơi ở vắng làm bằng chứng duy nhất về mức chứng.

Bản `adults` và selected adult review ID không đổi ở cả mười bài. Canonical sutta text, shared meaning map và audio không đổi.

## Kiểm tra local

| Cổng | Kết quả |
| --- | --- |
| Source manifest sync | 10.093 đường dẫn; 0 tải mới |
| Explanation source sync | 2 nguồn xác minh; 0 tải mới |
| Legacy Việt | 4.815 tệp đúng pin |
| Dependency hashes | 51/51 khớp |
| Validator | `node --import tsx scripts/validate.ts`: exit 0; 2.275 advisory hiện có |
| Quality history | 5.840 lịch sử; 0 lỗi |
| Explanations | 558 bản published; 186/186 bài đầy đủ; 0 lỗi |
| Unit tests | 505 tổng; 501 đạt; 4 bỏ qua; 0 lỗi |
| Astro check | 281 file; 0 lỗi, 0 warnings, 52 hints |
| Astro build | 7.814 trang; exit 0 |
| Pagefind | 6.991 trang; 468.799 từ; 2 bộ lọc |
| Static reader | [20/20 panel đạt](reader-static-batch-15-20261115.json): đoạn văn đúng thứ tự, điểm/ngày/người kiểm tra và nhãn published khớp |

`npm run build` gặp sandbox `tsx` IPC EPERM ở lần khởi chạy sau khi chọn review; các bước sync, validator, quality/explanation checks, Astro build và Pagefind chạy tuần tự trực tiếp đều pass. `npm test` và `npm run check` pass sau khi chọn. `dist/` là output local bị `.gitignore` loại, đo 5,2 GB (4,2 GB `_astro`, 964 MB `sutta`); không có media nào được thêm vào Git.

Reader report kiểm HTML dựng local, không có viewport/public-site check. Không có thử hiểu với trẻ/người lớn tuổi hoặc thẩm định độc lập của học giả Pāli.

## Tiến độ

Đã đọc lại **300/304 bản**, còn **4 bản**, tiếp theo **MN151**. Batch15 đang local; PR và production verification chưa có.
