# QC audio MN11, MN13, MN14 — 2026-10-11

## Kết quả và giới hạn

**Integrity PASS cho cả ba artifact; tính đúng lời đọc UNPROVEN cho cả ba bài.** Không bài nào được giải tỏa để upload hoặc đăng ký player từ lượt QC này. Những bất thường lớn vẫn xuất hiện khi đổi ranh giới nhận dạng: MN11 nghi thiếu lời; MN13 nghi lặp; MN14 nghi thay lời và lặp. Đây là **suy luận từ ASR**, chưa phải lỗi TTS được xác nhận bằng nghe. Một số câu quảng bá kênh lại biến mất khi đổi cửa sổ và có timestamp bất khả tín: chúng được xếp là **nghi lỗi ASR**, không được lấy làm lý do tự tạo lại audio.

Người biên tập đã cho phép hai thread QC song song, mỗi thread có worktree và log riêng, trong khi TTS vẫn tuần tự và giữ singleton lock. Thread này chỉ sở hữu tài liệu này. Không sửa kinh văn, summary, profile, quality, registry tiến độ hoặc log tiến độ dùng chung; không sinh TTS, upload, register hay approve. `review_status` vẫn `pending`. Các CLI từ chối tham số trong bộ test không sinh lời đọc.

**Phạm vi nghe bằng tai: chưa có.** Không nghe toàn bài, không đối chiếu giọng/nhịp với MP3 MN1, không xác nhận âm thanh bằng cách đọc transcript. Profile trùng mẫu không chứng minh giọng hay nhịp thực tế đã đạt. PASS dưới đây chỉ nói về provenance, bytes và cấu trúc media. Gate phát hành nội dung vẫn chưa đạt.

## Nguồn và phương pháp

Worktree QC: `/Users/james/.codex/worktrees/2765/kinh-tang-pali`; branch `codex/audio-qc-mn11-mn14`, lấy từ remote main `4fff2865330a4f44838027a25edbb397ad46ffbb`. Đã đọc `AGENTS.md`, `docs/audio.md` và prompt audio được đính kèm; quyết định QC song song mới nhất không mở quyền TTS song song.

Cache nguồn được đọc, không sửa:

- MN11: `/private/tmp/kinh-tang-pali-audio-live/audio/mn11/e3c79bded67a639c/`.
- MN13: `/private/tmp/kinh-tang-pali-audio-mn13/audio/mn13/78e3baeba20b9159/`.
- MN14: `/private/tmp/kinh-tang-pali-audio-mn13/audio/mn14/e7a15154828938dd/`.

Bản sao riêng và mọi report mới nằm trong `audio/qc-mn11-mn14/`, được gitignore. WAV đang dùng được so byte hash với cache nguồn và checkpoint. Bản thử bị thay trước đây được giữ nguyên, nhưng không thuộc phạm vi kết luận cho artifact hiện tại.

Lượt đối soát integrity thực hiện lúc **10:37:39 ngày 2026-10-11, UTC+07:00**. Export mới bằng `node --import tsx scripts/audio-source.ts <uid>` trùng toàn bộ `source.json` của từng artifact, gồm summary, mọi segment và source hash; exporter chặn nguồn chưa published hoặc thiếu nội dung. `plan_source` hiện hành tái lập đúng plan; mọi text hash, fingerprint đầy đủ và plan hash khớp manifest/checkpoint. Không chạy generator để export nguồn.

Đối soát đủ **39 WAV và 39 báo cáo ASR toàn chunk đã có**: 11 MN11, 15 MN13, 13 MN14. Mỗi report phải khớp WAV hash, text hash và model revision; không gọi việc tái dùng report là chạy ASR mới cả bài. Mỗi WAV mono PCM 16-bit/24 kHz, frame count và duration khớp checkpoint. Các MP3 được đọc lại toàn bộ frame bằng `mp3_info`; hash, bytes, duration và mốc kinh văn khớp manifest. Pauses được cộng theo profile/plan, không xem là kinh văn còn thiếu.

