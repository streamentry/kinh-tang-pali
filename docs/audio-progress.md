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

### MN13 inherited-quotation planner checkpoint

- PR https://github.com/streamentry/kinh-tang-pali/pull/459 merged as `9e70280d0f060ee3a519261a3f3abd593771ee57`, exact head `1e6f7b9ed486b532dda3634917956e2ad35f3d1d`. Both hosted CI runs 38102811603 and 38102795812 succeeded. The planner now tracks inherited nested quotations in order rather than comparing quote counts. No narration profile, source text, pause or encoding changed.
- MN13 source SHA-256 `c938b5f23a3e44226ecfd456cf886eb3379fa82e2389df38cca27a6cf47aed05`; approved profile SHA-256 `a384c5852585077c32e1348a6ada5cfc70a69c989ad705b8b5129fef3e1c9a71`. New plan `78e3baeba20b9159` has 15 chunks and 150 canonical scripture segments. Thirteen WAVs matched exact text hashes and validated format/frame/hash checkpoints; indexes 10 and 11 need regeneration for the changed boundary.
- One additional bounded content retry of index 5 preserves its original WAV and ASR report. The retry local Whisper similarity is 0.9741 (previously 0.7737), recognizes the asset-accumulation failure passage and has no differing span of 12 or more tokens. This is machine QC only; human listening remains incomplete and review pending. No MN13 R2 upload or player registration at this checkpoint.

### MN13 bounded retry remains blocked

- Replanned artifact `audio/mn13/78e3baeba20b9159` generated all 15 chunks; one bounded content retry each of indexes 5 and 10 preserved originals. Final local ASR covered all 15 chunks, similarity range 0.7924–0.9897. Index 5 now recognizes the asset-accumulation failure passage (0.9741, no long difference); index 10 still recognizes a long repeated passage after its bounded retry (0.7924). Index 11 has similarity 0.9505 without a long difference.
- This does not prove a TTS error: ASR remains an imperfect check. MN13 is blocked pending human listening/content verification; no R2 object or audio metadata is registered. MP3, WAVs, plans, reports and original attempts remain in ignored local storage. Review pending. Continue the sequential queue with MN14 without counting MN13 as completed.

### PR #459 deployment evidence

- Pages run 38103659643 succeeded for merge `9e70280d0f060ee3a519261a3f3abd593771ee57` (verified by GitHub run readback). This technical planner PR registers no new audio; MN13 remains blocked and was not uploaded.

### MN13 checkpoint merge and MN14 start

- PR https://github.com/streamentry/kinh-tang-pali/pull/462 merged at 2026-10-11T02:24:43Z; exact head `f597f888ff62db7e5369eabffec4f5f2155ef6d0`, squash `ff21ab2bf15d7b0b1fc3bc81ae4f4008fa91cd79`. CI runs 38104332206 and 38104328717 both succeeded. Pages run 38105064963 remains in progress at this checkpoint; no new audio was registered by that PR.
- Additional local overlapping windows (80–123.32s and final 25s) of MN13 chunk index 10 still recognized the repeated corpse-example passage after the bounded retry. ASR is not authority; human listening remains required, and no MN13 upload occurred.
- After fetching the merge and switching to a clean branch from remote main, MN14 prepared 13 chunks / 142 canonical scripture segments, source SHA-256 `5b5aecd379659f3ed82828d51a3e6ede1e760572f64df07a739e8cb4d6fade6e`, plan `e7a15154828938dd`. Exact normalized HTML comparison verified all 142 canonical cells (excluding aside comments) and five summary paragraphs against production. Approved narration profile unchanged. One sequential TTS process started; voice/pace human comparison and full content listening are not claimed. Review pending.

- MN14 early local QC: summary indexes 0/1 similarities 0.9455/0.9289 without long differences. Index 2 full ASR inserted a generic video outro; last-25s and last-12s local windows both recognized only the canonical ending and did not reproduce that insertion. This is narrower machine evidence, not full listening approval. Original ASR and window reports are retained locally; no retry is triggered solely by the unreproduced outro.

### MN14 bounded content retry checkpoint

- Generated all 13 chunks and final MP3 approximately 1238.4s. Full offline ASR covered all chunks. Generic outro insertions in indexes 2/7 were not reproduced in final25s/final12s windows. Index6 still recognizes a long fortress-example continuation outside its assigned text after one bounded retry (similarity0.7177). Original attempts and reports remain ignored locally. This is not proof of a TTS error; MN14 is blocked pending human listening/content verification, with no R2 upload or player registration. Review pending. Continue sequentially with MN15.
- Pages run38105064963 succeeded for checkpointPR462 merge `ff21ab2bf15d7b0b1fc3bc81ae4f4008fa91cd79`, verified by GitHub run readback.

### MN15 sequential start

- MN15 prepared 20 chunks from summary followed by261canonical scripture segments; sourceSHA256 `0830164f792e32161f6906c3ee16d9182b9d83ae5e27af882576818d7d8da601`, plan `67e3985553a6ac90`, maximum1389characters within approved1400limit. One sequential generator started with pinnedMN1profile; no voice/pace human comparison or full listening is claimed. Reviewpending. MN14 remains blocked, not uploaded and not counted complete.

### Parallel QC lanes and MN15 bounded retry

- Editor explicitly authorized two parallel QC threads, each with separate worktree/log. Audio QC MN2–MN6 owns docs/audio-qc-mn2-mn6.md; Audio QC MN11–MN14 owns docs/audio-qc-mn11-mn14.md. They inspect copied cache artifacts and do not invoke TTS or mutate the shared registry. Main audio thread keeps one TTS process.
- MN15 first pass generated20chunks, approximately1891s. Full localASR covered20chunks. One bounded retry of indexes[2,3,5,6,7,12,13,14,15,16] preserves originals and reuses10WAVs. Generic outro-only indexes10/18 were not reproduced in final25s/final12s ASR windows; retained without retry. Early retries2/3 still have longASRdifferences; no content approval, upload or player registration is claimed. Final review pending.

### MN15 final bounded-retry checkpoint

- FinalMP3 approximately1903.8s,20chunks/261canonical segments. Full offlineASR covered20chunks after one content retry of each of10flaggedindexes, reusing10WAVs. Remaining long scripture differences at indexes2,3,6,13,14,16; final similarity range0.6272–0.9897. Generic outro-only indexes10/18 were not reproduced in last25s/12s windows. ASR is not authority; content remains unproven without human listening. MN15 blocked, reviewpending, no R2 upload or player registration. Original attempts/reports and final artifact retained in ignored cache.
- This checkpoint records0newsuccessfulaudio files and2blockedUIDs(MN14,MN15), following the requested frequentPR cadence; neither blocked UID counts toward10successes.

