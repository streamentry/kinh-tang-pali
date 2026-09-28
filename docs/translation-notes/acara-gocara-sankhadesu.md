# Cùng một Pāli, hai cách dịch: `ācāragocarasampanno … sikkhāpadesu`

Ghi lại 2026-09-29, phát hiện khi dịch `an/an10.50` (chương 5, Phẩm Chửi Bàn).

## Vấn đề

Cụm Pāli này mô tả vị tỳ-kheo có giới, xuất hiện ở 5 segment toàn corpus, và **đang được dịch theo
hai cách**:

```
Idha, bhikkhave, bhikkhu sīlavā hoti, pātimokkhasaṁvarasaṁvuto viharati
ācāragocarasampanno aṇumattesu vajjesu bhayadassāvī, samādāya sikkhati sikkhāpadesu;
```

| Bài | Cách dịch |
| --- | --- |
| `an10.33:1.4` | *đủ căn cơ và phẩm hạnh, biết rõ sợ hãi trong điều nhỏ bé, học tập giữ đúng các học luật đã thọ nhận* |
| `an10.34:1.4` | như trên |
| `an10.35:1.4`, `an10.36:1.4` | bản lược `…pe…`, chỉ còn *học tập giữ đúng các học luật đã thọ nhận* |
| `an5.109:1.3`, `an5.134:3.3` | *đầy đủ hạnh nghi và sở hành, thấy có sự nguy hiểm ngay trong những lỗi nhỏ vi tế nhất, thọ trì và học hành theo các học giới* |
| `an5.136:4.2` | như trên |

Tức là: **Tăng Chi Bộ 4 segment, Tăng Chi Bộ Năm 3 segment** (nếu tính cả hai bản lược) — hai số
bằng nhau, không có tiền lệ nào thắng.

Riêng `sikkhāpadesu` thì **không** tranh nhau: `sikkhāpadaṁ paññattaṁ` (nghĩa *học giới*) và
`samādāya sikkhati sikkhāpadesu` (nghĩa *học luật*) là hai cụm Pāli khác nhau, và mỗi cụm đang
được dịch nhất quán theo tiền lệ riêng.

## Lựa chọn đã ghi

`an10.50:4.3` và `:4.4` dùng **nguyên văn `an10.33:1.4`** — cùng Pāli, cùng quyển, đã `published`.

Lý do nêu trong `content/meta/sutta/an/an10.50.yaml`: lượt review **đã thử đổi** sang cách của
Tăng Chi Bộ Năm, vì "đầy đủ hạnh nghi và sở hành" dễ hiểu hơn "đủ căn cơ và phẩm hạnh", rồi **trả
lại** — vì người đọc Tăng Chi Bộ đọc `an10.33` và `an10.34` trước, và phải thấy một cách trong
chính quyển đó. Sự nhất quán trong quyển được ưu tiên hơn một câu dịch hay hơn ở quyển khác.

## Điều chưa làm

`an5.109`, `an5.134`, `an5.136` **giữ nguyên**. Cả ba đều `published`. Hệ quả là cùng một Pāli vẫn
được đọc theo hai cách giữa Tăng Chi Bộ và Tăng Chi Bộ Năm — đây là điểm cần người biên tập quyết,
vì chọn hướng nào cũng là sửa bài đã ký scorecard.

## Đề xuất

Thuần nhất theo quyển là giữ nguyên hiện trạng và ghi vào `docs/translation-notes/` (đã làm). Nếu
muốn thống nhất toàn corpus, phải chọn một trong hai rồi sửa 3 bài của nhóm kia, kèm cập nhật
`terminology` và `vietnamese_clarity` của các scorecard tương ứng.
