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

### Batch mn-023 production verified — PR #564

- PR #564 exact head `7257bbf57fd931906e5fff340c20021dd5960cb9` passed push and PR CI; squash merge `a7d99b63060e1a0f5833e483b8a5c77e5c3a5e97`. Pages run for that merge `38277125787` completed successfully.
- Production MN30/MN31/MN32 pages each returned HTTP 200, contain the reader audio player, show `Chờ nghe duyệt`, and reference their exact registered R2 URL. Each R2 URL returned 206 for `bytes=0-1023`, `audio/mpeg`, with the expected total object byte count. All three are marked `live`; review remains pending.
- Local player controls (play, +15s, scripture jump, pause) were tested for all three during upload verification. Browser playback interaction on production was not tested because the Playwright wrapper is blocked by the local package-age guard (`npx` requires `--no-install`); the deployed HTML and R2 range endpoints were checked over HTTP instead. No full-content listening/approval is claimed.

### Batch mn-024 MN33 uploaded and player metadata verified

- MN33: 11 chunks, 1,137.94s, MP3 SHA-256 `bb85a9ea3d827e327e495df048b7f1a1328c6c6f85e79a0684950f5633110565`, 22,760,160 bytes; scripture starts 144.95s. R2 full hash/range and local page/player/source URL passed. Bare range request once returned 403; retry with the uploader's configured user-agent returned 206 `audio/mpeg` and expected range. Interactive browser controls were not tested in this environment; manual listening remains pending.

### Batch mn-024 MN34 MP3 uploaded and player metadata checked

- MN34: 6 chunks, 539.87s, MP3 SHA-256 `02ead8ad9788f6839fb24e59a5e2794eee80cb5b9676a1918547005e006fbc62`, 10,798,560 bytes; scripture starts 152.79s. Existing profile unchanged. R2 hash/range and local HTML player/source verified; manual listening remains pending. Browser playback interaction was not run because the local Playwright launcher is blocked by the package-age guard.

### Batch mn-024 — MN33/MN34/MN35 uploaded to R2, player metadata checked

- MN33: 11 chunks, 1,137.94s, MP3 SHA-256 `bb85a9ea3d827e327e495df048b7f1a1328c6c6f85e79a0684950f5633110565`, 22,760,160 bytes; scripture starts 144.95s. R2 object verified; local player HTML and exact URL present, public range verified.
- MN34: 6 chunks, 539.87s, MP3 SHA-256 `02ead8ad9788f6839fb24e59a5e2794eee80cb5b9676a1918547005e006fbc62`, 10,798,560 bytes; scripture starts 152.79s. R2 object verified; local player HTML and exact URL present, public range verified.
- MN35: 17 chunks, 1,624.08s, MP3 SHA-256 `9f4acace62b89f0bfe8310adf685fc0dd5e31c821efd4738c7cb920265c4f159`, 32,482,560 bytes; scripture starts 174.79s. R2 object verified; local player HTML and exact URL present, public range verified.
- Combined duration 3,301.89s (~55m02s). All use approved profile `vi-charon-mn1-v1` and remain review-pending. The Playwright launcher was blocked by the local package-age guard; browser button interaction was not claimed. User will check listening and playback controls on the deployed pages.

### Batch mn-024 local release gates

- Rebased on current main `e1613f80042e3f48ccc3301640ca44d7d4dd753c`; audio registry check reports 186 catalog UIDs, 0 errors. `npm test`: 410 passed, 1 skipped, 0 failed. `npm run check`: 0 errors and 0 warnings (5 existing hints). Direct validator passed with 2,241 advisory coverage warnings; quality-history check covered 5,447 entries with 0 errors.
- Full `npm run build` passed: 6,146 static pages built; Pagefind indexed 6,137 pages and 458,033 words. The generated MN33/MN34/MN35 pages each contain an audio element, pending-review label, and exact registered R2 URL.
- R2 range checks passed with 206 `audio/mpeg` for all three. The local Player HTML is present. Interactive browser play/seek was not run because the available Playwright launcher is blocked by the local package-age guard; no browser-control success is claimed. Manual listening remains the editor's task.

### Batch mn-024 production HTML/R2 verified — PR #567

- PR #567 exact head `b4505d86205c918c0080f20a47b9aa336e655ad6` passed both push and PR CI; squash merge `c529607c00686602282462b858b6f5f2a54f5a4e`. Pages run `38284689919` completed successfully; remote main readback matched the merge SHA.
- Production MN33/MN34/MN35 pages each returned HTTP 200, contained the player, pending-review label, and exact R2 URL. All three R2 Range requests returned 206 `audio/mpeg` with expected total bytes. Full bytes and SHA were verified at upload. Browser play/seek was not tested because local Playwright CLI is blocked by the package-age guard; no interactive playback claim is made. Their progress remains `generated` pending player-interaction verification; `review_status` remains `pending` for manual listening.

### Batch mn-025 MN36 generated/uploaded, player metadata checked

- MN36: 26 chunks, 2,635.79s, MP3 SHA-256 `a480e27eb3bb1011641540ec1136bf2c0e0cad38d8b85b41bab2de12b201c696`, 52,716,960 bytes; scripture starts 159.91s. Completed MP3 reused from valid chunk checkpoints; R2 hash/range and local page/player URL checked. Initial R2 request got HTTP 403; read-only Wrangler bucket-info refreshed the same account session, then upload/readback passed. Progress remains `generated` because interactive browser controls were not tested; manual listening pending.

### Batch mn-025 MN37 generated/uploaded and player metadata checked

- MN37: 10 chunks, 837.87s, MP3 SHA-256 `56143a9d9b41fe0f8f71e67fb1f6c20bcc812b0d48d69a3b0a4ea6ab767721ce`, 16,758,720 bytes; scripture starts 150.95s. R2 hash/range and local player HTML/source verified; interactive controls were not tested in the restricted browser environment. Progress remains `generated`; manual listening is pending.

### Batch mn-025 — MN36/MN37/MN38 MP3s on R2; player metadata verified

- MN36: 26 chunks, 2,635.79s, MP3 SHA-256 `a480e27eb3bb1011641540ec1136bf2c0e0cad38d8b85b41bab2de12b201c696`, 52,716,960 bytes; scripture starts 159.91s.
- MN37: 10 chunks, 837.87s, MP3 SHA-256 `56143a9d9b41fe0f8f71e67fb1f6c20bcc812b0d48d69a3b0a4ea6ab767721ce`, 16,758,720 bytes; scripture starts 150.95s.
- MN38: 26 chunks, 2,544.83s, MP3 SHA-256 `772d3dd7491edab5cf061dec6ff8fc10c811c22a127edb7bb1af529ea8108630`, 50,897,760 bytes; scripture starts 157.47s.
- All use profile `vi-charon-mn1-v1` SHA-256 `a384c5852585077c32e1348a6ada5cfc70a69c989ad705b8b5129fef3e1c9a71`; combined duration 6,018.49s (~100m18s). R2 full hash/range, local player HTML/source URL and MP3 format were verified. Playwright browser interaction is unavailable due the package-age guard; progress stays `generated` until interactive controls can be checked. `review_status` remains pending; no ASR/full-content approval is claimed.

### MN36/MN37/MN38 local release checks

- Rebased batch head on current main `9495a6dd9c173ce05acaec518894823db52524a6`; audio registry check: 186 UIDs, 0 errors. `npm test`: 410 passed, 1 skipped, 0 failed. Astro check: 0 errors, 0 warnings (5 hints). Direct validator passed with 2,241 advisory coverage warnings; 5,447 quality histories checked with 0 errors.
- Full `npm run build` passed: 6,146 static pages built; Pagefind indexed 6,137 pages and 458,024 words. Built MN36/MN37/MN38 HTML contains each player marker, pending-review label, exact R2 URL and audio hash.
- Local HTTP player metadata and R2 206 range were verified for all three; browser button interaction was not tested in this environment. Progress remains `generated` until interactive player verification; review remains pending.

### MN36/MN37/MN38 local release gates

- Rebased batch head on main `9495a6dd9c173ce05acaec518894823db52524a6`; audio registry check: 186 UIDs, 0 errors. `npm test`: 410 passed, 1 skipped, 0 failed. Astro check: 0 errors, 0 warnings (5 hints). Direct validator passed with 2,241 advisory coverage warnings; 5,447 quality histories checked with 0 errors.
- Full `npm run build` passed: 6,146 static pages built; Pagefind indexed 6,137 pages and 458,023 words. Built MN36/MN37/MN38 HTML contains each player marker, pending-review label, exact R2 URL and audio hash.
- Local HTTP player metadata and R2 206 range were verified for all three; browser button interaction was not tested in this environment. Progress remains `generated` until interactive player verification; review remains pending.

### MN36/MN37/MN38 production page and R2 readback — PR #577

- PR #577 exact head `4766b8b7b42668adafdaf5ad793e3be56797b782` passed push and PR CI; squash merge `3e90dc241356e0f96e25aefbb03a25998796914b`. Pages run #721 (`38316860554`) succeeded for that merge.
- Production MN36/MN37/MN38 pages each returned HTTP 200 and include a player, the pending-review label and the exact registered R2 URL. R2 Range requests returned 206 `audio/mpeg` with expected object sizes.
- Interactive browser playback controls could not be exercised because Playwright CLI is blocked by the local package-age guard. Progress remains `generated` rather than claiming `uploaded-verified`; review stays pending for manual listening.

### Batch mn-026 MN39 uploaded and player metadata checked

- MN39: 17 chunks, 1,615.80s, MP3 SHA-256 `15dc7d53b3c7520d81e6745c142b5886a691d2ecf714c25486913a442c2001ed`, 32,316,960 bytes; scripture starts 161.23s. The first uploader attempt got 403; after same-account Wrangler bucket-info refresh, the unchanged object uploaded and passed full hash/range verification. Local player HTML has the exact R2 URL and pending-review label; browser controls were not tested.

### Batch mn-026 MN40 uploaded and player metadata checked

- MN40: 9 chunks, 808.40s, MP3 SHA-256 `ab896770df07b7783973f2e7b6cfdbc18810193826df8b28cc8a796fb6547958`, 16,169,280 bytes; scripture starts 168.99s. R2 hash/range and local player URL metadata verified; interactive controls and full listening remain unchecked.

### Batch mn-026 — MN39/MN40/MN41 MP3s on R2; player metadata checked

- MN39: 17 chunks, 1,615.80s, MP3 SHA-256 `15dc7d53b3c7520d81e6745c142b5886a691d2ecf714c25486913a442c2001ed`, 32,316,960 bytes; scripture starts 161.23s.
- MN40: 9 chunks, 808.40s, MP3 SHA-256 `ab896770df07b7783973f2e7b6cfdbc18810193826df8b28cc8a796fb6547958`, 16,169,280 bytes; scripture starts 168.99s.
- MN41: 12 chunks, 1,095.05s, MP3 SHA-256 `be008a22b2655dac57067678af3c410ea43a59c11a0a062b4d2c39dccd6395cf`, 21,902,400 bytes; scripture starts 164.07s.
- Combined duration 3,519.25s (~58m39s). All use pinned `vi-charon-mn1-v1`. R2 hash/range and local player HTML/URL metadata verified; browser controls not tested due the local package-age guard. Progress stays generated; `review_status` remains pending.

### MN39/MN40/MN41 local release gates

- Rebased on current main `3e90dc241356e0f96e25aefbb03a25998796914b`; audio registry check: 186 UIDs, 0 errors. `npm test`: 410 passed, 1 skipped, 0 failed. Astro check: 0 errors, 0 warnings (5 hints). Direct validator passed with 2,241 advisory coverage warnings; quality-history check covered 5,447 entries with 0 errors.
- Full `npm run build` passed: 6,146 static pages built; Pagefind indexed 6,137 pages and 458,018 words. Built MN39/MN40/MN41 HTML includes each player, pending-review label, exact R2 URL and audio hash.

### MN39/MN40/MN41 local release gates

- Rebased on current main `3e90dc241356e0f96e25aefbb03a25998796914b`; audio registry check: 186 UIDs, 0 errors. `npm test`: 410 passed, 1 skipped, 0 failed. Astro check: 0 errors, 0 warnings (5 hints). Direct validator passed with 2,241 advisory coverage warnings; quality-history check covered 5,447 entries with 0 errors.
- Full `npm run build` passed: 6,146 static pages built; Pagefind indexed 6,137 pages and 458,018 words. Built MN39/MN40/MN41 HTML includes each player, pending-review label, exact R2 URL and audio hash.
- Local HTTP player metadata and R2 206 range were verified for all three; browser button interaction was not tested in this environment. Progress remains `generated` until interactive player verification; review remains pending.