ASR mới hoàn tất lúc **10:42:12 ngày 2026-10-11, UTC+07:00**: **48 cửa sổ chồng nhau + 9 cửa sổ chẩn đoán**, chỉ chạy trên bản sao của 5 chunk có khác biệt dài: MN11 `004`, MN13 `010`, MN14 `002`, `006`, `007`. Một process tại một thời điểm trong thread; dùng cửa sổ **24 giây, bước 12 giây**, sau đó thêm cửa sổ chẩn đoán **12–16 giây** ở các vùng cụ thể bên dưới. Audio được đổi 24→16 kHz bằng `resample_poly` riêng cho ASR, không sửa WAV/MP3 phát hành. `temperature=0`, `language=vi`, `condition_on_previous_text=False`, có timestamp từ Whisper. Không gửi audio ra ngoài, không tải model mới.

Runtime được người biên tập chỉ định: `/Volumes/SSD/symlinks/james-home/codex/worktrees/mn1-audio-profile/kinh-tang-pali/.cache/audio-qc/venv/bin/python`; `mlx-whisper 0.4.3`. Model local `mlx-community/whisper-large-v3-turbo-4bit`, revision `0f058d38170d183f9fdee07908f5b515d91793a8`; `qc-provenance.json` khớp revision và hash trọng số. SHA-256 `model.safetensors`/`weights.safetensors`: `e2d6146b49644c13ed7467060d3c43c402bbdfca1f01f1c21f6fbeda23b6567e`; config: `538e24557b8f9bc504700add5e7bbe32087c2353001ff563e64772ad4398671a`. Biến offline của Hugging Face được bật. Đổi cửa sổ trên cùng model **không tạo ra bằng chứng độc lập**.

Profile mọi artifact: `vi-charon-mn1-v1`, SHA-256 `a384c5852585077c32e1348a6ada5cfc70a69c989ad705b8b5129fef3e1c9a71`. Toàn bộ snapshot profile, model, voice và style trong manifest trùng `load_profile()`; không suy sự đúng lời đọc từ việc này.

## Từng bài và hành động tiếp theo

### MN11 — UNPROVEN, nghi thiếu hai câu

ASR toàn `004.wav` có similarity 0.885880; các chunk còn lại không có differing span dài từ 12 token trong report hiện tại. Các cửa sổ 24–48 và 36–60 giây vẫn chuyển từ câu hỏi về si sang câu đáp về ái. Nguồn cần có câu đáp `mn11:5.13` “mục tiêu ấy dành cho người không còn si, không phải người còn si” và câu hỏi `mn11:5.14` về người còn ái/hết ái. Chưa thể kết luận hai câu thật sự vắng trong WAV; ASR có thể bỏ câu ở chuỗi lặp.

**Cần nghe trước tiên:** `004.wav` **24–48 giây**, tương ứng MP3 **392.13–416.13 giây (06:32.13–06:56.13)**. Đối chiếu `mn11:5.11–5.15`; kiểm câu hỏi về si, câu đáp về si, câu hỏi về ái và câu đáp về ái theo đúng thứ tự. Nếu nghe xác nhận thiếu/thay lời, đánh FAIL nội dung của chunk và giao thread TTS xử lý trong quy trình tuần tự; nếu nghe đủ thì ghi ASR false negative cùng phạm vi nghe. Cả hai kết quả vẫn không thay thế nghe duyệt toàn bài.

### MN13 — UNPROVEN, nghi lặp đoạn tử thi

Report toàn `010.wav` có similarity 0.792393. Cửa sổ 72–96 giây nhận đoạn chim/thú ăn tử thi và câu đáp “Đúng vậy”; các cửa sổ 96–120 và 108–123.32 giây nhận **thêm một lần** cùng đoạn chim/thú và câu hỏi/đáp. Plan hiện tại chỉ có một lần `mn13:22.1–22.4` trong chunk. Đã đọc chunk liền trước/sau và nguồn toàn bài để phân biệt lặp canonical với lặp ngoài plan: các hình ảnh tiếp theo là các giai đoạn bộ xương, không phải thêm nguyên đoạn chim/thú ấy trong chunk này.

