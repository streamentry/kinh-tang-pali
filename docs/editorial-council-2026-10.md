# Biên bản hội đồng biên tập 2026-10-16 — các quyết định chung cho Tiểu Bộ

Biên bản này chốt các việc mà `docs/review-2026-10-15-findings.md` đã ghi là "chờ người biên tập quyết định chung". Hội đồng gồm bốn góc nhìn phương pháp, mượn tên các vị đệ tử chỉ để gọi **vai trò lập luận**, không phải để nhân danh hay thay thế thẩm quyền của người biên tập:

| Vai | Câu hỏi đặt ra |
| --- | --- |
| Upāli (giới luật, giữ chữ) | Chữ Pāli ghim nói gì, có bị bỏ hay thêm không? |
| Ānanda (truyền thống đã nghe) | Truyền thống Việt (HT. Thích Minh Châu, Bhikkhu Indacanda) và các bài đã đồng nhất dùng thế nào? |
| Mahākassapa (thận trọng) | Có lỗi nghĩa thật không, hay chỉ là sở thích? Đổi hàng loạt có đáng rủi ro không? |
| Sāriputta (phân tích nghĩa) | Từ điển và ngữ pháp (PED, DPD, Niddesa) xác định nghĩa thế nào? |

Căn cứ: chín hồ sơ thẩm tra R1–R9 (đếm bằng script trên `main` tại `855c20fe`, mỗi hồ sơ có số đếm, uid mẫu, Sujato, Indacanda, PED/DPD). Điểm do agent chấm vẫn chưa được người biên tập xác nhận; biên bản này cũng **chưa có chữ ký của người biên tập**, nên người biên tập có quyền đảo bất kỳ quyết định nào bên dưới.

## Nguyên tắc chung (thứ tự §12 của `skill/translation.md`)

1. **Lỗi rõ** (chỉ có một cách đúng theo Pāli ghim và từ điển) thì sửa, không cần phiếu.
2. **Thuật ngữ chọn một trong nhiều**: theo thứ tự nghĩa Pāli → logic → văn cảnh → thuật ngữ → tính nhất quán → rõ ràng. Khi hai phương án ngang nhau, chọn phương án đã là đa số của kho (đổi ít khoá nhất).
3. **Bất định thật** thì không đổi lời kinh; chỉ ghi chú.
4. **Không đưa dị bản Pāli vào lời kinh.** Pāli ghim (bilara/Mahāsaṅgīti) vẫn là authority; chú giải và từ điển là bằng chứng về nghĩa (§3.2 mục 5), dị bản BJT/PTS chỉ để phát hiện chỗ cần xem. Không đổi `source/suttacentral.lock.json` hay `source/layers.yaml`.
5. **Không chạm `mn1`–`mn104`** (đã có audio phát hành). Mọi quyết định bên dưới đã loại các khoá này; chúng chỉ là bằng chứng đọc.
6. Mọi bài đổi nội dung phải **chấm lại** bằng `quality --record/--apply`; điểm chỉ tăng khi sửa một lỗi nghĩa/ngữ pháp thật.

## A. Lỗi rõ — thi hành ngay