### Production checkpoints — MN39–MN44 (2026-10-13)
- mn-026: PR [#581](https://github.com/streamentry/kinh-tang-pali/pull/581), tested head `21d60457c44076242365037e0fed37353e68ccea`, squash merge `0b9461993ba24b93d73430f4be4bd54e440cdb39`, successful Pages run `38324120514`. Push and pull-request CI passed; PR #581 merge state was re-read from GitHub.
- Production HTTP/player URL and public R2 Range checks refreshed for all three UIDs. Each page returned 200; each MP3 returned 206 audio/mpeg, 1,024 range bytes and the registered object size. Full MP3 hashes were verified by the uploader. Browser controls and human listening remain untested; status stays generated, review pending.
- mn-027: PR [#582](https://github.com/streamentry/kinh-tang-pali/pull/582), tested head `a4a339ec7b6cc7f9290ff5cd24f267e0ce91b2fe`, squash merge `defe9e9e5afba0b4d9ab847d761d7a9e1bce913b`, successful Pages run `38332307045`. Push and pull-request CI passed; PR #582 merge state was re-read from GitHub.
- Production HTTP/player URL and public R2 Range checks refreshed for all three UIDs. Each page returned 200; each MP3 returned 206 audio/mpeg, 1,024 range bytes and the registered object size. Full MP3 hashes were verified by the uploader. Browser controls and human listening remain untested; status stays generated, review pending.

### Collection playlist release — PR #583

- Exact head `e626480802d217b65f448bf0408ee821af541055`; squash merge `be422ec813a11598dbbb71e131933c7a54128d1e`. Push/PR CI passed; Pages run `38336011299` succeeded and post-merge CI `38336011353` completed successfully.
- Production MN directory returned HTTP 200 with one audio element, 44 playlist tracks (MN1–MN44), 44 row Play/Stop controls and 44 native MP3 fallbacks. Previous/next and persisted auto-next markup is present. Browser clicks/responsive visual inspection were not completed: Playwright launcher references a removed Python installation; Safari automation was unavailable. No system setting was enabled.

### Batch mn-028 — MN45/MN46/MN47 uploaded for manual review

- MN45: source SHA-256 `b7e6399a7ca48577825df8bed28490fb7620a5c910dd6eef160767ff594baee0`; MP3 SHA-256 `86c4102b84e7d750de19e413d2169d67b6e96410ec4a77bb7f2a3300076344f3`; 16,031,520 bytes; 801.52s; scripture begins 163.87s; 9 chunks; [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn45/86c4102b84e7d750.mp3).
- MN46: source SHA-256 `59412a430e0b04fb260444580b747ae90b0e055d9af0823f395c6e6f847d7b4c`; MP3 SHA-256 `5b6962a36d1bce5ead0c4172451edd55ab7dd467f84f17b727091ca153c181cc`; 29,234,400 bytes; 1461.66s; scripture begins 170.03s; 15 chunks; [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn46/5b6962a36d1bce5e.mp3).
- MN47: source SHA-256 `38922a266af2fc439d1f471da9f5cbfc9cfbab3b35fb4b942efeac2c18643015`; MP3 SHA-256 `82a97c9d0a1b82cb7970886a147a0d1b6509176b85d642177344415aeaa9c391`; 12,416,160 bytes; 620.74s; scripture begins 137.91s; 7 chunks; [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn47/82a97c9d0a1b82cb.mp3).
- Approved profile vi-charon-mn1-v1 / SHA-256 `a384c5852585077c32e1348a6ada5cfc70a69c989ad705b8b5129fef3e1c9a71` retained. Source/profile and full MP3 structure/hash/bytes plus public hash/range readback passed at upload. No ASR, no claim of listening or browser controls; review pending. MN45 upload authentication was refreshed using read-only same-account Wrangler bucket-info; the existing MP3 was reused.
- Rebased onto main `7358051c1aa57070732dbc16016e6440a8433793`; intervening changes did not touch MN45–MN47. Local validate passed (2,240 existing advisory warnings, 5,447 histories/0 errors); tests 412 passed/1 skipped/0 failed; Astro check 0 errors/0 warnings/5 hints; design and audio registry checks passed. Production build is being rerun with a durable log; its result will be recorded separately.

### Batch mn-028 real-browser checks and playlist corrections

- Browser verification at 2026-10-13T03:26:01.227534+00:00: MN45/MN46/MN47 detail pages each played the exact R2 MP3 with readyState 4, no media error, and paused successfully. Scripture chapter selection followed by +15s seek yielded 179.236s / 185.030s / 152.910s and phase Kinh văn. Progress is uploaded-verified; full listening remains pending.
- Collection player: row Play, Next/Back, row Stop/reset, keyboard seeking and real end-of-track auto-next (MN45 → MN46) verified. Turning auto-next off survived reload; the default-on choice was restored. Rapid navigation revealed a stale play() rejection that falsely displayed an error; obsolete playback requests are now ignored and successful play clears obsolete notices. Paused track label now says Bài đang chọn.
- Responsive browser checks at actual CSS widths 1440, 1024, 390, 320 found no document horizontal overflow. At 320, mobile controls initially overlapped; grid constraints were corrected, then fit and non-overlap confirmed within the 215px control container. Buttons measured 44px minimum height. Desktop/phone screenshots were inspected in the browser tool. No claim of full listening or voice-comparison listening was made.

### Batch mn-028 final local build

- Final npm run build completed with exit 0 after the playlist request guard, paused-state label, and 320px control fix. Validation passed with 2,240 advisory warnings; 5,447 quality histories/0 errors. Astro built 6,146 pages; Pagefind indexed 6,137 pages and 458,019 words. SEO output check passed. Built MN45/MN46/MN47 HTML each has the exact player URL and pending-review label; the collection playlist contains 47 valid tracks.

### Concurrent source update — PR #578

- Main changed pronunciation text by editorial pronoun correction after the historical production checks. MN4/MN7/MN27/MN30/MN41/MN42 old audio is source-stale and remains blocked, with the existing errors preserved. MN45–MN47 source hashes are unchanged. MN41/MN42 earlier production readback is retained as historical evidence only; regeneration is still required. The playlist can therefore contain fewer valid tracks than registered MP3 files.

### Batch mn-028 rebase after pronoun correction

- Rebased onto main `8bfa8ec028bb1cf2777d99eabed90f797634630d`. Progress conflict was merged per UID from current main, retaining all blockers/source hashes/errors; verified MN45–MN47 records and prior merge/deploy history were preserved. Source hashes for MN45–MN47 still match their audio manifests. Current loadAudio composition accepts 41 MN players after adding these three, and rejects all six stale registrations (MN4/MN7/MN27/MN30/MN41/MN42). The earlier 47-track build observation refers to the pre-correction source snapshot.


### Batch mn-029 — MN4, MN7, MN27 generated and uploaded to R2

- MN4: source SHA-256 `e8e648c82b66fd7563e889ca4810e31a2fecd2ac9e46b3c5d5caa93aa4a64984`; MP3 SHA-256 `1c0f02f0562e38c4d14ff5339facda8094cefd0c5fcf222eae3e5c92ecc57739`; 28,557,600 bytes; 1,427.82s; scripture starts 169.55s; 15 chunks (2 summary); [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn4/1c0f02f0562e38c4.mp3).
- MN7: source SHA-256 `258300785ddbbe7819d7a76876a294590668d5d5fa0409e529efbbcd6b6c0408`; MP3 SHA-256 `3c716f6760724c3cb71e3ab8b1e67893bbac92a66549fb75cb7b3d60c6fc46b3`; 19,228,320 bytes; 961.35s; scripture starts 162.35s; 10 chunks (2 summary); [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn7/3c716f6760724c3c.mp3).
- MN27: source SHA-256 `80e611d0515ee9b29c94c8a7a41b0f617406bab1103ff52cf8ba20b19df7b057`; MP3 SHA-256 `92c3c8af94fddc4759ce977bc542ebf185f235707967eaddb50b73e767ef6a97`; 30,713,280 bytes; 1,535.61s; scripture starts 166.63s; 15 chunks (2 summary); [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn27/92c3c8af94fddc47.mp3).
- Combined duration 3,924.78s (~65m25s), 78,499,200 bytes. All use profile `vi-charon-mn1-v1`, SHA-256 `a384c5852585077c32e1348a6ada5cfc70a69c989ad705b8b5129fef3e1c9a71`. Full MP3 hash/bytes and public R2 hash/range verification passed. A temporary Gemini HTTP 503 on MN27 chunk 3 succeeded on the bounded retry. Prior MP3 manifests, progress and QC evidence were retained as historical versions. All three reviews remain `pending`; ASR was skipped per editor decision.
- Full local build passed: 6,146 pages; Pagefind indexed 6,137 pages and 458,013 words. MN4/MN7/MN27 detail HTML each contains the audio player, exact R2 URL and pending-review label. The MN directory contains one playlist and 44 current-source-valid audio tracks.
- Local gates passed: `npm run validate` (2,239 advisory coverage warnings; quality history 5,447 entries, 0 errors), `npm test` (417 passed, 1 skipped, 0 failed), `npm run check` (0 errors, 0 warnings, 5 hints), and `npm run audio:check` (186 UIDs, 0 errors). `git diff --check` passed. MP3/WAV/cache files remain ignored by Git.
- Interactive browser playback was not run: the available Playwright launcher is blocked by the package-age guard. No playback-control verification is claimed; the editor will check playback and listening manually on the deployed website.

### Batch mn-029 main and deployment readback — PR #593

- Exact PR head `8cde38afe9a6459bea276dfadaaad48dce1f02e2`; both hosted PR checks passed. Squash merge: `8c8ef78602265eb86fe3da7b9465d35e9f15532d`. Post-merge main CI run `38359774704` and Pages deployment run `38359774722` both succeeded.
- Production MN4, MN7 and MN27 pages each returned HTTP 200 with the player, exact registered R2 URL and pending-review label. Each public R2 range returned 206 `audio/mpeg`, 1,024 bytes, with total object size matching its manifest.
- Interactive browser Play/seek controls were not exercised in this environment. Progress records preserve merge/deployment evidence while audio state remains `generated`; review remains `pending` until the editor listens and browser playback is confirmed.

### Batch mn-030 — MN30, MN41, MN42, MN48, MN49 generated and uploaded

- MN30: source SHA-256 `5548193e0aea9fe208063e87eeab6ac600a72b77e2460ef1733734440c9d3d0c`; MP3 SHA-256 `1a90fb1cf19e24c5d036e4b533f6e0847ec44b2a0b4c4d2450be40805dc0c6b3`; 23,933,280 bytes; 1,196.60s; scripture starts 126.71s; 13 chunks (2 summary); [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn30/1a90fb1cf19e24c5.mp3).
- MN41: source SHA-256 `c6e8050558da4212cb38ccb320958b1f011c476c82613c292162598416f66bb0`; MP3 SHA-256 `c5d31ca60c6fd66f9ee8f1832036708a1468891babcc2c8a80f4ccdfe1655e4b`; 22,403,040 bytes; 1,120.09s; scripture starts 159.51s; 12 chunks (2 summary); [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn41/c5d31ca60c6fd66f.mp3).
- MN42: source SHA-256 `8f84171ec770fee5a685421ebbb7e918c5794445f8600749f95077ede228f523`; MP3 SHA-256 `0af2339af5fe2786328f0316591f77b70e8ef53e706297175bc7adcae87def22`; 19,200,960 bytes; 959.99s; scripture starts 169.23s; 10 chunks (2 summary); [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn42/0af2339af5fe2786.mp3).
- MN48: source SHA-256 `14addba5a59fa68e6ea20c71953b45e0785e713de345d11206cca463b090da29`; MP3 SHA-256 `49c046da51b6c970f5672a033951e0812f9cbd85c1ca0906d895326e1e92c9c5`; 18,311,040 bytes; 915.50s; scripture starts 153.07s; 11 chunks (2 summary); [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn48/49c046da51b6c970.mp3).
- MN49: source SHA-256 `61933c8dd722458b4899708c32423ae6bc051845ce644937fdfd67c37c61fdb0`; MP3 SHA-256 `cd39c336285cab72171e608de0a6c913860a4a27c847c9aa465b9713d0ea94c7`; 22,784,640 bytes; 1,139.17s; scripture starts 167.11s; 12 chunks (2 summary); [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn49/cd39c336285cab72.mp3).
- Combined duration 5,331.35s (~88m51s), 106,632,960 bytes. All use pinned profile `vi-charon-mn1-v1`, SHA-256 `a384c5852585077c32e1348a6ada5cfc70a69c989ad705b8b5129fef3e1c9a71`. Local frame/hash/byte and public R2 full-content/range checks passed at upload. MN30's first upload attempt returned Cloudflare 403 before object write; the same-account Wrangler session was refreshed and the same MP3 was uploaded without regenerating it. Previous MN30/MN41/MN42 MP3 manifests and progress/QC records remain in historical versions. ASR skipped per editor instruction; all five reviews remain pending.
- Interactive browser controls and full human listening remain unverified; they will be checked manually on the production website. Local build and release gates are recorded in the following batch checkpoint after completion.

### Batch mn-030 local release gates

- After rebasing onto current main `cb798a8e1a71f06d5a1873f27119526421891344`, `npm run validate` passed (2,239 advisory warnings; quality history 5,447 entries / 0 errors), `npm test` passed (417 passed, 1 skipped, 0 failed), `npm run check` passed (0 errors, 0 warnings, 5 hints), `npm run audio:check` passed (186 UIDs / 0 errors), and `git diff --check` passed.
- `npm run build` passed: Astro built 6,146 pages; Pagefind indexed 6,137 pages and 458,015 words. Built MN30/MN41/MN42/MN48/MN49 detail pages each include the player, exact R2 URL and pending-review label. The MN catalog has one playlist and 49 source-valid audio tracks.
- The interactive Play/seek controls were not exercised in a browser here; no such control success or full listening is claimed. Human listening remains pending.

### Batch mn-031 — MN50, MN51, MN52, MN53, MN54 generated and uploaded

- MN50: source SHA-256 `75a23e362ebc8b5e42c6b38c2139009fa62837767f54c036ad38d38748e19fea`; MP3 SHA-256 `73e155fd2c77793a779bd3e0908ae0b26f35dbdec2859d64609132f6420ae71b`; 25,795,680 bytes; 1,289.72s; scripture starts 170.03s; 13 chunks (2 summary); [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn50/73e155fd2c77793a.mp3).
- MN51: source SHA-256 `777443b92a7b21eee2ff83663545b53ce23026f124f75759e1f1958421b49040`; MP3 SHA-256 `1ccdb65acb5f583b917c5188437800ef642e592477a3e1c609e7a43c23a22a25`; 34,277,760 bytes; 1,713.82s; scripture starts 156.47s; 19 chunks (2 summary); [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn51/1ccdb65acb5f583b.mp3).
- MN52: source SHA-256 `3f9fb0460f0da8574f4f36f1a70fb4b5bd3009fc349eb9af971abe10548179ad`; MP3 SHA-256 `ab2ae18cf636597176dbd3435892a8bc6a30a9c7657e3e0fe8ddd3d45c104132`; 20,393,280 bytes; 1,019.61s; scripture starts 163.47s; 8 chunks (2 summary); [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn52/ab2ae18cf6365971.mp3).
- MN53: source SHA-256 `f274be84fd5cce786fb64f195f56fdf0c8051767b355b0e3099da1f65f97e59a`; MP3 SHA-256 `f445f0baaf8a58163c3f459911639406174bec458466fbfc3cbf3bcd3fec0d80`; 19,824,960 bytes; 991.18s; scripture starts 158.79s; 11 chunks (2 summary); [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn53/f445f0baaf8a5816.mp3).
- MN54: source SHA-256 `1b796699f7666c74439069b79bce50bec5b361c88407ce6c20e768d9fa8d1d24`; MP3 SHA-256 `71c48fd91aadaf81e585c4c550251c370805bd8793c9fe6349ade88ec94a8264`; 31,333,440 bytes; 1,566.61s; scripture starts 151.51s; 16 chunks (2 summary); [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn54/71c48fd91aadaf81.mp3).
- Combined duration 6,580.94s (~109m41s), 131,625,120 bytes. All use pinned profile `vi-charon-mn1-v1`, SHA-256 `a384c5852585077c32e1348a6ada5cfc70a69c989ad705b8b5129fef3e1c9a71`. Local MP3 frame/hash/byte checks and public R2 full-content/range verification passed. MN51's first upload returned Cloudflare HTTP 403 before object write; Wrangler refreshed the same account session, and the existing file uploaded successfully without regenerating its 19 valid chunks. ASR skipped per editor decision; all five reviews remain pending.
- Interactive browser Play/seek was not tested. Human listening remains pending for the editor's production review.

### Batch mn-031 local release gates

- Batch `mn-031` completed five uploads: MN50/MN51/MN52/MN53/MN54. Combined duration 6,580.94s (~109m41s), total 131,625,120 bytes. All MP3s were locally frame/hash/byte checked and fully/range verified from public R2. MN51's first uploader attempt returned HTTP 403 before object write; after same-account Wrangler refresh, its already complete 19-chunk MP3 uploaded successfully without regeneration. ASR was skipped per editor decision; human review remains pending.
- On current main `28ddb44e1cb5d585c0fb4dcdc8d07219d37aae87`, `npm run validate` passed (2,248 advisory warnings; 5,447 quality histories / 0 errors), `npm test` passed (417 passed, 1 skipped, 0 failed), `npm run check` passed (0 errors, 0 warnings, 5 hints), `npm run audio:check` passed (186 UIDs / 0 errors), `git diff --check` passed, and `npm run build` passed (6,146 pages; Pagefind indexed 6,137 pages / 458,092 words).
- Built MN50/MN51/MN52/MN53/MN54 detail pages each include the exact R2 player URL and pending-review label. The MN catalog has one playlist and 54 source-valid audio tracks. Interactive browser Play/seek and full human listening were not verified locally; no such success is claimed.

### Batch mn-031 merge and production deployment readback — PR #601

- Exact PR head `600efaf2ec12ea0d83ef52f88c76694e26e26ace`; both hosted PR checks passed. Squash merge commit: `d75b57dc938791db0f4b08d29f630b4e95a4a5ff`. Post-merge main CI run `38391326812` and Pages deployment run `38391326782` both completed successfully.
- Production MN50–MN54 pages each returned HTTP 200, contained their audio player, exact R2 URL, and pending-review label. All five public R2 range requests returned 206 `audio/mpeg`, 1,024 bytes, with total object size matching the manifest. The MN collection returned HTTP 200 with one playlist and 54 current-source-valid audio tracks.
- Interactive browser Play/seek and human listening were not verified; progress stays `generated`, and all five reviews remain `pending` for editor listening on the website.

### Batch mn-032 — MN55–MN59 generated and uploaded to R2

- MN55: source SHA-256 `c06a31acb5ba651978ae0aa5a2beedea8ada76531e621284836b0b903a530391`; MP3 SHA-256 `b3cf8edb7f09b0cb07cfdd58ff639a7b1e4145ded85dc7dbd07ec32948b5fcf2`; 12,759,840 bytes; 637.94s; scripture starts 159.55s; 7 chunks; [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn55/b3cf8edb7f09b0cb.mp3).
- MN56: source SHA-256 `db506e0df313e1cfa67fcd5be8ba3d8a45e5f725afd78f763baf6e77422a7747`; MP3 SHA-256 `c389b87add1ffd6b720353b0ededeebb909f8e9a6d38376de53f640b6ba7ada6`; 42,749,760 bytes; 2,137.43s; scripture starts 165.47s; 24 chunks; [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn56/c389b87add1ffd6b.mp3).
- MN57: source SHA-256 `f98e50ebf2049917f59f48ced8adf808b17f8a555b5d1207a582dddc858480ed`; MP3 SHA-256 `94349b87c67a5a11b59c33ea3f385a4b6291bd4feed1883047753320be97c401`; 18,081,600 bytes; 904.03s; scripture starts 173.79s; 10 chunks; [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn57/94349b87c67a5a11.mp3).
- MN58: source SHA-256 `1670ffa7693f3ed05cc32f44ef63966430ef42414fb1002f7a75e0b9f01f2020`; MP3 SHA-256 `59db6d88cfbb4c759e51a57dc2fd6422dd98bc8fb9e1ce833b35b65f59c52abc`; 13,809,600 bytes; 690.41s; scripture starts 137.51s; 8 chunks; [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn58/59db6d88cfbb4c75.mp3).
- MN59: source SHA-256 `c05e64e77061ceaa137bd3283cadbd74007e547cb79f982bf6c4b7ecabcfa9b2`; MP3 SHA-256 `7b8ea0ea928253f594fb06623bfeadca4f10d7f15a82fcd6c17ce9df9bc809aa`; 13,900,800 bytes; 694.99s; scripture starts 156.27s; 12 chunks; [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn59/7b8ea0ea928253f5.mp3).
- All five use pinned profile `vi-charon-mn1-v1`, SHA-256 `a384c5852585077c32e1348a6ada5cfc70a69c989ad705b8b5129fef3e1c9a71`. MP3 frame/hash/byte checks and R2 public full-object/range verification passed. ASR skipped per editor decision; reviews remain pending. Interactive browser controls and human listening have not been verified.

### Batch mn-032 local release gates

- On current main `d75b57dc938791db0f4b08d29f630b4e95a4a5ff`, `npm run validate` passed (2,258 advisory warnings; 5,447 quality histories / 0 errors), `npm test` passed (417 passed, 1 skipped, 0 failed), `npm run check` passed (0 errors, 0 warnings, 5 hints), `npm run audio:check` passed (186 UIDs / 0 errors), and `git diff --check` passed.
- `npm run build` passed: Astro built 6,146 pages; Pagefind indexed 6,137 pages and 458,092 words. MN55/MN56/MN57/MN58/MN59 detail HTML each contains its player, exact R2 URL, and pending-review label. The MN directory has one playlist and 59 source-valid track buttons.
- Interactive browser playback controls and full listening were not exercised; editor review remains pending.

### Batch mn-032 local release gates

- On current main `e0d4ec68ca3356426ca37a65d73d577fa955bcd5`, `npm run validate` passed (2,258 advisory warnings; 5,447 quality histories / 0 errors), `npm test` passed (417 passed, 1 skipped, 0 failed), `npm run check` passed (0 errors, 0 warnings, 5 hints), `npm run audio:check` passed (186 UIDs / 0 errors), and `git diff --check` passed.
- `npm run build` passed: Astro built 6,146 pages; Pagefind indexed 6,137 pages and 458,181 words. MN55/MN56/MN57/MN58/MN59 detail pages each contain the player, exact R2 URL and pending-review label. The MN catalog contains one playlist with 59 current-source-valid track buttons.
- Interactive browser Play/seek and full human listening remain unverified; editor review remains pending.

### Batch mn-031 merge and production readback — PR #601

- Exact PR head `87510cfedb474b90d7ce89789592e51073c30cbd`; both PR CI workflows passed. Squash merge `b4006084007578a65cf4452b05865556e7365b46` at `2026-10-13T13:12:41Z`. Post-merge main CI `38403147178` and Pages deployment `38403147010` both succeeded.
- Production MN55/MN56/MN57/MN58/MN59 pages each returned HTTP 200 with the player, exact registered R2 URL, and pending-review label. Each public R2 range read returned 206 `audio/mpeg`, 1,024 bytes, and total size matching the manifest. The MN index returned HTTP 200 with one playlist and 59 source-valid track buttons.
- Interactive browser Play/seek and human listening were not tested; progress remains `generated`, with all five reviews `pending` for editor listening on production.

### Batch mn-033 — MN60–MN64 generated and uploaded to R2

- MN60: source SHA-256 `5ea4b7ecadcd01911f3e30d4b6fcd88a1fdcae2021f40a6b99df85e8e08930cd`; MP3 SHA-256 `a62b3855f39598f84c1ba2c15d3539ad0de8f4d45dd112862a7bf3dbd283de95`; 46,761,120 bytes; 2,338.00s; scripture starts 153.19s; 24 chunks; [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn60/a62b3855f39598f8.mp3).
- MN61: source SHA-256 `37527255c7f313f15952768d4be1b92c52b2f37cc88211b9b6ef294ad731c2b4`; MP3 SHA-256 `d28b466b2282400e1348011708edb0be873cdc13bc17b94cd760a34aaac3e632`; 19,725,600 bytes; 986.22s; scripture starts 148.51s; 11 chunks; [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn61/d28b466b2282400e.mp3).
- MN62: source SHA-256 `d907f445bfc58d3e986bb5a7098336645efe5fa10eaba5bed6261549d4ddc30d`; MP3 SHA-256 `ed1cd05633889c715eef454c567eddbeebcbb6aa14a9b434a8f4cc4ffa1ec7dd`; 21,768,000 bytes; 1,088.34s; scripture starts 179.43s; 11 chunks; [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn62/ed1cd05633889c71.mp3).
- MN63: source SHA-256 `310d9555d04e84477aed24c29cb4d690663cda7d92f2463f345d5c0584ce2d58`; MP3 SHA-256 `0cece0c25687074fbe98d240eaae720b493b534439a2b42ad4f952b32fa2dfca`; 22,700,160 bytes; 1,134.95s; scripture starts 150.19s; 14 chunks; [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn63/0cece0c25687074f.mp3).
- MN64: source SHA-256 `0c6c27c2f61dfc68b87ab079ee9a2e1725ed47e092bd347bdc7eaa76706d99e9`; MP3 SHA-256 `dc1b61e3ebc8580068569542d922ab10a24dac21c70a83efdf0504c26b277fb3`; 18,922,080 bytes; 946.04s; scripture starts 169.59s; 13 chunks; [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn64/dc1b61e3ebc85800.mp3).
- All use pinned profile `vi-charon-mn1-v1`, SHA-256 `a384c5852585077c32e1348a6ada5cfc70a69c989ad705b8b5129fef3e1c9a71`. MP3 frame/hash/byte checks and public R2 full-object/range verification passed. ASR skipped per editor decision; all reviews remain pending. Interactive playback controls and human listening remain unverified.

### Batch mn-033 local release gates

- On main `64a99ccd5c1ee4e4324b278f4aa691dc4375d8e7`, `npm run validate` passed (2,258 advisory warnings; quality history 5,447 entries / 0 errors), `npm test` passed (417 passed, 1 skipped, 0 failed), `npm run check` passed (0 errors, 0 warnings, 5 hints), `npm run audio:check` passed (186 UIDs / 0 errors), and `git diff --check` passed.
- `npm run build` passed: Astro built 6,146 pages and Pagefind indexed 6,137 pages. MN60/MN61/MN62/MN63/MN64 detail pages each include the player, exact R2 URL, and pending-review label. The MN index has one playlist with 64 current-source-valid tracks.
- Interactive browser playback and full human listening were not tested. Editor review remains pending.

### Batch mn-033 merge and production readback — PR #608

- Exact PR head `b4e6698ac77f258ead2df320c3ec2f7823dcfbc6`; both PR CI checks passed. Squash merge `6027372c2b98405c43df23db4d309c1c059fce8e` at `2026-10-13T15:37:31Z`. Post-merge main CI `38423670079` and Pages deployment `38423669887` succeeded.
- Production MN60–MN64 pages each returned HTTP 200 with the player, exact R2 URL and pending-review label. Every R2 range request returned 206 `audio/mpeg`, 1,024 bytes, with total object bytes matching metadata. The MN index returned HTTP 200 with one playlist and 64 current-source-valid track buttons.
- Interactive Play/seek and full human listening were not tested; progress remains `generated`, and all five reviews remain `pending` for editor listening on the live website.


### Batch mn-034 — MN65–MN69 generated and uploaded to R2

| UID | Source SHA-256 | MP3 SHA-256 | Bytes | Duration | Scripture starts | Chunks | Audio |
|---|---|---|---:|---:|---:|---:|---|
| MN65 | `f8d5970f017fc1d3ae96e27befd5e1501403f4803b4fde552a92597bd3c52ee6` | `cf84d3659df5504083312dd6533bb8972bdf7e228f356393bda1f44d94d9ce0d` | 35,430,240 | 1771.46 s | 160.79 s | 19 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn65/cf84d3659df55040.mp3) |
| MN66 | `0dee8adccc7fbe2f540e78c4cdda654cc3340fb663c27cff57baaf943c5bb6b7` | `43ffeda803160191f54a6bef5be1fd6f9abd72428894e31dbc1fe137cdb17f64` | 35,096,640 | 1754.77 s | 155.79 s | 16 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn66/43ffeda803160191.mp3) |
| MN67 | `45b10a35d5eaf08cc0ef19a72fdd8ec4f778af3e7b1e5daa619c27e56d612ebd` | `ee1db177308fae37d3f49379aac93ad0860e4d018a840b9f1ab1a7985c86788f` | 20,328,480 | 1016.37 s | 154.15 s | 12 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn67/ee1db177308fae37.mp3) |
| MN68 | `d87b3fa6668e8ab7914e9c530e0af5262b9ed8f81fe852c1a129877cdc2feb1d` | `ea9492650e1483d6e48baef6fbb98b4db0357b05c97093693ceb4faa1537917e` | 25,961,760 | 1298.03 s | 163.19 s | 14 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn68/ea9492650e1483d6.mp3) |
| MN69 | `dc020f299df5e79f31d0be4bcb270fe2f7c0d0813374eaaddd0af881e0341095` | `5a139b50336321e5621d1fabaf3e4951a9d70ab3310d52db2f8998257c6d2b86` | 16,011,360 | 800.52 s | 131.99 s | 9 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn69/5a139b50336321e5.mp3) |

