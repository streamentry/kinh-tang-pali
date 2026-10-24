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

**Tốc độ sinh được điều khiển bằng style prompt `Moderate measured pace`, không phải một tham số số học của API.** Cùng cấu hình vẫn có thể có dao động ngữ điệu/nhịp giữa các lần sinh; người biên tập sẽ nghe kiểm trực tiếp trên website sau khi phát hành, kể cả đối chiếu mẫu MN1. Không tự đổi model, dùng fallback khác hoặc điều chỉnh style để xử lý lỗi API.

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

Nếu dùng OAuth đã hết hạn, uploader Python không tự làm mới token. Trong worktree dùng phiên OAuth đúng tài khoản đã ghim, chạy CLI Wrangler đã cài: `wrangler r2 bucket info kinh-tang-pali-audio` để Wrangler làm mới phiên và kiểm quyền bucket, rồi chạy lại uploader với MP3 đã có. Không tạo TTS mới để xử lý lỗi đăng nhập; không in token hoặc đổi tài khoản/bucket. Nếu refresh thất bại mới yêu cầu người biên tập đăng nhập lại.

Script kiểm hash MP3 local, upload với `audio/mpeg`, tải lại từ URL công khai và so SHA-256 trước khi ghi đăng ký. Key chứa hash âm thanh, tránh ghi đè bản đã nghe duyệt và tránh cache cũ.

Sau khi thành công:

- `source/audio-storage.json`: account ID, tên bucket, `bucket_id` do API managed domain của Cloudflare trả về, URL công khai và mục đích sử dụng. Không suy ID từ tên hay tự đặt.
- `content/audio/mn1.json`: link MP3, bucket/key, model/voice/style, hash văn bản, hash MP3, số byte, thời lượng, mốc kinh văn, trạng thái nghe duyệt.

`loadAudio` chỉ hiện player khi có đăng ký MP3 HTTPS hợp lệ và hash tóm tắt + dịch hiện tại khớp. Sửa nội dung khiến player cũ tự ẩn ở build sau; cần tạo bản mới. Chỉ sửa chú thích không làm mất bản đọc. Không có đăng ký thì không hiện player rỗng. Website static cần build/deploy sau upload; upload R2 tự nó không cập nhật website.

Player dùng native audio làm fallback nếu JavaScript tắt. Khi có JavaScript: phát/dừng, tua ±15 giây, timeline có nhãn và tiến độ thực, chọn tốc độ, chọn phần tóm tắt/kinh văn theo mốc thời gian, mở MP3 và lỗi tải rõ ràng. Phần đang nghe được đánh dấu; mọi điều khiển giữ thao tác bàn phím và vùng chạm ít nhất 44px. Không autoplay. Không dùng waveform giả. Style dùng bảng màu xanh trầm và font hiện hành của repo.

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

Player có “Bài trước” / “Bài tiếp” theo thứ tự catalog trong cùng bộ kinh. Nút ở đầu/cuối bộ bị vô hiệu hóa; nút vẫn mở trang đọc khi bài liền kề chưa có audio. Toggle “Tự chuyển bài” mặc định bật, lưu tại localStorage `kinh-tang-pali:audio:auto-next:v1` và đồng bộ giữa các tab. Nếu storage bị chặn, lựa chọn vẫn hoạt động trong trang hiện tại.

Khi phát hết, chỉ chuyển đến bài liền sau nếu metadata audio còn hợp lệ với nguồn hiện tại. Không tự bỏ qua bài chưa có MP3, không vòng về đầu bộ. Khi chuyển tự động, trang sau thử phát tiếp từ đầu qua marker sessionStorage dùng một lần, hết hạn sau 60 giây; truy cập trang bình thường không autoplay. Trình duyệt có thể chặn tự phát sau chuyển trang: player báo rõ và yêu cầu bấm Phát. Tắt toggle thì phát hết bài sẽ dừng.

## Contract Gate và resume hàng loạt

`audio-source.ts` chặn status chưa published, thiếu summary, chưa sync Pāli và bất kỳ đoạn Việt canonical còn thiếu. `audio-inventory.ts` kiểm mọi UID trong catalog MN/DN. `audio-progress.py --init` dựng/đối soát registry tất cả UID; thay nguồn/profile làm entry blocked để kiểm lại.

