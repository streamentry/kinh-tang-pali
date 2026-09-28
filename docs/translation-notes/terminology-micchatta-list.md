# Danh sách mười `micchattā` — bất đồng thuật ngữ trong corpus

Ghi lại 2026-09-28, phát hiện khi dịch `an/an10.132`.

## Vấn đề

Cùng một danh sách mười điều sai xuất hiện ở nhiều bài, nhưng corpus đang dịch **khác nhau**:

| Pāli | `dn34:2.3.54` (đã dịch) | `an4.205:2.2`, `an4.206:2.2` (đã dịch) | `an10.132:1.3` (mới) |
| --- | --- | --- | --- |
| `micchāājīvo` | tà mạng | **tà mệnh** | tà mạng |
| `micchāñāṇaṁ` | tà trí | **tà tri** | tà trí |

Tám thuật ngữ còn lại khớp nhau ở cả ba nơi: tà kiến · tà tư duy · tà ngữ · tà nghiệp ·
tà tinh tấn · tà niệm · tà định · tà giải thoát.

## Bằng chứng cho lựa chọn

Đếm trên toàn bộ 1.621 file bản dịch Việt, so từng cặp Pāli ↔ Việt:

| Thuật ngữ | Số lần | Ví dụ |
| --- | --- | --- |
| `micchā-ājīva` → **"tà mạng"** | 12 | `an5.36` "…từ bỏ tà mạng và nuôi sống mình bằng chánh mạng" |
| `micchā-ājīva` → "sinh kế" | 3 | |
| `micchā-ājīva` → "mạng sống" | 2 | |
| `ājīva` → "tà mệnh" | **0** | ngoại lệ chỉ ở `an4.205` |
| `ñāṇa` → **"trí"** | 7 | "…thì năm trí này được vận hành…" |
| `micchā-ñāṇa` → "tà tri" | **0** ngoài `an4.206` | ngoại lệ chỉ ở `an4.206` |

Ngoài ra `ājīva` là *sinh tài / nuôi sống*. **"Mệnh"** nghĩa là *số phận, chết đi* — dùng cho
`ājīva` là sai nghĩa, không chỉ khác cách diễn đạt. Đây là loại lỗi mà tiêu chí 5 của quality
gate gọi là *distinctions quan trọng bị làm phẳng*.

## Vì sao chưa sửa luôn

`an4.205` và `an4.206` đang ở trạng thái `published` với scorecard đã ký. Sửa hai thuật ngữ ấy là
thay đổi **lịch sử biên tập** của hai bài đã công bố, nên cần quyết định riêng của người biên
tập và phải chấm lại scorecard. Không gộp vào một lượt dịch thường lệ.

## Đề xuất

Sửa `an4.205:2.2` và `an4.206:2.2` sang “tà mạng” và “tà trí”, cập nhật scorecard hai bài đó,
và chấp lại. Sau đó thuật ngữ sẽ thống nhất corpus-wide và tiêu chí 5 đạt đúng nghĩa.