- Total audio duration: 6641.15 seconds. Each file uses the pinned `vi-charon-mn1-v1` profile (Gemini `gemini-3.8-flash-tts`, Charon); source/profile and MP3 frame/hash/byte checks passed. Full-object public readback and HTTP range verification passed for all five uploads; upload metadata and batch progress agree.
- Each narration is summary first, then canonical Vietnamese 2026. ASR was skipped by editor decision; human listening and interactive browser playback remain unverified. All five review states remain `pending`. MP3/WAV/cache files are excluded from Git.


### Batch mn-034 merge and production readback — PR #610

- Exact PR head `fa712c2e73e3a28c92ab9eb7406a79c8d3e66776`; push CI run `38436618228` and pull-request CI run `38436673335` both passed. Squash merge `0976396d80e368d0c76aca8ce3e22e5e0ef98f72` at `2026-10-13T17:33:31Z`.
- Latest main at readback was `40be5723484c1bb4da5f6afa7e304728c752be92`; main CI `38483965555` and Pages deployment `38483965500` succeeded. MN65–MN69 production pages returned HTTP 200 with the player, exact R2 URL and “Chờ nghe duyệt” label. Each public R2 range read returned 206 `audio/mpeg`, 1,024 bytes, and total bytes matching metadata. The MN catalogue contains all five playlist URLs.
- Interactive browser playback and human listening were not tested. Audio review remains `pending` for the editor’s manual listening.


