# Bản đọc tiếng Việt 2026

Thử nghiệm đầu tiên: **MN1**, tóm tắt trước, kinh văn sau. Không thay đổi bản dịch hoặc trạng thái xuất bản. Bản đọc có trạng thái nghe duyệt riêng (`pending` / `approved`).

## Nguồn và giọng

`scripts/gemini_tts.py` kế thừa pipeline của `../thethreadseers.com/scripts/gemini_tts.py`: Gemini TTS, chia đoạn văn, WAV mono 24 kHz và encoder `lameenc` 160 kbps (MPEG-2 Layer III ở 24 kHz). Dùng API Interactions hiện hành, chuyển hướng dẫn giọng vào `speech_metadata.style` để chúng không trở thành lời đọc.

Cấu hình chung đã được người biên tập duyệt ngày **2026-10-10**, ghim tại `source/narration-profile.json` (profile `vi-charon-mn1-v1`): `gemini-3.8-flash-tts`, **Charon** (catalog Gemini xác nhận male, low). Style yêu cầu nam trầm, bình tĩnh, tốc độ vừa phải, không tụng, không nhạc. Cảm nhận chất giọng và phát âm tên Pāli vẫn cần nghe duyệt; cấu hình không thay thế kiểm chứng bằng tai.

`scripts/audio-source.ts` lấy `summary` từ metadata và `vi` từ document được căn theo Pāli. Chỉ lấy nội dung, không lấy comment, notes, quality, ID hoặc phần đầu `:0.*`. Dấu lược đứng riêng trở thành khoảng nghỉ, không được tự mở rộng thành kinh văn. Những dấu lược nằm trong câu vẫn giữ nguyên. Tên Pāli nằm trong nội dung canonical vẫn được đọc; không sửa thuật ngữ trong bản dịch.

Tóm tắt là lời biên soạn của dự án, không phải kinh văn. Player ghi thứ tự và có nút đến kinh văn; `scripture_start_seconds` đo từ các WAV đã tạo, bao gồm khoảng nghỉ 1,6 giây giữa hai phần.

## Giữ nhất quán giữa mọi bài

Người biên tập đã duyệt **giọng và tốc độ** của MP3 MN1 có SHA-256 `a761cf179c1a8e1111a0234568fc8c573e652a08bdde49aed961db1eccc371f2`. File này là mẫu chuẩn để nghe đối chiếu; phê duyệt giọng/nhịp không có nghĩa đã duyệt toàn bộ độ chính xác lời đọc.

Giữ nguyên toàn bộ style prompt trong profile, model, Charon, giới hạn 1.400 ký tự mỗi chunk, khoảng nghỉ 0,35 giây giữa chunk và 1,6 giây giữa tóm tắt/kinh văn. Không tăng/giảm tốc file sau khi sinh; tốc độ phát mặc định là 1×. Mọi manifest lưu cả profile ID, hash và bản chụp cấu hình để truy nguyên.

**Tốc độ sinh được điều khiển bằng style prompt `Moderate measured pace`, không phải một tham số số học của API.** Cùng cấu hình vẫn có thể có dao động ngữ điệu/nhịp giữa các lần sinh; vì vậy nghe đối chiếu mẫu MN1 trước khi phát hành mỗi bài. Không tự đổi model, dùng fallback khác hoặc điều chỉnh style để xử lý lỗi API.

## Tạo MN1

Khóa Gemini nằm trong `.env` đã được gitignore. Không truyền khóa qua CLI hoặc ghi log.

```bash
# Chuẩn bị và xem transcript trước; không gọi API.
python3 scripts/gemini_tts.py --uid mn1 --prepare-only

# Dùng Python có lameenc, hoặc uv với encoder đã có trong cache.
uv run --with lameenc python3 scripts/gemini_tts.py --uid mn1
```

Chỉ chạy một UID. Script không có lệnh tự tạo toàn bộ Trung Bộ. WAV, MP3, transcript và manifest nằm dưới `audio/mn1/<fingerprint>/`, đều được gitignore. Fingerprint gồm hash văn bản và SHA-256 toàn bộ cấu hình đã ghim; chạy lại cùng cấu hình dùng lại WAV đã hoàn thành. Không có `--voice`, `--model` hoặc biến môi trường để ghi đè cấu hình. `scripts/narration_config.py` chặn thay đổi khác pin đã duyệt; uploader cũng từ chối manifest lệch cấu hình. Nếu người biên tập muốn đổi giọng/nhịp, phải nghe duyệt mẫu mới trước, rồi mới cập nhật profile và pin. Đổi cấu hình đã duyệt tạo thư mục mới, giữ nguyên các bản cũ. Script từ chối đoạn dài vượt giới hạn để người biên tập chia theo câu, không âm thầm cắt mất chữ.

## R2 và đăng ký player

