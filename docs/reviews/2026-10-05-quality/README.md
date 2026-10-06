# Đợt đánh giá chất lượng — cập nhật 06/10/2026, đang tiếp tục

Đây là nhật ký và inventory có thể tái lập; **chưa phải chứng nhận đã chấm hết corpus**.
Nguồn Pāli duy nhất có thẩm quyền là Bilara commit
`11c9d708978cde8ba61096d8a75f7ddfb846f639`.

## Hệ thống đánh giá

- Reader có rubric 10 tiêu chí cho bản dịch và rubric riêng 10 tiêu chí cho tóm tắt.
- Lịch sử cho phép chấm lặp, ghi ngày, người chấm, ghi chú, blocker, commit nguồn và
  fingerprint nội dung. Lượt cũ được giữ lại khi bài đổi; web đánh dấu assessment cũ.
- Chỉ MN/DN có vùng chấm tóm tắt. SN/AN/KN chỉ có rubric bản dịch.
- Trang `/quality/` liệt kê corpus và trạng thái assessment. Tóm tắt lịch sử đặt ở
  `content/meta/assessments/<nikāya>/<uid>.json`.

## Snapshot hiện tại

`inventory.json` được sinh từ `node --import tsx scripts/assess-quality.ts --report`.
Snapshot hiện có 5.421 bản dịch, 186 tóm tắt MN/DN, 5.421 audit kỹ thuật cấu trúc còn
khớp fingerprint và 26 bản dịch có lỗi căn chỉnh cần xử lý. **Audit kỹ thuật chỉ đo ID/segment, NFC và cấu
trúc; nó không chấm độ đúng nghĩa, ngữ pháp hay văn phong.**

Có 44 review bản dịch đầy đủ còn khớp fingerprint: 36 bài `published`, 8 bài `draft` vì
thiếu file English Sujato đã ghim. Có 9 review tóm tắt đầy đủ còn khớp fingerprint — MN2,
MN4, MN5, MN6, MN8, MN9, MN11, MN13 và MN14. Review tóm tắt MN10 vẫn còn trong lịch sử nhưng
fingerprint không còn hiện hành. Có thêm 4 review nội dung một phần, không tính là review
đầy đủ. Như vậy còn 5.377/5.421 bản dịch và 177/186 tóm tắt chưa có review nội dung đầy đủ
còn hiện hành. Các con số này chỉ là snapshot, không được diễn đạt thành “đã chấm toàn bộ”.

## Nội dung đã review đầy đủ

- MN2–MN14 và SN1.1–SN1.10 đã được đọc, sửa khi cần, review đối kháng và chấm đủ 10 tiêu
  chí. Các blocker kỹ thuật cũ được đóng sau khi 336 test, `astro check`, validator và build
  qua; lịch sử cũ vẫn còn.
- MN9 có 234 segment. Đã bỏ 16 dấu lược theo bản Anh nhưng không có trong Pāli, giữ các
  dấu lược thật của root, sửa phép lặp `sammādiṭṭhi`, bỏ ý “nghe giải thích” không có trong
  câu nguồn, sửa dấu câu và viết lại tóm tắt. Điểm bản dịch 9,57; tóm tắt 9,56; không có
  blocker.
- MN10 có 235 segment. Đã sửa địa điểm Kuru/Kammāsadhamma, lúa mì thành lúa, một xương bị
  nhận nhầm, và 12 chỗ lược theo English nhưng không có trong Pāli; giữ các dấu lược thật,
  đối chiếu lại quán thọ/tâm/pháp và viết rõ chuỗi ý chính trong tóm tắt. Điểm bản dịch 9,58;
  tóm tắt 9,56; không có blocker.