### Batch mn-035 — MN70–MN74 generated and uploaded to R2

| UID | Source SHA-256 | MP3 SHA-256 | Bytes | Duration | Scripture starts | Chunks | Audio |
|---|---|---|---:|---:|---:|---:|---|
| MN70 | `22d7c3b195e1769f7db053b8723d216c24ed32286a2873b2abc6b1d9b892cf12` | `ebbc0854268c5640bb3a4c739764919567377908f6c99937f9e931199161aeb6` | 35,720,160 | 1785.94 s | 169.03 s | 19 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn70/ebbc0854268c5640.mp3) |
| MN71 | `94b279bb9a1248799813baba2a059622990a90fc5d4d64ca9878eb147bddcb5f` | `e261e57b59685831f6c4cf83fbc3edba1575d6668e2537aaad62173eedddd947` | 9,535,200 | 476.71 s | 136.75 s | 6 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn71/e261e57b59685831.mp3) |
| MN72 | `037eb367783f8adcb57b2147b0222a931a951b4f3db5d18ae31b5991efcc47d4` | `8259db912fc2d3fc5546d1dfdffeb326f2b91944b56d4e4d6b1d3532815a7ffc` | 24,168,480 | 1208.36 s | 167.43 s | 13 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn72/8259db912fc2d3fc.mp3) |
| MN73 | `ade9f951523e6ad71a461a718c9ee7fa6af688eac096a72b29424b9a42f0b81b` | `1e516ec537894291a1905ed52532894f9f21f38a914f2a8d3b139feb85b594be` | 25,764,480 | 1288.17 s | 171.67 s | 16 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn73/1e516ec537894291.mp3) |
| MN74 | `c1934525769d92644e052eb3286bf68a1723817b23b9bce1a5427950c26af438` | `5c7f9330a810b22975201c67f030cd8fa6a1d3f5323331526368ca324ebd4cd5` | 16,420,320 | 820.96 s | 173.59 s | 9 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn74/5c7f9330a810b229.mp3) |

- Total audio duration: 5580.14 seconds. All five use the pinned `vi-charon-mn1-v1` profile, summary first, then canonical Vietnamese 2026. MP3 frame/hash/byte checks, public full-object readback, and range verification passed.
- ASR was skipped per editor decision. Interactive browser playback and human listening remain unverified; all five review states remain `pending`. No MP3/WAV/cache files are tracked.


### MN73 regeneration — batch mn-035

- Main commit `5607a541` changed MN73’s canonical Vietnamese source from `ade9f951523e6ad71a461a718c9ee7fa6af688eac096a72b29424b9a42f0b81b` to `79657275831ee8b8e03d909bfbf0efccc5be8771729404d3b82c784f91469bdf` before this batch PR. The previous MP3 `1e516ec537894291a1905ed52532894f9f21f38a914f2a8d3b139feb85b594be` and its progress record remain in `historical_audio_versions`; its immutable R2 object is no longer the current player target.
- Regenerated with the same pinned `vi-charon-mn1-v1` profile: 16 chunks (2 summary), 1383.77s, scripture starts at 174.71s; new MP3 SHA-256 `4998d21d2df5a24a85cedb740bef75d7a174c21649d41229487c1664f1a8fadd`, 27,676,800 bytes. Public R2 object and range verification passed at upload. Review remains `pending`.

- After the MN73 source update and replacement, the current MN70–MN74 batch totals 5675.74 seconds. The earlier table’s MN73 row describes the superseded source version retained in progress history.


### Batch mn-035 merge and production readback — PR #619

- Exact PR head `0ec2c6d3aa4147af0b5969d79bcf0d161c95442a`; PR CI run `38491807798` passed. The push-triggered main CI run `38493720641` was canceled when a higher-priority main push arrived; the latest descendant main commit `f985ba28a383d67a44eda6181adb9ca5b4ff06bd` passed main CI `38497903450` and Pages deployment `38497903434`. Squash merge: `649f4cf5d0aff2e57cc2044d6be749119caf76aa` at `2026-10-14T01:04:34Z`.
- Production MN70–MN74 pages each returned HTTP 200 with the player, exact current R2 URL and “Chờ nghe duyệt” label. Every R2 range request returned 206 `audio/mpeg`, 1,024 bytes, with total object bytes matching current metadata. The MN index contains all five playlist URLs.
- MN73 source changed on main before PR; its superseded MP3/hash remains archived in the progress registry, and the deployed player points to the regenerated source-current object. All reviews remain `pending`; browser playback and human listening were not performed by this release check.


### Batch mn-035 production readback on current main — PR #619

- Main merge commit `649f4cf5d0aff2e57cc2044d6be749119caf76aa` remains in the ancestry of current main `18aa6a91f51c0f37b334ce9b8cf849de256bfff4`. The initial main CI run was cancelled by a higher-priority main push; current descendant main CI `38538682887` and Pages deployment `38538682964` both succeeded.
- On that deployment, MN70–MN74 production pages returned HTTP 200 with player, exact current R2 URL and “Chờ nghe duyệt” label; all five public R2 range reads returned 206 `audio/mpeg`, 1,024 bytes, and total size matching metadata. The MN catalogue contains all five current URLs.
- Current-source total after MN73 replacement: 5675.74 seconds / 113,520,960 bytes. Browser interaction and human listening remain unverified; all reviews remain `pending`.


### Batch mn-036 — MN75–MN79 generated and uploaded to R2

| UID | Source SHA-256 | MP3 SHA-256 | Bytes | Duration | Scripture starts | Chunks | Audio |
|---|---|---|---:|---:|---:|---:|---|
| MN75 | `ef099245b6d25a331d9cb8f31de497b40a5ccd02ad598f54e9b6ba809e2f14eb` | `24fd0cce9f2b4ac54a8e1e0930858b08ef5b912a172fb20c00aee7c1dfbb0b4c` | 39,656,160 | 1982.75 s | 173.39 s | 21 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn75/24fd0cce9f2b4ac5.mp3) |
| MN76 | `a4c011e642f28dca2f4965a8274da710f1109247241bb089905b6ad0bcf92b3e` | `b92ee9ead3c5cee96206fe6e1d4127ee444123147cc9788ae66adfadeec77d87` | 49,247,040 | 2462.30 s | 159.27 s | 27 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn76/b92ee9ead3c5cee9.mp3) |
| MN77 | `ace7ffbf4b970d315a44a1aca88f4334fe22c4d81e71814184083cf44859586a` | `0115d87d1e10061ddf9980577be50da27b87a014f4c7e2ac73f8d2e07eb93f51` | 69,374,400 | 3468.66 s | 156.47 s | 35 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn77/0115d87d1e10061d.mp3) |
| MN78 | `52af857cae9bb171703d6894f7b28997bf298e94577e8604ad747a965aed3f03` | `a25b84f6c11f3c5d09586f384d4d2f857c715d4780e95d672a23f74d69a2be26` | 25,588,320 | 1279.36 s | 166.15 s | 13 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn78/a25b84f6c11f3c5d.mp3) |
| MN79 | `39f35f1f54754c1a085cf0ff1e53a6564c62b40c37251e6d3431708c940a6b34` | `eeb4f13ba72c4235c9f4e888652cfe4bdf1309305beafb9363051dbfe320920c` | 31,051,680 | 1552.52 s | 156.23 s | 17 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn79/eeb4f13ba72c4235.mp3) |

- Current total: 10745.59 seconds / 214,917,600 bytes. All use pinned profile `vi-charon-mn1-v1`, summary first, then canonical Vietnamese 2026. MN73 was regenerated after main PR #625 changed source; old immutable object/hash/progress remain in `historical_audio_versions` and are not the current player target.
- All five local MP3 frame/hash/byte checks and public R2 full-object/range verification passed. ASR was skipped per editor decision; all reviews remain `pending`. No media/cache files are tracked.


### MN77 source correction and replacement — batch mn-036

- Main PR #625 changed MN77 source SHA-256 from `69d7e15802e9d6e2655ddad89f0e8731defecd694273e11f31ada43d9b7af6e8` to `ace7ffbf4b970d315a44a1aca88f4334fe22c4d81e71814184083cf44859586a` after the first batch36 audio was generated. The old MP3 `113b8e09dfc1b7997640ae75ab423df4fcc6c53e3004a35e68036aa30c4401bc` (68,694,240 bytes; 3434.66s) remains in `historical_audio_versions` and its immutable R2 object is no longer the current player target.
- Regenerated MN77 with the unchanged pinned profile: 35 chunks (2 summary), 3468.66s; current MP3 SHA-256 `0115d87d1e10061ddf9980577be50da27b87a014f4c7e2ac73f8d2e07eb93f51`, 69,374,400 bytes, [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn77/0115d87d1e10061d.mp3). Source/profile, MPEG frame/hash/byte, full-object and range checks passed; review remains `pending`.
- Current batch mn-036 total after replacement: 10,745.59 seconds / 214,917,600 bytes.

### Batch mn-035 latest production readback — PR #619

- Read back against latest main `18aa6a91f51c0f37b334ce9b8cf849de256bfff4`, after successful CI `38538682887` and Pages deployment `38538682964`. MN70–MN74 pages returned HTTP 200 with player, exact URL, and “Chờ nghe duyệt”; each R2 range returned 206 `audio/mpeg`, 1,024 bytes, with total bytes matching current metadata. MN index has all five URLs.
- Human listening and interactive browser playback remain unverified; all reviews remain `pending`.

### MN77 source-change correction — batch mn-036

The preceding batch overview line saying “MN73 was regenerated after main PR #625” refers to **MN77**. MN77 source SHA-256 changed from `69d7e15802e9d6e2655ddad89f0e8731defecd694273e11f31ada43d9b7af6e8` to `ace7ffbf4b970d315a44a1aca88f4334fe22c4d81e71814184083cf44859586a`; the current MP3 SHA-256 is `0115d87d1e10061ddf9980577be50da27b87a014f4c7e2ac73f8d2e07eb93f51` (69,374,400 bytes, 3,468.66 s), at [the replacement R2 URL](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn77/0115d87d1e10061d.mp3). The superseded MP3/progress record stays in `historical_audio_versions`; it is not the current player target. Current batch duration and byte totals already include this replacement.


### Batch mn-036 merge and production readback — PR #632

