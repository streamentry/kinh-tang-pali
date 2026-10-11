# QC audio MN2, MN4, MN5, MN6

## 2026-10-11 — Đối soát artifact và kiểm lại nghi vấn ASR

Chốt kiểm tra lúc **2026-10-11T10:43:54.520907+07:00** (UTC+07:00). Baseline main: `4fff2865330a4f44838027a25edbb397ad46ffbb`. Người biên tập cho phép hai thread QC song song; thread này chỉ phụ trách MN2/MN4/MN5/MN6, mỗi thread một tiến trình ASR. TTS vẫn tuần tự dưới singleton lock; lượt này không gọi TTS, uploader hay sửa đăng ký, progress, kinh văn, quality hoặc profile.

**Kết luận:** cả bốn artifact **PASS về integrity**. Lời đọc cả bốn bài vẫn **UNPROVEN**, nghe duyệt vẫn `pending`. MN2 có bằng chứng ASR bỏ sót; MN4/MN5/MN6 vẫn **FAIL ở bước sàng lọc bằng máy**, vì các nghi vấn bỏ/lặp lời chưa được giải quyết. FAIL ở đây không phải tuyên bố đã nghe thấy lỗi TTS. Không bài nào được tự approve hoặc tính là một audio mới thành công.

### Phạm vi và phương pháp

Nguồn artifact chỉ đọc: `/Volumes/SSD/symlinks/james-home/codex/worktrees/mn1-audio-profile/kinh-tang-pali/audio`. Copy nguyên bốn thư mục vào ignored cache riêng `audio/qc-mn2-mn6/<uid>/<fingerprint>/` trong worktree này, gồm attempt bị từ chối để bảo toàn lịch sử. **Chỉ artifact hiện tại ở gốc fingerprint được kết luận trong log**; không kết luận cho `qc-rejected-attempt-1`. Không ghi ASR report vào nguồn.

Đọc nguồn hiện tại bằng `node --import tsx scripts/audio-source.ts <uid>`, so toàn bộ object với `source.json`: summary, thứ tự segment, nội dung và source hash đều khớp. Ghép lại plan khớp summary và toàn bộ kinh văn sau phép chuẩn hóa whitespace của pipeline; dấu lược đứng riêng chỉ là khoảng nghỉ theo contract. Tính lại text hash từng chunk, so WAV hash/frame count/format với checkpoint, kiểm mono PCM 24 kHz/16-bit, MP3 từng frame MPEG-2 Layer III 24 kHz/160 kbps, hash/bytes và duration. Mốc kinh văn đo từ WAV + pause khớp manifest; MP3 có encoder padding dưới 0,2 giây theo gate hiện có. **Hash đúng chứng minh đúng artifact và đầu vào; không chứng minh TTS đọc đủ chữ.**

Profile duy nhất: `vi-charon-mn1-v1`, SHA-256 `a384c5852585077c32e1348a6ada5cfc70a69c989ad705b8b5129fef3e1c9a71`. Manifest, profile snapshot, model/voice/style khớp `scripts/narration_config.py`; không override. Không nghe so nhịp với MN1 trong lượt này, nên độ giống giọng/nhịp bằng tai là **UNPROVEN**.

Đã đọc và đối chiếu **51 báo cáo ASR toàn chunk** có sẵn với 51 WAV/text hash hiện tại, không dùng báo cáo của attempt cũ hoặc aggregate không kiểm hash. Các báo cáo từng chunk đều khớp; similarity chỉ là detector, không là điểm chất lượng audio. ASR mới dùng cửa sổ 30 giây, bước 20 giây, chồng 10 giây; cửa sổ cuối có thể ngắn hơn. Chạy trên toàn khoảng WAV của các index: MN2 `005`; MN4 `005,013`; MN5 `002,004,008,010`; MN6 `002,004,005`.

Runtime offline đã có: `.cache/audio-qc/venv/bin/python` tại checkout nguồn. Model local `mlx-community/whisper-large-v3-turbo-4bit`, revision `0f058d38170d183f9fdee07908f5b515d91793a8`, MLX Whisper 0.4.3. Tính lại weights SHA-256 `e2d6146b49644c13ed7467060d3c43c402bbdfca1f01f1c21f6fbeda23b6567e`, khớp `qc-provenance.json`; revision được truy nguyên qua provenance của cache, không tải lại model. Resample PCM 24→16 kHz bằng `scipy.signal.resample_poly(x,2,3)`, rồi `mlx_whisper.transcribe(..., language='vi', task='transcribe', temperature=0.0, condition_on_previous_text=False)`, không prompt kinh văn. Đặt `HF_HUB_OFFLINE=1`, tắt telemetry/implicit token. Một ASR process trong thread; resource tracker của Python không phải ASR job thứ hai. Không gửi audio ra dịch vụ ngoài.

