# QC audio MN23 — 2026-10-11

## Kết luận

MN23 đã có MP3 cuối trên R2 sau một retry có giới hạn ở chunk 5. Offline ASR sau retry nhận lại phần giải thích nghi ngờ/con đường rẽ và ví dụ năm triền cái/cái lọc theo đúng thứ tự trong chunk. Local Astro preview đã phát đúng MP3 cuối, nút “Kinh văn” chuyển tới vị trí 2:29 và nút tạm dừng hoạt động. Không nghe duyệt toàn bài; `review_status` vẫn `pending`.

## Nguồn và cấu hình

- Production source: [MN23](https://streamentry.github.io/kinh-tang-pali/sutta/mn/mn23/), Việt 2026 ghi `published`.
- Source SHA-256 `9c25ae34c6591825dd1b9ad36b1183e3d93460e64c43eaec4c56944dc36bdbba`; 102 segment kinh văn; summary 1.948 ký tự; plan 7 chunk, tối đa 1.383 ký tự.
- Profile `vi-charon-mn1-v1`, SHA-256 `a384c5852585077c32e1348a6ada5cfc70a69c989ad705b8b5129fef3e1c9a71`; Gemini `gemini-3.8-flash-tts`, Charon; 24 kHz mono, MP3 160 kbps, không hậu kỳ tốc độ, phát mặc định 1×. Tóm tắt đứng trước kinh văn.
- ASR ngoại tuyến: MLX Whisper 0.4.3, `whisper-large-v3-turbo-4bit`, revision `0f058d38170d183f9fdee07908f5b515d91793a8`; weights SHA-256 `e2d6146b49644c13ed7467060d3c43c402bbdfca1f01f1c21f6fbeda23b6567e`; config SHA-256 `538e24557b8f9bc504700add5e7bbe32087c2353001ff563e64772ad4398671a`. Không gửi audio tới dịch vụ nhận dạng.

## Toàn bài và retry có giới hạn

- Attempt0 MP3 SHA-256 `9c3390138a706558573a46c342ea104c2539a2ce18d4948649d51112f5616b17`, 12.295.200 byte, 614,70 giây. Full ASR ban đầu đánh dấu chunk 5 (`mn23:4.16–4.35`) có một đoạn lệch dài: giải thích con đường rẽ gắn với nghi ngờ chưa được nhận đủ trong thứ tự đọc.
- Retry duy nhất chỉ tạo lại chunk 5; WAV mới dài 103,72 giây so với 90,00 giây trước đó. 6 chunk hợp lệ khác được tái sử dụng từ checkpoint; không đổi giọng, profile hay tốc độ.
- Full offline ASR cuối phủ 7/7 chunk; similarity nằm trong `0.9263–0.9643`. Riêng chunk 5 tăng từ `0.8664` lên `0.9562`, đủ 297/297 token kỳ vọng/nghe. Transcript sau retry ghi nhận giải thích nghi ngờ và con đường rẽ trước chuỗi năm triền cái/cái lọc; ví dụ con rùa theo sau theo đúng trật tự.
- Không retry chunk nào khác. Một lượt nhận dạng máy không chứng minh phát âm hoặc nội dung đúng; nghe duyệt người vẫn chưa làm.

## R2 và trạng thái player

- MP3 cuối SHA-256 `6fa53ffdd30fbd0863e94834fc0b8445ddb0f03cd0e93360936ece26bfa7068f`, 12.569.760 byte, duration metadata 628,42 giây; 26.187 MPEG frame, duration MP3 đo được 628,488 giây; kinh văn bắt đầu ở 149,83 giây.
- R2 URL `https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn23/6fa53ffdd30fbd08.mp3`, key `vi/mn/mn23/6fa53ffdd30fbd08.mp3`. Uploader đã kiểm MIME, tải lại hash/bytes và range request `206`.
- Local Astro preview `http://127.0.0.1:4333/kinh-tang-pali/sutta/mn/mn23/` đã phát MP3 R2 cuối; accessibility tree xác nhận trạng thái Phát→Tạm dừng, nút “Kinh văn 2:29” đưa slider đến 150 giây (làm tròn từ mốc 149,83), sau đó Tạm dừng trả về trạng thái Phát. Metadata/progress là `uploaded-verified`, review vẫn pending. Production chỉ hiển thị player sau khi PR được merge và Pages deploy thành công.
- MP3/WAV/cache và report tự động nằm ngoài Git; `review_status` giữ `pending` cho tới khi người biên tập nghe duyệt.
