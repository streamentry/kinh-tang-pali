# English reference layer — audit 2026-09-27

## Câu hỏi

Có đủ bản dịch tiếng Anh SuttaCentral cho mọi Pāli trong dự án không? Cảm giác là đang thiếu rất nhiều.

## Trạng thái trước khi sửa

`scripts/sync-source.ts` chỉ fetch `root/pli/ms` — **không có code nào tải tầng English**. Tầng English là yêu cầu bắt buộc của `skill/translation.md` §2 và tiêu chí 6 trong `AGENTS.md`, nhưng không có đường dẫn nào trong repo tải hay kiểm tra nó.

| | trước |
| --- | --- |
| text có bản dịch Việt trong dự án | 1589 |
| file English tồn tại **đúng đường dẫn** | **7** (`dn14, dn16, dn23, dn24, dn30, dn33, dn34`) |
| tỉ lệ phủ | 0,4% |

Ngoài ra có khoảng 600 file English nằm sai chỗ, không script nào đọc tới:

- `.cache/.../ref/*.json` — file Sujato nằm phẳng ngay dưới `ref/`
- `.cache/.../ref/en/*.json` — thiếu tầng `sutta/an/an3` v.v.
- `.cache/.../ref/en.apfs-orphan/` — 150 file trong thư mục quarantine APFS (xem `docs/apfs-orphan-incident-2026-09-27.md`)

Lưu ý: upstream không có thư mục `ref/` cho English. `reference/` trong bilara-data chỉ chứa `lzh`, `pli`, `pra`, `san`. Thư mục English là `translation/en/<dịch giả>/`. Các file trên là tàn dư của một lần tải thủ công bị đặt sai đường dẫn, không phải layout upstream.

## Kết quả audit

Đường dẫn English suy ra được từ đường dẫn Pāli root bằng phép biến đổi thuần, vì bilara-data đặt tên file theo cùng UID cho mọi edition:

```text
root/pli/ms/<suttaPath>_root-pli-ms.json
  → translation/en/sujato/<suttaPath>_translation-en-sujato.json
```

Áp dụng cho toàn bộ catalog: **3422/3422 text có file English ở upstream** tại commit `11c9d708978cde8ba61096d8a75f7ddfb846f639`.

Sau khi sync (3049 file, 9,7 MB):

| scope | text | Pāli segment | English segment | lệch |
| --- | --- | --- | --- | --- |
| có bản dịch Việt | 1589 | 82 995 | 82 995 | 0 |
| toàn catalog | 3422 | 121 634 | 121 634 | 1 (defect upstream) |

## Trạng thái sau khi sửa

- `source/suttacentral.lock.json` khai báo `referenceEditions` với `authority: false`.
- `sync-source.ts` tải **mọi** tầng đã pin, có retry, concurrency giới hạn, và báo cáo theo từng tầng; thiếu file là lỗi (exit 1), không phải cảnh báo im lặng.
- `scripts/audit-reference.ts` kiểm tra ở **mức segment**: file thiếu, segment Pāli thiếu trong English, segment English thừa, tỉ lệ segment rỗng, và coverage trên Pāli có nội dung.
- `scripts/show-reference.ts` in Pāli / English / Việt cạnh nhau theo segment ID, kèm coverage và chỗ lủng củng lớn nhất.
- `validate.ts` chặn `review`/`published` khi thiếu tầng English, và khi coverage dưới ngưỡng mà chưa có record.
- `src/lib/canon/reference.ts` định nghĩa coverage + ngưỡng; `content/meta/reference-gaps.yaml` là record 141 gap.
- `tests/unit/reference-source.test.ts` khoá bất biến đường dẫn trên toàn bộ 3422 text, và khoá cả hai chiều của record gap.

## Phát hiện phụ: segment có mặt nhưng rỗng

13,5% segment English (16 363 / 121 634) có key đúng nhưng value là `""`. Không phải file thiếu:

- Sujato để trống **blockquote** và đoạn lược `…pe…`, nối câu qua chỗ trống;
- 9 290 rơi vào Pāli ngắn kiểu `Paṭhamaṁ.`, `Rūpādivaggo paṭhamo.`;
- 6 442 rơi vào Pāli từ 40 ký tự trở lên, và đây mới là chỗ cần Pāli tự đứng vững;
- 656 còn lại là đoạn lược.

Nhóm 6 442 không đồng nhất, và điểm này cần nói rõ:

**Phân bố segment (merge)** — Sujato gộp nhiều segment Pāli thành một câu English, nên segment sau rỗng nhưng **ý vẫn còn**, chỉ nằm ở key khác. `an2.3:1.3+1.4+1.5` → một câu English duy nhất ("by way of body, speech, and mind"), nên `1.4`/`1.5` rỗng.

**Chưa được dịch** — không có English nào ở bất kỳ đâu trong edition đã pin. `an4.46` mất 15/18 segment có nội dung, gồm **toàn bộ phần Đức Phật đáp**, kể cả câu `Gamanena na pattabbo, lokassanto kudācanaṁ` (`an4.46:4.1`–`6.4`). Chỉ phần dẫn dắt `1.1`–`1.3` được dịch.

Ý nghĩa: chỗ này **không được** coi là Sujato đã đồng ý cách dịch. Tỉ lệ được audit in ra để người dịch biết trước.

## Phát hiện phụ: coverage phải đo trên Pāli có nội dung