**Phạm vi nghe bằng tai trong lượt này: 0 giây.** Mọi nhận xét dưới đây là đối chiếu transcript máy với nguồn canonical và timeline WAV, không là human listening. Cùng model/cửa sổ chồng nhau không tạo ra một nguồn kiểm chứng độc lập. Dấu lược trong kinh không cho phép TTS tự mở rộng lời, và ASR không được dùng để sửa kinh.

| UID | Fingerprint | Segment kinh văn | Chunk | Duration manifest (s) | Mốc kinh văn (s) |
| --- | --- | ---: | ---: | ---: | ---: |
| MN2 | `2e60893b0f7822f5` | 123 | 12 | 1078.61 | 163.63 |
| MN4 | `a8748f2ca13e2c1c` | 163 | 15 | 1478.62 | 161.27 |
| MN5 | `f9de1454f9b4fd3c` | 201 | 16 | 1500.81 | 158.23 |
| MN6 | `636755f1f05946b3` | 49 | 8 | 939.25 | 144.47 |

### Kết quả từng bài và vùng cần nghe

**MN2 — UNPROVEN lời đọc; suy luận mạnh về lỗi bỏ sót của ASR.** ASR toàn chunk `005` từng bỏ `mn2:8.5–8.6`. Cửa sổ mới 20–50s nhận ra cả hai quan điểm về nhận biết tự ngã/cái không phải tự ngã; nghi vấn thiếu hai mệnh đề đó không còn vững nếu chỉ dựa vào ASR toàn chunk. Tuy nhiên 40–70s tự nhận một câu quảng bá “lalaschool”, còn các cửa sổ trước/sau trở lại kinh. Sự bất nhất này phù hợp lỗi ASR; chưa chứng minh câu quảng bá có hay không trong WAV. Nghe `005.wav` **15–75s**, tương ứng MP3 **428,60–488,60s**, đối chiếu `mn2:8.5–8.8`. Không tái sinh chỉ vì cửa sổ hallucinate. ASR toàn bài similarity 0,8238–0,9943 không thay thế nghe duyệt.

**MN4 — FAIL sàng lọc máy; nghi bỏ/lặp lời có độ tin cậy cao, lời đọc vẫn UNPROVEN.** `005` hiện tại là retry, WAV 129,32s. Cửa sổ 0–30s nhảy từ phần đầu `mn4:10.5` sang phần kết `10.6`, tiếp tục bỏ đoạn trú xứ/thấy nơi mình như báo cáo toàn chunk. Cửa sổ 60–90s rồi 100–129,32s đều nhận ra đoạn vượt qua nghi hoặc (`12.2–12.6`) tại vị trí thời gian tách biệt, trong khi plan có đoạn ấy một lần. Không cộng chồng cửa sổ rồi gọi là lặp; đây là các lần xuất hiện cách nhau trong cùng WAV. Nghe `005.wav` **0–15s** (MP3 **468,60–483,60s**) và **45–129,32s** (**513,60–597,92s**). `013` 60–90s và 80–91,56s nhận câu giải thoát/minh thứ ba, không nhận outro “lalaschool” của ASR toàn chunk: nghi outro nghiêng về lỗi ASR, chưa được nghe xác nhận. Nghe `013.wav` **60–91,56s** (MP3 **1355,24–1386,80s**), đối chiếu `mn4:32–33`. Không lấy cải thiện của `013` để bù lỗi `005`.

