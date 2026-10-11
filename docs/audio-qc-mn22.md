# QC audio MN22 — 2026-10-11

## Kết luận

**Audio cuối đã upload và player local hoạt động; nghe duyệt toàn bài vẫn pending.** Transcript machine-QC gồm 26/26 chunk trên model local đã ghim. Hai outlier nội dung được retry đúng một lần mỗi chunk: câu trả lời lặp ở chunk 2 xuất hiện sau retry; chuỗi lặp ở chunk 24 được thay bằng lời đọc khớp đủ các kết quả. Không đánh dấu `approved` vì chưa nghe duyệt toàn bài hay so trực tiếp giọng/nhịp với MN1.

## Nguồn và cấu hình

- Production source: [MN22 — Kinh Ví Dụ Con Rắn](https://streamentry.github.io/kinh-tang-pali/sutta/mn/mn22/), Việt 2026 ghi `published`.
- Source SHA-256 `80bf4214d59c3060b8aa05a0303dde668cc55d0e2614b9759ec79205c8efc67d`; summary dài 2.268 ký tự; 357 segment kinh văn; plan 26 chunk, tối đa 1.398 ký tự.
- Profile `vi-charon-mn1-v1`, SHA-256 `a384c5852585077c32e1348a6ada5cfc70a69c989ad705b8b5129fef3e1c9a71`; Gemini `gemini-3.8-flash-tts`, Charon; 24 kHz mono, MP3 160 kbps, không hậu kỳ tốc độ, phát mặc định 1×.
- ASR ngoại tuyến: MLX Whisper 0.4.3, `whisper-large-v3-turbo-4bit`, revision `0f058d38170d183f9fdee07908f5b515d91793a8`; weights SHA-256 `e2d6146b49644c13ed7467060d3c43c402bbdfca1f01f1c21f6fbeda23b6567e`; config SHA-256 `538e24557b8f9bc504700add5e7bbe32087c2353001ff563e64772ad4398671a`. Không gửi audio cho dịch vụ nhận dạng.

## Toàn bài và hai retry có giới hạn

Attempt0 MP3: SHA-256 `81803a24ad384a6f6d01e8cc18b0484298f88ce2b4c8fa3373bd4621d310faa7`, 49.919.520 byte, 2.495,91 giây; mốc kinh văn 171,87 giây. Toàn bộ 26 WAV khớp checkpoint, profile và text hash. ASR phủ 26 chunk.

Similarity cuối theo index 0–25:

`0.9140, 0.9471, 0.8908, 0.8836, 0.9111, 0.8036, 0.9288, 0.8699, 0.9610, 0.9522, 0.9667, 0.9587, 0.9871, 0.9934, 0.9527, 0.9572, 0.9633, 0.9736, 0.9726, 0.8849, 0.9281, 0.9502, 0.9670, 0.9343, 0.9408, 0.9565`.

- **Index 24 — `mn22:44.2–47.3`**: attempt0 similarity `0.3200`, 304 token kỳ vọng/346 nghe. Chín cửa sổ chồng lấn nhận lặp phần dẫn và làm mờ các kết quả. Retry thứ nhất tạo WAV 95,44 giây; full ASR `0.9408` (304/304 token). Bảy cửa sổ 24 giây, bước 12 giây, nhận các đoạn về Nhất lai, Dự lưu, người theo Pháp/niềm tin và người có lòng tin theo đúng thứ tự.
- **Index 2 — `mn22:1.1–3.6`**: attempt0 similarity `0.8427`, 283 kỳ vọng/251 nghe; full ASR bỏ câu đáp lặp “Đúng vậy, các hiền giả…”. Sáu cửa sổ đầu đọc được mệnh đề chính nhưng chưa xác nhận tiền tố câu đáp, nên retry thứ hai chỉ tạo lại chunk 2. WAV mới dài 95,24 giây; full ASR `0.8908` (283/285 token). Bảy cửa sổ attempt1, trong đó 60–84 giây, nhận câu đáp và mệnh đề lặp trước đoạn chất vấn.
- **Index 19–20**: full ASR chèn câu quảng bá kênh. Cửa sổ cuối 25/12 giây của từng chunk không nhận câu đó; xếp là hallucination của ASR, không retry.
- **Index 5**: similarity `0.8036`, nhưng 275/275 token; phần lớn khác biệt là Whisper ghi tên Ariṭṭha/kên kên khác dấu. Các khác biệt này không tự xác nhận sai phát âm; cần nghe duyệt.
- Summary chunk 0 có một span lặp bị full ASR bỏ. Sáu cửa sổ chồng lấn vẫn nhận nội dung summary chính; ASR không đủ để kết luận đã thiếu câu. Không retry thêm chunk nào trong lượt này.

Attempt0 được giữ trong `audio/mn22/40372f0ea9b1992b/attempt0/`; bản trước retry chunk 2 được giữ trong `attempt1/`. Cache, MP3/WAV và báo cáo máy đều nằm trong vùng ignored, không commit vào Git.

## R2 và player

- Bản cuối: SHA-256 `f062adda04f29ab2d040faec0a5c2e4cba763d4fbbb33b1bc53bee490a3bf606`, 49.866.720 byte, 2.493,27 giây; 103.889 MPEG-2 Layer III frame; kinh văn bắt đầu 171,87 giây.
- R2 URL `https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn22/f062adda04f29ab2.mp3`, key `vi/mn/mn22/f062adda04f29ab2.mp3`. Uploader xác nhận `audio/mpeg`, tải lại toàn file so SHA/bytes và range request `206`.
- Preview local `/sutta/mn/mn22/` phát đúng URL cuối: browser `readyState=4`, không media error; play tại 0,94 giây, pause tại 0,96, tua +15 giây đến 15,96, nút “Kinh văn 2:51” nhảy tới 171,87 giây. Duration của media element 2.493,34 giây.
- Chunk 24 attempt1 từng được upload trong lúc xử lý outlier chunk 2. Object hash-key `vi/mn/mn22/7249225bfd3d757e.mp3` vẫn công khai nhưng đã gỡ khỏi metadata và không còn được player tham chiếu; giữ lại để audit, chưa xóa. `content/audio/mn22.json` và progress hiện trỏ bản cuối `f062adda…`.

## Giao QC và trạng thái nghe

Hai lane QC riêng được giao chia chunk 0–12 và 13–25, nhưng cả hai follow-up thread dừng do workspace hết credits trước khi hoàn tất report. Điều phối viên chạy bù full ASR 26 chunk và các cửa sổ cần thiết bằng model local đã ghim; report/hash mapping được giữ trong `audio/qc-mn22-full/` (ignored).

Progress là `uploaded-verified`, `review_status: pending`. Chất giọng/nhịp giữ cùng profile đã được duyệt với MN1, nhưng lượt này chưa nghe duyệt toàn bài, chưa xác nhận từng tên Pāli bằng tai và không tuyên bố nội dung đã được người biên tập duyệt.

## Production deployment and live check

PR [#510](https://github.com/streamentry/kinh-tang-pali/pull/510) merged as `a5c57c9b2da2d72cf9a7c013c73a381990152251`; Pages run [#655](https://github.com/streamentry/kinh-tang-pali/actions/runs/38143787220) succeeded. Production [MN22](https://streamentry.github.io/kinh-tang-pali/sutta/mn/mn22/) exposes the final R2 key `vi/mn/mn22/f062adda04f29ab2.mp3`. The live browser started playback, advanced with +15s, sought to the 171.87s scripture mark (displayed 2:51), and paused. Content review remains pending.