| Mã | Việc | Phạm vi |
| --- | --- | --- |
| A1 | `adurāgataṁ` ("chẳng có gì khó nhọc" sai): `durāgata` là "đến không được chào đón", `adurāgata` là "đến không phải là điều không mong". Kèm `thag1.9:1.1–1.2`, `an10.71:8.1`, `an5.140:12.2`, `pe8:123.2` | 15 + 4 khoá |
| A2 | `oḷārikā`/`anusahagatā`: tính từ phải phủ cả dục ái lẫn sân (mnd2, mnd14, mnd4, ps1.1, ps1.3, ps1.9, ps2.1, ps2.5). Chữ `anusahagata` giữ "vi tế", thêm glossary "dư tàn" | 28 khoá / 8 bài |
| A3 | `vipatti` = "thất nghiệp" (mất việc làm) | 70 khoá |
| A4 | Chín thể loại kinh (`navaṅga`) theo đúng danh sách mn22; bỏ "kinh khất đàm, kinh khế tùng…" | ≈42 khoá |
| A5 | `ajjhosita` (5 khoá phủ định bị đảo), `abhijānamāno` ≠ "liễu tri" (7 khoá), `snp4.9:2.3` thừa "thủ", `an4.10:1.5` (`pajānāti` ≠ `parijānāti`), `tha-ap154:4.3–4.4` | ≈20 khoá |
| A6 | "tâm tịnh tín bội phần" thừa ý (`bhiyyo` chỉ là "thêm") → "ta càng làm cho tâm thêm tịnh tín" | 20 khoá |
| A7 | `upaṭṭhāka/upaṭṭhikā` cho cư sĩ ≠ "thị giả" → "thí chủ hộ độ hàng đầu" (như mn81, Indacanda); 30 khoá tỳ-kheo thị giả giữ nguyên | 59 khoá / 26 bài bv |
| A8 | `Sopi/So ca buddho asamasamo`: tính ngữ, không phải vị ngữ "cũng ngang bằng"; sửa theo bv11:32.1 | 8–9 khoá |
| A9 | `kappasate` đi với `ramissati` = "Trong … kiếp" (tha-ap410:43.1, tha-ap487:16.1–17.1); `anīkaṭṭhā` = "quân hộ vệ" (tha-ap411:24.1); `tha-ap122:2.1` `nemittā` = "nhà đoán tướng"; `tha-ap428` (kệ 1–2, `vātaroga` = "bệnh gió"); `tha-ap453:5.2,5.4` `jagatī` = mặt đất | ≈12 khoá |
| A10 | `vibhūto vibhāvito` đảo ở `cnd23:325.3–4`; `dhunātha` "chặn đứng" → "đánh tan" (7 khoá: sn6.14, thag3.13, pe3, ne10); `snp4.12:4.1` bỏ phủ định `navīvadātā` (+ `samattā` ở 4.4) | 11 khoá |
| A11 | `dn2:57.2` `kaṇṇikā` "thỏ" → "khuyên tai" (như dn1, mnd14) | 1 khoá |
| A12 | `mil3.6.4:1.7,1.9` (`koñca` = sếu, không phải "tiếng vàng"), `thag1.97:1.4` `dutiyābhisecanaṁ` = "lễ quán đảnh thứ hai", `tha-ap501:5.3` `Ekasattatikkhattuñca` = "Và bảy mươi mốt lần", `an5.207:1.3` (câu sai cả câu), `ja526:12.2` `pajja` = "dầu thoa chân", `ud3.9` "chiêm tinh" ≠ `khattavijjā` | ≈9 khoá |
| A13 | `ps1.0` tiêu đề và 9 tên bài Jātaka sai nghĩa (ja77 `Mahāsupina`, ja73 `Saccaṅkira`, ja69 `Visavanta`…), "Phẩm Kaccānivagga" → "Phẩm Kaccānī" (10 khoá), 208 khoá thừa dấu chấm kép (`?”.` `.”.` `!”.`), "tuyên ngợ" (22 khoá) | ≈250 khoá |
| A14 | `ja514` `anāvasūraṁ` ("khi mặt trời chưa lặn", PED J v 56) và `ja515` `uttamāhevanandaho`: dùng chú giải và PED (bằng chứng về nghĩa theo §3.2) để gỡ blocker | 4 khoá |
| A15 | English fill `dhp44-59` `Pathavikathāpasuta…`: `pasuta` = "engaged in", chú giải kể các tỳ-kheo "bàn chuyện đất đai"; bản Việt "địa đại" cũng xem lại | 1 + 1 khoá |
| A16 | `yassa kammassidaṁ phalaṁ` 5 khoá còn "nghiệp nào" → "về nghiệp mà đây là quả báo" (như 79/84 khoá khác) | 5 khoá |

## B. Chọn thuật ngữ — quyết định

Mỗi mục: phương án chốt · lý do · phạm vi · ý kiến khác.

