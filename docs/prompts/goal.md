# GOAL — Dịch trọn Pāli: tầng Việt + lớp English, bằng nhiều agent chạy song song

## MỤC TIÊU

Đưn **100%** khoá Pāli có nội dung của **mọi** bài kinh trong `content/catalog/sutta/`
vào hai tầng dịch của dự án, mỗi bài kèm scorecard hợp lệ, tất cả 13 cổng xanh, và
giao bằng **PR đã merge**:

1. **Tầng Việt** — `content/translation/vi/project/sutta/<c>/<uid>_translation-vi-project.json`
   + `content/meta/sutta/<c>/<uid>.yaml`
2. **Lớp English lấp** — `content/translation/en/project/sutta/<c>/<uid>_translation-en-project.json`
   + `content/meta/en/<c>/<uid>.yaml`

**Không tự dịch lại từ đầu bài đã có.** Bài nào đủ khoá + có scorecard rồi thì việc
còn lại là chấm lại / sửa, không phải dịch.

---

## SỐ ĐO NHIỀU (đo tại `a059dec5`, đừng tin lại)

**Việt** — `npx tsx /Volumes/SSD/opencode-work/vimeas.ts`

| | |
| --- | --- |
| bài đủ mọi khoá | **3.857** |
| bài còn thiếu | **2.279** |
| khoá còn thiếu | **171.951** |

Theo bộ: `sn` 458 bài / 20.892 khoá · `an` 263 bài / 14.898 khoá ·
`kn` 1.558 bài / 136.161 khoá (đã đủ lần lượt 1.360 / 1.518 / 793).

**English** — `npx tsx /Volumes/SSD/opencode-work/engq.ts` và `npm run audit:reference`

| phép đo | kết quả |
| --- | --- |
| `engq`: text còn thiếu English | **376** |
| `engq`: segment còn thiếu English | **6.750** |
| `audit:reference`: text dưới sàn coverage | **137** |
| `audit:reference`: segment **có nội dung** dưới sàn | **3.252** |
| `audit:reference`: "publishes no English at all" | **326** |

**Số cần dùng: 1.596 bài `kn` không có tệp Anh Sujato nào ở commit đã ghim.** Đo trực
tiếp từ `source/upstream-manifest.json` → `english-sujato` (4.291 tệp): 4.355 bài có
tệp `*_translation-en-sujato.json`, **1.596 không có** — và con số này khớp đúng dòng
ghi trong `AGENTS.md`.

⚠️ **990 (`engq`) và 326 (`audit:reference`) là hai tập con khác, đo theo định nghĩa
khác.** Đừng dùng chúng thay cho 1.596, và đừng trộn hai bảng số:

- `engq.textsWithNoEnglishUpstream` = 990 — tập con của 1.596 (có lẽ đã trừ phần đã lấp).
- `audit:reference` "no English at all" = 326 — tập con của 990.

Khi viết báo cáo, **luôn ghi kèm công cụ và định nghĩa** cạnh mỗi con số.

⚠️ **Hai con số 376 và 137 cũng không mâu thuẫn**: `engq` đếm **mọi** segment,
`audit:reference` chỉ đếm segment Pāli **≥ 40 ký tự** (bỏ khối tham chiếu `:0`).

⚠️ **1.596 bài `kn` không có bản Anh là giới hạn upstream**, không phải thiếu sót.
Với chúng: `triangulation ≤ 8.0` cho **cả bài**, `draft` + blocker thật trong
`blocking_errors`. Không nâng điểm để né. Đây cũng là lý do **không có mốc 100% ở cột
English cho 1.596 bài kia** — đừng hứa vô lý trong PR body.

---

## HẠNG ĐỘI NHIỀU AGENT

**Coordinator là chính bạn.** Agent chỉ làm **một lát** rồi báo cáo.

### Vòng lặp

```
1. Đo        → vimeas.ts + engq.ts (trên worktree sạch tại HEAD)
2. Chia lát   → loại bài ĐÃ CÓ bản dịch trước, ưu tiên key-count tăng dần
3. Giao      → 8–14 agent nền, mỗi lát 12–14 bài / 200–280 khoá
4. Gom       → kiểm từng lát, KHÔNG tin lời báo của agent
5. Cổng      → 13 cổng trên worktree sạch ở HEAD, đo trước/sau cùng điều kiện
6. PR + merge→ rồi lặp lại bước 1
```

**Chỉ giao lát mới khi số lát đang chạy < 8.** Đừng cho nghẽn ở disk.

### Cấu trúc lát

- `/Volumes/SSD/opencode-work/<đợt>/<tên>.uids.json` — danh sách uid
- `/Volumes/SSD/opencode-work/<đợt>/<tên>.pali.txt` — **Pāli gốc đã dump sẵn**
- Tên lát = `f12`, `f13`, … cho Việt; `r9`, `r10`, … cho English.

