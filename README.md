# Kinh Tạng Pāli Việt

Nền tảng bản dịch Pāli → Việt theo **segment ID của SuttaCentral/Bilara**, xuất cùng một nguồn nội dung ra website, EPUB và PDF.

🌐 **Đọc trực tuyến:** [https://streamentry.github.io/kinh-tang-pali/](https://streamentry.github.io/kinh-tang-pali/)

📚 **Dự án liên quan:** [Hướng Đến Nhập Lưu](https://streamentry.github.io/streamentry/)

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

Bản Sujato được pin như một **tầng tham khảo** (`referenceEditions` trong [`source/suttacentral.lock.json`](source/suttacentral.lock.json)) cùng commit với Pāli root, và được audit ở mức từng segment.

Mọi bài kinh được đọc qua **một store năm tầng** khai báo trong [`source/layers.yaml`](source/layers.yaml): Pāli (authority) → English Sujato → English của dự án → Việt hiện hành của Hòa thượng Thích Minh Châu → Việt bản dịch mới.

```bash
npm run store -- mn118                              # đọc một bài qua toàn bộ store
npm run audit:store                                 # kiểm kê mọi tầng
npm run audit:reference                             # chi tiết coverage English
node --import tsx scripts/audit-reference.ts --all  # toàn bộ 3422 bài trong catalog
```

Chi tiết: [`docs/translation-store.md`](docs/translation-store.md).

### Kiểm chứng bằng code, không bằng mắt

Mọi khẳng định về corpus đều được **đếm và đối soát bằng code**, không suy ra từ việc file
"có tồn tại":

```bash
npm run source:sync:manifest   # tải đúng danh sách file của commit đã pin
npm run verify:store           # đối soát + đếm, exit 1 nếu lệch
npm run catalog:check          # catalog phải phủ hết snapshot đã pin
```

Nguồn sự thật là [`source/upstream-manifest.json`](source/upstream-manifest.json): git tree của
commit bilara đã pin, kèm **git object hash của từng file**. Nên `verify:store` không hỏi
"file có không" mà hỏi "có, và có đúng byte như bản pin không".

Báo cáo đầy đủ: [`docs/store-verification.json`](docs/store-verification.json).

Sujato để **trống** các blockquote và đoạn lược `…pe…`, nối câu qua chỗ trống, nên một số bài mất gần hết tầng tham khảo. Vì vậy repo đo **coverage** trên phần Pāli có nội dung, và một bài chỉ được đạt `review`/`published` khi coverage ≥ 80% **hoặc** khi mất mát đã được ghi nhận trong [`content/meta/reference-gaps.yaml`](content/meta/reference-gaps.yaml):

```bash
npm run reference:gaps         # sinh lại record
npm run reference:gaps:check   # CI: phát hiện record đã cũ
```

SuttaCentral không có bản Anh nào khác phủ được những đoạn đó, nên dự án **tự dịch** sang English ở tầng `english-project`. Đó là một bản dịch độc lập của dự án, không phải nguồn SuttaCentral, và không bao giờ ghi đè bản đã pin.

Bản Việt hiện hành của Hòa thượng Thích Minh Châu tại commit đang pin **chỉ có Pháp Cú**; các bài khác sẽ báo tầng này là `absent`, đó là đặc điểm của snapshot upstream chứ không phải thiếu sót của repo.

Không giả định toàn bộ Kinh tạng trên SuttaCentral do một dịch giả duy nhất thực hiện. Dịch giả/provenance phải được xác định theo từng collection hoặc từng bài khi cần. Tại commit đang pin, Sujato là bản Anh duy nhất phủ hết 5 Nikāya; các dịch giả Anh khác trên SuttaCentral chỉ phủ một phần.

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
- Một trạng thái `published` nghĩa là bài đã vượt quality gate được mô tả trong [`docs/quality-assessments.md`](docs/quality-assessments.md); **không nên suy diễn rằng mọi segment đều đã được một học giả Pāli hoặc chuyên gia con người độc lập thẩm định**.
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

Sync nguồn đã pin vào cache local (Pāli root **và** các tầng tham khảo):

```bash
npm run source:sync:used      # các bài đã có bản dịch trong dự án (dev/build tự chạy)
npm run source:sync:all       # mọi bài trong 5 catalog
npm run source:sync:manifest  # mọi file của mọi edition trong commit đã pin (10.081 file)
```

Làm mới manifest khi bổ sung edition hoặc đổi commit pin:

```bash
npm run manifest:fetch        # ghi source/upstream-manifest.json
npm run manifest:check        # CI: manifest đã cũ thì fail
npm run catalog:import        # nhập snapshot chuẩn vào catalog (idempotent)
npm run catalog:check         # CI: catalog phải phủ 100% snapshot
```

Kiểm tra tầng English:

```bash
npm run audit:reference
npm run reference:gaps:check
```

Đọc một bài qua toàn bộ store:

```bash
npm run store -- mn118
```

## Nguồn, giấy phép và ghi công

Trang [`/credits/`](https://streamentry.github.io/kinh-tang-pali/credits/) dựng từ lock và
manifest, nên không thể lệch với thứ store thực sự giữ. Tồn tại vì SuttaCentral yêu cầu:
*"Ghi rõ nguồn gốc xuất xứ"* (trang giấy phép tiếng Việt của họ, `licensing:10`).

- **Pāli** — phạm vi công cộng.
- **English (Bhikkhu Sujato)** và **Việt hiện hành (HT. Thích Minh Châu)** — nhóm "tác phẩm
  của bên thứ ba": bản quyền thuộc dịch giả, dùng theo giấy phép của tác giả. Tại commit đã
  ghim, bilara không kèm trường giấy phép máy đọc được cho hai bản đó, nên ta ghi
  `NOASSERTION` thay vì đoán.
- **Công cụ hỗ trợ** khai trong `source/tooling.yaml`, mọi trang đọc từ đó: ChatGPT ·
  GPT-5.6 Sol · GPT-6 Astra Pro (OpenAI) và Space Bunny · Muse Spark 1.3 Free (OpenCode).
  Không sửa attribution lịch sử của những bài đã dịch bằng công cụ cũ.

**[`NOTICE`](NOTICE)** là bản đầy đủ: ai giữ bản quyền từng bản, điều khoản nào, ai là người
tuyên bố điều khoản đó, và ai SuttaCentral ghi công cho công việc tiếng Việt. Nó được **sinh tự
động** từ `source/suttacentral.lock.json`, và `npm run license:check` (chạy trong CI) fail
nếu nó lệch. Trên website: [`/notice.txt`](https://streamentry.github.io/kinh-tang-pali/notice.txt).

Lưu ý phân tách điều khoản, vì dễ đọc nhầm: **code** của dự án theo MIT (`LICENSE`), còn **bản
dịch** theo CC0-1.0. Điều khoản CC0 ấy **chỉ** phủ phần dự án tự làm — Pāli vốn đã phạm vi
cộng cộng, còn bản Anh của Sujato và bản Việt của Thích Minh Châu vẫn thuộc bản quyền dịch giả
và không được CC0 của chúng ta phủ tới.

## Bốn bản để đối chiếu

Trang bài kinh hiện bốn bản cạnh nhau, theo từng segment:

| cột | vai trò |
| --- | --- |
| Pāli | **nguồn chuẩn** quyết định nghĩa |
| English | tham khảo (Sujato; chỗ Sujato im lặng thì bù bằng bản lấp của dự án, có gắn nhãn riêng) |
| Việt hiện hành | tham khảo (HT. Thích Minh Châu) |
| Việt dự án | **bản canonical** của dự án |

Một bản vắng mặt nói rõ lý do thay vì để trống: bản chụp đã pin không có bản dịch cho bài
này (giới hạn của upstream), hay bài này có nhưng tệp chưa tải về cache (trạng thái
local). 1.596 bài `kn` rơi vào trường hợp đầu, nên đây là chuyện thường gặp chứ không
phải lỗi.

Màn hình rộng hiện cả bốn cột, nhưng cột không có nội dung nào thì thu gọn. Màn hình hẹp
hiện một cột mỗi lần, chọn bằng nút tập trung; tắt JavaScript thì cả bốn cột xếp chồng
và vẫn đọc được. Tìm kiếm index cả bốn bản và cho lọc theo bản.

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
- `content/translation/en/project/`: bản lấp English của dự án cho đoạn Sujato chưa dịch.
- `content/meta/reference-gaps.yaml`: các bài đã ghi nhận mất tầng English tham khảo.
- `source/layers.yaml`: registry của store nhiều tầng.
- `source/suttacentral.lock.json`: exact upstream commit + các tầng tham khảo đã pin.
- `source/upstream-manifest.json`: danh sách file + git hash của từng edition tại commit đã pin.
- `source/tooling.yaml`: khai báo duy nhất các công cụ hỗ trợ (mọi trang đọc từ đây).
- `src/lib/canon/`: lớp domain compose dữ liệu.
  - `document.ts` — dựng bốn bản để đối chiếu (Pāli · English · Việt hiện hành · Việt dự án).
  - `manifest.ts` — đọc manifest đã pin để phân biệt "bản chụp không có bản dịch" với "chưa tải về cache".
- `src/pages/sutta/`: reader tĩnh, bốn bản theo segment.
- `books/` + `pandoc/`: publication manifests và defaults.
- `docs/architecture.md`: kiến trúc đã chốt.
- `docs/translation-store.md`: store nhiều tầng, số đo coverage, hàng đợi lấp English.
- `docs/store-verification.json`: số đếm và đối soát của commit đang pin.
- `docs/english-reference-audit-2026-09-27.md`: kết quả kiểm kê tầng English SuttaCentral.

## Editorial states

`draft → review → published`

- `draft`: được phép thiếu segment.
- `review`: phải đủ translation cho source đã pin **và** phải có tầng English tham khảo đã pin với coverage ≥ 80%, hoặc gap đã được ghi nhận.
- `published`: như `review`, đồng thời có translator/reviewer và ngày review.

Production sách chỉ lấy `published`.

## License

Code: MIT. Bản dịch mới của project: CC0-1.0 theo định hướng interoperability với SuttaCentral. Third-party material giữ license riêng.

## Kiểm định chất lượng DN/MN

[Xem kết quả review 12/09/2026](docs/reviews/2026-09-12-dn-mn/README.md): phạm vi đã đối chiếu toàn bài, các sửa lỗi có nguồn và danh sách còn cần review. Kiểm kê kỹ thuật không đồng nghĩa với chứng nhận chất lượng dịch.
