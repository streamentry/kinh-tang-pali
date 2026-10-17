# Quyết định biên tập 2026-10-17 — các việc còn treo sau wave B

Ngày 2026-10-17 người biên tập **uỷ quyền** cho agent (Claude Code) quyết các việc mà
`docs/review-2026-10-15-findings.md` và notes của 10 bài `review` + 12 bài `draft` còn ghi là
«để người biên tập quyết» (nguyên văn: «bạn quyết giúp tôi luôn nhé»). Văn bản này ghi các
quyết định đó và lý do. Đây là quyết định do agent đưa ra theo uỷ quyền, **không phải chữ ký
của người biên tập**; người biên tập có quyền đảo bất kỳ mục nào.

Giới hạn của uỷ quyền mà agent tự đặt ra: không đổi invariant viết trong `AGENTS.md`
(Pāli ghim là authority cuối cùng; không đổi lock, layers, giấy phép, audio), vì những điều đó
là luật của repository, không phải việc «còn treo».

## 1. Pāli ghim hỏng: giữ chính sách D của hội đồng

- **Không** dịch theo dị bản (BJT, PTS, Fausbøll, Thái) thay cho chữ ghim. Lý do: `AGENTS.md`
  ghi Pāli ghim là authority cuối cùng khi các nguồn bất đồng; đổi điều đó là đổi invariant
  của repository, vượt quá việc «còn treo».
- Chú giải và từ điển vẫn là **bằng chứng về nghĩa** của chữ ghim (§3.2 mục 5, tiền lệ A14, A15):
  khi chú giải giải thích được chính chữ ghim (hapax, hợp từ khó, cách tách), bản dịch theo lời
  giải đó, có chú thích nêu nguồn, và chỗ ấy không còn là blocker «chưa phân xử».
- Hệ quả:
  - `pe1`–`pe6`, `pe8`, `pe9` **giữ `draft`**. Mỗi bài có hàng chục chỗ Pāli hỏng mà VRI/CST
    không gỡ được (Pāli ghim chép từ CST); chỉ BJT gỡ được một phần, tức là dịch theo dị bản.
    Điểm hiện 8,24–8,77: kể cả gỡ hết blocker thì vẫn cần tăng 0,3–0,8 điểm trung bình, không
    có sửa có căn cứ nào làm được điều đó. **Báo cáo thẳng: không đưa lên được.**
  - `ja110:1.3` giữ «sợ điều dối trá» theo chữ ghim `bhāyatiyaṁ`. DPD cho `bhāyati` đi với đối
    cách, nên chữ ghim không sai ngữ pháp; «nói dối» là cách đọc của dị bản `bhāsati`. Hồ sơ
    nguồn: `docs/translation-notes/ja110.md`. Bài ở `review` 8,94.
  - `ja545:69.2–69.4`: **đính chính** (cùng ngày). Bản đầu của văn bản này ghi «giữ dấu nháy của Pāli ghim». Dấu nháy là dấu chấm câu do người biên tập ấn bản Mahāsaṅgīti thêm vào, không phải chữ Pāli; theo chính các chữ ghim (`bahumaññatha` quá khứ ngôi ba, `byāvaṭo` không có chủ ngữ ngôi một, `69.1` cần vị ngữ) và chú giải, Cowell, Indacanda, đây là lời kể. Bản dịch đọc là lời kể, chú thích nêu cách đọc theo dấu nháy. Dịch theo chữ ghim, không theo dị bản, nên không trái chính sách D.
  - `tha-ap3:223.1–223.2`, `tha-ap114:8.2`, `tha-ap345:1.3`, `tha-ap548:4.2`: tra chú giải
    Apadāna (Visuddhajanavilāsinī, CST) cho đúng chữ ghim. Có lời giải thì dịch theo và gỡ
    blocker; không có thì giữ `draft` và báo cáo.

## 2. Phương pháp chấm

- Lượt **chấm lại độc lập** 2026-10-17 (người chấm mới, không neo điểm cũ, đọc thêm 30 khoá
  ngẫu nhiên, triangulation phản ánh việc vắng bản Anh) được nhận là điểm chính thức. Nó thay
  quy tắc «+0,1 tối đa» ở mục F của hội đồng cho các bài đã chấm theo cách đó.
