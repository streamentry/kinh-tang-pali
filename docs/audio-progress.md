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

## 2026-10-10 — MN4 local QC và retry

- Lần đầu hoàn tất 15 chunk/163 segment, MP3 1.478,86s/29.578.560 byte; upload public R2 hash/byte/range verified. Reader local dùng đúng URL: play/chuyển kinh văn 161,27s/pause, readyState 4 không media error. Chưa merge/live.
- Offline Whisper nhận dạng đủ 15 chunk; index 5 có extra repeated paragraph hơn 100 token, duration 129,56s. Giữ WAV/MP3/manifest/registration cũ trong cache `qc-rejected-attempt-1`; retry đúng một lần index 5 với profile/plan không đổi, reuse 14 chunk. Không xóa object R2 hoặc sửa canonical.
- Index 13 có câu ASR ngoài kinh cần kiểm lại; không coi ASR một lần là chứng cứ đủ kết luận TTS thêm lời. Review nội dung vẫn pending.

- MN4 index 13 short-window 65s–end nhận đủ câu kết nguồn và không có outro ngoài kinh; không sửa WAV này theo ASR một lần. Index 5 retry có similarity 0,7210, vẫn còn long differences/repetition. Dừng retry có giới hạn, MN4 blocked cần nghe kiểm nội dung; không đăng ký/upload attempt mới, không gọi artifact cũ đã qua transport là QC pass.
- Không đổi profile/plan/kinh văn. Giữ toàn bộ checkpoint và hai attempt. Tiếp tục UID MN5 theo điều khoản skip blocked, không tính MN4 vào lô thành công.

## 2026-10-10 — MN5 first attempt và bounded QC retry

- Lần đầu đủ 16 chunk/201 segment, MP3 1.685,08s. Chưa upload artifact đã có QC flags. Local ASR chỉ ra index 4 thiếu dài (similarity 0,6612/duration 66,4s), index 8 thêm dài (0,8127), index 9/10 lặp nhiều (0,5753/0,6318; duration 234,52/196,32s).
- Giữ nguyên first attempt WAV/MP3/checkpoint/ASR trong cache `qc-rejected-attempt-1`; retry đúng một lần mỗi index 4,8,9,10, reuse 12 chunk khác. Không đổi profile/canonical/chunk limit; không bắt đầu MN6 trước khi artifact MN5 có checkpoint rõ.

- Retry hoàn tất với MP3 1.500,81s/30.017.280 byte, nhưng local ASR vẫn thấy index 4 chỉ 172/303 token (similarity 0,6737), index 8 lệch dài (0,5000) và index 10 lệch dài (0,8347). Index 9 đạt 312/312 token (0,9744) nhưng không bù được ba chunk còn lại.
- Dừng retry có giới hạn, không upload/đăng ký R2 và không gọi artifact là pass. MN5 chuyển `blocked`, review nội dung vẫn pending; giữ attempt đầu và retry trong checkpoint để nghe đối chiếu. Tiếp tục MN6 theo điều khoản skip blocked, không tính MN5 vào lô thành công.

## 2026-10-10 — MN3 production checkpoint

- PR #409 exact head `1f33ca214fe3757dc34fb64473e4e4d4324c81dc` đã qua cả CI push và pull request; squash merge `87334bdb2b4ff6e60ccef040285eb67de9fd1fbf`.
- Deploy GitHub Pages run `38032511502` SUCCESS. Production MN3 dùng đúng URL R2 hash `3037c9bf9e8e4540`; player phát được (readyState 4, không media error) và nút Kinh văn seek đúng 162,11s. Registry ghi `live`; review nội dung vẫn `pending`.

## 2026-10-10 — Evidence merge và MN6 checkpoint

- PR #411 exact head `ad01aa8e941771656bc0b73078efafcffdbe09ff` qua cả hai CI, merge `3f7ecc39846f328b5fb118484353b46309b8c25f`; deployment `38034166966` SUCCESS. Remote main ghi MN3 live, review pending.
- MN6 source gate pass: 49 segment kinh văn, 8 chunk; xác minh cả 50 phần payload (summary và scripture) đã có trên trang production công khai. Auto-review chấp thuận request sau khi kiểm chứng này bác bỏ tiền đề văn bản chưa công khai.
- Lần đầu MP3 806,38s; local ASR đủ 8 chunk phát hiện lặp dài tại index 2/4 và sai khác tại index 5. Giữ first attempt trong `qc-rejected-attempt-1`, retry đúng một lần ba index 2/4/5 với cùng profile, reuse năm chunk khác.
- Retry MP3 939,25s; index 4 dài 284,56s, similarity 0,4051, còn long repetition/apparent omission; index 2 vẫn có extra long span. MN6 blocked cần nghe kiểm nội dung; không upload/đăng ký player, không tính vào quota thành công. Giữ hai attempt, không thay kinh văn/profile.

## 2026-10-10 — MN7 upload checkpoint