### MN14–MN15 checkpoint merge and MN16 start

- PR https://github.com/streamentry/kinh-tang-pali/pull/469 merged at2026-10-11T04:07:50Z, exact head `3bdb8b6d8292b75a8f4ac1309d2bb3667cbd62d0`, squash `7a290f066c654e4e0dc94a9844bf8ea47a9dab62`. BothCIruns38109885637/38109882422 succeeded. Pages38110600490 remains inprogress at this checkpoint; no new audio registered. Fetched main includes QC logPR467 merge `40aa4022a08c8018fd7306994dd2348663da2e40`.
- MN16 sourceSHA256 `f1ec019dd4d504f6a6edc17dba71a03b75f21a70d2571efc93ec9ef4de3958bb`, plan `806e2b2f28b52bee`,9chunks/81canonical scripture segments;81cells excluding aside comments and4summary paragraphs matched production via normalized HTML text. Pinned narrationprofileunchanged. One sequential generator started after fetching main. Voice/pace comparison and human listening not claimed; reviewpending.

### MN16 R2 and local player checkpoint

- MN16 generated9chunks/81canonical scripture segments. First fullASR flagged index8 hen-and-eggs example; one bounded retry preserves original and reuses8WAVs. Final fullASR9chunks has no differing span of12or more tokens, similarity0.8973–0.9929. This is machineQC, not listening approval; reviewpending.
- MP3 SHA256 `11c3c96ee760b79c95c1adf9b113e6383308d894f6e80d7985c9708c6cd086f2`, 16601760bytes,830.04s; scripture starts130.99s. R2 key `vi/mn/mn16/11c3c96ee760b79c.mp3`; uploader verifiedpublicMIME/hash/bytes/range206 afterOAuthrefresh.
- Localreader4331 loads actualR2link. Play changed to pause; +15s moved timeline0:21; scripturejump131s/2:10; pause returned to play at2:17. Registry uploaded-verified; merge and productionverification still pending.

- Pages38110600490 succeeded for checkpoint469 merge `7a290f066c654e4e0dc94a9844bf8ea47a9dab62` (GitHub run readback); that checkpoint registered no audio.

### MN16 PR merge checkpoint

- PR https://github.com/streamentry/kinh-tang-pali/pull/471 merged at2026-10-11T04:40:21Z; exacthead `7c6898b76e3ec4bfa95f672a02067546c7e60cb6`, squash `1f2f6d3cd61260ec26116b255a6ead357b607ad0`. CIruns38111523740/38111519965bothsucceeded. RemotePRreadbackconfirmedmerge andmainfetched. Pages38112324730pending; MN16markedmerged, notliveyet. Reviewpending.

### MN16 production verification

- Pages38112324730 succeeded for merge `1f2f6d3cd61260ec26116b255a6ead357b607ad0`. ProductionMN16page shows the14-minute player and R2key `vi/mn/mn16/11c3c96ee760b79c.mp3`. Browserplay changed to pause; +15s moved to0:18(19s slider); scripturejump131s/2:10; pause returned toplay at2:15. Markedlive with evidence. Fullhumanlistening remains incomplete; reviewpending.

### MN17 sequential start

- After verifiedMN16productionplayback, fetchedmain through `d15a56ca` without altering other work. MN17sourceSHA256 `92d1ad5a905d80bb12b094b647806a332e0597c2e2d40134dba8a5ae74153796`, plan `a6bc607daf851a73`,11chunks/81canonical scripture segments. Productiontext comparison matched81canonicalcells excluding comments and4summaryparagraphs. Profileunchanged; oneTTSprocess. Nohumanvoicecomparison/fullcontentlistening claimed; reviewpending.

### MN17 bounded-retry content checkpoint

- Generated11chunks/81canonical scripture segments. Full localASR flagged onlyindex9. One bounded retry reused10WAVs and preserved original. Final artifact approximately871.7s. Final11reports similarity0.7816–1.0000; index9 still has a long difference. Localwindows0–35s,30–65s,60–68.32s and43.32–68.32s recognized a transition from easy requisites to lifelong following without the repeated reflection. ASR is not authority and cannot certify omission; human listening required. MN17blocked, reviewpending, noR2upload orplayerregistration.
- Checkpoint recordsMN16productionverification andMN17blocker; onlyonepreviouslymergedUID gainsliveevidence, zero newly uploadedfiles. Small checkpoint follows requested frequentPRcadence.

### MN18 sequential start and checkpoint478merge

- PR478 merged at2026-10-11T06:11:38Z; exacthead `a67f1fb8f37a00119ec0e4e5aea6eb84fba5db94`, squash `18833efb50acc06f91464076ed7cb032857b19d5`; CI38113950957/38113948154 bothsucceeded. Mainfetched before MN18; Pages38117261829 pending at start, no new audio registered by checkpoint.
- MN18sourceSHA256 `b9ac1c404e9c4a9eb9a8e971191541606d9d4639a85911eb578e328f116f8a1c`, plan `0edaa56bac436d2f`,13chunks/148canonical scripturesegments. All148canonicalcells excludingasidecomments and5summaryparagraphs matchedproduction. Pinnedprofileunchanged; single sequentialTTSprocess. Firsttwo summaryWAVs localASRsimilarities0.9224/0.9451, no long differing spans. MachineQConly; nohumanvoicecomparison/fullcontentlistening claimed, reviewpending.

### MN18 final bounded-retry checkpoint

- Generated13chunks/148segments; one bounded content retry of indexes5/11 preserved originals and reused11WAVs. Final artifact approximately1195.7s. Full13chunkASR: index5 now0.9382 without long differences; index11 remains0.7098 with long missing quotation. Valid windows0–45s,40–60.28s and35.28–60.28s did not recognize the repeated quotation. An empty out-of-duration window was excluded and is not evidence. ASR is not authority; human listening required. MN18blocked, pending, noR2upload/playerregistration.
- Pages38117261829 succeeded for checkpoint478 merge `18833efb50acc06f91464076ed7cb032857b19d5`, verified by GitHub readback.

### MN18 checkpoint merge and MN19 start