Generator chia văn bản quá dài theo dấu kết câu hoặc khoảng trắng, giữ nguyên ký tự và thứ tự khi tái ghép. Cache fingerprint gồm source, profile và toàn bộ kế hoạch chunk. Mỗi WAV phải khớp text hash, WAV hash, sample format và frame count; checkpoint atomic ghi ngay sau từng chunk. Source được đọc lại trước mỗi request. Một OS flock dùng chung toàn máy ngăn TTS trùng tiến trình; restart dùng lại chunk hợp lệ. Nếu cần sử dụng `.env` ở checkout chính trong worktree riêng, đặt `NARRATION_ENV_FILE` tới file đó; không copy secrets.

Lỗi kết nối/time-out và HTTP 5xx tạm thời được retry tối đa 5 lần với backoff; nếu hết lượt, giữ nguyên cache và dừng để resume. HTTP 429 dừng ngay vì có thể là hết quota/rate limit; lỗi xác thực hoặc thanh toán cũng không được retry. Không đổi provider hoặc tự gửi thêm request sau khi đã báo lỗi.

MP3 được kiểm toàn bộ frame MPEG-2 Layer III 24 kHz/160 kbps và đối chiếu duration với WAV trước upload. Uploader đọc storage registry, chặn sai account, kiểm SHA-256/bytes/range response và kiểm source lần nữa sau upload. Nó chỉ ghi upload evidence ở trạng thái generated; browser playback/seek/chuyển phần được xác minh riêng trước khi nâng uploaded-verified. Merge/live/review không tự suy ra từ upload.

### Sửa vùng TTS đọc lặp

Khi người biên tập báo lỗi, giữ MP3, manifest, checkpoint và bằng chứng QC cũ trước khi tạo bản thay thế. `--repair-chunks 6,7` nhận chỉ số **từ 0 trong plan chuẩn**, chia riêng các chunk kinh văn đó thành request ngắn hơn theo câu (tối đa một phần ba giới hạn đã duyệt). Không đổi chữ, không mở rộng dấu lược, không đổi profile hoặc xử lý tốc độ. Khoảng nghỉ đặc biệt sau dấu lược chỉ giữ ở cuối nhóm. Tái ghép phải khớp từng ký tự theo phần tóm tắt/kinh văn.

Ví dụ: `python3 scripts/gemini_tts.py --uid dn22 --repair-chunks 6,7 --prepare-only`, rồi bỏ `--prepare-only` để sinh. Cache sửa có fingerprint riêng; các chunk ngoài vùng sửa chỉ được dùng lại khi text/WAV/source/profile khớp. Giữ nguyên cache chuẩn. Manifest ghi `chunk_repair`; upload theo hash mới, lưu lịch sử artifact và nghe kiểm lại trên web. Thời lượng bình thường hoặc kiểm cấu trúc pass không chứng minh hết lỗi lời đọc; review vẫn `pending`.

## Quy trình phát hành cập nhật ngày 2026-10-12

Theo quyết định của người biên tập: bỏ bước transcribe/ASR. Làm tuần tự từng bài: kiểm nguồn và profile → tạo MP3 → kiểm cấu trúc/hash → upload R2 và xác minh object → đăng ký, kiểm player → phát hành website. Không cần API key hoặc model nhận dạng để tiếp tục. Người biên tập nghe kiểm thủ công trực tiếp trên website; giữ `review_status: pending` đến khi có xác nhận nghe duyệt. Việc phát hành không chứng minh TTS đã đọc đúng toàn bài. Giữ nguyên mọi bằng chứng QC cũ, kể cả các lỗi đã ghi nhận; quyết định này không tự xóa lỗi hay biến bài bị chặn thành đã duyệt. Với các artifact trước đây bị giữ vì cờ ASR, kiểm lại nguồn/profile và cấu trúc file rồi upload/đăng ký cho người biên tập nghe trên website; giữ cờ QC như thông tin cần nghe kiểm và review pending. Lỗi nguồn/profile hoặc file hỏng vẫn chặn phát hành.

## Nhịp phát hành cập nhật ngày 2026-10-18

Sau mỗi năm bài upload thành công, tạo/cập nhật một PR và chờ CI của đúng head xanh trước khi merge. Sau merge có thể bắt đầu TTS bài tiếp theo ngay, không cần chờ build, CI hay Pages hậu merge. Chỉ nâng trạng thái thành `live` sau khi Pages production được triển khai và player/R2 được kiểm tra trực tiếp. Không đưa MP3/WAV/cache vào Git.