Dùng phiên OAuth sau `bunx wrangler login`; script chọn tài khoản khi chỉ có một tài khoản. Hoặc `.env` có `CLOUDFLARE_ACCOUNT_ID` và `CLOUDFLARE_API_TOKEN` với quyền quản lý bucket / object R2. Không ghi chúng vào tài liệu hay Git. Script upload tạo hoặc dùng lại bucket riêng **`kinh-tang-pali-audio`**, yêu cầu public `r2.dev` đã được bật cho bucket này sau khi người biên tập xác nhận công khai toàn bộ bucket. Script upload không tự bật quyền công khai. Đây là URL nghe thử; trước khi mở rộng lượng truy cập, gắn custom domain theo [hướng dẫn Cloudflare](https://developers.cloudflare.com/r2/buckets/public-buckets/).

```bash
python3 scripts/audio-r2.py audio/mn1/<fingerprint>
```

Script kiểm hash MP3 local, upload với `audio/mpeg`, tải lại từ URL công khai và so SHA-256 trước khi ghi đăng ký. Key chứa hash âm thanh, tránh ghi đè bản đã nghe duyệt và tránh cache cũ.

Sau khi thành công:

- `source/audio-storage.json`: account ID, tên bucket, `bucket_id` do API managed domain của Cloudflare trả về, URL công khai và mục đích sử dụng. Không suy ID từ tên hay tự đặt.
- `content/audio/mn1.json`: link MP3, bucket/key, model/voice/style, hash văn bản, hash MP3, số byte, thời lượng, mốc kinh văn, trạng thái nghe duyệt.

`loadAudio` chỉ hiện player khi có đăng ký MP3 HTTPS hợp lệ và hash tóm tắt + dịch hiện tại khớp. Sửa nội dung khiến player cũ tự ẩn ở build sau; cần tạo bản mới. Chỉ sửa chú thích không làm mất bản đọc. Không có đăng ký thì không hiện player rỗng. Website static cần build/deploy sau upload; upload R2 tự nó không cập nhật website.

Player dùng native audio làm fallback nếu JavaScript tắt. Khi có JavaScript: phát/dừng, tua ±15 giây, timeline có nhãn, chọn tốc độ, đến kinh văn, mở MP3 và lỗi tải rõ ràng. Không autoplay. Không dùng waveform giả. Style dùng bảng màu xanh trầm và font hiện hành của repo.

## Nghe duyệt

Nghe toàn bộ MN1, đặc biệt chuyển tóm tắt → kinh văn, các tên Pāli, dấu lược, đoạn lặp và câu cuối. Kiểm tra không thiếu/thêm lời, không đổi giọng giữa các chunk. Chỉ sau khi người biên tập duyệt mới đổi `review_status` thành `approved`; việc đó không đổi quality/status của bản dịch.

## Kiểm tra

```bash
npm run validate
npm test
npm run check
npm run build
```

Nguồn API: [Gemini speech generation](https://ai.google.dev/gemini-api/docs/speech-generation), [Wrangler R2 object helper](https://github.com/cloudflare/workers-sdk/blob/main/packages/wrangler/src/r2/helpers/object.ts).

## Chuyển bài và tự phát tiếp

Player có `< Back` / `Next >` theo thứ tự catalog trong cùng bộ kinh. Nút ở đầu/cuối bộ bị vô hiệu hóa; nút vẫn mở trang đọc khi bài liền kề chưa có audio. Toggle “Tự chuyển bài” mặc định bật, lưu tại localStorage `kinh-tang-pali:audio:auto-next:v1` và đồng bộ giữa các tab. Nếu storage bị chặn, lựa chọn vẫn hoạt động trong trang hiện tại.

Khi phát hết, chỉ chuyển đến bài liền sau nếu metadata audio còn hợp lệ với nguồn hiện tại. Không tự bỏ qua bài chưa có MP3, không vòng về đầu bộ. Khi chuyển tự động, trang sau thử phát tiếp từ đầu qua marker sessionStorage dùng một lần, hết hạn sau 60 giây; truy cập trang bình thường không autoplay. Trình duyệt có thể chặn tự phát sau chuyển trang: player báo rõ và yêu cầu bấm Phát. Tắt toggle thì phát hết bài sẽ dừng.

## Contract Gate và resume hàng loạt

`audio-source.ts` chặn status chưa published, thiếu summary, chưa sync Pāli và bất kỳ đoạn Việt canonical còn thiếu. `audio-inventory.ts` kiểm mọi UID trong catalog MN/DN. `audio-progress.py --init` dựng/đối soát registry tất cả UID; thay nguồn/profile làm entry blocked để kiểm lại.

Generator chia văn bản quá dài theo dấu kết câu hoặc khoảng trắng, giữ nguyên ký tự và thứ tự khi tái ghép. Cache fingerprint gồm source, profile và toàn bộ kế hoạch chunk. Mỗi WAV phải khớp text hash, WAV hash, sample format và frame count; checkpoint atomic ghi ngay sau từng chunk. Source được đọc lại trước mỗi request. Một OS flock dùng chung toàn máy ngăn TTS trùng tiến trình; restart dùng lại chunk hợp lệ. Nếu cần sử dụng `.env` ở checkout chính trong worktree riêng, đặt `NARRATION_ENV_FILE` tới file đó; không copy secrets.

MP3 được kiểm toàn bộ frame MPEG-2 Layer III 24 kHz/160 kbps và đối chiếu duration với WAV trước upload. Uploader đọc storage registry, chặn sai account, kiểm SHA-256/bytes/range response và kiểm source lần nữa sau upload. Nó chỉ ghi upload evidence ở trạng thái generated; browser playback/seek/chuyển phần được xác minh riêng trước khi nâng uploaded-verified. Merge/live/review không tự suy ra từ upload.
