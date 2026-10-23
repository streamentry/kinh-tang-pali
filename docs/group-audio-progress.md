# Tiến độ audio nhóm SN / AN / KN

Kế hoạch gốc: [group-audio-plan-2026-10-23.md](research/group-audio-plan-2026-10-23.md),
đã merge bằng PR #821, `cdd536f98404c6f0ae6b22f17737515553f42f51`.
Log này phân biệt chuẩn bị kỹ thuật, sinh/upload, phát hành và nghe duyệt.
Không coi kiểm hash hoặc phát được âm thanh là đã đọc đúng toàn bài.

## 2026-10-23 — chuẩn bị pipeline, chưa gọi TTS

- Nguồn nền: `main` tại `cdd536f98404c6f0ae6b22f17737515553f42f51`.
- Dry-run `python3 scripts/audio-preflight.py`: 5.951 mục, SN 1.819 / AN 1.781 /
  KN 2.351; 5.951 ứng viên kỹ thuật, 20.244 chunk, 13.294.060 ký tự trong các
  request dự kiến (gồm tên bài và khoảng trắng trình bày). **0 provider request.**
  Đây không phải số token tính phí hoặc thời lượng âm thanh đã tạo.
- Mỗi UID có home group, gồm `cnd23`, `ne1`, `ne2`, `ne3`, `ne36`, `ne37` trong
  nhóm hỗn hợp. UID dải giữ nguyên; AN URL riêng chỉ lấy đoạn mình sở hữu.
- Phạm vi mẫu đề xuất `sn1-nalavagga`: SN1.1–SN1.10, 10 mục, 20 chunk,
  5.406 ký tự dự kiến. Chưa khởi chạy TTS hoặc upload; chờ người biên tập duyệt
  policy tên bài → kinh văn và cho phép gửi mẫu. Chưa mở rộng corpus.
- SHA-256 profile vẫn là
  `a384c5852585077c32e1348a6ada5cfc70a69c989ad705b8b5129fef3e1c9a71`.
  Test đối chiếu hash cũ của toàn bộ 186 mục MN/DN; không thay transcript,
  profile, audio registration, chất lượng hoặc lịch sử QC của các mục đó.
- Đã chạy prepare-only cho `sn1.1`, `an1.5`, `dhp1-20`. Transcript/plan nằm
  trong `audio/` bị Git bỏ qua. Không có MP3 mới.
- Đã kiểm khởi tạo queue mẫu schema 2 rồi chạy `audio:check`: 196 mục, 0 lỗi;
  registry MN/DN giữ nguyên SHA-256. Queue thử chỉ lưu trong preview bị Git bỏ
  qua, không ghi thành tiến độ sản xuất.
- Browser dùng WAV im lặng giả lập, không dùng registration kinh giả: nhãn
  kinh văn từ 0, không có nút tóm tắt, Next/Back, row play, auto-next, lưu toggle,
  fallback khi fetch lỗi, chặn storage và tắt JavaScript đều qua. Kiểm 1440 /
  1024 / 390 / 320px không tràn ngang; playlist MN thật tải 152 mục từ JSON
  và MN1 giữ phần tóm tắt. Riêng ca chặn storage loại toolbar dev của Astro
  sau khi stack trace xác nhận nó đọc localStorage ngoài try/catch. Các fixture
  đã gỡ; ảnh/log browser cục bộ ở `output/playwright/group-audio/` bị Git bỏ qua.
- Đây là bằng chứng giao diện/kỹ thuật cục bộ; **chưa nghe duyệt** và **chưa xác
  minh production của pipeline mới**. Tệp compilation/phần nghe dài chỉ bắt đầu
  sau gate nghe mẫu trong kế hoạch; chưa có chapter timing nào được tuyên bố.
- Local gate đạt: `validate`, `test` (492 đạt / 1 bỏ qua), `check` (0 lỗi,
  0 warning, 5 hint sẵn có), `audio:check`, `design:check`, `build`, `seo:check`,
  `reading:check`. Bản dựng kiểm 7.057 trang có thể index và 756 phần đọc liên tục
  với 210.145 segment. Browser trên **bản dựng production cục bộ** cũng kiểm
  phát thật MN, Next/Back, DN22, storage bị chặn và native fallback khi tắt JS;
  không có page error. Đây chưa phải Pages production.
