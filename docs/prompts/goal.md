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

## TRẠNG THÁI HIỆN TẠI (đo 2026-10-05 tại `e45ebbb3`, `main`)

HEAD của `main` = `e45ebbb3` — "đợt 17: 6 bài Việt / 316 khoá + 12 bài lớp lấp / 120 segment (#263)".

PR đã merge gần nhất: #261 (đợt 16) · #260 (đợt 15) · #259 · #258 · #257 · #256 (đợt 14) · #255 ·
#254 (đợt 13) · #253 (đợt 12) · #252 (đợt 11) · #251 · #250 · #249 · #248 · #247 · #246 · #245 ·
#244 · #243 · #242 · #241 · #240 · #239 · #238 · #237 · #236 · #235 · #234 · #233 · #232 ·
#231 · #230 · #229 · #228 · #227 · #226 · #225.

**30 PR đã merge.** Bài đủ mọi khoá: 3.857 → **5.321**; còn thiếu **815** bài / **128.657** khoá.
Lớp lấp `english-project`: còn **247** text / **5.942** segment thiếu; **153** text dưới sàn
coverage. Record `reference-gaps` **784** / 5.418 text. `test` **143 pass**.

Số tuyệt đối **đổi theo thứ tự merge**, nên hai tệp do cổng sinh (`reference-gaps.yaml`,
`store-verification.json`) **phải sinh lại trên cây đã merge** trong worktree sạch, không dùng bản
sinh trước đó.

### ✅ Chính sách `tha-ap :0.3` — đã đo và **chốt** (số đo lại 2026-10-05 ở `e45ebbb3`)

**Luật:** `:0.3` giữ số thứ tự **khi và chỉ khi** Pāli `:0.3` bắt đầu bằng số; hình thức `N. `.
Và `translationTitle` **phải bằng đúng** `:0.3` (đó là `<h1>` của trang web).

Đo trên **worktree sạch** ở `e45ebbb3`: **373** tệp `tha-ap` có Pāli `:0.3` khác rỗng, và cả hai
bất biến đều **373/373 = 100%**. (Lần đo trước ghi "367/367" — con số đó đúng **cho commit đó**;
tập tệp đã lớn thêm 6 bài `tha-ap` kể từ đó.)

Hình thức: `N. ` **55** tệp · số trần **16** · bỏ số **302**.

#### 🔴 Tôi đưa **số sai** vào prompt lát `n22`, và lát đó **bác bỏ**

Trong prompt tôi ghi *"hình thức `N. ` (đo được 101 `N.` vs 16 `N` trần)"*. Lát `n22` đo lại được
**55** `N.` — khớp **16** trần — và nói thẳng là không khớp phép đo của tôi. Tôi đo lại: **55** và
**16**. Vậy **101 là sai**, và `16` thì đúng.

⇒ `55` là con số đúng. Mọi prompt sau này: **không đưa số đo mình chưa chạy lại ở đúng commit**;
đưa số thì phải kèm cách đo, hoặc bỏ hẳn và bắt lát tự đo.

#### 🔴 Và tôi đo trên **sai cây** — cây chính không phản ánh `main`

Đo cùng phép đó trên `/Volumes/SSD/kinh-tang-pali` ra **299/361** và **310/361** (62 lệch
`translationTitle`, 51 lệch bám Pāli), trong khi worktree sạch ra **373/373**.

Lý do: cây chính đang ở trên nhánh **`feat/sutta-summary`** của **một session khác**, và nhánh đó
**thiếu bản sửa `:0.3`** đã lên `main`. Các tệp lệch (`tha-ap103` `tha-ap140` `tha-ap142` …) **không**
có thay đổi chưa commit — chúng chỉ đơn giản là **cũ hơn**.

⇒ **Luật:** mọi phép đo phải chạy trên **worktree sạch đúng commit**, không bao giờ trên cây chính
dùng chung. Cùng một phép đo trên hai cây cho hai kết luận trái ngược, và kết luận sai là của cây
đang bị session khác sửa.

#### ⚠️ Cảnh báo cho session đang làm `feat/sutta-summary`

Nhánh đó **thiếu** bản sửa `:0.3`. Nếu họ merge hoặc push từ nhánh đó, **62 tệp** có thể quay lại
lệch mà không cổng nào báo. Cần rebase `main` trước, hoặc chạy lại `tests/unit/tha-ap-title.test.ts`.


### ✅ `Muse Spark` **là** `OpenCode Space Bunny Free (agent)` — đã sửa cơ chế, không sửa lịch sử

`source/tooling.yaml` khai:

```yaml
id: opencode-space-bunny
name: Space Bunny · release: "Muse Spark 1.3 Free"
modelId: space-bunny-free · aliasInMetadata: "OpenCode Space Bunny Free (agent)"
```

Tức `"Muse Spark"` và `"OpenCode Space Bunny Free (agent)"` là **một** công cụ dưới hai nhãn, và kho
ghi công cả hai: **461** tệp ghi `Muse Spark`, 24 ghi
`Space Bunny Free (OpenCode) — re-scored …`, 15 ghi `OpenCode Space Bunny Free (agent) — re-scored …`,
10 ghi `Muse Spark 1.3 Free (agent)`, 3 ghi `Muse Spark (adversarial re-audit …)`.

Đây **không** phải attribution sai — `AGENTS.md` cấm sửa attribution lịch sử, và 461 tệp đó **đúng**
là do công cụ đó làm. Chỗ sai là **cơ chế**: `validate.ts` so **khớp chuỗi**, nên nó coi hai nhãn của
một công cụ là hai tác giả.

⇒ **Đã sửa ở `scripts/validate.ts` + `src/lib/canon/tooling.ts`**: mỗi credit **quy về công cụ**
(`toolIdentityFor`) rồi so công cụ (`sharedCredit`). Đo: cảnh báo *"rests on our own fill"* đi từ **457 → 496**, tức **+39** bài mà lớp lấp English do **chính công cụ viết bản Việt** so ra, trước đó
bị báo là lớp đọc Anh độc lập. `validate` vẫn exit 0.

