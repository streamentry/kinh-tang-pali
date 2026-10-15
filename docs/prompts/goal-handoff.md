# GOAL HANDOFF — Nâng mọi bản dịch lên điểm rubric > 9,0 — đo bằng cổng, không bằng cảm nhận.

Đọc trước: [`AGENTS.md`](../../AGENTS.md), [`skill/translation.md`](../../skill/translation.md), [`docs/quality-assessments.md`](../quality-assessments.md).

## Điều kiện hoàn thành
1. Mọi bài trong content/meta/sutta/** có status: published và quality.final_score > 9.0. Blocker duy nhất được chấp nhận là noEnglishEditionUpstream, kèm waiver no-upstream-english hợp lệ.
2. Không còn bài review/draft nào có thể vượt 9,0 bằng sửa lỗi thật.
3. Mọi lớp lấp English (content/meta/en/**) đã published, trừ bài còn blocker thật (ghi rõ trong meta).
4. Xanh trên main: validate, test, check, build, audit:store, reference:gaps:check, verify:store:partial, audio:check, quality:check, license:check, manifest:check, catalog:check.

Cấm: nâng điểm tiêu chí không có bằng chứng; sửa tay status/waiver/quality/assessment_id; xoá bài khỏi phạm vi.

## Bối cảnh bàn giao (2026-10-15, đo lại trước khi dùng)
- Tầng Việt: 5.894 published, 228 review, 15 draft; 243 bài chưa published trung bình 8,87 (thấp nhất 8,15).
- English fill: 1.059 published, 1 draft.
- Điểm chấm lại trước đây đều do agent tự chấm, chưa người biên tập xác nhận.
- Kết quả trung gian phiên trước (bản dịch mù, assess JSON, script gom PR) nằm ngoài repo, không có ở đây. Chỉ tin main và PR đang mở.
- Lỗi chéo cần người biên tập quyết định chung, đừng sửa lẻ: cụm "tare loke visattikaṁ", "adurāgataṁ", tiêu đề tha-ap ("Bài Kệ Tuyên Ngôn", "Ký Sự"), phạm vi oḷārikā/anusahagatā, xưng hô "ta"/"tôi" trong tha-ap.

## Quy trình một bài
1. Làm trên nhánh được chỉ định, tách từ origin/main mới nhất.
2. Đọc npm run store -- <uid>: Pāli, English (Sujato + lớp lấp), Việt hiện hành, bản nguyên bài (sau npm run legacy:sync).
3. Phân xử từng chỗ khác nghĩa bằng Pāli. Ba kết quả: sửa, giữ, hoặc bất định (ghi notes). Bản đối chiếu chỉ để phát hiện chỗ cần xem, không chép chữ.
   Bài không có bản đối chiếu độc lập: chỉ dựa vào Pāli gốc và đoạn song song (cùng pericope/công thức ở bài khác, ưu tiên bài đã published có bản Anh hoặc Việt độc lập). Đoạn trùng thì dùng lại cách dịch đã kiểm; đoạn riêng thì Pāli tự đứng. Ghi uid song song đã dùng vào notes. Mục tiêu của các bài này vẫn là > 9,0.
4. Ghi một mục notes ngắn vào content/meta/sutta/<c>/<uid>.yaml.
5. Review đối kháng riêng, rồi chấm đủ 10 tiêu chí: npm run quality -- --record <uid> <file.json>, rồi --apply. Chấm triangulation theo rubric, dựa trên bằng chứng ghi trong notes (Pāli, đoạn song song, ngữ pháp/từ điển); không có trần cố định, nhưng điểm phải phản ánh việc vắng bản Anh/Việt độc lập.
6. validate/test/check cục bộ, rồi gom nhiều bài mỗi PR, push, mở PR. CI lỗi 403 do giới hạn API: chạy lại job, không sửa code.

## Ràng buộc
- Tối đa 11 subagent đồng thời. Agent bị ngắt: kiểm tệp đã sửa/notes/assess trước khi làm lại để không nối trùng notes.
- Giữ segment ID; không đưa Pāli vào translation JSON; không phát minh ID.
- Không đổi giấy phép, NOTICE, source/suttacentral.lock.json, source/layers.yaml.
- Không đổi audio đã duyệt (source/narration-profile.json, docs/audio.md); bài có audio đã phát hành không được đổi nội dung.
- Không xoá tệp; chỉ push qua luồng PR.

## Thứ tự
1. Đo lại status/điểm trong content/meta/** trên origin/main; liệt kê PR đang mở.
2. Đưa PR đang mở tới CI xanh và merge.
3. Bài review: đọc blocking_errors và notes. Chỉ còn noEnglishEditionUpstream và điểm > 9,0 → npm run quality:waive rồi --apply. Blocker thật → sửa trước.
4. Bài draft (Việt + English): xử lý blocker thật (unresolvedTerm, Pāli hỏng, thiếu khoá) hoặc ghi rõ vì sao không đạt.
5. Chạy lại toàn bộ cổng; báo cáo số liệu thật kèm danh sách bài còn ≤ 9,0 và lý do.

Bài không thể vượt 9,0 bằng sửa có căn cứ thì báo cáo thẳng, không nâng điểm. Đó là kết quả đúng.