- Source gate pass: 145 segment kinh văn, 10 chunk; toàn bộ 146 phần payload khớp trang production công khai. Tóm tắt trước, Việt canonical sau, profile MN1 giữ nguyên.
- Lần đầu 1.098,39s, ASR phát hiện index 5 dài 223,12s và extra repeated spans. Giữ first attempt, retry một lần index 5, reuse chín chunk. Retry 106,72s, similarity 0,9737 và không còn long differences. Full machine QC đủ 10 chunk, không tuyên bố đã nghe duyệt toàn bài.
- MP3 mới 981,99s/19.641.120 byte, SHA-256 `61ca50790ebaebeb9086dafd25dbf7077bce2dd6ff526c48955b0761710e7a6d`; R2 `vi/mn/mn7/61ca50790ebaebeb.mp3`. MIME/byte/hash/range 206 verified sau refresh OAuth.
- Player local từ R2 phát/tua +15s/chuyển kinh văn 172,23s/pause thành công, readyState 4, không media error. Ghi uploaded-verified, review pending; chưa merge/live. Batch MN-002 có một UID mới thành công (MN7); MN6 blocked không tính vào quota 10.

## 2026-10-10 — MN8 upload, player verification pending

- PR pipeline #415 qua hai CI và merge `03c6a00fbc6ac10e364e92dce1a3ad82eeaac4ee`: sửa off-by-one giới hạn chunk và chặn oversized request. MN8 kế hoạch mới 16 chunk, tối đa 1.395 ký tự; reuse 11 WAV có text/hash/format khớp, chỉ sinh năm chunk còn lại.
- MP3 hoàn chỉnh khoảng 1.416,7s. Whisper local đối chiếu đủ 16 chunk, similarity 0,9211–1,0000, không có differing span từ 12 token trở lên. Machine check không phải phê duyệt nghe toàn bài.
- R2 `vi/mn/mn8/cf3a6e3ff5108e2d.mp3` đã kiểm MIME/hash/bytes/range public sau refresh OAuth. Metadata giữ review pending; registry vẫn generated, chưa uploaded-verified vì chưa kiểm player. Chưa bắt đầu MN9.

- MN8 player local phát từ đúng R2 URL, tua +15s, seek kinh văn 161,75s và pause thành công; duration 1.416,744s, readyState 4, không media error. Nâng uploaded-verified, review pending. Batch MN-002 có hai UID thành công MN7/MN8; chưa merge/live.

## 2026-10-10 — MN7–MN8 merged checkpoint

- PR #420 exact head `3024863401b2c8fd41ab1227344d7ff07db61ffd` qua cả CI push và pull request; squash merge `5752fe510391a4640128b311685c2c3d4fd74e88`, remote main đã đọc lại.
- Registry MN7/MN8 ghi merged, review pending. Pages run `38042010626` đang pending, chưa ghi live hoặc production playback evidence. MN9 mới prepare-only: 20 chunk, tối đa 1.396 ký tự, 232 segment kinh văn; chưa gọi TTS.

- Pages run `38042010626` SUCCESS. Production MN7/MN8 dùng đúng URL R2 đã đăng ký; cả hai phát/tua +15s/chuyển kinh văn/pause thành công, readyState 4 và không media error. MN7 duration 982,056s, scripture 172,23s; MN8 duration 1.416,744s, scripture 161,75s. Ghi live, review nội dung vẫn pending.

## 2026-10-10 — MN9 verified upload

- 20 chunk/232 segment kinh văn, profile giữ nguyên. First attempt được giữ trong cache; local ASR có long apparent omissions ở index 4/11/13/14, retry đúng một lần bốn chunk và reuse 16 chunk khác. Full recheck không còn long differences; không tuyên bố human approval.
- R2 `vi/mn/mn9/85e57d831718cc5f.mp3` đã kiểm MIME/hash/bytes/range public. Local reader phát đúng URL, tua +15s/chuyển kinh văn 164,35s/pause thành công; duration 1.966,2s, readyState 4, không media error. Ghi uploaded-verified, review pending; chưa merge/live.

### MN9 merge checkpoint — PR #423

- Exact head `539fdb637dfbcfae3e352181e16c4a661d0ccf9d`; local validate/test (395)/check/build passed. CI push run 38044935106 and PR run 38044948914 attempt 2 succeeded; attempt 1 failed on upstream GitHub API rate limit.
- Squash merge verified on remote main: `2423803b2ec1d3412835547c913c2f12c1f3d9c6`. Pages run 38045736696 is in progress; MN9 remains merged until production playback is verified. Review remains pending.

### MN9 production verification

- Pages run 38045736696 completed successfully for merge `2423803b2ec1d3412835547c913c2f12c1f3d9c6`. Production MN9 player uses `vi/mn/mn9/85e57d831718cc5f.mp3`; actual play, +15s seek, scripture jump at 164.35s and pause passed (duration 1966.2s, readyState 4, no media error). Registry is live; full listening review remains pending.

### Batch MN-004 — MN10 upload/player checkpoint

