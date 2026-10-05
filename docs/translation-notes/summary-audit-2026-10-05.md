# Worklog audit "Tóm tắt & diễn giải" — 186 bài Trung Bộ + Trường Bộ

- **Ngày:** 2026-10-05
- **Phạm vi:** toàn bộ 186 tóm tắt (mn1–mn152, dn1–dn34) đã được đối chiếu độc lập với văn bản nguồn đã pin (`tmp/summary-src/<coll>/<uid>.txt`, sinh từ `content/translation/vi/project/`), nghi vấn phân xử thêm bằng Pāli root + English Sujato đã pin (`.cache/upstream/suttacentral/`).
- **Phương pháp:** 15 lượt agent audit đối kháng (mỗi lượt 12–15 bài, đọc toàn văn nguồn + tóm tắt, chỉ báo lỗi kèm bằng chứng trích dẫn) + audit trực tiếp cho mn37–mn48. Tiêu chí: (a) không bịa nội dung / không gán cho kinh điều kinh không nói; (b) đúng số lượng, người nói, chiều phủ định, điều kiện; (c) đủ các cột mốc chính (bỏ chi tiết nhỏ chấp nhận được); (d) thuật ngữ theo đúng bản dịch của chính bài đó; (e) văn phong theo `skill/translation.md` §9.
- **Kết quả:** 171 bài OK; 15 bài đã sửa (bảng dưới); 4 lỗi ở lớp bản dịch canonical phát hiện tình cờ trong audit đều đã vá kèm `notes:` hậu xuất bản trong meta tương ứng.
- **Merge:** PR #269 (fix nội dung), PR này (worklog). Kiểm chứng máy: `tests/unit/summary.test.ts` 186/186 pass; `npm run validate` pass; CI main xanh.

## Bảng verdict từng bài