### 🔴 `deepseek-v4.1-flash`: ghi công ở **283** tệp mà `tooling.yaml` **không khai** — chờ biên tập

Đây là vi phạm thật của quy tắc `AGENTS.md`: *"Công cụ hỗ trợ chỉ được khai trong
`source/tooling.yaml`"*.

Nó **im lặng** vì chính test bảo vệ quy tắc ấy không thấy được nó: `tooling.test.ts` tìm ứng viên
bằng **regex cứng** `/chatgpt|openai|opencode|space bunny|gpt-?[\d.]/i`. Tên không chứa một trong
năm từ đó thì vô hình. `deepseek-v4.1-flash` đúng là trường hợp đó.

⇒ `tests/unit/credit-identity.test.ts` mới quét **mọi** credit trong `content/meta` và đòi mỗi cái
khớp công cụ đã khai, trừ khi nằm trong danh sách tường minh. Danh sách "chưa khai" hiện có **đúng
một** mục là `deepseek-v4.1-flash` ⇒ **công cụ chưa khai kế tiếp sẽ đỏ test** thay vì thêm vài trăm
tệp im lặng nữa.

**Cần biên tập quyết**, vì kho **không kiểm chứng được** vendor và release của nó:
- `vendor`: ?
- `release`: ?
- `declaredBy`: gần như chắc là `user-declared`, vì tên phiên bản là thứ repo không xác minh được.

Cho tới khi có quyết định, tôi **không** tự điền và **không** sửa 283 tệp metadata đó.

### 🔴 Lớp **cắt ngắm**: **321 → 85** khoá / 67 tệp — scorecard 10 tiêu chí **không hề thấy**

Dấu lược `…` mà **Pāli không có** ở chính khoá đó = bản dịch đã bỏ nội dung rồi giấu bằng một dấu.
Tệ nhất `mn10:42.6`: Pāli **327** ký tự liệt kê trọn `pītisambojjhaṅga`, Việt `hỷ giác chi …` —
**mất 96%**. Và `mn22:16.5`: Pāli `saṅkhāre 'netaṁ mama, nesohamasmi, na meso attā'ti samanupassati;`
→ `hành …` — mất **toàn bộ** phép quán *vô ngã*.

Cả **67** tệp đều `published`, điểm **9,30–9,77**, **không** tệp nào có blocker.

⇒ Đã hạ cả 67 xuống `draft` + blocker (giữ nguyên 23 khối `summary:` của session khác), và thêm
`tests/unit/truncation.test.ts`: bài nào cắt ngắm thì phải `draft` kèm blocker; **trần** không được
vượt, mỗi lần sửa thì hạ con số. Cả hai điều kiện **đã thử bắt thật** (đổi `mn22` về `published` ⇒ đỏ;
thêm một `…` vào khoá sạch ⇒ đỏ).

**Tiến độ trần: 321 → 186 → 145 → 105 → 85 → 69 → 60.** Còn **60** khoá.

Worklist sửa: `/Volumes/SSD/opencode-work/_trunc2.txt`.

### ✅ Số `:0.3` phẩm `tha-ap` — **hai phép khác mẫu số**, và bất biến **đúng**

Lát `n35` đo **KEEP 53 · DROP 65**, còn tôi ghi **số trần 16 · bỏ số 302**. Đây **không phải** mâu thuẫn —
hai phép khác mẫu số:

| phép | mẫu | kết quả |
|---|---|---|
| tôi ghi: **hình thức** | 373 tệp | `N. ` **55** · số trần **16** · bỏ số **302** |
| `n35`: **đúng quy tắc** (chỉ tệp mà Pāli `:0.3` **bắt đầu bằng số**) | **118** tệp | KEEP **53** · DROP **65** |
| phép chung, **toàn tầng** | **374** tệp | KEEP **119** · DROP **255** · **THỪA 0** |

⇒ **Bất biến cần giữ: `THỪA = 0`** — không tệp `tha-ap` nào thêm số thứ tự ở chỗ Pāli không có. Đo được
**0 / 374**. Đây mới là thứ quality gate cần chặn; hai cột KEEP/DROP kia là **mô tả quy ước**, không phải
lỗi.

`n35` phát hiện và **đã sửa** **2 tệp vi phạm bất biến này**: `tha-ap117` và `tha-ap427` có số thứ tự
trong bản dịch trong khi Pāli `:0.3` của cả hai chỉ là `Suvaṇṇapupphiyattheraapadāna ` /
`Koraṇḍapupphiyattheraapadāna `. ⇒ Cột **THỪA = 0** ở trên là số **đã sau** khi lát sửa.

Và `n35` cũng sửa `tha-ap144:6.1` / `tha-ap145:6.1`: bản nháp ghi *"đã từng nói **bài kệ này**"* trong khi
Pāli `imā gāthāyo` là **số nhiều**, và `abhāsitthāti` là quá khứ của **một** sự kiện.

### 🔴 `(…)` **không phải** placeholder — lần thứ **ba** "trông như lỗi" hoá ra là quy ước

`an1.464:1.1` chứa `(…)`; thoạt nhìn như chỗ chưa dịch, và `vimeas` coi nó là **đủ** vì giá trị khác rỗng.
Đo toàn tầng: **31** khoá / **23** tệp. Tách hai dạng:

| dạng | số | Pāli có `(…)`? |
|---|---|---|
| giá trị **đúng bằng** `(…)` | **12** | **12/12** (`dn16:1.11.11`, `ja434:2.5`, `sn37.4:1.8`, `mn124:3.8`) |
| `(…)` **nằm trong** câu đã dịch | **19** | **19/19** (`mn40:8.1`: Pāli `…visuddhamattānaṁ samanupassati (…).`) |

⇒ `(…)` là **phản chiếu trung thàcf** của tầng Pāli ghim. **Không** sửa, **không** viết cổng chặn.

Đây là lần thứ **ba** trong một phiên tôi định sửa một thứ **đúng** vì nó **diễn ra** trông như lỗi — trước
đó là *"phi phi tưởng"* (**168** khoá / **62** tệp đã dùng, `dn15` viết hoa *"Phi Tưởng Phi Phi Tưởng Xứ"*) và
*"tâm ấy"* ở `an1.574:2.3` (tiền lệ `an1.53:1.4`).