- **Không chấm toàn bài thêm vòng nào** cho cùng bài chỉ để thử điểm khác. Từ nay điểm chỉ đổi
  theo **delta**: một sửa đã được người kiểm độc lập xác nhận là sửa lỗi thật thì tiêu chí bị
  ảnh hưởng trực tiếp được cộng (thường +0,1, tối đa +0,2 mỗi tiêu chí mỗi lượt); sửa thuần
  văn phong hay thêm chú thích không cộng `semantic_fidelity`/`grammar_logic`. `triangulation`
  không tăng nếu không có bản dịch độc lập mới được đối chiếu ở mức segment.

## 3. Thuật ngữ và lỗi còn treo

| Việc | Quyết định | Lý do |
| --- | --- | --- |
| `vāda`, `upeti vādaṁ` trong `mnd3` (~15 khoá) | Dịch theo lời giải của chính Niddesa ở từng đoạn: `5.x` *vāda* = lời phỉ báng (`5.2`: *paratoghoso akkoso upavādo … abhūtena*, lời mắng nhiếc, chê trách không đúng sự thật); `60.x` *vādaṁ upeti* = bị gọi là, mang danh (`60.11`: bị gọi là người địa ngục, súc sinh…) | Niddesa là văn bản đang dịch và tự giải chữ này; giữ «tranh luận» thì lời giải ngay sau không khớp lời kệ. `snp4.3` (văn cảnh không có lời giải, có bản Anh) giữ nguyên. |
| `(ap)paṭinissaṭṭha` trong công thức `pahīno … paṭinissaṭṭho` (~49 khoá cnd/mnd) | Giữ «(chưa) được từ bỏ» | `pahīna` đã là «đoạn trừ» nên không va chạm; B10 «xả bỏ» chốt danh từ `paṭinissagga`. Đổi 49 khoá (phần lớn đã published) không sửa lỗi nghĩa nào. |
| `Kāmā te paṭhamā senā` ở `mnd13:142.1`, `cnd11:11.1`, `mnd4:49.1`, `mnd8:67.1`, `snp3.2:12.1` | Không còn việc: cả 5 khoá đã có «của ngươi» từ #667 (ghi chú cũ «chưa sửa» đã lỗi thời). Các dòng sau của kệ có `te` (`12.3`, `13.1`, `13.4`…) giữ như hiện tại | «của ngươi» ở dòng đầu phủ cả bài kệ; Sujato cũng không lặp *your*. |
| Chuỗi `timi timiṅgalo timirapiṅgalo` | Giữ, có chú thích | Không có bằng chứng phân xử bậc. |
| `paralokavajja` | Giữ «lỗi lầm liên quan đến đời sau» như 9 bài trong kho | Đa số kho; không có lỗi nghĩa. |
| Thuật ngữ lệch **trong cùng một bài** (`thaddha`, `vesārajja`, `jappati`, `kappa/vikappa`, chuỗi danh hiệu, «tám chi»…) | Thống nhất trong bài theo cách đa số của nhóm Niddesa (cnd/mnd) và theo dòng kệ gốc trong Snp; `thaddha` «bướng bỉnh» | Nguyên tắc 2 của hội đồng (đổi ít khoá nhất). Không đổi toàn kho. |
| Danh xưng `Sāriputta` | Giữ dạng Pāli như 1.934 chỗ trong kho | Đa số kho. |
| `jessantaṁ`, `gāmaṇīyehi`, `bhaddante` trong `ja547` | Theo chú giải Jātaka (CST) khi chú giải giải đúng chữ ghim; không có lời giải thì giữ và chú thích | §3.2 mục 5. |
| Tiêu đề `ja183`, `ja187` | Giữ tên Pāli, có chú thích | Không có nghĩa chắc chắn. |

## 4. Kết quả (2026-10-17)

Mỗi bài có thay đổi được một người kiểm độc lập (không phải người sửa) soát từng khoá với Pāli ghim,
DPD và chính nguồn chú giải được dẫn, rồi chấm delta theo mục 2. Không bài nào được chấm lại toàn bài.

