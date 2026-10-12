# QC audio MN24 — 2026-10-11

## Kết luận

MN24 có MP3 cuối trên R2, registry `uploaded-verified`, và player local phát đúng object cuối, seek được và dừng được. `review_status` vẫn `pending`: chưa nghe duyệt toàn bài, chưa đối chiếu nhịp với MN1 bằng tai, và không có ASR cho nội dung trong lượt này. Không tuyên bố nội dung đã được duyệt.

## Nguồn, transcript và profile

- Kinh: [MN24 — Kinh Trạm Xe](https://streamentry.github.io/kinh-tang-pali/sutta/mn/mn24/). Việt 2026 đang `published`.
- Source SHA-256 `ebf39859bc3d4d7269589e95dabfe15eac6d557ef010d637b3697840c8b39014`; 137 đoạn kinh văn, đoạn đầu `mn24:1.1`, đoạn cuối `mn24:17.14`; summary 2.253 ký tự.
- Plan 12 chunk: 2 summary, 10 scripture; số ký tự `[1139, 1114, 1332, 1318, 1351, 1365, 1385, 1278, 1394, 1125, 1287, 1281]`, không chunk nào vượt 1.400. `plan_source` chạy lại từ nguồn hiện tại cho đúng plan đã checkpoint; chuẩn hóa ranh giới vẫn khớp toàn bộ canonical segment theo đúng thứ tự.
- Profile `vi-charon-mn1-v1`, SHA-256 `a384c5852585077c32e1348a6ada5cfc70a69c989ad705b8b5129fef3e1c9a71`; Gemini `gemini-3.8-flash-tts`, Charon, đúng style đã duyệt, 24 kHz mono, MP3 160 kbps, không hậu kỳ tốc độ; playback mặc định 1×. Summary đứng trước kinh văn.
- MN1 baseline source/profile hash đã kiểm tra khớp và MP3 R2 chuẩn được tải lại toàn bộ ở cùng lượt: HTTP 200, `audio/mpeg`, 34.696.800 bytes, SHA-256 `a761cf179c1a8e1111a0234568fc8c573e652a08bdde49aed961db1eccc371f2`. Điều này xác nhận object baseline, không thay thế so sánh giọng/nhịp bằng tai.

## Sinh tuần tự và tính toàn vẹn

- Một lần chạy trực tiếp dừng trước request đầu vì Python mặc định thiếu `lameenc`; không WAV nào được sinh. Chạy lại bằng `uv run --with lameenc`.
- Sau khi có hai summary chunk và scripture chunk index 2, request index 3 kẹt trong `socket.connect` hơn 7 phút, không tạo WAV hay trả transcript. Tiến trình bị dừng, cache 0–2 giữ nguyên. PR [#515](https://github.com/streamentry/kinh-tang-pali/pull/515) bổ sung retry mạng có giới hạn và fail-closed HTTP 429; sau merge, resume xác nhận lại source/profile, tái dùng ba WAV hợp lệ rồi tuần tự sinh phần còn lại. Tất cả 12 WAV đều qua hash, frame count và sample-format checks.
- MP3 cuối SHA-256 `d0593754aa09776b7769b66f16bf3a7eeb6da0ddd03ba809a0d0563da5104b71`, 21.022.080 bytes, 43.796 MPEG-2 Layer III frame; duration đo từ frame 1.051,104 giây (metadata WAV 1.051,05 giây); mốc kinh văn đo từ WAV là 153,71 giây. Chênh duration nằm trong ngưỡng kiểm.
- Không có ASR chạy: `OPENAI_API_KEY` không có trong môi trường hay `.env`, và không có model Whisper local trong worktree/Python hiện hành. Đã yêu cầu biên tập viên thêm key cục bộ nếu muốn dùng skill transcription; không gửi key qua chat. Không dùng ASR vắng mặt làm bằng chứng nội dung đúng.

## R2 và player

- Uploader xác nhận public response `audio/mpeg`, tải lại đầy đủ khớp SHA-256/bytes và kiểm range request `206`.
- URL cuối `https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn24/d0593754aa09776b.mp3`, key `vi/mn/mn24/d0593754aa09776b.mp3`.
- Local Astro preview `http://127.0.0.1:4333/kinh-tang-pali/sutta/mn/mn24/` trỏ đúng URL cuối; play bắt đầu, +15s seek đưa timeline tới 22s, nút “Kinh văn 2:33” nhảy tới 153,71s (slider làm tròn 154), pause hoạt động; duration hiển thị 17:31.
- Trạng thái sau local playback: `uploaded-verified`, review pending. Production playback sẽ được kiểm tra sau PR MN24 và Pages deploy. MP3/WAV/cache không vào Git.