- Exact PR head `fd2623a39dd0902ea12fe832b465915935599efc`; PR push CI `38544889647` and PR-event CI `38544946507` passed. Squash merge `81aebec23b0d6d8b7a8e6eb9495bfb998c94f3b3` at `2026-10-14T10:10:13Z`.
- Main CI `38547675108` and Pages deployment `38547675081` both succeeded on the merge commit. Production MN75–MN79 pages returned HTTP 200 with player, exact current R2 URL, and “Chờ nghe duyệt”. Each R2 range response was 206 `audio/mpeg`, 1,024 bytes, with total object size matching metadata; MN index contained all five current URLs.
- MN77’s old-source audio remains in `historical_audio_versions`; current player URL is the regenerated MP3 for source hash `ace7ff…`. Browser playback/human listening were not tested; reviews remain `pending`.


### Batch mn-037 — MN80–MN84 generated and uploaded to R2

| UID | Source SHA-256 | MP3 SHA-256 | Bytes | Duration | Scripture starts | Chunks | Audio |
|---|---|---|---:|---:|---:|---:|---|
| MN80 | `94be4badb53bcc25b96a31e160f6bcd582394f1ca2a70c5b3c4f407265e90236` | `268d10de92039a016c4a278ea7cfd817c9d6c0e4442100ccbde78a6dcce0220c` | 16,029,120 | 801.40 s | 156.55 s | 9 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn80/268d10de92039a01.mp3) |
| MN81 | `37d1e726044e205ff03d5179a479c272f8722bc335a9cb242540e5a23a6e33e5` | `817e5a56ef86ed6f90b06e65dcd37201ebfd741d4b32965c92f0c0b23b020297` | 29,205,600 | 1460.22 s | 157.23 s | 15 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn81/817e5a56ef86ed6f.mp3) |
| MN82 | `b37c27ccf0ca78d7f6d7abea89edb624ddaa3bc5ec571f35e7cb7e642e7ca40e` | `fe8877dce494dfaa1c057d4218a7aa47471d91e79c8c120a7ebafb9608a8eff8` | 56,432,160 | 2821.56 s | 160.99 s | 29 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn82/fe8877dce494dfaa.mp3) |
| MN83 | `5fb68282ea5dc61b498c3c51f92997e913f1f38c62b3d8eb09de107f53d45293` | `fb10d90636a57e7d796a3e5a6f82d9c80dc9aca76a42b58f31d0ba925decbd86` | 30,153,600 | 1507.61 s | 166.63 s | 16 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn83/fb10d90636a57e7d.mp3) |
| MN84 | `6b4e464e0382306aebf273bfe34b1a584a27fdec42e1af9d19f3465f1534389e` | `5763137bb774b40318757739a69b4cc78f6e037cda68a023f14d7326df909595` | 28,139,520 | 1406.92 s | 159.95 s | 13 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn84/5763137bb774b403.mp3) |

- Total audio duration: 7997.71 seconds / 159,960,000 bytes. All five use the pinned `vi-charon-mn1-v1` profile, summary first, then canonical Vietnamese 2026. Source/profile pins, transcript order/content, chunk WAVs, MP3 frames/hash/bytes, and public R2 full-object/range readback passed. ASR was skipped per editor decision; browser playback and human listening remain unverified and all reviews remain `pending`. MP3/WAV/cache files are excluded from Git.


### Batch mn-037 merge and production readback — PR #633

- Exact PR head `6475c82e6a557efa9b3f08ac5d94279492893b74`; push CI `38575875711` and PR CI `38575912559` passed. Squash merge `c51298713c194cf3e8f74e9bfc4d2dd1288f4b78` at `2026-10-14T14:20:06Z`.
- Main CI `38579588429` and Pages deployment `38579588158` succeeded on the merge commit. Production MN80–MN84 pages each returned HTTP 200 with player, exact current R2 URL, and “Chờ nghe duyệt”; the MN catalogue contains all five current URLs. Each R2 range returned 206 `audio/mpeg`, 1,024 bytes, with total size matching metadata.
- Interactive browser playback and human listening were not tested; all five review states remain `pending` for the editor.


### Batch mn-038 — MN85–MN89 generated and uploaded to R2

| UID | Source SHA-256 | MP3 SHA-256 | Bytes | Duration | Scripture starts | Chunks | Audio |
|---|---|---|---:|---:|---:|---:|---|
| MN85 | `ad87ca97321b770f9f25bb59383bd378cd315139227f6f601111ffb63fc72f21` | `3593276e5192ed1c8376242c9bb724f91c9fd84df91c77983f55f9ad5be28653` | 70,561,920 | 3528.04 s | 158.63 s | 37 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn85/3593276e5192ed1c.mp3) |
| MN86 | `0551f95d35a399507ed6478da134a639d00d115941634ddc69f66a6855b798cb` | `3a912ddf1d89fccc4412b49a73c38f756fa909687d914a06422fc7adbeafbc8f` | 23,564,160 | 1178.16 s | 164.31 s | 13 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn86/3a912ddf1d89fccc.mp3) |
| MN87 | `651c6be942075d9f2632dcf59eab37a7a469a376206263fed671b88ab3cf27b6` | `a23a6de856a6b55df1693427125affb66b48aec661e83c185d4d94c137bba054` | 21,186,240 | 1059.25 s | 159.43 s | 12 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn87/a23a6de856a6b55d.mp3) |
| MN88 | `034956ea6c16cb3a52605294eb0e20ab5c659f01c3c5b5d1123df0cb9fbd6fcb` | `46ae62de5d495d69a8225b45cf3838cd06f42a1ddb0f33fdd394c06e3d2b9e8a` | 16,955,520 | 847.71 s | 157.19 s | 10 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn88/46ae62de5d495d69.mp3) |
| MN89 | `08f5cfcab039d17e6343f9b470cbda9322441fc5112c634a82bcc057e5165fa0` | `24ace6709b3b2667198dc00c77f847b8d96dddf34070ebeb2863e22a5c00126b` | 23,271,360 | 1163.52 s | 172.39 s | 13 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn89/24ace6709b3b2667.mp3) |

- Total audio duration: 7776.68 seconds / 155,539,200 bytes. All five use the pinned `vi-charon-mn1-v1` profile, summary first, then canonical Vietnamese 2026. Source/profile pins, transcript order/content, chunk WAVs, MP3 frames/hash/bytes, and public R2 full-object/range readback passed. ASR was skipped per editor decision; browser playback and human listening remain unverified and all reviews remain `pending`. MP3/WAV/cache files are excluded from Git.


### Batch mn-038 merge and production readback — PR #634

- Exact PR head `7eb5d71dd04f9b80881f716214fa9a8854c93958`; push CI `38592618695` and PR CI `38592690983` passed. Squash merge `c15f00f7c234ab80ecc14c4457b6763694a373a7` at `2026-10-14T16:11:34Z`.
- The first main CI run `38595964632` was canceled by a higher-priority main request; replacement main CI `38596254449` passed. Pages deployment `38595964643` and GitHub deployment `7071056265` succeeded on the merge SHA at `2026-10-14T16:34:44Z`.
- Production MN85–MN89 pages each returned HTTP 200 with player, current R2 URL, and “Chờ nghe duyệt”. Each R2 range returned 206 `audio/mpeg`, 1,024 bytes, with total object size matching metadata; the MN catalogue includes all five URLs.
- Technical browser test: each player loaded its audio, playback advanced, the 15-second seek advanced the timeline, and pause worked with no media error. MN85’s “Kinh văn” control jumped to 159.90 s. The previous/next links navigated MN89 → MN88 → MN89. This is a technical smoke test only; no full human listening was done. Reviews remain `pending` for the editor.


### Batch mn-039 — MN90–MN94 generated, uploaded, and player-smoke-tested

| UID | Source SHA-256 | MP3 SHA-256 | Bytes | Duration | Scripture starts | Chunks | Audio |
|---|---|---|---:|---:|---:|---:|---|
| MN90 | `f869b0b3d6c814840b4e6510eb39dedb3f170f75465b5f36f79243131a7e52d1` | `84eef8a62b13e11c8bc12eabbc61e8b89c76cdd3d53d57a8288974d5c4f9b3cf` | 22,446,720 | 1122.28 s | 159.39 s | 13 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn90/84eef8a62b13e11c.mp3) |
| MN91 | `d48bbe2bea46a1773c884b1ce6f3f97d43eba26f2e29a20425a78ac1e712a117` | `cbc1c219ae8128726f91d2d40d808cdac76ceafdad8b163f00e65a57e5aafa41` | 38,534,400 | 1926.65 s | 174.35 s | 20 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn91/cbc1c219ae812872.mp3) |
| MN92 | `8a6d6948e368a17903966bd6651e021709214bf2794346d547120f6019640b5f` | `9351e9c2615382e0d10613d6dc71ff6437c51645cb35bb08dc82ea70425568ec` | 22,375,200 | 1118.69 s | 169.79 s | 12 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn92/9351e9c2615382e0.mp3) |
| MN93 | `c5f7e590c129808b70715550acb64f8e5c8b51edb1dfe0f5650720bc9f6ffd79` | `9ad95fb83d57b6fcff2cd904f10b4ecca12d067b6d5d53b5c0395c1fbbf837a6` | 31,797,600 | 1589.82 s | 168.47 s | 18 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn93/9ad95fb83d57b6fc.mp3) |
| MN94 | `cd0bc1a01da660cafcb66be18d876158f84cc60357de4fdb00ad75695ce233d3` | `99fe12048f07cd353e68c50cb2741834e9d10c178cabed273cb08bd64649731f` | 38,316,000 | 1915.73 s | 177.75 s | 20 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn94/99fe12048f07cd35.mp3) |

- Total audio duration: 7673.17 seconds / 153,469,920 bytes. All five use the pinned `vi-charon-mn1-v1` profile, summary first, then canonical Vietnamese 2026. Source/profile pins, transcript accounting, chunk WAVs, MP3 frame/hash/bytes, and public R2 full-object/range readback passed. Production player smoke tests for all five confirmed audio load, playback progress, +15 s seek, and pause; MN85 jumped to the scripture boundary. Navigation MN89 → MN88 → MN89 worked.
- These were technical player checks, not content review. ASR was skipped per editor decision. `review_status` remains `pending` for the editor's full manual listening. MP3/WAV/cache files are excluded from Git.


### Erratum — MN90–MN94 player-interaction evidence in batch mn-039

The preceding batch mn-039 heading/body and original merged PR #635 description said browser Play/seek/Pause was tested for each of MN90–MN94. That statement was unsupported and is withdrawn. The browser interaction evidence in this work belongs to MN85–MN89; MN90–MN94 did not receive an interactive browser playback test. Their MP3/source/profile checks, successful R2 upload and public readback, production Pages workflow, and local built-player HTML evidence remain valid. The progress state for MN90–MN94 is corrected to `generated`; `playback_verified_at` and `playback_observation` are cleared, while upload metadata and `review_status: pending` remain. The merged PR #635 description was edited to carry this correction. Follow-up corrective PR records this erratum and registry change.

Fresh production readback on `2026-10-15T00:53:42Z` confirms MN90–MN94 pages return HTTP 200 with each current player URL and “Chờ nghe duyệt”; each public R2 range returns 206 `audio/mpeg`, 1,024 bytes, and the object size matches metadata. This confirms deployment markup and seek-capable byte ranges, not an interactive browser playback test.


### Playback-evidence correction — MN90–MN94 — PR #638

- Corrective commit `308ce738ba7c9ffe78980dc10c7aa2caed5b7812` merged at `2026-10-15T01:35:25Z`; the PR head was `26a2bed7f8ace422986cbd287d495c9506ad4b76`. The registry now accurately keeps MN90–MN94 at `generated`, with browser playback fields cleared. Their source/profile, R2 upload/public range, and production page HTTP/HTML checks remain verified; interactive playback and full listening were not tested. `review_status` remains `pending`.

### Batch mn-040 — MN95–MN99 generated and uploaded to R2

| UID | Source SHA-256 | MP3 SHA-256 | Bytes | Duration | Scripture starts | Chunks | Audio |
|---|---|---|---:|---:|---:|---:|---|
| MN95 | `5c44718864569172a8cde016864b12ee80d04015e467a87fe3ac645f2b98ef5e` | `099a11e85a0b75e453da468a4f7a80d1cf989584e5258bd1042a5c677a66fb0a` | 41,938,560 | 2096.87 s | 179.19 s | 22 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn95/099a11e85a0b75e4.mp3) |
| MN96 | `9eb8994a8345f7e610eb4e071409ae0ecaec6e5bcd5b40680d329a34c4517690` | `d5dd31da3b3239a58f56baa79e40edb304ddeb753d3c2843cbe8fe72073ff5a9` | 24,341,760 | 1217.04 s | 153.47 s | 15 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn96/d5dd31da3b3239a5.mp3) |
| MN97 | `b7a7c8931ccb8db62c18a3be2a4ff600f38fd019bbd0fb694f27ca5a2cf47475` | `8df8f36eb0c84ec9d131bda6b14d880d10e2771ff1d0669d9f04c1ea2ad50507` | 37,007,520 | 1850.32 s | 175.63 s | 21 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn97/8df8f36eb0c84ec9.mp3) |
| MN98 | `bc7bb633d4418bbc0039645486988427ab62c0c2e64dbf4814e82524e9808e42` | `b1fd24507841ffcb23f3501b77cc2c4a4d1279154f9a3d947e967b5a5066afb1` | 20,416,800 | 1020.78 s | 156.31 s | 11 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn98/b1fd24507841ffcb.mp3) |
| MN99 | `d096478bfa1988630e15b5d3730db8a342a292813ff340fc4255cc27c7692f5a` | `ffe8b6f13e2136da56026842bfd5f7b3b6fbdc8961287d6e6c8c8d4403a46b4c` | 35,522,400 | 1776.05 s | 153.51 s | 20 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn99/ffe8b6f13e2136da.mp3) |

