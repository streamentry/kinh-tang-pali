# Nhận diện Pāli Folio

Dấu nhận diện của Kinh Tạng Pāli Việt, thiết kế ngày 2026-10-10. Mục tiêu là một
dấu biên tập có thể dùng lâu dài: rõ ở tab nhỏ, thanh nhã cạnh kinh văn và dễ tái
sử dụng trong ấn phẩm. Đây là thiết kế mới của dự án, không phải biểu tượng cổ hay
dấu chứng nhận của một truyền thống Phật giáo.

## Ý tưởng và hình học

Chữ **P** gợi Pāli. Nét đứng có chân serif như gáy một cuốn sách; phần cong bên
phải là trang mở. Khe trắng giữa hai phần là chi tiết nhận diện, đồng thời gợi
việc đặt văn bản cạnh nhau để đối chiếu. Đó là ý đồ thiết kế, không phải một ý
nghĩa lịch sử hay giáo lý được gán cho chữ P.

Hai path trong `source/brand-mark.json` là nguồn hình học duy nhất. Không dùng
ký tự font làm dấu: hình không đổi theo hệ điều hành, không cần tải font và vẫn
rõ khi thu nhỏ. Tên đầy đủ trên website giữ nguyên chữ thật **Kinh Tạng Pāli Việt**
với Noto Serif; dòng phụ dùng Be Vietnam Pro theo `DESIGN.md`.

## Sử dụng

- Header: dấu 48px, tên thư viện và dòng phụ; cả cụm là một liên kết về trang chủ.
- Footer: dấu 32px cạnh tên thư viện. Dấu chỉ trang trí, không lặp tên với screen reader.
- Logo độc lập: `public/logo.svg`, nền trong suốt, màu `accent` từ registry.
- Tab: `public/favicon.svg`, chữ trắng trên xanh `accent`, có nền và khoảng thở.
  `favicon.ico` chứa 16/32px; `favicon-32.png` là fallback.
- iOS: `public/apple-touch-icon.png`, 180px, nền đặc; hệ điều hành tự cắt góc.

Giữ tỷ lệ 1:1 và khe giữa hai phần. Không kéo giãn, ghép thêm hoa sen/bánh xe/hào
quang, phủ texture, gradient hoặc shadow. Khi dùng dấu độc lập ngoài header,
để khoảng trống tối thiểu bằng 1/8 chiều rộng hộp SVG quanh dấu.

## Sinh và kiểm tra

```bash
npm run design:generate
npm run design:check
```

Màu lấy từ `source/design-tokens.json`. SVG được đối chiếu trực tiếp với registry;
`source/brand-raster.lock.json` lưu hash của SVG nguồn và từng file raster. Vì các
encoder có thể khác giữa hệ điều hành, CI kiểm các file đã ghim thay vì tự render
rồi so byte. Khi đổi hình hoặc màu, sinh lại toàn bộ bằng cùng một lệnh; không sửa
tay các asset đã sinh. Renderer dùng Sharp đã có trong pipeline ảnh của Astro.

Trước khi phát hành, xem dấu ở 16/32px và header/footer ở 1440, 1024, 390, 320px;
kiểm focus, chữ có dấu, đường dẫn có base `/kinh-tang-pali/` và cả nền sáng lẫn
favicon đảo màu. Chỉ coi đây là kiểm tra nhận diện và giao diện, không là QC kinh văn.
