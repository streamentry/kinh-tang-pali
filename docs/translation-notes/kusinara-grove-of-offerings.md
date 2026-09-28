# `baliharaṇe vanasaṇḍe` — "trong rừng Rừng Cúng Dường", hai chữ *rừng* cạnh nhau

Ghi lại 2026-09-29, phát hiện khi dịch `an/an10.44` (chương 5, Phẩm Chửi Bàn).

## Vấn đề

Công thức mở đầu `Ekaṁ samayaṁ bhagavā kusinārāyaṁ viharati baliharaṇe vanasaṇḍe.` xuất hiện
ở 2 segment toàn corpus (`an3.123:1.1` và `an10.44:1.1`). Cả hai đều dịch là:

> "Một thời, Đức Phật ở Kusinārā, **trong rừng Rừng Cúng Dường**."

`baliharaṇa` = lễ vật cúng dường; `vanasaṇḍa` = rừng, gò đồi. Khi dịch *vanasaṇḍa* thành "Rừng" rồi
đặt nó sau tiền ngữ "trong …", chữ *rừng* bị lặp.

Đây không phải lỗi ngữ nghĩa — *Rừng Cúng Dường* là cách gọi đúng, và Sujato cũng dịch
*Forest of Offerings* — nhưng là lỗi đọc lỗi người Việt phải dừng lại ở.

## Bằng chứng đếm được

| Bài | Segment | Trạng thái |
| --- | --- | --- |
| `an3.123` | `an3.123:1.1` | `published` |
| `an10.44` | `an10.44:1.1` | sửa trong PR `translate(an10.41–50)` → **"trong Rừng Cúng Dường"** |

Ngoài ra `an4.115` có `mahāvanasaṇḍa` nhưng ở một ngữ cảnh khác (nơi bịt kín tầm mắt), không
dùng lại công thức này.

## Vì sao chỉ ghi lại chứ không sửa luôn

`an3.123` đang `published` với scorecard đã ký, và lỗi này **không đổi nghĩa** — nên nó thuộc loại
có thể gộp vào một đợt bảo trì văn bản thay vì một PR dịch chương. Nhưng vì `an10.44` đã dùng lại
nguyên văn từ `an3.123`, nếu không sửa thì hai bài vẫn lệch nhau, nên phải ghi lại để người sau
không lại dùng `an3.123` làm nguồn.

## Đề xuất

Sửa một segment: `an3.123:1.1`, bỏ chữ *rừng* thừa trong "trong rừng Rừng Cúng Dường". `technical_integrity`
giữ nguyên; `vietnamese_clarity` có thể nâng nhẹ.
