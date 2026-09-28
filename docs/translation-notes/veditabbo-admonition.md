# `veditabbo` — 94 segment dịch thành "nhận biết", đáng lẽ phải là "khuyên can"

Ghi lại 2026-09-29, phát hiện khi dịch `an/an10.233-236`.

## Vấn đề

`veditabbo` (và `aveditabbo`) là **mệnh đề danh từ của `vedi`** theo nghĩa *khuyên can, nhắc nhở*,
không phải *biết, nhận biết*. Đếm trên toàn bộ bản dịch Việt:

| Cách dịch | Số segment | Ví dụ |
| --- | --- | --- |
| **"được nhận biết"** | **25** | `an3.2:1.2` `Tīhi … bālo veditabbo.` → "…kẻ ngu được nhận biết." |
| "dạy" | 1 | |

Tổng cộng `veditabbo`/`aveditabbo` xuất hiện ở **94 segment ở 36 bài**, và gần như toàn bộ đi theo
cách "được nhận biết".

## Vì sao đó là dịch sai

Công thức `ante-nimitta` của Tăng Chi Bộ luôn đi kèm một hành động sau `veditabbo`, và hành động ấy
chính là cách chứng minh từ này nghĩa gì:

> `an3.1:4.2` — `yehi tīhi dhammehi samannāgato bālo veditabbo te tayo dhamme abhinivajjetvā, yehi tīhi
> dhammehi samannāgato paṇḍito veditabbo te tayo dhamme samādāya vattissāmā’ti.`

Bản dịch hiện tại: *"Ba pháp mà nhờ đó kẻ ngu được nhận biết, chúng ta sẽ bỏ xa ba pháp ấy; ba pháp
mà nhờ đó bậc trí được nhận biết, chúng ta sẽ thọ trì ba pháp ấy mà thực hành."*

Nếu nghĩa là *"được nhận biết"* thì câu tự nó vô nghĩa: bị nhận biết thì bỏ xa, nhận biết thì thọ trì —
không có quan hệ nhân quả nào giữa "nhận biết" và "bỏ xa". Nếu nghĩa là *"được khuyên can"* thì mọi
thứ khớp: người khác nhắc nhở, rồi ta mới quyết định bỏ xa hay thọ trì. Người đọc hiện tại không có
cách nào suy ra điều đó.

Tiếng Việt có sẵn những cách đã quen: **"đáng được khuyên can"**, "đáng nhắc nhở", "đáng can".
Trong `an10.233-236` dùng **"đáng được khuyên can"**.

## Đề xuất

Sửa 93 segment (trừ một segment đã đúng) ở 36 bài: thay "được nhận biết" bằng "đáng được khuyên can"
khi chủ ngữ là `bālo`/`paṇḍito`; riêng `aveditabbo` dùng "không đáng được khuyên can".

Các bài bị chạm nhiều nhất: `dn31` (18), `an3.2` (5), `an3.67` (5), `mn105` (5), `an3.4` (4), `an3.5`
(4), `an3.6` (4), `an4.73` (4), `sn1.20` (4).

Đây là sửa **đổi nghĩa**, nên phải cập nhật `semantic_fidelity` của 36 scorecard chứ không chỉ
`technical_integrity`. Tất cả đều ở trạng thái `published` với scorecard đã ký, nên việc này không
gộp vào một PR dịch chương.

## Một chỗ liên quan cần xem lại cùng lúc

`an3.116:2.1` — `idhekacco puggalo` được dịch *"có chúng sinh hoàn toàn vượt qua xứ vô số hư không"*,
tức `idhekacco` (*một số*) bị bỏ mất. `idhekacco` có 162 segment trong corpus, trong đó chỉ 10 giữ
"một số" và phần lớn bị hấp thụ vào mệnh đề kế. Đây là một nhóm lỗi riêng, chưa đếm kỹ.
