# Dấu lược `…pe…` — 148 segment còn mang chữ viết tắt Pāli vào bản dịch

Ghi lại 2026-09-28, phát hiện khi dịch `an/an10.155` và `an/an10.156-166`.

## Vấn đề

`…pe…` trong bản Bilara là **chữ viết tắt của bản Pāli** (`pe` = *peyyālato*, "phần còn lại"),
một quy ước của soạn thảo, không phải từ có nghĩa. Bản dịch tiếng Việt không nên mang nó
sang: người đọc Việt không có bản Pāli để giải mã, nên `…pe…` trong bản dịch chỉ là ký tự lạ.

Corpus đang chia làm ba cách xử lý, đếm trên toàn bộ file bản dịch Việt đã có, ghép từng cặp
Pāli ↔ Việt, lấy những segment mà Pāli chứa `…pe…`:

| Cách | Số segment | Ví dụ |
| --- | --- | --- |
| **Bỏ `pe`, giữ `…`** | **1.850** | `an10.124:1.3` `Sammādiṭṭhi …pe… sammāvimutti—` → "Chánh kiến … chánh giải thoát—" |
| Bỏ hết dấu lược | 254 | `an10.102:1.9` `Āsavānaṁ khayā …pe… sacchikatvā` → "Nhờ đoạn tận các lậu, trực chứng và chứng ngộ" |
| Giữ nguyên `…pe…` | 142 | `an10.102:1.7` → "…ba đời …pe… một cách đầy đủ…" |

Hai nhóm sau là ngoại lệ lịch sử; **nhóm chính 1.850 segment là cách đúng**. Chương 15
(`an10.145–154`, đã merge ở `84615c7`) từng mang nguyên `…pe…` ở 10 segment `1.2`; đã sửa
thành "Hãy lắng nghe và chú tâm kỹ …" cho khớp nghi thức đã đo được.

## 148 segment còn sót — chia làm hai loại, mức độ khác nhau

### Loại A — 142 segment: Pāli có `…pe…`, bản dịch giữ nguyên chữ tắt

| Bài | Số segment | Bài | Số segment |
| --- | --- | --- | --- |
| `dn14` | 37 | `an10.109` | 4 |
| `dn16` | 28 | `an10.102` | 2 |
| `snp3.12` | 28 | `an10.108` | 2 |
| `dn2` | 24 | `an10.104` | 1 |
| `dn1` | 13 | `an10.107` | 1 |
| | | `an10.110` | 1 |
| | | `snp3.10` | 1 |

Lỗi thuần chính tả, **không đổi nghĩa**: bỏ đúng ba ký tự `pe` trong mỗi segment, giữ nguyên
dấu `…` và mọi dấu câu kèm theo. Một biến thể cần canh: `an10.109:2.2` kết bằng `…pe….”` —
vừa lược, vừa đóng ngoặc kép, vừa có dấu chấm; bỏ `pe` phải giữ nguyên phần `.”`.

### Loại B — 6 segment: Pāli **không lược gì**, bản dịch tự chèn `…pe…`

Đây là lỗi nặng hơn nhiều, không phải chính tả mà là **mất nội dung**.

`an10.107:3.1` và `an10.107:6.4`: Pāli liệt kê **trọn vẹn** —

> `jātidhammā sattā jātiyā parimuccanti, jarādhammā sattā jarāya parimuccanti,
> maraṇadhammā sattā maraṇena parimuccanti, sokaparidevadukkhadomanassupāyāsadhammā sattā
> sokaparidevadukkhadomanassupāyāsehi parimuccanti`

bảy hạnh do sinh, bảy hạnh do già, bảy hạnh do chết, bảy hạnh do sầu bi khổ ưu não — không
có chữ lược nào. Bản dịch Việt lại viết:

> "…thì thoát khỏi bảy hạnh do sinh **…pe…** thoát khỏi sầu, bi, khổ, ưu và não?"

Nghĩa là hai mục **"bảy hạnh do già"** và **"bảy hạnh do chết"** biến mất khỏi bản dịch, và
chỗ trống ấy lại bị đánh dấu bằng chữ viết tắt Pāli. Đây là dạng lỗi mà bốn cột đối chiếu
hiện ra **sai âm thầm**: cột Pāli có đủ, cột Việt thiếu, và dấu `…pe…` lại gợi ý rằng đó là
lược của bản gốc.

Bốn segment còn lại (`dn14:3.29.20`, `dn1:2.29.1`, `dn1:2.34.1`, `dn1:2.40.1`) có Pāli
chỉ là `pe…` đứng riêng; bản dịch viết `…pe…`. Ở đây chữ tắt là do bản Pāli dùng lối viết
riêng, nên ít nghiêm trọng hơn nhưng vẫn không nên mang sang.

## Đề xuất

Tách thành hai việc, không gộp:

1. **Loại B trước** — `an10.107:3.1`, `an10.107:6.4`: dịch lại trọn mục bảy hạnh do già và
   bảy hạnh do chết, bỏ `…pe…`. Đây là sửa mất nội dung, phải cập nhật `semantic_fidelity` và
   `segment_alignment` của scorecard `an10.107` cho đúng.
2. **Loại A sau** — đổi thuần chính tả 142 segment, cập nhật `technical_integrity` của 12
   scorecard bị chạm.

Cả 12 bài trong bảng trên đều ở trạng thái `published` với scorecard đã ký, nên hai việc này
là tái soạn bản đã xuất bản và **không được gộp vào một PR dịch chương**.