| Mã | Chốt | Lý do chính | Phạm vi | Ý kiến khác |
| --- | --- | --- | --- | --- |
| B1 | `visattikā` = **"sự vướng mắc ở đời"**; `tare` = "có thể vượt qua" | PED p.639, DPD: bám/dính/vướng, không phải "say"; "dính mắc" đã dùng cho `saṅga`; khớp `visatta`/`sajjati` | ≈149 khoá / 42 bài (trừ mn25:20.2, mn26:42.3) | Niddesa có hai cách giải; chữ "ở đời" giữ nguyên để không chọn hộ |
| B2 | `sayambhū` = **"bậc Tự Giác"** | DPD/Sujato "self-awakened"; "Tự Tại" đang trùng cách dịch `vasī`/`issara` (≥99 khoá) | 109 + 4 khoá / 83 bài | Phương án dự phòng "Tự Chủ" của Indacanda |
| B3 | `iddhipāda` = **"như ý túc"** | Đa số 354 khoá; mn16/77/103/104 đã dùng; kèm 2 lỗi rõ sn51.15:3.2/3.5, an9.84-91:1.1 | ≈141 khoá / 55 bài | — |
| B4 | `vipatti` = **"thất bại (về giới…)"** cặp với "thành tựu" (không chạm nghĩa "tai họa") | Cặp `sampadā/vipatti` | ≈105 khoá / 21 bài | — |
| B5 | `hāra` (Netti/Peṭaka) = **"phương thức"** | "hướng dẫn" trùng nghĩa với chính chữ `netti`; PED p.731 "category" | ≈236 khoá / 24 bài | Chỉ áp cho Netti thì 82 khoá / 18 bài; hội đồng chọn áp toàn tầng Netti–Peṭaka |
| B6 | `sati` ở Milinda: **"niệm"** (năng lực), **"trí nhớ"** (mil3.6.10, mil3.7.1, phẩm Sativagga); "chánh niệm" chỉ cho `sammāsati` | Dịch `sati` trần là "chánh niệm" thì thêm ý | 69 khoá / 15 bài | — |
| B7 | `mahabbhayaṁ` = **"nỗi sợ lớn"** (bỏ "nhất") | DPD "great fear", kammadhāraya; hiện tự mâu thuẫn trong pe1 | 21 khoá / 6 bài | Sujato "greatest" |
| B8 | `āvajjana` "hướng tâm"; `abhiniropana` → **"gắn tâm"** | Tách hai thuật ngữ đang trùng | ≈65 + 24 khoá | — |
| B9 | `pariññā/parijānāti` = **"liễu tri"** cả họ (mn giữ "hiểu thấu") | 441 khoá đã dùng; truyền thống Việt | 148 + 4 khoá / 8 bài | — |
| B10 | `pajahati` bỏ "trừ diệt", dùng **"từ bỏ"/"đoạn trừ"**; `paṭinissagga` "xả bỏ" | Nhất quán | 121 + 8 khoá | Áp toàn kho thì bất định; hội đồng chỉ áp ở các bài đã quét |
| B11 | `muta` = **"cảm nhận"** | PED/DPD "sensed" | 57 khoá / 9 bài | — |
| B12 | `vata/sīlabbata`: bỏ "khổ hạnh" (trùng `tapa`), dùng **"cấm hạnh"/"giới cấm"** | Tránh trùng thuật ngữ | ≈128 khoá / 15 bài | — |
| B13 | `kappa` (mnd/cnd) = **"vọng tưởng"**, bỏ "tạo tác" (trùng `saṅkhāra`) | Từ còn trống | ≈83 + 4 khoá / 12 bài | "hư cấu" là phương án bất định |
| B14 | `purakkhata` "đề cao"; `patilīna` "thu mình" | — | 2 + 7 khoá | — |
| B15 | `nekkhamma` (ba-la-mật) = **"xuất ly"**; hành động rời nhà giữ "xuất gia"; thêm glossary | 104 khoá ở bốn bộ Nikāya và Indacanda | 9 khoá / 7 bài | — |
| B16 | `nissaraṇa` = "thoát ly" **chỉ ở 19 bài có va chạm với `nekkhamma`** (như iti72:2.3); không đổi hàng loạt 217 khoá | Mahākassapa: chưa có lỗi nghĩa, truyền thống dùng cả "xuất ly" | ≈19 bài | Hội đồng không thống nhất; xem ghi chú dưới |
| B17 | `kira` ở bv: **"thì ra"** (người nghe lời thọ ký trực tiếp, PED p.215); tha-ap1/2 giữ "nghe nói"; sửa "Nếu của bậc Lãnh Đạo" ở bv2, bv4 | — | 4 + 4 khoá | — |
| B18 | `kenīdha … vikappayeyya` = **"lấy gì ở đời này mà phán đoán được vị ấy?"**; `timi` chuỗi cá = "cá nuốt cá nuốt cá khổng lồ" cho 5 khoá, an8.19/an8.20 giữ phiên âm thêm chú thích | Lời giải Niddesa `kena` = "bằng cái gì"; khớp ud5.5 | 8 + 5 khoá | — |
| B19 | `santo/santi` = "an tịnh", `upasanto/upasanti` = "yên lặng" | Hiện 12 khoá dịch ngược | ≈19 khoá / 10 bài | — |
| B20 | Apadāna: `cetanāpaṇidhīhi` = **"nhờ những ước nguyện của tâm"**; `brahmabandhu` = **"người dòng Bà-la-môn"** (danh hiệu Phật); `sampatti` = "sự thịnh vượng"; `kappa` đứng riêng = "kiếp" (chỉ `mahākappa` mới "đại kiếp", 12 khoá sót) | DPD "mental aspiration"; PED | 81 + 22 + 14 + 12 khoá | — |
| B21 | Jātaka: `sattusambādha` = **"sự bức bách của kẻ thù"** (ja342, ja383, ja419, ja448); `kuruṅga` = "linh dương"; `asadisa` = "Vô Song"; `ekasataṁ` = 101 cho bộ "các vua chư hầu", 100 nơi khác; `disampati` = "chúa tể các phương"; `raṭṭhavaḍḍhana` = "bậc làm hưng thịnh xứ sở"; `khuddakappāni` = "những trái ngọt như mật"; `suciṁ maṁsūpasecanaṁ` = "được rưới nước canh thịt tinh khiết"; `khattavijjā` = "thuật trị quốc"; `koñca` = "sếu"; `satarājikā` = "bát … nặng trăm" (khá chắc là bát) | PED/DPD | theo hồ sơ R8 | ekasataṁ bất định thật (Sujato cp32 chọn 100) |
| B22 | `bhaddante`: theo quan hệ người nói–người nghe: nói với bậc trên/ngang hàng = "thưa ngài/ông/bà"; bậc trên nói với bậc dưới = "chúc … an lành" | Khớp Sujato sn10.5 | ≈3–5 khoá | Bất định từng chỗ |
| B23 | Chỗ bất định từng khoá của R8: `ja513:17.1` giữ "vua Daṇḍakī" (sửa chính tả, ghi biến thể PTS); `ja543:6.3` mang `āraho` của 6.2; `ja476:2.4` hỏi "Liệu thấy ta, ngươi có vui lòng chăng?"; `ja479:2.2` "vua Kāliṅga, người thuộc dòng dõi sa-môn"; `ja497:9.3` giữ "nuốt lửa" + chú thích PED; `ja228:2.4` "kẻ đã sa khỏi pháp trắng thì chữa trị làm sao?"; `ja158` giữ tên riêng "Soṇa"; `ja539` "hỡi Migājina" | Theo khuyến nghị R8 | ≈12 khoá | Nhiều chỗ "bất định thật": chỉ đổi khi hồ sơ nói "khá chắc" |

