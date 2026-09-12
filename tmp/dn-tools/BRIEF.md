# Brief chung: dịch một kinh DN sang tiếng Việt (agent dịch)

Bạn dịch MỘT kinh Dīgha Nikāya. Đọc theo thứ tự:

1. `/Volumes/SSD/kinh-tang-pali/AGENTS.md` (quality gate 10 tiêu chí, blocking errors)
2. `/Volumes/SSD/kinh-tang-pali/skill/translation.md` (phương pháp tam giác đối chiếu)
3. `/Volumes/SSD/kinh-tang-pali/content/glossary/pali-vi.yaml` (thuật ngữ chuẩn — bắt buộc dùng preferred, trừ khi ngữ cảnh rõ ràng đòi hỏi khác)

## Nguồn

- **Pāli root (authority cuối cùng):** `.cache/upstream/suttacentral/root/pli/ms/sutta/dn/<uid>_root-pli-ms.json` (pin commit `11c9d708978cde8ba61096d8a75f7ddfb846f639`)
- **English Sujato (reference, KHÔNG copy):** `.cache/upstream/suttacentral/translation/en/sujato/sutta/dn/<uid>_translation-en-sujato.json`
- **Thích Minh Châu (TMC):** dùng kiến thức có sẵn về bản dịch này để đối chiếu thuật ngữ/truyền thống; KHÔNG copy nguyên văn dài. Khi không chắc nhớ chính xác TMC, đối chiếu Pāli + English là đủ.

## Output — đúng 2 file

1. `content/translation/vi/project/sutta/dn/<uid>_translation-vi-project.json`
   - JSON object: `{ "<segment-id>": "<văn Việt>", ... }`
   - Segment ID phải **chính xác từng ký tự** so với Pāli root, đúng thứ tự root, **đủ 100%** segments. KHÔNG thêm/bớt/sửa ID.
   - NFC normalized, không Pāli trong file translation.
2. `content/comment/vi/project/sutta/dn/<uid>_comment-vi-project.json`
   - Chỉ tạo khi có điểm đáng ghi: disagreement Pāli/English/TMC, alternative reading, quyết định thuật ngữ quan trọng,地名 chính tả. Key là segment ID (không cần mọi segment). Format text ngắn gọn tiếng Việt.

## Workflow bắt buộc (chunk)

- Xử lý theo chunk ~120–150 segment: đọc Pāli + English của chunk bằng script python, dịch cẩn thận, ghi chunk JSON vào `/Volumes/SSD/kinh-tang-pali/tmp/dn-tools/chunks-<uid>/NNN.json`, rồi merge bằng `python3 /Volumes/SSD/kinh-tang-pali/tmp/dn-tools/merge.py <uid> /Volumes/SSD/kinh-tang-pali/tmp/dn-tools/chunks-<uid>`.
- Giữ file notes thuật ngữ riêng `/Volumes/SSD/kinh-tang-pali/tmp/dn-tools/notes-<uid>.md` (tên riêng, cách dịch formula lặp) và nhất quán toàn bài.
- Segment dạng `X.0` là tiêu đề mục — dịch tiêu đề (ví dụ `dn14:2.0` → `2. Vụ Vượt Luyến Ái` … tuỳ Pāli: vagga/sutta heading trong root).
- Cuối cùng chạy `python3 /Volumes/SSD/kinh-tang-pali/tmp/dn-tools/check.py <uid>` — phải in `COVERAGE OK`.

## Văn phong & thuật ngữ (theo chuẩn các bài DN đã published trong repo)

- `bhagavā` → "Đức Thế Tôn" (lời thoại: "bạch Thế Tôn"); sau đó có thể "Ngài" khi antecedent rõ.
- `evaṁ me sutaṁ` → "Tôi nghe như vầy:" ; `bhikkhave` → "này các tỳ-kheo"; `āyasmā` → "Tôn giả".
- Quotation: dấu cong “…” cho tầng 1, ‘…’ cho tầng 2 (chuẩn corpus — KHÔNG dùng dấu thẳng " hoặc '). Mở/đóng có thể tràn segment; giữ cân bằng theo logic lời thoại (kết thúc bằng `ti`/lời nói).
- Thời kể chuyện: quá khứ ("Một thời Đức Thế Tôn trú…"); giữ `sanh`/`trú` kiểu Hán-Việt đã quen: "sanh khởi", "trú trong…", "hoan hỷ, tùy hỷ lời Thế Tôn dạy", "pháp nhãn thanh tịnh, không bụi, không nhơ".
- Thuật ngữ: `viññāṇa`=thức, `saññā`=tưởng, `vedanā`=thọ, `phassa`=xúc, `nāmarūpa`=danh-sắc, `taṇhā`=ái, `upādāna`=thủ, `bhava`=hữu, `jāti`=sanh, `dukkha`=khổ, `sīla`=giới, `samādhi`=định, `paññā`=tuệ, `sati`=niệm, `nīvaraṇa`=triền cái, `nibbāna`=Niết-bàn, `jhāna`=thiền (bậc thiền: "sơ thiền"…"tứ thiền"), `rūpa`=sắc, `arūpa`=vô sắc, `khandha`=uẩn (năm uẩn), `āyatana`=nhập, `dhātu`=giới (nguyên tố)/cõi, `indriya`=căn.
- Formula lặp (công thức thiền, công thức thần thông, công thức phân tích thân/không): giữ cấu trúc lặp giống root, không viết gộp.
- Danh từ riêng để nguyên không dấu (Rājagaha, Veḷuvana, Ambalaṭṭhikā…), giữ diacritic Pāli như root.
- Không thêm giải thích vào lời kinh; giải thích chỉ vào file comment.
- KHÔNG dịch máy móc English → Việt; English chỉ để parse cú pháp. Mọi câu phải audit ngược về Pāli.

## Sau khi dịch xong

- Chạy lại `check.py` (phải COVERAGE OK) và `json.load` hợp lệ.
- Tự làm adversarial review: đọc lại toàn bộ bản Việt (mở file merged), so với Pāli ở các đoạn trọng yếu (định nghĩa, phủ định, danh sách, speaker), sửa lỗi.
- KHÔNG đụng `content/meta/`. KHÔNG commit git. KHÔNG đụng các kinh khác.
- Báo cáo cuối: số segment, danh sách comment đã ghi (segment + lý do 1 dòng), các disagreement chính, đề xuất điểm 10 tiêu chí.

## Lưu ý riêng từng kinh

- Chia nhỏ công việc đều đặn và merge thường xuyên để tránh mất dữ liệu.
- Chất lượng hơn tốc độ: mỗi chunk phải qua semantic audit trước khi merge.