**Cần nghe trước tiên:** `010.wav` **68–123.32 giây**, tương ứng MP3 **1002.71–1058.03 giây (16:42.71–17:38.03)**. Đối chiếu `mn13:22.1–22.4` và ranh giới sang `011.wav`, đếm số lần đoạn chim/thú được đọc. Nếu có lần thứ hai ngoài plan thì FAIL chunk; nếu không thì ghi ASR đã lặp câu. ASR không đủ để quyết định retry.

Cửa sổ 84–108 giây còn nhận một câu quảng bá “Lalaschool” ở **23.86–23.98 giây của cửa sổ**, tức gán hơn hai chục từ vào 0.12 giây. Cửa sổ 96–120 bao phủ cùng đoạn không nhận câu này. **Suy luận độ tin cậy cao:** đây là lỗi nhận dạng/định thời của ASR, không phải bằng chứng TTS thêm câu quảng bá. Không dùng timestamp đó như timestamp âm thanh thật.

### MN14 — UNPROVEN, nghi thay cảnh và lặp; các câu quảng bá có khả năng là ASR

Report toàn `006.wav` có similarity 0.717730. Nguồn `mn14:11.1` nói “lao vào chiến trận hai bên dàn quân”, nhưng cửa sổ 12–36 và 24–48 giây nhận “xông vào những thành lũy mới trát còn ướt”. Cảnh thành lũy vốn thuộc `mn14:12.1`, về sau trong plan. Cửa sổ 60–84 nhận cảnh thành lũy lần tiếp; các cửa sổ 108–132, 120–144 lại nhận cảnh đó với “bị dội phân, bị lực lượng mạnh hơn nghiền nát”. Vì vậy có hai nghi vấn riêng: thay cảnh đầu và thêm lần lặp cuối.

**Cần nghe trước tiên:** `006.wav` **12–48 giây** → MP3 **579.95–615.95 giây (09:39.95–10:15.95)**, so `mn14:11.1–11.3`; sau đó nghe `006.wav` **60–155.84 giây** → MP3 **627.95–723.79 giây (10:27.95–12:03.79)**, so `mn14:12.1–12.4` và đếm lần lặp. Nếu xác nhận đọc cảnh thành lũy thay cảnh chiến trận hoặc thêm lần thứ ba ngoài plan thì FAIL nội dung của chunk.

Hai report toàn `002` và `007` nhận câu “Lalaschool” ngoài nguồn. Các cửa sổ kết thúc `002` (84–107.72, 96–107.72) và `007` (84–100.40, 96–100.40) nhận lời kinh, không nhận câu đó. Nhưng cửa sổ `006` 72–96 lại trả toàn câu “Ghiền Mì Gõ”, và `007` 72–96 trả lời kêu gọi đăng ký kênh, trong khi các cửa sổ chồng nhau nhận lời kinh. **Suy luận độ tin cậy cao:** những câu quảng bá không ổn định này là ASR hallucination; chưa có bằng chứng đủ để nói TTS thêm lời quảng bá. Không suy từ việc giải thích được chúng rằng toàn bộ MN14 đã đúng.

Ở cuối `007`, cửa sổ 84–100.40 còn nhận “có thể thấy ngay trong đời này”, trong khi `mn14:14.3` cần “liên quan đến đời sau”. Đây là khác biệt nghĩa riêng, cần nghe; không bị tiêu chí chỉ tìm span dài che đi. **Nghe `007.wav` 84–100.40 giây** → MP3 **808.14–824.54 giây (13:28.14–13:44.54)**. Kiểm lời “đời sau” và mọi lời thêm sau câu cuối. Để kiểm phản hồi ASR ở `002`, nghe **84–107.72 giây** → MP3 **245.07–268.79 giây (04:05.07–04:28.79)**, gồm phần chấm dứt về hỷ lạc và quay lại dục lạc.