Đã có sẵn: `f1/` (12 lát `f0`–`f11`, **đã giao hết**), `w10/`, `w11/`, `re/`.
Sinh lát mới bằng script `/Volumes/SSD/opencode-work/_mkfleet.py` (`SLICES=n`).

### Vì sao phải loại bài đã có bản dịch trước khi chia lát

Đo được: lát cũ có `thag1.45` thuộc **hai** lát cùng lúc, vì hàng đợi sinh ở hai thời
điểm khác nhau. Agent kia ghi đè phá nguyên văn chung với `thag1.16:1.1`, và **8
scorecard hỏng YAML hẳn** phải vá tay. Chỉ `git status` không thấy bài đã merge ở lát
cũ — phải dựng danh sách từ **tệp trên đĩa**.

---

## LUẬT BẤT DI BẤT DỊCH (viết vào prompt của từng agent)

1. **Pāli là authority cuối cùng.** Anh Sujato và Việt hiện hành chỉ để đối chiếu,
   không bao giờ thắng Pāli. Nguồn: `sourcePath` trong `content/catalog/sutta/*.json`
   → `.cache/upstream/suttacentral/<sourcePath>`.
2. **Mỗi segment là một bản dịch thật**, từ Pāli đang cầm, trong bối cảnh bài. Cấm
   dịch vòng qua English rồi dịch lại; cấm glossing, thay từ máy móc, khuôn, sinh hàng
   loạt, filler để đẩy số coverage.
3. **Tra tiền lệ trước khi viết, kèm đếm:**
   `grep -ro 'từ-khoá' content/translation/vi/project/sutta/ | wc -l`.
4. **Cấm AI slop:** nhịp câu đều, cụm sẵn lặp, mất chủ thể/đối tượng/phủ định/điều
   kiện/số lượng/modality, giải thích lẫn vào thân kinh.
5. **Pāli trùng nguyên văn thì cách dịch phải khớp.** Agent phải tự dựng chỉ mục
   Pāli↔Việt bằng script và **báo số cặp trùng tìm được**.
6. **Đa nghĩa giữ đúng ngữ cảnh** — `aṇḍajā nāgā` → *rồng*; `rañño nāgo rājabhoggo`
   → *voi*; `nāga` ở `thag1.110` → *núi*.
7. **Dấu lược `BRIEF_VI3.md` §10** — Pāli có `…pe…` → giữ **một** `…`; không mở rộng,
   không nén tùy tiện; `(…)` đứng một mình = lỗi chưa dịch.
8. **Tên phẩm đã chốt** — dùng đúng bảng trong `BRIEF_VI3.md` §11. Đặc biệt
   `Dukanipāta` = **Bộ Hai Bài Kinh** (không phải *Tập Kẻ Đau Đớn*), khớp song song
   `Ekakanipāta` = *Bộ Một Bài Kinh*. **Đừng đếm đa số theo chuỗi Việt** — `Phẩm Hai
   Pháp` vừa sai cho `Dukanipāta` vừa đúng cho `Dutiyavagga`; hãy khớp **giá trị Pāli**.
9. **`notes` có HAI dạng** — khối literal `|-` (thụt 2 **hoặc 4**) và danh sách
   `- >-`. **Đọc tệp đích trước khi ghi**, không suy ra. Đây là nguyên nhân hỏng YAML
   nhiều nhất trong đợt trước.
10. **Agent không chạy git, không chạy cổng kỹ thuật, không sửa tệp ngoài lát.**
    Cấm chạy: `git add/commit/push/pr`, `npm run validate|test|check|build`, sửa
    `reference-gaps.yaml` / `source/` / `scripts/` / `src/` / `*.apfs-orphan/`.
11. **Đợt cấm chạy cổng ⇒ `technical_integrity` 9.6, không phải 10.0**, và **phải ghi
    rõ trong `notes`** rằng bốn lệnh đó để coordinator chạy.
12. **Blocker thắng điểm.** `draft` / `review` / `published` theo bảng `AGENTS.md`.
    Không nâng điểm để né blocker, không hạ điểm để tỏ ra thận trọng.
13. **Báo cáo thật khi thất bại.** Không tạo số `??` giả để khớp brief.

---

## SAI LẦM ĐÃ MẮC — ĐỪNG LẶP LẠI

Tất cả đo được trong phiên trước:

| sai lầm | hậu quả | cách chặn |
| --- | --- | --- |
| `ngưỡng 40 ký tự` của `kiểm()` không chạy ở bài kệ ngắn | `cần` rỗng, assertion **không tự chạy** trên `w7` (0/203), `w8` (1/210), `f0` | agent **tự quét mọi khoá từ đĩa** |
| Vá YAML theo **danh sách tay** rồi tin đã xết | sót `thag1.88`, `validate` vẫn đỏ | quét **toàn bộ**, không đụng `*.apfs-orphan/` |
| Giả định thụt `notes` là 2 | hỏng **14** tệp YAML | đọc thụt thật của tệp |
| Script sửa chạy hai lần | **nhân bản** khối `notes` | script phải **idempotent** |
| Dòng chú thích `#` đứng sau khối `notes: \|−` | khối mới rơi ra ngoài, YAML hỏng | chèn trước dòng `#` đầu tiên |
| `git add` theo đường dẫn suy từ tệp bản dịch | cuốn **4 tệp untracked** của agent khác vào PR | kiểm `git status` trước, liệt kê từng đường dẫn |
| `rven88.py` gĩ cứng `/private/.../T/opencode` (đã bị dọn) | **crash**, nhưng agent vẫn báo *"0 cờ"* | **chạy công cụ**, đừng tin lời báo |
| Viết số trong PR bằng phép tính thay vì đo | sai cả hai dòng "trước", 6 lần | đo trên worktree sạch rồi mới viết số |
| Quét bằng `f.split('/')[6]` (là **tên tệp**) | kết luận sai *"0 khoá"* | kiểm lại chỉ số đường dẫn |
| Dùng `sorted()` để sắp khoá | `2.10` trước `2.2` → `ngoặc()` báo sai **356/3.954** tệp | đã sửa `_hvi.py` sang thứ tự số |

**Lời báo của agent là bằng chứng để kiểm, không phải bằng chứng đã kiểm.** Đã có **3**
lần lời báo của agent sai (kể cả lần báo "đã sửa xong một lỗi không tồn tại").

---

## GIAO THẺ VÀ CHẤM ĐIỂM

- Scorecard: đủ **10** tiêu chí, `final_score` = **trung bình số học thô tính bằng
  script** (không gõ tay), `status` khớp quality gate, `blocking_errors` là mảng chuỗi,
  `assessed_by`/`translators` = `"OpenCode Space Bunny Free (agent)"`.
- **Tách "chấm điểm" thành lát riêng** khi agent chết giữa chừng — bài học từ sự cố
  đĩa đầy: 32 tệp dịch sống sót, 32 scorecard mất.
- Lượt **review đối kháng riêng** trước khi chấm: đọc lại Pāli cạnh bản dịch từng cặp.
  Phần lớn lỗi thật chỉ lộ ra ở bước này.

---

## 13 CỔNG (chạy trên **worktree sạch** ở HEAD, không phải repo chính)

```bash
npm run reference:gaps        # sinh lại, rồi copy về
npm run verify:store:write
npm run verify:store:check
npm run validate
npm run test                  # 141 pass
npm run check
npm run reference:gaps:check
npm run catalog:check
npm run manifest:check
npm run license:check
npm run audit:store
npm run audit:reference
npm run build
```

Worktree: `git worktree add -f --detach /Volumes/SSD/_wtX HEAD`, symlink
`node_modules` và `.cache`. **Push từ worktree sạch** — pre-push ECC không còn chạy phần
Node ở repo này (`ecc.prepush.skipNode=true`), nên xanh hay không do **CI** quyết định.
`verify-store.ts` in "No discrepancies…" rồi **exit 1** — phải đọc tới `##[error]` cuối.

Đo trước/sau bằng `vimeas.ts` ở **hai worktree sạch** (`HEAD~1` và `HEAD`), script dùng
đường dẫn **tương đối** (import thư viện phải tuyệt đối).

---

## TÀI NGUYÊN — ĐỌC TRƯỚC KHI GIAO NHIỀU AGENT

```
df -h / /Volumes/SSD
```

`/Volumes/SSD` đang **98% (20 GiB trống)**. Đĩa đầy đã giết hai agent giữa chừng và
làm mất scorecard. **Phải xem cả hai đĩa.** Nếu `/Volumes/SSD` < 30 GiB thì dọn cache
trước, đừng giao thêm agent.

---

## MỐC HOÀN TẤT

- [ ] `vimeas.ts`: **bài còn thiếu = 0**
- [ ] `engq.ts`: `segmentsStillMissingEnglish = 0` trong **376** text có thể lấp
- [ ] đối chiếu chéo: đếm lại từ `source/upstream-manifest.json` và xác nhận
      **1.596** bài `kn` không có tệp Anh Sujato — tất cả phải còn `draft` với blocker
      ghi rõ, **không** nâng lên `review`/`published`
- [ ] `audit:reference`: `texts below floor = 0`, `upstream defect(s) = 0`
- [ ] 13 cổng xanh ở HEAD của `main`
- [ ] `npm run license:check` xanh (`NOTICE` khớp lock)
- [ ] PR đã merge; mỗi PR body có **số đo trước/sả bằng hai lần đo liên tiếp cùng điều kiện**
- [ ] `docs/translation-store.md` và mọi số trong tài liệu **cập nhật theo phép đo mới**
- [ ] `git status` sạch, không còn worktree lưu

**Trong PR body, phải nói rõ** số nào đo được, số nào là ước lượng, và **số nào đã hỏng
trong lúc làm**. Đừng báo cáo thành công khi có thất bại — nếu không thừa nhận, con số đó
là dối trá.%