⇒ **Luật đã chốt và đưa vào `BRIEF_VI4.md` cho mọi lát:** *"trông như lỗi" không phải tiêu chí sửa. `grep`
kèm đếm trên tầng, và đọc vế trước trong bài, **trước khi** sửa bất cứ thứ gì.*

### ✅ Chiều đo còn **thiếu**: số thứ tự ở `:0.3`

Tôi mới chỉ đo `THỪA` (Pāli **không** có số mà Việt **có**) mà **chưa** đo chiều ngược lại. Lát `n44` báo
*"112 tệp THIẾU số"* — tôi đo cả hai:

```
tha-ap có :0.3 ở cả Pāli lẫn Việt: 401
GIỮ số   (Pāli có ∧ VI có)      : 126
THIẾU số (Pāli có mà VI không)  : 0
BỎ số    (Pāli không ∧ VI không): 275
THỪA số  (Pāli không mà VI có)  : 0
```

⇒ **0 ở cả hai chiều**; claim của lát sai. Nhưng nó **chỉ ra chỗ tôi chưa kiểm** — đó là giá trị thật của
báo cáo lát. ⇒ **Luật: khi nghe một lỗi, đo cả hai chiều trước khi kết luận và trước khi sửa.**

### 🔴 Bẫy mới: `_hvi.save_vi` **không chạy được** cho **uid gộp**

`pal()` lọc `k.startswith(uid + ":")` nên với `sn45.110-114` trả `{}` và `kiếm()` raise. Lát sau gặp uid
gộp phải tự làm lại bộ kiểm (NFC · Pāli lọt · trùng nguyên văn · dấu lược · cân ngoặc kép).

### ✅ `1.596` hay `2.019` bài `kn` không có Anh Sujato — **cả hai đúng**, khác mẫu

Một lát báo *"`1.596` không tái lập được, tôi đo được `2.019`"* — nghe như phải sửa `AGENTS.md`. Tôi tự đo lại
ba phép trên **worktree sạch**:

| phép | mẫu | `kn` không có Anh Sujato |
|---|---|---|
| cache Pāli `kn` | 2.774 uid | **2.019** (2.774 − 755) |
| **catalogue** `content/catalog/sutta/kn.json` | **2.351** uid | **1.596** (2.351 − 755) |
| phần ngoài catalogue | 423 uid | 423 |

Tầng `en-sujato` có `kn` = **755** tệp theo **cả hai** cách đo (đường dẫn trong manifest, và tệp thật trên
đĩa cache) ⇒ tầng tham khảo **không** phải chỗ phân kỳ.

⇒ **`1.596` trong `AGENTS.md` và `docs/translation-store.md` là ĐÚNG** (phạm vi catalogue = phạm vi mục
tiêu). `2.019` cũng đúng (phạm vi cache đầy đủ). **Không sửa** tài liệu nào.

⇒ **Luật (đã mắc lần thứ tư trong phiên):** hai phép cho hai con số khác nhau **không phải** mâu thuẫn
trước khi kiểm **mẫu số**. Lần này mẫu khác ở **catalogue vs cache**; lần trước ở **catalogue vs `--used`**;
còn `test dưới sàn 143` so với `text dưới ngưỡng 216` là **hai phép khác mẫu** chứ không phải mâu thuẫn.

⇒ Và: một lát **báo cáo thật** rằng con số trong tài liệu không tái lập được — đó **không** phải lỗi của lát;
đó là phép đo đúng đặt câu hỏi đúng. Đáp lại bằng cách **đo lại và chỉ ra mẫu số**, đừng bằng cách sửa
tài liệu cho khớp.

### 🔴 `Tiṁsakappasahassa`: tôi **tự phỏng đoán** rồi dùng nó để "sửa" — đã gỡ

Tôi ghi `Tiṁsakappasahassamhi` = `tiṁsa` 3 × `kappa` 100 = **3.000**, dùng con số đó để sửa **4** tệp
*"ba mươi ngàn"* thành *"ba nghìn"*. Một lát phản biện: cấu tạo đầy đủ là `tiṁsa` 3 × `kappa` 100 ×
`sahassa` 1000 = **300.000**, còn cách đọc *"ba nghìn kiếp"* coi `kappasahassa` là "nghìn kiếp".

⇒ **Tôi kiểm dữ liệu ghim:** toàn lớp Pāli chỉ có **một** dạng `Tiṁsakappasahassamhi,` (6 khoá, 6 tệp), và
tầng Anh đã ghim **không có** bản dịch nào cho nó (`grep` toàn `.cache/upstream/suttacentral/` cho
*"three hundred thousand"* lẫn *"thirty thousand"* cộng *kalpa* đều **0**).

⇒ **Không có chứng cứ độc lập nào trong kho để phân xử.** Điều **chắc chắn** sai: **4** tệp ghi *"ba mươi
ngàn"* = 30.000 — sai với **cả hai** ứng viên. Điều **chưa biết**: giá trị đúng là 3.000 hay 300.000.

⇒ **Đã gỡ khỏi bảng kiểm** và đưa vào `UNVERIFIED` kèm lý do. **Không** giao lát sửa, vì sửa theo
phỏng đoán của tôi là bịa số.

**Còn lại chắc chắn sai, cần người biên tập chốt giá trị rồi mới sửa:**

| khoá | hiện tại | ứng viên |
|---|---|---|
| `tha-ap47:4.1` `tha-ap79:1.1` `tha-ap115:10.3` `tha-ap450:8.1` | *"ba mươi ngàn kiếp"* = 30.000 | **3.000** hoặc **300.000** |
| `tha-ap54:6.3` `tha-ap200:3.3` | *"ba mươi nghìn kiếp"* = 30.000 | như trên |
| `tha-ap151:3.1` | *"ba nghìn kiếp"* = 3.000 | như trên |
| `tha-ap109:10.1` | *"ba trăm nghìn"* = 300.000 | như trên |
| `tha-ap108:4.3` `Kappasatasahassa` | *"trăm nghìn kiếp"* = 100.000 | **10.000.000** |

