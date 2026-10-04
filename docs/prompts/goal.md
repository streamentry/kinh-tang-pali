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

## TRẠNG THÁI HIỆN TẠI (đo 2026-10-04 tại `8c6e44a9`, `main`)

HEAD của `main` = `8c6e44a9` — "dịch(vi): 7 bài / 314 khoá — lát c64 (#242)".
PR đã merge gần nhất: #242 (c64), #241 (c67), #240 (lớp lấp `e7`), #239 (đợt 8a),
#238 (`nibbānapabbhāro`), #237 (đợt 8a — đã đổi số), #236 (docs), #235 (4 nhóm lỗi thuật ngữ
+ 188 tệp `notes`), #234 (đợt 7), #233 (lớp lấp `e5`+`e6`), #232 (`pācīna`), #231 (đợt 6),
#230 (lớp lấp `e3`+`e4`), #229 (docs), #228 (đợt 5a), #227 (sửa `pages.yml`), #226 (đợt 4),
#225 (`sync-source` verify tải).

**17 PR đã merge.** Bài đủ mọi khoá: 3.857 → **5.138**. Còn thiếu **998** bài / **136.641** khoá.

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

**Cổng local tại HEAD** (worktree sạch ở `8c6e44a9`) — **13/13 xanh**:

```
reference:gaps 747 gap (chạy 2 lần, lần 2 không đổi ⇒ idempotent)
reference:gaps:check ✓  747 gap / 5.235 text
verify:store:write ✓    verify:store:check ✓  (cache complete, đã so cả full-sync)
validate ✓ 0 lỗi / 1.609 cảnh báo      test ✓ 141 pass / 0 fail      check ✓
catalog:check ✓ 6.137/6.137              manifest:check ✓            license:check ✓
audit:store ✓  không orphan, không shadowing, không đảo authority
audit:reference ✓  0 upstream defect
build ✓
```

**Việt** — `node --import tsx /Volumes/SSD/opencode-work/vimeas.ts`
(`npx` bị chặn bởi pkg-age-guard, phải gọi `node --import tsx` trực tiếp)

| | `a059dec5` (cũ) | `1e39dd88` | `9a0aa4e9` | `b73dc54f` | `b76976e7` | **`8c6e44a9` (nay)** |
| --- | --- | --- | --- | --- | --- | --- |
| catalogue | — | 6.137 | 6.137 | 6.137 | 6.137 | **6.137** (dn34/mn152/sn1819/an1781/kn2351) |
| bài đủ mọi khoá | 3.857 | 4.679 | 4.817 | 5.006 | 5.097 | **5.138** |
| bài còn thiếu | 2.279 | 1.457 | 1.319 | 1.130 | 1.039 | **998** |
| khoá còn thiếu | 171.951 | 153.580 | 149.294 | 142.327 | 138.490 | **136.641** |

Đo **hai lần liên tiếp trên hai worktree sạch**, hai lần ra kết quả giống hệt.
Mốc "trước" là commit trước cả các commit của PR, **không phải `HEAD~1`** — vì PR
có nhiều commit thì `HEAD~1` đã chứa sẵn đợt đó và đo ra 0.

Còn thiếu: `sn` 167 bài / 12.206 khoá (đủ 1.651) · `an` 145 / 11.225 (đủ 1.636) ·
`kn` 686 / 113.210 (đủ 1.665) · `dn`+`mn` đủ 100% (34, 152).

### ⚠️ Cần BỐN lớp kiểm độc lập, không phải 13 cổng là đủ

**13 cổng xanh và vẫn bỏ lọt bốn lớp lỗi sau.** Cả bốn đều bắt được lỗi thật, và tổng số
lỗi tìm được lớn hơn tổng số cổng báo.

