# GOAL — Dịch trọn Pāli: tầng Việt + lớp English, bằng nhiều agent chạy song song

## MỤC TIÊU

Đưa **100%** khoá Pāli có nội dung của **mọi** bài kinh trong `content/catalog/sutta/`
vào hai tầng dịch của dự án, mỗi bài kèm scorecard hợp lệ, tất cả 13 cổng xanh, và
giao bằng **PR đã merge**:

1. **Tầng Việt** — `content/translation/vi/project/sutta/<c>/<uid>_translation-vi-project.json`
   + `content/meta/sutta/<c>/<uid>.yaml`
2. **Lớp English lấp** — `content/translation/en/project/sutta/<c>/<uid>_translation-en-project.json`
   + `content/meta/en/<c>/<uid>.yaml`

**Không tự dịch lại từ đầu bài đã có.** Bài nào đủ khoá + có scorecard rồi thì việc
còn lại là chấm lại / sửa, không phải dịch.

---

## TRẠNG THÁI HIỆN TẠI (đo 2026-10-04 tại `b73dc54f`, `main`)

HEAD = `b73dc54f` — "dịch(vi): 40 bài đợt 5a [c44,c46,c47,c48,c50] + sửa 17 khoá do lượt scorecard (#228)".
PR gần nhất đã merge: #228 (đợt 5a), #227 (sửa `pages.yml`), #226 (đợt 4),
#225 (`sync-source` verify tải), #224 (đợt 3), #223 (docs), #222 (đợt 2), #221 (sửa CI).

### Hai nguyên nhân `main` đỏ, và tôi sửa một rồi bỏ sót cái kia

