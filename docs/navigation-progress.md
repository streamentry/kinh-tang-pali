# Tiến độ: tầng nhóm SN / AN / KN

Goal: [`docs/prompts/goal-nikaya-middle-layer.md`](prompts/goal-nikaya-middle-layer.md). Tham chiếu kỹ
thuật: [`docs/navigation.md`](navigation.md). Nhánh `codex/nikaya-middle-layer`, worktree riêng,
base `d5c9933f9939b02bfc4aff678a21d9d6e987de86` (main ngày 2026-10-22).

## Baseline đo được (base, trước thay đổi)

- Catalogue: SN 1.819 / AN 1.781 / KN 2.351 URL; khớp audit nghiên cứu (`catalog_sha256` không đổi).
- Build (`npm run build`, máy cục bộ, SSD): 6.204 trang, Astro 55,5 s, tổng 88 s, RSS đỉnh 3,9 GB;
  Pagefind 6.137 trang / 467.605 từ / 1 bộ lọc. `dist` 5,63 GB, HTML 643 MB, 3 tệp JS (9 KB),
  54.348 biến thể ảnh (4,94 GB). Artifact Pages production gần nhất: 5,07 GB.
- Audio: chỉ DN (34) và MN (152); SN/AN/KN không có tệp audio.

## Phase 1 — Contract gate (dữ liệu) · commit `b8c137362`

- Lock điều hướng riêng, 50 tệp, `npm run navigation:sync` kiểm commit → tree → blob → bytes;
  `--remote` so với GitHub: 194 mục `structure/`, `truncated=false`. 23 hash nghiên cứu khớp lock.
- `navigation:generate` tái lập đúng baseline nghiên cứu: SN 300 nhóm / 1.819 URL / 1.819 tệp;
  AN 229 / 1.781 / 1.408 (38 tệp gộp → 411 URL); KN 325 / 2.351 / 2.351.
- Kiểm độc lập (`scripts/verify-navigation.py`, Python, không chung code) đạt; ba phép phá
  (đảo tệp gộp, chuyển UID sang nhóm khác, giả tên) đều bị cả `check` lẫn `verify` bắt.
- `tests/unit/navigation.test.ts`: 25 ca, gồm mọi ca âm của §8 (sửa một byte, thiếu lá, UID ngoài
  catalogue, sourcePath sai, hai cha, chu kỳ, trùng ID, tệp gộp chồng lấn, tên không provenance,
  danh sách truncated, thiếu cache) và hồi quy (AN gộp, `an1.296-305`, Pháp Cú, `thig10.1`, KP, nhóm
  một bài, peyyāla/paṇṇāsaka, UID dài, biên đầu/cuối, `an2.1 → an2.10 → an2.100`).

## Phase 2 — Website

- 854 trang nhóm, 756 phần đọc liên tục (669 nhóm), mục lục theo nhóm ở trang bộ, breadcrumb và bài
  trước/sau theo cây ở trang bài SN/AN/KN, tìm kiếm có loại kết quả `Nhóm`, sitemap thêm trang nhóm.
- `SegmentRows` và `SuttaRow` tách khỏi `SuttaReader` / `CollectionIndex`: HTML của MN1, MN10, DN22,
  mục lục MN và trang Nguồn **trùng byte** (sau chuẩn hoá khoảng trắng giữa thẻ và tên asset băm)
  với build base. Trang bài SN/AN/KN chỉ khác ở breadcrumb và khối bài liền kề; khối kinh văn trùng.
- `npm run reading:check`: 756 phần, 210.145 segment, mỗi segment khớp trang bài của nó đúng một lần,
  đúng thứ tự, đúng markup; hai phép phá (xoá một segment, sửa một ký tự) đều bị bắt.