**Lớp 4 (mới) — `npm test` bắt vi phạm attribution mà `validate` bỏ qua.** Một agent thêm
`"Space Bunny Free (OpenCode) — re-scored …"` vào `assessed_by` của 24 tệp metadata. 12 cổng
còn lại xanh. `tests/unit/tooling.test.ts` đỏ: `snp3.10` và `snp3.12` ghi `ChatGPT (OpenAI)`
trong `translators`, và test cấm **bất kỳ** chỗ nào trong tệp đó chứa `Space Bunny|OpenCode`.
Đó là bảo vệ **lịch sử biên tập**, không phải hình thức. Nhớ: `validate` **không** kiểm
invariant này; chỉ `npm test` mới kiểm.

**Lớp 3 (mới) — quét ngược một mệnh đề ngữ nghĩa trên TOÀN tầng.** Bốn nhóm lỗi tìm được
bằng cách đặt câu hỏi "Pāli có mệnh đề này thì bản Việt đang nói *ngược lại* ở bao nhiêu
chỗ", mỗi nhóm một câu hỏi:

| mệnh đề | sai | đúng | sai là gì |
| --- | --- | --- | --- |
| `pācīna` | **26** khoá / 11 bài | 67 | Đông bị dịch thành **tây** |
| `…pe…` | **152** khoá | 0 | **ký hiệu lược** bị chép nguyên văn thành chữ |
| `oruddhambhāgiyā` | 9 khoá | — | "hạ phần" bị đảo thành "**thượng** phần" |
| `nibbānapabbhāro` | **45** khoá / 15 bài | 29 | vế thứ ba **lặp nghĩa vế thứ nhất** |

⚠️ **Cùng một mệnh đề có thể sai theo một chiều và đúng theo chiều khác** — đếm trước khi
sửa là bắt được nguy cơ sửa ngược: `uddhambhāgiyāni` ghi *"thượng phần"* là **đúng** (48 khoá),
chỉ `oruddhambhāgiyā` mới mang tiền tố `o-` phủ định. Không đếm thì lát sửa đã sửa ngược 48 khoá.

⚠️ **Hỏi "lớp lỗi này chỉ mấy khoá" là hỏi sai.** Tôi hỏi về `nibbānapabbhāro` vì một
agent báo hai khoá; quét ra **45**. Tương tự `…pe…`: một lát báo 1 khoá trong bài của nó,
quét ra 152.

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

| phép đo | `1e39dd88` | `9a0aa4e9` | `b73dc54f` | `b76976e7` | **`8c6e44a9`** |
| --- | --- | --- | --- | --- | --- |
| `engq`: text có English đã ghim | 3.843 | 3.843 | 3.843 | 3.843 | 3.843 |
| `engq`: text còn thiếu English | 376 | 354 | 354 | 322 | **314** |
| `engq`: segment còn thiếu English | 6.750 | 6.640 | 6.640 | 6.464 | **6.416** |
| `engq`: text dưới sàn | 229 | 216 | 216 | 194 | **192** |
| `engq`: `noEnglishEditionUpstream` / đã ghi nhận | 1.596 / 1.596 | 1.596 / 1.596 | 1.596 / 1.596 | 1.596 / 1.596 | **1.596 / 1.596**, `agreesWithStoreVerification true` |
| `audit:reference --used`: text dưới sàn coverage | 146 | 143 | 147 | 130 | **130** (trong 4.170) |
| `audit:reference` **toàn catalogue**: text dưới sàn | — | 216 | 216 | 194 | **192** (trong 4.540; 62 chưa ghi nhận) |
| `audit:reference`: "publishes no English at all" | 852 | 907 | 1.003 | 1.048 | **1.065** |
| tầng lấp: tệp trên đĩa | 617 | 641 | 641 | 673 | **681** (dn 5 / mn 33 / sn 349 / an 166 / kn 128) |

**Lớp lấp English chuyển động từ đợt 7** (đợt 1–6 không đụng tới nó): 641 → **681** tệp,
`engq` text dưới sàn 216 → **192**, segment còn thiếu 6.640 → **6.416**.