## C. Hình thức và xưng hô

| Mã | Chốt | Phạm vi |
| --- | --- | --- |
| C1 | **Tiêu đề Jātaka giữ "Kinh X"** (đa số 483/547, tối thiểu đổi); chuẩn hóa 63 tiêu đề lệch ("Kinh Xjātaka" 30, "Chuyện Tiền Thân X" 33) về "Kinh X", bỏ đuôi "jātaka"; quy tắc tên: danh từ chung dịch, tên riêng phiên âm, cùng tên Pāli cùng tên Việt | ≈63 bài + 20 nhóm tên |
| C2 | Dòng kết bài **"…, thứ N."** có dấu phẩy (318 so với 229 khoá); kết phẩm theo cùng mẫu | 229 + 23 khoá |
| C3 | Tên nipāta Jātaka: **"Nhóm N Kệ"**; bỏ chữ "Kinh" là lỗi rõ | ≈546 khoá `:0.2` + 25 khoá kết |
| C4 | Xưng hô trong lời thoại Jātaka: mỗi lời thoại **một cặp** (dưới→trên "tôi – ngài/đại vương"; trên→dưới "ta – ngươi/khanh"; ngang hàng "tôi"; vua→hoàng hậu "ta – nàng"; bỏ "trẫm"). Chỉ thi hành cho lời thoại ngắn (≤ 6 khoá, ≈64 lời thoại); lời thoại dài nhiều người nói để lại cho lượt sau; "thiếp" và `samma` chưa chốt | ≈64 lời thoại |
| C5 | Apadāna: tiêu đề **"Ký Sự Về Trưởng Lão (Ni) X"** (Indacanda và 460/603 tiêu đề đã dùng), thay "Bài Kệ Tuyên Ngôn" (140) và "Kinh Kệ" (3); giữ số thứ tự | ≈303 khoá + 143 meta |
| C6 | Xưng hô tha-ap/thi-ap thi hành đúng §9: người **kể** tiền kiếp = "tôi" (2.680 khoá ở 311 bài đang là "ta"); kệ có hô ngữ gọi Phật = "con"; Đức Phật tự xưng "Ta" (kể cả thọ ký); lời trích `‘…’` giữ cách xưng người được trích. Ranh giới "tôi"/"con" ở thi-ap xét từng bài | ≈2.770 khoá / 320 bài |

