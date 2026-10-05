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

## TRẠNG THÁI HIỆN TẠI (đo 2026-10-05 tại `fa8fa926`, `main`)

HEAD của `main` = `fa8fa926` — "đợt 16: 12 bài Việt / 618 khoá + 12 bài lớp lấp / 117 segment (#261)".

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

### 🔴 Phe dấu `ti`: **bốn lát đo, bốn con số, và con số tôi ghi là sai chiều**

Bản ghi cũ của tôi: *"`”ti?` **850** vs `”?` **150** toàn tầng"* — tức **GIỮ**. Đợt 17 có **bốn**
lát độc lập đo lại:

| lát | phạm vi đo | số | kết luận |
|---|---|---|---|
| `n25` | phẩm `sn35` | **129** giữ / 91 bỏ | GIỮ |
| `n26` | phẩm `sn35`, rồi **sát hơn**: cùng phẩm `sn35.124–133` | 131/119 → **4/10** | **BỎ** |
| `n24` | **vị trí `ti` so với ngoặc kép** | `”ti` **3.470** khoá, phe ngược **0** | GIỮ; ghi rõ *"850:150 không tái lập được"* |
| `n27` | **khoá Pāli kết `ti?`/`ti.`** | giữ **3.472** / bỏ **14.125** | **BỎ**, nghiêng ~1:4 |

⇒ Phe **BỎ** nghiêng ~1:4 toàn tầng, tức **con số 850:150 của tôi sai chiều**. Và bốn cách đo cho
bốn con số vì **bốn phạm vi khác nhau** — mỗi lát đo đúng ô mình đo và rút kết luận vượt quá ô đó.
**Đúng mẫu lặp của vụ `tha-ap :0.3` lần nữa.**

Nhưng **phân kỳ là thật**: `sn44.6` bỏ `ti` ở mọi khoá, còn `sn44.3` `sn44.5` trong **cùng phẩm**
vẫn giữ; `sn35.62` `sn35.75` giữ còn `sn35.74` bỏ.

⇒ **Luật đo lại, chốt được:** khi một quy ước văn bản **không đồng nhất toàn tầng**, phải đo ở **phạm
vi gần nhất** (cùng phẩm, bài liền kề) — **không** dùng đa số toàn tầng, vì tầng trộn các quy ước
khác nhau theo phẩm và theo bộ. Và **in cả hai phép** để người đọc tự thấy chúng lệch nhau. Nếu chốt
một phe thì **vá cả hai vế**, không vá riêng bài này.

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
