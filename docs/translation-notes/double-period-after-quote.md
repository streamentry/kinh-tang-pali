# Dấu chấm lặp `.”.` ở cuối 6 segment Tăng Chi Bộ đã `published`

Ghi lại 2026-09-29, phát hiện khi dịch `an/an10.50` (chương 5, Phẩm Chửi Bàn).

## Vấn đề

Sáu segment Tăng Chi Bộ kết thúc bằng **`.”.`**: dấu chấm, rồi dấu ngoặc kép đóng, rồi dấu chấm
nữa. Chuẩn tiếng Việt khi cả câu là một trích dẫn là dấu chấm **nằm trong** dấu ngoặc kép:
`…hợp nhất.”`

Đây là lỗi chính tả thuần, **không đổi nghĩa**, nhưng rất dễ lọt vì phần lớn vế đóng ở đây là
mệnh đề kết luận (*Ime kho, bhikkhave, dasa dhammā … saṁvattantī”ti.*), nơi tác giả dễ đóng
ngoặc trước rồi mới đặt dấu chấm.

## Bằng chứng đếm được

| Bài | Segment | Đuôi bản dịch |
| --- | --- | --- |
| `an10.3` | `an10.3:2.13` | *giải thoát tri kiến.”.* |
| `an10.4` | `an10.4:2.7` | *giải thoát tri kiến.”.* |
| `an10.5` | `an10.5:2.13` | *giải thoát tri kiến.”.* |
| `an10.8` | `an10.8:3.3` | *yên ổn rộng lớn khắp mọi phương, hoàn tất mọi phương diện.”.* |
| `an10.9` | `an10.9:2.3` | *yên ổn rộng lớn khắp mọi phương, hoàn tất mọi phương diện.”.* |
| `an10.10` | `an10.10:3.3` | *yên ổn rộng lớn khắp mọi phương, hoàn tất mọi phương diện.”.* |

Tất cả đều `published`, scorecard đã ký. `an10.50:14.1` — bản trong PR `translate(an10.41–50)` —
đã sửa, và nên sửa trước khi đóng PR: cùng mã `Ime kho, bhikkhave …` với `an10.8:3.3` và
`an10.10:3.3`.

**Cần phân biệt với 67 trường hợp hợp lệ.** Có 73 segment toàn corpus kết thúc bằng `[.”]`
vì dấu chấm nằm ngoài dấu ngoặc kép; 68 trong số đó **đúng**, vì câu đó không chỉ là trích dẫn
(ví dụ `an3.65:25.3` *…chớ vì nghĩ rằng “sa-môn này là bậc Đạo Sư của chúng ta”.*). Chỉ 6 segment
trên là lỗi thật, vì cả câu bản dịch là lời thoại trong ngoặc kép.

## Đề xuất

Bỏ một dấu chấm ở 6 segment, giữ `.”`. Không đổi `final_score` (lỗi không ảnh hưởng tiêu chí nào
ngoài `technical_integrity`, vốn đã là 10.0 vì chưa có gate nào bắt được); nên đây là sửa có thể gộp
vào một đợt bảo trì văn bản, không cần mở PR dịch chương riêng.

Đáng cân nhắc thêm một phép kiểm tra vào `npm run validate`: segment kết thúc bằng `.”.` hoặc
`.”.` là lỗi không bao giờ có chủ ý. Nhóm này nhỏ (6) nên chưa từng bị phát hiện bằng mắt.