⇒ **Luật:** một phép đo chỉ nên dùng để **sửa** khi **giá trị đích** được xác lập từ chứng cứ trong kho.
Không xác lập được thì phép đo chỉ **báo**, không **sửa** — và con số tôi "chắc chắn" phải chịu đúng kiểm tra
đó. Một lát đã bắt được điều này khi tôi đã ghi nó vào tài liệu.

### ✅ Phép đo số: **hiệu chuẩn bắt được 5 lần lỗi của chính script**

`_numcheck2.py` chỉ kiểm **9** từ khóa đã xác lập được, và **in `CALIBRATION FAILED`** thay vì báo "0 lệch"
khi không tái lập được con số đã biết. Năm lần nó bắt tôi:

1. So **khóa đơn vị Việt** với **token Pāli** ⇒ không bao giờ bằng ⇒ **"0 lệch"** trong khi đã biết 31 khoá sai.
2. Đọc *"chín mươi mốt"* thành **19** — tiếng Việt có hai dạng `một`/`mốt`, `bốn`/`tư`, `năm`/`lăm`.
3. Đọc *"Chín mươi mốt"* thành **1** — chính tả tầng không nhất quán `mười`/`mươi`, `Chín`/`chín`.
4. Đọc *"ba mươi ngàn"* thành **1.030** và *"mười lăm nghìn"* thành **15** — thang lớn (`ngàn`/`nghìn`) nhân **cả** số đã tích lũy, không nhân `(cur or 1)`.
5. Đơn vị `'nghìn kiếp'` trong bảng đơn vị làm **báo oan** *"ba nghìn kiếp"* thành 3.

⇒ Ngoài ra: **hiệu chuẩn ghim cứng (21, 10) thì luôn FAIL sau khi sửa** — "0 lệch" và "hiệu chuẩn OK" là
**loại trừ nhau**. Kỳ vọng phải **cập nhật** sau mỗi đợt sửa, và đó là việc của người điều phốn.

### 🔴 🔴 Bẫy lát **trùng**: đã mắc **hai** lần, cùng một cơ chế

| lần | chuyện | vì sao phép đo **không** thấy |
|---|---|---|
| `tf15` | chạy song song `tf12`; 16/25 khoá trong tệp làm việc **đã cũ** | tệp làm việc là **ảnh chụp** trạng thái đĩa *trước khi* lát kia sửa |
| `n45` / `n46` | sinh ra **trùng** `n40` / `n41` đang chạy | tệp dịch của các bài đó trên đĩa lúc đó **chỉ có 1 khoá** (lượt trước lọc theo ngưỡng 40 ký tự) ⇒ phép đo "còn thiếu" **vẫn đúng**, chỉ sai về điều phốn |

⇒ Nguyên nhân chung: **tệp làm việc không tự biết mình đã lỗi thời**. Không phải lỗi phép đo.

**Cách chữa cấu trúc** — `/Volumes/SSD/opencode-work/_mkslice.py`:
1. **loại** mọi bài của lát đang chạy khỏi phép đo, và `assert` không có trùng trước khi ghi;
2. **không ghi đè** tên lát đã tồn tại — đổi thành `.bak` để còn đối chiếu được;
3. **lọc theo catalogue** (cache Pāli có **824** bài ngoài phạm vi: `sn12.104-114`, `an1.248`, `dhp*`…);
4. `--status` in lát nào đang chạy và còn bao nhiêu việc ngoài chúng.

⇒ **Luật:** lát mới chỉ giao khi bộ này **không** in ra tên trùng, và phải đọc `--status` **trước**, không
đếm lát đang chạy bằng trí nhớ.

### ⚠️ Đã **không** sửa: "phi phi tưởng" — tra tiền lệ trước, và nó **không phải** lỗi

`an1.453:1.1` / `an1.454:1.1` dịch `nevasaññānāsaññāyatana` thành *"xứ phi tưởng **phi phi tưởng**"*, thoạt
nhìn như lặp từ. Đo toàn tầng: **168** khoá / **62** tệp đã dùng đúng dạng này, và `dn15` viết hoa là
**"Phi Tưởng Phi Phi Tưởng Xứ"**. Đó là cách dịch **đã thành quy ước** (`nevasaññāna` + `āsaññāyatana`).

⇒ Đã **không** sửa. Đây là lần thứ hai trong phiên tôi sắp sửa một thứ đúng vì **diễn ra** trông như lỗi; lần
trước là `an1.574:2.3` (*"tâm ấy"* có tiền lệ ở `an1.53:1.4`). **Luật: "trông như lỗi" không phải tiêu chí
sửa — tiêu chí là đo tiền lệ trước.**

Còn `naṁ` trong `Ko pana vādo ye naṁ bahulīkarontī”ti.` thì **thực sự** là thủ phạm điển hình: Pāli trùng
byte ở `an1.394:1.3` (*"thiền ấy"*) và `an1.574:2.3` (*"tâm ấy"*) mà vế trước ở mỗi bài lại khác nhau. Không
ép một dạng — giao cho lát review đọc vế trước từng bài rồi **ghi lý do**.

### 🔴 Hai bất biến agent vi phạm **nhiều lần** — và vì sao phải để máy canh

#### 1. `translationTitle` phải **BẰNG ĐÚNG** `:0.3` — vi phạm **4 lần**, 4 đợt

`tha-ap147` · `tha-ap175` · `tha-ap200` · `tha-ap209`: agent đặt số thứ tự vào `:0.3` rồi **quên** đặt vào
`translationTitle`. Người đọc thấy hai tên khác nhau cho cùng một bài.

⇒ Đây là việc **không có phán đoán**: giá trị đích lấy nguyên văn từ `:0.3`. Nên nó là **việc của máy**,
không phải việc nhớ của từng lát. Đã viết `_thaptitle.py` chạy sau **mỗi** đợt; tiêu chí nghiệm thu là
báo **0** trên worktree sạch và chạy lần hai cũng **0**.

