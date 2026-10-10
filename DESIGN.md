# Thiết kế Kinh Tạng Pāli Việt

Chuẩn giao diện của repository, lập ngày 2026-10-10. Đọc tài liệu này trước khi sửa
trang, component, CSS, điều hướng hoặc hành vi đọc. Chuẩn dịch và provenance trong
`skill/translation.md` cùng các invariants của `AGENTS.md` luôn có ưu tiên cao hơn
một lựa chọn trình bày.

## 1. Mục đích và hướng thiết kế

Đây là thư viện kinh văn và công cụ đối chiếu, phục vụ người đọc lâu, người tra cứu
thuật ngữ và người kiểm chứng bản dịch. Giao diện cần thanh nhã, tinh tế và khiêm
tốn: dễ vào bài, đọc được lâu, biết rõ mình đang đọc bản nào. Kinh văn là trung tâm.
Không dùng hiệu ứng hoặc hình ảnh để tạo cảm giác uy quyền tâm linh.

Ngôn ngữ thị giác: thư viện biên tập đương đại; chữ serif có nhịp thoáng, điều hướng
sans nhỏ gọn, nền sáng hơi xanh, nét phân cách mảnh, xanh lá trầm cho hành động.
Nét đẹp đến từ tỷ lệ chữ, khoảng trắng và sự nhất quán, không từ trang trí.

- `DESIGN_VARIANCE: 3`: bố cục ổn định; trang chủ có phân cấp ưu tiên Trung Bộ.
- `MOTION_INTENSITY: 1`: chỉ phản hồi tương tác; không có chuyển động tự chạy.
- `VISUAL_DENSITY: 4`: mục lục gọn; kinh văn thoáng; metadata có thể mở khi cần.
- Một theme sáng cho toàn site. Chưa triển khai dark mode; không đưa từng khối tối
  vào trang sáng, không tự đảo màu theo hệ điều hành khi chưa kiểm tra đủ mọi lớp.
- Không thêm ảnh trang trí, tượng Phật, chân dung, hoa sen hay họa tiết thiêng chỉ để
  làm đầy bố cục. Lời tri ân giữ nguyên giọng của người biên tập và nằm trước phần nguồn.

## 2. Cơ sở kỹ thuật đang áp dụng trong năm 2026

Không có một “chuẩn thẩm mỹ 2026” duy nhất. Đây là hệ thiết kế riêng của dự án,
không phải bản triển khai Material, Fluent, Liquid Glass hay một chứng nhận WCAG.
Nền tảng có thể kiểm chứng:

- [DTCG Format 2025.10](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/):
  định dạng token ổn định của W3C Community Group; **không phải W3C Recommendation**.
  Dự án dùng `$type` / `$value`, màu `srgb`, dimension và font family theo định dạng đó.
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/): lấy AA làm mục tiêu tiếp cận,
  kiểm contrast, bàn phím, zoom, reflow và trạng thái có tên. Không tuyên bố toàn bộ
  site đạt chứng nhận chỉ từ unit tests hoặc một lần chụp màn hình.
- [Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html),
  [Target size minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html),
  [Focus not obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html).
  Điều khiển độc lập của dự án dùng chiều cao ít nhất 44px; đây là lựa chọn rộng hơn
  mức tối thiểu 24px của 2.5.8, không phải mô tả sai ngưỡng AA.

Giữ Astro và CSS thuần. Không thêm framework UI, thư viện animation hoặc runtime
client để đạt một hiệu ứng vốn làm được bằng HTML/CSS. Progressive enhancement:
kinh văn, nguồn, giấy phép và lịch sử chất lượng có mặt trong HTML trước JavaScript.

## 3. Nguồn chuẩn và cách thay đổi

