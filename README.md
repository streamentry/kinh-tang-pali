# Kinh Tạng Pāli Việt

Nền tảng bản dịch Pāli → Việt theo **segment ID của SuttaCentral/Bilara**, xuất cùng một nguồn nội dung ra website, EPUB và PDF.

🌐 **Đọc trực tuyến:** [https://streamentry.github.io/kinh-tang-pali/](https://streamentry.github.io/kinh-tang-pali/)

✍️ **Dự án & biên tập bản dịch:** Lê Việt Hồng (Cư Sĩ Chánh Niệm)  
🤖 **Hỗ trợ AI:** ChatGPT của OpenAI được sử dụng đáng kể trong quá trình tạo bản dịch đề xuất, đối chiếu nguồn, kiểm tra tính nhất quán và QA.  
📮 **Liên hệ / góp ý / hỗ trợ:** [tostreamentry@gmail.com](mailto:tostreamentry@gmail.com)

## Nguồn, credits và phương pháp dịch

Đây là **một bản dịch tiếng Việt mới của dự án**, được tạo bằng cách đối chiếu nhiều lớp nguồn. Dự án không coi một bản dịch trung gian hay AI là thẩm quyền cao hơn bản văn Pāli dùng làm nguồn chuẩn.

### 1. Bản văn Pāli làm nguồn chuẩn

Nguồn Pāli canonical của repository là **SuttaCentral/Bilara**, edition `pli/ms`, tức **Mahāsaṅgīti Tipiṭaka Buddhavasse 2500**. Snapshot cụ thể được pin trong [`source/suttacentral.lock.json`](source/suttacentral.lock.json), vì vậy mỗi segment có thể truy ngược về đúng upstream commit.

SuttaCentral mô tả Mahāsaṅgīti là một bản hiệu đính dựa trên văn bản Sixth Council/Vipassana Research Institute và được Dhamma Society of Bangkok rà soát với nhiều ấn bản. Vì lý do đó, repository gọi đây là **Pāli root text / bản văn Pāli làm nguồn chuẩn**, không tuyên bố đây là “nguyên bản lịch sử” hay bản văn chắc chắn đồng nhất tuyệt đối với lời truyền khẩu ban đầu.

- SuttaCentral methodology: https://suttacentral.net/methodology
- Bilara data: https://github.com/suttacentral/bilara-data

### 2. Bản dịch tiếng Anh trên SuttaCentral

Dự án tham khảo **các bản dịch tiếng Anh trên SuttaCentral**, ưu tiên bản của **Bhikkhu Sujato** khi có, để đối chiếu cách phân tích cú pháp, compound, thuật ngữ và sắc thái Pāli.

Không giả định toàn bộ Kinh tạng trên SuttaCentral do một dịch giả duy nhất thực hiện. Dịch giả/provenance phải được xác định theo từng collection hoặc từng bài khi cần.

### 3. Bản dịch tiếng Việt của Hòa thượng Thích Minh Châu

Dự án tham khảo **bản dịch Việt của Hòa thượng Thích Minh Châu** như một lớp đối chiếu quan trọng về truyền thống thuật ngữ Phật học Việt Nam, cách phân đoạn nghĩa và những cách dịch đã quen thuộc với độc giả Việt.

SuttaCentral/Bilara cũng ghi nhận corpus tiếng Việt của **Bhikkhu Thích Minh Châu** trong hệ thống provenance của họ:

- https://github.com/suttacentral/bilara-data/tree/published/translation/vi/phantuananh/sutta

Bản dịch mới của repository **không phải** bản chỉ thay từ, hiện đại hóa câu chữ hoặc sao chép lại bản Thích Minh Châu. Khi các bản tham khảo bất đồng, repository quay lại Pāli và context để quyết định.

### 4. Nguồn phụ trợ khi gặp điểm khó

Khi có ambiguity, vấn đề hình thái, compound hoặc thuật ngữ khó, dự án có thể dùng thêm:

- **Digital Pāḷi Dictionary (DPD)** của Bhikkhu Bodhirasa: https://www.dpdict.net/
- từ điển và ngữ pháp Pāli phù hợp;
- parallel passages trong chính Nikāya hoặc các nguồn kinh văn liên quan;
- tài liệu học thuật đáng tin cậy khi thực sự cần để phân xử.

Các nguồn này là **evidence phụ trợ**, không tự động quyết định wording canonical.

### 5. Vai trò của ChatGPT và giới hạn của AI

**ChatGPT của OpenAI được dùng như một công cụ biên dịch và QA**, bao gồm tạo các phương án dịch, so sánh Pāli/English/Vietnamese, phát hiện bất nhất, kiểm tra logic câu, terminology và hỗ trợ adversarial review.

Tuy nhiên:

- ChatGPT **không phải nguồn kinh điển** và không phải authority về Pāli.
- Nội dung AI tạo ra phải chịu cùng source hierarchy, validation và quality gate như mọi nội dung khác trong repository.
- Một trạng thái `published` nghĩa là bài đã vượt quality gate được mô tả trong [`AGENTS.md`](AGENTS.md); **không nên suy diễn rằng mọi segment đều đã được một học giả Pāli hoặc chuyên gia con người độc lập thẩm định**.
- Human review được hoan nghênh và khuyến khích, nhưng hiện không phải điều kiện bắt buộc để mọi bài đạt `published`.

### 6. Không có hàm ý bảo trợ hay chứng thực

Đây là **dự án độc lập**. Việc tham khảo hoặc ghi credit **không có nghĩa** SuttaCentral, Bhikkhu Sujato, Hòa thượng Thích Minh Châu, Digital Pāḷi Dictionary, Bhikkhu Bodhirasa hay OpenAI bảo trợ, phê duyệt, chứng thực hoặc chịu trách nhiệm cho bản dịch tiếng Việt mới của dự án.

Third-party material giữ license và quyền tác giả riêng của từng nguồn. Repository tránh copy nguyên văn dài từ các bản dịch tham khảo; provenance và license phải được tôn trọng ở từng lớp dữ liệu.

Nếu phát hiện lỗi dịch, vấn đề nguồn/provenance, hoặc muốn góp ý cho dự án, vui lòng liên hệ **[tostreamentry@gmail.com](mailto:tostreamentry@gmail.com)**.

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

## Kiểm định chất lượng DN/MN

[Xem kết quả review 12/09/2026](docs/reviews/2026-09-12-dn-mn/README.md): phạm vi đã đối chiếu toàn bài, các sửa lỗi có nguồn và danh sách còn cần review. Kiểm kê kỹ thuật không đồng nghĩa với chứng nhận chất lượng dịch.