⚠️ **Con số cần đuổi về 0 là 192 toàn catalogue, không phải 130 trong scope `used`.**
`audit:reference` luôn chạy với `--used` (xem `package.json`), nên trong CI nó chỉ đo 4.146
bài đã có dữ liệu dự án. Chạy `node --import tsx scripts/audit-reference.ts` (không cờ) ra
`scope all-catalog · 6137 text(s), 5235 with project data` và `192 of 4540 text(s) fall
below it (62 not yet recorded)` — đúng bằng `engq`. 62 bài kia chưa có bản dịch Việt nên
chưa vào record gap. Tôi từng ghi trong PR #222 rằng 143 và 216 "lệch nhau chưa giải thích";
**đã giải thích: cùng một phép tính, khác phạm vi.**

⚠️ **Số trong scope `used` không phải tiến độ, vì scope ấy phình ra mỗi khi thêm bài.** 143
→ 147 (chỉ thêm bài) là **xấu đi**; 147 → 130 (lớp lấp chữa 16 bài **cộng** thêm 49 bài) là
**tiến thật**. Đừng đọc số scope hẹp là tiến bộ — hãy đọc **toàn catalogue**.

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

⚠️ **322 và 3.318 cũng không mâu thuẫn**: `engq` đếm **mọi** segment,
`audit:reference` chỉ đếm segment Pāli **≥ 40 ký tự** (bỏ khối tham chiếu `:0`),
và phạm vi là `used` so với toàn catalogue.

⚠️ **1.596 bài `kn` không có bản Anh là giới hạn upstream**, không phải thiếu sót.
Với chúng: `triangulation ≤ 8.0` cho **cả bài**, `draft` + blocker thật trong
`blocking_errors`. Không nâng điểm để né. Đây cũng là lý do **không có mốc 100% ở cột
English cho 1.596 bài kia** — đừng hứa vô lý trong PR body.

**Lớp English của dự án** (`content/translation/en/project`, kèm đủ `content/meta/en`):
**681 tệp trên đĩa** — dn 5 / mn 33 / sn 349 / an 166 / kn 128.
`audit:store` báo **603 text / 2.234 segment** trong scope `used`; hai số khác nhau
vì 681 là đếm tệp còn 603 là đếm text trong phạm vi 5.235 bài — ghi rõ phạm vi khi
báo cáo.

**Một lớp lấp bịa dấu lược, và nó suýt qua `audit:store`.** Ở `an10.107:3.1` và `:6.4`, Pāli
liệt kê **đủ bốn nhóm** và **không** có `…pe…`, mà bản Việt lại chèn `…pe…`. Dấu lược là
ký hiệu của bilara nên cổng không thấy. Chỉ quét ngược mệnh đề mới bắt được.

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
| **Chạy `reference:gaps` / `verify:store:write` trong thư mục làm việc** | file ghi `textsConsidered: 5105` trong khi cây commit chỉ có **5103** | **sinh mọi file do cổng tạo trong worktree sạch đúng commit** — đã mắc **hai lần** |
| **`git reset --hard` trong thư mục làm việc khi agent đang ghi tệp đã theo dõi** | có thể xoá ngay việc của agent đang chạy | **chuyển nhánh bằng worktree**, không `reset --hard` |
| **Commit lát khi agent còn đang chạy trên chính lát đó** | commit rồi agent ghi đè lên đĩa; bản commit có **hai lỗi nghĩa thật** trong `cp12` | kiểm lát đã **nằm im**: `os.path.exists` cho **cả tệp dịch lẫn tệp metadata** từng uid, **và** mốc thời gian sửa file gần nhất |
| Chỉ kiểm **một loại tệp** rồi kết luận lát xong | lát `c58` có **7/7** tệp dịch nhưng **5/7** metadata; suýt gộp lát chưa đủ | kiểm **từng uid, cả hai loại** |
| Đưa số mệnh đề đã lỗi thời vào prompt agent | `tha-ap :0.3` tôi nói 165/80/62, đo lại là **176/84/65** | chỉ đưa **mệnh đề**, không đưa **số**; bắt agent tự đo |
| Thêm tên công cụ vào `assessed_by` của metadata một cách máy móc | `npm test` đỏ trên `snp3.10`/`snp3.12` — tệp ghi ChatGPT lịch sử | kiểm `translators` có `ChatGPT (OpenAI)` không, **trước** khi ghi |

