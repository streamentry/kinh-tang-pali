# Translation Skill — Pāli → Tiếng Việt

> **Phạm vi bắt buộc:** áp dụng cho mọi tác vụ dịch, sửa bản dịch, review bản dịch, chọn thuật ngữ, viết chú thích và quyết định trạng thái xuất bản trong repository này.
>
> **Mục tiêu:** tạo một bản dịch Kinh tạng Pāli tiếng Việt mới **chính xác tối đa, truy nguyên rõ ràng và dễ hiểu hơn đối với người Việt hiện đại**. Phương pháp mặc định là **đối chiếu Pāli gốc + bản dịch tiếng Anh chất lượng cao trên SuttaCentral + bản dịch Hòa thượng Thích Minh Châu**, sau đó viết một bản tiếng Việt mới, sáng rõ hơn nhưng không thêm hoặc bớt nghĩa của kinh.

`AGENTS.md` định nghĩa quality scorecard 10 tiêu chí, blocking errors và ngưỡng `draft` / `review` / `published`. Skill này và `AGENTS.md` phải được đọc cùng nhau. Nếu có xung đột về publication gate, **rule mới nhất trong `AGENTS.md` thắng**.

---

## 1. Mục tiêu tối thượng

Bản dịch phải đồng thời đạt bốn mục tiêu, theo thứ tự ưu tiên:

1. **Đúng nghĩa kinh điển.** Mọi ý trong câu Việt phải có căn cứ từ Pāli; không tự thêm giải thích, nhân quả, tâm lý, giáo lý hay kết luận mà nguyên văn không nói.
2. **Có thể truy nguồn.** Mọi câu/đoạn Việt gắn với đúng canonical segment ID của SuttaCentral/Bilara để có thể quay về nguyên văn Pāli.
3. **Dễ hiểu với người Việt hiện đại.** Giảm cấu trúc cổ, câu tối nghĩa và Hán–Việt không cần thiết.
4. **Súc tích và giữ được ngôn ngữ Phật học khi hữu ích.** Hán–Việt vẫn được dùng khi nó chính xác, quen thuộc hoặc cô đọng hơn cách diễn đạt dài dòng bằng từ thuần Việt.

Không đánh đổi độ chính xác để lấy sự dễ đọc. Nhưng cũng không lấy “sát chữ” làm lý do cho một câu tiếng Việt khó hiểu.

Câu hỏi cuối cùng cho mỗi segment:

> **Người Việt hiện đại có hiểu đúng điều đoạn Pāli này đang nói không, và mọi chi tiết quan trọng có thể lần ngược về đúng segment nguồn không?**

---

## 2. Phương pháp dịch: tam giác đối chiếu

Mỗi bài kinh được dịch bằng cách **triangulate**, không dựa duy nhất vào một bản dịch trung gian.

Ba lớp tham khảo mặc định:

1. **Pāli root trên SuttaCentral/Bilara** — nguồn có thẩm quyền cuối cùng.
2. **Bản dịch tiếng Anh chất lượng cao trên SuttaCentral** — giúp thấy cách các dịch giả hiện đại parse cú pháp, compound và sắc thái Pāli.
3. **Bản dịch Hòa thượng Thích Minh Châu** — giúp đối chiếu truyền thống thuật ngữ tiếng Việt và phát hiện những điểm đã quen thuộc với độc giả Việt.

Sau khi đọc cả ba, người dịch **viết một bản tiếng Việt mới từ sự hiểu biết đã được đối chiếu**, không đơn thuần sửa chữ trên một bản có sẵn.

### Vai trò của từng nguồn

**Pāli:** quyết định nghĩa cuối cùng khi các bản dịch bất đồng.

**English SuttaCentral:** là reference quan trọng để hiểu cú pháp và cách diễn đạt hiện đại, nhưng không được dịch máy móc English → Vietnamese nếu cách đó làm lệch Pāli.

**Thích Minh Châu:** là reference quan trọng về truyền thống dịch thuật Việt Nam, thuật ngữ và cách hiểu lịch sử. Có thể giữ lại các thuật ngữ hoặc cách diễn đạt đã tốt, chính xác và súc tích; không cần cố tình đổi chỉ để tạo cảm giác “bản mới”.

### Không được làm

