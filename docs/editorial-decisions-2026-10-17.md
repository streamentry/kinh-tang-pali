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

## 5. Quyết định bổ sung (uỷ quyền lần hai, 2026-10-17)

Người biên tập uỷ quyền tiếp: «can you make decisions for me and finish the job?». Hai việc mục 1
và mục 4 để lại cho người biên tập được quyết như sau.

### 5.1 Dị bản khi Pāli ghim hỏng (thay mục D của hội đồng và mục 1 ở trên, trong phạm vi hẹp)

Pāli ghim **vẫn là authority**; tệp root không đổi; lock và layers không đổi. Ngoại lệ có tên:
một khoá được dịch theo dị bản khi **đủ cả ba** điều kiện:

1. Chữ ghim **hỏng có chứng minh**: không đọc ra được về ngữ pháp hay từ vựng (hapax không có
   lời giải), **hoặc** trái với câu kệ do chính chú giải của văn bản đó trích dẫn và trái mạch văn.
2. Cách đọc thay thế được **ít nhất một ấn bản có tên** ghi nhận: ưu tiên lớp `variant/pli/ms`
   của bilara-data **tại đúng commit đã ghim** (`11c9d708…`, có ký hiệu `bj`, `si`, `sya1ed`,
   `pts-vp-pli1`…); hoặc ấn bản in có trang (Fausbøll, Pāli Thái…).
3. Cách đọc đó **đọc ra được** (DPD/ngữ pháp) và được ít nhất một nguồn giải nghĩa độc lập ủng
   hộ (chú giải, câu song song, bản dịch có tên).

Khi đủ: dịch theo dị bản; chú thích người đọc ở đúng khoá nêu chữ ghim, dị bản, ký hiệu ấn bản
và nguồn; chỗ ấy không còn là blocker «chưa phân xử». Thiếu một điều kiện: giữ như cũ.
Peṭakopadesa không thuộc đợt này (xem 5.3).

### 5.2 Đối chiếu nguồn (`triangulation`)

**Không đổi** cách chấm. Đo trên kho: 1.987 bài đã published không có bản Anh có `triangulation`
trung bình 8,04; 8 bài review còn lại ở 8,4–8,7, tức đã cao hơn mức chung. Tiêu chí kìm các bài
này là `vietnamese_clarity` (8,3–8,6) và `terminology` (8,4–8,8), đúng như người chấm đã phê.
Vì vậy việc tiếp theo là một lượt sửa văn phong tiếng Việt theo đúng các chỗ người chấm phê (giữ
đủ từng chữ của chuỗi đồng nghĩa Niddesa), có người kiểm độc lập; điểm chỉ đổi theo delta ở
`vietnamese_clarity`/`terminology`/`han_viet_balance` khi người kiểm xác nhận cải thiện thật.

### 5.3 Peṭakopadesa

`pe1`–`pe6`, `pe8`, `pe9` (8,24–8,77) **giữ draft**. Mỗi bài có 6–60 chỗ Pāli hỏng; kể cả gỡ hết
bằng 5.1 thì `semantic_fidelity`, `grammar_logic` (6,8–8,1) và `vietnamese_clarity` (6,5–8,2) vẫn
cần tăng vài điểm mỗi tiêu chí, việc chỉ làm được bằng một bản dịch lại toàn bộ có đối chiếu một
bản dịch độc lập (Ñāṇamoli, *The Piṭaka-Disclosure*, PTS 1964 — chưa có quyền dùng). Không làm
trong đợt này.

### 5.4 Kết quả thi hành §5.1–§5.2 (2026-10-17)

Mỗi sửa có một người kiểm độc lập tự mở lại nguồn (lớp variant tại commit ghim, DPD, PED,
chú giải CST, Walters qua SuttaCentral, Indacanda trong `sc-data` đã ghim). Bảng §4 ở trên là
trạng thái trước §5; bảng này thay nó cho các bài dưới đây.