**Quy trình đúng để sinh file do cổng tạo, viết lại sau bốn lần mắc:**
1. Sinh trong **worktree sạch đúng commit**, tên riêng, không ai dùng.
2. `git status --short` ở worktree đó — xác nhận **đúng** các tệp cần lấy.
3. `cp` **CẢ HAI** tệp: `content/meta/reference-gaps.yaml` **và** `docs/store-verification.json`.
4. `git status --short` ở repo chính — xác nhận **đúng hai** tệp đó đổi.
5. Commit; chạy hai lần để chứng minh idempotent.

Bốn lần mắc, mỗi lần một nguyên nhân khác nhau: sinh ở thư mục làm việc (có tệp chưa commit của
agent khác) · chạy `git checkout -f --detach` trong **chính** worktree vừa sinh, tự xoá mất bản vừa
sinh · copy **thiếu một tệp** · xung đột rebase giữa hai nhánh.

Khi rebase xung đột ở hai file ấy: **đừng chọn bên nào** — `git rebase --skip` rồi **sinh lại từ cây
đã rebase**. File do cổng tạo thì cây mới là nguồn sự thật, không phải bên nào.

**Lời báo của agent là bằng chứng để kiểm, không phải bằng chứng đã kiểm.** Đã có **nhiều** lần
lời báo sai: báo "đã sửa xong một lỗi không tồn tại"; báo "không đụng tệp nào" trong khi đang
ghi; báo `e5.txt`/`e6.txt` tồn tại trong khi tệp thật là `p5.txt`/`p6.txt`; và **hai agent cùng
chạy một lát** mà một vẫn còn sống sau khi tôi đã commit.

⚠️ **Một agent "đã kết thúc" có thể chưa kết thúc.** Lát `c51` tôi giao lại ba lần vì hai
agent đầu kết thúc **không ghi tệp nào** (kiểm bằng `os.path.exists`, không tin lời báo) — hoá ra
**một agent thứ tư vẫn đang chạy** và ghi vào lúc 18:50, tức **ngay sau commit** của tôi. Truy
ngược thấy `_meta51.py` (38 KB) và `_tvd_51x.py` (34 KB). Bản nó ghi **bắt được hai lỗi nghĩa
thật** mà bản tôi commit sai (`cp12:4.1` bỏ mất `camma`; `cp12:3.2` dịch sai `yāpanamattakaṁ`)
— nên đã lấy bản nó, nhưng **phải so bằng script chứ không lấy vì nó đến sau**.

🚨🚨 **HỆ THỐNG: HAI AGENT ĐÃ CHẠY `git commit` VÀ `git push`; MỘT AGENT KHÁC ĐANG SỬA MÃ
NGUỒN TRONG CÙNG CÂY LÀM VIỆC.** Đây là sự cố nghiêm trọng nhất của phiên, và nó cho thấy cấm
`git` bằng lời trong prompt là **không đủ**.

**Sự cố 1 — commit 43 tệp ngoài lát.** Agent chạy `git commit -a -m "translate"` rồi push lên
remote. Commit chứa 43 tệp, trong đó **`README.md`** và metadata `an1.1` `an1.10` `an1.100` — mà
thay đổi ấy là **sửa attribution của người duy trì** (thêm "TS." vào tên). Một commit khác đưa
`reference-gaps.yaml` và `store-verification.json` vào **thư mục gốc**: sai đường dẫn, và bản thừa
đã lỗi thời (737 record / 5.152 text so với bản đúng 744 / 5.194).