| uid | Verdict | Ghi chú |
| --- | --- | --- |
| mn1 | OK | — |
| mn2 | OK | — |
| mn3 | OK | — |
| mn4 | OK | — |
| mn5 | OK | — |
| mn6 | OK | — |
| mn7 | OK | — |
| mn8 | OK | — |
| mn9 | OK | — |
| mn10 | OK | — |
| mn11 | ĐÃ SỬA | Sửa: bỏ khái quát hóa sai mẫu hỏi–đáp — nguồn có cặp ngược mẫu (mục tiêu dành cho người vô minh). |
| mn12 | OK | — |
| mn13 | OK | — |
| mn14 | OK | — |
| mn15 | OK | — |
| mn16 | OK | — |
| mn17 | OK | — |
| mn18 | OK | — |
| mn19 | OK | — |
| mn20 | OK | — |
| mn21 | OK | — |
| mn22 | OK | — |
| mn23 | OK | — |
| mn24 | OK | — |
| mn25 | OK | — |
| mn26 | OK | — |
| mn27 | ĐÃ SỬA | Sửa: "xuống khỏi xe" (Pāli orohitvā), không phải kính lễ trên xe. |
| mn28 | OK | — |
| mn29 | OK | — |
| mn30 | OK | — |
| mn31 | OK | — |
| mn32 | OK | — |
| mn33 | OK | — |
| mn34 | OK | — |
| mn35 | OK | — |
| mn36 | OK | — |
| mn37 | OK | — |
| mn38 | OK | — |
| mn39 | OK | — |
| mn40 | OK | — |
| mn41 | OK | — |
| mn42 | OK | — |
| mn43 | OK | — |
| mn44 | OK | — |
| mn45 | OK | — |
| mn46 | OK | — |
| mn47 | OK | — |
| mn48 | OK | — |
| mn49 | OK | — |
| mn50 | OK | — |
| mn51 | OK | — |
| mn52 | OK | — |
| mn53 | OK | — |
| mn54 | OK | — |
| mn55 | OK | — |
| mn56 | OK | — |
| mn57 | ĐÃ SỬA | Sửa: chặn hai lần, lần hỏi thứ ba mới trả lời (không phải "ba lần chặn"). |
| mn58 | OK | — |
| mn59 | OK | — |
| mn60 | OK | — |
| mn61 | OK | — |
| mn62 | ĐÃ SỬA | Sửa: "năm giới" (địa, thủy, hỏa, phong, hư không) — không phải sáu. |
| mn63 | OK | — |
| mn64 | OK | — |
| mn65 | OK | — |
| mn66 | OK | — |
| mn67 | OK | — |
| mn68 | OK | — |
| mn69 | OK | — |
| mn70 | OK | — |
| mn71 | OK | — |
| mn72 | OK | — |
| mn73 | OK | — |
| mn74 | ĐÃ SỬA | Sửa: bỏ câu gán công thức "hai quả" mà kinh không nói; thay bằng hai thành tựu có thật (Sāriputta giải thoát lậu hoặc, Dīghanakha sinh mắt Pháp). |
| mn75 | OK | — |
| mn76 | OK | — |
| mn77 | OK | — |
| mn78 | OK | — |
| mn79 | OK | — |
| mn80 | OK | — |
| mn81 | OK | — |
| mn82 | OK | — |
| mn83 | OK | — |
| mn84 | OK | — |
| mn85 | OK | — |
| mn86 | OK | — |
| mn87 | OK — tóm tắt đạt; kèm fix canonical | Lớp bản dịch: segment 15-21.2 "cha"→"mẹ" (Pāli mātā; khớp câu "Ai thấy mẹ tôi không?"). Notes hậu xuất bản trong meta. |
| mn88 | OK | — |
| mn89 | OK | — |
| mn90 | OK | — |
| mn91 | OK | — |
| mn92 | OK | — |
| mn93 | OK | — |
| mn94 | OK | — |
| mn95 | OK | — |
| mn96 | ĐÃ SỬA | Sửa: đếm đẳng cấp phục vụ kể cả chính đẳng cấp, bỏ chữ "dưới" gây đếm nhầm. |
| mn97 | OK | — |
| mn98 | OK | — |
| mn99 | OK | — |
| mn100 | OK | — |
| mn101 | OK | — |
| mn102 | OK | — |
| mn103 | OK | — |
| mn104 | OK | — |
| mn105 | OK | — |
| mn106 | OK | — |
| mn107 | OK | — |
| mn108 | ĐÃ SỬA | Sửa: đối thoại tại công trường Gopaka Moggallāna; nhãn thiền theo đúng lời Ānanda "không được tán thán". |
| mn109 | OK | — |
| mn110 | OK | — |
| mn111 | OK | — |
| mn112 | OK | — |
| mn113 | ĐÃ SỬA | Sửa tóm tắt: đồng bộ thuật ngữ atammayatā — "tính không bị nó tác thành". |
| mn114 | OK | — |
| mn115 | OK | — |
| mn116 | OK | — |
| mn117 | OK | — |
| mn118 | OK | — |
| mn119 | ĐÃ SỬA | Sửa: "mười tám cách" tu tập niệm thân (không phải mười bốn); tag metadata sửa theo. |
| mn120 | OK | — |
| mn121 | OK | — |
| mn122 | OK | — |
| mn123 | OK | — |
| mn124 | OK | — |
| mn125 | OK | — |
| mn126 | ĐÃ SỬA | Sửa: gỡ Hán tự lọt vào văn Việt. |
| mn127 | OK | — |
| mn128 | ĐÃ SỬA | Sửa: định ba phương thức liệt kê đủ 3, bốn định còn lại tách riêng. |
| mn129 | OK | — |
| mn130 | OK | — |
| mn131 | OK | — |
| mn132 | OK | — |
| mn133 | OK | — |
| mn134 | OK | — |
| mn135 | OK | — |
| mn136 | OK | — |
| mn137 | OK | — |
| mn138 | OK | — |
| mn139 | OK | — |
| mn140 | OK | — |
| mn141 | OK | — |
| mn142 | OK | — |
| mn143 | OK | — |
| mn144 | OK | — |
| mn145 | OK | — |
| mn146 | OK — tóm tắt đạt; kèm fix canonical | Lớp bản dịch: đáp án 19-20.17/.19 trượt một bậc → Vô thường/Khổ; khôi phục "không?" ở 19-20.21. Notes trong meta. |
| mn147 | OK | — |
| mn148 | ĐÃ SỬA | Sửa: bỏ nhãn chủ thể "chưa/đã được giáo huấn" — nguồn dùng chủ thể điều kiện. |
| mn149 | OK | — |
| mn150 | OK | — |
| mn151 | OK | — |
| mn152 | OK — tóm tắt đạt; kèm fix canonical | Lớp bản dịch: hợp nhất tên Pārāsiviya (2.1/2.2) theo Pāli đã pin.  |
| dn1 | OK | — |
| dn2 | OK | — |
| dn3 | OK | — |
| dn4 | OK | — |
| dn5 | OK | — |
| dn6 | OK | — |
| dn7 | OK | — |
| dn8 | OK | — |
| dn9 | OK | — |
| dn10 | OK | — |
| dn11 | OK | — |
| dn12 | OK | — |
| dn13 | OK | — |
| dn14 | OK | — |
| dn15 | ĐÃ SỬA | Sửa: "mỗi mắt xích bị phủ định" (tránh hiểu nhầm "con mắt"). |
| dn16 | ĐÃ SỬA | Sửa: "sáu pháp không suy thoái" theo đúng thuật ngữ của bản dịch. |
| dn17 | OK | — |
| dn18 | OK | — |
| dn19 | OK | — |
| dn20 | OK | — |
| dn21 | OK | — |
| dn22 | OK | — |
| dn23 | OK | — |
| dn24 | OK | — |
| dn25 | OK | — |
| dn26 | OK | — |
| dn27 | OK | — |
| dn28 | OK | — |
| dn29 | OK | — |
| dn30 | OK | — |
| dn31 | OK | — |
| dn32 | OK | — |
| dn33 | ĐÃ SỬA | Sửa: nhóm chín đủ 6 mục (bỏ chữ "chỉ" loại trừ); nhóm mười "nêu" thay "kết bằng". |
| dn34 | OK | — |