**Lần 1 (PR #221).** `pinned-snapshot.test.ts` quét **toàn bộ** catalogue 6.137 bài, còn
CI chạy `source:sync:used` chỉ tải bài dự án đã có dữ liệu. `skip` guard của test viết
trên tệp Pāli của `mil1` — mà đợt 1 đã dịch `mil1`, nên `--used` bắt đầu tải tệp đó,
guard thôi bỏ qua, test chạy với corpus thiếu dữ liệu. Sửa: `source:sync:manifest`.

**Lần 2 (PR #227).** `main` vẫn đỏ vì **cùng lỗi đó** tồn tại trong
`.github/workflows/pages.yml` — job `build` riêng chạy `source:sync:used` rồi chạy
đúng bộ test đó. Tôi sửa một chỗ thấy được mà không quét hết chỗ còn lại, nên lỗi tự
nhân bản. Đã quét lại toàn bộ `.github/workflows/`: không còn workflow nào vừa sync
`used` vừa chạy test.

**Hai nguyên nhân độc lập, không phải một.** PR #225 thêm kiểm presence cho `sync-source`:
trước đó nhánh manifest biến `NotCoveredError` (404) thành `ok: true`, nên một path trong
manifest mà upstream 404 bị coi là **đã sync xong** và vắng mặt im lặng cho tới khi test
đổ. PR #225 không bắt được lần đỏ thứ hai — đúng như nó phải vậy, vì path thiếu lần đó
nằm **ngoài scope `used`**, không phải path tải hỏng.

### Đợt 1 sai quy trình; từ đợt 2 trở đi đều qua PR

Đợt 1 (112 bài Việt + 24 bài English lấp) đã **đẩy thẳng lên `main`** — sai quy
trình, và nó làm `main` đỏ. Từ đợt 2 (PR #222) trở đi: nhánh → CI xanh → squash
merge. Không còn lát nào đẩy thẳng lên `main`.

**Bài học để nhớ: chính việc dịch thêm đã làm một test bị bỏ qua trở lại chạy.**
Đừng viết `skip` guard lên một bài cụ thể mà lát sau có thể dịch tới.

**CI xanh ở `main`** — run `37165678349` pass đủ 17 step, gồm hai step mới
(`Reference coverage audit`, `Glossary terminology check`). Lưu ý một lần đỏ giả:
run push của nhánh `chore/ci-is-the-gate` từng fail ở `manifest:check` do GitHub API
403 rate limit (hạ tầng, không phải code) — run PR-context cùng commit pass nên merge
vẫn đúng.

**Cổng local tại HEAD** (worktree sạch ở `b73dc54f`) — **13/13 xanh**:

```
reference:gaps 738 gap (chạy 2 lần, lần 2 không đổi ⇒ idempotent)
reference:gaps:check ✓  738 gap / 5.103 text
verify:store:write ✓    verify:store:check ✓  (cache complete, đã so cả full-sync)
validate ✓ 0 lỗi / 1.530 cảnh báo      test ✓ 141 pass / 0 fail      check ✓
catalog:check ✓ 6.137/6.137              manifest:check ✓            license:check ✓
audit:store ✓  không orphan, không shadowing, không đảo authority
audit:reference ✓  0 upstream defect
build ✓
```

**Việt** — `node --import tsx /Volumes/SSD/opencode-work/vimeas.ts`
(`npx` bị chặn bởi pkg-age-guard, phải gọi `node --import tsx` trực tiếp)

| | `a059dec5` (cũ) | `1e39dd88` | `9a0aa4e9` | **`b73dc54f` (nay)** |
| --- | --- | --- | --- | --- |
| catalogue | — | 6.137 | 6.137 | **6.137** (dn34/mn152/sn1819/an1781/kn2351) |
| bài đủ mọi khoá | 3.857 | 4.679 | 4.817 | **5.006** |
| bài còn thiếu | 2.279 | 1.457 | 1.319 | **1.130** |
| khoá còn thiếu | 171.951 | 153.580 | 149.294 | **142.327** |

Đo **hai lần liên tiếp trên hai worktree sạch**, hai lần ra kết quả giống hệt.
Mốc "trước" là commit trước cả các commit của PR, **không phải `HEAD~1`** — vì PR
có nhiều commit thì `HEAD~1` đã chứa sẵn đợt đó và đo ra 0.

Còn thiếu: `sn` 207 bài / 13.918 khoá (đủ 1.611) · `an` 161 / 11.926 (đủ 1.620) ·
`kn` 762 / 116.483 (đủ 1.589) · `dn`+`mn` đủ 100% (34, 152).

### ⚠️ Cần HAI lớp kiểm độc lập, không phải 13 cổng là đủ

Cả 13 cổng xanh **không bắt được** hai lớp lỗi sau. Cả hai đều bắt được lỗi thật.

**Lớp 1 — bộ dòm tỉ lệ Việt/Pāli** (đo tỉ lệ ký tự mỗi segment so với trung vị của
chính bài đó; cờ khi lệch >4× hoặc <0.25× và Pāli ≥ 80 ký tự). Đợt 3 phát hiện
**15 bài / 25 đoạn**, đọc cả bài thì thêm 51 đoạn. **15/15 là lỗi thật, 0 dương giả** —
kể cả một mục tôi tự tin là dương giả (`an3.62:10.2`: đúng là câu hỏi, nhưng cụt mất
`pahānāya samatikkamāya saṁvattati` và không có `…` đánh dấu chỗ bị cắt, nên câu hỏi
không còn trả lời được).

**Lớp 2 — agent scorecard chạy SAU khi đã commit bản dịch.** Đợt 5 bắt được **43 khoá**
ở **mức bịa nội dung**: `pupphavasso` → *"mùa xoài"*, `Chattiṁsakkhattuṁ` (30) →
*"sáu lần"*, `Vasīsatasahassehi` → *"ba trăm nghìn ngựa"* (sai số **và** bịa danh từ),
`brahāraññe` → *"nước lớn"* (rừng), `vaṅkeyya` → *"chỗ nấp náu"* (nghĩa đúng: trò
đánh lừa). Còn một lỗi **đảo xưng ngô thứ bật**: `sn41.2:4.4` Tôn giả nói với đệ tử
nhỏ nhất mà dùng *"con"*.

⚠️ **Bộ dòm của lớp 1 có độ chính xác thấp nếu không lọc.** Bản đầu tiên tôi viết dòm
"nội dung Việt trùng nhau" thì ra **1.751 bài** — vì kinh Bộ Trường Bộ lặp công thức là
bình thường. Chỉ khi lọc theo **tỉ lệ so với trung vị của chính bài** mới xuống 25 đoạn.
Và phải tính trung vị trên **mọi** đoạn, không lọc trước — bản lọc Pāli ≥100 ký tự
trước rồi mới tính trung vị thì **bỏ sót chính `sn22.93`** vì nó có ít đoạn dài.

⚠️ **Luật "Pāli trùng thì dịch trùng" truyền cả lỗi.** `sn51.14:5.17` khớp byte-for-byte
với `sn51.31:4.2`, và cả hai bản Việt đều có **hai chữ "hoặc"** không có trong Pāli — lỗi
được **sao chép từ bài ngoài lát**. Luật đúng phải là: *trùng thì khớp, **trừ khi** bản
tham chiếu sai thì sửa cả hai và ghi rõ*.

⚠️ **Mọi file sinh ra bởi cổng đều phải được commit.** Tôi từng chạy `reference:gaps` trong
worktree tạm rồi không đưa kết quả về commit: `npm test` local xanh (đọc file trong
worktree tạm) còn CI đỏ — test `every text below the coverage floor is recorded` bắt
đúng.

⚠️ **`vimeas` chỉ đo "đủ khoá", không đo trung thành.** Đợt 2 đã dùng một bộ dòm
riêng (tỉ lệ ký tự Việt/Pāli lệch khỏi trung vị của chính bài) và tìm ra
**25 đoạn / 15 bài** có lỗi mà `validate` không thấy:
đoạn bị cụt thành stub + `…` (nặng nhất `an6.53:3.1` mất hẳn *"ubho atthe
samadhiggayha"*), dấu lược `…pe…` bị bung ra (`an3.61:6.7`: 105 ký tự Pāli → 458
ký tự Việt), và nội dung tràn sang khoá kề bên (`sn22.93`: `1.2` diễn 5 loài cây Pāli
thành một cụm tự bịa **lặp 5 lần**, `1.3` chỉ có *"Cũng vậy,"* cho 178 ký tự Pāli).
**Bài nào "đủ mọi khoá" không đồng nghĩa bài đó đúng** — đừng báo cáo
`vimeas` như một lời bảo đảm.

⚠️ **`an` có 10 bài đã có bản dịch nhưng chưa có scorecard**: `an5.181`–`an5.190`
có `content/translation/vi/project/sutta/an/*.json` nhưng thiếu
`content/meta/sutta/an/*.yaml` (chiều ngược lại không thiếu). Việc còn lại của 10 bài
này là chấm + scorecard, không phải dịch — và lát mới phải loại chúng khỏi hàng đợi
dịch như mọi bài đã có.

**English** — `node --import tsx /Volumes/SSD/opencode-work/engq.ts` và `npm run audit:reference`

| phép đo | `1e39dd88` | `9a0aa4e9` | **`b73dc54f`** |
| --- | --- | --- | --- |
| `engq`: text có English đã ghim | 3.843 | 3.843 | 3.843 |
| `engq`: text còn thiếu English | 376 | 354 | **354** |
| `engq`: segment còn thiếu English | 6.750 | 6.640 | **6.640** |
| `engq`: text dưới sàn | 229 | 216 | **216** |
| `engq`: `noEnglishEditionUpstream` / đã ghi nhận | 1.596 / 1.596 | 1.596 / 1.596 | **1.596 / 1.596**, `agreesWithStoreVerification true` |
| `audit:reference --used`: text dưới sàn coverage | 146 | 143 | **147** (trong 4.100) |
| `audit:reference` **toàn catalogue**: text dưới sàn | — | 216 | **216** |
| `audit:reference`: "publishes no English at all" | 852 | 907 | **1.003** |

⚠️ **Con số cần đuổi về 0 là 216, không phải 143/147.** `audit:reference` luôn chạy
với `--used` (xem `package.json`), nên trong CI nó chỉ đo 4.100 bài đã có dữ liệu
dự án. Chạy `node --import tsx scripts/audit-reference.ts` (không cờ) ra
`scope all-catalog · 216 of 4540` — đúng bằng `engq`. 73 bài kia chưa có bản dịch
Việt nên chưa vào record gap. Tôi từng ghi trong PR #222 rằng 143 và 216 "lệch
nhau chưa giải thích"; **đã giải thích: cùng một phép tính, khác phạm vi.**

Và 143 → 147 trong hai lần đo gần nhau: cổng đo theo **scope `used`**, mà scope ấy
**phình ra mỗi khi thêm bài**. Nên `147` tại `b73dc54f` không phải 216 tiến triển —
đừng đọc nó như vậy.

⚠️ **`--all` trong `audit:reference` không hoạt động** như tên cờ: mã kiểm
`args.includes('--used')` nên `npm run audit:reference -- --all` vẫn ra
`scope used`. Muốn toàn catalogue phải bỏ hẳn `--used`. Chưa sửa — đừng mất
một lượt chạy như tôi đã mất.

**Số cần dùng: 1.596 bài `kn` không có tệp Anh Sujato nào ở commit đã ghim.**
`engq` nay tự báo `noEnglishEditionUpstream 1596` và `agreesWithStoreVerification
true`, khớp đúng `AGENTS.md` — hết thời phải đối chiếu tay.

⚠️ **907 / 990 / 1.596 là ba lát cắt khác nhau của cùng một thực tế**, đừng dùng thay nhau:
- 1.596 = toàn bộ bài không có tệp `*_translation-en-sujato.json` (đo từ `source/upstream-manifest.json`).
- 990 = tập con trong scope hẹp của `engq`.
- 907 = tập con trong scope `--used` của `audit:reference` (chỉ bài đã có dữ liệu dự án); số này **tăng theo mỗi wave vì scope phình ra**, không phải vì upstream mất thêm bản Anh.

Khi viết báo cáo, **luôn ghi kèm công cụ + scope + định nghĩa** cạnh mỗi con số.

⚠️ **354 và 3.318 cũng không mâu thuẫn**: `engq` đếm **mọi** segment,
`audit:reference` chỉ đếm segment Pāli **≥ 40 ký tự** (bỏ khối tham chiếu `:0`),
và phạm vi là `used` so với toàn catalogue.

⚠️ **1.596 bài `kn` không có bản Anh là giới hạn upstream**, không phải thiếu sót.
Với chúng: `triangulation ≤ 8.0` cho **cả bài**, `draft` + blocker thật trong
`blocking_errors`. Không nâng điểm để né. Đây cũng là lý do **không có mốc 100% ở cột
English cho 1.596 bài kia** — đừng hứa vô lý trong PR body.

**Lớp English của dự án** (`content/translation/en/project`, kèm đủ `content/meta/en`):
**641 tệp trên đĩa** — dn 4 / mn 30 / sn 333 / an 147 / kn 127.
`audit:store` báo **517 text / 1.904 segment** trong scope `used`; hai số khác nhau
vì 641 là đếm tệp còn 517 là đếm text trong phạm vi 5.103 bài — ghi rõ phạm vi khi
báo cáo.

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

Đã có sẵn: `f1/`–`f9/` (f1 gồm 12 lát `f0`–`f11`, **đã giao hết**), `w10/`, `w11/`,
`w22/`, `re/`, `rv/`. `f9/` mới nhất tới `f199` (`f196`+`f197` đã merge ở #219) —
lát tiếp theo bắt đầu từ `f200`.
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

`/Volumes/SSD` đang **9% (853 GiB trống)** — đã qua thời 98%/20 GiB từng giết agent
giữa chừng và làm mất scorecard. **Vẫn phải xem cả hai đĩa** trước khi giao
(`df -h / /Volumes/SSD`); quy tắc cũ (< 30 GiB thì dọn cache trước, đừng giao thêm
agent) giữ nguyên.

`/Volumes/SSD/_wt1` là worktree lưu từ wave54 (detached tại `2e359f4d`, chỉ còn
`.cache` + `node_modules` untracked) — dọn trước khi mở worktree mới:
`git worktree remove --force /Volumes/SSD/_wt1`.

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