| Tệp | Trách nhiệm |
| --- | --- |
| `source/design-tokens.json` | Giá trị chuẩn duy nhất của màu, khoảng cách, radius, font, measure, duration |
| `scripts/design-tokens.mjs` | Sinh CSS và kiểm sự đồng nhất với registry |
| `public/styles/tokens.css` | CSS sinh tự động; không chỉnh tay |
| `public/styles/fonts.css` | Font tự lưu trữ và unicode range |
| `public/styles/global.css` | Reset, shell, component, responsive, reduced motion và print |
| `src/layouts/Base.astro` | Điều hướng, skip link, metadata và footer chung |
| `public/fonts/` | WOFF2 cùng giấy phép SIL OFL và provenance phiên bản |

Sửa registry → `npm run design:generate` → `npm run design:check`.
CI kiểm generated CSS khớp byte-for-byte. Mọi component dùng semantic token;
không viết hex, font stack hoặc palette riêng vào style cục bộ. Không chồng một
stylesheet “v2 overrides” lên kiểu cũ. Sửa component tại nguồn chung.
Favicon là wordmark P nhỏ, dùng cùng palette; không là biểu tượng tôn giáo.

## 4. Token và màu

| Token | Giá trị | Vai trò |
| --- | --- | --- |
| `--paper` | `#f9faf7` | Nền site |
| `--surface` | `#ffffff` | Input, bảng, vùng cần nền riêng |
| `--surface-soft` | `#f0f3ed` | Tóm tắt và phản hồi hover nhẹ |
| `--ink` | `#26352d` | Chữ kinh và tiêu đề |
| `--muted` | `#59675e` | Chữ phụ vẫn phải đọc được |
| `--line` | `#d8dfd6` | Phân cách cấu trúc; không dùng làm viền duy nhất của input |
| `--control-border` | `#849488` | Viền điều khiển có contrast riêng |
| `--accent` | `#355c46` | Liên kết, hành động, focus |
| `--accent-hover` | `#254733` | Hover hành động chính |
| `--accent-soft` | `#e7eee5` | Trung Bộ ưu tiên và bản của dự án |
| `--warning` | `#735521` | Draft, gap, chưa nghe duyệt |
| `--warning-soft` | `#f5efe2` | Nền cảnh báo |
| `--reference` | `#56636b` | Chữ bản tham khảo |
| `--reference-soft` | `#edf0f2` | Nhãn tham khảo |

Màu trạng thái là ngữ nghĩa, không phải accent trang trí thứ hai. Không giảm opacity
của văn bản thiết yếu. Nhãn chữ phải giải thích trạng thái; màu không tự mang nghĩa.
Contrast chữ thường tối thiểu 4.5:1; viền input và focus 3:1 trên nền kề. Viền phân
cách thuần trang trí không mang yêu cầu contrast của một điều khiển.

## 5. Typography

**Noto Serif** dùng cho tiêu đề, kinh văn, Pāli và bản Việt nguyên bài. Bộ chữ hỗ trợ
Vietnamese và Latin extended, gồm dấu Pāli; giọng nghiêm túc của một ấn bản, không
mô phỏng thư pháp. **Be Vietnam Pro** dùng cho điều hướng, thao tác, nguồn và metadata.
`ui-monospace` chỉ dành cho UID, hash và code.

Font tự lưu trữ từ Fontsource 5.3.0, dùng `font-display: swap`; không gọi Google Fonts
khi người đọc tải trang. Chỉ tải subset có ký tự được dùng. Font giữ giấy phép SIL
OFL riêng; không thuộc CC0 của bản dịch. Xem `public/fonts/README.md` và hai notice OFL.

| Thành phần | Size | Line-height | Weight |
| --- | --- | --- | --- |
| Trang chủ H1 | 2.5–4.25rem fluid | 1.3 | serif 400 |
| H1 trang khác | 2.25–3.75rem fluid | 1.3 | serif 400 |
| H2 | 1.5–2.1rem | 1.4 | serif 400 |
| Kinh văn, chế độ Chỉ Việt | 1.1875rem desktop, 1.125rem phone | 1.95 | serif 400 |
| Các cột đối chiếu | 1.0625rem | 1.9 | serif 400 |
| Giao diện và chú giải | .8125–1rem | 1.7–1.85 | sans 400 / 600 |
| Nhãn rất ngắn, metadata | .625–.75rem | ≥1.6 | sans 400 / 600 |