- PR489 merged at `2026-10-11T06:52:06Z`; exact head `ed62d46bbda64b510278474d0c24084aac0c3cd1`, squash merge `0857c602fe5ada655597459417c49a61d69f9ff8`. Both CI runs 38118529349 and38118525402 succeeded. MN18 remains blocked pending human listening, no upload.
- After squash changed branch ancestry, the clean audio checkout was switched to a new branch from `origin/main`; no force/reset/stash. MN19 is prepared:121 canonical scripture segments,11 chunks; source `ac93dddc8189cdda421a6627d9714d3629bf897b088da56fccc2fc4e70cf41f0`, plan `6a81e5ad25371b57`, max chunk length1394. All121 canonical cells and5 summary paragraphs matched production before synthesis. Approved profile unchanged.

### MN19 R2 and local player checkpoint

- MN19 generated11chunks/121canonical segments; final MP3 duration1021.94s,20,439,840bytes; scripture begins160.51s. R2 uploader verified MIME/hash/bytes/range206; key `vi/mn/mn19/2dc6ff7a2edc9a49.mp3`.
- Full localASR11chunks similarity0.9013–0.9848. Index8 had a generic outro insertion in full ASR; valid final25s and12s windows on MN19 chunk8 did not reproduce it. Window check uses the correct artifact and is stored in that artifact folder. This is machine evidence only; review pending and no human listening/voice approval claimed.
- Local reader playback with actual R2 URL: play entered pause, +15s advanced timeline to0:17, scripturejump161s/2:40, pause returned to play at2:44. Marked uploaded-verified; merge and production verification pending.

### MN19 PR merge checkpoint

- PR492 merged2026-10-11T07:29:08Z; exacthead `e2bf7b395413e3727f204ef45f3497cf1648c418`, squash `21554b4ddcdcd3d822fd54b6556ee174dbf4b878`. CIruns38120467196/38120463314both succeeded. Latestmain fetched; squash required a fresh branch. Pages38121521152 pending; MN19 marked merged, notlive untilproduction playback verification. Review pending.

### MN19 production verification

- PR492 squash `21554b4ddcdcd3d822fd54b6556ee174dbf4b878`; Pages workflow38121521152 succeeded. Production page `/sutta/mn/mn19/` showed the R2 player URL `vi/mn/mn19/2dc6ff7a2edc9a49.mp3`. Browser play entered pause, +15s advanced to about0:21, scripture selector moved to2:40 (161s), pause returned to play at2:44. Markedlive. Human full listening and voice comparison remain incomplete; reviewpending.

### MN20 bounded-retry blocker checkpoint

- MN20 generated9chunks/85canonical segments, MP3 approx773.0s. Full offlineASR flagged indexes4/7 with long differences; one bounded retry each preserves originals and reuses7WAVs. Final fullASR still shows substantial long differences in both dense repetitive chunks (similarity range0.5803–0.9821). This is not proof of TTS error; human listening/content verification required. MN20blocked, reviewpending, noR2upload/player registration.
- Small checkpoint follows frequentPR cadence: zero new successful audio, one blocked UID (MN20). Continue sequentially with MN21; do not count blocked texts as complete.

### MN19 live and MN20 blocked checkpoint

- PR494 registers MN19 metadata; CI is being rerun on the updated checkpoint head. MN19 production player was verified after Pages38121521152: actual R2 play/pause, +15s and scripture jump at2:40 worked. Human review remains pending.
- MN20:9 chunks/85 canonical segments, MP3 about773.0s. One bounded retry each of indexes4/7 preserved originals and reused7 WAVs. Full local ASR still reports long omitted/extra repetitive passages in both chunks; this is not conclusive TTS evidence. MN20 blocked for human listening, no R2 upload/player; review pending.
- MN21 source prepared and exact normalized production text comparison passed for all225 canonical cells and5 summary paragraphs. SourceSHA256 `e77c5b673b56c7317ae836246af0c63929999a6a309454c309e34b3e512cd6da`; plan `1b3d87d338f4562b` has16 chunks, max1394 chars. No TTS started.
- Current checkpoint updates1 live item, records1 blocker and source-preparesMN21; zero newly uploaded files. Tests404/404, validate, Astrocheck, `audio:check` 186/0 and production build passed on this state.

### MN21 bounded-retry QC checkpoint — 2026-10-11

- MN21 source `e77c5b673b56c7317ae836246af0c63929999a6a309454c309e34b3e512cd6da`; 225 canonical scripture segments,16chunks; profile `vi-charon-mn1-v1` unchanged. Production page marks Việt 2026 published.
- Attempt0 full offline ASR covered16/16 chunks. One bounded retry of indexes7/12/14 preserved attempt0, reused13 WAVs. Attempt1 MP3 `bb1c9668144ad40408e75b538345c6029fe9524de503ec3111a77e0fa4243420`,32,393,280bytes,1619.61s; all16 WAVs and67,486 MPEG frames pass structural/hash checks; scripture begins160.19s.
- Index14 retry ASR0.9648/284 tokens recognizes the saw example. Index7 remains0.4289/301 expected vs944 heard,309.84s;25 overlapping windows recognize repeated out-of-plan narrative. Index12 remains0.5431/283 expected vs111 heard,38.92s; three overlapping windows still miss the burning-grass/Ganges example. ASR is not authority; no human listening completed.
- MN21 is `blocked`, reviewpending, no R2 upload, metadata or player. Local attempt0/attempt1 and QC reports remain ignored. Detailed method/timing: `docs/audio-qc-mn21.md`.
- Checkpoint records0 newly successful audio files and1 blocked UID; no MP3/WAV/QC cache enters Git. Two requested QC worktrees were used; workspace credit exhaustion interrupted follow-up, so coordinator completed index0–7 QC locally.

### MN21 blocked-checkpoint merge and production readback

