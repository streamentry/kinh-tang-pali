# Tầng nhóm SN / AN / KN

Tài liệu tham chiếu cho tầng điều hướng trung gian của Tương Ưng Bộ, Tăng Chi Bộ và Tiểu Bộ:
nguồn, hợp đồng dữ liệu, lệnh, cách nâng pin, cách phục hồi, và các phát hiện về nội dung có sẵn.
Nghiên cứu nền: [`docs/research/nikaya-middle-layer-2026-10-22.md`](research/nikaya-middle-layer-2026-10-22.md).
Tiến độ triển khai: [`docs/navigation-progress.md`](navigation-progress.md).

## Tầng này là gì, không là gì

- Là **điều hướng**: nhóm tham chiếu UID, không chứa kinh văn. Không thuộc `source/layers.yaml`.
- Không đổi UID, segment ID, anchor, `sourceKey`, URL bài, `order` của catalogue hay
  `CanonDocument.canonicalOrder`. Thứ tự đọc mới là trường `order` riêng trong tệp sinh ra.
- Chỉ có nhóm `traditional`. `edition-volume` và `editorial` được khai trong kiểu dữ liệu để
  sau này thêm thành quan hệ riêng, không sửa đường truyền thống.
- DN và MN không có tầng này; trang và luồng bài trước/sau của hai bộ giữ nguyên.

## Nguồn và pin

`source/navigation.lock.json` ghim `suttacentral/sc-data` tại `4d481d7cfbaeccad19fa85adc215d3c15ff43457`
(trùng commit `legacyHtml`, nhưng là pin riêng: đổi bản tra cứu không được âm thầm đổi cấu trúc nhóm).
Lock liệt kê 50 tệp, mỗi tệp có `gitBlob`, `sha256`, `bytes` và vai trò:

| Vai trò | Tệp | Dùng để |
| --- | --- | --- |
| `readme` | `structure/README.md` | quy tắc upstream: `tree` thay `grouping`/`division` |
| `tree` | `super-tree.json`, `sn-tree`, `an-tree`, 20 cây tác phẩm KN | thành viên và thứ tự nhánh |
| `name-root` | sổ tên Pāli (`super-name`, `sn`, `an`, 20 tác phẩm) | tên Pāli |
| `name-vi` | `translation/vi/site/name/{super-name,sutta/dhp-name}` | tên Việt của SuttaCentral |
| `licensing` | `translation/vi/site/licensing_translation-vi-site.json` | căn cứ giấy phép (licensing:5–6) |

Mọi tệp là tác phẩm của chính SuttaCentral, CC0 1.0 theo licensing:5–6. Không gán CC0 cho
bản dịch bên thứ ba: tên Việt từ mục lục bản dịch của Hòa thượng Thích Minh Châu là `NOASSERTION`
(xem dưới).

KN không có một tệp cây: nút `kn` của `super-tree` liệt kê **20 nút tác phẩm/phân bộ** theo thứ tự
(Apadāna và Niddesa đều tách đôi). Đó là cách SuttaCentral chia, không phải khẳng định "Tiểu Bộ có
20 sách".

## Tên nhóm

Mỗi nút có `name.pali` (sổ tên Pāli, kèm tệp và key) và `name.vi`, hoặc `vi: null` + `viMissing: true`.
Không suy tên từ slug hay số thứ tự của key. Thứ tự ưu tiên tên Việt:

1. **`suttacentral-site`** — tên Việt của SuttaCentral (20 tác phẩm KN). Chỉnh chữ được ghi rõ trong
   `normalized`: `Ð` → `Đ`, bỏ hậu tố `(Pali)`, viết hoa chữ đầu. Không đổi từ nào.
2. **`reference-toc`** — `content/navigation/names/vi-reference.yaml`: 5 thiên, 56 tương ưng (SN)
   và 11 chương (AN), lấy từ mục lục bản dịch của **Hòa thượng Thích Minh Châu**, bản sao trên
   BuddhaSasana (budsas.org). Tác giả đứng trước nơi lấy; `license: NOASSERTION`. Mỗi mục giữ dòng
   mục lục nguyên văn (`entry`). Trang chèn mã theo từng lượt tải nên SHA-256 đổi mỗi lần;
   `lastModified` là dấu ổn định. `npm run navigation:check -- --reference` tải lại và kiểm từng
   `entry` còn nguyên văn (không chạy trong CI vì trang chặn tải tự động không ổn định).
3. **`project-heading`** — tiêu đề trong bản dịch của dự án: đoạn `:0.N` của bài đầu tiên trong
   nhóm mà chữ Pāli **trùng đúng** tên Pāli của nhóm, đọc ở cùng segment ID trong bản Việt. Không khớp
   gần đúng: bilara ghi `Rūpādivagga` ở `an1.1` trong khi cây gọi phẩm đó là `Cittapariyādānavagga`,
   nên phẩm này không lấy tên. Tiêu đề chỉ lặp lại tên Pāli bị từ chối (`untranslated`).

