# QC audio MN21 — 2026-10-11

## Kết luận

**MN21 chưa đủ điều kiện upload.** MP3 và 16 WAV qua kiểm tra cấu trúc/hash, nhưng sau một lượt retry có giới hạn, Whisper local vẫn nhận ra lặp lời ngoài nguồn ở chunk 7 và bỏ một đoạn dài ở chunk 12. ASR chỉ là detector; chưa có người nghe xác nhận. Giữ `content/audio/progress.json` ở `blocked`, `review_status: pending`; không có metadata player, URL R2 hay tuyên bố đã duyệt.

## Nguồn và cấu hình

- Trang MN21 công khai: [Kinh Ví Dụ Cái Cưa](https://streamentry.github.io/kinh-tang-pali/sutta/mn/mn21/). Trang ghi bản Việt 2026 `published` và hiển thị văn bản dùng cho artifact này.
- Source SHA-256: `e77c5b673b56c7317ae836246af0c63929999a6a309454c309e34b3e512cd6da`; 225 segment kinh văn cùng summary 2.268 ký tự; plan 16 chunk, dài nhất 1.394 ký tự.
- Profile: `vi-charon-mn1-v1`, SHA-256 `a384c5852585077c32e1348a6ada5cfc70a69c989ad705b8b5129fef3e1c9a71`; Gemini `gemini-3.8-flash-tts`, Charon, tốc độ hậu kỳ và phát mặc định 1×. Profile không đổi.
- QC ngoại tuyến: MLX Whisper 0.4.3, `whisper-large-v3-turbo-4bit`, revision `0f058d38170d183f9fdee07908f5b515d91793a8`; model weights SHA-256 `e2d6146b49644c13ed7467060d3c43c402bbdfca1f01f1c21f6fbeda23b6567e`; config SHA-256 `538e24557b8f9bc504700add5e7bbe32087c2353001ff563e64772ad4398671a`. Không gửi audio đến dịch vụ nhận dạng.

## Attempt đầu

Đã tạo đủ 16 WAV và MP3 dài 1.411,89 giây; mọi WAV mono PCM 16-bit/24 kHz khớp checkpoint. Đối soát transcript tái lập cấu trúc summary trước, Việt 2026 sau. ASR phủ đủ 16 chunk; similarity theo index 0–15:

`0.9416, 0.9420, 0.8000, 0.8285, 0.9283, 0.8679, 0.9331, 0.7307, 0.8622, 0.9475, 0.9727, 0.9567, 0.5584, 0.9619, 0.5825, 0.9516`.

Các cảnh báo chung về nhận dạng không tự động dẫn đến retry. Ví dụ outro YouTube ở chunk 3 và 8 không xuất hiện trong cửa sổ cuối tương ứng; chuỗi “tỳ-kheo” dư ở một cửa sổ chunk 5 không lặp ở cửa sổ kề. Giữ các chunk đó nguyên.

Ba chunk cần kiểm sâu:

- **Index 7 — `mn21:9.5–9.30`**: similarity `0.7307`; ASR cửa sổ cuối nhận một continuation ngoài text được gán. Chunk dài 154,92 giây dù plan chỉ có 1.343 ký tự. Một cửa sổ cuối cũng tạo outro không được các cửa sổ khác xác nhận; không dùng riêng nó làm lỗi.
- **Index 12 — `mn21:15.1–18.2`**: similarity `0.5584`, 283 token kỳ vọng so với 111 token nhận được. Ví dụ bó cỏ cháy và sông Hằng không xuất hiện trong transcript đầy đủ hay ba cửa sổ chồng lấn 0–24, 12–36 và 16,76–40,76 giây.
- **Index 14 — `mn21:19.13–21.3`**: similarity `0.5825`, 284 token kỳ vọng so với 128 token nhận được. Ví dụ những tên cướp dùng cưa không xuất hiện trong transcript đầy đủ hay ba cửa sổ 0–24, 12–36 và 18,64–42,64 giây.

## Một lượt retry có giới hạn

Giữ nguyên MP3, manifest, checkpoint và WAV attempt đầu dưới `audio/mn21/1b3d87d338f4562b/attempt0/`. Chỉ sinh lại index 7, 12 và 14; 13 WAV còn lại được tái sử dụng. Source/profile không đổi. MP3 cuối có SHA-256 `bb1c9668144ad40408e75b538345c6029fe9524de503ec3111a77e0fa4243420`, 32.393.280 byte, 1.619,61 giây; mốc kinh văn 160,19 giây. Parser đọc đủ 67.486 frame MPEG-2 Layer III ở 24 kHz/160 kbps; cả 16 WAV đều khớp text hash, WAV hash và frame count trong checkpoint.

| Index gốc | Segment | WAV mới | ASR attempt 0 | ASR attempt 1 | Kết quả |
| ---: | --- | ---: | ---: | ---: | --- |
| 7 | `mn21:9.5–9.30` | 309,84 giây | 0,7307; 301/449 token | 0,4289; 301/944 token | **Blocked.** 25 cửa sổ 24 giây, bước 12 giây, nhận lặp nhiều lần câu chuyện Kāḷī/Vedehikā ngoài 294 token được giao. |
| 12 | `mn21:15.1–18.2` | 38,92 giây | 0,5584; 283/111 token | 0,5431; 283/111 token | **Blocked.** Ba cửa sổ chồng lấn vẫn không nhận ví dụ bó cỏ cháy/sông Hằng. |
| 14 | `mn21:19.13–21.3` | 97,28 giây | 0,5825; 284/128 token | 0,9648; 284/284 token | Retry khớp tốt hơn; full transcript nhận ví dụ cái cưa và phần kết theo đúng thứ tự. Đây vẫn chỉ là machine QC. |

Các timestamp trong MP3 attempt 1: index 7 bắt đầu `664,26s`; index 12 bắt đầu `1.365,73s`; index 14 bắt đầu `1.500,55s`. Full ASR và overlapping windows được giữ trong cache QC riêng, không đưa WAV, MP3 hoặc report máy vào Git.

## Giao việc và trạng thái

Hai lane QC được giao vào hai worktree riêng theo yêu cầu. Lane index 8–15 đã tạo integrity record và tám report ASR trong worktree `Audio QC MN11–MN14`; lượt follow-up của cả hai thread dừng vì workspace hết credits. Điều phối viên chạy bù index 0–7 và QC các cửa sổ của artifact hiện hành bằng đúng model local đã ghim. Kết quả của index 14 dùng WAV attempt 1; report attempt 0 được lưu riêng.

Không có người nghe hoàn tất cho MN21. Không upload R2, không tạo `content/audio/mn21.json`, không đăng ký player. Giữ `review_status: pending`; không phát hành attempt 1 khi chunk 7 và 12 còn khác biệt nội dung lớn. Không retry thêm chunk nào trong lượt này.
