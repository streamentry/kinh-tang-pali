# GOAL — Audio Việt 2026 cho Trung Bộ và Trường Bộ, tuần tự từng bài

Thực hiện mục tiêu này đến khi mọi bài trong catalog MN và DN có audio hợp lệ trên R2, metadata trên main và player hoạt động trên website. Làm MN theo số thứ tự trước, rồi DN theo số thứ tự. **Chỉ một bài và một request sinh chunk đang chạy tại một thời điểm. Không chạy agent hoặc job TTS song song.**

## Đọc trước và kiểm kê thật

Đọc `AGENTS.md`, `docs/audio.md`, `source/narration-profile.json`, `source/audio-storage.json`, `scripts/narration_config.py`, generator/uploader và reader. Nếu cần sửa dịch/tóm tắt, đọc đầy đủ `skill/translation.md` và `docs/quality-assessments.md`; không sửa nghĩa hoặc trạng thái dịch để ép bài đủ điều kiện audio.

Fetch remote; kiểm tra PR đã merge và các worktree hiện có. Bắt đầu từ main mới nhất trong checkout sạch riêng, giữ nguyên WIP và `.env` của người dùng; không stash/reset/clean hoặc stage toàn bộ checkout bẩn. Dùng dependency/runtime đã có; giữ bí mật trong env, không copy vào Git/log/PR. Đăng nhập Cloudflare cần người dùng thì yêu cầu cụ thể và tiếp tục phần độc lập.

Đếm UID từ `content/catalog/sutta/mn.json` và `dn.json`, không lấy danh sách từ file audio hiện có. Dựng registry tiến độ máy đọc được tại `content/audio/progress.json`, ghi mọi UID, trạng thái, source/profile hash, object key, URL, thời lượng, mốc kinh văn, lỗi, thời điểm và batch. Viết nhật ký append-only tại `docs/audio-progress.md` cho từng batch, kèm PR, exact head, merge commit và bằng chứng deploy. Không tuyên bố con số corpus nếu không tái đếm được.

MN1 là mẫu đã có: kiểm source/profile hash và đọc lại R2; nếu hợp lệ thì giữ nguyên, không gọi TTS lại và không tính vào quota 10 bài mới. Phê duyệt giọng/nhịp của MN1 không phải phê duyệt nội dung toàn bài.

## Contract Gate — phải hoàn thiện trước khi sinh hàng loạt

1. `scripts/audio-source.ts` phải hỗ trợ MN và DN, resolve đúng collection từ UID và dùng thứ tự key Pāli đã pin. Tóm tắt và toàn bộ canonical Việt 2026 đều phải có; không thay bằng English hoặc Việt tham khảo. Dừng bài khi thiếu nội dung, source chưa sync, status chưa published hoặc source hash thay đổi giữa lúc sinh/upload. Ghi `blocked` đúng lý do và UID; không tính bài đó hoàn tất. Có thể tiếp tục UID sau theo thứ tự, nhưng không gọi toàn mục tiêu hoàn tất khi còn blocker.
2. Dùng nguyên profile `vi-charon-mn1-v1` qua `scripts/narration_config.py`. Không đổi model, voice, style, 1.400 ký tự/chunk, nghỉ 0,35 giây/chunk và 1,6 giây giữa hai phần; không fallback, đổi pin, tăng/giảm tốc hậu kỳ. Playback mặc định 1×. Model API có thể thay đổi cách sinh dù tên không đổi: nghe đối chiếu MN1 ở đầu mỗi bài/batch và ghi bằng chứng, không hứa nhịp tuyệt đối chỉ từ config.
3. Cấu trúc transcript: tóm tắt trước → kinh văn Việt 2026 sau. Không đọc ID, comments, notes, provenance, rubric hoặc hướng dẫn giọng. Giữ nguyên nội dung/lặp/dấu lược trong bản dịch; không tự mở rộng `…`. Các ellipsis đứng riêng là khoảng nghỉ. Không xoá tên hoặc thuật ngữ canonical để làm dễ đọc. Không nhập phần giải thích vào lời kinh.
4. Chia đoạn dài theo câu hoặc ranh giới tự nhiên mà không mất, lặp hoặc đổi thứ tự ký tự nội dung; cần test tái ghép transcript. Không thay giới hạn chunk của profile. Cache phải fingerprint đủ source/profile/chunk text để retry không dùng WAV từ văn bản khác. Không tạo lại chunk đã hợp lệ.
5. Retry có giới hạn và backoff, ghi checkpoint sau mỗi chunk. Lỗi quota/auth/billing dừng request mới, giữ cache, không tự chuyển provider hoặc tạo thêm prediction. Lần resume đối chiếu nguồn hiện tại rồi tiếp tục, không sinh lại từ đầu.
6. Metadata không chỉ có hash: phải giữ snapshot profile, hash MP3, số byte, duration và `scripture_start_seconds` đo từ WAV thật. Uploader phải dùng key `vi/<mn|dn>/<uid>/<audio-hash>.mp3`, chặn source/profile drift và đăng ký player chỉ sau remote verification.
7. Tiến độ phân biệt `not-started`, `generating`, `generated`, `uploaded-verified`, `merged`, `live`, `blocked`; review nội dung là trạng thái riêng. Tạo/upload được không tự suy ra đã nghe duyệt.