## Các lỗi lớp bản dịch canonical đã vá trong đợt audit

| Bài | Lỗi | Bằng chứng Pāli đã pin |
| --- | --- | --- |
| mn87:15-21.2 | "cha" → "mẹ" | `mātā kālamakāsi`; khớp câu hỏi `api me mātaraṁ` ("Ai thấy mẹ tôi không?") |
| mn113 (12 segment) | bỏ phủ định thứ hai: "…các pháp tham **không** đoạn tận" → "…được đoạn tận" | `na kho [X]-ena lobhadhammā vā parikkhayaṁ gacchanti` — phủ định nắm cụm nhân cách, động từ khẳng định; khớp Sujato |
| mn113 (12 segment) | `atammayatā` "pháp vô tham ái" → "tính không bị nó tác thành" | a + taṁ + mayatā; Sujato "not being determined by"; khớp câu 21.8/28.8 "Với cái nào họ quán niệm, thì với cái ấy trở thành khác đi" |
| mn146:19-20.17/.19 | đáp án trượt một bậc: "Khổ"/"Không phải vậy" → "Vô thường"/"Khổ" | dải song song lần dạy đầu 7.18–7.24 trả đúng; Pāli `Aniccā`/`Dukkhaṁ` |
| mn152:2.1/2.2 | "Pārāsariya" → "Pārāsiviya" | Pāli pin `pārāsiviyo` đồng nhất, 9 khoá khác trong cùng file đã đúng |

## Rà soát lần 2 (2026-10-05) — trọng tâm dễ hiểu + đủ ý
- **Phạm vi:** lại toàn bộ 186 tóm tắt, đọc từ `origin/main` (không dùng working tree đang lệch); 13 lượt agent + xác minh từng flag trên main trước khi áp.
- **Kết quả:** 177 bài ĐẠT không chỉnh; 9 bài chỉnh (bảng dưới); các fix lần 1 được kiểm lại — mn62/mn74/dn33/mn148/mn119/mn126/mn96(đếm)/mn108/mn15/dn15/dn16 đạt; riêng mn113 phát hiện summary bị merge ghi đè mất đồng bộ atammayatā → dựng lại.
- **Canonical:** mn87/mn113/mn146/mn152 xác nhận còn nguyên trên main sau các đợt merge song song.

### Bảng verdict lần 2