- Total audio duration: 7961.06 seconds / 159,227,040 bytes. All five use profile `vi-charon-mn1-v1` (`a384c5852585077c32e1348a6ada5cfc70a69c989ad705b8b5129fef3e1c9a71`), summary first, then canonical Vietnamese 2026. Source/profile hashes, chunk accounting, MP3 frame/hash/byte checks, and public R2 object/range verification passed. ASR was skipped per editor decision. Production browser playback and full human listening remain unverified; all reviews remain `pending`. MP3/WAV/cache files are excluded from Git.

### Batch mn-040 merge and production readback — PR #642

- Exact PR head `34c4ee0efa8bd316cdc451d1d8cb48e471263c80`; push CI `38687826112` and PR CI `38687832496` passed. Squash merge `e5e0a1b80c976d54b61c97ee546ab4c2c864fcf8` at `2026-10-15T05:59:52Z`.
- Pages deployment `38689833999` succeeded on the merge commit. The direct main CI run `38689833952` was canceled by a higher-priority main request; no success is claimed for that run.
- Production readback at `2026-10-15T07:29:08Z`: MN95–MN99 pages each returned HTTP 200 with one `<sutta-audio>` element, its native `<audio src>` exactly matched current metadata, and the “Chờ nghe duyệt” label remained visible. Each R2 range returned 206 `audio/mpeg`, 1,024 bytes, with total object size matching metadata.
- This confirms deployed player markup and range support, not interactive Play/seek. Browser automation was blocked locally by `pkg-age-guard` because the Playwright wrapper invokes `npx --yes`; no interactive browser playback or full human listening is claimed. ASR was skipped. All five remain `generated` with `review_status: pending` for editor listening.
- Direct main CI and Pages runs on merge `38720837935` and `38720837805` were canceled by higher-priority pushes. A later Pages deployment `38721717190` succeeded on descendant commit `dbe86623e558035c15797fd05a6c6479c0410766`, which contains the merge; its main CI run `38721717405` was canceled.
- Production readback at `2026-10-15T11:11:09Z`: all five pages returned HTTP 200 with one `<sutta-audio>` and exact current native audio URL, plus “Chờ nghe duyệt”. Every public R2 range returned 206 `audio/mpeg`, 1,024 bytes, and total object size matched metadata.

### Batch mn-041 — MN100–MN104 generated and uploaded to R2

| UID | Source SHA-256 | MP3 SHA-256 | Bytes | Duration | Scripture starts | Chunks | Audio |
|---|---|---|---:|---:|---:|---:|---|
| MN100 | `5b0ce6fed7e99e287be2719ef9816dd811348e7ec2a98e6d2d70913ec4bf7557` | `f720feccf914d12cc99a620a4d8799ac478b4ed217106071d7dbfa23d79f6273` | 46,180,800 | 2308.98 s | 153.39 s | 23 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn100/f720feccf914d12c.mp3) |
| MN101 | `e141c3fca4802cfbf0d56ab4443dc07730e3436f6462b8b145d4f9c26b40c8a4` | `45a76cc3da5ff3b7051c76fb3aa6ceb4e476d20ca8cbb45715c616df590604be` | 61,443,360 | 3072.10 s | 156.71 s | 31 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn101/45a76cc3da5ff3b7.mp3) |
| MN102 | `bf4f8a5b92ccdd8e4c94894898d3fca0c1c05b0d9f5abdde7e53cd4553fe381e` | `952f130bd7de7e1239e6f810d66eddde19cf782aee63b95281fb5e08670fa411` | 35,927,520 | 1796.31 s | 164.87 s | 18 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn102/952f130bd7de7e12.mp3) |
| MN103 | `9c31dc38e85121fe512e135f791dd0fff68e000a2d17f617de2fa64c873afc7b` | `180e1bf05d51f730427f3ccd2d534bbb2f11c1d64d3dd324b95f20361317ead3` | 17,273,760 | 863.63 s | 154.51 s | 10 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn103/180e1bf05d51f730.mp3) |
| MN104 | `1aadf4b5af27b7cd7681f5eac59dc9c2b23197aebc59d1e63d7c30dead32a643` | `26329193c2e3b96019ff2b117b6367eef3f2a71da2367364351cdba5a16ebba7` | 27,027,360 | 1351.31 s | 160.71 s | 14 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn104/26329193c2e3b960.mp3) |

- Total audio duration: 9392.33 seconds / 187,852,800 bytes. All five use the pinned `vi-charon-mn1-v1` profile (`a384c5852585077c32e1348a6ada5cfc70a69c989ad705b8b5129fef3e1c9a71`), summary first, then canonical Vietnamese 2026. Source/profile hashes, chunk order, MP3 frames/hash/bytes, and public R2 object/range verification passed. ASR was skipped; no browser interaction or full human listening is claimed. All five remain `generated` and `review_status: pending`. MP3/WAV/cache files are gitignored.

### Batch mn-041 merge and production readback — PR #653

- Exact PR head `c53ebd356308a2e8c10f1987fb8a7d2e0d680afd`; push CI `38700045146` and PR CI `38700067157` passed. Squash merge `0a8be4cd4a1f9401b8732168a61ae75a41993b1e` at `2026-10-15T08:03:31Z`.
- CI and Pages runs started directly on the merge commit (`38702974094`, `38702974116`) were canceled by higher-priority pushes. A later descendant main run `38703466325` passed, and Pages deployment `38703466697` succeeded on `ba70727b5cd6e43fad7fbfd375d5f8d2bc71560f`, which contains the merge.
- Production readback at `2026-10-15T08:59:39Z`: each MN100–MN104 page returned HTTP 200 with exactly one `<sutta-audio>` and matching native `<audio src>`, plus the “Chờ nghe duyệt” label. Each R2 range returned 206 `audio/mpeg`, 1,024 bytes, and its total matched metadata.
- No interactive browser playback or full listening is claimed. ASR was skipped. Each entry remains `generated`; `review_status` remains `pending` for the editor.

### Batch mn-042 — MN105–MN109 generated and uploaded to R2

| UID | Source SHA-256 | MP3 SHA-256 | Bytes | Duration | Scripture starts | Chunks | Audio |
|---|---|---|---:|---:|---:|---:|---|
| MN105 | `afb0dfc9c0b9e1d7668bbb4b3e984a125caeac2e9ab6fd7be706a8d629c446c3` | `21e4de662b3127af21a7253ec52cbd24207f019c667c396825ff6e59fbd5c959` | 29,136,000 | 1456.73 s | 151.95 s | 16 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn105/21e4de662b3127af.mp3) |
| MN106 | `d9fabb170d1156e37bbe18b6f36aa381d7ed9468974970cb568ee0743375d1ce` | `0c0ec4ea235521a50fc00c51bbe26eb4b9fdc32e906bb029c980dff10c727cbc` | 18,984,000 | 949.15 s | 147.11 s | 10 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn106/0c0ec4ea235521a5.mp3) |
| MN107 | `3e0869e95353bb76145dd689574ae723657a818beb5b671e12ded414681e72f0` | `db7661b1075445a7e09e6419db50a748a7a72e1eb213c123a90dd7310d741e0c` | 19,807,200 | 990.29 s | 147.51 s | 12 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn107/db7661b1075445a7.mp3) |
| MN108 | `990ec670e00f8e3afa50a0ad530da4602cb916e7f9448ad1c48c2ee39494838d` | `eebf2bb1888a4e0bed4506404d370d64668fbeb1a2e3d51259b5ff2b73a25122` | 26,645,280 | 1332.21 s | 160.83 s | 16 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn108/eebf2bb1888a4e0b.mp3) |
| MN109 | `4d9790f46596414a354e85c0b786fca8db7faff1fa64cca4d3969698b696c089` | `388c118a3d72a68ab56f2be4a06e8331f37be1e1d5c0666f55f8abee37ab882b` | 18,870,720 | 943.47 s | 169.23 s | 10 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn109/388c118a3d72a68a.mp3) |

- Total audio duration: 5671.85 seconds / 113,443,200 bytes. All five use the pinned `vi-charon-mn1-v1` profile (`a384c5852585077c32e1348a6ada5cfc70a69c989ad705b8b5129fef3e1c9a71`), summary first, then canonical Vietnamese 2026. Source/profile hashes, chunk order, MP3 frames/hash/bytes, and public R2 object/range checks passed. ASR was skipped. No interactive browser playback or full human listening is claimed; all entries remain `generated` with `review_status: pending`. MP3/WAV/cache files are gitignored.

- MN108 resumed from its saved fingerprinted chunk checkpoint after the original terminal handle ended; seven validated chunks were reused and not regenerated.


### Batch mn-042 merge and production readback — PR #663

- Exact PR head `c5ffc0e13608a0dba34bc9dd83f4ded87fb60f29`; push CI `38717535637` and PR CI `38717558769` passed. Squash merge `f8c6deac5dbff4b1369fd0a4fb8bcccaeec480b8` at `2026-10-15T10:31:06Z`.
- Direct CI and Pages runs on the merge SHA (`38720837935`, `38720837805`) were canceled by higher-priority requests. Main CI on descendant `dbe86623e558035c15797fd05a6c6479c0410766` (`38721717405`) was also canceled; Pages deployment `38721717190` succeeded on that descendant, which contains the merge.
- Production readback at `2026-10-15T11:11:09Z`: MN105–MN109 pages each returned HTTP 200 with exactly one player and matching R2 audio URL, plus the “Chờ nghe duyệt” label. Each R2 range returned 206 `audio/mpeg`, 1,024 bytes, and total object size matched metadata.
- No interactive browser playback or full listening is claimed; ASR was skipped. All five remain `generated` and `review_status: pending`.

### Batch mn-043 — MN110–MN114 generated and uploaded to R2

| UID | Source SHA-256 | MP3 SHA-256 | Bytes | Duration | Scripture starts | Chunks | Audio |
|---|---|---|---:|---:|---:|---:|---|
| MN110 | `354ae6de9b5d49cfb3ed92981229e9abdbe9d38fb52b3ece3bdac5f7533c73da` | `c4253185b8205364b0f2d824ffe8359e44d6334ba50076615e0ffeb543456ac0` | 16,025,280 | 801.20 s | 157.35 s | 9 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn110/c4253185b8205364.mp3) |
| MN111 | `f5563acb31a66b5e6cdfafde30a819019665565453306462de084d8bd493ded9` | `99919d00789be58f77c6db08971631ea5ca13ef6fca01e962982fd66158477d3` | 17,823,360 | 891.12 s | 156.63 s | 9 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn111/99919d00789be58f.mp3) |
| MN112 | `7bea01a4146293b54b6ddc57bb488132589fa0876c8b66653dac2c61ae10f904` | `1b7f14df8fcf38ab7f7fee84068418507677702f2ab0fe0dd399160739523a03` | 26,182,560 | 1309.07 s | 162.35 s | 14 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn112/1b7f14df8fcf38ab.mp3) |
| MN113 | `ae5e12797f22184308bb6a4d8b11bf8dc3610894b2c6837a0a927e773e24bb73` | `fb257a0b489d990c5cb17fd85a305bcf11a2cdd21134a7eae41098b0ef818cbb` | 27,408,000 | 1370.34 s | 158.27 s | 15 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn113/fb257a0b489d990c.mp3) |
| MN114 | `c48639eb2fa56233cd45e87462f7a00ad7137012af236a118e65a08e0dc99abc` | `42adf3088c1675fc95d0e8868c6ba43ec98520dcd46f8561397eff60dfe14758` | 46,604,160 | 2330.15 s | 176.07 s | 26 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn114/42adf3088c1675fc.mp3) |

- Total audio duration: 6701.88 seconds / 134,043,360 bytes. All five use pinned profile `vi-charon-mn1-v1` (`a384c5852585077c32e1348a6ada5cfc70a69c989ad705b8b5129fef3e1c9a71`), summary first and canonical Vietnamese 2026 second. Source/profile, chunk ordering, MP3 frame/hash/bytes and public R2 object/range checks passed. ASR was skipped. Interactive browser playback and full listening remain unverified; all five remain `generated` with `review_status: pending`.

### Batch mn-043 merge and production readback — PR #677

- Exact PR head `b70fe9c33654d874255a22964040317083ae4905`; push CI `38736423989` and PR CI `38736464213` passed. Squash merge `dde2d42668c9e9600508b9de29956f78dbc555e2` at `2026-10-15T13:08:33Z`.
- Direct main CI `38740210465` was canceled by a higher-priority push. Direct Pages deployment `38740210581` succeeded on the merge commit. A later descendant Pages deployment `38743308692` also succeeded on `855c20feee4ca1c7fe17fbddbf852626c18fde19`, which contains the merge; descendant main CI `38743309088` was canceled.
- Production readback at `2026-10-15T13:56:54Z`: each MN110–MN114 page returned HTTP 200 with one matching player URL and “Chờ nghe duyệt”; each R2 range returned 206 `audio/mpeg`, 1,024 bytes, with total size equal to metadata.
- This verifies deployed markup and ranged delivery, not interactive playback or content listening. `review_status` remains pending.

### Batch mn-044 — MN115–MN119 generated and uploaded to R2