Tiêu đề có lỗi đã biết nằm trong `content/navigation/names/heading-exclusions.yaml`, khoá đúng
nhóm + segment + chữ. Mục bị loại vẫn được ghi trong `viRejected` kèm lý do, và trang nhóm hiện tên
Pāli kèm nhãn cấp. Khi bản dịch được sửa, chữ khác đi và `navigation:check` báo mục loại trừ đã cũ.

Số nhóm chưa có tên Việt đã đối chiếu: SN 9, AN 43, KN 66 (trên 854). Các nhóm này hiện
"Phẩm Āhāravagga", "Nhóm năm mươi Dutiyapaṇṇāsaka"…, và trang nhóm nói rõ đó là tên Pāli.

### Phát hiện về nội dung có sẵn (chưa sửa trong PR điều hướng)

Bằng chứng nằm trong tệp loại trừ; sửa bản dịch là việc riêng, qua quy trình chất lượng:

- `sn12.11:0.2` "2. Phẩm Đoān Thực": "Đoān" mang dấu Pāli; tiêu đề bài cùng tệp viết "Kinh Đoàn Thực".
- 30 tiêu đề nipāta của Theragāthā/Therīgāthā dùng "Bộ N Bài Kinh" (một chỗ "Bài Kính") cho nhóm
  theo **số câu kệ**; Jātaka cùng cấu trúc đã dùng "Nhóm N Kệ" (hội đồng 2026-10-16, C3). Các tiêu đề
  cùng cấp còn lại không thống nhất ("Nhóm Năm", "Tập Sáu", "Phẩm Năm Kệ", "Bộ Bảy Bài Kệ").
- 4 tiêu đề nipāta của Itivuttaka dùng "Bộ N Bài Kinh", trong khi dòng kết của chính bản dịch ghi
  "Phẩm Một Pháp kết thúc" (`iti27:13.5`).
- Dòng kết tương ưng ở SN đôi khi sai tên: `sn2.30:18.5` dịch *Devaputtasaṁyutta* là
  "Tương Ưng Bộ Chư Thiên" (đúng: Thiên Tử). Không dùng dòng kết làm nguồn tên.
- 5 tiêu đề phẩm (`pv13`, `pv26`, `mil5.3.1`, `mil5.4.1`, `mil5.5.1`) để nguyên tên Pāli.

## Hợp đồng dữ liệu

`content/navigation/traditional/{sn,an,kn}.json` — kiểu ở `src/lib/canon/navigation-types.ts`.

- `nodes[id]`: `id`, `collection`, `kind` (đọc từ hậu tố tên Pāli: `division`, `samyutta`, `nipata`,
  `pannasaka`, `vagga`, `peyyala`, `work`, hoặc `section` khi tên không nói), `origin`, `parentId`,
  `depth`, `children` (discriminated union `{type:'group', id}` | `{type:'text', uid, sourceKey}`),
  `name`, `textCount`, `firstUid`, `lastUid`, `treePath`.
- `order`: mọi UID theo duyệt sâu cây nguồn.
- `counts`: đơn vị tách bạch — `texts` là URL đọc, `sourceFiles` là tệp Pāli (= lá cây),
  `bundles`/`textsInBundles` là tệp gộp và URL do chúng phục vụ.

| Bộ | URL đọc | Tệp Pāli | Nhóm (bỏ gốc) | Tệp gộp → URL |
| --- | ---: | ---: | ---: | ---: |
| SN | 1.819 | 1.819 | 300 | 0 |
| AN | 1.781 | 1.408 | 229 | 38 → 411 |
| KN | 2.351 | 2.351 | 325 | 0 |

Một URL có thể là một dải kinh/kệ (`sn12.93-213`, `an5.308-1152`), nên site gọi đơn vị này là
"mục đọc", không phải "bài kinh".

**Thứ tự trong tệp gộp** (`an1.1-10` → `an1.1` … `an1.10`) lấy từ Pāli đã ghim: URL nào sở hữu
segment nào theo `segmentBelongsToUid`, xếp theo segment đầu tiên mỗi URL sở hữu. Không sort chuỗi
UID, không bung dải bằng phép đếm. Mỗi segment phải thuộc đúng một URL; thiếu hay trùng là lỗi.

## Lệnh

| Lệnh | Làm gì | Ghi tệp? |
| --- | --- | --- |
| `npm run navigation:sync` | sparse git checkout vào `.cache/upstream/sc-data-navigation`, kiểm commit → tree → blob → bytes cho 50 tệp | cache |
| `npm run navigation:sync -- --check` | chỉ kiểm cache; exit 1 khi thiếu/lệch | không |
| `npm run navigation:sync -- --remote` | thêm: so lock với danh sách cây của GitHub, từ chối danh sách `truncated` | không |
| `npm run navigation:generate` | dựng ba bộ; chỉ ghi khi cả ba hợp lệ, ghi qua tệp tạm | `content/navigation/traditional/` |
| `npm run navigation:check` | dựng lại trong bộ nhớ, so từng byte, chạy invariants; exit 1 khi lệch | không |
| `npm run navigation:verify` | Python độc lập (không chung code): dựng lại membership, thứ tự (cả tệp gộp), cấp, số đếm, first/last; kiểm mỗi tên Việt với tệp+key nó dẫn, tiêu đề dự án đúng là tên Pāli của nhóm, không bỏ sót tên SuttaCentral/mục lục | không |
| `npm run reading:check` | sau build: mọi phần đọc liên tục chứa đúng segment của các trang bài, một lần, đúng thứ tự; noindex, ngoài Pagefind; đủ 854 trang nhóm | không |