⚠️ Bản đầu báo *"398 tệp"* ở **mọi** lượt chạy: `want` có khoảng trắng dẫn trong khi `current` đã
`.strip()` ⇒ **không bao giờ** bằng. Thêm hai lỗi nữa: `skipped` là chuỗi chứ không phải cặp; và
`assert new != raw` **giữa vòng duyệt** làm script chết sau vài tệp — nó đã chết giữa đường.

⇒ **Luật tổng quát:** một bất biến **cơ học** mà agent phạm lần thứ hai thì phải chuyển thành script.
Đừng để lát thứ ba mắc cùng một lỗi.

#### 2. `published` **không** được đặt khi không có bản Anh đã ghim — **7** bài trong một đợt

`n34` và `n35` đặt `published` cho 7 bài `tha-ap`, với lý do *chính đáng* — `reference-gaps.yaml` **đã có**
entry cho chúng. Nhưng hai cổng đòi thứ khác: **không có tệp Anh đã ghim** thì `published` không đứng
được, và phải có blocker. **Có entry gap không cứu được `published`.**

Đo được: `english-sujato` ở `kn` chỉ phủ **9** sub-collection (cp·dhp·iti·ja·kp·snp·thag·thig·ud =
755 tệp); tệp `tha-ap` duy nhất trong cả tầng là **tệp *tên*** (`name/sutta/tha-ap-name_…`), không phải
thân kinh. `vietnamese-current` cũng không phủ (26 tệp, toàn bộ Pháp Cú).

⇒ Hạ 7 bài xuống `draft` + blocker nêu đúng lý do. `n33` `n37` `n38` `n39` **tự** đặt `draft` ⇒ phần lớn
lát không mắc, cổng chỉ bắt được phần bị lệch.

### ⚠️ `_hvi.py` **chạy rỗng** ở bài ngắn — và báo xanh

`_hvi.py` lọc khoá `len(pāli) >= 40`. Ở `tha-ap`, **23/24** khoá Pāli **ngắn hơn** ngưỡng (mỗi vế kệ chỉ
18–26 ký tự) ⇒ nó quét **không mấy khoá nào** rồi báo pass. Ở lát `n34` là **82/86** khoá dưới ngưỡng.

⇒ **Đó là không kiểm gì, không phải đạt.** Cả 8 lát đã phải tự viết năm phép và in số; đã ghi vào
`BRIEF_THAP.md` để các lát sau không phải phát hiện lại.

Ba lỗi khác của `_hvi.py` đã biết: chỉ đếm ngoặc **kép** không đếm nháy **đơn** `‘’`; lọc `\b\d+\.0\b` trong
**nội dung Pāli** chứ không phải **tên khoá**; và báo sai khi `…pe…` chạy qua ranh giới khoá.

### ⚠️ zsh trong `--title` của `gh`: backtick là **command substitution**

```
gh pr edit 270 --title "...`sn12.93-213`..."   →  command not found: sn12.93-213
```

`gh pr create` vẫn tạo được PR nhưng **tiêu đề bị mất đoạn**. ⇒ Dùng **nháy đơn** cho `--title` khi có
ký tự backtick hoặc `!`. Nhân tiện: cùng đợt này tôi cũng phải dùng nháy đơn cho PR #267 sau khi zsh ăn
mất `… cho đến …` trong `--title`.

### 🔴 Catalogue dùng **237 uid GỘP phạm vi** — và `pali.py` **không** dựng được

Catalogue không liệt kê `an1.316`…`an1.332` riêng mà gộp thành **`an1.316-332`**; tương tự
`sn35.33-42`, `sn45.110-114`, `sn23.23-33`, `sn24.20-35`, `an7.96-614`… Tổng **237** uid dạng này, và
**233** đã có bản dịch.

Nhưng khoá bên trong tệp Pāli lại mang **tiền tố uid riêng**, không phải uid gộp:

```
sn35.33-42 → sn35.33:0.1 … sn35.42:2.4
an1.316-332 → an1.316:0.1 … an1.329:1.3
```

⇒ `pali.py` (bộ tra Pāli tôi dùng để sinh lát) **không** trả về 4 bài này, và lát của tôi **bỏ sót chúng**.
Đo được: lát của tôi nói **798** bài thiếu, `vimeas` nói **802**. Chênh đúng **4** bài / **288** khoá.

⇒ **Cách chữa (đã làm):** dựng lát gộp bằng chính `segmentMapForUid` của kho qua một script `.ts`, không
dùng `pali.py`. Bốn bài này là lát `m1`–`m4`.

⚠️ Và bài này là dạng lỗi mới: **không có công cụ nào báo** rằng lát của tôi bỏ sót 4 bài. Chỉ khi **đối
chiếu hai phép đo khác nhau** mới thấy. Đây là lý do phải giữ hai phép đo độc lập.

### 🔴 `sn12.93-213`: **vô hình với mọi cổng** — `segmentMap` rỗng

Uid catalogue `sn12.93-213` trỏ tới `sn12.93-213_root-pli-ms.json`, nhưng tệp đó gồm **40 khoá** thuộc
**11 uid khác nhau**:

```
sn12.93-103 · sn12.104-114 · sn12.115-125 · … · sn12.203-213
```

Không uid nào bằng `sn12.93-213` ⇒ `segmentMapForUid` trả về **0 khoá** ⇒ `vimeas` **bỏ qua** nó ở
`if (ids.length === 0) continue`, tức nó **không** được tính vào *bài đủ* lẫn *bài thiếu*.

```
catalogue 6137 · đủ 5334 + thiếu 802 = 6136   ← thiếu đúng 1
```

Và 11 uid con đó **không** có trong catalogue (đo: `sn` có 135 uid trong `P(col)` mà catalogue không).

⇒ Đây là lỗi ở **tầng catalogue / upstream**, **không sửa được ở tầng Việt**: Pāli có mặt nhưng không
định danh được. Cần người biên tập: khai 11 uid con trong `content/catalog/sutta/sn.json`, hoặc sửa tệp
Pāli ghim cho khoá mang tiền tố `sn12.93-213`.