## Lượt chẩn đoán ngắn sau kiểm chồng nhau

MN11 `004` 29–45s vẫn nhận câu hỏi về si rồi chuyển sang câu đáp hết ái. MN13 `010` 98–112s và 111–123.32s vẫn nhận lần đọc thêm đoạn chim/thú và câu hỏi/đáp. MN14 `006` 18–34s và 110–124s đều nhận cảnh thành lũy ở đầu và cuối; `007` 86–100.40s vẫn nhận “ngay trong đời này” thay “liên quan đến đời sau”. Các nghi vấn này chưa được giải tỏa.

MN14 `006` 70–82s vẫn sinh câu quảng bá “Ghiền Mì Gõ”; `082–094s` nhận tiếp lời “bị tên và lao đâm, bị dội phân...”. MN14 `007` 76–88s nhận nghiệp xấu/tái sinh thay câu đăng ký kênh mà cửa sổ 72–96s đã trả. Việc nhận quảng bá còn lặp lại ở một cửa sổ nhỏ làm chỗ `006` 70–82s vẫn cần nghe trực tiếp; không kết luận chắc chắn chỉ từ bản nhận dạng khác. Nó đã nằm trong vùng nghe `006` 60–155.84s ở trên.

**Xác nhận cache nguồn sau QC:** 40 file MN11, 51 MN13, 44 MN14 trong cache nguồn đều có bản sao byte-identical; report mới chỉ có ở cache riêng. Các file lồng của lần thử cũ chỉ được kiểm toàn vẹn, không đưa vào kết luận lời đọc hiện tại.

## Định danh artifact

Mốc thời gian MP3 được cộng từ frame count WAV và pause trong plan, không lấy timestamp ASR làm đồng hồ phát. Index chunk ở tài liệu là zero-based, trùng tên WAV. Duration là thời lượng ghép theo WAV, khác duration encoded một lượng padding nhỏ đã kiểm trong giới hạn pipeline.

### MN11

- Source SHA-256: `1492f8b975482903d6df915925dee9124c43c7b76758a18c7c6d240f5b7537a3`.
- Fingerprint: `e3c79bded67a639cc49adcfb7ae711408aeb922fef031abeeb8697d9790fdec3`.
- Plan SHA-256: `91bbfdd44b995f77db894eea6b289e124e42aa0fcc8350745747feab8e2e11c3`.
- MP3 SHA-256: `a24acf924e1a30e7b8e759930f7a3e23656ac626c995b4da07c437f1dd26b59f`.
- Duration: 990.34s; kinh văn bắt đầu 175.31s; 130 segment kinh văn; 11 chunk.
- Integrity: PASS. Nội dung và giọng/nhịp thực tế: UNPROVEN; human review: pending.