**Cập nhật của người biên tập ngày 2026-10-23:** CI có thể rất chậm. Sau khi
tạo PR, tiếp tục giai đoạn độc lập tiếp theo ngay; không đứng chờ và không polling
liên tục. Kiểm lại mỗi run sau **2 giờ** kể từ khi tạo hoặc lần kiểm trước. Ghi
head, run ID và mốc kiểm tiếp trong `audio/ci-followup.json` (local, gitignore).
Trước khi agent merge vẫn phải xác nhận mọi cổng CI áp dụng đã xanh trên đúng
head hiện tại. Không hạ gate, không coi thời gian chờ là bằng chứng pass. Khi
người khác đã merge, ghi đúng timeline thực tế. Lịch kiểm không phải cho phép
mở rộng phạm vi TTS hoặc bỏ cổng nghe duyệt mẫu SN/AN/KN.

## Chuẩn bị audio nhóm SN / AN / KN (2026-10-23)

Kế hoạch: [`research/group-audio-plan-2026-10-23.md`](research/group-audio-plan-2026-10-23.md).
Pipeline hỗ trợ UID có thật trong catalog, gồm UID dải như `dhp1-20` và URL riêng
`an1.5` lấy đoạn mình sở hữu từ tệp gộp. Không suy bộ kinh từ tiền tố UID, không
bung UID dải, không tạo bản đọc khác nhau cho các nhóm cha chứa cùng một mục.

MN/DN giữ nguyên transcript tóm tắt → kinh văn và hash đã phát hành. Policy mới
`title-scripture-v1` cho SN/AN/KN lấy tên Việt của mục đọc, sau đó kinh văn; không
đọc segment ID, ghi chú hoặc tự sinh tóm tắt. Tên bài nằm trong hash nguồn mới;
thay tên nhóm không làm đổi audio của bài. Mốc kinh văn là 0; player không hiện
phần tóm tắt giả. **Người biên tập đã duyệt cấu trúc này ngày 2026-10-23 và cho
phép gửi nội dung, tạo thử SN1.1–SN1.10 tới Gemini TTS theo profile MN1 đã ghim.**
Không cần hỏi lại cho mười mục đó; giữ nghe duyệt `pending`. Quyết định ban đầu
giới hạn sản xuất ở mẫu trước khi nghe chấp thuận. **Cập nhật ngày 2026-10-24:**
người biên tập sửa goal thành “move to next phase to complete all audio and
check CI back and merge later (2h for each run)”. Đây là quyền tiếp tục sản xuất
toàn bộ SN/AN/KN theo kế hoạch, thay cổng phải chờ nghe mẫu trước khi tạo tiếp.
Không hỏi lại quyền gửi từng bài tới Gemini. Đây không phải xác nhận đã nghe
duyệt: mọi audio mới vẫn `review_status: pending`, giọng/profile MN1 không đổi.
Nguồn/profile/file hỏng, quota, xác thực hay thanh toán lỗi vẫn chặn tác vụ tương
ứng; không tự xóa bằng chứng QC. Quyết định và tiến độ được ghi tại
[group-audio-progress.md](group-audio-progress.md).

Chuẩn bị không gọi API, không cần `.env`:

```bash
# Kiểm đầy đủ 5.951 UID, gồm các mục trực tiếp trong nhóm hỗn hợp cnd/ne.
python3 scripts/audio-preflight.py --output audio/group-preflight.json

# Chỉ kiểm phẩm mẫu: hash nguồn, policy, accounting và giới hạn chunk.
python3 scripts/audio-preflight.py --collection sn --group sn1-nalavagga \
  --output audio/pilot-preflight.json

# Transcript và plan thực tế, chưa sinh âm thanh.
python3 scripts/gemini_tts.py --uid sn1.1 --prepare-only
```

Sau khi có phép tạo mẫu, khởi tạo hàng đợi chỉ trong phạm vi đã duyệt:

```bash
python3 scripts/audio-progress.py --init --collection sn --group sn1-nalavagga
python3 scripts/audio-progress.py --groups
# Sau đó gọi generator và uploader từng UID như MN/DN, dưới cùng OS lock.
npm run audio:check
```

`content/audio/group-progress.json` schema 2 là hàng đợi sản xuất tăng dần, không
phải tuyên bố đã tạo toàn bộ corpus. Khởi tạo một nhóm mới giữ lại các mục cũ;
đổi nguồn/profile làm mục đó `blocked`. Registry MN/DN schema 1 không bị sửa bởi
lệnh khởi tạo nhóm. Dry-run inventory đo toàn bộ ứng viên riêng. Bộ kiểm CI kiểm
cả hai registry, danh tính/thứ tự/home group, nguồn/profile và từng mức bằng chứng
upload/player/merge/live. Chưa có xác nhận nghe thì luôn `review_status: pending`.