| Bài | Đã làm | Điểm | Trạng thái |
| --- | --- | --- | --- |
| `ja547` | `gāmaṇīyehi` theo chú giải (thầy luyện voi/ngựa, thầy đánh xe — 149.1 theo lời giải dòng y hệt ở chú giải Ja 539), `jessantaṁ` «đi lang thang»; `bhaddante` giữ (chú giải không giải) | 9,00 → 9,02 | **published** |
| `mnd3` | `vāda` theo lời giải của chính Niddesa (20 khoá; sửa lỗi nghĩa thật); rà lại 565 khoá: 0 lỗi | 8,97 → 9,00 | review (đúng 9,0 không đủ) |
| `ja526` | 26.2, 26.4, 28.4, 29.2 theo chú giải Niḷinikājātaka; rà lại: 14.2 `āsādayiṁ`, 6.1 `saṅkhāto` | 8,92 → 8,97 | review |
| `mnd14` | thống nhất chuỗi danh hiệu 60.2, `kappento` 39.3; rà lại: 163.2, 164.2 `ekacce … bhikkhū` (đối cách) | 8,93 → 8,96 | review |
| `mnd16` | «của Ma» 185.3/185.5, chuỗi danh hiệu 26.2; rà lại: `kittakā` nghi vấn (83.7, 89.2) | 8,90 → 8,93 | review |
| `mnd8` | chú thích `timitimiṅgala`; rà lại: 61.5 `paṭisenikattā` danh từ chỉ người | 8,97 → 8,99 | review |
| `ja545` | 69.1–69.4 đọc là lời kể (xem mục 1, đính chính) | 9,00 → 9,02 | **published** |
| `mnd2` | rà lại: 124.3 `pūjanīyo` «đáng được … cúng dường» (cùng sửa `cnd8:57.3`, `snp3.6:28.3`) | 8,98 → 8,99 | review |
| `mnd13` | rà lại: `pakappitā` bị động (109.2, 111.1–111.4, 115.2) | 8,94 → 8,96 | review |
| `ja110` | giữ chữ ghim (mục 1) | 8,94 (giữ) | review |
| `tha-ap3`, `tha-ap114`, `tha-ap345`, `tha-ap548` | chú giải Visuddhajanavilāsinī (CST `s0510a.att1`, `att12`, `att32`, `att41`) có phủ cả bốn bài nhưng **không bình đúng chữ ghim**; DPD chỉ có tách chữ bằng máy. Thêm chú thích nêu kết quả tra và dị bản | giữ | **draft** |
| `pe1`–`pe6`, `pe8`, `pe9` | không làm (mục 1) | giữ | **draft** |

Đồng bộ kèm theo: `ja529:57.3` (published) `jessantaṁ` «đang đi lang thang», cùng dòng Pāli và cùng lời giải với `ja547:66.3`.

**Không đưa lên được bằng sửa có căn cứ** (báo cáo thẳng):

- Sau thi hành và một lượt rà lỗi còn sót (mỗi bài đọc hết mọi khoá, mỗi sửa có kiểm độc lập), 8 bài review còn lại nằm ở 8,94–9,00. Phần trừ chung là `triangulation` 8,4–8,7, vì không có bản Anh hay bản Việt độc lập để đối chiếu. Mục 2 không cho tăng tiêu chí này khi không có bản dịch độc lập mới. Không còn lỗi nghĩa nào đã biết mà chưa sửa.
- 12 bài draft: ở 4 bài tha-ap, blocker là chữ ghim mà chú giải không giải; muốn gỡ thì phải dịch theo dị bản BJT, tức là đổi chính sách D. Ở 8 bài pe, Pāli hỏng nhiều chỗ và điểm thấp (mục 1).
- Ghi để người biên tập xét, chưa làm: `gāmaṇīyehi` ở `ja529`, `ja539` dịch «đội trưởng» (khớp DPD «squadron leader», khác lời giải «ācariya» của chú giải); `cnd19:7.2` còn chuỗi danh hiệu cũ; `mnd8:77.11` «tám ngành», `78.15` «bốn điều không run sợ» (mỗi chữ chỉ xuất hiện một lần trong bài, khác đa số cnd/mnd).