**MN5 — FAIL sàng lọc máy; nghi bỏ/lặp lời có độ tin cậy cao, lời đọc vẫn UNPROVEN.** `002` 0–30s cũng bỏ địa điểm mở đầu `mn5:1.2`, giống ASR toàn chunk; tên Pāli khó nhận dạng là giải thích thay thế, nên chỉ là nghi vấn. Nghe **0–20s** (MP3 **158,23–178,23s**). `004` 20–50s và 40–63,36s đi thẳng từ kết luận người biết uế nhiễm sang người không mang uế nhiễm; không nhận phần ví dụ cái bát và lần nhắc lại kết luận (`mn5:5.3–5.8`) mà plan có. Nghe **30–63,36s** (MP3 **370,73–404,09s**). `008` 20–50s, 60–90s và 100–122,68s nhận đoạn tùy hỷ tại ba vùng cách nhau; đoạn chỗ ngồi/nước uống/thức ăn `mn5:15` vẫn không được nhận. Nghe toàn `008.wav` **0–122,68s** (MP3 **682,21–804,89s**) để kiểm bỏ `15` và lặp `16`. `010` 60–90s và 100–130s đều nhận đoạn vật dụng `mn5:26-27` ở hai vị trí tách biệt; 80–110s lại hallucinate một câu quảng bá khác. Nghe toàn `010.wav` **0–137,92s** (MP3 **912,63–1050,55s**), đếm lần lặp và kiểm giữ dấu lược. Không kết luận tên phát âm sai hoặc TTS tự mở rộng dấu lược chỉ từ transcript máy.

**MN6 — FAIL sàng lọc máy; kiểm ưu tiên `004`, lời đọc vẫn UNPROVEN.** `002` có extra clause “của họ sẽ đem lại quả lớn…” ở cửa sổ 60–90s gắn vào ước nguyện nhận vật dụng; 80–110s nhận ước nguyện sự phục vụ, và 100–124,32s còn nhận thêm một lần mở đầu ước nguyện ấy. Nghe **55–124,32s** (MP3 **199,47–268,79s**), so `mn6:4.1–5.1`. `004` 0–30s nhảy từ Dự lưu sang năm hạ phần kiết sử, không nhận Nhất lai `mn6:12.1`; đoạn thần thông `14.1` được nhận ở các vùng tách biệt 20–80s, 80–130s, 140–190s và 200–250s, xen với đoạn năm hạ phần kiết sử. WAV dài 284,56s và ASR toàn chunk 0,4051 là dấu hiệu để kiểm, không tự chứng minh lỗi. Nghe toàn `004.wav` **0–284,56s** (MP3 **360,17–644,73s**) để xác nhận thiếu Nhất lai và đếm số lần `13.1/14.1`. `005` 20–50s và 40–70s đều nhảy từ tâm không sân sang tâm co hẹp, tiếp tục không nhận cặp tâm có si/không si (`16.6–16.7`). Cửa sổ 60–86,64s nhận đoạn kết canonical, không nhận outro của báo cáo toàn chunk; outro nghiêng về lỗi ASR, trong khi thiếu cặp tâm si vẫn là nghi vấn mạnh. Nghe **30–86,64s** (MP3 **675,08–731,72s**) để kiểm hai việc này.

Các khoảng MP3 là timeline tính từ WAV và pause đã kiểm, làm tròn 0,01s; seek MP3 có encoder padding nhỏ. Nghe WAV là cách định vị chính xác hơn. Những vùng trên là checklist triage, **không thay thế nghe toàn bộ bài** trước khi `approved`. Nếu nghe xác nhận lỗi, coordinator xử lý bằng bounded retry tuần tự theo profile hiện có; không đổi kinh văn để khớp audio. Nếu nghe bác bỏ nghi vấn, ghi người nghe, artifact hash và phạm vi thực tế trước khi thay trạng thái. Thread QC này giữ mọi trạng thái chung nguyên vẹn.

### Evidence cache và hash

Mỗi thư mục copy giữ `source.json`, `plan.json`, `checkpoint.json`, `manifest.json`, WAV/MP3, báo cáo cũ từng chunk và báo cáo mới `NNN.window-SSS.json`. Aggregate mới là `qc-windows-report.json`; report có WAV/text hash, model revision, transcript, timestamp và segment timing. Chỉ log Markdown vào Git. Cache cục bộ không phải artifact tải được từ PR; các hash dưới đây giúp nhận đúng file khi nghe ở máy có cache.

