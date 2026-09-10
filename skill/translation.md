# Translation Skill — Pāli → Tiếng Việt

> **Phạm vi bắt buộc:** áp dụng cho mọi tác vụ dịch, sửa bản dịch, review bản dịch, chọn thuật ngữ và viết chú thích dịch thuật trong repository này.
>
> **Mục tiêu:** tạo một bản dịch Kinh tạng Pāli tiếng Việt mới **chính xác tối đa, truy nguyên rõ ràng và dễ hiểu hơn đối với người Việt hiện đại**. Bản dịch phải độc lập từ nguồn Pāli đã pin của SuttaCentral/Bilara, không phải bản hiện đại hóa hay phóng tác từ một bản dịch tiếng Việt có sẵn.

---

## 1. Mục tiêu tối thượng

Bản dịch này phải đồng thời đạt ba mục tiêu, theo thứ tự ưu tiên sau:

1. **Trung thành với nghĩa của Pāli.** Không được làm mất, thêm, làm mạnh hơn, làm yếu đi hoặc che khuất một ý có trong nguồn chỉ để câu Việt nghe đẹp hơn.
2. **Có thể truy nguồn.** Mọi câu/đoạn Việt phải gắn với đúng canonical segment ID của SuttaCentral/Bilara để người đọc và reviewer có thể quay lại nguyên văn Pāli.
3. **Dễ hiểu với tiếng Việt hiện đại.** Khi có hai cách diễn đạt cùng chính xác, ưu tiên cách ít cổ, ít tối nghĩa và ít Hán–Việt không cần thiết hơn.

**Không được đảo thứ tự này.** “Dễ đọc” không cho phép hy sinh độ chính xác; “sát chữ” cũng không phải lý do để tạo ra một câu tiếng Việt khó hiểu hoặc sai nghĩa.

Câu hỏi kiểm tra cuối cùng cho mỗi segment là:

> **Một người đọc tiếng Việt hiện đại có hiểu đúng điều Pāli đang nói không, và một reviewer có thể lần ngược từng ý về đúng segment nguồn không?**

---

## 2. Định vị so với các bản dịch tiếng Việt trước

Một động lực của dự án là nhiều bản dịch tiếng Việt cũ, trong đó có bản dịch của Hòa thượng Thích Minh Châu, có giá trị lịch sử rất lớn nhưng có thể khó đọc với độc giả hiện đại do cấu trúc câu cổ, thuật ngữ Hán–Việt dày, hoặc một số chỗ chưa làm rõ được sắc thái của Pāli.

Tuy nhiên:

- **Không dịch từ bản Thích Minh Châu rồi viết lại cho dễ hiểu.**
- **Không copy hoặc paraphrase có hệ thống bất kỳ bản dịch tiếng Việt có sẵn nào vào canonical translation.**
- Nếu một bản dịch cũ được dùng để đối chiếu, chỉ dùng **sau khi đã dịch độc lập từ Pāli**, như một nguồn kiểm tra xem có cách hiểu quan trọng nào mình đã bỏ sót hay không.
- Sự khác biệt với bản cũ **không tự động là cải tiến**. Mọi khác biệt quan trọng phải đứng được trên Pāli và bằng chứng ngôn ngữ học/ngữ cảnh.
- Không cố tình “dịch khác” để tạo sự mới lạ. Mục tiêu là **đúng hơn và rõ hơn**, không phải khác hơn.

Điều này cũng giảm anchoring: người dịch phải hình thành cách hiểu từ nguồn trước, rồi mới so sánh với truyền thống dịch thuật có sẵn.

---

## 3. Thứ bậc nguồn và bằng chứng

### 3.1. Nguồn có thẩm quyền

**Nguồn gốc chuẩn của bản dịch là Pāli root trong snapshot SuttaCentral/Bilara được pin bởi `source/suttacentral.lock.json`.**

Mỗi canonical translation segment phải dùng đúng key của root source, ví dụ:

```json
{
  "mn118:1.1": "..."
}
```

Không tự sửa UID, segment ID, thứ tự hoặc ranh giới segment.

### 3.2. Thứ tự ưu tiên khi giải nghĩa

Khi gặp chỗ khó, dùng evidence theo thứ tự:

1. **Pāli root đã pin**: từ ngữ, hình thái, cú pháp, phủ định, lượng từ, quan hệ giữa các mệnh đề, cấu trúc lặp.
2. **Ngữ cảnh nội bộ của chính bài kinh và các đoạn Pāli tương đồng** trong corpus SuttaCentral.
3. **Thông tin cấu trúc, variant/parallels và nguồn Pāli liên quan trên SuttaCentral**, khi có.
4. **Từ điển, ngữ pháp Pāli và tài liệu học thuật đáng tin cậy** để kiểm tra nghĩa và cấu trúc.
5. **Các bản dịch SuttaCentral/ngôn ngữ khác** như cross-check diễn giải, không phải nguồn để dịch vòng qua tiếng Việt.
6. **Các bản dịch tiếng Việt trước đây** chỉ là tertiary comparison, không phải authority.

Không giải quyết bất đồng bằng “đa số bản dịch đều dịch vậy”. Nếu các bản dịch khác nhau, quay lại Pāli và xác định nguyên nhân khác biệt.

### 3.3. Khi nguồn không đủ để chắc chắn

Không được biến sự mơ hồ của Pāli thành sự chắc chắn giả tạo trong tiếng Việt.

Nếu có hai cách hiểu thực sự hợp lý:

- chọn cách dịch ít giả định hơn trong canonical text;
- ghi cách hiểu thay thế và lý do trong `content/comment/vi/project/...` tại đúng segment ID;
- không nhét một bài giải thích dài vào câu dịch;
- nếu chưa đủ bằng chứng để chốt, giữ trạng thái `draft` hoặc `review`, **không `published`**.

---

## 4. “Dễ hiểu” nghĩa là gì

Dễ hiểu **không phải** tóm tắt, diễn nghĩa tự do hay chuyển giáo lý thành ngôn ngữ self-help hiện đại.

Ưu tiên:

- câu Việt tự nhiên, đúng trật tự thông tin của tiếng Việt khi việc đổi trật tự không làm sai logic;
- câu ngắn hơn khi Pāli có chuỗi mệnh đề dài và có thể tách an toàn;
- động từ cụ thể thay cho danh từ hóa nặng nề;
- từ Việt phổ thông thay cho Hán–Việt cổ hoặc ít người hiểu **khi hai lựa chọn có cùng độ chính xác**;
- chủ thể và quan hệ nhân quả được nói rõ khi Pāli cho phép xác định rõ;
- dấu câu và xuống câu giúp người đọc thấy cấu trúc lập luận, danh sách và lời thoại.

Tránh:

- dịch từng từ Pāli sang một từ Việt rồi giữ nguyên trật tự khiến câu Việt tối nghĩa;
- dùng Hán–Việt chỉ vì “nghe giống kinh”; 
- thay thuật ngữ khó bằng một từ phổ thông nhưng hẹp nghĩa hoặc sai nghĩa;
- thêm quan hệ nhân quả, chủ ý, đánh giá đạo đức hoặc giải thích tâm lý mà Pāli không nói;
- bỏ các từ lặp, điều kiện, giới hạn, phủ định hoặc mức độ vì cho rằng chúng “rườm rà”.

### Quy tắc Pareto cho Hán–Việt

- **Từ Hán–Việt không phải mặc định xấu.** Giữ lại khi nó là thuật ngữ Phật học đã ổn định hoặc chính xác hơn lựa chọn thuần Việt.
- Nếu một thuật ngữ kỹ thuật là cần thiết nhưng khó với độc giả mới, giữ bản dịch chính xác và giải thích bằng glossary/chú thích, thay vì làm phẳng nghĩa ngay trong canonical text.
- Với từ không mang tải kỹ thuật, ưu tiên tiếng Việt hiện đại rõ nghĩa hơn.

---

## 5. Không làm phẳng thuật ngữ Phật học

Các từ như `dukkha`, `saṅkhāra`, `sati`, `samādhi`, `viññāṇa`, `taṇhā`, `upādāna`, `nibbāna` và nhiều thuật ngữ khác có trường nghĩa phụ thuộc ngữ cảnh.

Vì vậy:

- không áp một phép ánh xạ 1:1 máy móc cho mọi occurrence;
- dùng `content/glossary/pali-vi.yaml` như **memory và QA aid**, không như luật dịch bất biến;
- khi một lựa chọn mới quan trọng xuất hiện, cập nhật glossary với `preferred`, `allowed` và note về ngữ cảnh;
- nếu một thuật ngữ có nhiều nghĩa hợp lệ theo ngữ cảnh, bảo tồn sự phân biệt đó;
- không nhập một khái niệm từ truyền thống chú giải vào canonical text nếu root Pāli không nói rõ. Nếu hữu ích, đặt trong comment.

---

## 6. Quy trình dịch bắt buộc cho mỗi bài kinh

### Bước 1 — Xác nhận provenance

Trước khi dịch:

- xác nhận đúng `uid`;
- đọc `source/suttacentral.lock.json`;
- sync đúng pinned source;
- xác nhận file Pāli root và segment IDs;
- không dịch từ một bản copy ngoài repo nếu không xác định được commit/source.

### Bước 2 — Đọc toàn bài trước khi tối ưu từng câu

Không dịch segment hoàn toàn cô lập. Đọc đủ context để hiểu:

- ai đang nói với ai;
- đoạn nào là lời Phật, lời đệ tử, lời kể;
- thuật ngữ đang được định nghĩa hay chỉ được nhắc;
- cấu trúc lập luận, ví dụ, danh sách, đối chiếu;
- các công thức lặp và antecedent của đại từ/ellipsis.

### Bước 3 — Dịch độc lập từ Pāli

Với từng segment:

1. xác định predicate/động từ chính;
2. xác định chủ thể, đối tượng và quan hệ case;
3. kiểm tra phủ định;
4. kiểm tra lượng từ, số đếm, mức độ, so sánh;
5. giải compound theo ngữ cảnh;
6. xác định particles có ảnh hưởng đến logic/sắc thái;
7. bảo toàn lời dẫn, lời trích và speaker;
8. viết lại thành tiếng Việt tự nhiên nhưng không mất semantic unit nào.

### Bước 4 — Semantic audit

Sau bản nháp, đối chiếu ngược Việt → Pāli và hỏi:

- Có ý nào trong câu Việt không tìm thấy căn cứ ở Pāli không?
- Có từ/ý nào trong Pāli biến mất trong câu Việt không?
- Phủ định có đúng scope không?
- Điều kiện, nguyên nhân, thời gian, so sánh và mức độ có đúng không?
- Chủ thể có bị đổi không?
- Một possibility có bị biến thành certainty không?
- Một description có bị biến thành prescription không?
- Một technical term có bị làm phẳng nghĩa không?

Nếu có, sửa trước khi làm đẹp văn phong.

### Bước 5 — Cross-check chống sai

Chỉ sau khi đã có bản dịch độc lập:

- kiểm tra các đoạn tương tự trong corpus;
- kiểm tra từ điển/ngữ pháp khi cần;
- có thể so với các bản dịch SuttaCentral khác để phát hiện cách parse khác;
- có thể xem bản dịch Việt cũ để tìm disagreement đáng điều tra;
- nếu có disagreement, **không chọn theo uy tín người dịch**: quay lại Pāli.

### Bước 6 — Plain-Vietnamese pass

Sau khi semantic audit đã pass, đọc chỉ phần tiếng Việt và sửa cho người Việt hiện đại:

- bỏ đảo ngữ không cần thiết;
- giảm Hán–Việt không mang tải kỹ thuật;
- tách câu khi an toàn;
- tránh lặp vụng về do calque nếu Pāli không đòi hỏi giữ đúng hình thức đó;
- giữ nhịp trang trọng vừa đủ, nhưng không tạo “giọng kinh” giả cổ.

Sau pass này phải chạy **semantic audit lần nữa** để đảm bảo việc làm câu dễ đọc không làm trôi nghĩa.

### Bước 7 — Ghi chú bất định

Chỗ nào reviewer cần biết về lựa chọn dịch, variant, ambiguity hoặc thuật ngữ khó thì ghi ở comment JSON theo segment ID.

Canonical translation phải đọc được độc lập; comment là lớp giải thích, không phải nơi sửa nghĩa cho một câu dịch mơ hồ.

### Bước 8 — Validate và review

Chạy tối thiểu:

```bash
npm run validate
npm test
npm run check
```

Không chuyển `review` nếu còn thiếu segment bắt buộc. Không chuyển `published` nếu chưa có human reviewer và metadata review theo quy định repo.

---

## 7. Checklist chính xác cấp segment

Reviewer phải đặc biệt soi các lỗi có tác động lớn sau:

- [ ] Đúng UID và segment ID.
- [ ] Không thiếu hoặc thêm semantic unit.
- [ ] Đúng speaker và quotation nesting.
- [ ] Đúng chủ thể/đối tượng.
- [ ] Đúng phủ định và phạm vi phủ định.
- [ ] Đúng số lượng, mức độ, thứ tự và phép so sánh.
- [ ] Đúng quan hệ điều kiện/nguyên nhân/thời gian.
- [ ] Compound không bị đoán theo surface form khi context chỉ hướng khác.
- [ ] Technical term nhất quán với context và glossary, nhưng không bị ép 1:1.
- [ ] Proper names, địa danh và danh xưng nhất quán.
- [ ] Repetition quan trọng không bị xóa vì “văn Việt thấy thừa”.
- [ ] Ellipsis/abbreviation của source không bị tự ý bổ sung như thể đó là nguyên văn.
- [ ] Không có explanatory content bị lén đưa vào canonical text.
- [ ] Tiếng Việt tự nhiên, độc giả hiện đại có thể hiểu mà không cần biết Hán văn.
- [ ] Chỗ thực sự bất định có comment thay vì certainty giả.