Tỉ lệ 12,0% ở trên **không dùng làm ngưỡng**, vì nó tính cả những dấu `Paṭhamaṁ.` mà Sujato bỏ trống một cách hợp lệ. `an1.1` có 12 segment, một nửa rỗng ở English, nhưng cả 4 segment có nội dung đều có chữ → 100% coverage.

Đo trên **Pāli ≥ 40 ký tự** mới ra bức tranh dùng để quyết định:

| coverage | số bài | |
| --- | --- | --- |
| ≥ 99% | 1070 | ổn |
| 80–99% | 216 | ổn |
| 50–80% | 121 | mất tham khảo |
| 1–50% | 17 | mất tham khảo nặng |
| 0% | 3 | không có English nào |

Tổng Pāli/English char ratio toàn scope là 0,915 — không mất hàng loạt, nhưng con số đó bị 1.070 bài sạch chi phối và che khuất 141 bài kia.

## Vì sao không tải thêm được

Tại commit `11c9d708978c` (4.168 file sutta), Sujato là edition Anh duy nhất phủ cả 5 Nikāya Pāli. Phần còn lại:

| dịch giả | file sutta | phạm vi |
| --- | --- | --- |
| soma | 73 | `kn/thig` |
| kelly | 100 | `kn/mil` |
| patton | 75 | `ma/*` (Māgama Trung Hoa) |
| suddhaso | 30 | `kn/dhp` + `snp1.1/2` + `mn2`/`mn20` |
| anandajoti | 22 | `pdhp` |
| kovilo | 2 | `an4.1`, `pv1` |
| brahmali | 0 | chỉ Abhidhamma |

Nên `mn42` (15%), `an4.46` (17%), `mn15`, `an5.72`, `mn132` **không** có bản Anh thay thế nào trên SuttaCentral. Tải thêm không sửa được.

Ngoại lệ có thể bổ sung: `suddhaso` phủ **toàn bộ** Dhammapada (26 file) nên đóng được 3 bài `dhp` mất 100%, và `soma` phủ thig. Phần này chưa làm — người dùng chọn phương án ghi nhận + chặn trước.

## Cách xử lý 141 bài dưới ngưỡng

`content/meta/reference-gaps.yaml` là **record, không phải repair**. Nó phân biệt *"đã biết và đã chấp nhận"* với *"chưa ai nhìm"*:

- `review`/`published` + dưới 80% + không có record → **lỗi chặn** (đã kiểm chứng: bỏ record `dn10` → validate fail với `77% of 222 substantive Pāli segment(s)`);
- có record → cảnh báo vẫn in ra;
- `draft` → cảnh báo.

Sinh bằng `npm run reference:gaps`, kiểm tra cũ bằng `npm run reference:gaps:check`. Test khoá **cả hai chiều**: không được có bài dưới ngưỡng mà thiếu record, và không được có record cho bài đã lên ngưỡng.

## Phát hiện phụ: `sn12.93-213`

File upstream `sn12.93-213_*` gắn 40 segment bằng các UID sub-range lồng nhau (`sn12.93-103`, `sn12.104-114`, … `sn12.203-213`), không segment nào mang prefix `sn12.93-213:`. Vì vậy loader không lấy được segment nào ở **cả hai** tầng.

- Bài này **không có** project data, nên không chặn bản dịch nào.
- Không đoán mapping. Audit báo cáo rõ là defect upstream, test khoá lại danh sách để nếu upstream sửa thì phải cập nhật có chủ ý.

## Sửa kèm theo: `segmentPrefixesForUid`

Regex cũ `^([a-z]+)(\d+)-(\d+)$` không khớp UID có dấu chấm, nên 16 text dạng `sn12.83-92` lấy được **0 segment** ở cả hai tầng. Đã đổi để nhận cả base có dấu chấm và trả về **cả** prefix literal lẫn các prefix mở rộng, vì bilara-data dùng hai quy ước:

- merged bundle (`an5.308-1152`): segment mang chính UID gộp;
- bookmark bundle (`sn12.83-92`, `dhp1-20`): một file, mỗi bài mang prefix riêng.

Trả về cả hai cùng lúc là an toàn: prefix file không dùng sẽ khớp rỗng.

Đã kiểm tra đây **không** phải chuyện bản dịch Việt bị lược: ở `an1.102-109` chẳng hạn, segment dài 270 ký tự Pāli / 302 ký tự English là **đầy đủ**; `…pe…` là chính bản Pāli root ghi vậy, không phải lỗi loader.

## Việc khác phát hiện trong lúc audit

`node_modules` của repo là một APFS orphaned directory entry — `ls` thấy tên nhưng `readdir` trả `ENOENT`, nên `tsx` không resolve được và không chạy được `validate` / `test` / `check`. Đã tạo lại thư mục và `npm ci` (269 package). Xem `docs/apfs-orphan-incident-2026-09-27.md`; volume `/Volumes/SSD` vẫn cần `fsck_apfs` khi tháo.

## Tái tạo

```bash
npm run source:sync:all      # 3049 file English + 3422 file Pāli
npm run audit:reference
npm run reference:gaps:check
npm run validate
npm test
npm run check
```

Kết quả tại thời điểm audit: `audit:reference` 1589/1589 khớp segment, 141 bài dưới ngưỡng và đều đã có record; `validate` 0 lỗi, 141 cảnh báo là chính các gap đã ghi nhận; `test` 40/40; `check` 0 lỗi; `build` thành công.