| UID | Cửa sổ mới | Bắt đầu UTC | Kết thúc UTC | SHA-256 aggregate mới |
| --- | ---: | --- | --- | --- |
| MN2 | 5 | 2026-10-11T03:39:03.484636+00:00 | 2026-10-11T03:39:15.837468+00:00 | `ca346c92f8db9d0472e8deb07b8464e81c0f0a69ba2b73063c55b7c2d93d26e2` |
| MN4 | 12 | 2026-10-11T03:39:20.379028+00:00 | 2026-10-11T03:40:15.455426+00:00 | `eb97b3826f8702488c529fd15827b65e887c240165c4cab59883cd29084f7d9b` |
| MN5 | 21 | 2026-10-11T03:40:19.944690+00:00 | 2026-10-11T03:41:30.846305+00:00 | `f12b1d0105d0dbbf1c428ac91fcef2381241df7ac2f31d132525b1825b814e81` |
| MN6 | 25 | 2026-10-11T03:41:32.194537+00:00 | 2026-10-11T03:42:32.127260+00:00 | `a77b4417d1ed3a158ee442cc948acff241ffe060e760ae42052e6325d3a962d8` |

### MN2

Source SHA-256: `98cb13229bfe81511598c46f34f9b0cf3559046197941c6e506d193a1ed5be75`. MP3 SHA-256: `d4b228a02455b58b99a8e4b560ca28588b6fc2333a488db513fdbb46b1cf4689`.

| WAV index (0-based) | Bắt đầu trong MP3 (s) | Thời lượng WAV (s) | WAV SHA-256 | Text SHA-256 |
| --- | ---: | ---: | --- | --- |
| 000 | 0.00 | 84.52 | `772fab3c6bdfd9a8b8c59704b3fb1246e94e6ec5201882e3c43ce9b76297e722` | `057ce1a3e28011cdb0d267a0ed85c29e37fe6d85c24a6231970348dd55a8ecde` |
| 001 | 84.87 | 77.16 | `882e367b67c39af42510713140ee6447b4226df4149d8d18c42ea61515f372c7` | `7ab112ae24d9effce7dd061d68a28736632db91efbbce4b5539a0d6c11eb04a7` |
| 002 | 163.63 | 91.00 | `8259bf04fbe2228a490d6f065ca9824f316cf918899df78885b996474b4bd5f2` | `331c1bfb6e3bf6e29119fb914e3d3a4b575ee9cdd27468f60120d675fd567fdd` |
| 003 | 254.98 | 92.56 | `a78efefc695d89f4d04ba7e1d00e03b065836eb6bd7ba203efb8483e11b290a9` | `75a40ff0e3819501f2181ac65b188a26b1e2eca6a2662b6d8ad023a547d0a931` |
| 004 | 347.89 | 65.36 | `5e4644e73580c6b2fc1572035587247a26fd18ea4129fd6247a6b77a769cbe41` | `bce14f27951fe3113319c590d9be736022c10dc6d053ee644432d21742ed9a94` |
| 005 | 413.60 | 95.32 | `da427ba6fa15c5cb6d7cf880c0b2e56cb7eb40f64838a266c8106dd7b218fbd9` | `e2a1d514b660dbce1889b3d3f07345c6c3b4cf54927c412bdec9bfeb1d3ccc88` |
| 006 | 509.27 | 104.56 | `7a2c43d0fed8dc5e162dcd8234a2b96523620c48930c4fbfd238b89811c50606` | `3db45fd379d7caacbb0e4940ce61e821986afe4f60d699a056bcbb7674922b6d` |
| 007 | 614.18 | 100.28 | `090fe921f97f857ee3c98e0036c3d99c8f7407a82cc186aac1a31ff5a4166e77` | `bff51044264cd0381a225b3b10ce01525c0cf029d3d85cdd203b0fe25f66e6ce` |
| 008 | 714.81 | 96.28 | `1ad0694f4bf5e889f35d2475434d27ed6386814d7bbd4a8e4e545b25118c24f3` | `b74b3af006443a90a18fd937fa3e13431675577cf1c6c52987d99aaee4a8f717` |
| 009 | 811.44 | 98.32 | `3682c9c8520a57f7ca4dcddb73dce944b2062c3066d02752a4b68e00bcba6783` | `e0782be8054ee96b6b479988d384e9fb8eb6f056e0b4ca1bedfaa22bdf1fc79a` |
| 010 | 910.11 | 107.32 | `00d870333842eeb60881264625921885d9ee96f7bc7e0ce44599a1eff2791a26` | `de9c17eb99fa4ee7f422cb2711b847cec6fd5e881d6a3609fbd9a740e42f5275` |
| 011 | 1017.78 | 60.48 | `2dceac78faed8ab0b78ae6224f0316e2db38635e119dafa0fbf55a2734e1ee74` | `fde8ac0a3f2a0f6a958c6a61f9a37aa23464bc0c6c3e8d3fc34eef5bd6c04d7f` |
### MN4