- Kiểm resume bổ sung: queue còn hash nguồn/profile cũ hoặc blocker dừng trước
  khi đọc credential, trước mỗi request TTS và trước/sau upload. Integration test
  xác nhận 0 lời gọi provider, không xoá bằng chứng lỗi. Phần này không đổi UI
  hoặc các artifact MN/DN đã có.

Lệnh tái lập dry-run và vận hành nằm trong [audio.md](audio.md).

## 2026-10-23 — người biên tập duyệt cấu trúc và mẫu mười mục

- Người biên tập xác nhận: **"Duyệt cấu trúc và tạo thử 10 bài SN1.1–SN1.10"**.
  Policy SN/AN/KN là tên bài rồi kinh văn, không tự viết tóm tắt. Quyền gửi nội
  dung tới Gemini và tạo audio ở lượt này giới hạn SN1.1–SN1.10; giữ profile MN1
  đã ghim. Chưa mở rộng trước khi người biên tập nghe và chấp thuận mẫu.
- Pipeline PR #823 đã merge tại `310bc71573b9170cacb3dce25f15870efc677e4f`,
  cả hai CI head `edfa84a25` đạt. Pages run `39891897917` thành công; kiểm live
  playlist MN 152 / DN 34 khớp main, Next/Back, phát thật, bốn kích thước màn
  hình, storage bị chặn và native fallback khi tắt JavaScript đều đạt. Đây là
  bằng chứng pipeline, không phải nghe duyệt nội dung audio SN.
- Bắt đầu mẫu từ `main` tại `c320f32d93dcebce99a019936a0610660dbe1967`, gồm
  các bản sửa thông báo lỗi player #824–826. Preflight mới: 10 mục hợp lệ,
  20 chunk, 5.406 ký tự dự kiến; khởi tạo queue schema 2 chỉ cho mười mục này.
  Sinh và upload tuần tự; giữ `review_status: pending`, không chạy ASR.

### Batch SN1.1–SN1.5 — upload và player đã kiểm

| Mục | Thời lượng WAV + khoảng nghỉ (giây) | SHA-256 MP3 |
| --- | ---: | --- |
| SN1.1 | 87.62 | `c55898b204bd3f01dd6f0b5a52d69ef70336bb3760d593f2d7f06229cb5d4d9b` |
| SN1.2 | 56.78 | `0c8d8b46a0e0be1b7a5d4ad897af3a4b8d3953ef7093baf6f1458dfa36b0f4bc` |
| SN1.3 | 35.78 | `277090bd5e21e38fc2255f9dd7e787a3fac4c865b9fb8418469e771c4f6061c4` |
| SN1.4 | 34.42 | `d2791000d77d155eaa55b5f4f4a84a02349df0791d3ede42da13a84e24757d67` |
| SN1.5 | 29.70 | `bc0d5b671f28ea251e9c1b7ff50b47550f0b8a0a99f15f4a17399cbd0f6d22a8` |

- Cả năm object khớp bytes/SHA-256 công khai và HTTP range 206; source/profile
  được kiểm lại trước/sau upload. Player từng bài phát và tua được; kinh văn từ 0,
  không hiện tóm tắt giả. Playlist phẩm và các nhóm cha tái dùng cùng URL theo
  thứ tự nguồn; Next/Back, row play, auto-next, lưu toggle và fallback tắt JS đạt.
- Kiểm browser ở 1440/1024/390/320px không tràn ngang, không page error. Đây là
  kiểm vận hành, không phải nghe duyệt: cả năm giữ `review_status: pending`.
- SN1.3 gặp một timeout mạng ở request tên bài; retry giới hạn của pipeline đã
  thành công. Không đổi model, profile hoặc tốc độ. Cache/checkpoint và log giữ lại.