| Bài | Đã làm | Điểm | Trạng thái |
| --- | --- | --- | --- |
| `tha-ap3` | 223.2 theo `purisuttamagāravā` (si, sya, pts); 223.1 `phussa` «tốt lành» theo chữ ghim (DPD) | 9,04 → 9,06 | **published** |
| `tha-ap345` | 1.3 theo bj `tassopadhikkhaye` | 9,12 → 9,13 | **published** |
| `tha-ap548` | 4.2 giữ câu chữ, căn cứ là bj `anantajanasaṁsadi` (PED *saṃsad*) | 9,12 → 9,13 | **published** |
| `tha-ap114` | 8.2 không đủ §5.1 (không có dị bản; chữ ghim đọc được, chỉ mơ hồ 11/18) | 9,21 (giữ) | draft |
| `ja110` | 1.3 theo `bhāsati` (Fausbøll, Pāli Thái, câu kệ do chú giải trích) | 8,94 → 8,97 | review |
| `mnd13` | đồng bộ 21 dòng kệ với snp4.13 theo lời giải (101 khoá) | 8,96 → 8,97 | review |
| `mnd8` | văn phong 78.x, 19.6, 25.6 | 8,99 → 9,00 | review (đúng 9,0) |
| `ja526` | văn phong 41.2, 29.2 | 8,97 → 8,98 | review |
| `mnd2` | văn phong `vipphandati` | 8,99 (giữ) | review |
| `mnd14`, `mnd16` | văn phong lẻ bị người kiểm phán lệch, đã hoàn nguyên | giữ | review |
| `mnd3` | 0 khoá đổi (mọi lời phê nằm ở kệ/công thức chung) | 9,00 (giữ) | review |

**Còn lại sau đợt này:** 8 review (8,93–9,00) và 9 draft (`pe1`–`pe6`, `pe8`, `pe9`,
`tha-ap114`). Những gì còn có thể nâng các bài review đều là việc **cấp kho**, không phải sửa lẻ:
thống nhất công thức Niddesa dùng chung với bài đã published (ví dụ «mạng sống là một, thân thể
là một khác», «đối với người nào những vị…»), họ động từ *sam-* theo B19 kể cả `snp4.14`, và các
dòng kệ mà lời giải Niddesa trái bản Snp đã published (`kamma`, `vivāda`, `jappa`… ở snp4.13).

### 5.5 Peṭakopadesa: thí điểm gỡ chỗ hỏng bằng câu song song (bổ sung, 2026-10-17)

Đính chính một phần §5.3. Lớp variant tại commit ghim chỉ ghi dị bản cho 1–47 khoá mỗi bài pe
(pe4: 1), nên §5.1 gỡ được rất ít. Nhưng Peṭakopadesa trùng nhiều đoạn với Nettippakaraṇa và
với kinh được trích, đều có trong Pāli ghim. Theo tiền lệ E của hội đồng (ps2.9:21.14: Pāli ghim
thiếu chữ, dịch theo câu song song + chú thích, không coi là blocker), mỗi locus trong blocker
được thử lần lượt: đọc được theo chữ ghim (DPD/ngữ pháp) → câu song song trong Pāli ghim →
dị bản §5.1. Thí điểm trên `pe3`, `pe4`, `pe6`, `pe9`.

Bài pe chỉ được chấm lại khi **mọi** locus đã gỡ (không còn blocker «chưa phân xử»). Vì khi đó
nội dung đổi ở nhiều chỗ, bài được chấm lại **toàn bài** bởi một người chấm độc lập mới theo
giao thức chống neo điểm (không đọc điểm cũ trước, tự đọc mẫu khoá ngẫu nhiên, triangulation phản
ánh việc không có bản dịch độc lập), không theo delta. Còn locus nào không gỡ được thì bài giữ
draft và không chấm.

### 5.6 Peṭakopadesa lượt hai: bản in BJT làm ấn bản có tên (bổ sung, 2026-10-17)

Thí điểm §5.5 gỡ được 57/225 locus. Lớp variant tại commit ghim rất thưa cho pe (1–47 khoá mỗi
bài), nhưng toàn văn ấn bản Buddha Jayanti (BJT, Sri Lanka) của Peṭakopadesa có sẵn: bản số hoá
tipitaka.lk (kèm cước chú dị bản của BJT `[BJTfn: …]`) và bản in lại trong *Tam Tạng Pāli–Việt*
của Bhikkhu Indacanda (Pāli BJT có cước chú dị bản Ma, Syā, PTS, kèm bản dịch Việt). Quyết định:

- BJT là **ấn bản có tên** theo điều kiện 2 của §5.1; dẫn bằng tên ấn bản, số trang tipitaka.lk
  và số trang tập TTPV.
- Điều kiện 3 vẫn phải đủ: cách đọc BJT **đọc ra được** theo DPD/ngữ pháp **và** có ít nhất một
  nguồn giải nghĩa: câu song song trong Pāli ghim, hoặc một bản dịch có tên đọc theo cách đó.
  Bản dịch Việt của Indacanda là một bản dịch có tên (người dịch khác với ban biên tập BJT), nên
  được dùng làm nguồn giải nghĩa; Ñāṇamoli (*The Piṭaka-Disclosure*, PTS 1964) chỉ được dẫn tên
  cách đọc một chữ, không chép lời dịch.