---

## 8. Quy tắc văn phong

### Giọng

- sáng, bình tĩnh, trang trọng vừa đủ;
- không giả cổ;
- không văn hoa hơn nguồn;
- không hiện đại hóa thành khẩu ngữ suồng sã;
- không thêm cảm xúc hay rhetoric mà Pāli không có.

### Đại từ và danh xưng

Ưu tiên nhất quán trong cùng context. Không đổi đại từ chỉ để tránh lặp nếu việc đổi có thể làm mơ hồ speaker hoặc quan hệ tôn kính.

### Repetition

Kinh Pāli có repetition mang chức năng ghi nhớ, nhấn mạnh và cấu trúc.

- canonical translation mặc định **bảo tồn nội dung lặp**;
- renderer/sách có thể có chế độ presentation khác sau này, nhưng không được làm mất canonical meaning ở source data;
- nếu root source dùng abbreviation/ellipsis, không tự khẳng định một expansion là canonical nếu chưa có rule/provenance rõ.

---

## 9. Quy tắc đối với AI/agent dịch

AI agent phải coi mình là **người tạo bản nháp có bằng chứng**, không phải authority cuối cùng.

Agent phải:

- đọc file này trước mọi translation task;
- đọc context đủ rộng quanh segment;
- không hallucinate Pāli, source path, dictionary meaning, parallel hoặc scholarly consensus;
- không tuyên bố “Pāli nghĩa là X” nếu thực tế có ambiguity đáng kể;
- không copy từ một bản dịch có sẵn để tăng tốc;
- không lấy English translation rồi dịch vòng sang tiếng Việt;
- ưu tiên ghi lại chỗ cần reviewer hơn là che bất định bằng câu văn tự tin;
- không tự chuyển `published` nếu chưa có human review rõ ràng.

Khi agent sửa một bản dịch đã có, phải phân biệt:

- **accuracy fix**: sửa vì bản cũ không phản ánh Pāli;
- **clarity fix**: cùng nghĩa nhưng tiếng Việt rõ hơn;
- **terminology fix**: thay lựa chọn thuật ngữ có chủ ý;
- **style-only fix**: không đổi nghĩa.

Các thay đổi lớn về nghĩa phải có lý do truy về segment/source trong PR hoặc review note.

---

## 10. Definition of Done cho một bài kinh

Một bài chỉ đủ điều kiện `published` khi:

1. mọi segment nguồn thuộc phạm vi dịch đều có canonical translation hợp lệ;
2. validation không có lỗi;
3. semantic audit đã được thực hiện;
4. terminology pass đã được thực hiện;
5. plain-Vietnamese pass đã được thực hiện;
6. chỗ ambiguity đáng kể có comment;
7. reviewer đã đối chiếu trực tiếp với pinned Pāli source, không chỉ đọc bản Việt;
8. metadata có reviewer và ngày review theo schema hiện hành;
9. không có nội dung lấy từ bản dịch bên thứ ba mà thiếu provenance/license;
10. bản dịch đọc tự nhiên nhưng reviewer vẫn có thể truy ngược từng chi tiết về segment Pāli.

---

## 11. Nguyên tắc quyết định khi có trade-off

Khi phải chọn giữa hai phương án, dùng thứ tự này:

**Pāli meaning → logical precision → contextual coherence → terminology precision → provenance/auditability → Vietnamese clarity → elegance.**

Nếu một câu “hay” hơn nhưng thêm nghĩa, bỏ nghĩa hoặc khóa một ambiguity mà Pāli không khóa, **không dùng**.

Nếu một câu sát cấu trúc Pāli nhưng người Việt đọc không hiểu, **viết lại bằng tiếng Việt tự nhiên cho đến khi rõ**, rồi audit ngược để bảo đảm không đổi nghĩa.

Đích đến không phải “bản dịch sát chữ nhất” hay “bản dịch hiện đại nhất”. Đích đến là:

> **Bản dịch mà người đọc hiện đại hiểu đúng hơn, reviewer kiểm chứng dễ hơn, và mỗi quyết định quan trọng đều có thể quay về nguồn Pāli cụ thể.**