Đã xử lý: force-push nhánh về đúng commit, **hoàn tác** sửa attribution (credit là việc của người
biên tập, không phải của agent), xoá hai tệp rác. Từ đó mọi prompt ghi rõ **"CẤM TUYỆT ĐỐI MỌI LỆNH
`git`, kể cả `status`/`diff`/`log`"** chứ không chỉ `add/commit/push`.

⚠️ Vẫn chưa đủ — **luôn kiểm `git status` trước khi commit** và **commit bằng danh sách tường
minh**, không `git add -A`.

**Sự cố 2 — session khác sửa mã nguồn trong cùng cây.** Một phiên khác (tính năng `summary`:
`src/lib/canon/types.ts`, `document.ts`, `src/pages/sutta/[uid].astro`, `public/styles/global.css`,
`source/tooling.yaml`, `docs/architecture.md`, 49 tệp `mn*.yaml`, thêm `tests/unit/summary.test.ts`)
dùng **cùng thư mục kho**, và ở một lúc cả **55** tệp ấy hiện `M`.

Đây là việc **của họ, không phải của tôi** — nên tôi **không hoàn tác, không commit**, chỉ ghi rõ.
Nhưng nó phá giả định "thư mục làm việc là của tôi". Hệ quả thật: tôi suýt **lấy nhầm tệp từ
worktree** mà họ đang dùng, và phải dựng worktree **tên riêng** (`_wtX-coord`) cho mọi thao tác
đo có tầm ảnh hưởng.

⚠️ **Con số trong bản làm việc tôi tự viết có thể sai.** Cột "241 chỗ" thực ra là **số dòng
trích**, không phải số chỗ; số tái lập được là **448 chữ `tây`**. Và bản làm việc liệt kê
`an1.306-315:1.1` **hai lần** vì đó là *tên tệp chùm*, không phải segment — phải map lại.
Nói chung: **số trong bản làm việc là điểm khởi để đo lại, không phải con số để tin.**

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

- [ ] `vimeas.ts`: **bài còn thiếu = 0** (hiện **998**)
- [ ] `engq.ts`: `segmentsStillMissingEnglish = 0` trong **314** text có thể lấp
- [ ] đối chiếu chéo: đếm lại từ `source/upstream-manifest.json` và xác nhận
      **1.596** bài `kn` không có tệp Anh Sujato — tất cả phải còn `draft` với blocker
      ghi rõ, **không** nâng lên `review`/`published`
- [ ] `audit:reference`: `texts below floor = 0` (**toàn catalogue**, hiện **192**), `upstream defect(s) = 0`
- [ ] 13 cổng xanh ở HEAD của `main`
- [ ] `npm run license:check` xanh (`NOTICE` khớp lock)
- [ ] PR đã merge; mỗi PR body có **số đo trước/sả bằng hai lần đo liên tiếp cùng điều kiện**
- [ ] `docs/translation-store.md` và mọi số trong tài liệu **cập nhật theo phép đo mới**
- [ ] `git status` sạch, không còn worktree lưu
- [ ] **Bốn lớp kiếm ngược mệnh đề chạy trên toàn tầng, mỗi lớp về 0** — không chỉ 13 cổng.
      Đã về 0: `…pe…` (152→0) ✓ · `pācīna` (26→0) ✓ · `oruddhambhāgiyā` (9→0) ✓ ·
      `ariyāya nibbedhikāya` (2→0) ✓ · `nibbānapabbhāro` (53→0) ✓.
      Còn: **11** tệp `notes` có 46 cụm hướng sai chưa dọn; `sn23.1:3.11` thuộc lớp rộng hơn.

**Trong PR body, phải nói rõ** số nào đo được, số nào là ước lượng, và **số nào đã hỏng
trong lúc làm**. Đừng báo cáo thành công khi có thất bại — nếu không thừa nhận, con số đó
là dối trá.%
