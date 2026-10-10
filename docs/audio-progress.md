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

## 2026-10-10 — MN2 offline QC và checkpoint production

- PR #405 exact head `fb2e132fe5084c93c65085300455952be28adc0c`, merge `0e7d1718ac419cc408aae09cf4716645f4094bc4`; cả hai CI xanh. Pages run 38023815411 SUCCESS; production có đúng URL R2, playback/tua/chuyển kinh văn/pause không media error, readyState 4.
- QC local MLX Whisper 0.4.3, model revision `0f058d38170d183f9fdee07908f5b515d91793a8`, đủ 12 chunk, token similarity 0,8238–0,9943. Không export audio cho Google. Điểm chỉ là phát hiện sai khác, không là phê duyệt.
- Chunk 6: ASR toàn chunk bỏ hai mệnh đề; recheck 20–42s nhận ra cả hai mệnh đề. Cửa sổ ngắn khác sinh nội dung ngoài kinh, cho thấy ASR không quyết định được mọi sai khác. Không sửa canonical hoặc tái sinh WAV chỉ theo ASR. Giữ MN2 blocked cần nghe duyệt; các artifact upload/merge/production vẫn có bằng chứng riêng.
- Theo Contract Gate cho phép tiếp tục UID sau khi một bài blocked có ghi lý do, tiếp tục MN3 tuần tự; chưa tính MN2 vào 10 bài thành công.

## 2026-10-10 — MN3: retry có giới hạn cho chunk lặp

- Lần đầu: 9 chunk, MP3 1.046,76s, đã upload R2/hash/byte/range; reader local play/seek tới kinh văn 162,11s và pause, readyState 4, không media error. Chưa PR/merge metadata MN3.
- Offline ASR đủ 9 chunk; chunk index 5 dài 258,2s/1.355 ký tự và ASR có nhiều câu lặp ngoài text plan, similarity 0,5558. Giữ WAV/MP3/manifest/metadata lần đầu trong cache `qc-rejected-attempt-1`, rút đăng ký local của artifact chưa qua QC. Không xoá object R2 bất biến.
- Retry đúng một lần chunk index 5 với model/voice/style/plan không đổi; reuse tám chunk khác. Không sửa kinh văn, không nới chunk limit/profile hoặc tự mở rộng dấu lược. Cần QC lại trước nhận artifact mới.

- MN3 retry index 5: 94,92s, ASR similarity 0,9644, không còn extra repeated long spans. Tổng MP3 mới 883,48s, 17.670.720 byte, SHA-256 `3037c9bf9e8e4540339fa443085cc10f6bf4091f43bc6fb900f034f790a28f3e`, R2 key `vi/mn/mn3/3037c9bf9e8e4540.mp3`; byte/hash/range 206 verified.
- Reader local dùng đúng URL mới, play/pause/tua +15s/chuyển kinh văn 162,11s thành công, readyState 4 không media error. Machine ASR đủ 9 chunk, similarity range 0,9161–0,9731; chỉ số không phải human approval. Ghi uploaded-verified, review pending; chưa ghi merged/live cho MN3.