- Cách đọc BJT không đọc ra được, hoặc BJT trùng chữ ghim, thì locus giữ nguyên trong blocker.
- Các quy tắc khác của §5.5 giữ nguyên: bài chỉ được chấm lại toàn bài khi mọi locus đã gỡ.

## 6. Quyết định bổ sung (uỷ quyền lần ba, 2026-10-18)

Người biên tập uỷ quyền quyết định để hoàn tất các bài còn dưới ngưỡng: `mnd14` (8,99), `ja110`
(8,98) ở `review`; `pe1`–`pe6`, `pe8`, `pe9` ở `draft`. Mọi quyết định dưới đây giữ nguyên ngưỡng
`> 9,0`, giữ luật «blocker thắng điểm», và không cho cộng điểm khi không có bằng chứng.

### 6.1 `technical_integrity` phải phản ánh kết quả máy hiện tại

Rubric (§2 của `docs/quality-assessments.md`) đòi tiêu chí 10 phản ánh **kết quả máy thực tế**.
Hai lượt chấm của `mnd14` và `ja110` hạ tiêu chí này xuống 9,2 và ghi rõ lý do là một lệnh bắt buộc
fail **tạm thời**: `quality:check` báo «official quality does not match its current saved full
assessment» vì lời kinh vừa đổi mà lượt chấm chưa được ghi (tự hết khi ghi lượt chấm). Lỗi ấy nay
không còn: `quality:check`, `validate`, `test`, `check`, `build` xanh trên `main`.

Quyết định: khi lý do hạ `technical_integrity` được ghi rõ là một lệnh fail tạm thời và lệnh ấy nay
pass cho đúng nội dung bài, một **người kiểm độc lập tự chạy lại các lệnh** rồi chấm lại tiêu chí
này; mức không vượt mức chính bài ấy từng được khi các lệnh pass (cả hai bài: 9,6, đúng mức chung
của 1.799 bài KN đã published). Không áp cho lý do khác. Đây là đo lại, không phải sửa bản dịch;
báo cáo phải nói thẳng như vậy.

### 6.2 Locus Pāli hỏng không gỡ được: phán xử «bất định có chú thích»

Khi một locus đã được thử hết mọi nguồn có tên — chữ ghim (DPD, ngữ pháp), câu song song trong Pāli
ghim (tiền lệ E), lớp variant (§5.1), bản in BJT và TTPV (§5.6) — mà vẫn không gỡ được, người biên
tập phán xử locus đó là **bất định có chú thích**:

- bản dịch giữ cách đọc sát chữ ghim nhất (chữ bổ để trong `[ ]`), không đoán thêm ý;
- chú thích tại khoá nêu chữ ghim, cách đọc BJT/dị bản nếu có, vì sao không gỡ được, và các cách
  hiểu khả dĩ (Ñāṇamoli chỉ được dẫn tên cách đọc);
- locus đã phán như vậy **không còn là blocker «chưa phân xử»**, theo nguyên tắc 3 của hội đồng, tiền
  lệ E và cách xử `tha-ap114:8.2` ở §5.4;
- chỗ hỏng vẫn phải được tính vào `semantic_fidelity`, `vietnamese_clarity` và
  `ambiguity_integrity` ở lượt chấm lại toàn bài.

### 6.3 Peṭakopadesa lượt ba: đối chiếu bản dịch độc lập Indacanda

§5.3 nêu điều kiện để nâng các bài pe: một lượt dịch lại có đối chiếu một bản dịch độc lập. Bản dịch
Việt của Bhikkhu Indacanda (TTPV tập 44, đã được §5.6 nhận là bản dịch có tên) đáp ứng điều kiện
ấy. Quyết định:

- mỗi bài pe được đối chiếu **toàn bài, ở mức đoạn**, với bản Indacanda; mọi chỗ khác nghĩa được
  phân xử bằng Pāli ghim (và BJT ở những locus §5.6 đã dùng); chỉ sửa lỗi thật và câu tối nghĩa, không
  chép lời Indacanda;
- mỗi sửa có người kiểm độc lập;
- sau khi mọi locus đã gỡ hoặc đã phán theo §6.2, bài được **chấm lại toàn bài** theo giao thức §5.5
  (người chấm mới, chống neo điểm); `triangulation` phản ánh việc đã đối chiếu một bản dịch độc lập
  toàn bài;
- trạng thái theo cổng; không đặt trước kết quả. Bài vẫn `≤ 9,0` sau lượt này thì báo cáo thẳng.