- Bảy bài Therāpadāna — tha-ap101, tha-ap106, tha-ap143, tha-ap144, tha-ap145, tha-ap179,
  tha-ap211 — đã được đọc và sửa. Điểm nội dung cao không gỡ được blocker: pinned Bilara
  không có file English Sujato cho các UID này. `reference-gaps.yaml` ghi nhận nguồn vắng,
  nhưng không thay thế reference layer mà repo yêu cầu cho `review`/`published`; cả bảy
  giữ `draft` cho đến khi có tầng tham khảo hợp lệ.
- MN11 có 132 segment và được review đầy đủ ngày 2026-10-05. Đã sửa câu trả lời bị đảo ở
  5.22 (mục tiêu dành cho người có trí tuệ), phân biệt `viddasu/aviddasu` với
  `vijjā/avijjā`, giữ đủ hai vế về `papañca`, chỉnh câu 4.5 và làm rõ ngữ pháp 17.1. Bản
  dịch đạt 9,53; tóm tắt 9,54; không còn blocker. Tóm tắt MN10 không tính là hiện hành vì
  nội dung của nó đổi sau lượt review trước.
- MN13 có 152 segment; review đầy đủ ngày 2026-10-05 và tái review ngày 2026-10-06 sau khi
  phát hiện thêm các lỗi công thức dùng chung. Đã sửa người nói ở 5.1, tricolon 3.4–3.5,
  tranh cãi/tấn công 11.1–11.2, `sammoha` (rối trí), sáu tính của cảnh dục, `chakaṇaka`,
  `khandhaṭṭhika`, `terovassikāni`, `ekāgārika` và các dấu lược không có trong Pāli. Lượt mới:
  bản dịch 9,56; tóm tắt 9,54; không còn blocker.
- MN14 có 144 segment; review đầy đủ ngày 2026-10-06. Đã phân biệt trạng thái tâm với “ý nghĩ”,
  tranh cãi với tấn công, sửa phân đoạn lời thoại ở 20.8/20.9, `sammoha`, `anavassava`,
  `ekāgārika` và các tên hình phạt. Bản dịch đạt 9,49; tóm tắt 9,54; không còn blocker.
- Các hồ sơ full mới còn hiện hành khác trong snapshot: DN25, DN33, DN34, MN12, MN24, MN26,
  Ja20, Ja66, Ja383, và các bài Thag3.4, Thag3.5, Thag3.6, Thag3.8, Thag3.9, Thag3.14;
  lịch sử gốc của chúng được giữ trong `content/meta/assessments/`. Ja383 vẫn `draft`: bản
  dịch hiện không có English Sujato tại commit đã ghim.

## Kiểm tra kỹ thuật

Lượt gần nhất: `npm test` 336/336; `npm run check` 0 lỗi, 0 cảnh báo và 5 hint; validator
qua với các cảnh báo coverage/reference đã ghi nhận; assessment check kiểm 5.421 lịch sử,
0 lỗi. Build thành công 6.146 trang Astro; Pagefind lập chỉ mục 6.136 trang và 453.498 từ.
`audit:store`, `audit:reference`, `verify:store` và kiểm tra reference-gaps cũng pass tại snapshot
này. Đây là bằng chứng cho trạng thái checkout tại lần build, không phải
CI từ xa hay tuyên bố đã hoàn tất chấm nội dung toàn corpus.

## Việc còn lại

1. Đọc, sửa và chấm nội dung từng bản dịch còn lại theo Pāli root, English đã ghim khi có,
   bản Việt hiện hành khi có, và ngữ cảnh toàn bài.
2. Review nội dung 179 tóm tắt còn lại của MN/DN; hiện chưa có review đầy đủ nào của DN.
3. Sửa 26 lỗi căn chỉnh và các lỗi dịch được phát hiện trong từng lượt đọc; chạy lại
   fingerprint, inventory và cổng kỹ thuật.

Nếu translation hoặc summary đổi, assessment theo fingerprint cũ không còn là điểm hiện
hành; phải đọc lại nội dung đổi trước khi chấm. Các gap upstream được giữ thành cảnh báo có
đếm được, không biến thành điểm đồng thuận về cách dịch.
