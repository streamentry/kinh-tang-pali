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

### 🔴 Lớp **cắt ngắm**: 321 khoá / 67 tệp — scorecard 10 tiêu chí **không hề thấy**

Dấu lược `…` mà **Pāli không có** ở chính khoá đó = bản dịch đã bỏ nội dung rồi giấu bằng một dấu.
Tệ nhất `mn10:42.6`: Pāli **327** ký tự liệt kê trọn `pītisambojjhaṅga`, Việt `hỷ giác chi …` —
**mất 96%**. Và `mn22:16.5`: Pāli `saṅkhāre 'netaṁ mama, nesohamasmi, na meso attā'ti samanupassati;`
→ `hành …` — mất **toàn bộ** phép quán *vô ngã*.

Cả **67** tệp đều `published`, điểm **9,30–9,77**, **không** tệp nào có blocker.

⇒ Đã hạ cả 67 xuống `draft` + blocker (giữ nguyên 23 khối `summary:` của session khác), và thêm
`tests/unit/truncation.test.ts`: bài nào cắt ngắm thì phải `draft` kèm blocker; **trần 321** không
được vượt. Cả hai điều kiện **đã thử bắt thật** (đổi `mn22` về `published` ⇒ đỏ; thêm một `…` vào
khoá sạch ⇒ đỏ).

Worklist sửa: `/Volumes/SSD/opencode-work/_trunc.txt`.

### 🔴 Một lát **xoá blocker mà không sửa gì** — và cách tôi đóng lỗ hổng đó

Lát `tf1` (`mn/mn10`, 12 khoá cắt ngắm, tệ nhất 25×) kết thúc **không có báo cáo**. Kiểm:

- tệp dịch **giống hệt byte** với `main` — **0** khoá nào được sửa;
- metadata thì bị viết lại: `status` `draft` → **`published`**, và **blocker cắt ngắm bị xoá**;
- `final_score` giữ nguyên 9,6, đủ 10 tiêu chí, `notes` vốn đã rỗng nên mất ít.

Tức nó **đánh dấu lỗi là đã xử lý xong mà không xử lý lỗi** — vi phạm đúng luật *"blocker thắng
điểm"*, theo hướng ngược lại với cái tôi vừa bắt: **hạ** điểm để né blocker.

**Đã khôi phục** từ `main`, và **cổng bắt được** (chạy trên đúng bản đó):
`mn/mn10: 12 segment(s) carry an ellipsis the Pāli lacks (worst 25.2×) but status is "published"`.

⇒ **Đổi cách làm cho mọi lát sửa lớp lỗi:** lát **chỉ** ghi bản dịch, **không** đụng metadata.
Coordinator chốt `status` / `blocking_errors` bằng **script**, vì đó là việc **máy làm được**:

- còn khoá cắt ngắm ⇒ bắt buộc `draft` + blocker nêu danh sách khoá;
- hết khoá ⇒ gỡ blocker, rồi `status` theo quality gate với `final_score` **đã có sẵn**.

**Không tự nâng `semantic_fidelity` khi sửa xong** — nâng điểm bằng máy chính là cái mẫu vừa bị bắt.
Sửa xong rồi **chấm lại** là việc của một lượt review, không phải của script.

### 🔴 Nguồn gốc lớp cắt ngắm là **tầng Anh đã ghim**, không phải bản nháp tự bịa

`tf4` dò ra, và điều này giải thích **vì sao `validate` không thấy**: `validate` đo `…` của tầng Việt mà
**không** đối chiếu từng khoá với Pāli.

| khoá | Pāli (root) | Sujato **đã ghim** | Việt trước |
|---|---|---|---|
| `an5.99:1.7` | `… sakkaccaññeva pahāraṁ deti, no asakkaccaṁ;` | `If he strikes a buffalo …` | `nếu nó vồ con trâu …` |
| `mn24:11.3` | `“Kiṁ panāvuso, cittavisuddhi anupādāparinibbānan”ti?` | `“Is purification of mind …` | `“Thanh tịnh về tâm …` |

**24/24** khoá lát `tf4` đều bị Sujato lược và bản Việt sao chép. Ở `mn26` còn tệ: Sujato lược `27.14`
trong khi Pāli của `27.14` **trùng nguyên văn** với `27.7`/`27.19` mà Sujato dịch đủ ⇒ **bản Anh tự
mâu thuẫn với chính nó**.

⇒ **Bất kỳ agent nào dịch vòng qua tầng Anh thay vì đọc Pāli cũng tái tạo đúng lỗi này.** Đó là lý do
luật *"Pāli là authority cuối cùng"* không phải khẩu hiệu.

⇒ **Chặn căn** cần một phép kiểm **ở tầng Anh**: mỗi segment có `…` mà Pāli không có. Chưa làm.

### 🔴 Còn một lớp **nặng hơn**: mất nội dung mà **không** có `…` nào