⚠️ **Hệ quả cho tiêu chí hoàn thành:** *"vimeas bài còn thiếu = 0"* **không** đủ, vì một bài có thể
**không được đo**. Phải kiểm thêm `đủ + thiếu == catalogue`.

### 🔴 Cột gỡ **lớp B** và `… cho đến …` — hai lớp mà phép đo tỉ lệ **không** bắt

Lớp B = **số dấu lược lệch** chiều ngược (Pāli có `…pe…`, Việt **bung thành văn**; hoặc `… cho đến …`
= hai dấu nơi luật chỉ cho một). Đo bằng **bất biến dấu lược**, không bằng tỉ lệ ký tự — vì `mn12:17.2`
có `…pe…` thật nên **số lược đã khớp**, mà phép chọn theo tỉ lệ vẫn loại.

`… cho đến …` đo nền: Pāli một `…pe…` → Việt một `…` có **5.845** khoá; `… cho đến …` chỉ **55** ⇒
thiểu số rõ. **Đã sửa 55 → 0.**

⚠️ Lớp B **không** phải lúc nào cũng lỗi, nên lát được yêu cầu **phán từng khoá** và báo khoá nào hợp
lệ. Kết quả: `tf13` kết luận **2 khoá hợp lệ** (Pāli ghim **rỗng**) và để nguyên; `tf14`/`tf10` kết luận
0 hợp lệ, có số đo nền **96,1%** khớp tuyệt đối ở tầng.

### 🔴 Nguồn gốc lớp lỗi là **tầng Anh đã ghim**, không phải bản nháp tự bịa

`tf4` dò ra: **24/24** khoá lát đều bị Sujato lược, bản Việt sao chép nguyên dấu lược ấy —
`an5.99:1.7` Pāli `… sakkaccaññeva pahāraṁ deti, no asakkaccaṁ;` mà Sujato ghi `If he strikes a
buffalo …`. Ở `mn9`, **Sujato lược 16/16**. Ở `mn26`, Sujato lược `27.14` trong khi Pāli của `27.14`
**trùng nguyên văn** với `27.7`/`27.19` mà Sujato dịch đủ ⇒ **bản Anh tự mâu thuẫn với chính nó**.

⇒ `validate` không thấy vì nó đo `…` của tầng Việt mà **không** đối chiếu từng khoá với Pāli. Và bất
kỳ agent nào dịch vòng qua tầng Anh cũng tái tạo đúng lỗi này. ⇒ **Chặn căn** cần phép kiểm ở **tầng
Anh**; chưa làm.

### 🔴 Còn một lớp **nặng hơn**: mất nội dung mà **không** có `…` nào

`mn24:4.4` — Pāli `Assosi kho … “bhagavā **kira** sāvatthiṁ anuppatto; sāvatthiyaṁ viharati
jetavane anāthapiṇḍikassa ārāme”ti.` — bản Việt mất **cả vị từ `kira`** lẫn phần *Ngài an trú ở rừng
Jeta*. Không dấu lược ⇒ **không** phép đo nào thấy, kể cả cổng mới. Đây là **nén văn xuôi**; chỉ phát
hiện bằng tỉ lệ độ dài, mà tỉ lệ thì **nhiễu**. Cần lát riêng và **đọc tay**.

### 🔴 Cột số toàn tầng về **nháy kép** — lần đầu có ai đo

| | số tệp |
|---|---|
| **Việt** không cân ngoặc kép | **174** / 5.352 |
| — lỗi **chỉ ở Việt** (Pāli cân) | **99** ← cần hành động |
| — lỗi **cả hai** | 75 |
| **Pāli** không cân mà Việt cân | **180** ← lỗi tầng ghim, không sửa được ở tầng Việt |

Lệch **nháy đơn** `‘’` so Pāli = **3.448** khoá / 530 tệp — **khác biệt quy ước diện rộng**, không
phải 3.448 lỗi (cùng lớp với phe `ti`: đo ở phạm vi gần nhất).

### ⚠️ Tệp làm việc có thể **đã cũ** vì hai lát chạy song song

`tf15` phát hiện `vc/tf15.json` **đã cũ ở 16/25 khoá** — lát `tf12` đã sửa 16 khoá đó trước. Lát
đối chiếu tệp làm việc với đĩa, thấy lệch, và **không dùng tệp làm việc làm sự thật**.

⇒ **Luật: luôn kiểm trạng thái đĩa trước khi tin tệp làm việc.** Tôi không ghi luật này khi sinh lát —
lát mới phát hiện ra.

### 🔴 🔴 **PR body là ảnh chụp thời điểm, PR là sinh hoạt** — #266 ghi sai số

#266 squash-merge thành `c1170705`, nhưng tôi **đẩy thêm hai commit vào cùng nhánh sau khi đã viết
body**. Body ghi *"321 → 186"*; commit thật vào `main` mang trần **85**:

```
$ git show HEAD:tests/unit/truncation.test.ts | grep CEILING
const TRUNCATION_CEILING = 85;
```

⇒ Cùng dạng *"đo đúng rồi ghi vào chỗ không còn đúng"*. **Cách chữa:** đo lại ở đúng commit sẽ merge,
và ghi **cả hai** số trong body PR.

### 🔴 Việc tồn đọng sau các lát vừa sửa — **lát riêng**, không gộp

| việc | ở đâu |
|---|---|
| `mn24:4.4` mất `kira` + cả vế Jeta · `17.7` mất lời dẫn ⇒ mất **chủ thể** | `mn24` |
| `mn24` **15** khoá cùng Pāli mà **3** cách dịch | `mn24` |
| `mn26:13.3` / `30.1` — Pāli 4 và 3 dấu lược, Việt **0** | `mn26` |
| `dn3` ngoặc kép **−6** + lệch-đúng-một-khoá ở `2.10.1/4/7/10` | `dn3` |
| `an3.100` +2 và `an4.186` −2 ngoặc kép — **đã chỉ định đúng 4 ký tự** | hai bài |
| `sn7.6:6.3` thiếu `”` đóng | `sn7.6` |
| `sn5.4/5.5/5.9:3.3` thêm `lại`; `sn5.6:2.4` `sn7.11:2.9` ngoặc lồng cùng glyph; `sn7.11:2.5` nhét khoá kế | `sn5` `sn7.11` |
| `an3.99:1.1` gộp 4 trạng thái + gloss *(vải gai thô)* **trong thân kinh** | `an3.99` |
| **ASCII `...` thay vì `…`** — đã biết 31 khoá, **chưa đo toàn tầng** | `an10.104` `sn6.x` `mn148` |
| **99 tệp lệch ngoặc kép chỉ ở Việt** — đo được, chưa giao | toàn tầng |