| WAV | Bắt đầu trong MP3 (s) | Duration (s) | SHA-256 WAV | SHA-256 text |
| --- | ---: | ---: | --- | --- |
| `000.wav` | 0.00 | 104.64 | `afe5244f2eb73f07ea3ae76dba8d4c2590f0ee1f02da913f5424dc65fa9eedb4` | `571e480f948fbfd658b39011f3ce15b4f7833adc7608759bb305af29757dccbe` |
| `001.wav` | 104.99 | 68.72 | `e072fe5302f67f7dc77ed6e0a10a5c50a0756a2b41bbe7930801448839c78c4a` | `fb021f1abe4053b799fad58711bf489dbf11175f65051ef82dde65f2aa58506c` |
| `002.wav` | 175.31 | 87.84 | `f9818cad6de28757c19736089142aeb423898cfb5320f5ec5dc86a9c75dcfd67` | `e20ec52b782e11ea162f891f1e76958a988e7ce9484dfadbccff966a2f4a921d` |
| `003.wav` | 263.50 | 104.28 | `5fa20fb75fd54366b5c6d0fbd11764a9bcdcd5619ca012bfc90a371b4159f436` | `daf08cb71bebc1cf25db4b404d45f578ee6c276cb1b4b7bacbe1cbe627c08486` |
| `004.wav` | 368.13 | 80.28 | `f805ef52bfba59a02911ad527e59b4359b385307b9075fa3f29996fe9eef2a81` | `80739aec00080a275fac560f979451dc61d006f179ffccfb16c8e4c526cad892` |
| `005.wav` | 448.76 | 77.76 | `2113b9d48719d177151258fdf4836fc4398aa2df62c00ea70d36cbab83ea926d` | `a1fc60107ae05e37e7020de715a6c83c8aeac65eb66a47e85f288094c4c71fd2` |
| `006.wav` | 526.87 | 105.72 | `ad472f40db4fea1bfb008252d1bd86087d8b69e89e2a99bcd52bc749374ff6b2` | `be0945d6399fb6ec77e9f4b70965a0684a92bd011bcf99952e40f3eb5dadc8a4` |
| `007.wav` | 632.94 | 82.36 | `01bf576e4c4b00fe205ca042762cc1684133c764f9662883a0bf62f3b2cb3609` | `0cbeb7c9e45ccf6530f01fc44fabf6a307c04f05d9823bfdac275a484dc8ee5c` |
| `008.wav` | 715.65 | 101.28 | `e9cd5085764da417c2be85e2d09ab482021e02cdfa50404b5dfee368ac300b42` | `92f8ecd65e1ada03659896f19d3a4104c604dd12ff25c007b3fc8bccc0b773b4` |
| `009.wav` | 817.28 | 113.96 | `350314c63955c023e05d034d24af64be9c5c5b82b330e800e3b16cbdb063f407` | `21808396741c3a5726a5cb61d1b01e4bfc724fcd71a7d903eb421897262bb54c` |
| `010.wav` | 931.59 | 58.40 | `302372cbdf90fb7ef619f6e64dda4e677f84e48e13fa1dcfae427842469c5c2a` | `97516f9152977117e34e7a3ed1fe79f8b70f71b76543982b7c239c9f333d4a55` |

### MN13

- Source SHA-256: `c938b5f23a3e44226ecfd456cf886eb3379fa82e2389df38cca27a6cf47aed05`.
- Fingerprint: `78e3baeba20b915956cf856c359946a9852160ba0031c0c5789bac513c795c39`.
- Plan SHA-256: `f7cbd0ec816db45a27f72b483bc05a89860184b4a68c142125814cd561f7de00`.
- MP3 SHA-256: `823576f930661e36dca7ef5a8309d65dfbfb55f6f00ed21f843b5648ce4b1b7e`.
- Duration: 1382.14s; kinh văn bắt đầu 154.75s; 150 segment kinh văn; 15 chunk.
- Integrity: PASS. Nội dung và giọng/nhịp thực tế: UNPROVEN; human review: pending.