- PR [#498](https://github.com/streamentry/kinh-tang-pali/pull/498) was opened at exact head `f2307df0d76721753cd62de0398ed0947d9aeac3`; push CI run38131548193 and pull-request CI run38131576734 both succeeded. Squash merge `a24ab2e495b0b11425458650f33fc0b47a4348a4` completed2026-10-11T10:36:53Z.
- Pages deployment run38132579399 succeeded for that merge commit. Production `/sutta/mn/mn21/` still shows the published Việt 2026 text; browser readback found0 `<audio>` elements and no player, as expected because MN21 has no R2 registration. Source review is not audio/content approval.

### MN22 upload/local-player checkpoint — batch mn-016

- MN22 source `80bf4214d59c3060b8aa05a0303dde668cc55d0e2614b9759ec79205c8efc67d`; 357 canonical segments,26chunks; profile `vi-charon-mn1-v1` unchanged. Summary precedes scripture. Production marks the source published.
- Two bounded retries, one each for indexes24 (`mn22:44.2–47.3`) and2 (`mn22:1.1–3.6`), preserved attempt0/attempt1 locally and reused other valid WAVs. Final offline ASR covered26/26 chunks, similarity range0.8036–0.9934. Retry24 improved0.3200→0.9408 (304/304 tokens), seven windows preserve expected outcomes; retry2 improved0.8427→0.8908 (283 expected/285 heard), seven windows recognize the repeated response. Some ASR differences remain in Pāli names/repetitive phrases; no full human listening, reviewpending.
- Final MP3 SHA-256 `f062adda04f29ab2d040faec0a5c2e4cba763d4fbbb33b1bc53bee490a3bf606`,49,866,720bytes,2493.27s; scripture starts171.87s. R2 public MIME/hash/bytes/range206 passed; final key `vi/mn/mn22/f062adda04f29ab2.mp3`.
- Browser local preview verified the real final R2 file: play/pause, +15s seek, scripture jump171.87s; readyState4, mediaError null. Registered player metadata, progress `uploaded-verified`, review pending. Production stays unchanged until the batch PR.
- The earlier intermediate R2 key `vi/mn/mn22/7249225bfd3d757e.mp3` remains an unreferenced public object; no delete was requested. The two parallel QC threads ran out of workspace credits; coordinator completed the full local ASR and retained the separate ignored cache/report.
- MN22 is1 newly uploaded-verified file in batch mn-016; blocked MN21 remains uncounted. No MP3/WAV/cache enters Git. Detailed QC: `docs/audio-qc-mn22.md`.

### MN23 upload/local-player checkpoint — batch mn-016

- MN23 source `9c25ae34c6591825dd1b9ad36b1183e3d93460e64c43eaec4c56944dc36bdbba`; 102 canonical scripture segments, summary 1.948 characters, 7 chunks; profile `vi-charon-mn1-v1` unchanged. Production source is published.
- Full offline ASR covered 7/7 chunks with final similarity range 0.9263–0.9643. One bounded retry on index 5 (`mn23:4.16–4.35`) improved 0.8664→0.9562 and 297/297 tokens; the doubt/forked-path explanation and five-hindrances/strainer sequence now appear in order. No human full listening; review pending.
- Final MP3 SHA-256 `6fa53ffdd30fbd0863e94834fc0b8445ddb0f03cd0e93360936ece26bfa7068f`, 12.569.760 bytes, 628,42 s; scripture begins at 149,83 s. R2 MIME/hash/bytes/range 206 passed; final key `vi/mn/mn23/6fa53ffdd30fbd08.mp3`.
- Full `npm run build` passed; 6.146 static pages built and Pagefind indexed 6.137 pages. Local preview played the final R2 source, the “Kinh văn 2:29” selector sought to slider 150 s (rounding from 149,83), and pause worked. Progress is `uploaded-verified`, review pending; production awaits the checkpoint PR and Pages deployment.
- This checkpoint contains 2 newly uploaded-verified files (MN22 and MN23) and 1 blocked UID (MN21, not counted). PR cadence is shortened so each small audio batch reaches production sooner; no MP3/WAV/cache is in Git. Detailed QC: `docs/audio-qc-mn23.md`.

### MN22–MN23 production checkpoint — PR #510

- Checkpoint PR [#510](https://github.com/streamentry/kinh-tang-pali/pull/510) contains two newly uploaded-verified files: MN22 and MN23. Exact head `2ec3517aba5c0c88381f0ae4d48b4cf4de450472`; push CI run `38142440539` and pull-request CI run `38142444009` both succeeded on that head. Local validation, 404 unit tests, Astro check, audio integrity check, and full build also passed.
- Squash merge commit `a5c57c9b2da2d72cf9a7c013c73a381990152251` was read back from remote `main`. Pages run [#655](https://github.com/streamentry/kinh-tang-pali/actions/runs/38143787220) succeeded for that exact merge commit.
- Production MN22: [reader page](https://streamentry.github.io/kinh-tang-pali/sutta/mn/mn22/) exposes final R2 key `vi/mn/mn22/f062adda04f29ab2.mp3`. Browser playback started, +15s seek advanced to slider 20s, “Kinh văn 2:51” jumped to 171.87s (slider rounded to 172), and pause returned to Play. Duration display 41:33.
- Production MN23: [reader page](https://streamentry.github.io/kinh-tang-pali/sutta/mn/mn23/) exposes final R2 key `vi/mn/mn23/6fa53ffdd30fbd08.mp3`. Browser playback started, +15s seek advanced to slider 17s, “Kinh văn 2:29” jumped to 149.83s (slider rounded to 150), and pause returned to Play. Duration display 10:28.
- Registry now marks MN22/MN23 `live` and keeps both `review_status: pending`; production playback does not replace full human content review. `npm run audio:check` passes for all 186 catalog texts.
- Two public R2 objects exist for MN22 because a superseded intermediate attempt was retained: the player uses only the final hash-key. No media/cache was added to Git. Next audio UID remains MN24; batch mn-017 starts from merge SHA above.

### MN24 source preparation and first provider stall — batch mn-017

- Started from latest merged `main` at `a5c57c9b2da2d72cf9a7c013c73a381990152251`. MN1 baseline source/profile hashes matched their pins; public R2 returned HTTP 200, `audio/mpeg`, 34,696,800 bytes, and the exact pinned SHA-256. MN1 was not regenerated.
- MN24 (`Kinh Trạm Xe`) source `ebf39859bc3d4d7269589e95dabfe15eac6d557ef010d637b3697840c8b39014`; summary 2,253 characters, 137 scripture segments, 12 planned chunks (2 summary, 10 scripture), maximum 1,394 characters. Profile remains `vi-charon-mn1-v1`.
- The checkout Python initially lacked `lameenc`, so it failed before sending a request or writing a WAV. Resumed with the documented `uv run --with lameenc`; chunks 0–2 are valid cached WAVs. Chunk index 3 then stalled in `socket.connect` for more than 7 minutes; the connection remained in `CLOSE_WAIT`. The process was interrupted after confirming it had no child process; no WAV/tmp for index 3, no complete MP3, and no R2 upload or audio metadata exist. No second TTS request was sent.
- Progress remains `generating` with checkpoint `audio/mn24/c16821460dcece30`; preserve these three valid WAVs. The observed connect stall exposed that the current generator retries provider HTTP errors but lets network connection exceptions escape; add bounded network-error retries and fail closed on quota/auth errors before resuming. MN24 is not counted as generated or uploaded.

### Pipeline retry foundation merge — PR #515

- PR [#515](https://github.com/streamentry/kinh-tang-pali/pull/515) fixes the provider path found during MN24: connection/time-out/incomplete-response failures retry at most five times with backoff; HTTP 429 and auth/other 4xx stop immediately; no provider fallback. Deterministic tests cover network retry, 5xx retry, 429 stop and the five-request limit.
- Final exact head `366d828af7994380e1837419678b8fe3deaa4ee2`; push CI run `38153893816` and pull-request CI run `38153897911` both succeeded. Local gates on the rebased head: validate, 411 tests, Astro check (0 errors), audio check (186 texts/0 errors), and full build/Pagefind passed.
- Squash merge commit `1bc0d3cdad52d1cf93eb1c99fadf8285fde7df0d` was read back from latest remote `main`. The MN24 branch was rebased onto that merge before resuming its cache.

### MN24 R2/local-player checkpoint — batch mn-017

- MN24 source `ebf39859bc3d4d7269589e95dabfe15eac6d557ef010d637b3697840c8b39014`; summary2.253 chars, 137 canonical scripture segments, 12 chunks (2 summary +10 scripture), maximum1.394 chars. Profile `vi-charon-mn1-v1` unchanged; current source still matches the cached plan.
- The default Python lacked `lameenc` and stopped before any TTS request. Resumed with documented `uv run --with lameenc`. One request at chunk index3 stalled in `socket.connect` for more than7 minutes and produced no WAV; after PR #515 merged, the network-retry fix was available. Resumed by verifying/reusing cached chunks0–2 and synthesizing chunks3–11 sequentially; all12 WAV hashes, frames and formats pass. No other TTS process ran.
- MP3 SHA-256 `d0593754aa09776b7769b66f16bf3a7eeb6da0ddd03ba809a0d0563da5104b71`, 21.022.080bytes, 43.796 MPEG frames, 1.051,104s by MP3 frame count; metadata duration1.051,05s; scripture begins153,71s. R2 object `vi/mn/mn24/d0593754aa09776b.mp3` passed full public MIME/hash/bytes readback and range206.
- Local player preview loaded that exact R2 URL; play, +15s seek, “Kinh văn 2:33” jump to153,71s and pause worked. Progress is `uploaded-verified`, reviewpending; production awaits the MN24 PR and Pages deployment.
- No full ASR or human listening is claimed. The transcription skill key was absent locally; an async request asked the editor to configure it without sharing the key in chat. Keep `review_status: pending` regardless.
- MN24 is the first sutta in this per-article PR cadence. The upcoming PR will contain only MN24 metadata/progress/QC and the live evidence from #515; no MP3/WAV/cache is staged.

### MN25 generated checkpoint — R2 authorization pending in batch mn-017

- MN25 (`Kinh Nơi Gieo Mồi`) source `d334fad2cd6549242c27575220519f158ca32d4c438ec4d8ad8621752e29f242`; summary2.171 chars,197 canonical scripture segments,18 chunks (2 summary +16 scripture), maximum1.396 chars. Approved profile `vi-charon-mn1-v1` unchanged.
- All18 WAVs pass checkpoint/text hash, sample-format, frame-count and completeness checks. Final MP3 SHA-256 `c719587d60efaf40e49da764b70de3a482e1ef6b31b6b93c2752da2aab131267`,33.521.760bytes, duration1.676,088s by MPEG frame count, scripture starts154,91s. No ASR or human full listening; reviewpending.
- The R2 uploader returned HTTP401 while fetching the pinned bucket, before any object PUT. It did not write `content/audio/mn25.json`, URL or R2 success fields; progress remains `generated` with the failure recorded. The complete MP3 and all WAVs remain in ignored local cache. A Wrangler login refresh is currently waiting for Cloudflare browser authorization; no token or authorization URL has been exposed.
- Current three-sutta group: MN24 `uploaded-verified` (included in open PR #529), MN25 `generated` but not uploaded, MN26 `not-started`. Do not start MN26 until MN25 upload and player verification complete. Do not merge PR #529 until three suttas have completed upload/player verification.

### 2026-10-12 — Editor workflow change

- Editor explicitly removed transcription/ASR from the workflow and will listen manually on the live website. Continue source/profile, WAV/MP3 integrity, R2 verification and player checks; keep review pending. No speech-content approval is inferred.
- Release cadence remains three successfully uploaded suttas per PR/merge; current batch is MN24–MN26 in PR #529. Historical QC evidence and existing known flags remain recorded.

### MN25 R2/player checkpoint — batch mn-017

- User renewed Wrangler login; upload succeeded using the same generated MP3. Public SHA/bytes/range verified. Prior auth error cleared from current entry; historical failure retained above.
- Browser verified play, +15s, scripture jump154.91s, pause, duration1676.088s, readyState4/no error. Status uploaded-verified; manual review pending, ASR skipped by editor.
- MN24 and MN25 are two successful files in the three-file batch. MN26 source preparation passed:27 chunks/363 scripture segments.

### Previously held ASR artifacts — release handling

- Following the editor instruction to upload/publish for manual website listening, prior ASR flags are listening-review information rather than a publication gate. Before registering each held artifact, recheck current canonical source/profile, WAV/MP3 integrity and R2/player. Preserve all historical QC flags; never infer content approval. Source/profile drift and corrupt/incomplete artifacts still block release.
- Finish active MN26 and deliver MN24–MN26 first, then revisit earlier held MN artifacts in numeric order without duplicate TTS.

- Read-only audit found all twelve held artifacts: MN2/4/5/6 in `/Volumes/SSD/symlinks/james-home/codex/worktrees/mn1-audio-profile/kinh-tang-pali/audio/`, MN11 in `/private/tmp/kinh-tang-pali-audio-live/audio/`, MN13/14/15/17/18/20/21 in the active audio worktree. Every source hash matches current canonical source, profile metadata matches the approved pin, every planned WAV matches its checkpoint, and each MP3 hash matches its manifest. No regeneration or ASR request was made. Upload/player/release checks remain to be performed individually after the active batch.

### MN26 R2/player checkpoint — batch mn-017 ready for release

- Sequential synthesis completed27/27chunks without provider errors. Source6065eec995b2395aad4488ef334d6fe5f983b524c48235b786a4638ec52ed25a; MP3 9c1d5f8627988cffe65326750a479cdbcd9aa3c3aa1a4026fc979833d9b86618,53,260,800bytes,2663.04seconds.
- Source/plan reconstruction,27 WAV checkpoint checks,MP3 frame/hash/duration and R2 public hash/bytes/range pass. Local browser play,+15s,scripture174.39s,pause pass; readyState4/no media error. ASR skipped by editor; manual reviewpending.
- MN24–MN26 now provide three uploaded-verified suttas, total5390.232seconds (about89m50s). Stop new synthesis for PR #529 delivery.
- Local tests rerun after TTS released its lock:411/411pass. Earlier CLI-override test failure came from the active global TTS lock; no test or gate was weakened.

### Batch mn-017 merged — PR #529

- MN24–MN26: three newly uploaded-verified suttas, review pending, ASR skipped by editor. Exact head `a318406665ef65e70e94147f2800ecbfd60c98f7`; push CI38193237780 and PR CI38193240034 both completed success. Local validate/tests411/check/audio-check/build passed.
- Squash merge `8fe38ddfa6864e44f40f716f7e0e1286bd79049d` from PR https://github.com/streamentry/kinh-tang-pali/pull/529; fetched remote main and verified merge ancestry. Metadata for all three is on main.
- Pages workflow38194672655 was pending when checked; do not infer production-live from merge. Main CI38194672616 is separate. New isolated worktree branch `codex/audio-mn-batch-018` starts at the merged main.

### Batch mn-017 production verified

- Pages38194672655 at merge commit8fe38ddfa6864e44f40f716f7e0e1286bd79049d: build114634683640 and deploy114637130525 both completed success.
- Production MN24/MN25/MN26 each returnedHTTP200 and an audio element referencing the exact final R2 object in metadata. Browser representative MN26 played the real R2 file, +15s seek, scripture jump174.39s and pause; duration2663.04s,readyState4,media errornull. Review remainspending; no full listening approval.
- Marked all three live. Continue previously held artifacts in numeric order under the editor manual-listening workflow.

### Batch mn-018 — MN2 held artifact released for manual review

- Reused existing final MP3 `d4b228a02455b58b99a8e4b560ca28588b6fc2333a488db513fdbb46b1cf4689`,21,573,600bytes. No TTS/ASR request. Current source/profile/WAV/MP3 integrity already audited; R2 public hash/bytes/range reverified.
- First upload check stoppedHTTP401 before PUT because OAuth expired. Wrangler R2 bucket info refreshed the same OAuth session successfully; retry upload verified without user login or credentials in logs.
- Local browser play,+15s,scripture selector,pause pass; readyState4/media errornull. One repaired UID in batch. Historical ASR flag moved to manual_review_flags, not discarded; reviewpending.

### Batch mn-018 — MN4 registered for manual listening

- Reused final cached MP3 `0c0fc4cfa8f26e85c1a6c31345e435e4850b3076cb974fb82b76bd6659da03a4`,29573760bytes; no TTS/ASR. Source/profile/WAV/MP3 checks and R2 hash/bytes/range verified.
- Local browser play,+15s,scripture jump161.26999999999998s,pause pass; readyState4,no media error. Historical flags preserved in manual_review_flags/QC doc; reviewpending. Two repaired UIDs in batch.

### Batch mn-018 — MN5 registered; three repaired UIDs ready

- Reused final cached MP3 `fdd25b26457f6630a5babe01dfeeda069b66afbc288f7eeaa2b0b3d22470297c`,30017280bytes; no TTS/ASR. Source/profile/WAV/MP3 and R2 hash/bytes/range verified.
- Local browser play,+15s,scripture jump158.23s,pause pass; readyState4,no media error. Historical flags retained; reviewpending.
- Batch MN2/MN4/MN5 contains three repaired UIDs, total4058.232seconds (67m38s). MN2 re-registers the same public artifact; MN4 and MN5 gain player metadata. Stop at this three-file release gate for checks, PR/merge and live verification.

### Batch mn-018 merged — PR #537

- Three repaired UIDs MN2/MN4/MN5; exact headfa576a3ed127a9d9bcc2d9333e9100b23ba45bb8. Push CI38196566260 and PR CI38196625440 both completed success. Local validate,411tests,Astro check,audio-check and full build passed.
- Squash mergea1ae2cbd0bc1ad330e736a1ccac8faec2d016ebb via https://github.com/streamentry/kinh-tang-pali/pull/537; fetched main and verified ancestry. All player metadata on main. Historical ASR flags retained; manual reviewpending.
- Pages38203678327 at that merge commit is in progress; no new live claim. Branchcodex/audio-mn-batch-019 starts from merged remote main for durable follow-up evidence. Next held artifacts in numeric order:MN6/MN11/MN13, after current deployment verification.

### Batch mn-019 read-only preparation during previous deploy

- Rechecked current canonical source, approved profile metadata, every cached WAV checkpoint and final MP3 hash/bytes for MN6(8chunks,939.312s),MN11(11chunks,990.408s),MN13(15chunks,1382.208s). All passed; no TTS/ASR request or upload during the deployment gate. Historical QC flags remain pending manual listening.

### Batch mn-018 production verified

- Pages38203678327 at mergea1ae2cbd0bc1ad330e736a1ccac8faec2d016ebb: build114662350412/deploy114665216101 both success. MN2/MN4/MN5 HTTP200 with exact final R2 player URLs.
- Representative browser MN5 played, +15s seek, scripture158.23s and pause; duration1500.864s,readyState4,no media error. All three marked live; historical QC flags and reviewpending unchanged. No full content listening claimed.

### Batch mn-019 MN6 uploaded/player verified

- Reused cached8chunk MP3 48b016935a0fae6aa438a68c0914bcccd9089968c68b7e98790b23cb6245c197; no TTS/ASR. R2 hash/bytes/range and local play,+15s,scripture,pause pass; readyState4/no error. Historical QC flags retained in manual_review_flags; reviewpending. One successful repaired UID in batch.

### Batch mn-019 MN11 uploaded/player verified

- Reused cached11chunk MP3 a24acf924e1a30e7b8e759930f7a3e23656ac626c995b4da07c437f1dd26b59f; no TTS/ASR. R2 hash/bytes/range and local play,+15s,scripture,pause pass; readyState4/no error. Historical QC flags retained in manual_review_flags; reviewpending. Two successful repaired UIDs in batch.

### Batch mn-019 MN13 uploaded/player verified — ready for release

- Reused cached15chunk MP3 823576f930661e36dca7ef5a8309d65dfbfb55f6f00ed21f843b5648ce4b1b7e; no TTS/ASR. R2 hash/bytes/range and local play,+15s,scripture,pause pass; readyState4/no error. Historical flags retained; reviewpending.
- MN6/MN11/MN13:three repaired UIDs,total3311.928seconds(55m12s). Stop new uploads at this release gate; run required local checks,PR/CI,merge and deployment verification.

### Batch mn-019 merged — PR #544

- Three repaired UIDs MN6/MN11/MN13; exact head200a0c85c5c55966391ea7fff685e11a52fe89b8. Push CI38205107588 and PR CI38205125482 both completed success. Local validate,411tests,Astro check,audio-check and full build passed.
- Squash mergeb2501b60a5f21d7c8f4fb40c39c8e5b68bada242 via https://github.com/streamentry/kinh-tang-pali/pull/544; fetched remote main and verified ancestry. Metadata on main, historical flags/reviewpending retained. Deployment/live still requires verification.
- Read-only preparation of next held artifacts MN14(13chunks,1238.496s),MN15(20chunks,1903.824s),MN17(11chunks,871.800s): current source/profile,every WAV checkpoint and final MP3 hash all passed. No upload/TTS/ASR during previous release gate. Next branchcodex/audio-mn-batch-020 starts from merged main.

### Remaining held artifacts — read-only audit while batch mn-019 deploys

- MN18(13chunks,1195.776s),MN20(9chunks,885.984s),MN21(16chunks,1619.664s): current canonical source matches cached manifest; approved profile metadata,every WAV checkpoint and MP3 hash verified. No upload/TTS/ASR. Historical speech-content flags still require manual listening and are not disproved by structural integrity.

### Batch mn-019 production verified

- Pages38206845597 at merge commitb2501b60a5f21d7c8f4fb40c39c8e5b68bada242: build114672098988 and deploy114675398299 succeeded. MN6/MN11/MN13 production pages HTTP200 reference exact final R2 objects.
- Browser representative MN13 played the actual R2 MP3, +15s seek, scripture jump155? Metadata scripture start is exact in content/audio/mn13.json; UI jump showed2:34, then pause. Duration1382.208s,readyState4,media errornull. All three marked live, reviewpending. No full audio-content approval.

### Batch mn-020 ready for PR — MN14/MN15/MN17

- MN14 reused cached MP3, OAuth expired check returned401 before PUT; Wrangler bucket-info refreshed same account OAuth, retry uploaded/verified. MN14 and MN15 and MN17 reused existing artifacts; no TTS/ASR requests.
- All three R2 hashes/bytes/range and local player play,+15s,scripture jump,pause passed, readyState4/no media errors. Historical review flags preserved; reviewpending.
- Three repaired UIDs; estimated total duration4014.960s (~66m55s). MN6/11/13 deployment gate is verified in previous checkpoint.

### Batch mn-020 per-sutta QC evidence

- MN14: existing13chunk artifact; browser play,+15s,scripture jump161.07s,pause; readyState4/no error. Historical flag says chunk6 retry still has possible extra continuation; manual listening pending.
- MN15: existing20chunk artifact; browser play,+15s,scripture jump158.23s,pause; readyState4/no error. Historical flags across chunks2/3/6/13/14/16 remain for listening; no ASR rerun.
- MN17: existing11chunk artifact; browser play,+15s,scripture jump117.47s,pause; readyState4/no error. Historical repeated-reflection flag retained.

### Batch mn-020 merged — PR #545

- MN14/MN15/MN17, exact headc55a5adf681552f251e75afaad5a0325809aa2fd; local validate,411tests,check,audio-check,build passed. Both push/PR CI runs completed success as shown on GitHub Checks.
- Squash merge364f8c92fbf636d930589bd482b78b6b90f28647 via https://github.com/streamentry/kinh-tang-pali/pull/545. Fetched main and confirmed ancestry. Pages deployment/run state pending API quota recovery or GitHub UI inspection; don't mark live until verified.
- Next branch codex/audio-mn-batch-021 starts from merged main. MN14/MN15/MN17 files are live candidates in this branch, not yet production-verified.

### Batch mn-019 evidence clarification

- In the prior MN13 live checkpoint, `scripture jump155?` was an imprecise transcription of the browser display. Exact metadata `scripture_start_seconds` is154.91s; player displayed2:34 and integer slider155s. The pause/media evidence and successful Pages run remain as recorded.

### Batch mn-020 deployment in progress

- PR #545 merged as `364f8c92fbf636d930589bd482b78b6b90f28647`; Pages run #690 for that SHA is currently building. Do not mark MN14/MN15/MN17 live until deployment succeeds and production pages/player are checked.
- Wrangler refreshed the same R2 OAuth account after the MN14 pre-upload401; cached artifacts for MN14/MN15/MN17 subsequently uploaded and publicly verified without regeneration.

### Batch mn-020 production verified — PR #545

- Pages run690 (38209696050) at merge commit364f8c92fbf636d930589bd482b78b6b90f28647: build job114680938133 and deploy job114684309844 succeeded. The uploaded artifact was1.42GB; deploy completed success.
- Production MN14/MN15/MN17 all returned HTTP200 and the exact final R2 URL in metadata. Browser representative MN17 played, +15s, scripture jump117.47s (display1:56), pause; duration871.8s,readyState4,no media error. All three marked live; manual review remains pending.

### Batch mn-021 — MN18/MN20/MN21 artifact release preparation

- MN18/MN20/MN21 existing cached MP3s reused; no TTS/ASR. R2 public hash/bytes/range and local playback,+15s,scripture selector,pause verified for each. Historical flags preserved; review pending.
- MN14/MN15/MN17 Pages run #690 at merge364f8c92 is building; do not mark those entries live until success and production readback.
- MN18/MN20/MN21 comprise three repaired UIDs, total3701.424s (~61m41s).

### MN14/MN15/MN17 production readback — 2026-10-12

- Pages run 690 (`38209696050`) completed successfully for merge commit `364f8c92fbf636d930589bd482b78b6b90f28647`. Canonical production URLs for MN14, MN15, and MN17 each returned the current reader page with one audio element and the exact registered R2 URL; progress is `live` for all three.
- Một lần đọc MN14 ngay sau deploy trả về HTML cũ không có player; lần đọc lại URL chuẩn sau đó có player. Ghi nhận đây là phản hồi trang cũ tạm thời; không coi lần đọc đầu là xác minh live.
- Production playback/seek/scripture-jump/pause was verified on MN17 in this batch. Local MN15 was separately verified at its actual sutta page with playback, +15s, scripture jump at 146.47s, and pause. All three retain `review_status: pending` and historical QC flags.

### Batch mn-021 PR opened — #548

- PR https://github.com/streamentry/kinh-tang-pali/pull/548 uses head `c5566d7e13c443eb2a20cf507aa81347c5d42821`. MN18/MN20/MN21 remain `uploaded-verified`, `review_status: pending`; CI is the final hosted build gate after the local temporary volume ran out of space during prerender.

### Batch mn-021 production verified — PR #548

- Squash merge `32be8aec742c00c58aa44414dad91978f394ece7`; Pages run #691 (`38214637587`) succeeded. Production MN18/MN20/MN21 canonical pages each returned HTTP 200, displayed one player in `Chờ nghe duyệt`, and loaded the exact registered R2 URL; all are now `live`, with `review_status: pending`.
- Production MN20 playback test passed: play, +15s, jump to scripture at 121.79s (observed 121.921s), pause; duration 885.984s, readyState 4, no media error.
- Next sequential source-ready items are MN27/MN28/MN29. No TTS started before the previous deployment gate completed.

### Batch mn-022 — MN27/MN28/MN29 uploaded-verified, ready for PR

- MN27: 15 chunks, 1,407.45s, MP3 SHA-256 `d9463d984747e09aac09c760369ee48d7b6e86a27bb1cd5ad12d69b829f132a0`, 28,150,080 bytes; scripture starts 164.91s. R2 object and public range verified; local player play/+15s/scripture/pause pass.
- MN28: 13 chunks, 1,340.32s, MP3 SHA-256 `e4668a2ad8c5d7ba871205855bcf34ac266198857b21feb0c337746addcb0b6b`, 26,807,520 bytes; scripture starts 161.15s. Resumed from four valid WAV checkpoints without regenerating them. R2 object and public range verified; local player play/+15s/scripture/pause pass.
- MN29: 14 chunks, 1,334.67s, MP3 SHA-256 `0477c46da3fee6ce910650d9e5000d8a6359ea4fe2da1c1a8b5d60524b7965e8`, 26,694,720 bytes; scripture starts 151.31s. R2 object and public range verified; local player play/+15s/scripture/pause pass.
- All use profile `vi-charon-mn1-v1`, profile SHA-256 `a384c5852585077c32e1348a6ada5cfc70a69c989ad705b8b5129fef3e1c9a71`; combined duration 4,082.44s (~68m02s). No ASR; review remains pending; no media/cache is committed.

### MN27/MN28/MN29 local release gates

- Rebased batch head on main `8456e034`; `audio:check` reports 186 catalog entries and 0 errors. `npm test`: 410 passed, 1 skipped, 0 failed. `npm run check`: 0 errors and 0 warnings (5 existing hints). Direct validator + quality-history check: validation passed with 2,242 recorded advisory warnings; 5,447 assessment histories and 0 quality errors.
- Full `npm run build` passed, including its nested validate/quality gates: 6,146 static pages built; Pagefind indexed 6,137 pages and 458,052 words. Built MN27/MN28/MN29 HTML each contains its exact R2 URL and audio hash. The temporary build output was placed on SSD because `/private/tmp` was nearly full, then removed after verification.
- A standalone `npm run validate` attempt hits sandbox `tsx` IPC named-pipe `EPERM`; the same repository command completed successfully as part of the full production build.

### Batch mn-022 production verified — PR #550

- PR #550 exact head `b45b41b5624d1f568936f23ed4dfa672b3390d84` passed both push and PR CI. Squash merge `87f8615f86700a51480e48743dfb180fb1ac0d45`; remote main later advanced to `e880d4b31acdbbd9da1f87caed93d101526d97b5`, with the audio merge verified as its ancestor.
- Pages run #691 (`38224047920`) for merge commit `87f8615f86700a51480e48743dfb180fb1ac0d45` succeeded. Production MN27/MN28/MN29 canonical pages each returned HTTP 200, displayed the player in “Chờ nghe duyệt”, and loaded the exact registered R2 URL; all are marked `live`, while listening review stays pending.
- Production MN28 playback passed: play, +15s, scripture jump at 161.15s (observed 161.289s), pause at 167.423s; duration 1,340.376s, readyState 4, no media error.
- No ASR or full content approval is claimed.

### Batch mn-023 MN30 uploaded/player verified

- MN30: 13 chunks, 1,267.88s, MP3 SHA-256 `559bc4bfe2458c645fcdd7bbbdcd636ce481f606530d2e92a6c65b78d988ba81`, 25,358,880 bytes; scripture starts 136.67s. Existing approved profile unchanged. R2 hash/range and local player play/+15s/scripture/pause passed; review pending, no ASR.

### Batch mn-023 MN31 uploaded/player verified

- MN31: 13 chunks, 1,171.36s, MP3 SHA-256 `269e74db3af21fcb7511ca98a27b347c987bd5636ca45515c58dbde979814c87`, 23,428,320 bytes; scripture starts 161.07s. Existing verified chunks reused; R2 public hash/range and local player play/+15s/scripture/pause passed. OAuth 403 was resolved by read-only Wrangler bucket-info refresh on the same account; no login/account change and no TTS regeneration. Review pending; no ASR.

### Batch mn-023 — MN30/MN31/MN32 uploaded-verified, ready for PR

- MN30: 13 chunks, 1,267.88s, MP3 SHA-256 `559bc4bfe2458c645fcdd7bbbdcd636ce481f606530d2e92a6c65b78d988ba81`, 25,358,880 bytes; scripture starts 136.67s. R2 and local player verified.
- MN31: 13 chunks, 1,171.36s, MP3 SHA-256 `269e74db3af21fcb7511ca98a27b347c987bd5636ca45515c58dbde979814c87`, 23,428,320 bytes; scripture starts 161.07s. Existing complete 13-chunk checkpoint reused; after same-account Wrangler auth refresh, R2 and local player verified.
- MN32: 15 chunks, 1,415.26s, MP3 SHA-256 `17016b8750343f8b1fbb1d48bed3a729569a9b86e1a6c834bd69861c3b5d1ce4`, 28,306,560 bytes; scripture starts 139.31s. R2 and local player verified; source is published.
- All use profile `vi-charon-mn1-v1`, SHA-256 `a384c5852585077c32e1348a6ada5cfc70a69c989ad705b8b5129fef3e1c9a71`; combined duration 3,854.50s (~64m14.5s). No ASR/full-content listening; review pending. No media/cache is in Git.

### MN30/MN31/MN32 local release gates

- Rebased on current main `b45674b6113d5c82a85b220be29e620417d85b71`; audio registry check: 186 catalog texts, 0 errors. `npm test`: 410 passed, 1 skipped, 0 failed. Astro check: 0 errors, 0 warnings, 5 existing hints. Validator passed with 2,241 recorded advisory warnings; quality histories checked: 5,447, 0 errors.
- Full `npm run build` passed on this rebased head: 6,146 pages built; Pagefind indexed 6,137 pages and 458,030 words. Built MN30/MN31/MN32 HTML each contains the exact registered R2 URL and audio hash. No MP3/WAV/cache is staged.
