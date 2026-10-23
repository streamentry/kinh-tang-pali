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
- Local gate đạt: `validate`, `test` (492 đạt / 1 bỏ qua), `check` (0 lỗi,
  0 warning, 5 hint sẵn có), `audio:check`, `design:check`, `build`, `seo:check`,
  `reading:check`. Bản dựng kiểm 7.057 trang có thể index và 756 phần đọc liên tục
  với 210.145 segment. Browser trên **bản dựng production cục bộ** cũng kiểm
  phát thật MN, Next/Back, DN22, storage bị chặn và native fallback khi tắt JS;
  không có page error. Đây chưa phải Pages production.
- Kiểm resume bổ sung: queue còn hash nguồn/profile cũ hoặc blocker dừng trước
  khi đọc credential, trước mỗi request TTS và trước/sau upload. Integration test
  xác nhận 0 lời gọi provider, không xoá bằng chứng lỗi. Phần này không đổi UI
  hoặc các artifact MN/DN đã có.

Lệnh tái lập dry-run và vận hành nằm trong [audio.md](audio.md).

## 2026-10-23 — người biên tập duyệt cấu trúc và mẫu mười mục

- Người biên tập xác nhận: **"Duyệt cấu trúc và tạo thử 10 bài SN1.1–SN1.10"**.
  Policy SN/AN/KN là tên bài rồi kinh văn, không tự viết tóm tắt. Quyền gửi nội
  dung tới Gemini và tạo audio ở lượt này giới hạn SN1.1–SN1.10; giữ profile MN1
  đã ghim. Chưa mở rộng trước khi người biên tập nghe và chấp thuận mẫu.
- Pipeline PR #823 đã merge tại `310bc71573b9170cacb3dce25f15870efc677e4f`,
  cả hai CI head `edfa84a25` đạt. Pages run `39891897917` thành công; kiểm live
  playlist MN 152 / DN 34 khớp main, Next/Back, phát thật, bốn kích thước màn
  hình, storage bị chặn và native fallback khi tắt JavaScript đều đạt. Đây là
  bằng chứng pipeline, không phải nghe duyệt nội dung audio SN.
- Bắt đầu mẫu từ `main` tại `c320f32d93dcebce99a019936a0610660dbe1967`, gồm
  các bản sửa thông báo lỗi player #824–826. Preflight mới: 10 mục hợp lệ,
  20 chunk, 5.406 ký tự dự kiến; khởi tạo queue schema 2 chỉ cho mười mục này.
  Sinh và upload tuần tự; giữ `review_status: pending`, không chạy ASR.

### Batch SN1.1–SN1.5 — upload và player đã kiểm

| Mục | Thời lượng WAV + khoảng nghỉ (giây) | SHA-256 MP3 |
| --- | ---: | --- |
| SN1.1 | 87.62 | `c55898b204bd3f01dd6f0b5a52d69ef70336bb3760d593f2d7f06229cb5d4d9b` |
| SN1.2 | 56.78 | `0c8d8b46a0e0be1b7a5d4ad897af3a4b8d3953ef7093baf6f1458dfa36b0f4bc` |
| SN1.3 | 35.78 | `277090bd5e21e38fc2255f9dd7e787a3fac4c865b9fb8418469e771c4f6061c4` |
| SN1.4 | 34.42 | `d2791000d77d155eaa55b5f4f4a84a02349df0791d3ede42da13a84e24757d67` |
| SN1.5 | 29.70 | `bc0d5b671f28ea251e9c1b7ff50b47550f0b8a0a99f15f4a17399cbd0f6d22a8` |

- Cả năm object khớp bytes/SHA-256 công khai và HTTP range 206; source/profile
  được kiểm lại trước/sau upload. Player từng bài phát và tua được; kinh văn từ 0,
  không hiện tóm tắt giả. Playlist phẩm và các nhóm cha tái dùng cùng URL theo
  thứ tự nguồn; Next/Back, row play, auto-next, lưu toggle và fallback tắt JS đạt.
- Kiểm browser ở 1440/1024/390/320px không tràn ngang, không page error. Đây là
  kiểm vận hành, không phải nghe duyệt: cả năm giữ `review_status: pending`.
- SN1.3 gặp một timeout mạng ở request tên bài; retry giới hạn của pipeline đã
  thành công. Không đổi model, profile hoặc tốc độ. Cache/checkpoint và log giữ lại.
- Local `validate`, `test` (493 đạt / 1 bỏ qua), `check` (0 lỗi, 0 warning, 5 hint),
  `build` đạt. Queue có 5 `uploaded-verified`, 5 `not-started`; chưa tạo SN1.6.