- Build sau thay đổi: 7.814 trang (= 6.204 + 854 + 756), Astro 74–75 s, tổng 99,5–101,5 s, RSS 4,1–4,2 GB;
  Pagefind 6.991 trang (+854 trang nhóm, chỉ tên nhóm: +2.105 từ), 2 bộ lọc. HTML +320 MB
  (dist 5,95 GB), **0** biến thể ảnh mới, **0** JS mới. Trang đọc lớn nhất 1,26 MB (≈90 KB gzip).

## Review đối kháng (agent độc lập, sau Phase 2)

Không có lỗi CRITICAL/HIGH. Đã sửa: playlist trang bộ theo thứ tự cây (trước đó theo `order` lịch sử,
tiềm ẩn vì SN/AN/KN chưa có audio); verifier Python kiểm thêm cấp/số đếm/first-last, tiêu đề dự án đúng
là tên Pāli, không bỏ sót tên SuttaCentral/mục lục, có `--nav-dir` và test ca âm; `reading:check` tách
hàm và có test ca âm, từ chối kế hoạch 0 segment; thiếu Pāli hay bài ngoài cây làm build dừng thay vì
im lặng; workflow Pages chạy cùng các cổng điều hướng; trạng thái tìm kiếm nói rõ số nhóm đang hiện.

## Kiểm trình duyệt (preview cục bộ của `dist`)

- Lát cắt: SN12 (Thiên Nhân Duyên → Tương Ưng Nhân Duyên → Āhāravagga → SN12.15), AN3 (Chương Ba
  Pháp → Dutiyapaṇṇāsaka AN3.51–102 → Phẩm Lớn → AN3.65), Suttanipāta Aṭṭhakavagga SNP4.1–16 (2 phần).
  Đi bằng click, back/forward, deep link + reload tới `#snp4.3:1.1` (`:target` dưới toolbar).
- Đọc liên tục: ID không trùng, 417 segment SN12.11–20 trùng thứ tự với 10 trang bài; đổi chế độ
  cho mọi bài; tệp gộp `an1.1-10` chỉ liệt kê một lần trong Tra cứu toàn văn.
- 320 / 390 / 720 (≈1440 @ 200%) / 1024 / 1440 px: không tràn ngang trên trang bộ, nhóm, đọc liên tục,
  bài, tìm kiếm. Bàn phím: skip link, focus 2px trên breadcrumb. Không lỗi console.
- Tìm kiếm "Nhân Duyên": 40 nhóm (có breadcrumb) tách khỏi 558 kết quả kinh; 0 kết quả trỏ `/doc/`.
- Playlist: SN/AN/KN chưa có audio thật, nên kiểm engine bằng fixture WAV cục bộ (chỉ trong trình duyệt,
  không commit): auto-next mặc định bật, không tự phát khi mở, chuyển 3 bài rồi dừng với thông báo
  hết nhóm, không lặp; tắt auto-next được ghi nhớ; storage bị chặn vẫn chạy; track lỗi hiện thông báo
  và link MP3; seek/pause. 854 trang nhóm thật: không trang nào có trình phát.

## Lỗi còn mở / giới hạn

- 83/854 nhóm chưa có tên Việt đã đối chiếu (SN 8, AN 43, KN 32) sau khi sửa tiêu đề: hiện tên Pāli +
  nhãn cấp. (Trước khi sửa: 118.)
- Tên từ mục lục budsas.org: `NOASSERTION`; chỉ kiểm lại nguyên văn khi chạy `--reference` cục bộ.

## Phát hành

