# Ba cách dịch cùng một Pāli: `āraddhavīriyo viharati…` và `udayatthagāminiyā paññāya…`

Ghi lại 2026-09-29, phát hiện khi dịch `an/an10.11` (chương 2, Phẩm Bảo Hộ).

## Vấn đề

Hai mệnh đề này thuộc danh sách **mười phẩm** quen thuộc, và xuất hiện ở nhiều bài. Tại
commit bilara đã ghim, chúng **không** được dịch thống nhất.

### 1. `āraddhavīriyo viharati, akusalānaṁ dhammānaṁ pahānāya, kusalānaṁ dhammānaṁ upasampadāya, thāmavā daḷhaparakkamo anikkhittadhuro kusalesu dhammesu;`

| Cách dịch | Segment | Bài |
| --- | --- | --- |
| **A. "sống tinh tấn kiên trì để từ bỏ…"** | **11** | `an5.135` (×2), `an5.136`, `an4.259`, `an4.260`, `an5.14`, `an5.2`, … |
| B. "sống với tinh tấn đã được khởi động…" | 4 | `an3.20`, `an3.96`, `an3.97`, `an3.98` |
| C. "an trú với tinh tấn đã khởi…" | 2 | `an10.50` (chương 5, PR #110) |

Cách A tốt nhất về tiếng Việt: *"tinh tấn kiên trì"* và *"sức mạnh, nỗ lực dẻo dai"* gọi
đúng `daḷhaparakkamo`; cách C viết *"mạnh mẽ, dõng mã"* cho cùng từ đó và dùng
*"gánh phần"* cho `anikkhittadhuro` thay vì *"gánh nặng"*.

### 2. `paññavā hoti, udayatthagāminiyā paññāya samannāgato ariyāya nibbedhikāya sammā dukkhakkhayagāminiyā;`

| Cách dịch | Segment | Bài |
| --- | --- | --- |
| **A. "có trí tuệ; đầy đủ trí tuệ hướng đến sự sanh diệt, thuộc bậc Thánh, thấu suốt, đưa đến hoàn toàn chấm dứt khổ đau"** | **10** | `an5.134`, `an5.135` (×2), `an5.136` (×2), `an5.122`, … |
| B. "có tuệ về sự sinh khởi và hoại diệt, tuệ Thánh đưa đến xuyên thấu, đưa đến tận cùng khổ đau đúng chánh" | 2 | `an10.50` (chương 5, PR #110) |

## Lựa chọn đã ghi ở chương 2, và vì sao

`an10.11:2.6`, `an10.17:7.1`–`7.2` và `an10.18:8.1`–`8.2` (mười pháp làm nên sự bảo hộ)
dùng **cách C** cho `āraddhavīriyo` và **cách B** cho `udayatthagāminiyā` — tức là **nguyên
văn `an10.50`**, dù hai cách đó là thiểu số toàn corpus.

Lý do ghi trong metadata: `an10.17` và `an10.18` **chính là cùng danh sách mười phẩm** với
`an10.50`; người đọc Tăng Chi Bộ sẽ gặp `an10.17` rồi `an10.50`, và phải thấy một cách
trong chính quyển đó. Sự nhất quán trong quyển được ưu tiên hơn một câu dịch hay hơn ở
quyển khác — cùng nguyên tắc đã dùng cho `ācāragocarasampanno` (xem
`acara-gocara-sankhadesu.md`).

Hệ quả phải nói thẳng: lựa chọn này **làm thiểu số từ 2 lên 5** thay vì thu hẹp được
khoảng cách. Đây là hệ quả có chủ ý của nguyên tắc ưu tiên quyển, không phải do không
biết số đếm.

## `an10.11:2.6` – cùng Pāli nhưng dùng cách C, không phải cách A

`an5.135:3.7` là **cùng Pāli** với `an10.11:2.6` (chỉ khác dấu câu). Tức là trong
Tăng Chi Bộ, `an10.11` lệch `an5.135`, còn `an10.17`/`an10.18`/`an10.50` thì khớp nhau.
Đây là hệ quả trực tiếp của lựa chọn trên; ghi lại để người sau không tưởng là lỗi.

## Đề xuất

Thuần nhất toàn corpus là sửa `an10.50:10.1`, `:10.2`, `:13.1`, `:13.2` (và theo đó
`an10.11:2.6`–`2.7`, `an10.17:7.1`–`7.2`, `:10.1`–`10.2`, `an10.18:8.1`–`8.2`, `:11.1`–`11.2`)
theo cách A / cách A. Đó là sửa **đổi nghĩa** ở 4 bài đã `published`, nên kéo theo việc
hạ `semantic_fidelity` của bốn scorecard — không thuộc phạm vi một PR dịch chương.
Người biên tập quyết định.

Đáng cân nhắc thêm: hai cụm này chỉ có 17 và 12 segment, nên đủ nhỏ để đặt vào một danh
sách kiểm thử — cùng kiểu với `adhamma-dhamma-root-of-dispute.md`.