Không dùng chữ nhỏ cho chỉ dẫn dài hoặc kinh văn. Không letter-spacing âm vào body
hoặc cắt dấu tiếng Việt bằng line-height quá sát. Không in hoa cả câu; eyebrow ngắn
được phép. Không đặt font-size theo `vw` đơn thuần: dùng `clamp` có sàn `rem`.
Chiều rộng đọc Việt tối đa `--reading-measure: 43rem`; lede khoảng 62ch.

## 6. Bố cục, khoảng cách và hình khối

- Measure site: 76rem; padding hai bên 1.25–3rem. Trang tìm kiếm hẹp hơn (62rem).
- Thang khoảng cách: .25, .5, .75, 1, 1.5, 2, 3, 4, 6rem.
- Radius: .25rem cho điều khiển / nhãn; .5rem cho nhóm chức năng. Không pill tùy tiện.
- Không shadow và gradient trang trí. Nền đặc giữ contrast ổn định.
- Homepage: hero chữ vừa đủ đọc trong màn hình laptop → thư viện năm bộ → tri ân →
  nguồn / phương pháp → danh sách công cụ mở theo yêu cầu → minh bạch / liên hệ.
- Trung Bộ xuất hiện đầu tiên và có nền ưu tiên nhẹ; bốn bộ còn lại là directory
  hai cột desktop, một cột mobile. Số liệu lấy từ `collectionProgress`, không viết tay.
- Footer chia liên kết hữu ích và attribution thành hai lớp dễ đọc; giữ nội dung
  nguồn / dịch giả / giấy phép thật, không bỏ sự thật để có footer ngắn.

## 7. Component và trạng thái

**Điều hướng.** Logo chữ về trang chủ; links chính có `aria-current="page"` khi khớp
trang. Skip link đến `#main-content`; mỗi trang có một main focusable. Không giấu
links cần thiết vào menu chỉ dùng JavaScript. Header không sticky; toolbar reader
mới sticky trên desktop.

**Button / input.** Cao ≥44px, font kế thừa, góc .25rem. Một primary xanh trầm cho
hành động chính. Hành động phụ có thể là link; không biến mọi link thành button.
Mọi trạng thái hover, active, focus phải nhìn thấy; focus 2px với offset 4px. Không
outline:none cho điều khiển. Trường tìm kiếm có label thật, không chỉ placeholder.

**Disclosure.** Dùng `details/summary` native cho nguồn, toàn văn và lịch sử đánh giá.
Không triển khai accordion bằng div. Collapsed không đồng nghĩa dữ liệu bị bỏ khỏi
HTML. Nhóm công cụ trên homepage mặc định gọn; người đọc vẫn mở được toàn bộ credit.

**Mục lục.** UID nhỏ, tên bài serif, trạng thái nhãn chữ. Trên điện thoại, trạng thái
xuống hàng dưới tên; UID không đẩy tên ra khỏi màn hình. Hit area là cả hàng.

**Bảng.** Bảng nguồn / rubric dài đặt trong vùng scroll có tên và `tabindex="0"`,
để bàn phím có thể cuộn ngang mà không gây overflow toàn trang. Giữ `th` và scope.
Không đổi dữ liệu thành ảnh hoặc cắt nội dung ở mobile.

**Tìm kiếm.** Giữ cả bốn bản trong index và bộ lọc; loading, không có kết quả, chọn
rỗng và lỗi đều có status `aria-live`. Thông báo cho người đọc bằng tiếng Việt;
không hướng người đọc chạy lệnh build. Không bịa kết quả hoặc thống kê.