Source SHA-256: `e2fcd35dbee5160fcadd46274faa24df3e3669647cf47ff08a374136f9ea1b02`. MP3 SHA-256: `0c0fc4cfa8f26e85c1a6c31345e435e4850b3076cb974fb82b76bd6659da03a4`.

| WAV index (0-based) | Bắt đầu trong MP3 (s) | Thời lượng WAV (s) | WAV SHA-256 | Text SHA-256 |
| --- | ---: | ---: | --- | --- |
| 000 | 0.00 | 99.60 | `be77414622cde7d478789ad40cb60312288a99fd152cd6d30f11e2c184ac034c` | `0c0d7d1978e44b604794b97e9838e9ca147a6b7d0483d09df72bae70dec3cc20` |
| 001 | 99.95 | 59.72 | `0af9a4fcffa5adb67660fc4154eff6e67c8a4a390134dd6ec6969895bba35421` | `c1f9b96869117113ac11d556db6f764dc01a7a6086701466a5e4448c01df2454` |
| 002 | 161.27 | 109.32 | `d86a18b625cc44b26db64c2eb429ee3e3cdb81f3800b4317ae6f0820d41ae909` | `4d4233db85c8e49132d9547d1ce4786cffbc49cc660589b4b64ef74f51a6640b` |
| 003 | 270.94 | 100.08 | `b759414a3afc4a49ded4601448a8dddc6c35e7d51afc3e1f24be661c5a5df750` | `932f33076613868a771b8194e6d2478b52de61690dcfc4bf2322dbe3bdf2dde3` |
| 004 | 371.37 | 96.88 | `01c0a1deace8f08e8ceaeb4c3d56833aa4a6f0c562cd2bcc501b97904fcc1254` | `9d5de11a6dae81b37c9f13cbdf4bd643f13ddfa2589dba778104df6be82c59b5` |
| 005 | 468.60 | 129.32 | `b1d46b79befb6d9921ddb28ce4e91d8c255ea1d2fec9bced59dba0ae7001027c` | `2760777820016cb4bf35ff1fba106c47ef67254df6334d520c4bcfef3bbeb528` |
| 006 | 598.27 | 107.52 | `3fa98ac691c1300350b36884e15ef7d054bc9ec5073887c6cb01e8749e2b42cb` | `124ad7dc7cd29f34e465b215e0596f41894c1c89a039b20cacaa4f055a3124b9` |
| 007 | 706.14 | 102.24 | `020b6b788c8a046760f0bfb01d3bde8eea85cc3de4ff94a699653aa5e9c7f91a` | `ef1adb632cf0d6f42f9a5811feb7edaa69102d6010bbfac3e03664301369366b` |
| 008 | 808.73 | 97.56 | `a8b7c6d8d7aa3938a38ad14535a000022abe27ef8a71405f59f983ca060cbd20` | `d6893771ebf20c1e332467923f70f944f47c141ffa55f1e4a7e4d943f194f951` |
| 009 | 906.64 | 94.20 | `6913c82d494dc75384c8d266f157eaa06c81c34e540f425855370ef9fd8b2f77` | `eaab9ed6495b96cd9f75abc83b6df84af0d44c0c2179623325f51b2b5606635a` |
| 010 | 1001.19 | 92.52 | `7ca2feef7539b86d6b67be356e71f0a9f8b29e50184250494d4c03d5ccc388aa` | `35307bfe0f125ee642772584cb30b0a257e8bf58f10712e36f00b7e2fe209d9c` |
| 011 | 1094.06 | 116.20 | `0becb70a17086ef0ca3d66d889381dd6e14c91d0a6e434dcf86306320edf86a8` | `270b265dd18a6af31b3e377bd3409ba3ea1a916e613d57683512657d4508c88c` |
| 012 | 1210.61 | 84.28 | `dd4c5883605853b862e1bdb05e61156cf72337f51e1c5dc90166b89121d447e2` | `ff8cca2ccf15991cb7c2264a24aa98d14621e24ec1b2f70123938fd28ecdc8ab` |
| 013 | 1295.24 | 91.56 | `59e4472852edd9f3208d168f35cf1a666159e37a65c9710fcf8e50381d221d37` | `35760046651e4edfff42b927291b4dc46ed15c2c83fa062ad87c927ae752a31b` |
| 014 | 1387.15 | 91.12 | `307c76c8470aa73fcf6e04125d86e4de48e6d8445b3971ae2aeeb00800f3d0d1` | `f33ff53b7793a7f10d78adf1e5e5f7905fa0a52543cb8d80e63f9f8f56c1aaa1` |
### MN5