Hoàn thiện các kiểm tra cần thiết cho DN, transcript dài, resume/chunk cache, profile/source drift, registry progress và player thiếu/stale metadata. Chạy các cổng local và tạo PR nền tảng trước nếu phải sửa pipeline; không trộn sửa nền tảng lớn vào batch nội dung 10 bài.

## Vòng thực hiện cho từng UID

1. Xác minh canonical source, summary, status, source hash và profile. Ghi `generating` cùng checkpoint.
2. Sinh toàn bộ chunk **tuần tự**, ghép một MP3 hoàn chỉnh gồm cả hai phần. Kiểm MP3 decode/frame integrity, duration > 0, không có chunk thiếu/rỗng/sai sample format và mốc kinh văn nằm trong duration.
3. Kiểm nội dung lời đọc bằng transcript/chunk accounting và nghe các đoạn mở đầu, chuyển hai phần, ranh giới chunk, tên Pāli, đoạn cuối; ghi chính xác phạm vi đã nghe. Nếu có công cụ transcript audio đáng tin, đối chiếu toàn bài để phát hiện bỏ/thêm/lặp, nhưng không coi ASR là authority sửa kinh. Không đánh dấu approved nếu chưa nghe duyệt đầy đủ theo quy định repo.
4. **Xong bài nào upload bài đó ngay**, trước khi bắt đầu sinh bài kế tiếp. Dùng bucket đã khai, không tạo bucket cho từng bài. Public-read đã được người biên tập cho phép cho bucket audio này; chỉ đặt audio công khai trong đó.
5. Tải lại MP3 qua URL công khai, kiểm `audio/mpeg`, SHA-256, số byte, range request 206 để tua. Nếu trả lỗi hoặc hash lệch, không ghi URL thành công và không tăng progress.
6. Ghi `content/audio/<uid>.json` và tiến độ ngay; player chung phải tự hiện cho UID có metadata hợp lệ, tự ẩn bản stale. Build/kiểm trang UID, phát từ URL R2 thật, thử tua và nút đến kinh văn. Chỉ sau bước này mới ghi `uploaded-verified`.
7. Checkpoint bền vững rồi chuyển UID kế tiếp. MP3/WAV/cache/transcript local không vào Git. Chỉ commit source code, config công khai, metadata, progress và tài liệu cần thiết. Kiểm staged paths không chứa secrets hoặc media trước mỗi commit.

## Batch Gate — mỗi 10 bài mới thành công một PR và merge

Sau **10 UID mới hoặc được sửa thành công** kể từ lần merge batch trước, dừng tạo audio mới để giao batch; cuối MN và cuối DN giao phần còn lại dù dưới 10. Không đếm bài skip/block hoặc MN1 đã tồn tại. Nếu gián đoạn phải giao checkpoint nhỏ hơn, ghi rõ số thật và lý do.

- Branch `codex/audio-<collection>-batch-<number>` từ main mới nhất; commit có danh sách UID và registry thống nhất. Chỉ stage file thuộc batch, không `git add .` trong checkout bẩn.
- Chạy `npm run validate`, `npm test`, `npm run check`, `npm run build` và các kiểm tra metadata/progress. Lỗi phải sửa; không hạ gate hoặc bỏ test để merge.
- PR ghi UID mới/sửa/skip/block, duration tổng, source/profile hash, đường dẫn metadata, phương pháp QC, phạm vi nghe thật, kết quả R2/public player và các hạn chế. MP3 chỉ có link, không commit binary.
- Push, tạo và attach PR; chờ CI của exact head xanh, kiểm mergeability/diff rồi squash merge với head đã kiểm chứng. Không force-push đè công việc người khác. Đọc lại remote main và merge SHA để xác nhận.
- Chờ workflow Pages của merge commit hoàn tất; kiểm trang production của từng UID có đúng link R2/source mới, thử playback/seek đại diện trong batch và ghi bằng chứng. Nếu deploy/live lỗi, giữ trạng thái merged nhưng chưa live, sửa trước batch sau.
- Nhật ký có PR/merge/deploy SHA thật; nếu chỉ biết sau merge thì ghi vào checkpoint batch tiếp theo hoặc PR tài liệu cuối, không bịa dữ liệu tương lai. Mọi commit bổ sung cũng theo PR/CI.
- Tiếp tục batch kế tiếp tự động trong phạm vi đã được giao; không hỏi lại quyền tạo PR/merge mỗi 10 bài. Không coi đăng ký upload hoặc PR mở là hoàn tất.

## Exit criteria

- Mọi UID MN và DN theo catalog đã được đối soát, không có bài mất khỏi hàng đợi hoặc blocker giấu đi.
- Mỗi bài có summary → Việt 2026 đúng thứ tự, profile khớp mẫu MN1, MP3 thật trên R2 với hash/bytes khớp, metadata trên remote main và player trên production hoạt động.
- Source/profile drift, chunk thiếu, public URL lỗi và coverage/progress lệch đều bị kiểm tra phát hiện.
- Mọi batch đã merge sau local/hosted gates; có log và registry tái lập được. Không có MP3/WAV, token, `.env` hoặc cache trong Git.
- Báo cáo cuối tách số uploaded/merged/live/approved/blocked; chất giọng đã duyệt không được đánh đồng với nội dung audio đã duyệt.

Đây là prompt để thực thi một lượt goal riêng. Việc viết/lưu prompt không tự khởi chạy 186 bài audio hay tạo lịch tự động.
