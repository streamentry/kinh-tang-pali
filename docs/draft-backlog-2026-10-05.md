# Vì sao phần lớn bài còn `draft` — chẩn đoán có số đếm

Đợt rà soát 2026-10-05. Mọi con số dưới đây đo bằng chính hàm của kho
(`englishCoverageFor`, `isSubstantive`, `segmentMapForUid`, `expectedStatusForQuality`),
không đếm bằng mắt và không tin lại báo cáo của lát trước.

Số "draft" trong bảng dưới đo tại **`9b4994c7`** (giai đoạn trước PR này).

## Một câu trả lời, không phải 1.239 câu trả lời

**1.176 bài trên 1.239 draft (95%) không bị chặn vì lỗi dịch. Chúng bị chặn vì bản Anh
đã ghim không tồn tại cho bài đó ở commit `11c9d708`.**

`scripts/validate.ts` coi tệp `translation/en/sujato/...` thiếu là **error** khi status là
`review` hay `published`. Kiểm chứng trực tiếp: đặt `kn/ja101` — bài đã có lớp lấp
`english-project` **published** phủ 9/9 khoá, `ratio = 1` — sang `published`, validate báo
lỗi `pinned English reference missing`. Lớp lấp của dự án **không cứu được** bài nào thiếu
hẳn tệp ghim, dù nó phủ đủ.

Phân bố theo sub-collection, toàn bộ thuộc `kn`:

| sub-collection | số bài draft |
| --- | --- |
| `tha` (Theragāthā) | 445 |
| `ja` (Jātaka) | 375 |
| `mil` (Migaḍasa) | 212 |
| `vv` | 66 |
| `pv` | 31 |
| `ne` | 20 |
| `bv` | 10 |
| `thi` | 9 |
| `ps` | 5 |
| `cnd` | 3 |

Đây là **giới hạn của bản chụp upstream**; `npm run verify:store` in nó ở mục *advisory*:
`english-sujato` phủ 4.168/5.764 văn bản, **1.596 không tồn tại** ở commit đã ghim.

Sửa điều này là **quyết định của người biên tập**, không phải việc dịch: hoặc đổi luật
trong `validate.ts`, hoặc ghim commit bilara mới đã có bản Anh cho các bộ này. Tôi không tự
đổi, vì `AGENTS.md` coi thiếu tầng tham khảo là lỗi chặn và hạ tiêu chuẩn để né là sai.

## PR này sửa gì

12 bài chuyển `draft` → `published`, tất cả đều có bản Anh đã ghim nên tầng tham khảo
thật sự tồn tại.

### Nhóm A — blocker dựa trên cách đếm sai

Quy ước của kho (commit `a3817cfb`): `…pe…` trong Pāli là **ký hiệu lược** của bilara và bản
Việt giữ **đúng một** `…`. Nên Pāli có **2** ký tự `…` thì bản Việt **đúng** là có **1**.
Người chấm trước đã đếm thẳng số ký tự `…` trên cả hai bên, rồi báo *"cắt ngắm"*.

Đếm lại bằng đúng quy ước trên **toàn tầng**:

| | số khoá |
| --- | --- |
| `…pe…` rò sang bản Việt | 0 |
| bản Việt có `…` mà Pāli **không** có (cắt ngắm thật) | 1 |
| bản Việt **bỏ** mất `…` của Pāli (bung lược thành văn) | 33 |

Cùng loại, `kn/ja20`: blocker nói coverage 0/1 vì `ja20:4.4` không có tiếng Anh. Đếm lại,
`ja20:4.4` dài **39** ký tự, dưới ngưỡng 40 của `source/layers.yaml`, nên **không** phải khoá
có nội dung; `ratio = 1` và không cần entry trong sổ gap.

### Nhóm B — lỗi nghĩa thật

Đọc Pāli ↔ Việt từng cặp, có tiền lệ đo được trước khi viết:

| bài · khoá | lỗi |
| --- | --- |
| `thag3.9:1.1–1.2` | hai câu **lấy nguyên văn từ văn bản khác** (*vách đá màu chàm*, *cỏ bị đống củi nghiền nát*); Pāli mô tả thân trưởng lão gầy guộc — đối chiếu cụm chỉ có **2** khoá trong corpus, cả hai đều mô tả thân gầy, và Sujato dịch *knobbly knees / thin and veiny* |
| `thag3.14:1.1` | `hi` là tiểu từ nhấn mạnh, bị đọc thành phủ định → đảo ngược thông điệp cả bài; Sujato dịch *Transmigrating, I went to hell* |
| `thag3.5:1.3` | vế không có trong Pāli, mượn nguyên văn từ `dn31:14.31` |
| `thag3.8:2.1–2.2` | đổi tân ngữ: `niggayha` không phải *"nén **mình**"* mà *"nén **thân tương**"* (`ñātayo` ở `2.2`) |
| `thag3.6:3.3` | `Brahmacariyānuciṇṇena` là *không bỏ rơi* phạm hạnh, bị dịch ngược thành *không bám* |
| `thag3.4:2.3–2.4` | hai khoá đảo nội dung nhau |
| `ja66:1.2–1.3` | `aḷārakkhī` là **người nữ**; đếm `aḷāra` trong corpus cho thấy nó là cách gọi thẳng người ở `ja524`, và Sujato dịch *the moon-eyed lady* — bản Việt để *"chiếc nhẫn có sọc"* |
| `mn24:4.4`, `17.7` | nuốt mất `kira` (*được tin rằng*) và lời dẫn nhúng `āyasmā sāriputto` |
| `mn12:45.3–45.5` | bung ba `…pe…` thành *"cho đến bảy"* |
| `mn26:13.3`, `30.1` | bung `…pe…` thành văn |
| `dn33:2.2.29` | bịa dấu lược ở khoá cuối chuỗi năm giác quan, Pāli không có |
| `thag1.27:1.3` *(đã publish)* | lỗi gõ *"dẹp **lễ ra*** — sửa cho khớp `thag3.5` |

Một blocker là **chẩn đoán sai**: `mn12` bị ghi là *mất* `sayampaṭibhānaṁ`, nhưng nó đã có
(dạng *"quan điểm riêng"*); lỗi thật nhỏ hơn là *dựa trên* làm nó thành **cái căn cứ** thay
vì **cách phát biểu**. Đã sửa theo tiền lệ đã publish `mn76:27.2`.

## Còn lại, có blocker thật

| nhóm | số | vì sao chưa gỡ |
| --- | --- | --- |
| không có bản Anh đã ghim | 1.176 | xem mục đầu; cần quyết định của người biên tập |
| bản Việt thiếu khoá | 33 | tổng **6.533 khoá** chưa dịch; lớn nhất là `ja543` (814/815), `ja539` (762/763) |
| `kn/thig2.7` | 1 | tầng Anh đã ghim **lệch ở mức segment**: `1.1` mang nội dung của Pāli `2.2`, `1.4` mang nội dung của `1.1`. Lớp tham khảo hỏng; bản Việt đúng |
| `an/an10.70` | 1 | uddāna `13.1–13.4`: `Naḷakapāna` (`13.3`) không xuất hiện ở khoá nào khác, **0 tiền lệ**, nghĩa không suy ra được từ câu Pāli đang dùng |

## Sổ gap phải tái sinh, không sửa tay

`content/meta/reference-gaps.yaml` là **tệp sinh ra**. Ở giai đoạn trước PR này nó bị bỏ
quên: 13 bài ghi blocker *"chưa có entry trong reference-gaps.yaml"* trong khi coverage của
chúng đã đủ nhờ lớp lấp `english-project` **published** — tức gap đó **không còn cần**, và
blocker đã lỗi thời. Chạy `npm run reference:gaps` trên cây đích, không gõ tay.

## Cổng

`validate` · `test` · `check` · `build` · `quality:check` · `manifest:check` ·
`catalog:check` · `reference:gaps:check` · `license:check` · `audit:store` ·
`audit:reference` · `doctor:ci` — tất cả xanh.

`verify:store` còn báo `unresolved (Pāli resolves no segment): sn/sn12.93-213`. Tệp Pāli tên
bundle đó chứa khoá của 11 bài thành viên (`sn12.93-103`, `sn12.104-114`, …) và không khoá
nào mang tiền tố `sn12.93-213:`, nên `segmentMapForUid` trả rỗng. **Lỗi có sẵn từ trước PR
này, chưa ai sửa, và nằm ngoài phạm vi lượt này** — catalog và manifest không bị đụng.