### ✅ `_fixmeta.py`: vì sao `status`/`blocking_errors` phải là **việc của máy**

Sau sự cố lát `tf1` **xoá blocker** và đặt `published` mà **không sửa khoá nào**, tôi viết
`/Volumes/SSD/opencode-work/_fixmeta.py`: tính offender **từ dữ liệu**, rồi đặt `draft` + blocker nêu
đúng danh sách khoá, hoặc gỡ blocker rồi đặt `status` theo quality gate. **Cố ý không nâng
`semantic_fidelity`** — nâng điểm bằng máy chính là cái mẫu vừa bị bắt.

**Tiêu chí nghiệm thu:** trên worktree sạch, nơi `truncation.test.ts` đã xanh, script phải báo **0 thay
đổi**; và chạy lần hai cũng 0. Nó báo 0 và idempotent.

⚠️ Nó lộ **bốn** lỗi của tôi trước khi đạt: `SCORE_RE` thiếu `re.M` ⇒ `score = None` ⇒ **5.407** tệp
bị hạ nhầm; `ITEM_RE` giữ dấu nháy kép ⇒ `Khoá: …$` không khớp ⇒ điều kiện bỏ qua **âm thầm** không
chạy; `fm` là biến của **vòng duyệt cuối** dùng trong vòng ghi ⇒ assert so **nhầm tệp**; và bản đầu còn
định đặt `status` cho **mọi** tệp, tức cả những tệp `draft` vì lý do khác mà nó **không biết**.

Và nó phải **thu hẹp phạm vi** — đó là sửa hàng loạt ngoài lát. Ngoài ra phải **bỏ qua Pāli rỗng**: có
đúng **4** khoá Pāli ghim rỗng và **cả 4** đều mang `…` ở Việt ⇒ đó là **quy ước của tầng**, và tính chúng
là báo oan vĩnh viễn.

⇒ Đây là **lần thứ ba** trong một buổi tôi đo trên **sai cây** — cây chính không có các bản hạ trạng thái
đã commit, nên script báo 4.186 và 5.423 tệp trong khi thật chỉ có 67.

### Phe `ti` — **năm** lát, và nguyên nhân là **hai tập `ti` khác nhau**

Con số **850:150** tôi từng ghi là **sai chiều**. Đợt 17–18 có **năm** lát đo lại:

| lát | tập đếm | kết luận |
|---|---|---|
| n25 | `”ti` trong phẩm `sn35` | **GIỮ** 129 / 91 |
| n26 | `”ti` phẩm `sn35` → **phạm vi sát hơn** `sn35.124–133` | 131/119 → **4/10** ⇒ **BỎ** |
| n24 | **vị trí** `ti` so với ngoặc kép | `”ti` 3.470, phe ngược **0** ⇒ GIỮ; ghi rõ *«850:150 không tái lập được»* |
| n27 | khoá Pāli kết `ti?`/`ti.` | **BỎ** 3.472 / 14.125 |
| **n29** | `”ti` và `’ti` **tách riêng** | `’ti` bị **bỏ hẳn 8.606/8.724 = 98,6%** toàn tầng, **252/252** trong `an5.*`; `”ti` giữ 3.400 / bỏ 10.493 |
| n31 | `”ti` ở `an` và toàn tầng | BỎ **1:7,5** (`an`) và **1:5,1** (toàn tầng) — **hai phạm vi cùng chiều** |

⇒ Tính **cả** phe `’ti` vào BỎ thì tỉ lệ toàn tầng là **1:3,1**. Bốn lát trước chỉ đếm `”ti` nên cho
bốn con số khác nhau. **Đây là câu trả lời cho *"vì sao nhiều lát cho nhiều con số"*.**

**Luật đo, chốt được:** khi quy ước văn bản **không đồng nhất toàn tầng**, đo ở **phạm vi gần nhất**
(cùng phẩm, bài liền kề), **không** dùng đa số toàn tầng — tầng trộn các quy ước khác nhau theo phẩm
và theo bộ. Và **in cả hai phép** để người đọc tự thấy chúng lệch nhau.

**Phân kỳ là thật, không phải ảo giác đo:** `sn44.6` bỏ `ti` mọi khoá còn `sn44.3` `sn44.5` **cùng
phẩm** vẫn giữ; `sn35.62` `sn35.75` giữ còn `sn35.74` bỏ. Nếu chốt một phe thì **vá cả hai vế**.

### 🔴 Số **đếm đúng** nhưng **ghi nhầm mẫu số**: `Muse Spark` **461** hay **474**?

Tôi đăng **461 tệp** trong `goal.md` và trong prompt giao cho từng lát. Đo lại: **474** tệp chứa
chuỗi, **474** dòng attribution — trong đó **461** viết dạng trần, 10 viết `Muse Spark 1.3 Free
(agent)`, 3 viết dạng ghi chú. **461 là số *dạng trần*, không phải số *tệp*.**

Lát `e14` đo lại và báo thẳng là lệch — **lát đúng, tôi sai**. Số sai cứ trông rất thuyết phục vì nó
**gần** đúng.

### 🔴 Bằng chứng mạnh nhất cho luật *"Pāli trùng nguyên văn thì cách dịch phải khớp"*