| WAV | Bắt đầu trong MP3 (s) | Duration (s) | SHA-256 WAV | SHA-256 text |
| --- | ---: | ---: | --- | --- |
| `000.wav` | 0.00 | 89.80 | `f0a0e55e049d3919b90448997fca3caeba517d33ae2b7c99e6f0c46b70086840` | `0ef6ea40d19673873a3710f2d151aa4e9dd4ae0df3d6d3ed0eff727221888afa` |
| `001.wav` | 90.15 | 63.00 | `b246c54102b64b35232a7f384a941a97c713bcf0b45fd16dae4f2cfeaa3e674e` | `fc18c45abf2195310e31fdab2a447b5d9228766073e262d1f561a705dd664e9b` |
| `002.wav` | 154.75 | 95.16 | `2fadef44fa51fb0fc05e6bf6a160af8a36557b1df9da9882c3e83e80a3e6afab` | `787f69c85e48984724f6f775348b3185ec9d52ca2f46c540cac51570b2a3e34f` |
| `003.wav` | 250.26 | 99.60 | `90d0f20888e0face5a41ddc4973e469dd2118c69daa97c198d559e4a9007524a` | `999717033faceaaed1823fed702ba93950d6f0bab49197bfd7b4972c6fd90eb9` |
| `004.wav` | 350.21 | 100.72 | `89127e4a5b0b28f6f8f61911d1ecc1eb2563e81c52c7565b67a6b36519b6d879` | `63837774fd97bfb3d7ee2a97e2c56626ef168d8fa282ce041c786f97c281458f` |
| `005.wav` | 451.28 | 101.40 | `485b56cf83c021e0a7805f91024fce3c88eb3341e2469a6f694d31842a8b1a23` | `f245261a6ce828640fbe4f2370531e399a3e3d2705a956b939e0c2598cefc4ba` |
| `006.wav` | 553.03 | 91.76 | `f6291cb9f72c83a93084b785836f2108a662a6c2e600d1d09f9e33d2304383b2` | `ffac516aefbde9c3e33a94d719f3833c2b8ee71784c2c9a4ccf06e1d11b6fb5d` |
| `007.wav` | 645.14 | 75.20 | `7c93d1a7ac501cdd2013378b0578180653446dd715ece23247aad035d3985ec3` | `05222be6f47788594e908d79cd069cfac81adcc00fe5099ff38dd68166e67ef7` |
| `008.wav` | 720.69 | 105.56 | `293a47cbce6f058ab2f4397dbd596913582a9eb170275258c9d0d42ad2701ad1` | `7270f5aafe71bcdad89a807b45680a4a23be0f3ef0d307f18a0b7cdec604640b` |
| `009.wav` | 826.60 | 107.76 | `03c623e96cbdf44a6e5d826de3df0834c7d316079e392e24a5ae0c4197ab32af` | `1c4ae1d16e4f97b57dd632a1434a32dc4eede1bcf51a6ec4b316b27e26062df6` |
| `010.wav` | 934.71 | 123.32 | `a4a7a2617ab9ec0afe7c0a19836b83b690db4ac22e3deebb87ca2d38aadb4a9a` | `6c030fed2e960554668d6b39a2ec0605bbc5b867228446faa3e94f0a57ddb05c` |
| `011.wav` | 1058.38 | 99.92 | `ca23e93111f1f958136d310aae90bb9860fe8978c217eb9cd6707250b9679a28` | `44d6f092c9feed087cbfadda7620b3e1803ec4f0b4320f090c01b549cd39c1ef` |
| `012.wav` | 1158.65 | 100.40 | `f24cd35a50e10c6e40d6586abc02b428281bff5b274a4f2aefd97cdb96d0b3ae` | `eafc284ba639b0e35d5b947ffd48e0d2da8e5aedfd883edae7d15da80d7ccd0e` |
| `013.wav` | 1259.40 | 89.40 | `7d5d8282c5743c141a0a3def9432316ae39405fb26a2978365e3a377af0b3a6a` | `b512c91580e601318921e2daf5b140e1689845032205507539ecabac43e45d6a` |
| `014.wav` | 1349.15 | 32.64 | `59eb946f71e662033fcc232f17803c11ec19681650c0c5010056582cd4dfc6d5` | `8cf492282138772e3de9d7734370c9a02d8b324f71c44aebecaedd0853a03235` |

### MN14

- Source SHA-256: `5b5aecd379659f3ed82828d51a3e6ede1e760572f64df07a739e8cb4d6fade6e`.
- Fingerprint: `e7a15154828938ddc4e451ea0fe135f1168f10bdde15eca4ecb421cfd7ed7247`.
- Plan SHA-256: `d574ab7b37d468560e4506f52ed61c2171ad5662ad3c1a7d6e6e514da3cfc95b`.
- MP3 SHA-256: `93afaa9d3807fc3b3f438b61e91589caf27036960e7fa729ff34e516de1e51d3`.
- Duration: 1238.44s; kinh văn bắt đầu 161.07s; 142 segment kinh văn; 13 chunk.
- Integrity: PASS. Nội dung và giọng/nhịp thực tế: UNPROVEN; human review: pending.