**Audio.** Cùng palette / radius / control height. Nhãn đang chờ nghe duyệt còn rõ.
Giữ native player fallback, playback controls, profile và dữ liệu audio đã duyệt.
Thiết kế không cấp phép đổi giọng, nhịp, model, nội dung hay trạng thái nghe duyệt.

## 8. Reader: invariants thiết kế

Đây là contract nội dung, không được hy sinh để “đẹp”:

1. Pāli là authority; English và Việt hiện hành là reference; Việt 2026 là bản dự án.
   Legend có nhãn chữ, attribution, coverage và lý do vắng. Gap và bản vắng là hai việc khác nhau.
2. Giữ nguyên UID, segment ID, anchors, `data-column`, `data-pagefind-*`, nhãn nguồn
   của bản lấp English và mọi trạng thái. Không chỉnh text translation khi redesign.
3. Chỉ Việt mặc định khi có bản Việt dự án: một cột Việt có measure đọc; các bản khác
   vẫn trong DOM. Bài chưa có bản Việt dự án mở ở mode Bốn bản để Pāli vẫn đọc được.
4. Đối chiếu: các lớp xếp theo từng segment, không căn lại HTML nguyên bài.
5. Bốn bản desktop dùng grid theo `data-open-columns`; dưới 1100px chọn một bản bằng
   tabs, dưới 760px UID nằm trên nội dung. Nếu chưa có JS, nội dung vẫn đọc được.
6. Selector `data-closed` với `.segments` phải thắng các mode rules ở mọi breakpoint;
   bản thiếu cả bài không được hiện lại thành cột giả có nội dung.
7. Việt hiện hành nguyên bài luôn ở mục Tra cứu toàn văn **sau** bảng segment.
   Không đưa lên đầu, không chia đoạn tự động, không đưa vào cột.
8. Summary có nền / nhãn riêng; không dùng typography để làm nó giống kinh văn.
9. Print bỏ shell và controls, ghi nhãn các bản. Sách/EPUB vẫn do pipeline riêng tạo
   và chỉ lấy Pāli + Việt dự án; CSS không thay contract xuất bản.

## 9. Responsive, chuyển động và kiểm chứng

Breakpoint chính 760px cho shell / list / reading; 1100px cho bốn cột đối chiếu.
Dùng `minmax(0, 1fr)`, overflow-wrap cho UID và nguồn dài; không che lỗi overflow bằng
`body { overflow-x: hidden }`. Tại 320px và zoom 200%, shell và kinh văn reflow;
chỉ bảng dữ liệu dài có scroll ngang trong container.

Không auto-reveal, parallax, con trỏ custom, chuyển động lặp, scroll hijack hay blur
sau kinh văn. Transition trạng thái 160ms; `prefers-reduced-motion` loại bỏ chuyển
động. `forced-colors` giữ border của control. Focus không bị toolbar che; toolbar
không sticky trên phone.

Trước khi hoàn tất:

```bash
npm run design:check
npm run validate
npm test
npm run check
npm run build
npm run seo:check
```

Kiểm tra browser thực tế ở 1440px, 1024px, 390px và 320px: trang chủ, mục lục, tìm
kiếm (có / rỗng / lỗi hoặc chưa chọn), trang nguồn, trang chất lượng, MN1 có audio,
và một bài chỉ có Pāli hoặc chưa có bản dự án. Thử cả ba mode và tab, mở legend,
whole-text lookup và rubric, keyboard focus / skip link, font dấu Việt/Pāli,
reduced motion và vùng scroll bảng. Chụp desktop / mobile làm bằng chứng review.
Unit test contrast/token không thay thế kiểm tra browser hay semantic audit bản dịch.

Sau push: chờ CI của đúng head, tạo PR, merge khi được người dùng yêu cầu và đọc lại
remote main. Ghi rõ local, CI và live deployment là ba lớp chứng cứ khác nhau.