- Không coi bất kỳ bản tiếng Anh hay bản tiếng Việt nào là authority cao hơn Pāli root.
- Không chỉ dịch English → Vietnamese rồi bỏ qua Pāli.
- Không copy nguyên văn dài hoặc paraphrase máy móc một bản dịch có sẵn rồi gọi đó là bản dịch mới.
- Không cố dịch khác Hòa thượng Thích Minh Châu chỉ vì muốn khác.
- Không tự thêm nội dung để “giải thích cho dễ hiểu”; phần giải thích thuộc glossary/comment.

Mục tiêu là **đúng hơn, rõ hơn và dễ đọc hơn**, không phải khác hơn.

---

## 3. Thứ bậc nguồn và bằng chứng

### 3.1. Authority

Nguồn gốc chuẩn là **Pāli root trong snapshot SuttaCentral/Bilara được pin bởi `source/suttacentral.lock.json`**.

Canonical translation phải dùng đúng segment ID, ví dụ:

```json
{
  "mn118:1.1": "..."
}
```

Không tự sửa UID, segment ID, thứ tự hoặc ranh giới segment.

### 3.2. Evidence hierarchy

Khi cần quyết định nghĩa, ưu tiên:

1. **Pāli root đã pin**: từ ngữ, hình thái, cú pháp, phủ định, số lượng, case, compound, particles, quan hệ mệnh đề.
2. **Ngữ cảnh của chính bài kinh và các Pāli parallels / formula tương đồng**.
3. **Các bản dịch English trên SuttaCentral**, ưu tiên bản có provenance/dịch giả rõ ràng; với chỗ khó có thể so nhiều bản English.
4. **Bản Hòa thượng Thích Minh Châu**, đặc biệt để đối chiếu thuật ngữ và truyền thống dịch Việt.
5. **Từ điển, ngữ pháp Pāli, chú giải/parallels và tài liệu học thuật đáng tin cậy** khi có ambiguity hoặc disagreement.

Các bản dịch là **evidence về cách hiểu**, không phải bằng chứng cuối cùng rằng Pāli chắc chắn có nghĩa như vậy.

Khi English và Thích Minh Châu giống nhau nhưng Pāli không hỗ trợ rõ, không tự động chọn theo số đông. Khi chúng khác nhau, quay lại Pāli để xác định nguyên nhân.

### 3.3. Khi chưa chắc chắn

Nếu có hai cách hiểu thực sự hợp lý:

- chọn cách ít giả định và bám Pāli nhất cho canonical text;
- ghi alternative reading và lý do ở comment theo đúng segment ID;
- không làm câu Việt chắc chắn hơn mức Pāli cho phép;
- nếu ambiguity có thể làm thay đổi đáng kể giáo nghĩa mà chưa thể bảo vệ canonical wording, đó là **blocking error** và bài phải giữ `draft` cho đến khi xử lý.

---

## 4. “Dễ hiểu” nghĩa là gì

Dễ hiểu **không phải diễn nghĩa tự do**. Dễ hiểu đến từ việc viết tiếng Việt tốt hơn.

Ưu tiên:

- câu Việt tự nhiên thay cho calque cú pháp Pāli hoặc văn dịch cổ;
- làm rõ chủ thể khi context xác định được;
- tách câu dài khi không phá logic;
- dùng động từ và cấu trúc trực tiếp thay cho danh từ hóa nặng;
- giảm những từ Hán–Việt hiếm, cổ hoặc không thêm độ chính xác;
- dấu câu và paragraph giúp lộ rõ logic, danh sách và lời thoại;
- giữ repetition khi nó mang cấu trúc hoặc nhấn nghĩa.

Tránh:

- thêm giải thích vào lời kinh;
- bỏ điều kiện, phủ định, giới hạn, mức độ hoặc repetition vì thấy “rườm rà”;
- dùng từ hiện đại nhưng hẹp nghĩa hơn Pāli;
- biến description thành prescription;
- biến possibility thành certainty;
- thêm quan hệ nhân quả hoặc động cơ mà Pāli không nói.

---

## 5. Quy tắc Hán–Việt: dùng có chủ ý

**Không đặt mục tiêu “càng ít Hán–Việt càng tốt”.** Mục tiêu là **ít tối nghĩa hơn nhưng vẫn chính xác và súc tích**.

Giữ Hán–Việt khi:

- là thuật ngữ Phật học quen thuộc và có nghĩa kỹ thuật rõ, ví dụ `vô thường`, `tham`, `sân`, `niệm`, `định`, `giới`, `thọ`, `tưởng`;
- ngắn gọn và rõ hơn một cụm thuần Việt dài;
- thay bằng từ phổ thông sẽ làm mất distinction kỹ thuật;
- cách dịch đã trở thành ngôn ngữ chuẩn mà độc giả Phật học Việt Nam dễ nhận ra.

Ưu tiên từ Việt phổ thông khi:

- từ Hán–Việt là cổ, khó hiểu hoặc chỉ làm câu “có vẻ kinh điển”;
- nghĩa không mang tải kỹ thuật;
- có một cách nói hiện đại ngắn, tự nhiên và chính xác tương đương.

Khi một thuật ngữ kỹ thuật cần giữ nhưng có thể khó cho người mới, **giữ thuật ngữ trong canonical text và giải thích bằng glossary/comment**.

Hán–Việt là công cụ nén nghĩa, không phải phong cách trang trí.

---

## 6. Không làm phẳng thuật ngữ Phật học

Các từ như `dukkha`, `saṅkhāra`, `sati`, `samādhi`, `viññāṇa`, `taṇhā`, `upādāna`, `nibbāna` có trường nghĩa phụ thuộc ngữ cảnh.

Vì vậy:

- không áp mapping 1:1 máy móc cho mọi occurrence;
- dùng `content/glossary/pali-vi.yaml` như memory/QA aid, không như luật bất biến;
- đối chiếu cách English SuttaCentral và Thích Minh Châu xử lý cùng thuật ngữ;
- chọn cách Việt vừa đúng context vừa giữ distinction cần thiết;
- cập nhật glossary khi có lựa chọn thuật ngữ quan trọng;
- nội dung từ chú giải hoặc truyền thống hậu kỳ không được lén nhập vào lời kinh nếu root Pāli không nói.

---

## 7. Quy trình bắt buộc cho mỗi bài

### Bước 1 — Xác nhận provenance

- xác nhận đúng `uid`;
- đọc `source/suttacentral.lock.json`;
- sync đúng pinned Pāli source;
- xác nhận segment IDs;
- xác định bản English SuttaCentral sẽ tham khảo và dịch giả/source của nó khi có;
- xác định đúng bản Thích Minh Châu dùng để đối chiếu.

### Bước 2 — Đọc toàn bài và context

Trước khi tối ưu từng segment, hiểu:

- ai nói với ai;
- speaker và quotation nesting;
- cấu trúc lập luận;
- các danh sách/formula/repetition;
- antecedent của đại từ và ellipsis;
- thuật ngữ nào đang được định nghĩa theo context.

### Bước 3 — Đối chiếu từng segment

Với mỗi segment, đặt cạnh nhau:

- **Pāli**;
- **English SuttaCentral**;
- **Thích Minh Châu**.

Xác định:

1. semantic units nào chắc chắn có trong Pāli;
2. English làm rõ điều gì về syntax/compound;
3. Thích Minh Châu dùng thuật ngữ Việt nào;
4. ba nguồn có disagreement ở đâu;
5. điểm nào cần dictionary/grammar/parallel để phân xử.

### Bước 4 — Viết bản tiếng Việt mới

Viết câu Việt mới với mục tiêu:

- giữ đầy đủ semantic units của Pāli;
- dùng insight hữu ích từ English;
- tận dụng thuật ngữ tốt, súc tích và đã ổn định từ truyền thống Việt khi phù hợp;
- giảm Hán–Việt khó hiểu hoặc cấu trúc cổ;
- đọc tự nhiên với người Việt hiện đại;
- không thêm nghĩa ngoài Pāli.

Canonical wording phải là **một lựa chọn biên tập mới**, không phải phép thay vài từ đồng nghĩa trên một câu có sẵn.

### Bước 5 — Semantic audit ngược về Pāli

Với từng câu Việt, hỏi:

- Có ý nào trong Việt không tìm thấy căn cứ trong Pāli?
- Có ý nào trong Pāli bị mất?
- Speaker/chủ thể/đối tượng đúng chưa?
- Phủ định và scope đúng chưa?
- Điều kiện, nhân quả, thời gian, số lượng, mức độ và so sánh đúng chưa?
- Compound có bị hiểu quá mức không?
- Technical term có bị làm phẳng không?
- English hoặc Thích Minh Châu có vô tình kéo bản mới xa khỏi root không?