| UID | Source SHA-256 | MP3 SHA-256 | Bytes | Duration | Scripture starts | Chunks | Audio |
|---|---|---|---:|---:|---:|---:|---|
| MN115 | `e50680e1af30a1b04fce5f8144ddc4a2f78b18f3ffc63f148e9fca6be904ecca` | `e40c2499180db994523ee433f13ed613a67d006f31f85c0f81b5df7666368a60` | 20,844,480 | 1042.17 s | 167.79 s | 12 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn115/e40c2499180db994.mp3) |
| MN116 | `d1a5dcd9f5b57619b37dc8d97dbb49a4bf46651faf3d5e4173b20d6adfe59fd7` | `27f5fed72bcc61240e6964a42111c8f453776bd4a6a3d83112d46dd5e049001a` | 11,091,840 | 554.54 s | 135.51 s | 7 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn116/27f5fed72bcc6124.mp3) |
| MN117 | `dd112ee56b033dea1abd9d66b99485f18f42a5f9086ef0489ad0bbfbf1dc7800` | `60a6c61c0e076ac6bcd54250a2d3ce44128d41880a975cf52e0ec8118f42808f` | 21,646,080 | 1082.25 s | 158.83 s | 12 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn117/60a6c61c0e076ac6.mp3) |
| MN118 | `723bd6a750fa78d48f13089b4ca0eff18a81fc2d3fa5b31592cc1ad2918b3e1b` | `84fd608044cb59b4ea817e71132ed3932924f0742cbe3c08a77e9cf19dfde755` | 29,310,240 | 1465.46 s | 167.03 s | 15 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn118/84fd608044cb59b4.mp3) |
| MN119 | `8d8376f7c3c63f421719a19d35e20d5d6644a80d561e30c1dc9e2f5257c0e61a` | `a891a880205343f53dfa29952c5dd0044432f5c427cd6994d919a719de50869b` | 36,840,000 | 1841.94 s | 163.11 s | 17 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn119/a891a880205343f5.mp3) |

- Total audio duration: 5986.36 seconds / 119,732,640 bytes. All five use the pinned `vi-charon-mn1-v1` profile (`a384c5852585077c32e1348a6ada5cfc70a69c989ad705b8b5129fef3e1c9a71`), summary first then canonical Vietnamese 2026. Source/profile pins, sequential chunk plan, MP3 hash/frame/byte checks and public R2 object/range verification passed. ASR and interactive browser playback were skipped; all five remain `generated` with `review_status: pending`. MP3/WAV/cache files remain outside Git.

### Release verification for batch mn-044 — MN115–MN119

- PR [#697](https://github.com/streamentry/kinh-tang-pali/pull/697), exact head `9c61e408f1c1a315995b9ef0a5aecac46a721983`: push CI [38772685850](https://github.com/streamentry/kinh-tang-pali/actions/runs/38772685850) and PR CI [38772818424](https://github.com/streamentry/kinh-tang-pali/actions/runs/38772818424) both passed. Merged at 2026-10-15T17:23:06Z as `1a15b6e04569490e8e820fe2383067aff393478a`; remote main readback confirmed that commit.
- Direct merge main CI [38776884762](https://github.com/streamentry/kinh-tang-pali/actions/runs/38776884762) and queued Pages [38776884823](https://github.com/streamentry/kinh-tang-pali/actions/runs/38776884823) were superseded/cancelled after later cover commits. Descendant main CI [38778610930](https://github.com/streamentry/kinh-tang-pali/actions/runs/38778610930) was also cancelled; none of these cancelled runs is reported as a CI pass. Pages [38778610882](https://github.com/streamentry/kinh-tang-pali/actions/runs/38778610882) **succeeded** for descendant `640047ce921ffbf264cede0d9cb9d77d7d66bfb5`, which contains the audio merge (GitHub compare: one commit ahead, none behind).
- Production readback at 2026-10-16T00:20:20Z: all five reader URLs HTTP 200, exactly one player, exact registered R2 URL and pending-review label. All five R2 byte-range requests returned 206, `audio/mpeg`, exactly 1,024 bytes, and total object size matched metadata. A Python default-user-agent request returned 403; independent curl readbacks succeeded for every object.
- Fresh interactive checks at 2026-10-16T00:23:31Z–00:25:05Z used an isolated Chrome session through the bundled Playwright CLI. For **each** MN115–MN119: play advanced the real media clock from the registered R2 MP3; `readyState = 4`, no media error, default playback rate 1×; +15-second seek, keyboard timeline seek and the summary-to-scripture jump all worked. Playback was paused after each test and the dedicated browser session closed. This is new runtime evidence obtained after the earlier upload-time note that browser testing had been skipped.
- Registry now records these five as `live`, with per-UID playback timestamps/observations and exact release evidence. `review_status` stays **pending**: browser playback verification does not establish spoken-content fidelity or a full human listening review. No ASR was run; existing QC history is retained.

### Batch mn-045 — MN120–MN124 (in progress)

| UID | Source SHA-256 | MP3 SHA-256 | Bytes | Duration | Scripture starts | Chunks | Audio |
|---|---|---|---:|---:|---:|---:|---|
| MN120 | `c5cabd9b3e04b47423eca748e54f8d81377eeee824965c3a0621b2c10a534ccb` | `9607a6c05a9357818b2c777528c42c1286a3d6979e796f49293d11b9beda7e7b` | 30,612,000 | 1530.54 s | 159.43 s | 11 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn120/9607a6c05a935781.mp3) |
| MN121 | `a6328ffc4cd1bbefeff5beb7e940b5cb98c9ea4b7c9a8bb18c06aeb32ce2fead` | `4dc51498b744b7cc15ed67527d8b46ab1e1503064cae36773476a1cb4137c603` | 19,297,440 | 964.82 s | 156.19 s | 11 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn121/4dc51498b744b7cc.mp3) |
| MN122 | `1c611e946d4c188d7648045d2063f04460342db8dda787311e56d0625700e81c` | `2d8e141cea906c55a6f8822f4c878fc99f0cfbe530adc4811b2527894db23c1d` | 30,858,240 | 1542.85 s | 172.83 s | 16 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn122/2d8e141cea906c55.mp3) |
| MN123 | `3b0955ac70dfdc0b0f51669a113ccb6fff15329b3e7d7452ec2a965b6f6f5640` | `f8b91b11f83b20b3edb981e44c49cf3c17e26e9e48ffba3116af4dcfed2d8c72` | 24,094,080 | 1204.65 s | 156.11 s | 12 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn123/f8b91b11f83b20b3.mp3) |
| MN124 | `fdc8b0e11594de456dcab40f5d5dfcf527b461fbd7fbdd19901c885e43e52997` | `84f1b7909f15343f1d88abd1ad6dd91ab598203f6a1ac1c27c7630e546cf1f23` | 11,559,840 | 577.94 s | 152.63 s | 7 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn124/84f1b7909f15343f.mp3) |

#### Batch mn-045 generation/upload and local player gate complete

- Five new MP3 files total **5820.80 seconds / 116,421,600 bytes**. Every file uses pinned profile `vi-charon-mn1-v1` (`a384c5852585077c32e1348a6ada5cfc70a69c989ad705b8b5129fef3e1c9a71`), summary first then canonical Vietnamese 2026. All requests ran sequentially; each completed file was uploaded and publicly verified before the next UID began.
- Source/profile pins, transcript reassembly, all cached WAV hashes/formats, MP3 frame accounting/duration/hash/bytes and full public R2 hash/bytes plus byte-range checks passed. MN120 upload initially received Cloudflare auth 403; installed Wrangler refreshed the existing OAuth session, then the same MP3 uploaded successfully without rerendering.
- Local isolated Chrome checks against the actual R2 URLs passed for every MN120–MN124: media clock advanced, no media error, readyState 4, default 1×, +15-second seek, keyboard timeline seek and scripture jump. Per-UID timestamps/results are in the registry. These five are `uploaded-verified`; PR/merge/production checks are pending at this checkpoint.
- No ASR or full human content listening was performed. Every audio keeps `review_status: pending`; no voice/profile/model/rate overrides or speed postprocessing were used. MP3/WAV/cache/transcript files remain ignored and outside Git.

#### Local batch mn-045 release gates

- `npm run validate` passed (2,271 advisories retained); quality history check: 5,714 records, zero errors. `npm test`: 417 passed, one skipped, zero failures. `npm run check`: zero errors/warnings, five hints. `npm run build` passed and Pagefind indexed 6,137 pages. `npm run seo:check` verified 6,145 indexable pages. `npm run audio:check`: all 186 catalog entries, zero errors.
- Built HTML for every MN120–MN124 contains exactly one player with the exact registered R2 URL, correct scripture marker and pending-review label. Only the expected ten progress entries changed (MN115–MN119 release verification; MN120–MN124 new uploads); prior errors and pending review states were preserved. All five MP3s and all WAV chunks are gitignored; no media, transcript, cache or credentials are staged.

### Source revision discovered before merging batch mn-045

- Editorial PR [#704](https://github.com/streamentry/kinh-tang-pali/pull/704), main `53ea9d4deff53a3d8c0b854ec43155a30d78b1a0`, changed MN117:14.2 and MN122:20.1 while this batch was being prepared. The integrated canonical translations are preserved unchanged. The earlier MN117 production evidence and MN122 upload/local-player evidence apply to their previous source revisions only.
- The merge conflict is confined to the audio progress registry. New main source hashes for DN1/DN2/DN16/DN18/DN32/DN33/DN34 and all other editorial changes are preserved. MN117 and MN122 are explicitly marked blocked by source drift; old object/hash/browser evidence is retained under `stale_audio_evidence`. Stale reader metadata is hidden by the existing source-hash check.
- MN122 will be regenerated from the new canonical source before PR #706 can merge. MN117 is queued for correction as the first item after this five-new-text batch; it is not counted as currently live. No translation, quality score or approved narration profile is changed by this audio task. All local gates must run again after integration/regeneration; the earlier successful gates do not prove the revised head.

### Batch mn-045 — revised MN122 source after editorial PR #704

The old source `1c611e946d4c188d7648045d2063f04460342db8dda787311e56d0625700e81c` and its R2/browser evidence remain recorded as history. The following artifact uses canonical source `f282fc0378cf13ced2dbae456467220efd34bc5633730cdd60443cc1711379f7` and a new source/profile/chunk-plan fingerprint. All chunks were generated sequentially for this revision; the old R2 object was retained.

| UID | Source SHA-256 | MP3 SHA-256 | Bytes | Duration | Scripture starts | Chunks | Audio |
|---|---|---|---:|---:|---:|---:|---|
| MN122 | `f282fc0378cf13ced2dbae456467220efd34bc5633730cdd60443cc1711379f7` | `d63850e0b03c30360900675db2f4e916ab23ea057f2e6d0d3ad094be1b0aa107` | 30,352,800 | 1517.57 s | 161.91 s | 16 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn122/d63850e0b03c3036.mp3) |

#### Revised batch mn-045 gates after main integration and MN122 regeneration

- The current five-artifact batch totals **5,795.52 seconds / 115,916,160 bytes**. MN122 now uses source `f282fc0378cf13ced2dbae456467220efd34bc5633730cdd60443cc1711379f7` and MP3 `d63850e0b03c30360900675db2f4e916ab23ea057f2e6d0d3ad094be1b0aa107`; its old object and QC evidence are retained as history, not counted as the current artifact.
- All required local gates were rerun after integrating editorial PR #704: validate passed (2,272 advisories retained), quality histories 5,835 with zero errors; tests 417 passed/one skipped; type-check zero errors/warnings and five hints; production build passed; Pagefind indexed 6,137 pages; SEO verified 6,145 indexable pages; audio integrity checked all 186 catalog entries with zero errors.
- Fresh built HTML confirms one exact current-source player, URL and scripture marker for every MN120–MN124. The stale MN117 player and old R2 URL are correctly absent from the rebuilt page; MN117 remains explicitly blocked for regeneration as the first item after this batch. Full manual spoken-content listening remains pending for every audio. Later main commits observed during this rerun only changed covers.

### Production release verification for batch mn-045 — MN120–MN124