| WAV | Bắt đầu trong MP3 (s) | Duration (s) | SHA-256 WAV | SHA-256 text |
| --- | ---: | ---: | --- | --- |
| `000.wav` | 0.00 | 90.76 | `c5975333304fafd77f86aaca41f19e7ebf057666d184a4fdc4dddea45d40b8fd` | `093a8ef05702b72293a47f11c7f1f064a354a1d5a8dfdfaaae1f620523658930` |
| `001.wav` | 91.11 | 68.36 | `c376cfe93b6c026161e6a812ed2bd07e60a5e64d6720696af06cb841eff53a84` | `cf3c81a9071fa96d9d8d48b965edce62d89f7b5a47b3277e432d3da7fd5098ce` |
| `002.wav` | 161.07 | 107.72 | `4a4c62d6f951272f660671e13f9c74ee717050e632c306cde5502541f54ea53d` | `cc7aa10155d3caf8fea31475dbf9890d8b8780ef8041f09d395e89b8a62f3b57` |
| `003.wav` | 269.14 | 93.72 | `76dfdc1b3818a3209daedf53ade523b7785d5db05c56378636e90a3ab6466caf` | `a18eb8ef914fb84bf8df5d2150646aefed4055b7e8b496fc04812497c66df296` |
| `004.wav` | 363.21 | 105.76 | `ce2eea72c8e33e12613586cc73982d80b9919098e1be6cf7927e92b1c9c4c0e3` | `e52658991bf0bcf0d24ee4a1e639f046459acb57bd66de26eb4929d5110b58f2` |
| `005.wav` | 469.32 | 98.28 | `826b1bf99490c942b281cfb2008400b604c49a0e7649359c52885f61b5114651` | `a19bb45f4c36fb1c3843fd04d63f7746a14a1cfb3c632bcd18425b46c8a57f2b` |
| `006.wav` | 567.95 | 155.84 | `93e61762743418e22ad05b754d1f62247daef3fc02d379bd1321c85b2e1edae5` | `1450ca4a35abc40f8755d47b5b5e686b81e80ed9cafb98b268e6ccb95827dd69` |
| `007.wav` | 724.14 | 100.40 | `299a7eb8071b1437ff5f79ee832ea5110c50b7290ca57e41136bd6c588f3c369` | `fe18d99f2a8cf2a00c16b45675edc92cb32b395c3aab6b524891577d9828ceb3` |
| `008.wav` | 824.89 | 103.72 | `3d3946f3d1697822766df834b7c66c5508b3977604bf46d6f46774e0464e22ce` | `97c7d65854cd2a0bd593a3db37eced4e1bb459aeaaa82faec4a414b6ddb9d9a9` |
| `009.wav` | 928.96 | 96.60 | `e54e68de22c4ee46e7971a5fbe89e704520c66fbc6fbee9d6e7e946bb53f6144` | `2eb185b2537eeb0c5d1ad65fa41881e2b73a68ed7d42f79ff963b73fb9c108bb` |
| `010.wav` | 1025.91 | 91.32 | `42e7f3d7d9925cb3edc5f1444b2148164768b363f6dbd359bbc5e76ad3fff5a5` | `ca73d97ab884ba71c55f3aa9061c52de092f10d568e9322501183538bf57f26c` |
| `011.wav` | 1117.58 | 111.60 | `c696cdc5f61eb5a34dbc5e1952cdc9b94f44482fbacb3211fee7cb997b991591` | `00f753db21dab584ba143c2dd49a3e107d5694372480c665bb0a57725a65f531` |
| `012.wav` | 1229.53 | 8.56 | `d3eda29088f95235ca8a1dbc3e54e041e3263980426f0543dd8e89084871e083` | `2ccf02788ec950838d8952c1f1a3b5477802d787874f0d76d0bda531b11cc80b` |

