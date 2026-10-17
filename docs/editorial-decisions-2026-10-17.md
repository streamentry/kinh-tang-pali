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
  - `ja545:69.2–69.4` giữ dấu nháy của Pāli ghim (lời nói), không đổi thành lời kể.
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
| `Kāmā te paṭhamā senā` thiếu `te` («của ngươi») ở `mnd13:142.1`, `cnd11:11.1`, `mnd4:49.1`, `mnd8:67.1`, `snp3.2:12.1` | Sửa: thêm «của ngươi» | Lỗi rõ: bỏ sót chữ (nguyên tắc 1 của hội đồng). |
| Chuỗi `timi timiṅgalo timirapiṅgalo` | Giữ, có chú thích | Không có bằng chứng phân xử bậc. |
| `paralokavajja` | Giữ «lỗi lầm liên quan đến đời sau» như 9 bài trong kho | Đa số kho; không có lỗi nghĩa. |
| Thuật ngữ lệch **trong cùng một bài** (`thaddha`, `vesārajja`, `jappati`, `kappa/vikappa`, chuỗi danh hiệu, «tám chi»…) | Thống nhất trong bài theo cách đa số của nhóm Niddesa (cnd/mnd) và theo dòng kệ gốc trong Snp; `thaddha` «bướng bỉnh» | Nguyên tắc 2 của hội đồng (đổi ít khoá nhất). Không đổi toàn kho. |
| Danh xưng `Sāriputta` | Giữ dạng Pāli như 1.934 chỗ trong kho | Đa số kho. |
| `jessantaṁ`, `gāmaṇīyehi`, `bhaddante` trong `ja547` | Theo chú giải Jātaka (CST) khi chú giải giải đúng chữ ghim; không có lời giải thì giữ và chú thích | §3.2 mục 5. |
| Tiêu đề `ja183`, `ja187` | Giữ tên Pāli, có chú thích | Không có nghĩa chắc chắn. |

## 4. Kết quả

Kết quả thi hành và các bài vẫn ≤ 9,0 được ghi ở cuối văn bản này sau khi chấm delta.