Nếu có, Pāli thắng.

### Bước 6 — Clarity pass

Đọc riêng tiếng Việt:

- câu có hiểu ngay không;
- có Hán–Việt nào có thể thay bằng từ dễ hơn mà không mất độ chính xác không;
- có chỗ nào đang dài dòng mà một thuật ngữ Hán–Việt quen thuộc sẽ rõ và súc tích hơn không;
- có cấu trúc cổ, đảo ngữ hoặc calque không cần thiết không;
- có thể tách câu hoặc đổi dấu câu mà không đổi nghĩa không.

Sau clarity pass, chạy semantic audit lần nữa.

### Bước 7 — Disagreement & comment

Nếu Pāli / English / Thích Minh Châu khác nhau ở một điểm quan trọng:

- không che disagreement;
- chọn canonical wording dựa trên Pāli + context;
- ghi note ở comment nếu khác biệt ảnh hưởng cách hiểu hoặc thuật ngữ;
- ghi nguồn tham khảo đủ rõ để có thể kiểm tra lại.

### Bước 8 — Technical validation

Chạy tối thiểu:

```bash
npm run validate
npm test
npm run check
```

Nếu bài sẽ `published`, hoặc thay đổi ảnh hưởng website/build pipeline, chạy thêm:

```bash
npm run build
```

Validation/test/check/build fail là **blocking error**. Không được chấm technical integrity cao rồi bỏ qua kết quả máy.

### Bước 9 — Adversarial quality review và scorecard

Sau khi bản dịch đã hoàn chỉnh, thực hiện một lượt review riêng với mục tiêu **tìm lỗi**, không bảo vệ bản dịch vừa viết.

Chấm đúng 10 tiêu chí trong `AGENTS.md` từ 0–10 và tính:

```text
final_score = tổng 10 điểm / 10
```

Dùng mean thô để quyết định status, không dùng mean làm tròn.

Trước khi xét điểm, kiểm tra blocking errors trong `AGENTS.md`. **Blocker thắng mọi điểm số.**

### Bước 10 — Chốt status và lưu ngay

- Có blocker → `draft`.
- Không blocker, `final_score > 9.0` → **`published` trực tiếp**.
- Không blocker, `8.0 <= final_score <= 9.0` → `review`.
- Không blocker, `final_score < 8.0` → `draft`.
- Chưa chấm đủ 10 tiêu chí → `draft`.

**Điểm đúng 9.0 không đủ. Phải lớn hơn 9.0 mới được `published`.**

Human review **không bắt buộc** để publish. Nếu có human review chất lượng cao, dùng nó như thêm evidence và cập nhật scorecard/bản dịch khi cần.

Khi bài đạt `published`, cập nhật metadata và lưu translation/comment/glossary liên quan vào repository ngay trong cùng batch công việc, không giữ lại `draft` chỉ để chờ review thủ công.

---

## 8. Checklist chính xác cấp segment

- [ ] Đúng UID và segment ID.
- [ ] Đã xem Pāli root.
- [ ] Đã đối chiếu ít nhất một English SuttaCentral phù hợp.
- [ ] Đã đối chiếu bản Hòa thượng Thích Minh Châu khi có.
- [ ] Không thiếu hoặc thêm semantic unit.
- [ ] Đúng speaker, chủ thể và đối tượng.
- [ ] Đúng phủ định và scope.
- [ ] Đúng điều kiện, nhân quả, thời gian, số lượng, mức độ và so sánh.
- [ ] Compound/particle quan trọng không bị bỏ qua.
- [ ] Technical term đúng context và nhất quán hợp lý.
- [ ] Proper names/danh xưng nhất quán.
- [ ] Repetition quan trọng không bị xóa tùy tiện.
- [ ] Không có explanatory content bị đưa vào canonical text như nguyên văn.
- [ ] Tiếng Việt tự nhiên, ít từ tối nghĩa.
- [ ] Hán–Việt được giữ/bỏ có chủ ý.
- [ ] Chỗ ambiguity/disagreement đáng kể có comment.

---

## 9. Quy tắc văn phong