`vv30` và `vv48` là **hai bài cùng một truyện**, và bản Việt trước đó lệch **37 trong 43** khoá có
Pāli trùng nguyên văn. Không cổng nào bắt. Sai lệch cụ thể: `sassu` (chồng) → *thần Trăng* ·
`avākiri` → *ngươi đánh rơi* · `ucchu` → tên riêng · `sahassanetto` → *nghìn con mắt* ·
`bhante` → *bạch thầy*.

⇒ **Quy tắc vận hành:** khi dựng lát, **dò Pāli trùng nguyên văn giữa các bài trong lát** và báo
số cặp. Nếu hai bài cùng truyện thì cách dịch phải khớp, và **không** dùng bản của bài này làm tiền
lệ cho bài kia khi bản kia đã lệch.

Cùng lớp, hai tiền lệ sai: `vv23:8.3` + `vv25:7.3` dịch `saññā` thành *không nói lỗi* / *sát sinh*
(đúng ra *ý thức*); `vv32:3.1–3.2` dịch cùng Pāli `Āveḷinī kañcanasannibhattace` thành *tràng hoa sen*
/ *xấu xí*.

### Câu hỏi thêm một phe: ngoặc kép `“ …pe…`

641 khoá có Pāli vừa mở ngoặc kép vừa mang lược; **637** bản Việt **bỏ** dấu mở — nhưng bỏ thì
khoá sau thành ngoặc đóng không mở. `sn35.74:14.1` giữ (theo `sn18.11:1.12`), `sn35.62` giữ.
⇒ Cùng tình huống, cần chốt một lần.

### Lớp "Pāli ghim tự lệch ngoặc kép" — đã xử ở vài bài, **tầng ghim sửa được thì nên sửa**

`sn35.94` lệch **−1** (`2.6` đóng `”` không mở) · `an6.29` lệch **+1** (`5.1` có `“` thừa của
upstream) · `an3.91` đóng `”ti` nằm ở khoá **trống** ⇒ lớp lấp không thể cân.

Cách xử đã dùng cho chiều **−1**: **thêm** `“` ở khoá mở chứ không **xoá** `”` (xoá mất luôn `”ti`).
Chiều **+1**: **không** bịa `”` để bù (cắt ngang lời Ānanda và mất `”ti` ở khoá sau).

### Ba tầng Anh cùng thiếu, nhưng ba cách xử khác nhau

| tình huống | ví dụ | cổng coverage | hành động |
|---|---|---|---|
| Sujato **im lặng** ở đoạn có nội dung | `sn42.5` (1/18) · `sn35.93` (29/40) | **đo được**, dưới ngưỡng | `draft` + blocker, và **còn lấp được** ở lớp lấp |
| Tệp Sujato **có** nhưng thiếu tầng lấp | `sn35.74` `sn35.94` | **100%** | `published`, không cần lấp |
| **Không có tệp Sujato nào** | `vv` `mil` `ne` `tha-ap` `pv` `ps` | mẫu số = 0 ⇒ **không đo được gì** | `draft` + blocker thật, `triangulation ≤ 8.0` |

### Ba lớp kiểm mà `_hvi.py` **không** bắt — đã đưa vào prompt từng lát

1. `set(khoá Việt) == set(khoá Pāli)` — `_hvi` chỉ quét khoá **≥ 40 ký tự**; ở bài kệ ngắn nó **chạy
   rỗng**, tức chạy xong mà kiểm không gì. ⇒ **luôn in số khoá so sánh** cùng kết quả.
2. Nháy **đơn** `‘’` cân *từng khoá* — `ngoặc()` của `_hvi` **chỉ đếm ngoặc kép**. Nhân bản từ các
   lát trước đã bắt được `an10.22:2.3`, `mil6.3.11:6.4`, `sn41.6:3.4/6.4`, và `mil3.1.4` **sót hẳn
   30 khoá** dấu `ti`.
3. **Pāli trùng nguyên văn TRONG CHÍNH bài** mà bản Việt khác — bắt được ở `thag7.2:6.2`/`7.2`.

### Dạng lỗi lặp lại nhiều nhất trong phiên: **con số viết từ trí nhớ**

Ba lát độc lập tự bắt số sai trong `notes` của chính mình: `n11` **6 chỗ** · `e2` **6 chỗ** (một cái
**đảo chiều**: tưởng 41 ký tự *"trên ngưỡng"*, đo lại **37, dưới** ngưỡng) · `n15` **2 chỗ**. Tôi cũng
phạm (`ghi "+5" rồi tự sửa thành 14`; `"thứ bốn mươi tám"` cho hai số khác nhau).

⇒ Số sai theo hướng **có lợi** cho bản thân mới là nguy hiểm nhất. Mọi số trong PR phải đọc lại từ
output lệnh.

### Hai sai sót quy trình của tôi, đã ghi để không lặp

1. Script sửa **71** tệp rồi `git add` theo **danh sách lát đã ghi sẵn** ⇒ **57** tệp không được
   commit. Chính test mới bắt được ở lần chạy đầu trên worktree sạch.
   ⇒ `git add` theo **output của chính script đó**.
2. Script chép tệp ghép **đường dẫn tương đối** rồi `replace(R, W)` ⇒ không thay được, `copy2` ném
   `SameFileError`, và bản chép **dừng giữa chừng** ⇒ PR có **một bài dịch không metadata**.
   ⇒ Dùng `copy` để hợp nhất, và **không** báo "xong" khi script còn ngoại lệ.

### ⚠️ Tranh chấp nhánh với **một session khác** trong cùng kho

Session kia đã `git checkout` khỏi `vi-wave14` sang `feat/sutta-summary` **giữa chừng**, nên commit
`6ef4468b` của tôi rơi lên nhánh của họ. Tôi **không** sửa nhánh của họ — cherry-pick sang
`vi-wave14` trong worktree riêng. Nhưng `feat/sutta-summary` hiện **có** commit đó ở trên đỉnh.

⇒ **Từ đợt 15 tôi không commit trong cây chính nữa**: agent ghi vào `/Volumes/SSD/kinh-tang-pali`,
tôi **chép** sang `/Volumes/SSD/_wtX-coord` rồi commit ở đó. Cần người biên tập xử `feat/sutta-summary`.

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
