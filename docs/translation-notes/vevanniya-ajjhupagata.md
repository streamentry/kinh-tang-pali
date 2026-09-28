# `Vevaṇṇiyamhi ajjhupagato` — dịch mất cả hai từ

Ghi lại 2026-09-29, phát hiện khi dịch `an/an10.48` (chương 5, Phẩm Chửi Bàn).

## Vấn đề

`Vevaṇṇiyamhi ajjhupagato` xuất hiện ở 2 segment toàn corpus, **cùng một cụm Pāli**:

- `an10.48:2.1` — câu tự vấn trong danh sách *mười điều vị xuất gia nên thường xem xét*
- `an10.101:1.3` — bản tóm tắt cùng mười điều ấy, nhúng trong một câu dài

Cả hai đều dịch là *"Tôi đã quy về việc **giữ mình nghiêm túc**"*.

| Từ | Nghĩa | Vấn đề |
| --- | --- | --- |
| `vevaṇṇiya` | không bị chê trách, không bị soi mói | **không được dịch** |
| `ajjhupagata` | đã đạt được, đã tới nơi | **không được dịch** |

Cụm tiếng Việt thu được (*giữ mình nghiêm túc*) không có nguồn gốc nào trong Pāli. Đây là mẫu lỗi
nguy hiểm: nghe rất hợp lý với chủ đề "giới hạnh", nhưng không truy được về Pāli.

## Đã sửa

`an10.48:2.1` → **"Tôi đã đạt được sự không bị chê trách"** (0 segment tiền lệ, đặt mới, ghi lý do
trong `content/meta/sutta/an/an10.48.yaml`).

## Còn sót

`an10.101:1.3` — `published`, scorecard đã ký, **giữ nguyên**. Đây là lỗi đổi nghĩa, nên sửa nó
kéo theo việc cập nhật `semantic_fidelity` của `an10.101`, và không thuộc phạm vi một PR dịch
chương. Người biên tập quyết định.

## Đề xuất

Sửa `an10.101:1.3` thành "Tôi đã đạt được sự không bị chê trách" cho khớp `an10.48:2.1`, và hạ
`semantic_fidelity` của `an10.101` xuống đúng mức thực tế.