- One new UID, MN10: 18 chunks / 233 scripture segments; summary first, scripture begins at 149.83s. Approved narration profile remains unchanged. Initial connection failure resumed once using two cached WAVs. Full offline Whisper comparison flagged indexes 7, 8, 14; one content retry each reused 15 other chunks. Final 18 reports have no differing spans >=12 tokens (similarity 0.8992–0.9873). This is machine QC; human listening is incomplete, review pending.
- Final MP3 1869.67s / 37394400 bytes, SHA-256 `6f0eb8412b856b128ae70a4465b2387d9195d10fb059111fad066d9788adb641`, R2 key `vi/mn/mn10/6f0eb8412b856b12.mp3`. Uploader verified public MIME/hash/bytes/range-206. Local player at port 4325 passed play, +15s seek, scripture jump, pause; duration 1869.72s, readyState 4, no media error.
- Small checkpoint follows editor request for frequent PR/merge/latest-main updates. No media/cache/secrets committed; PR/merge/deploy evidence follows actual completion.

### MN10 merge checkpoint — PR #424

- Remote PR readback confirms merged at 2026-10-10T13:36:10Z, squash `15df29af4a80e4bf8d3173e3c93ca5b3b13ddf41`, exact head `6c80dba87aa5c8a5893d2618f54a37f3d471a363`. Both CI runs 38047734717 and 38047726786 succeeded. Pages run 38056352391 is in progress; live verification remains outstanding. Review pending.

### MN10 production verification

- Pages workflow 38056352391 succeeded for merge `15df29af4a80e4bf8d3173e3c93ca5b3b13ddf41`. Reloaded production page and confirmed the reader displays “Bản nghe 31 phút” and the audio player with the expected R2 link `vi/mn/mn10/6f0eb8412b856b12.mp3`. On production, play changed to pause; +15s moved timeline to 0:16; “Kinh văn 2:29” moved it to 2:29 (150s); pause returned to play. Review remains pending.

### MN11 blocked for content verification

- MN11 source has 130 canonical scripture segments and five verified public summary paragraphs; approved narration profile unchanged. Generated 11 chunks and ran local Whisper over all of them. Chunks 5 and 8 were flagged; one bounded retry of each reused nine chunks. The retry improved chunk 5 similarity from 0.7332 to 0.8859 and chunk 8 had no long span, but full and overlapping Whisper windows still did not reliably recognize the response to the repeated question about freedom from delusion. This is not proof of a TTS omission; it leaves content unverifiable without human listening. Therefore MN11 is recorded blocked, remains review pending, and was not uploaded to R2. Local artifacts are retained under ignored `audio/mn11/e3c79bded67a639c/`. Continue with MN12 per the queue contract.

### MN12 rebuild checkpoint

- First pass generated 34 chunks / 370 canonical segments and passed R2 object hash/bytes/range verification, but it is not registered in the player. Local Whisper repeatedly recognized an extra continuation of the repeated MN12 quotation after chunk 3 ended mid-quote; ASR is not conclusive, so the audio is held for regeneration and listening review. The upload is retained on R2 but unregistered.
- PR #430 merged as `7e0e91151c866dce1238078d5d2c909b36d368ea`. Its quote-aware planner keeps natural sentence boundaries and balances adjacent chunks when both fit the approved 1,400-character limit. The actual MN12 plan remains 34 chunks; 28 old chunk text hashes match, so only 6 WAVs need regeneration. Profile, model, prompt, pauses, and encoding are unchanged.

### MN12 quote-safe rebuild and R2/player checkpoint

- Planner correction PR #430 merged at `7e0e91151c866dce1238078d5d2c909b36d368ea`. The rebuilt 34-chunk plan reuses 28 exact text-hash WAVs and regenerates indexes [2, 3, 8, 9, 32, 33]. The previous R2 object `vi/mn/mn12/2bacd0292eb74107.mp3` remains unregistered; the new object is `vi/mn/mn12/954eeda4dfd9c315.mp3`.
- New MP3: 3137.35s, 62748000 bytes, SHA-256 `954eeda4dfd9c315306f7a7c283735232f4765a42102f305fb94afb674cbc510`. Uploader verified public MIME/hash/bytes/range-206. Local player at port 4326 passed play, +15s seek, scripture jump at 2:30 and pause; review remains pending.
- Full offline Whisper comparison covered 34 chunks, similarity range 0.7174–0.9821. Residual full-chunk ASR differences on repetitive passages are recorded in metadata; overlapping windows checked reused chunks 18, 26 and 27. This is machine QC, not human listening approval.

### MN12 production verification

- Pages workflow 38065259426 succeeded for merge `52d0173cba1b1396a28f14035ef1171925564e93`. Production MN12 page displays the 52-minute player and new R2 key `vi/mn/mn12/954eeda4dfd9c315.mp3`. On production, play entered pause state; +15s advanced to 0:19; “Kinh văn 2:30” moved to 2:30; pause returned to play. Review remains pending.

### MN12 PR #433 merge evidence

- PR `https://github.com/streamentry/kinh-tang-pali/pull/433` merged at `2026-10-10T15:50:49Z`. Exact head `b9f0511777e7a52ccafd9ce0eae14d2e8d501dff`; squash merge `52d0173cba1b1396a28f14035ef1171925564e93`. CI runs 38064293678 and 38064288063 both succeeded. Pages deployment 38065259426 succeeded and production playback was verified.