- sáng, bình tĩnh, trang trọng vừa đủ;
- hiện đại nhưng không suồng sã;
- không giả cổ;
- không văn hoa hơn Pāli;
- không biến kinh thành văn self-help;
- không thêm cảm xúc/rhetoric ngoài source.

### Repetition

Kinh Pāli có repetition phục vụ ghi nhớ, cấu trúc và nhấn mạnh.

- canonical translation mặc định bảo tồn nội dung lặp;
- renderer có thể có presentation compact sau này;
- không xóa canonical meaning vì thấy lặp nhiều.

---

## 10. Quy tắc đối với AI/agent dịch

AI agent có thể **dịch, tự review, chấm điểm và publish** nếu đáp ứng đầy đủ quality gate. AI không phải authority về nghĩa; **Pāli/source evidence vẫn là authority**.

Agent phải:

- đọc `AGENTS.md` và file này trước translation task;
- chủ động lấy và đọc Pāli root + English SuttaCentral + bản Thích Minh Châu khi có;
- không hallucinate Pāli, dictionary meaning, translator, parallel hoặc source;
- không tự thêm explanatory meaning cho “dễ hiểu”;
- khi các reference lệch nhau, phân xử bằng Pāli/context và ghi ambiguity nếu cần;
- thực hiện adversarial review trước khi chấm điểm;
- không tự nâng điểm để đạt ngưỡng publish;
- nếu phát hiện blocker sau khi đã published, lập tức sửa hoặc hạ status xuống `draft` cho đến khi blocker được giải quyết.

Khi sửa bản dịch đã có, phân loại thay đổi:

- **accuracy fix**: sửa vì không phản ánh đúng Pāli;
- **clarity fix**: cùng nghĩa nhưng tiếng Việt dễ hiểu hơn;
- **terminology fix**: thay lựa chọn thuật ngữ có chủ ý;
- **style-only fix**: không đổi nghĩa.

Thay đổi lớn về nghĩa phải có lý do truy về segment/source.

---

## 11. Definition of Done cho một bài kinh

Một bài được xem là **hoàn tất** khi:

1. mọi segment thuộc phạm vi đều có canonical translation phù hợp;
2. Pāli root/provenance đã được pin và kiểm chứng;
3. đã đối chiếu English SuttaCentral phù hợp;
4. đã đối chiếu bản Thích Minh Châu khi có;
5. disagreement quan trọng đã được phân xử hoặc ghi comment;
6. semantic audit đã pass;
7. terminology pass đã thực hiện;
8. clarity/Hán–Việt pass đã thực hiện;
9. các technical validation bắt buộc pass;
10. không có nội dung bên thứ ba bị copy dài hoặc thiếu provenance/license;
11. đã hoàn thành scorecard 10 tiêu chí và blocking-error check;
12. metadata status khớp chính xác với rule trong `AGENTS.md`.

`published` không đồng nghĩa “không bao giờ còn sửa”. Nó có nghĩa bản hiện tại đã vượt publication threshold theo evidence đang có. Nếu evidence mới cho thấy lỗi, sửa bản dịch và cập nhật quality assessment.

---

## 12. Nguyên tắc quyết định khi có trade-off

Khi phải chọn giữa các phương án:

**Pāli meaning → logical precision → contextual coherence → terminology precision → provenance → Vietnamese clarity → concision → elegance.**

English và Thích Minh Châu giúp người dịch hiểu tốt hơn, nhưng **Pāli là tie-breaker cuối cùng**.

Nếu một cách dịch của Thích Minh Châu đã đúng, quen thuộc và súc tích, có thể giữ thuật ngữ/cách diễn đạt phù hợp. Nếu nó khó hiểu hoặc có cách hiện đại rõ hơn mà vẫn đúng Pāli, ưu tiên cách mới.

Nếu một câu English diễn đạt ý rất rõ, có thể học cách parse/structure từ nó nhưng phải viết thành tiếng Việt tự nhiên và audit lại với Pāli.

Đích đến là:

> **Một bản dịch mới tận dụng trí tuệ của các bản dịch trước, nhưng luôn quay về Pāli để kiểm chứng; ít tối nghĩa hơn, vừa đủ Hán–Việt để chính xác và súc tích, không tự bịa thêm bất kỳ ý nào ngoài kinh.**
