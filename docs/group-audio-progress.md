# Tiến độ audio nhóm SN / AN / KN

Kế hoạch gốc: [group-audio-plan-2026-10-23.md](research/group-audio-plan-2026-10-23.md),
đã merge bằng PR #821, `cdd536f98404c6f0ae6b22f17737515553f42f51`.
Log này phân biệt chuẩn bị kỹ thuật, sinh/upload, phát hành và nghe duyệt.
Không coi kiểm hash hoặc phát được âm thanh là đã đọc đúng toàn bài.

## 2026-10-23 — chuẩn bị pipeline, chưa gọi TTS

- Nguồn nền: `main` tại `cdd536f98404c6f0ae6b22f17737515553f42f51`.
- Dry-run `python3 scripts/audio-preflight.py`: 5.951 mục, SN 1.819 / AN 1.781 /
  KN 2.351; 5.951 ứng viên kỹ thuật, 20.244 chunk, 13.294.060 ký tự trong các
  request dự kiến (gồm tên bài và khoảng trắng trình bày). **0 provider request.**
  Đây không phải số token tính phí hoặc thời lượng âm thanh đã tạo.
- Mỗi UID có home group, gồm `cnd23`, `ne1`, `ne2`, `ne3`, `ne36`, `ne37` trong
  nhóm hỗn hợp. UID dải giữ nguyên; AN URL riêng chỉ lấy đoạn mình sở hữu.
- Phạm vi mẫu đề xuất `sn1-nalavagga`: SN1.1–SN1.10, 10 mục, 20 chunk,
  5.406 ký tự dự kiến. Chưa khởi chạy TTS hoặc upload; chờ người biên tập duyệt
  policy tên bài → kinh văn và cho phép gửi mẫu. Chưa mở rộng corpus.
- SHA-256 profile vẫn là
  `a384c5852585077c32e1348a6ada5cfc70a69c989ad705b8b5129fef3e1c9a71`.
  Test đối chiếu hash cũ của toàn bộ 186 mục MN/DN; không thay transcript,
  profile, audio registration, chất lượng hoặc lịch sử QC của các mục đó.
- Đã chạy prepare-only cho `sn1.1`, `an1.5`, `dhp1-20`. Transcript/plan nằm
  trong `audio/` bị Git bỏ qua. Không có MP3 mới.
- Đã kiểm khởi tạo queue mẫu schema 2 rồi chạy `audio:check`: 196 mục, 0 lỗi;
  registry MN/DN giữ nguyên SHA-256. Queue thử chỉ lưu trong preview bị Git bỏ
  qua, không ghi thành tiến độ sản xuất.
- Browser dùng WAV im lặng giả lập, không dùng registration kinh giả: nhãn
  kinh văn từ 0, không có nút tóm tắt, Next/Back, row play, auto-next, lưu toggle,
  fallback khi fetch lỗi, chặn storage và tắt JavaScript đều qua. Kiểm 1440 /
  1024 / 390 / 320px không tràn ngang; playlist MN thật tải 152 mục từ JSON
  và MN1 giữ phần tóm tắt. Riêng ca chặn storage loại toolbar dev của Astro
  sau khi stack trace xác nhận nó đọc localStorage ngoài try/catch. Các fixture
  đã gỡ; ảnh/log browser cục bộ ở `output/playwright/group-audio/` bị Git bỏ qua.
- Đây là bằng chứng giao diện/kỹ thuật cục bộ; **chưa nghe duyệt** và **chưa xác
  minh production của pipeline mới**. Tệp compilation/phần nghe dài chỉ bắt đầu
  sau gate nghe mẫu trong kế hoạch; chưa có chapter timing nào được tuyên bố.
- Local gate đạt: `validate`, `test` (491 đạt / 1 bỏ qua), `check` (0 lỗi,
  0 warning, 5 hint sẵn có), `audio:check`, `design:check`, `build`, `seo:check`,
  `reading:check`. Bản dựng kiểm 7.057 trang có thể index và 756 phần đọc liên tục
  với 210.145 segment. Browser trên **bản dựng production cục bộ** cũng kiểm
  phát thật MN, Next/Back, DN22, storage bị chặn và native fallback khi tắt JS;
  không có page error. Đây chưa phải Pages production.

Lệnh tái lập dry-run và vận hành nằm trong [audio.md](audio.md).
