# GOAL HANDOFF — Nâng mọi bản dịch lên điểm rubric trung bình > 9

Tài liệu này dành cho agent tiếp quản dự án. Chi tiết về store, rubric và cổng chất lượng nằm trong
[`goal.md`](goal.md), [`AGENTS.md`](../../AGENTS.md), [`skill/translation.md`](../../skill/translation.md)
và [`docs/quality-assessments.md`](../quality-assessments.md). Đọc các tệp đó trước khi làm bất cứ việc gì.

## Điều kiện hoàn thành (cụ thể, đo được)

Mục tiêu được coi là xong khi **tất cả** điều sau đúng, đo bằng lệnh chứ không bằng cảm nhận:

1. Mọi bài trong `content/meta/sutta/**` có `status: published` (tầng Việt) và `quality.final_score > 9.0`
   **hoặc** một waiver hợp lệ `no-upstream-english` mà `final_score > 9.0` vẫn đúng.
   Bài không có blocker nào ngoài `noEnglishEditionUpstream` và có `final_score > 9.0` là đạt.
2. Không còn bài `review` hoặc `draft` nào mà điểm `> 9.0` có thể đạt bằng sửa lỗi thật.
3. Mọi lớp lấp English (`content/meta/en/**`) đã `published`, trừ những bài còn blocker thật
   (ghi rõ trong meta, không đẩy lên bằng cách hạ điểm).
4. `npm run validate`, `npm test`, `npm run check`, `npm run build`, `audit:store`,
   `reference:gaps:check`, `verify:store:partial`, `audio:check`, `quality:check`, `license:check`,
   `manifest:check`, `catalog:check` đều xanh trên `main`.

**Không được** đạt điều kiện bằng cách: nâng `triangulation` hoặc điểm tiêu chí khác để vượt ngưỡng
mà không có bằng chứng; sửa `status`, `waiver`, `quality` bằng tay; xoá bài khỏi phạm vi; đổi
kinh văn hay trạng thái chất lượng trong một tác vụ không liên quan.

## Trạng thái (ghi lại lúc bàn giao, 2026-10-15)

Số liệu đo lúc bàn giao (phải đo lại trước khi báo cáo):

- Tầng Việt (đo lúc bàn giao trên `origin/main` `d520ccd25`): 5.894 `published`, 228 `review`, 15 `draft`.
  Điểm trung bình của 243 bài chưa published là 8,87 (thấp nhất 8,15).