- Local `validate`, `test` (493 đạt / 1 bỏ qua), `check` (0 lỗi, 0 warning, 5 hint),
  `build` đạt. Queue có 5 `uploaded-verified`, 5 `not-started`; chưa tạo SN1.6.

### Batch SN1.6–SN1.10 — đủ mười mục mẫu

- Batch đầu đã merge PR #827 tại `bfcfda6d6051044f7a2c694b1a490c8f1f1c7620` sau
  khi cả hai CI head `fda2acf15` đạt. Bắt đầu batch hai ngay sau merge, không chờ
  Pages. Các entry SN1.1–SN1.5 ghi `merged`; chưa suy ra live từ upload hoặc merge.

| Mục | Thời lượng WAV + khoảng nghỉ (giây) | SHA-256 MP3 |
| --- | ---: | --- |
| SN1.6 | 34.66 | `ccae74db2268f919810d606c4f1f198b4154c777ff38a52242ce27a3f6abd36b` |
| SN1.7 | 31.98 | `febe94665b5d20ec6b6906db7f223ccdd346fa3724233e4b9c617f49c2a63313` |
| SN1.8 | 32.94 | `55978cc376f07236f93bbdb229b62cd638ac70068cd5feb137420ff96f001043` |
| SN1.9 | 39.82 | `685a6bb26015b726c5d3e35bb46ac20657662e8bf480cfa428739b1bb9677422` |
| SN1.10 | 58.78 | `a6296fe533382d45990a8f3397ef76777118dde0f45c13c259ed331a961d3c2a` |

- Đủ mười mục có MP3 trên R2, tổng 442,48 giây (~7 phút 22 giây). Cả mười dùng
  profile MN1 đã ghim, tiêu đề trước kinh văn; kinh văn bắt đầu từ 0, không có
  tóm tắt tự sinh. Object công khai khớp hash/bytes và range readback.
- Upload SN1.6 từng dừng vì OAuth hết hạn trong lúc chờ CI. Wrangler làm mới
  phiên thành công; upload lại đúng MP3 đã có, không gửi TTS hoặc đổi hash file.
  Giữ log lần lỗi và lần upload thành công.
- Browser phát và tua cả mười MP3; playlist phẩm/các nhóm cha tái dùng đúng URL,
  đủ 10/10 theo thứ tự; Next/Back, row play, auto-next nhóm và chuyển trang bài,
  toggle lưu giữa các trang, fallback tắt JS, bốn kích thước đều đạt; không page error.
- `validate`, `test` (493 đạt / 1 bỏ qua), `check` (0 lỗi, 0 warning, 5 hint),
  `build` đạt. Sau kiểm player: năm mục `merged`, năm mục `uploaded-verified`.
  Tất cả `review_status: pending`; chưa nghe duyệt và chưa mở rộng ngoài SN1.1–SN1.10.

### Production — mẫu 10/10 đã phát hành, chờ nghe duyệt

- PR #828 đã merge tại `782d3af07da5734f1df71146f5afeed443fecee5`. Timeline
  GitHub ghi nhận merge lúc 20:06:35 ngày 2026-10-23 (giờ Việt Nam), trước khi
  CI kết thúc. Watcher phát hiện PR đã merge, không tự gửi lệnh merge khi check
  còn chạy. Giữ sự kiện này trong log, không trình bày thành CI xanh trước merge.
- Hai CI của đúng head `98fb0af1d` sau đó đều đạt: push run `39956714591`
  kết thúc 20:23:49, pull_request run `39956786894` kết thúc 20:31:32 cùng ngày
  (giờ Việt Nam). Pages run `39958509122` thành công cho đúng commit publication.
- Kiểm website production lúc khoảng 20:46 ngày 2026-10-23: cả mười MP3 phát
  và tua được; không page error; kinh văn từ 0; không tóm tắt giả. Group playlist
  đủ 10/10, đúng thứ tự, cùng object trong phẩm, tương ưng và cả bộ. Next/Back,
  row play, auto-next trong nhóm/chuyển trang bài, lưu toggle, tắt JS và bốn
  kích thước 1440/1024/390/320px đều đạt.