- Production readback at 2026-10-16T03:06:12.745338+00:00: all five pages return HTTP 200 with one player, the exact registered R2 URL and `Chờ nghe duyệt`. Public R2 ranges return HTTP 206, `audio/mpeg`, 1,024 bytes, and exact registered object size. Deployment [38840787298](https://github.com/streamentry/kinh-tang-pali/actions/runs/38840787298) succeeded on merge commit `397a0705354381159b9fbddc894619cc37ca387a`. The main CI for that direct commit was cancelled when a higher priority main push arrived; it is recorded as cancelled, not passed.
- Isolated Chrome production checks completed for MN120–MN124 at 2026-10-16T03:06:38.922Z through 2026-10-16T03:07:38.067Z: actual R2 playback advanced, no media error, readyState 4, default 1×, 15-second seek, keyboard timeline and scripture jump all passed. Per-UID observations and playback timestamps are in the registry. MN117 production HTML has zero players and its stale URL is absent; its source drift remains blocked for the next batch.
- The five new entries are now `live`; their `review_status` remains `pending`. Playback verification does not replace full human content listening. No ASR was run. The revised MN122 R2 object uses its current source hash.

### Batch mn-046 first item — MN117 source drift repair

- MN117's canonical source changed in editorial PR #704. The stale MP3 with source `dd112ee56b033dea1abd9d66b99485f18f42a5f9086ef0489ad0bbfbf1dc7800` remains recorded at https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn117/60a6c61c0e076ac6.mp3; it is retained in R2 history. The stale player was hidden by the current source-hash check.
- Regenerated sequentially from current source `8707b477541ff93f315e62f70d39709563138fbe20d6ecf88477281a5b58dd51` with the pinned profile; 12 chunks (2 summary), 22,903,200 bytes, 1145.09 seconds, scripture start 156.67 seconds. New object: https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn117/c54dd89360bdafb3.mp3. Public full hash/bytes and range checks passed.
- Local Chrome verified playback, 1x rate, +15s seek, keyboard timeline and scripture jump at 2026-10-16T03:18:36.579Z. This is one repaired UID toward the next five-UID PR gate; source review remains pending, and MN125 is next.

#### Batch mn-046 repair and new audio artifacts (in progress)

| UID | Source SHA-256 | MP3 SHA-256 | Bytes | Duration | Scripture starts | Chunks | Audio |
|---|---|---|---:|---:|---:|---:|---|
| MN117 | `8707b477541ff93f315e62f70d39709563138fbe20d6ecf88477281a5b58dd51` | `c54dd89360bdafb30638194f0048054475c22d0cc5bcc89c0330f0f96c3d93bf` | 22,903,200 | 1145.09 s | 156.67 s | 12 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn117/c54dd89360bdafb3.mp3) |
| MN125 | `880ac3f9c59168ae820bfdfcc5274d3dbb46322d6a6700d0143aecd9c29388b4` | `a5410eab8d10cc8e4c5bf6883e12c170403b95ef988a4d53fa668908546cfe01` | 28,295,040 | 1414.69 s | 165.91 s | 16 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn125/a5410eab8d10cc8e.mp3) |
| MN126 | `a48e0920e7902b2aa694dea5043bdba4c5718fe786f1ba02f70be0bfddd7564f` | `3779e8250345a5c02b3ab451fbc533365c1e6bfc599c067a7132bb7172e8c39d` | 21,936,960 | 1096.79 s | 159.87 s | 14 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn126/3779e8250345a5c0.mp3) |
| MN127 | `8d976f302a54489b1add62d24cfb0ee842cd54d73e8d302fdce8ef6b525c4b4a` | `5272fc0603c51278864458c07f469fc6b3dc0d9f0a0aa58a49bab315070baffa` | 23,760,960 | 1188.00 s | 164.47 s | 13 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn127/5272fc0603c51278.mp3) |
| MN128 | `e0414ea22fbb02e7be40ebfc106cb0469cb0e9810a7680b55ca0097e293751d3` | `1fecffd873311c7eb0ec7847fcf52e860abcb98bde390628bf5a4ae0750ed5b9` | 34,448,160 | 1722.34 s | 170.75 s | 19 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn128/1fecffd873311c7e.mp3) |

### MN117 source reversion repair after editorial PR #716

- Canonical source on main is `dd112ee56b033dea1abd9d66b99485f18f42a5f9086ef0489ad0bbfbf1dc7800`, exactly the source SHA already used to create the original artifact. The verified profile is unchanged (`a384c5852585077c32e1348a6ada5cfc70a69c989ad705b8b5129fef3e1c9a71`), and the cached original plan/source has 12 chunks/150 segments matching current canonical text.
- Reused original MP3 `60a6c61c0e076ac6bcd54250a2d3ce44128d41880a975cf52e0ec8118f42808f` (21,646,080 bytes) at https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn117/60a6c61c0e076ac6.mp3 instead of synthesizing identical text again. Full public object downloaded and SHA-256/frame/byte checked; range returned HTTP 206, audio/mpeg, bytes 0–1023. Old artifact was retained in R2. The intermediate MN117 audio from the reverted source is kept in `stale_audio_revisions` with its QC evidence; it does not count as a successful article.
- Registry records the original artifact as `uploaded-verified` for the current source. Browser verification on current local build is pending; production/live verification will be recorded after batch046 deployment. Review remains pending.

### MN117 source reversion repair after editorial PR #716

- Canonical MN117 now resolves to source `dd112ee56b033dea1abd9d66b99485f18f42a5f9086ef0489ad0bbfbf1dc7800`, exactly matching the original R2 artifact and preserved fingerprint `d33d05264246d4ec`. The pinned profile matches `a384c5852585077c32e1348a6ada5cfc70a69c989ad705b8b5129fef3e1c9a71`. The original object `60a6c61c0e076ac6bcd54250a2d3ce44128d41880a975cf52e0ec8118f42808f` was fetched from public R2 and full SHA-256/MPEG frame/byte checked (21,646,080 bytes); an additional range read returned HTTP 206, `audio/mpeg`, 1,024 bytes.
- Reused the immutable object at https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn117/60a6c61c0e076ac6.mp3 rather than issuing another TTS request. Copied the verified MP3 back into its gitignored fingerprint cache. The intervening MN117 object from the temporary source revision (`60a6c61c0e076ac6bcd54250a2d3ce44128d41880a975cf52e0ec8118f42808f`) is retained in `superseded_audio_revisions` with its browser/QC record. The earlier exact-source QC evidence is preserved separately.
- MN117 now counts as one repair toward batch mn-046 with status `uploaded-verified`; local browser verification of the restored registration is being repeated, then production/live verification will follow release. Content review remains pending.

- MN117 reused-artifact reader check passed locally at 2026-10-16T04:57:02.034Z: actual R2 playback advanced, no error, 1×, +15s seek, keyboard timeline and scripture jump. Registry now records it as `uploaded-verified`; live verification waits for the current main deployment. Review remains pending.

### MN117 source reversion resolved by reusing exact-source artifact

Editorial PR #716 returned MN117 to source `dd112ee56b033dea1abd9d66b99485f18f42a5f9086ef0489ad0bbfbf1dc7800`. This exactly matched the original MP3 manifest/profile and cached chunk plan (`vi-charon-mn1-v1`). The original immutable R2 object was downloaded and verified at full SHA-256/bytes/MPEG-frame level, plus HTTP 206 range. The original MP3's player passed local Chrome playback/seek again. The intermediate `c54dd89360bdafb30638194f0048054475c22d0cc5bcc89c0330f0f96c3d93bf` object remains archived under `stale_audio_revisions`; no new TTS prediction was needed for the reversion. MN117 is counted once as a repair, currently `uploaded-verified`; review pending.

### Batch mn-046 final checkpoint — 5 current-source UIDs

- Five UIDs count toward this batch: MN117 repaired by reusing the exact-source object, plus new MN125–MN128. Sequential generation used the approved profile; each completed new MP3 was uploaded before the next UID. All five passed local reader play/seek, full or cached R2 hash/byte evidence and range checks. All `review_status` values remain pending; no ASR or full human content listening was performed.
- Combined current audio: **6504.07 seconds / 130,087,200 bytes**. The final PR must merge after local/hosted gates; production verification is recorded after Pages.
| MN117 | `dd112ee56b033dea1abd9d66b99485f18f42a5f9086ef0489ad0bbfbf1dc7800` | `60a6c61c0e076ac6bcd54250a2d3ce44128d41880a975cf52e0ec8118f42808f` | 21,646,080 | 1082.25 s | 158.83 s | 12 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn117/60a6c61c0e076ac6.mp3) |
| MN125 | `880ac3f9c59168ae820bfdfcc5274d3dbb46322d6a6700d0143aecd9c29388b4` | `a5410eab8d10cc8e4c5bf6883e12c170403b95ef988a4d53fa668908546cfe01` | 28,295,040 | 1414.69 s | 165.91 s | 16 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn125/a5410eab8d10cc8e.mp3) |
| MN126 | `a48e0920e7902b2aa694dea5043bdba4c5718fe786f1ba02f70be0bfddd7564f` | `3779e8250345a5c02b3ab451fbc533365c1e6bfc599c067a7132bb7172e8c39d` | 21,936,960 | 1096.79 s | 159.87 s | 14 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn126/3779e8250345a5c0.mp3) |
| MN127 | `8d976f302a54489b1add62d24cfb0ee842cd54d73e8d302fdce8ef6b525c4b4a` | `5272fc0603c51278864458c07f469fc6b3dc0d9f0a0aa58a49bab315070baffa` | 23,760,960 | 1188.00 s | 164.47 s | 13 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn127/5272fc0603c51278.mp3) |
| MN128 | `e0414ea22fbb02e7be40ebfc106cb0469cb0e9810a7680b55ca0097e293751d3` | `1fecffd873311c7eb0ec7847fcf52e860abcb98bde390628bf5a4ae0750ed5b9` | 34,448,160 | 1722.34 s | 170.75 s | 19 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn128/1fecffd873311c7e.mp3) |

### MN117 exact-source artifact reuse after editorial PR #716

The canonical source reverted to SHA `dd112ee56b033dea1abd9d66b99485f18f42a5f9086ef0489ad0bbfbf1dc7800`, which exactly matches the original MP3 and pinned profile. Its existing public R2 object was downloaded and rechecked for full SHA-256, MPEG frames, bytes and range; local Chrome play/seek passed again. No duplicate TTS request was made. The later intermediate object `dd112ee56b033dea1abd9d66b99485f18f42a5f9086ef0489ad0bbfbf1dc7800` / `c54dd89360bdafb30638194f0048054475c22d0cc5bcc89c0330f0f96c3d93bf` is retained under superseded/stale history.

### Batch mn-046 final checkpoint — five current-source UIDs

- Five successful UIDs toward this PR gate: MN117 repaired by reusing its exact-source artifact, plus newly generated MN125–MN128. They total **6504.07 seconds / 130,087,200 bytes**. Each current source/profile hash matches the registry; all reviews remain `pending`.
- All five objects are verified on R2 and all five local player checks passed. MN117 production verification will be repeated after this batch deploys. No MP3/WAV/cache/transcript or credentials are included in Git.

| UID | Current source SHA-256 | MP3 SHA-256 | Bytes | Duration | Scripture starts | Chunks | Audio |
|---|---|---|---:|---:|---:|---:|---|
| MN117 | `dd112ee56b033dea1abd9d66b99485f18f42a5f9086ef0489ad0bbfbf1dc7800` | `60a6c61c0e076ac6bcd54250a2d3ce44128d41880a975cf52e0ec8118f42808f` | 21,646,080 | 1082.25 s | 158.83 s | 12 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn117/60a6c61c0e076ac6.mp3) |
| MN125 | `880ac3f9c59168ae820bfdfcc5274d3dbb46322d6a6700d0143aecd9c29388b4` | `a5410eab8d10cc8e4c5bf6883e12c170403b95ef988a4d53fa668908546cfe01` | 28,295,040 | 1414.69 s | 165.91 s | 16 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn125/a5410eab8d10cc8e.mp3) |
| MN126 | `a48e0920e7902b2aa694dea5043bdba4c5718fe786f1ba02f70be0bfddd7564f` | `3779e8250345a5c02b3ab451fbc533365c1e6bfc599c067a7132bb7172e8c39d` | 21,936,960 | 1096.79 s | 159.87 s | 14 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn126/3779e8250345a5c0.mp3) |
| MN127 | `8d976f302a54489b1add62d24cfb0ee842cd54d73e8d302fdce8ef6b525c4b4a` | `5272fc0603c51278864458c07f469fc6b3dc0d9f0a0aa58a49bab315070baffa` | 23,760,960 | 1188.00 s | 164.47 s | 13 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn127/5272fc0603c51278.mp3) |
| MN128 | `e0414ea22fbb02e7be40ebfc106cb0469cb0e9810a7680b55ca0097e293751d3` | `1fecffd873311c7eb0ec7847fcf52e860abcb98bde390628bf5a4ae0750ed5b9` | 34,448,160 | 1722.34 s | 170.75 s | 19 (2 summary) | [R2 MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/mn/mn128/1fecffd873311c7e.mp3) |

#### Batch mn-046 local release gates

- `npm run validate` passed; 2,272 advisories retained and 5,836 quality histories checked with zero errors. `npm test`: 417 passed, one skipped, zero failures. `npm run check`: zero errors/warnings and five hints. `npm run build` passed; Pagefind indexed 6,137 pages. `npm run seo:check`: 6,145 indexable pages verified. `npm run audio:check`: 186 catalog entries, zero errors.
- Built MN117 and MN125–MN128 pages each show exactly one player with the source-matched registered R2 URL and scripture marker. MN117 displays the original audio only because its source hash returned to the recorded revision; intermediate revisions are retained in the registry. Every current human content review remains `pending`; no ASR or full listening review was performed.

#### Batch mn-046 final local gates

- All five UID sources and narration profile fingerprints match. The reused MN117 original artifact matches current source SHA `dd112ee56b033dea1abd9d66b99485f18f42a5f9086ef0489ad0bbfbf1dc7800`; superseded MP3 revisions and QC evidence remain archived. MN125–MN128 were generated sequentially and uploaded/verified before starting the next UID.
- `npm run validate` passed: 2,272 advisories retained; 5,836 assessment histories, zero errors. `npm run check`: zero errors/warnings and five hints. `npm run build` passed; Pagefind indexed 6,137 pages. `npm run seo:check`: 6,145 indexable pages. `npm run audio:check`: all 186 catalog entries, zero errors.
- Unit tests passed in a temporary writable worktree at this exact commit: 420 passed, one skipped, zero failures. In the managed worktree, the comparison test's temporary rename of a shared APFS cache file returned `EPERM`; the isolated test root mirrored cached files as symlinks so the test could exercise `not-synced` behavior without mutating the shared cache. No test/code gate was skipped.
- Built player HTML for MN117 and MN125–MN128 contains the current exact R2 URL and scripture marker with review-pending label. All per-UID local player checks passed. Human content listening and ASR were not performed; all five reviews stay `pending`.
- Only five audio JSON files, progress registry and release log enter the PR. MP3/WAV/cache/transcripts and credentials are excluded from Git.