- Lớp lấp English: 1.059 `published`, 1 `draft`.
- PR đang mở: 0.
- Đợt "lấp English cho bài không có bản Anh upstream" (PR #627, #630) và đợt "đối chiếu bản Việt
  nguyên bài" (PR #628, #629, #631, #636, #637) đã merge.
- Đợt "đối chiếu bản dịch mù độc lập" (Stage B, PR #639 và combo 135/136/137/138) đang ở
  nhiều giai đoạn; xem mục **Đợt dở dang** bên dưới.

Có một điểm quan trọng cần nhớ: **điểm đã "chấm lại" trong các đợt sau khi sửa vẫn là điểm
do agent tự chấm (`assessed_by` là agent), chưa được người biên tập xác nhận.** Bản chấm đã áp dụng
chỉ là điểm trung bình thô của tiêu chí; `final_score` do cổng tính. Đừng tuyên bố bài "đạt"
trước khi chạy cổng.

## Quy trình làm việc đã chứng minh

Một vòng cải thiện một bài (đã chạy được nhiều lần):

1. **Chuẩn bị nhánh làm việc** từ `origin/main` bằng worktree riêng cho mỗi lane (`_wt-<tên>`), liên kết
   `node_modules` và `.cache/upstream` từ repo chính. Không sửa trực tiếp trên `main`.
2. **Đọc bản đối chiếu độc lập** nếu có (bản Việt nguyên bài trong `.cache/`, hoặc bản dịch mù trong
   `opencode-work/w19/blindA`). Bản mù chỉ để phát hiện chỗ cần xem lại, không chép chữ của nó.
3. **Phân xử từng chỗ khác nghĩa bằng Pāli** (ngữ pháp, từ điển trong ngữ cảnh, khoá song song).
   Ba kết quả: sửa (bản dự án sai), giữ (bản đối chiếu sai hoặc chỉ khác diễn đạt), bất định (ghi notes).
4. **Ghi notes** một mục ngắn vào `content/meta/sutta/<c>/<uid>.yaml`. Không sửa `quality`, `status`,
   `waiver`, `assessment_id` bằng tay.
5. **Chấm điểm lại** bằng `npm run quality -- --record <uid> <file.json>` rồi `--apply`. Chấm trung thực;
   trần `triangulation` là 8,0 khi chỉ có một bản đối chiếu cùng họ công cụ, 8,8 khi có bản Việt độc lập
   đã đối chiếu thật.
6. **Kiểm** `_checkwave` cho từng tệp đã sửa; sau đó chạy cổng trên worktree sạch.
7. **Gộp**: `combo` gom các lane, `auditpr` đặt tiêu đề/nội dung PR, `merge_when_clean` squash-merge khi
   CI sạch. CI có thể lỗi tạm do giới hạn API GitHub (403); chạy lại job thất bại thay vì sửa code.

Công cụ nằm ở `/Volumes/SSD/opencode-work/w19/tools/` (ngoài repo). Đừng viết lại chúng nếu
chưa đọc kỹ.

## Ràng buộc

- Tối đa **11 agent chạy đồng thời** (xem memory `feedback_max-11-subagents`). Giới hạn phiên Claude
  có thể làm các agent bị ngắt; khi bị ngắt, kiểm tra tệp đã sửa/notes/assess dở trước khi làm lại
  để không nối trùng notes.
- Giữ nguyên segment ID, không đưa Pāli vào bản dịch JSON, không tự phát minh ID.
- Không đổi giấy phép, `NOTICE`, `source/suttacentral.lock.json`, `source/layers.yaml`.
- Không đổi audio đã duyệt (`source/narration-profile.json`, `docs/audio.md`). Bài có audio phát hành
  không được đổi nội dung; `combo` giữ bản trên `main` cho các bài này.
- Không tự xoá tệp, không đẩy lên remote bên ngoài ngoài luồng PR đã định.

## Đợt dở dang (kiểm trước khi làm tiếp)

- **Stage B (đối chiếu bản dịch mù, lanes 3000–3042)**: đã dựng xong diff, nhiều lane đã sửa và chấm.
  Các lane 3033, 3035–3042 bị ngắt giữa chừng khi hết giới hạn; đã khởi động lại. Kết quả và
  `assess/<uid>.json` nằm ở `opencode-work/w19/assess/`. Kiểm từng lane trước khi gom.
- **Combo 138** (lanes 3029, 3031, 3032, 3034) đang chạy cổng lúc bàn giao.
- **Stage A (bản dịch mù của 192 bài `review` không có nguồn độc lập)**: đã hoàn tất 55 đoạn
  (`blindA/out_20xx_*.json`) và đã kiểm `check.py` cho từng đoạn.
- **Lỗi ngoài lane đã ghi**: `opencode-work/w19/sample_results.txt` liệt kê các lỗi phát hiện ở lane khác,
  chưa có ai sửa (ví dụ cụm `tare loke visattikaṁ`, `adurāgataṁ`, tiêu đề `tha-ap` "Bài Kệ Tuyên Ngôn"
  và "Ký Sự", phạm vi `oḷārikā`/`anusahagatā`, xưng hô "ta"/"tôi" trong `tha-ap`). Đây là việc cần quyết
  định chung của người biên tập; đừng sửa lẻ từng bài.

## Thứ tự ưu tiên khi làm tiếp

1. Đo lại trạng thái trên `origin/main` (script đếm `status` trong `content/meta/**`).
2. Hoàn tất cổng cho combo 138 và các PR đang mở; gộp khi CI sạch.
3. Với mỗi bài `review` còn lại: đọc `blocking_errors` và `notes`; nếu blocker là `noEnglishEditionUpstream`
   và điểm đã > 9,0 thì chạy `quality:waive` rồi `--apply`; nếu blocker là lỗi thật thì sửa trước.
4. Với bài `draft` (15 bài Việt, 1 bài English): xử lý blocker thật (`unresolvedTerm`, Pāli hỏng,
   thiếu khoá) hoặc ghi rõ vì sao không thể đạt.
5. Chạy lại toàn bộ cổng và báo cáo số liệu thật, kèm danh sách bài còn dưới 9,0 và lý do.

Nếu sau các bước trên vẫn còn bài dưới 9,0 mà không có cách sửa có căn cứ, **báo cáo thẳng**
thay vì nâng điểm. Đó là kết quả đúng, không phải thất bại.