Source SHA-256: `36e3143be295db7eef2e81a5ac03e09f8d9f8829aad3d1f9fba12fbdf7d770e5`. MP3 SHA-256: `fdd25b26457f6630a5babe01dfeeda069b66afbc288f7eeaa2b0b3d22470297c`.

| WAV index (0-based) | Bắt đầu trong MP3 (s) | Thời lượng WAV (s) | WAV SHA-256 | Text SHA-256 |
| --- | ---: | ---: | --- | --- |
| 000 | 0.00 | 66.16 | `8e35ea628557b3d68eaeb175b862868845dbe3632a74318e751b4a744152e072` | `3b0b478651bf713927aa56d85c1034f9f332e3bd79c49f5170b54017e9dd38cc` |
| 001 | 66.51 | 90.12 | `eca1b4cc30ae613ad5960bb16931c1700e1ba30db0f3e92e4b76b03be8563d24` | `bb7b22f8e35ef6b36bd39a3eaa6af29fdce69550fd342a21483a921cd76667ff` |
| 002 | 158.23 | 94.28 | `4b263d8a3e6a6211f2e0d3771fdc2fe9b273a1009cab9ae67561683d06ff3340` | `122f5291c9071120a5ed43de5242c9188115ced560215838fa9ad707965ee47a` |
| 003 | 252.86 | 87.52 | `7f3757c57e02de1007ee6cdf733049362662b182f6b9c4aaa2ef39ee3d54bace` | `5deb6f8de121f632b7fd56b632e92538fe43fd35557e6cc276a972b761836ca0` |
| 004 | 340.73 | 63.36 | `6eeb52db426b081885e34dc8587a84520e1ce2dac2afe45143259b838e252035` | `85a2e1182168b6d78c6255457d80608a44de9404f4a803d9a0fb6a079b7eb9df` |
| 005 | 404.44 | 94.40 | `0f52b910e80ddaf591d0a7a2c8b632f9e20b1fe205ded7911c2246b6714dfcaa` | `0539424559f01d20a40791131198ae9bd5433a114511d076306b8b3c48d2cb3c` |
| 006 | 499.19 | 97.40 | `655aa43a863b2149164676a77aeed84db4f1ac909c0239d4a7b8466a926dd938` | `17e62eb2f52a3b3043ebc5cf5d59461eef01fe82d9926bae013fd54270e416bf` |
| 007 | 596.94 | 84.92 | `e683caec39a6deceee4b7dd11e81e2c9568643ceed0baa21ece6ad8cb667558b` | `721143b4e73e82fa75e291947096a01492ca7d510333053a04a28561e807d85e` |
| 008 | 682.21 | 122.68 | `621000148b70704088b6b537d8166976bb518ef58241e99d7f1242722d04b552` | `36fbe8a28758332dc693926b9e7e6253f4fd13756de793d4e59125f5c24dce3e` |
| 009 | 805.24 | 107.04 | `a212e71062a44df229e5c4fdb6691614552cfccd97550edb77d90a39141838f1` | `ad45715ec47270e3f6d59b8ba1c4871c2aa1426f80f32cc2cb1f95ee0745e017` |
| 010 | 912.63 | 137.92 | `c47cf9ad19c56cd2aa8bf5e9d6f3d3abad582e935860c909ca6fb5c5939203cd` | `e7979b67caef620763fed55a98da9401e3fe7fadcc3f976702a7fa24c395c297` |
| 011 | 1050.90 | 97.96 | `b45551205f445f47c1b1b1e8efbbdd251d0dafcfa5dc3ad974acb798939902b8` | `39d3e6d7905407c1f263ffcf399b63007280d974435ede1a3abaf48b8ea4ac1f` |
| 012 | 1149.21 | 96.32 | `a132f24d9a4d9aa49392e6ad0c5a9ce0245bd5ec3003ba18271a39b05fd99347` | `c1acfa9f7eb55efbb358f08d357ea61f7d3d6976fb0c9d3d185516d5b042d175` |
| 013 | 1245.88 | 92.28 | `57b2f88676d8c0d600de0994147767e7429777642212f5305406b5c9494fc111` | `917c51e40d9f84c182fe99e0a6222459920d88632d2be6009709f2b7e267e97d` |
| 014 | 1338.51 | 100.60 | `cf170de7976221018f1c3ad8a4bd2e566e4f219a97ac6ae041db7281295566ea` | `b137c3549fc4723c4251275304a0cae84f60ff54dfadb625d8e3b129900627bd` |
| 015 | 1439.46 | 61.00 | `ab379249868db17a15790f25b4411421e94ba8882d1a3aeaa2a7450207a45480` | `befafefe0ed8f9a3fbac8bbb5570a487057ee4ae9964d0c181288a30fe041126` |
### MN6