## D. Chính sách về Pāli ghim hỏng (R9)

- VRI/CST4 không gỡ được gì, vì Pāli ghim chép từ CST.
- BJT gỡ được một phần, nhưng dùng dị bản để dịch thay chữ ghim là **đổi chính sách** (AGENTS.md: Pāli ghim là authority). **Hội đồng không đổi chính sách.** Không ghim thêm tầng BJT, không sync lớp `variant/` vào store.
- Tám bài Peṭakopadesa (`pe1`–`pe6`, `pe8`, `pe9`) **giữ draft**; `tha-ap3`, `tha-ap114`, `tha-ap345`, `tha-ap548` giữ draft. Việc gỡ chỉ bằng BJT là quyết định chính sách dành cho người biên tập.
- Ngoại lệ không cần đổi chính sách: A14, A15 (chú giải và từ điển là bằng chứng nghĩa theo §3.2).

## E. Ghi chú bất đồng

- **B16 (`nissaraṇa`)**: Sāriputta nghiêng "thoát ly" cho cả họ; Ānanda nêu truyền thống dùng "xuất ly" cho `nissaraṇa` ở nhiều bài; Mahākassapa phản đối đổi 217 khoá khi chưa có lỗi nghĩa. Chốt thận trọng: chỉ sửa ở chỗ va chạm với `nekkhamma`.
- **C1 (tiêu đề Jātaka)**: R5 khuyến nghị "Chuyện Tiền Thân X" (≈1.542 chỗ) vì `jātaka` không phải `sutta`; hội đồng chọn giữ "Kinh X" vì đổi 514 bài chỉ vì quy ước, không do lỗi nghĩa. Người biên tập có thể đảo.
- **B5 (`hāra`)** và **B2 (`sayambhū`)**: khá chắc nhưng không phải lỗi nghĩa; người biên tập có thể chuyển sang phương án dự phòng.
- **ps2.9:21.14**: Pāli ghim thiếu `na`; bản Việt giữ "không" theo câu song song (ps1.1:464.6). Thêm chú thích, không coi là blocker.

## F. Thi hành

Các quyết định A, B, C được thi hành theo **bộ sưu tập** (mỗi agent giữ trọn một nhóm tệp để không đụng nhau). Sau đó chấm lại từng bài đã đổi bằng `quality --record/--apply` (điểm giữ nguyên, riêng lỗi rõ được +0,1 tối đa ở `semantic_fidelity` hoặc `grammar_logic` khi có chứng cứ), rồi `quality:waive`. Glossary cập nhật sau cùng. Số liệu và bài còn lệch sau thi hành được ghi vào `docs/review-2026-10-15-findings.md`.
