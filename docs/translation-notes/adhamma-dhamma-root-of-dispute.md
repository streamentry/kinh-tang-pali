# Mười gốc tranh cãi — cặp `abhāsita/abhāsita` bị đảo chiều ở 3 bài đã `published`

Ghi lại 2026-09-29, phát hiện khi dịch `an/an10.41` và `an/an10.42` (chương 5, Phẩm Chửi Bàn).

## Vấn đề

Cụm Pāli đối xứng này xuất hiện ở 5 segment toàn corpus. Sáu vế của nó **luôn là cùng một đối
tượng của Thế Tôn ở cả hai bên, chỉ đảo chiều**:

```
abhāsitaṁ alapitaṁ tathāgatena  bhāsitaṁ lapitaṁ tathāgatenāti  dīpenti
   (chưa nói)          →        (đã nói)
bhāsitaṁ lapitaṁ tathāgatena    abhāsitaṁ alapitaṁ tathāgatenāti  dīpenti
   (đã nói)            →        (chưa nói)
```

Vế thứ nhất phải dịch là **"gọi điều Thế Tôn chưa nói là điều Thế Tôn đã nói"**. Cả ba bài đã
`published` đều dịch vế này thành chiều ngược lại.

## Bằng chứng đếm được

`an10.37:1.3` — Pāli `abhāsitaṁ alapitaṁ tathāgatena bhāsitaṁ lapitaṁ tathāgatenāti` (not-spoken
presented as spoken). Bản dịch hiện tại: *"gọi điều Thế Tôn **đã nói** là điều Ngài **chưa nói**"* —
đúng chiều ngược.

`an10.38:1.3` và `an10.40:1.3` — Pāli ở đây **khác**: `abhāsitaṁ alapitaṁ tathāgatena abhāsitaṁ
alapitaṁ tathāgatenāti`, tức *không nói như không nói*. Bản dịch vẫn viết *"gọi điều Thế Tôn **đã
nói** là điều Ngài **đã nói**"* — **sai cả hai vế**, và sai ở một chỗ Pāli còn đúng vốn dĩ. Hai bài
này còn cùng lỗi ở năm vế còn lại: `āciṇṇa` dịch là *tuyên thuyết* (đúng ra *thực hành*, và trùng
nghĩa với vế `abhāsita` ngay trước), `paññatta` cũng để *tuyên thuyết*.

| Bài | Số vế sai | Trạng thái |
| --- | --- | --- |
| `an10.37` | 1 | `published` |
| `an10.38` | 6 | `published` |
| `an10.40` | 6 | `published` |

`an10.41:1.3` và `an10.42:1.4` là bản trong PR `translate(an10.41–50)`, **đã sửa** theo một khuôn
thống nhất cho cả sáu vế: *gọi điều Thế Tôn X là điều Thế Tôn Y*, và thống nhất *Thế Tôn* thay cho
việc đan xen *Thế Tôn* / *Ngài*.

## Vì sao chỉ ghi lại chứ không sửa luôn

Cả ba bài đang ở trạng thái `published` với scorecard đã ký. Đây là **lỗi đổi nghĩa**, nên sửa chúng
kéo theo việc cập nhật `semantic_fidelity` của ba scorecard, và không thuộc phạm vi một PR dịch
chương. Người biên tập quyết định.

## Đề xuất

Sửa `an10.37:1.3` (một vế), `an10.38:1.3` và `an10.40:1.3` (sáu vế mỗi bài) theo **đúng nguyên văn
đã dùng ở `an10.41:1.3`**, và hạ `semantic_fidelity` của ba bài xuống đúng mức thực tế trước khi
làm. Sau đó có thể thêm một phép kiểm tra: cụm Pāli này chỉ có 5 segment, nên đáng đặt vào danh
sách kiểm thử khi lần sau gặp lại.