Source SHA-256: `6f91569fff6b2f20f4c23a1eb8017c7309aa4b404f61bf8f10aa40c3bc1ff267`. MP3 SHA-256: `48b016935a0fae6aa438a68c0914bcccd9089968c68b7e98790b23cb6245c197`.

| WAV index (0-based) | Bắt đầu trong MP3 (s) | Thời lượng WAV (s) | WAV SHA-256 | Text SHA-256 |
| --- | ---: | ---: | --- | --- |
| 000 | 0.00 | 69.32 | `7f0718b56f6ae14779b42771457e02c6acf181b4fdbd6c7629f1c1884f330244` | `4c72ce11aa462c6ad15d1782a2c1eb47a97da3b2df2657b59417d3c36997e54e` |
| 001 | 69.67 | 73.20 | `32a2d686b3b803e330a61a5c5a55177ac7d019fd4d66e57c3f6608593eb53d7f` | `8599d41423604d275e757fdbe420b2320c7d87442cffa815f1a8b320db5e0dd5` |
| 002 | 144.47 | 124.32 | `0ff499b9ff59014e1b7c673845d13bc75a7758e369fb6c3b91d00b86a00865d9` | `ad625ea83f6d0f4dade25a94b2b845e1add85cc999641c96a297a142c46f3d95` |
| 003 | 269.14 | 90.68 | `0d0a329294f2e39a042cd1ac1090150009980fcb5df964b53e06e4ef2bfd4750` | `4c9e837f2a7ccae8d9ac53617b65bc95fb00c029560be46486c654f4f9dbbc24` |
| 004 | 360.17 | 284.56 | `368f6569bbdff30905be62b4b356e48e95f2fcaddd263c2e4a8bd097582e592e` | `426deff07a1d811452ad850ee6006bccdfc93e29dcc80eea1922b9385d5b7819` |
| 005 | 645.08 | 86.64 | `b520cbaf738127a6bb0690623db59bed2a0fe720a146ad3b122f1e84e32b886b` | `39d256b7ceab101b0448c9256b9181fff4cb4c1d583e85e92650bbf25c808d9a` |
| 006 | 732.07 | 107.96 | `66163e771428482c0a3c4df83f6d06f0772509b3aa2ebc83622547164f67e665` | `988ace2e33c7d9119c405bd90452b2a7b2cd931d2c357e711f9ccd43898108fa` |
| 007 | 840.38 | 98.52 | `15bf9bf8057eea5194028c567f6bc6e942d0a3f0e77890989e4cb5555bfd0ba8` | `0be9a429e3c3f3a42ec1dc68e7edf3bdd745a1ac4ee11ad0ea5ef22d157740d1` |

### Kiểm tra giao log

`npm run validate` đạt (5.447 assessment histories, 0 lỗi); `npm test` đạt **404/404, 0 skip**; `npm run check` đạt **0 lỗi, 0 warning, 5 hint** trên baseline trên. Diff giao chỉ có `docs/audio-qc-mn2-mn6.md`; không có media/cache/secrets trong staged paths. CI exact head và merge/readback được báo bằng PR thật sau khi xảy ra, không ghi SHA tương lai vào log. Không cần browser QC mới cho thay đổi chỉ bổ sung log; không có player hoặc website code thay đổi.