- Tổng duration MP3 do browser đo: 443.088 giây (~7 phút 23 giây).
- Registry ghi đủ 10 `live`, có SHA/source/profile, public range/hash evidence,
  PR/merge commit, URL trang production, run/commit deployment và thời điểm
  kiểm từng bài. Giữ thời điểm live đầu tiên của batch một khi cập nhật lượt kiểm mới.
- Cả mười `review_status: pending`. Không ASR và không tuyên bố đã nghe duyệt
  toàn bộ nội dung. Chỉ sau khi người biên tập nghe mẫu bên cạnh MN1 và chấp thuận
  mới đi tiếp các ca AN, Pháp Cú, nhóm dài/parts trong kế hoạch. Chưa tạo UID
  nào ngoài SN1.1–SN1.10; WAV/cache giữ lại để sửa có chọn lọc hoặc xuất dẫn xuất.

### Tiếp tục kỹ thuật trong lúc CI chạy — xuất WAV local

- PR #829 ghi bằng chứng live đã merge tại
  `4faec0267e424c6ace02b1cf6952a131d6ac272c`, sau khi cả hai CI đúng head
  `7ee1dc7d4b5d7969dbe5973c2df065008f18d98d` đạt. Không còn watcher polling
  PR này. Theo chỉ đạo mới, kiểm CI các PR tiếp theo theo nhịp **2 giờ/run**;
  giữa các lần kiểm tiếp tục phần việc độc lập. Gate CI đúng head trước khi
  agent merge vẫn giữ.
- Đã triển khai công cụ xuất phẩm **local** từ WAV đã có: kiểm nguồn published,
  registration/progress, profile, plan/checkpoint, hash từng WAV và MP3. Thiếu
  một thành viên, nguồn stale, queue blocked hoặc file hỏng thì dừng.
- Phẩm Cây Lau được encode local một lần từ 20 WAV của 10 mục đã phát hành,
  không gọi Gemini hoặc upload thêm. PCM có 10.619.520 frame ở 24 kHz =
  442,48 giây; MP3 dẫn xuất có 442,536 giây, SHA-256
  `5ab6bc88c95935f493530d414ca69e4e2c586bd4a842fc13f23cd6f4d4c96c9a`.
  Kết quả nằm trong `audio/compilations/sn/sn1-nalavagga/5af2783cc67e8e3a/`,
  ngoài Git. Chạy lại kiểm hash và dùng lại bản xuất, không gọi encoder/provider.
- Chapter đo từ frame PCM, không ước lượng trong request. Chia phần mặc định
  25 phút ở ranh giới mục đọc; bài quá dài chia ở ranh giới WAV, giữ UID và
  đánh dấu continuation. Tests dùng PCM phân biệt để kiểm thứ tự, khoảng nghỉ,
  chapter, ngân sách, chia phần và từ chối cache/nguồn/QC sai.
- Đây là bước chuẩn bị kỹ thuật theo yêu cầu tiếp tục giai đoạn độc lập;
  chưa phát hành download compilation hoặc tạo audio UID mới. Mốc chapter
  MP3 chưa được xác minh alignment. Cả bản xuất và 10 bản đọc gốc vẫn
  `review_status: pending`; gate nghe mẫu trước khi mở rộng TTS còn nguyên.
- Local: `validate` đạt (còn advisory của corpus/cache), `test` 494 đạt / 1 bỏ
  qua, `check` 0 lỗi / 0 warning / 5 hint có sẵn. Không đổi website hoặc
  workflow build; full build tiếp tục thuộc CI. Chi tiết vận hành ở [audio.md](audio.md).
- Chrome native đọc duration bản xuất 442,536 giây ở 1×, phát và tua tới giữa /
  gần cuối được, không media error; `audio:check` vẫn 196 mục / 0 lỗi. Đây là
  bằng chứng file giải mã và thao tác được, không phải kiểm lời đọc hoặc alignment
  chapter MP3. Log nằm cạnh bản xuất local, không vào Git.