Generator kiểm queue khớp nguồn/profile/policy trước khi đọc credential và trước
mỗi request; uploader kiểm trước khi đọc credential và sau upload. Queue còn
hash cũ, schema sai hoặc lỗi chưa giải quyết phải dừng, không tự xoá lý do chặn.
Khởi tạo lại không tự gỡ `blocked`: đối soát nguồn và bằng chứng lỗi rồi mới dùng
lệnh cập nhật tiến độ để ghi quyết định xử lý; giữ hồ sơ QC trước đó.

Uploader dùng collection trả về từ catalog đã kiểm, key `vi/<collection>/<uid>/<hash>.mp3`,
và đối chiếu managed domain với storage registry trước upload. Audio có nguồn cũ
hoặc bản dịch không còn `published` không được hiện player. Notes-only edits
không đổi hash. Giữ nguyên artifact và bằng chứng QC cũ khi thay bản đọc.

Playlist tái sử dụng các URL theo thứ tự cây điều hướng; nhóm thiếu audio tiếp tục
hiện số mục có bản nghe và bỏ qua mục thiếu. HTML chỉ mang trường phục vụ player,
không mang manifest/profile/QC. Trên 50 mục, danh sách đầy đủ được tải từ JSON
static `/audio-playlists/<collection>/<group>.json` (`all.json` cho cả bộ);
HTML giữ một mục cho player native. Lỗi tải danh sách báo rõ, vẫn giữ native
player và link MP3 từng hàng. Kiểm tra browser bằng fixture không chứng minh
lời đọc chính xác; WAV/MP3 mới vẫn cần nghe duyệt trực tiếp.

### Xuất phẩm từ WAV hiện có

`audio-compile.py` chỉ làm việc local, không đọc `.env`, không gọi Gemini hoặc
R2, không thay đăng ký player/progress. Nó yêu cầu nhóm có con đều là mục đọc và
**mọi** thành viên đã có audio hợp lệ; không biến playlist thiếu bài thành bản
xuất phẩm hoàn chỉnh. Nguồn hiện tại phải published; cache, checkpoint, plan,
profile, MP3 đã đăng ký và các WAV đều phải khớp hash, không còn lỗi chặn.

```bash
# Kiểm nguồn và cache, lập kế hoạch; không cần lameenc.
python3 scripts/audio-compile.py --collection sn --group sn1-nalavagga

# Dùng encoder đã có trong cache để xuất MP3 local, không tạo TTS mới.
uv run --offline --with lameenc python3 scripts/audio-compile.py \
  --collection sn --group sn1-nalavagga --encode
```

Mặc định ngân sách 25 phút/phần, chọn bằng `--max-minutes 20..30`, độc lập với
ngân sách trang đọc. Giữ nguyên từng mục đọc khi nó vừa ngân sách; mục dài hơn
chia tại ranh giới WAV đã biết, giữ UID và đánh dấu `continuation`. Nếu một WAV
đơn vượt ngân sách thì dừng, không ước lượng mốc trong lời đọc. ID `part-001`
chỉ là phần của audio xuất, không phải UID kinh mới.

MP3 mỗi phần được encode một lần từ PCM và đúng khoảng nghỉ của profile, không
nối byte MP3 hoặc chỉnh tốc độ. `plan.json` có chapter tính bằng frame PCM thực,
hash có thứ tự của nguồn, bản đọc, WAV, policy và ngân sách. Không đọc thêm tên
nhóm/tóm tắt chưa duyệt. Kết quả nằm dưới `audio/compilations/`, ngoài Git.
`manifest.json` chỉ được ghi sau khi kiểm lại nguồn/đăng ký/progress cuối lượt.
Kiểm cuối lượt xác minh lại từng asset của chính nhóm: nguồn/profile/QC, plan,
MP3 và WAV phải còn hợp lệ. Một UID ngoài nhóm đang tạo hoặc upload không làm
hỏng bản xuất đang encode; lỗi chặn mới của thành viên trong nhóm vẫn chặn
ghi manifest. Nhờ đó có thể xuất phẩm đã xong trong lúc tạo tiếp phẩm khác.

Các mốc chapter chính xác trong **PCM**; encoder MP3 có độ trễ/đệm, nên manifest
ghi `mp3_chapter_alignment_verified: false`. Không dùng những mốc này làm bằng
chứng seek MP3 chính xác tới mẫu âm thanh. Giữ `review_status: pending` và không
tự quảng bá bản local thành bản tải xuống đã phát hành hoặc đã nghe duyệt.