Các kiểm tra trên đều có ca âm trong test (`tests/unit/navigation.test.ts`, `tests/unit/navigation-verifiers.test.ts`).
`generate` và `check` cần cả cache điều hướng lẫn Pāli đã ghim (`npm run source:sync:manifest`);
thiếu cache thì báo đúng lệnh cần chạy. Build website **không** cần cache điều hướng: nó đọc tệp đã
commit, và dừng với thông báo rõ khi tệp sinh ra thiếu một bài của catalogue hay Pāli đã ghim thiếu tệp.
CI chạy `navigation:sync -- --remote`, `navigation:check`, `navigation:verify`, `reading:check`; workflow
Pages chạy lại cùng các cổng đó trước và sau build.

## Website

- `/sutta/{sn,an,kn}/`: mục lục theo nhóm (SN: thiên → tương ưng; AN: 11 chương; KN: 20 tác phẩm),
  rồi "Tất cả bài" theo thứ tự duyệt cây. Các URL `/page/N/` giữ nguyên.
- `/sutta/<bộ>/nhom/<id>/`: 854 trang nhóm — breadcrumb, cấp, phạm vi, tên + nguồn tên, thống kê
  trên UID duy nhất, nhóm con và mục đọc theo thứ tự cây, nhóm liền kề. ID lạ → 404 (không có trang).
- `/sutta/<bộ>/nhom/<id>/doc/` và `/doc/N/`: đọc liên tục cho nhóm mà con đều là bài (669 nhóm,
  756 phần). Ngân sách `CONTINUOUS_READING_BUDGET` (`src/lib/canon/reading-budget.ts`): ≤ 800 đoạn
  Pāli và ≤ 30 bài một phần, đo từ build ngày 2026-10-22 (≈1,4 KB HTML mỗi đoạn). Bài dài hơn ngân
  sách (18 bài KN) chỉ được dẫn link. Trang `noindex`, ngoài sitemap và ngoài Pagefind; số đoạn dẫn
  về đúng segment trên trang bài.
- Trang bài SN/AN/KN: breadcrumb về nhóm; bài trước/sau theo thứ tự duyệt cây; "Mục lục" về nhóm.
- Tìm kiếm: nhóm là loại kết quả riêng (`type: Nhóm`), chỉ lập chỉ mục tên nhóm; kết quả kinh văn
  vẫn trỏ về trang bài. Kết quả có breadcrumb (`trail`).
- Tên lấy từ tiêu đề bản dịch của dự án hiện trong mục lục, breadcrumb và tìm kiếm như một tên Việt; trạng
  thái bản dịch (hiện đều `published`) và segment nguồn ở mục "Nguồn của mục lục này" của trang nhóm.
- Audio nhóm dùng `CollectionAudio` với các mục có MP3 hợp lệ theo thứ tự nhóm, bỏ qua mục chưa có,
  dừng khi hết. SN/AN/KN hiện chưa có audio, nên không trang nhóm nào có trình phát.

## Nâng pin hoặc thêm nhóm

Đổi pin là quyết định biên tập.

1. Sửa `commit` (và `pinnedAt`) trong `source/navigation.lock.json`.
2. `npm run navigation:sync -- --write-lock` — chỉ viết lại danh sách tệp/hash cho commit đã khai.
3. `npm run navigation:generate`, rồi đọc diff của `content/navigation/traditional/*.json`.
4. `npm run navigation:check`, `npm run navigation:verify`, `npm test`. Nếu tiêu đề bị loại trừ đã
   đổi, xem lại và xoá mục trong `heading-exclusions.yaml`.
5. Catalogue đổi (thêm bài) mà cây chưa có lá tương ứng: `generate` dừng với tên tệp nguồn thiếu.
   Không thêm nhóm bằng tay vào JSON sinh ra; nhóm truyền thống chỉ đến từ cây đã ghim.

Tuyển tập biên soạn (`editorial`) sau này phải là tệp riêng có tiêu chí chọn và nhãn "Dự án biên
soạn", không sửa đường truyền thống của bài.

## Phục hồi

- Dữ liệu sinh ra, schema (`NAVIGATION_SCHEMA_VERSION`) và code đọc nằm cùng một commit; không có
  trạng thái nửa cũ nửa mới.
- Tầng này chỉ thêm route mới; URL bài, `/page/N/` và nội dung kinh không đổi. Gỡ bằng **commit
  revert** của PR điều hướng qua PR + CI như mọi thay đổi; không reset lịch sử, không force-push.
- Deploy lại bản ổn định: merge commit revert vào `main`; workflow Pages dựng lại từ đó. Commit cơ
  sở trước thay đổi ghi trong tiến độ.
- Bằng chứng lỗi (log CI, run Pages) giữ nguyên trong lịch sử.