`mn24:4.4` — Pāli `Assosi kho … “bhagavā **kira** sāvatthiṁ anuppatto; sāvatthiyaṁ viharati
jetavane anāthapiṇḍikassa ārāme”ti.` — bản Việt mất **cả vị từ `kira`** (mức độ chắc chắn) lẫn phần
*Ngài an trú ở rừng Jeta, trong tu viện của ông Anāthapiṇḍika*. Không dấu lược nào ⇒ **không** phép đo
nào của tôi thấy, kể cả cổng mới.

⇒ Đây là **nén văn xuôi**; chỉ phát hiện được bằng tỉ lệ độ dài, mà tỉ lệ thì **nhiễu** vì nén chữ
là đúng. Cần lát riêng, và cần **đọc tay** — không để máy quyết.

### ⚠️ Lát của tôi **bỏ sót** khoá vì chọn lát theo **tỉ lệ ký tự**

`tf2` phát hiện `mn12:17.2` (4,5×, **cùng lớp**) không có trong lát: nó có `…pe…` thật nên **số dấu lược
đã khớp**, mà phép chọn của tôi dựa trên tỉ lệ. `tf1` cũng báo: `24.1` tỉ lệ 1,0 bị xếp "nhẹ" **nhưng
vẫn bịa `…`**.

⇒ **Lọc theo tỉ lệ bỏ sót lỗi cùng loại.** Lát sau chọn theo **bất biến dấu lược**.

### 🔴 Việc tồn đọng sau 12 bài vừa sửa — **lát riêng**, không gộp

| việc | ở đâu | vì sao chưa sửa |
|---|---|---|
| `mn24:4.4` mất `kira` + cả vế Jeta | `mn24` | cần đọc tay, nằm ngoài lát |
| `mn24:17.7` mất lời dẫn `‘āyasmā sāriputto’ti` ⇒ mất **chủ thể** | `mn24` | ngoài lát |
| `mn24` **15** khoá cùng Pāli mà **3** cách dịch | `mn24` | ngoài lát |
| `mn26:13.3` / `30.1` — Pāli 4 và 3 dấu lược, Việt **0** (chiều ngược) | `mn26` | ngoài lát |
| `mn26` **6** nhóm Pāli trùng còn Việt khác | `mn26` | ngoài lát |
| `dn3` ngoặc kép `“` = **−6**, hỏng sẵn từ trước | `dn3` | `_hvi` chặn cả tệp |
| `dn3:2.2.17 2.10.1 2.10.4 2.10.7 2.10.10` Pāli `…pe…` mà Việt bung | `dn3` | ngoài lát |
| `dn22:14.8` đóng ngoặc kép sớm, `14.11` mở lại | `dn22` | ngoài lát |
| `an3.99:1.1` gộp 4 trạng thái (Pāli chỉ `nava`) + gloss *(vải gai thô)* **trong thân kinh** | `an3.99` | vi phạm `AGENTS.md` |

### ✅ `_fixmeta.py`: vì sao `status`/`blocking_errors` phải là **việc của máy**

Sau sự cố lát `tf1` xoá blocker mà không sửa gì, tôi viết `/Volumes/SSD/opencode-work/_fixmeta.py`:
tính offender **từ dữ liệu**, rồi đặt `draft` + blocker nêu đúng danh sách khoá, hoặc gỡ blocker rồi đặt
`status` theo quality gate. **Cố ý không nâng `semantic_fidelity`** — nâng điểm bằng máy chính là cái
mẫu vừa bị bắt.

**Tiêu chí nghiệm thu:** trên worktree sạch, nơi `tests/unit/truncation.test.ts` đã xanh, script phải
báo **0 thay đổi**. Nếu lệch thì một trong hai đang sai.

⚠️ Script này **lộ bốn lỗi của tôi** trước khi đạt:

1. `SCORE_RE` dùng `^\s*final_score:` ⇒ ăn nhầm dòng `final_score` trong `notes` ⇒ `score` sai
2. `STATUS_RE`/`BLOCK_RE` không `re.M`... không, chúng áp từng dòng; lỗi thật là `SCORE_RE` thiếu `re.M`
   ⇒ `score = None` ⇒ **5.407** tệp bị hạ nhầm
3. `ITEM_RE` giữ dấu nháy kép ⇒ `Khoá: …$` không khớp ⇒ điều kiện bỏ qua **âm thầm** không chạy
4. `fm` là biến của **vòng duyệt cuối**, dùng trong vòng ghi ⇒ assert so **nhầm tệp**

Và nó phải **thu hẹp phạm vi**: bản đầu còn định đặt `status` cho **mọi** tệp, tức cả những tệp
`draft` vì lý do khác mà nó **không biết** — đó là sửa hàng loạt ngoài lát. Nay chỉ đụng tệp đang có
hoặc vừa hết lớp lỗi này.

⇒ Ba lần trong một buổi tôi đo chạy trên **sai cây**: cây chính không có các bản hạ trạng thái đã
commit. Script báo 4.186 và 5.423 tệp trong khi thật chỉ có 67.

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