| uid | Verdict | Ghi chú |
| --- | --- | --- |
| mn1 | ĐẠT | — |
| mn2 | ĐẠT | — |
| mn3 | ĐẠT | — |
| mn4 | ĐẠT | — |
| mn5 | ĐẠT | — |
| mn6 | ĐẠT | — |
| mn7 | ĐẠT | — |
| mn8 | ĐẠT | — |
| mn9 | ĐẠT | — |
| mn10 | ĐẠT | — |
| mn11 | ĐẠT | — |
| mn12 | ĐẠT | — |
| mn13 | ĐẠT | — |
| mn14 | ĐẠT | — |
| mn15 | ĐẠT | — |
| mn16 | ĐẠT | — |
| mn17 | ĐẠT | — |
| mn18 | ĐẠT | — |
| mn19 | ĐẠT | — |
| mn20 | ĐẠT | — |
| mn21 | ĐÃ CHỈNH | "các tỳ-kheo tố cáo" → "một vị tỳ-kheo tố cáo" (nguồn: một vị trình báo). |
| mn22 | ĐÃ CHỈNH | Bổ "và lòng thương kính" vào điều kiện hướng đến cõi lành (nguồn 47.2). |
| mn23 | ĐẠT | — |
| mn24 | ĐÃ CHỈNH | Bỏ so sánh "nhất" mà nguồn không có (nguồn hỏi "vị tỳ-kheo nào được tán thán như sau"). |
| mn25 | ĐẠT | — |
| mn26 | ĐẠT | — |
| mn27 | ĐẠT | — |
| mn28 | ĐẠT | — |
| mn29 | ĐẠT | — |
| mn30 | ĐẠT | — |
| mn31 | ĐẠT | — |
| mn32 | ĐẠT | — |
| mn33 | ĐẠT | — |
| mn34 | ĐẠT | — |
| mn35 | ĐẠT | — |
| mn36 | ĐẠT | — |
| mn37 | ĐẠT | — |
| mn38 | ĐẠT | — |
| mn39 | ĐẠT | — |
| mn40 | ĐẠT | — |
| mn41 | ĐẠT | — |
| mn42 | ĐẠT | — |
| mn43 | ĐẠT | — |
| mn44 | ĐẠT | — |
| mn45 | ĐẠT | — |
| mn46 | ĐẠT | — |
| mn47 | ĐẠT | — |
| mn48 | ĐẠT | — |
| mn49 | ĐẠT | — |
| mn50 | ĐẠT | — |
| mn51 | ĐẠT | — |
| mn52 | ĐẠT | — |
| mn53 | ĐẠT | — |
| mn54 | ĐẠT | — |
| mn55 | ĐẠT | — |
| mn56 | ĐẠT | — |
| mn57 | ĐÃ CHỈNH | Sửa tên riêng: Puṇṭa → Puṇṭa-Puṇṇa (5 chỗ, nguồn ghi Puṇṭa 0 lần). |
| mn58 | ĐẠT | — |
| mn59 | ĐẠT | — |
| mn60 | ĐẠT | — |
| mn61 | ĐẠT | — |
| mn62 | ĐẠT | — |
| mn63 | ĐẠT | — |
| mn64 | ĐẠT | — |
| mn65 | ĐẠT | — |
| mn66 | ĐẠT | — |
| mn67 | ĐẠT | — |
| mn68 | ĐẠT | — |
| mn69 | ĐẠT | — |
| mn70 | ĐẠT | — |
| mn71 | ĐẠT | — |
| mn72 | ĐẠT | — |
| mn73 | ĐÃ CHỈNH | Bổ "tà hạnh trong dục" cho đủ mười pháp bất thiện (trước đó liệt kê 9/10). |
| mn74 | ĐẠT | — |
| mn75 | ĐẠT | — |
| mn76 | ĐÃ CHỈNH | Tách "bốn đường tu không đáng tin cậy" đủ bốn mục — bản cũ gộp đường truyền khẩu + đường suy luận thành một (hai vị thầy, hai căn cứ riêng trong nguồn). |
| mn77 | ĐẠT | — |
| mn78 | ĐẠT | — |
| mn79 | ĐẠT | — |
| mn80 | ĐẠT | — |
| mn81 | ĐẠT | — |
| mn82 | ĐẠT | — |
| mn83 | ĐẠT | — |
| mn84 | ĐẠT | — |
| mn85 | ĐẠT | — |
| mn86 | ĐẠT | — |
| mn87 | ĐẠT | — |
| mn88 | ĐẠT | — |
| mn89 | ĐẠT | — |
| mn90 | ĐẠT | — |
| mn91 | ĐẠT | — |
| mn92 | ĐẠT | — |
| mn93 | ĐẠT | — |
| mn94 | ĐẠT | — |
| mn95 | ĐẠT | — |
| mn96 | ĐÃ CHỈNH | Câu tu từ "Ai khác có thể phục vụ Thủ-đà?" viết xuôi thành "vì ai khác có thể phục vụ" — đảo nghĩa; sửa "chẳng ai khác" + đồng bộ chú đẳng cấp cho vế Bà-la-môn. |
| mn97 | ĐẠT | — |
| mn98 | ĐẠT | — |
| mn99 | ĐẠT | — |
| mn100 | ĐẠT | — |
| mn101 | ĐẠT | — |
| mn102 | ĐẠT | — |
| mn103 | ĐẠT | — |
| mn104 | ĐẠT | — |
| mn105 | ĐẠT | — |
| mn106 | ĐẠT | — |
| mn107 | ĐẠT | — |
| mn108 | ĐẠT | — |
| mn109 | ĐẠT | — |
| mn110 | ĐẠT | — |
| mn111 | ĐẠT | — |
| mn112 | ĐẠT | — |
| mn113 | ĐÃ CHỈNH | Gắn lại lần 2: summary trên main mất đồng bộ atammayatā do merge ghi đè — 3 chỗ "vô tham ái" → "tính không bị nó tác thành" (canonical đã sửa đúng từ PR #269). |
| mn114 | ĐẠT | — |
| mn115 | ĐẠT | — |
| mn116 | ĐẠT | — |
| mn117 | ĐẠT | — |
| mn118 | ĐẠT | — |
| mn119 | ĐẠT | — |
| mn120 | ĐẠT | — |
| mn121 | ĐẠT | — |
| mn122 | ĐẠT | — |
| mn123 | ĐẠT | — |
| mn124 | ĐẠT | — |
| mn125 | ĐẠT | — |
| mn126 | ĐẠT | — |
| mn127 | ĐẠT | — |
| mn128 | ĐẠT | — |
| mn129 | ĐẠT | — |
| mn130 | ĐẠT | — |
| mn131 | ĐẠT | — |
| mn132 | ĐẠT | — |
| mn133 | ĐẠT | — |
| mn134 | ĐẠT | — |
| mn135 | ĐẠT | — |
| mn136 | ĐẠT | — |
| mn137 | ĐẠT | — |
| mn138 | ĐẠT | — |
| mn139 | ĐẠT | — |
| mn140 | ĐẠT | — |
| mn141 | ĐẠT | — |
| mn142 | ĐẠT | — |
| mn143 | ĐẠT | — |
| mn144 | ĐẠT | — |
| mn145 | ĐẠT | — |
| mn146 | ĐẠT | — |
| mn147 | ĐẠT | — |
| mn148 | ĐẠT | — |
| mn149 | ĐẠT | — |
| mn150 | ĐẠT | — |
| mn151 | ĐẠT | — |
| mn152 | ĐẠT | — |
| dn1 | ĐẠT | — |
| dn2 | ĐẠT | — |
| dn3 | ĐẠT | — |
| dn4 | ĐẠT | — |
| dn5 | ĐẠT | — |
| dn6 | ĐẠT | — |
| dn7 | ĐẠT | — |
| dn8 | ĐẠT | — |
| dn9 | ĐẠT | — |
| dn10 | ĐẠT | — |
| dn11 | ĐẠT | — |
| dn12 | ĐẠT | — |
| dn13 | ĐẠT | — |
| dn14 | ĐẠT | — |
| dn15 | ĐẠT | — |
| dn16 | ĐẠT | — |
| dn17 | ĐẠT | — |
| dn18 | ĐẠT | — |
| dn19 | ĐÃ CHỈNH | Bổ đủ 8 lời tán thán (thiếu lời 5: dùng thực phẩm không kiêu mạn; lời 6: ưa độc cư nhưng không xua đuổi đệ tử). |
| dn20 | ĐẠT | — |
| dn21 | ĐẠT | — |
| dn22 | ĐẠT | — |
| dn23 | ĐẠT | — |
| dn24 | ĐẠT | — |
| dn25 | ĐẠT | — |
| dn26 | ĐẠT | — |
| dn27 | ĐẠT | — |
| dn28 | ĐẠT | — |
| dn29 | ĐẠT | — |
| dn30 | ĐẠT | — |
| dn31 | ĐẠT | — |
| dn32 | ĐẠT | — |
| dn33 | ĐẠT | — |
| dn34 | ĐẠT | — |
