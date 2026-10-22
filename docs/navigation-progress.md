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
- Build sau thay đổi: 7.814 trang (= 6.204 + 854 + 756), Astro 74 s, tổng 101,5 s, RSS 4,23 GB;
  Pagefind 6.991 trang (+854 trang nhóm, chỉ tên nhóm: +2.105 từ), 2 bộ lọc. HTML +320 MB
  (dist 5,95 GB), **0** biến thể ảnh mới, **0** JS mới. Trang đọc lớn nhất 1,26 MB (≈90 KB gzip).

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

- 118/854 nhóm chưa có tên Việt đã đối chiếu (SN 9, AN 43, KN 66): hiện tên Pāli + nhãn cấp.
- 35 tiêu đề trong bản dịch dự án có lỗi đã biết (xem `docs/navigation.md`, mục Phát hiện); chưa sửa
  trong PR này.
- Tên từ mục lục budsas.org: `NOASSERTION`; chỉ kiểm lại nguyên văn khi chạy `--reference` cục bộ.

## Tiếp theo

Gate cục bộ đầy đủ → PR → CI đúng head → merge → theo dõi deployment chứa merge commit → kiểm
production. Kết quả sẽ được ghi vào đây.
