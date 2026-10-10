# Nhật ký audio MN → DN

Nhật ký append-only. Registry `content/audio/progress.json` được đối soát với catalog, không dùng số file audio để suy coverage. Không đánh đồng upload, merge, live và approved.

## 2026-10-10 — Contract Gate nền tảng

- Kiểm kê từ catalog: 152 MN, 34 DN, tổng 186 UID; tất cả qua cổng nguồn hiện tại (published, summary, Pāli đã sync, Việt canonical đủ).
- Chỉ MN1 có đăng ký audio ở thời điểm kiểm kê; chưa tái sinh MN1, chưa sinh bài mới.
- Bổ sung cổng source, chia transcript dài tái ghép nguyên ký tự, checkpoint từng chunk, hash WAV/nội dung, kiểm MP3 frame/format và khóa hệ điều hành một tiến trình TTS.
- Uploader xác minh account/bucket đã khai, byte/hash và range public; source được kiểm trước và sau upload. Browser playback là cổng riêng trước `uploaded-verified`.
- DN1 prepare-only: 68 chunk, 660 segment lời kinh; không gọi TTS. Registry chưa nâng trạng thái MN1 khi chưa đọc lại R2 + trang production.
- PR/merge/deploy SHA nền tảng sẽ được ghi khi có bằng chứng thật, trong checkpoint tiếp theo.

## 2026-10-10 — Bắt đầu batch MN 001

- PR nền tảng #401 merge commit `dd401425be93dd7d18c8b616be701e36cc9cf303`; exact head `a2f247b462cfb00355872cf08e2925b1dd137860`. Hai CI đều SUCCESS; lỗi lock Linux đã sửa bằng thư mục tạm portable.
- Batch bắt đầu từ MN2 sau khi source gate pass; MN1 chưa tái sinh và không tính vào 10 bài mới.
- Trạng thái từng UID và checkpoint nằm trong registry; sinh/upload/verify sẽ được ghi bằng bằng chứng thực tế, không đánh đồng với nghe duyệt toàn bài.

- MN1 baseline reverified: public SHA-256/bytes khớp, range 206; production phát/dừng và seek 144,95s thành công, readyState 4, không media error. Đã ghi live với PR #394/merge SHA thật; review nội dung vẫn pending.

- MN2: 12/12 chunk, 123 segment kinh văn; MP3 1.078,61s, 21.573.600 byte, SHA-256 `d4b228a02455b58b99a8e4b560ca28588b6fc2333a488db513fdbb46b1cf4689`. Upload R2 và readback hash/byte/range 206 thành công; player local phát/tua/chuyển phần 163,63s thành công, readyState 4, không lỗi.
- Google independent ASR chưa chạy: auto-review từ chối export audio riêng và yêu cầu phép rõ; đã gửi câu hỏi cho người biên tập. Registry MN2 ghi blocked với artifact đã tạo/upload và review pending, không ghi uploaded-verified/merged/live khi thiếu bước QC nội dung. Chưa bắt đầu MN3.