- PR [#816](https://github.com/streamentry/kinh-tang-pali/pull/816), head `fd12efd5a3f366d5f9742c136a72e1edfeca5322`,
  base `d5c9933f9939b02bfc4aff678a21d9d6e987de86`. CI đúng head xanh cả hai run: `pull_request`
  [39825999420](https://github.com/streamentry/kinh-tang-pali/actions/runs/39825999420) (28 bước, gồm
  `navigation:sync -- --remote`, `navigation:check`, `navigation:verify`, `reading:check`; 485 test, 483 pass,
  0 fail, 2 skip có sẵn) và `push` 39825972509.
- Squash-merge `436bb5e3efe23596a18718c296c0293ccc25565a` lúc 2026-10-22T18:37:52Z; `origin/main` đọc lại:
  cây trùng head của PR.
- Pages run [39833072651](https://github.com/streamentry/kinh-tang-pali/actions/runs/39833072651) (build +
  deploy thành công) trên đúng merge commit; deployment `7261100476` (github-pages, 2026-10-22T19:06:31Z);
  artifact 5.098.513.011 byte.

## Kiểm production (2026-10-22T19:10Z)

- Crawl `https://streamentry.github.io/kinh-tang-pali/`: 1.610 URL điều hướng (854 nhóm + 756 phần đọc) đều 200
  và **trùng byte** với build cục bộ đã kiểm; 19 trang khác (5 trang bộ, `/page/N/`, bài pilot, UID dải, MN1,
  sitemap, tìm kiếm) đều 200; ID nhóm lạ `sutta/sn/nhom/khong-co-nhom-nay/` trả 404.
- Trình duyệt trên production: SN12.15 có breadcrumb Kinh Tương Ưng Bộ › Thiên Nhân Duyên › Tương Ưng Nhân
  Duyên › Phẩm Āhāravagga, bài trước/sau SN12.14/SN12.16; đọc liên tục Phẩm Lớn (AN3): 698 segment không trùng,
  không trùng ID, `noindex`; Aṭṭhakavagga đủ SNP4.1–16 đúng thứ tự; Pagefind production trả nhóm kèm breadcrumb và
  kết quả kinh không trỏ trang đọc liên tục; trang Tiểu Bộ ở 390 px không tràn, đủ 20 tác phẩm; không lỗi console.
- Audio: SN/AN/KN chưa có MP3, nên production không có trình phát nhóm nào; engine đã kiểm bằng fixture cục bộ.

## Sửa 35 tiêu đề (PR nội dung riêng, theo yêu cầu người dùng 2026-10-23)

- 397 segment `:0.2` trong 397 bài (SN12.11 + mọi bài Itivuttaka/Theragāthā/Therīgāthā của 34 nipāta bị
  loại): "Bộ N Bài Kinh" → "Nhóm N Kệ" (Thag/Thig) / "Chương N Pháp" (Iti); "Đoān" → "Đoàn". Danh sách
  loại trừ của tầng điều hướng nay rỗng; nhóm chưa có tên Việt giảm từ 118 xuống 83.
- 54 bài có lượt `full` gắn hash được 9 người chấm độc lập đọc lại toàn văn, ghi `--record` và `--apply`:
  33 giữ `published`, 21 về `draft` vì lỗi chặn ngữ nghĩa có sẵn (danh sách ở `docs/navigation.md`).
  `quality:check` 0 lỗi.
- PR [#818](https://github.com/streamentry/kinh-tang-pali/pull/818), head `78ae81f3bbe656782673f539272e89623eecf7de`:
  CI xanh cả run `pull_request` 39859344092 và `push` 39859292088; squash-merge
  `63038b85feddb26138623bed55fe5900d7869b50` (2026-10-22T22:30:18Z). Pages run 39865446300 (build + deploy
  thành công) trên đúng commit đó, deployment `7265975792` (2026-10-22T23:13:16Z).
- Production: 1.610 URL điều hướng đều 200 và trùng byte với build cục bộ; ID nhóm lạ trả 404; tên nhóm
  "Phẩm Đoàn Thực", "Nhóm Mười Một Kệ", "Chương Một Pháp", "Nhóm Hai Kệ"; `sn12.11:0.2` "2. Phẩm Đoàn Thực";
  thag1.2 / thag2.1 / thig7.2 hiện nhãn và banner `draft`, thag1.44 vẫn `published`.

## Phục hồi

Commit trước thay đổi: `d5c9933f9`. Gỡ bằng PR revert `436bb5e3e` qua CI (xem `docs/navigation.md`, mục Phục hồi);
không URL cũ nào phụ thuộc vào tầng này.
