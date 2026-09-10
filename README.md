# Kinh Tạng Pāli Việt

Nền tảng bản dịch Pāli → Việt theo **segment ID của SuttaCentral/Bilara**, xuất cùng một nguồn nội dung ra website, EPUB và PDF.

## Ưu tiên hiện tại

**Hoàn thiện Kinh Trung Bộ (Majjhima Nikāya, MN) trước.** Catalog đã dựng đủ `mn1` → `mn152`. Bốn bộ còn lại (`dn`, `sn`, `an`, `kn`) đã có cấu trúc website + content namespace để mở rộng nhưng chưa nhập corpus giả định.

MN118 (Ānāpānassatisutta) là vertical slice đầu tiên. Pāli được sync từ SuttaCentral ở exact pinned commit; bản dịch Việt canonical nằm ở segmented JSON và hiện để trống cho đến khi có nội dung được biên tập thực.

## Quick start

```bash
npm install
npm run dev
```

Build production:

```bash
npm run build
```

Kiểm tra dữ liệu:

```bash
npm run validate
npm test
```

Sync toàn bộ Pāli của Trung Bộ vào cache local:

```bash
npm run source:sync:mn
```

## Data model

```text
Pāli pinned upstream ─┐
Vietnamese JSON ──────┼─> CanonDocument[] ─> Astro / Pandoc
metadata YAML ────────┤
comment JSON ─────────┘
```

Canonical UID giữ nguyên theo SuttaCentral: `mn1`, `mn118`, `sn56.11`. Không zero-pad.

Canonical translation example:

```json
{
  "mn118:1.1": "..."
}
```

Không copy Pāli vào file dịch. Mọi alignment dùng segment ID.

## Repository map

- `content/catalog/sutta/`: catalog theo bộ kinh. MN có đủ 152 UID.
- `content/translation/vi/project/`: bản dịch Việt canonical.
- `content/meta/`: trạng thái và metadata biên tập.
- `content/comment/vi/project/`: chú thích theo segment.
- `source/suttacentral.lock.json`: exact upstream commit.
- `src/lib/canon/`: lớp domain compose dữ liệu.
- `src/pages/sutta/`: reader tĩnh.
- `books/` + `pandoc/`: publication manifests và defaults.
- `docs/architecture.md`: kiến trúc đã chốt.

## Editorial states

`draft → review → published`

- `draft`: được phép thiếu segment.
- `review`: phải đủ translation cho source đã pin.
- `published`: như `review`, đồng thời có translator/reviewer và ngày review.

Production sách chỉ lấy `published`.

## License

Code: MIT. Bản dịch mới của project: CC0-1.0 theo định hướng interoperability với SuttaCentral. Third-party material giữ license riêng.