## Kiểm tra kỹ thuật và giao việc

`npm run audio:check` PASS; `git diff --check` PASS. `npm run validate` PASS, với 2.161 warning về dữ liệu tham khảo/cache hiện có; không gọi đó là không có warning. `npm run check` PASS: 0 error, 0 warning, 5 hint. Lượt `npm test` đầu: 403/404 PASS, một test profile trả exit code khác mong đợi; không suy nguyên nhân khi chưa có stderr của chính lượt đó. Rerun test profile PASS 2/2, rerun toàn suite **PASS 404/404**, không skip và không sửa test/code/lock để đạt. Tài liệu này không thay website, build pipeline hoặc trạng thái xuất bản; build được kiểm bởi CI của exact head trước merge.

Bước tiếp theo là nghe các vùng được chỉ định trên artifact có đúng hash, rồi ghi PASS/FAIL từng nghi vấn với phạm vi nghe thật. Chỉ khi xác nhận lỗi mới quyết định retry qua thread TTS tuần tự; không dùng lượt QC này làm quyền sinh lại. Nghe duyệt toàn bài và đối chiếu mẫu MN1 vẫn là việc riêng trước approve. Thread chính là nơi cập nhật tiến độ dùng chung sau khi đọc bằng chứng; log này không tự thay trạng thái queue.

## Report cục bộ có định danh

Report không vào Git; hash dưới đây cho phép đối soát bản đã dùng. Mỗi report mới gắn WAV/text hash và revision model. `integrity.json` giữ kết quả đối soát toàn bộ 39 chunk.

| Report trong `audio/qc-mn11-mn14/` | Số cửa sổ | SHA-256 |
| --- | ---: | --- |
| `integrity.json` | — | `a3eb838da659cef7b4344601118079d27b33003b43a99a48806daa78c4c119ce` |
| `windows.py` | — | `451271a78f8e0a34208b1f8b92e4fa05496dbe3e00fd77cc727a68644f2ae408` |
| `narrow.py` | — | `859af74fb9a73b5714cf1b57ab3db39b93359b91d61e1bf5f29c31f3001c9c1a` |
| `mn11/e3c79bded67a639c/004.qc-narrow.json` | 1 | `8e0112b7a01b99fa69614e6ca1545bfd45e5fb11ae42b789a4188042fc082844` |
| `mn11/e3c79bded67a639c/004.qc-overlap.json` | 7 | `3e25bdcc2f941c6125a1cacc3143a2a241294bdc54a6a0756fc109f8e5215ae2` |
| `mn13/78e3baeba20b9159/010.qc-narrow.json` | 2 | `499f422c6b9538c63ff917d58e9a8c79433029a653f7a083b4a5cc5f8bca7fe2` |
| `mn13/78e3baeba20b9159/010.qc-overlap.json` | 10 | `c842e0c21b65f44ba11271bab8072713fd0f871fbd58e291e6028a408aed6923` |
| `mn14/e7a15154828938dd/002.qc-overlap.json` | 9 | `f2c502b4d58643eccc6fc2de6f79cee3a5c8a9f6406b2e569cf5efb2f640a6a2` |
| `mn14/e7a15154828938dd/006.qc-narrow.json` | 4 | `dfd83bcc00a479b6589a1969030e348ee6f7b95bc944f30d0c03033311061e1e` |
| `mn14/e7a15154828938dd/006.qc-overlap.json` | 13 | `039881be973cd1f7223d00d00311220a719ec8abee40ac76716aa96c55352b1e` |
| `mn14/e7a15154828938dd/007.qc-narrow.json` | 2 | `08e295a88005f975ed0cf2fd71cb143d0baf66dca969eff8ca0457d1b8a185eb` |
| `mn14/e7a15154828938dd/007.qc-overlap.json` | 9 | `4c5a6c561862b51ffda304c27aad42df9b31b653dda252d74dd89bdc95421d0d` |
