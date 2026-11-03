# Kế hoạch diễn giải hiện đại theo lứa tuổi — Trung Bộ Kinh và Trường Bộ Kinh

**Trạng thái:** lô biên soạn ban đầu đã duyệt 186 bài, 558 bản. Đợt tái đánh giá bắt đầu 2026-11-02 hiện đã đọc MN1–MN20 cho trẻ em và người lớn tuổi (40/304 bản). MN1 trẻ em từng về `review`, đã sửa và chấm mới 9,24. MN1–MN10 đã merge qua PR #2057 ngày 2026-11-03; MN11–MN20 còn ở worktree batch02. Public MN1 trong lần quan sát đầu vẫn khớp nội dung trước tái đánh giá, nên chưa ghi nhận lô đầu là live. Còn 264 bản chờ đọc lại. [Hồ sơ tái đánh giá](../modern-explanations/reassessment-20261102/README.md) ghi điểm, nguồn và các lớp phát hành riêng; [bảng hoàn tất ban đầu](../modern-explanations/completion-mn-dn.md) giữ số liệu lịch sử. Các mục dưới đây giữ yêu cầu thiết kế và quy trình dùng khi duy trì, sửa hoặc đánh giá lại.

**Quy trình hiện hành:** [Biên soạn và chấm điểm diễn giải hiện đại](../modern-explanation-quality.md) cụ thể hóa rubric số, cấu trúc JSON, hiệu lực đánh giá và cổng của từng lô. Yêu cầu triển khai tuần tự thay cho thứ tự làm thử MN61/DN31 trong đề xuất ban đầu; các ví dụ ở §5 vẫn chỉ là minh họa giọng viết.

**Mục tiêu:** mỗi bài kinh có thêm ba mục bằng tiếng Việt — dành cho trẻ em, người trưởng thành và người lớn tuổi. Người đọc thấy bài kinh liên quan đến đời sống của mình, hiểu đúng mạch nghĩa và có đường trở lại kinh văn để tìm hiểu sâu hơn.

**Nguyên tắc chủ đạo:** thay đổi ngôn ngữ, ví dụ và cách dẫn dắt theo người đọc; giữ vững nội dung, quan hệ lập luận và hướng tu tập của bài kinh. Sức hấp dẫn đến từ tình huống cụ thể và sự hiểu ra, không từ việc thêm lời hứa hoặc sửa giáo nghĩa cho vừa thị hiếu.

## 1. Phạm vi và kết quả cần đạt

### 1.1. Hai bộ kinh, ba mục trên mỗi bài

| Bộ kinh | UID trong catalog | Số bài | Số bản diễn giải cần có |
| --- | --- | ---: | ---: |
| Trung Bộ Kinh — Majjhima Nikāya | `mn1`–`mn152` | 152 | 456 |
| Trường Bộ Kinh — Dīgha Nikāya | `dn1`–`dn34` | 34 | 102 |
| **Tổng mục tiêu** | | **186** | **558** |

Các số trên được đếm từ [catalog MN](../../content/catalog/sutta/mn.json) và [catalog DN](../../content/catalog/sutta/dn.json) tại commit dự án `d4c32090e73d4fe1ec57fda2c4b3f3906813cffa`, ngày 2026-10-18. Đây là quy mô cần biên soạn, **không phải số bản đã viết hoặc đã duyệt**. Khi triển khai, lấy mẫu số từ catalog để báo cáo tiến độ.

Ba tên mục thống nhất:

1. **Diễn giải dành cho trẻ em** — mã nội bộ `children`.
2. **Diễn giải dành cho người trưởng thành** — mã nội bộ `adults`.
3. **Diễn giải dành cho người lớn tuổi** — mã nội bộ `older-adults`.

Một bài chỉ được tính là hoàn tất khi cả ba bản đã qua kiểm tra riêng và còn khớp với phiên bản nguồn được dùng. Có thể phát hành từng bản đạt yêu cầu trước; mục còn thiếu hiển thị đúng trạng thái, không lấy bản của nhóm khác để điền vào.

Phạm vi triển khai gồm biên soạn ba bản cho từng bài MN/DN, hiển thị trên trang đọc, chấm điểm và kiểm chứng theo lô. Tìm kiếm riêng và sách diễn giải vẫn là các đầu ra cần yêu cầu triển khai riêng.

### 1.2. Thế nào là thành công?

Sau khi đọc một bản diễn giải phù hợp, người đọc có thể:

- Nói lại vấn đề bài kinh đang giải quyết và những ý chính liên quan với nhau thế nào.
- Hiểu ít nhất một điểm trước đó thấy khó, thay vì chỉ nhớ một câu chuyện minh họa.
- Phân biệt lời kinh, lời giải thích và ví dụ do người biên soạn đặt ra.
- Nhận ra một điều có thể suy xét hoặc tập làm trong đời sống, đúng phạm vi của bài.
- Mở được đoạn kinh làm căn cứ khi muốn kiểm tra hoặc đọc sâu hơn.

Số chữ, số file và nhận xét “văn hay” là thông tin phụ. Chúng không chứng minh người đọc đã hiểu đúng.

## 2. Nền tảng biên tập và ranh giới nội dung

Chuẩn áp dụng là [AGENTS.md](../../AGENTS.md), [skill/translation.md](../../skill/translation.md), [phương pháp QC](../quality-assessments.md) và [DESIGN.md](../../DESIGN.md). Khi làm bản diễn giải cụ thể, đọc thêm ghi chú thuật ngữ và quyết định biên tập liên quan đến chính bài đó.

### 2.1. Diễn giải có vị trí riêng

Mỗi nhóm diễn giải mang nhãn dễ thấy:

> Phần diễn giải do dự án biên soạn để hỗ trợ tìm hiểu bài kinh. Ví dụ đời sống là minh họa của người biên soạn; đây không phải nguyên văn lời Phật.

Giữ nguyên kinh văn Pāli, bản dịch Việt của dự án, các bản tham khảo, tóm tắt hiện hữu và chú thích theo đoạn. Không chèn ví dụ mới vào JSON bản dịch, không coi diễn giải là một nguồn kinh văn hoặc một cột đối chiếu mới.

Các ý trình bày là lời dạy phải truy về **Pāli trong snapshot đã ghim**. Đối chiếu bản Anh SuttaCentral, bản Việt của dự án và bản Hòa thượng Thích Minh Châu khi có. Mỗi nguồn chỉ được ghi là đã tham khảo sau khi thực sự đọc. Bản Anh lấp của dự án không được tự nhận là chứng cứ độc lập khi cùng người hoặc công cụ tạo ra.

Bản Việt nguyên bài được dùng để đối chiếu nội dung, không tự căn nó vào segment Bilara. Giữ thông tin tác giả, nơi phân phối và tình trạng nguồn đúng như registry của kho.

### 2.2. Những điều giữ nguyên khi đổi cách viết

| Thành phần | Yêu cầu đối với cả ba bản |
| --- | --- |
| Bối cảnh và người nói | Biết ai nói với ai; phân biệt lời Phật, lời đệ tử, lời người kể và quan điểm đang được chất vấn. |
| Mạch bài | Giữ vấn đề, những bước lập luận chính và kết luận; không chọn một thông điệp dễ kể rồi bỏ phần còn lại. |
| Logic | Giữ phủ định, điều kiện, phạm vi, mức độ, thứ tự và các phân biệt có ý nghĩa. |
| Thuật ngữ | Giải thích theo ngữ cảnh; không thay mọi thuật ngữ bằng một từ tâm lý học phổ thông. |
| Hướng tu tập | Giữ mục đích được bài kinh nêu; không thu thành mẹo giao tiếp, tăng năng suất hoặc cảm thấy dễ chịu. |
| Mức độ chắc chắn | Ghi rõ điểm chưa phân xử; không làm giọng kể chắc chắn hơn căn cứ nguồn. |

Một câu xuất hiện trong kinh chưa đủ để coi đó là điều Đức Phật tán thành. Reviewer phải kiểm cả người nói và cách bài kinh xử lý quan điểm ấy.

### 2.3. Ví dụ mới và phần khó

- **Ví dụ hiện đại:** dùng nhãn “Ví dụ trong đời sống hôm nay” hoặc câu dẫn tương đương. Ghi trong hồ sơ biên tập ví dụ minh họa ý nào và điểm nào không nên suy rộng.
- **Lời trích:** chỉ đặt lời vào miệng nhân vật kinh điển khi có căn cứ trích dẫn chính xác. Diễn ý viết bằng lời của người biên soạn, không thêm dấu ngoặc kép sau “Đức Phật dạy”.
- **Ứng dụng:** một lời mời suy xét hoặc việc nhỏ để thử là đề xuất biên tập, trừ khi kinh trực tiếp hướng dẫn điều đó. Không hứa kết quả tu chứng, chữa bệnh hay bảo đảm thành công.
- **Bối cảnh xã hội cổ:** trình bày điều văn bản nói trước, rồi phân biệt cách vận dụng hôm nay. Không âm thầm thay quan hệ xã hội trong nguồn bằng một mô hình hiện đại và gán ngược cho kinh.
- **Tái sinh, nghiệp, các cảnh giới, thần thông:** không tự xóa, cũng không tự chuyển toàn bộ thành ẩn dụ tâm lý; không thêm tuyên bố “khoa học đã chứng minh”. Giải thích đúng vai trò của chúng trong bài và ghi giới hạn của phần diễn giải.
- **Đoạn nhạy cảm:** với trẻ em, có thể giảm chi tiết mô tả gây choáng nhưng vẫn nói rõ điều gì xảy ra và vì sao đoạn ấy có mặt. Ghi nhận phần trình bày giản lược; không bỏ một luận điểm vì khó kể.

Tránh những cách ứng dụng dẫn đến đổ lỗi cho người đang khổ, nhẫn nhịn hành vi gây hại, bỏ trách nhiệm nhân danh buông xả, hoặc tự ghét bản thân vì một sai lầm. Đây là các tình huống reviewer cần thử chủ động, không chỉ chờ độc giả phát hiện.

## 3. Ba nhóm độc giả, ba cách dẫn vào cùng bài kinh

Tuổi là điểm khởi đầu để chọn giọng viết, không thay thế khả năng đọc, kinh nghiệm sống hoặc hiểu biết Phật học. Người đọc được tự chọn bất kỳ bản nào; không cần khai tuổi hoặc bị hệ thống tự phân nhóm.

| Tiêu chí | Trẻ em | Người trưởng thành | Người lớn tuổi |
| --- | --- | --- | --- |
| Giả định biên tập | Trọng tâm ban đầu khoảng 7–12 tuổi; trẻ nhỏ hơn có thể đọc cùng người chăm sóc. Đây là giả định để thử, không phải chuẩn phát triển khoa học. | Người có nhiều mức hiểu biết Phật học và hoàn cảnh sống khác nhau. | Độc giả có trải nghiệm sống phong phú; không giả định cùng trình độ học vấn, sức khỏe hay mức quen công nghệ. |
| Ngôn ngữ | Cụ thể, câu ngắn, động từ rõ; giải thích thuật ngữ ngay khi cần. | Trực tiếp, tự nhiên; đủ chiều sâu để thấy nguyên nhân, lựa chọn và hệ quả. | Sáng rõ, nhịp khoan thai, đoạn ngắn vừa đủ; giữ chiều sâu và phẩm giá của người đọc. |
| Giọng kể | Ấm áp, tò mò; có thể xưng “em”, không nựng hoặc lên lớp. | Đối thoại bình đẳng; có thể dùng “bạn”, “chúng ta”. | Tôn trọng, gần gũi; ưu tiên “chúng ta”, tránh gọi mọi người là “ông bà”. |
| Điểm chạm | Bạn bè, trò chơi, việc học, chia sẻ đồ dùng, lỗi nhỏ, lời trêu, biết nhờ giúp đỡ. | Công việc, sinh kế, quan hệ, gia đình, quyết định khó, danh tiếng, thói quen chú ý. | Tình bạn, sự học, sinh hoạt cộng đồng, truyền kinh nghiệm, quan hệ giữa thế hệ, khả năng tự quyết và thay đổi trong đời sống. |
| Cách dẫn dắt | Một tình huống nhìn thấy được → điều đang xảy ra trong tâm/hành động → ý bài kinh → câu hỏi để tự nhận biết. | Một lựa chọn có cái giá thật → cơ chế bài kinh chỉ ra → giới hạn của ví dụ → điều có thể thay đổi. | Một trải nghiệm quen thuộc → nhìn lại với góc nhìn của bài kinh → lựa chọn đang còn trong tay → suy xét nhẹ nhàng. |
| Điều cần tránh | “Ngoan là vâng lời”; dọa phạt; thưởng đổi lấy việc thiện; bắt thú nhận mọi ý nghĩ; thuật ngữ dồn dập. | Văn truyền động lực; tối ưu thành tích bằng Phật pháp; mặc định ai cũng có gia đình, con hoặc làm văn phòng. | Giọng thương hại; mặc định yếu trí nhớ, nghỉ hưu, cô đơn; chỉ nói về bệnh, mất mát và cái chết. |

### 3.1. Độ dài và nhịp đọc

Không ấn định một trần số chữ cho mọi bài kinh. Mỗi bản có phần dẫn nhập ngắn và các phần đọc tiếp theo đúng mạch nội dung; Trường Bộ hoặc bài có nhiều tầng lập luận có thể cần nhiều phần.

Điểm khởi đầu cho đợt làm thử (pilot): một phần đọc của trẻ em khoảng 100–200 đơn vị tách bằng khoảng trắng; người trưởng thành 200–400; người lớn tuổi 150–300. Đây là **giả thuyết biên tập về nhịp đọc**, không phải tiêu chuẩn khoa học hay ngưỡng chặn xuất bản. Đếm theo cách này chỉ để so sánh nhất quán; không gọi đó là phép đếm từ tiếng Việt chính xác.

Nếu rút ngắn làm mất nghĩa, chia thêm phần. Nếu văn dài vì lặp lại cùng một lời khuyên, cắt phần lặp. Đọc thử mới quyết định giới hạn hữu ích.

### 3.2. Viết hấp dẫn mà không thêm kịch tính giả

Mở bằng một tình huống, câu hỏi hoặc điều nghịch với thói quen mà bài kinh thực sự giúp làm sáng tỏ. Để độc giả nhận ra vấn đề trước khi đưa thuật ngữ. Có thể dùng hình ảnh và lời thoại trong tình huống hiện đại, nhưng nhân vật không cần có một kết thúc hoàn hảo.

Tránh mở bài hàng loạt bằng “Trong cuộc sống hiện đại đầy áp lực…”, kết bài bằng khẩu hiệu, hoặc thay vài danh từ để tạo ba phiên bản gần như giống hệt nhau. Đọc thành tiếng để phát hiện câu dịch cứng, giọng dạy đời và đoạn giải thích vòng vo.

## 4. Hồ sơ nghĩa chung và cấu trúc một bản diễn giải

### 4.1. Lập bản đồ ý nghĩa trước khi viết

Mỗi bài có **một hồ sơ nghĩa chung** làm cơ sở cho ba bản. Hồ sơ gồm:

| Trường | Nội dung cần ghi |
| --- | --- |
| Nhận diện | UID, tên bài theo kho, bộ kinh, phiên bản nguồn được dùng. |
| Bối cảnh | Người nói, người nghe, tình huống và câu hỏi của bài. |
| Các đơn vị nội dung | Những phần có ý nghĩa của toàn bài, theo thứ tự; bao gồm lập luận, ví dụ kinh điển, danh sách và kết luận. |
| Ý cần bảo toàn | Mỗi đơn vị nói điều gì; điều kiện, phủ định và phân biệt nào không được mất. |
| Căn cứ | Segment ID thực của Pāli; nguồn đối chiếu và ghi chú bất đồng. |
| Xử lý ở từng bản | Đoạn diễn giải nào trình bày đơn vị này; phần lặp nào đã gộp, phần nhạy cảm nào giảm chi tiết và lý do. |
| Giới hạn ví dụ | Ví dụ hôm nay tương ứng điểm nào; suy rộng nào sẽ làm sai ý. |

Kiểm **hai chiều**: mọi ý được trình bày là lời dạy đều có căn cứ; mọi đơn vị nội dung có ý nghĩa trong bài đều có cách xử lý ở cả ba bản. Một danh sách số đoạn không tự chứng minh đã hiểu đúng; reviewer vẫn phải đọc nguồn và phần diễn giải tương ứng.

Được gộp những lần lặp cùng nội dung nếu ghi rõ phạm vi, nhưng phải giữ các nhánh khác nhau và phân biệt quan trọng. Với bài dài, ba bản có thể khác cách chia phần; tất cả vẫn truy về cùng hồ sơ nghĩa.

Không viết bản người lớn trước rồi liên tục rút gọn thành hai bản còn lại. Mỗi bản được soạn trực tiếp từ hồ sơ chung và nguồn, tránh làm mất nghĩa qua nhiều vòng tóm lược.

### 4.2. Những thành phần người đọc cần nhận được

Mỗi bản nên có các thành phần sau, với tiêu đề và thứ tự linh hoạt theo lứa tuổi:

1. **Một lối vào gần gũi:** câu hỏi hoặc tình huống ngắn có quan hệ thật với bài kinh.
2. **Bài kinh đang nói gì:** bối cảnh và diễn giải các phần chính theo mạch bài.
3. **Hiểu qua đời sống hôm nay:** một hoặc vài ví dụ mới, giải thích vì sao ví dụ phù hợp.
4. **Chỗ dễ hiểu sai:** làm rõ những giới hạn cần thiết của riêng bài, bằng câu đơn giản.
5. **Điều có thể suy xét hoặc thử làm:** một câu hỏi hay hành động nhỏ; không ép mọi bài thành bài tập thiền.
6. **Đọc lại kinh:** dẫn tới các đoạn liên quan và cho phép mở hồ sơ nguồn chi tiết.

Phần dẫn nhập có thể giúp người ít thời gian nắm hướng bài, nhưng không thay cho bản diễn giải đầy đủ ở các phần đọc tiếp.

## 5. Mẫu giọng viết: một ý trong MN61, ba cách tiếp cận

**Phạm vi minh họa:** các đoạn dưới chỉ minh họa việc xem xét lời nói trong MN61, không phải ba bản diễn giải hoàn chỉnh. Tình huống và cách sửa sai trong đời sống hôm nay do người biên soạn đề xuất; không phải sự kiện hoặc lời thoại trong kinh.

### 5.1. Căn cứ chung phải giữ

Trong phần này, bài kinh hướng dẫn xem xét lời nói trước khi nói, trong khi nói và sau khi đã nói. Tiêu chí liên quan đến thiện/bất thiện, tổn hại cho mình, người khác hoặc cả hai, và hệ quả khổ/an lạc. Khi nhận ra lời bất thiện gây hại, tránh nói hoặc dừng lại. Nếu đã nói, trình bày rõ lỗi với vị Thầy hoặc người đồng phạm hạnh có trí, rồi phòng hộ về sau. Lời thiện, không gây hại cũng cần được nhận biết, vui với điều ấy và tiếp tục tu học.

| Ý dùng trong minh họa | Segment Pāli đã kiểm |
| --- | --- |
| Xem xét trước khi nói, cả nhánh bất thiện và thiện | `mn61:12.1`–`mn61:12.9` |
| Xem xét trong khi nói; dừng hoặc tiếp tục theo điều nhận biết | `mn61:13.1`–`mn61:13.9` |
| Xem xét sau khi nói; bộc lộ lỗi và phòng hộ về sau | `mn61:14.1`–`mn61:14.7` |
| Hoan hỷ và tiếp tục tu học thiện pháp | `mn61:14.8`–`mn61:14.10` |

Nguồn chính: [Pāli MN61 tại commit đã ghim](https://github.com/suttacentral/bilara-data/blob/11c9d708978cde8ba61096d8a75f7ddfb846f639/root/pli/ms/sutta/mn/mn61_root-pli-ms.json). Đối chiếu [bản Việt dự án tại phiên bản đã đọc](https://github.com/streamentry/kinh-tang-pali/blob/d4c32090e73d4fe1ec57fda2c4b3f3906813cffa/content/translation/vi/project/sutta/mn/mn61_translation-vi-project.json), [bản Anh của Bhikkhu Sujato](https://github.com/suttacentral/bilara-data/blob/11c9d708978cde8ba61096d8a75f7ddfb846f639/translation/en/sujato/sutta/mn/mn61_translation-en-sujato.json) và [bản Việt nguyên bài của Hòa thượng Thích Minh Châu, Bình Anson hiệu đính](https://github.com/suttacentral/sc-data/blob/4d481d7cfbaeccad19fa85adc215d3c15ff43457/html_text/vi/pli/sutta/mn/mn61.html).

Bản Anh ghim có chỗ lược trống trong phần lặp; không khai rằng từng segment ở bảng trên đều có câu Anh độc lập. Bản Việt HTML cũng không có căn chỉnh theo segment Bilara.

### 5.2. Trẻ em — khi cả nhóm cùng trêu một bạn

Một bạn đọc nhầm, cả nhóm bật cười. Em cũng định đặt cho bạn một biệt danh. Trước khi nói, thử hỏi: câu này có làm bạn bị chê cười, khiến mình quen làm đau người khác không? Nếu nhận ra đó là lời gây hại, em có thể không nói. Nếu đang trêu, em có thể dừng ngay, dù những bạn khác vẫn cười.

Nếu đã lỡ nói, đừng giả vờ như chưa có chuyện gì. Một cách sửa trong tình huống này là kể thật với người lớn đáng tin, biết giúp em, rồi tìm cách xin lỗi và không lặp lại. Còn khi em biết nói lời tử tế giúp bạn, hãy nhận ra điều tốt ấy và tiếp tục tập. Mình học từ cả điều cần sửa lẫn điều đã làm đúng.

### 5.3. Người trưởng thành — trước và sau một lời phê bình

Bạn sắp gửi vào nhóm làm việc một nhận xét gay gắt về đồng nghiệp. Trước khi gửi, hãy xem lời ấy có nhằm giải quyết việc cần làm hay đang trở thành lời công kích, gây tổn hại cho mình và người khác. Nếu đang trao đổi mà nhận ra mình đã chuyển sang hạ nhục, dừng phần công kích ấy.

Sau cuộc trao đổi, việc nhìn lại vẫn còn cần thiết. Nếu có lỗi, một cách vận dụng là thành thật nhận lỗi, tìm lời khuyên nơi người sáng suốt và sửa phần mình có thể sửa; đồng thời tập để lần sau không tái diễn. Nếu lời nói là thiện, không gây hại, cũng nên ghi nhận để tiếp tục rèn luyện. Mục đích của phần kinh này rộng hơn việc có một cuộc họp thuận lợi: đó là học cách thanh lọc hành động bằng lời.

### 5.4. Người lớn tuổi — góp ý mà vẫn biết nhìn lại mình

Trong nhóm sinh hoạt quen, ta từng phụ trách một việc suốt nhiều năm. Nay một người trẻ nhận làm và chọn cách khác. Ta muốn góp ý từ kinh nghiệm, nhưng lời sắp nói có thể đang phủ nhận cả công sức của họ. Trước khi nói, thử xem lời ấy có gây tổn hại cho mình hoặc người nghe không. Khi đang nói, vẫn có thể nhận ra và dừng một lời cay nghiệt.

Sau đó, dành một lúc nhìn lại: điều gì nên giữ, điều gì cần sửa? Nếu có lỗi, ta có thể thẳng thắn nhận lỗi, trao đổi với người đáng tin và sáng suốt, rồi tập cách nói khác vào lần sau. Dù đã trải qua nhiều việc, chúng ta vẫn có thể học từ một lần nói chưa khéo. Một lời thiện đã nói cũng đáng được nhận biết và vui với nó; từ đó tiếp tục vun bồi cách sống lành.

### 5.5. Những giới hạn không được mất khi mở rộng mẫu

- Xin lỗi, sửa thông tin trong nhóm hoặc tìm người lớn đáng tin là **gợi ý vận dụng**, không phải bản dịch sát chữ của chỉ dẫn dành cho Rāhula.
- “Gây hại” không được giản lược thành “làm ai đó khó chịu”. Không suy ra rằng cứ có người không vui thì phải im lặng.
- Bản MN61 đầy đủ còn cần nội dung về chân thật, các ví dụ kinh điển và toàn bộ thân–lời–ý, theo hồ sơ nghĩa của bài.
- Không áp một công thức xử lý lỗi cho tất cả: `mn61:14.6`–`14.7` nói về bộc lộ lỗi ở lời nói; `mn61:17.6`–`17.7` xử lý ý nghiệp theo cách khác. Không biến thành yêu cầu trẻ kể mọi ý nghĩ cho người lớn hoặc tự ghét chính mình.

Một phép thử bổ sung từ **DN31**: [đoạn Pāli `dn31:28.1`–`28.6`](https://github.com/suttacentral/bilara-data/blob/11c9d708978cde8ba61096d8a75f7ddfb846f639/root/pli/ms/sutta/dn/dn31_root-pli-ms.json) nêu cả bổn phận người con và sự chăm sóc của cha mẹ. Bản trẻ em không được rút thành “con ngoan phải nghe lời”. Đồng thời, việc giải thích trách nhiệm hai chiều không cho phép khẳng định toàn bộ quan hệ xã hội trong kinh đã giống mô hình hiện đại.

## 6. Dữ liệu và tích hợp với repository

### 6.1. Hiện trạng và phần cần bổ sung

Các điểm dưới được đối chiếu tại commit dự án ghi ở §1:

| Thành phần hiện có | Hướng triển khai diễn giải |
| --- | --- |
| `summary` trong `content/meta/sutta/<collection>/<uid>.yaml` | Giữ tóm tắt hiện hữu; ba bản diễn giải là nội dung mới có vòng đời riêng. |
| JSON kinh văn trong `content/translation/vi/project/sutta/` | Không thay đổi vì tác vụ diễn giải. |
| Chú thích theo segment trong `content/comment/vi/project/sutta/` | Không nhét nguyên bài diễn giải vào một segment để tận dụng loader. |
| Store ở `source/layers.yaml`; bốn cột đối chiếu của reader | Không thêm nhóm tuổi thành store layer hoặc cột dịch. |
| Trang `src/pages/sutta/[collection]/[uid].astro` | Ghép phần diễn giải vào trang theo UID, bằng component riêng. |
| Review hiện có cho `translation` và `summary` | Cần bổ sung đối tượng đánh giá diễn giải và chiều `audience`; chưa có sẵn. |
| `quality --apply` dùng cho bản dịch | Không chạy cho diễn giải như thể công cụ đã hỗ trợ; xây đường ghi/duyệt riêng trước. |

Căn cứ kỹ thuật: [types](../../src/lib/canon/types.ts), [trang bài kinh](../../src/pages/sutta/%5Bcollection%5D/%5Buid%5D.astro), [mô hình đánh giá](../../src/lib/canon/quality.ts), [CLI đánh giá](../../scripts/assess-quality.ts) và [package.json](../../package.json).

### 6.2. Cấu trúc dữ liệu triển khai

Đơn vị biên soạn và duyệt là cặp `(uid, audience)`. Triển khai dùng JSON có cấu trúc để kiểm tra và hiển thị đoạn văn thuần. Namespace mới nằm trong phạm vi bình giải của dự án đã được khai báo giấy phép; không trộn với các tệp chú thích theo segment.

| Đường dẫn, tương đối từ gốc kho | Vai trò |
| --- | --- |
| `content/comment/vi/project/explanations/sutta/<collection>/<uid>.json` | Nguồn và hash, hồ sơ nghĩa chung, ba bản độc giả; từng phần có loại, đoạn văn và mã ý. |
| `content/meta/explanations/sutta/<collection>/<uid>.json` | Trạng thái từng nhóm và lịch sử đánh giá có điểm, căn cứ và hash; giữ các lượt cũ. |
| `src/lib/canon/explanations.ts` | Schema, kiểm nguồn, độ phủ, hiệu lực đánh giá và điều kiện hiển thị. |
| `scripts/explanations.ts` | Ghi đánh giá, áp dụng kết quả đủ điều kiện, kiểm tra và báo cáo tiến độ từ catalog. |

Metadata tối thiểu của mỗi bản: `uid`, `audience`, `status`, người/công cụ soạn, ID lượt duyệt được chọn và thông tin phiên bản nội dung. Lượt duyệt lưu người/công cụ thực sự kiểm, ngày, tiêu chí, lỗi còn tồn tại và các dấu vân tay sau:

- Commit Pāli đã ghim và nguồn đối chiếu được dùng, gồm phiên bản HTML nguyên bài nếu có; lưu hash từng tệp nguồn mà bài thực sự phụ thuộc.
- Hash bản dịch Việt tham khảo và hồ sơ nghĩa chung.
- Hash nội dung diễn giải, gồm nội dung và metadata có ảnh hưởng đến cách hiểu.

Hash dùng để duyệt nội dung không bao gồm `status`, ID lượt duyệt được chọn, ngày duyệt hoặc chính lịch sử review. Nếu đưa các trường ấy vào hash, thao tác chọn lượt duyệt hay chuyển sang `published` sẽ làm kết quả vừa chọn tự hết hiệu lực.

Các công cụ hỗ trợ đọc từ `source/tooling.yaml`, không ghi tên công cụ tùy tiện vào giao diện hoặc sửa ghi công lịch sử. Việc dùng chung mô hình lịch sử hiện có chỉ thực hiện sau khi mở rộng schema, phép tính hash và validator; không tự chế một `target` mà code chưa nhận.

### 6.3. Trạng thái độc lập và thay đổi nguồn

Đề xuất dùng `draft → review → published` cho **từng bản diễn giải**, với tiêu chí tại §7. Trạng thái này không thay thế hoặc tự nâng `meta.status` của bản dịch; điểm của bản dịch cũng không tự duyệt diễn giải.

Một bản có lỗi trọng yếu giữ `draft`. Bản đầy đủ đang chờ lượt kiểm độc lập là `review`. Bản chỉ được `published` khi có hồ sơ kiểm hiện hành, không còn lỗi chặn và đã qua kiểm tra kỹ thuật áp dụng.

Nguồn, hồ sơ nghĩa hoặc nội dung thay đổi thì đánh giá lại tính hiện hành bằng hash. Lưu lượt cũ để tra cứu; không đổi ngày để biến nó thành lượt duyệt mới. Bản có đánh giá không còn khớp nguồn không được phục vụ như bản đã duyệt hiện hành. Hiển thị “Đang rà soát theo nguồn cập nhật” trong khi xử lý.

Sửa riêng bản trẻ em chỉ làm hết hiệu lực đánh giá của bản ấy nếu các phụ thuộc chung giữ nguyên. Sửa hồ sơ nghĩa chung hoặc nguồn có thể ảnh hưởng cả ba bản. Ghi commit để truy xuất xuất xứ, nhưng xác định tính hiện hành bằng hash các tệp phụ thuộc thực tế. Khi đổi pin mà các tệp ấy không đổi, xác minh và ghi nhận tính tương đương; không bắt buộc review lại nội dung. Sửa một file không liên quan cũng không nên buộc duyệt lại 558 bản.

### 6.4. Trình bày trên trang đọc

Đề xuất đặt khối **Diễn giải hiện đại** sau tóm tắt hiện hữu, trước audio và `SuttaReader`, với ba mục mở/thu gọn độc lập. Vị trí này để người mới tìm thấy ngay, đồng thời giữ mục Tra cứu toàn văn tại vị trí hiện có sau các segment bên trong reader.

| Nhãn mục | Anchor đề xuất |
| --- | --- |
| Diễn giải dành cho trẻ em | `#dien-giai-tre-em` |
| Diễn giải dành cho người trưởng thành | `#dien-giai-nguoi-truong-thanh` |
| Diễn giải dành cho người lớn tuổi | `#dien-giai-nguoi-lon-tuoi` |

Dùng HTML tĩnh và `details/summary` theo `DESIGN.md`; nội dung đã phát hành có sẵn khi tắt JavaScript. Giữ cấp tiêu đề rõ, chữ dễ đọc, điều khiển dùng được bằng bàn phím và liên kết chia sẻ tới đúng mục. Khi mở deep link, mục đích đến phải đọc được; liên kết nguồn mở đúng segment và không mất nội dung nếu người đọc đổi chế độ đối chiếu.

Không ép chọn nhóm tuổi trước khi vào bài. Không dùng màu sắc hoặc giọng trang trí để ngụ ý một bản “cao cấp” hơn bản khác. Mục chưa có bản đủ điều kiện ghi “Chưa có bản diễn giải đã duyệt”; không trưng văn nháp như nội dung hoàn chỉnh.

### 6.5. Tìm kiếm, xuất bản và giấy phép

- **Tìm kiếm giai đoạn đầu:** đặt khối diễn giải trong `data-pagefind-ignore`. Bốn bản kinh văn tiếp tục hoạt động như hiện tại. Cách này tránh đưa những từ chỉ có trong ví dụ mới vào kết quả người đọc có thể hiểu là kinh văn. Tìm kiếm diễn giải là bước sau, cần nhãn loại nội dung, nhóm độc giả và liên kết tới đúng bản; kiểm bằng từ khóa chỉ xuất hiện trong ví dụ.
- **Sách, EPUB và audio:** giữ pipeline hiện hành. Khi có yêu cầu xuất bản diễn giải, tạo đầu ra được nhận diện riêng; không tự ghép vào sách kinh hoặc lấy trạng thái audio kinh văn làm trạng thái audio diễn giải.
- **Giấy phép:** hai đường dẫn triển khai ở §6.2 nằm dưới `content/comment/vi/project` và `content/meta`, đã được khai báo trong `projectLicense.content.covers` của [lock hiện tại](../../source/suttacentral.lock.json) và [NOTICE](../../NOTICE). Diễn giải là nội dung bình giải mới của dự án; quy trình này giữ khai báo giấy phép hiện hành. Nguồn tham khảo giữ điều khoản và ghi công riêng; CC0 của dự án không áp dụng cho các tác phẩm ấy.

## 7. Quy trình biên soạn và kiểm tra chất lượng

### 7.1. Một vòng công việc cho một bài kinh

1. **Đọc nguồn:** xác nhận UID, pin và các tầng có thật; đọc toàn bài, chú thích và những bất đồng liên quan. Có thể dùng lệnh hiện hữu `npm run store -- <uid>`; đọc thêm bản Việt nguyên bài từ cơ chế tra cứu đã ghim khi phù hợp.
2. **Lập hồ sơ nghĩa:** chia các đơn vị nội dung, gắn căn cứ, xác định các điểm dễ làm sai. Bất định trọng yếu cần được phân xử trước khi dựa vào đó để viết chắc chắn.
3. **Soạn ba bản:** mỗi bản đi từ cùng hồ sơ nghĩa, chọn tình huống và nhịp viết riêng. Không làm mềm sự thật chỉ để có kết thúc an ủi.
4. **Review đối kháng về nghĩa:** một người hoặc agent khác thực hiện lượt kiểm, đối chiếu hai chiều giữa nguồn và từng bản, tìm lỗi thay vì bảo vệ bản thảo. Tác giả có thể tự kiểm trước, nhưng ghi đúng là tự kiểm; không gọi đó là kiểm độc lập. Lưu rõ người/công cụ, nguồn và phạm vi thực sự đã kiểm; nhiều agent đồng ý không tự chứng minh nghĩa đúng.
5. **Review tiếng Việt và lứa tuổi:** đọc thành tiếng; kiểm câu chữ, ví dụ, định kiến, giọng điệu và khả năng đọc độc lập. Sửa văn xong kiểm lại phần nghĩa bị tác động.
6. **Đọc thử trong pilot:** cho người thuộc nhóm mục tiêu đọc, nghe họ kể lại và ghi điều hiểu sai. Không thay phản hồi độc giả bằng điểm tự chấm của agent.
7. **Kiểm kỹ thuật và ghi kết quả:** kiểm dữ liệu, nguồn, hash, hiển thị và đường dẫn; lưu lịch sử thực tế, chọn bản đủ điều kiện phục vụ. Cập nhật tiến độ theo từng cặp UID/nhóm độc giả.

Agent có thể hỗ trợ soạn và kiểm theo quy định của kho. Không tự thêm một quy định bắt buộc mọi bài phải chờ người duyệt thủ công; trường hợp chưa phân xử được phải ghi rõ vấn đề cần chuyên môn. Thử với người đọc là phép kiểm của pilot, không phải sự phê chuẩn giáo nghĩa.

### 7.2. Rubric riêng cho diễn giải

Rubric riêng cho nội dung mới không thay rubric hoặc ngưỡng chấm bản dịch ở `docs/quality-assessments.md`. Theo yêu cầu triển khai, chấm 10 tiêu chí từ 0 đến 10, có nhận xét cụ thể cho từng điểm. Mã tiêu chí, mốc điểm và công thức nằm trong [quy trình chấm điểm](../modern-explanation-quality.md#4-rubric-10-tiêu-chí). Các câu hỏi dưới đây tiếp tục dùng khi rà soát.

| Tiêu chí | Câu hỏi nghiệm thu |
| --- | --- |
| Nguồn | Đúng bài, đúng phiên bản, mọi căn cứ đều kiểm lại được? |
| Trung thành | Có ý nào bị thêm, mất, đổi người nói, điều kiện, phủ định hoặc kết luận? |
| Độ phủ | Mọi đơn vị nội dung đều được xử lý; các nhánh và phần khó có bị bỏ? |
| Thuật ngữ | Người đọc hiểu được mà các phân biệt cần thiết vẫn còn? |
| Phân biệt các lớp | Nhận ra đâu là kinh, diễn giải, ví dụ mới và đề xuất thực hành? |
| Phù hợp độc giả | Ngôn ngữ, nhịp viết và tình huống có hợp nhóm này mà không định kiến? |
| Sức hấp dẫn và rõ ràng | Có lối vào cụ thể, mạch văn tự nhiên; tránh sáo ngữ và giảng giải vòng vo? |
| Hướng tu tập và giới hạn | Có giữ mục đích bài kinh, tránh lời hứa và cách ứng dụng làm sai nghĩa? |
| Trung thực biên tập | Ghi rõ bất định, giới hạn đối chiếu, người/công cụ thực sự làm? |
| Kỹ thuật | Nội dung, trạng thái, nguồn, link và hiển thị đã được kiểm trên đúng phiên bản? |

**Lỗi chặn phát hành:** sai nghĩa trọng yếu; thiếu một phần có ý nghĩa mà chưa xử lý; bịa nguồn/lời Phật; ví dụ dẫn đến kết luận ngược bài; bất định trọng yếu chưa giải quyết; nguồn hoặc đánh giá không còn hiện hành; dữ liệu/kiểm tra kỹ thuật áp dụng bị lỗi; chưa xác định được phạm vi quyền sử dụng cần thiết. Văn hay hoặc độ dễ đọc không bù được những lỗi này.

`published` cần trung bình thô ít nhất 9,0/10; từng tiêu chí nguồn, trung thành ngữ nghĩa, độ phủ và logic/ngữ cảnh đều ít nhất 9,0; không còn lỗi chặn và đánh giá còn hiệu lực. Điểm hoàn tất bài là điểm thấp nhất của ba bản. `chưa kiểm` là chưa có bằng chứng, không được quy thành đạt. Khi phát hiện lỗi sau phát hành, ngừng phục vụ bản lỗi như bản đã duyệt, lưu vấn đề, sửa và tạo lượt kiểm mới.

### 7.3. Kiểm khả năng hiểu bằng phản hồi thật

Khi tổ chức thử với độc giả thật, đề xuất ít nhất ba độc giả cho mỗi nhóm; với trẻ em có sự đồng ý của người chăm sóc, không thu thập thông tin cá nhân không cần thiết. Có thể chia các bài thành nhiều buổi ngắn. Đợt triển khai tuần tự hiện tại ghi riêng review biên tập và phản hồi độc giả; không ghi đã thử với người đọc khi việc đó chưa xảy ra, và không dùng điểm do agent chấm thay cho kết quả thử này.

Chuẩn bị ba câu hỏi từ hồ sơ nghĩa của từng bài, trước khi thử. Ghi kèm đáp án chấp nhận được: hai hoặc ba ý cốt lõi cần nghe thấy và ít nhất một hiểu sai trọng yếu cần phát hiện. Chấp nhận lời kể phù hợp lứa tuổi, không đòi đúng thuật ngữ hoặc nhớ UID/Pāli. Người thử có thể giúp thao tác mở nguồn khi cần, nhưng không gợi đáp án về nghĩa.

1. Bài kinh muốn làm rõ điều gì? Hãy nói lại bằng lời của mình.
2. Ví dụ hôm nay giúp hiểu điều gì; có điều gì không nên suy ra từ ví dụ?
3. Đâu là lời giải thích của người biên soạn? Nếu muốn kiểm lại ý này trong kinh, tìm ở đâu?

**Ngưỡng thử ban đầu:** với mỗi bản, ít nhất hai trong ba độc giả trả lời đúng cả ba câu hỏi cốt lõi mà không cần người thử giảng lại; bất kỳ hiểu sai nghiêm trọng nào do câu chữ gợi ra đều phải được sửa và thử lại. Đây là mốc đánh giá của hoạt động thử đọc, không phải bằng chứng thống kê về toàn bộ độc giả. Phản hồi cho thấy một hiểu sai trọng yếu phải làm bài quay lại bước sửa và đánh giá.

### 7.4. Kiểm kỹ thuật cần xây khi triển khai

- Cặp UID/nhóm độc giả hợp lệ và không trùng; chỉ nhận MN/DN trong phạm vi này.
- Tham chiếu thuộc đúng bài, trỏ đến segment thật; không dùng khoảng số giả định rằng mọi segment trung gian đều tồn tại.
- Hồ sơ nghĩa có đối chiếu độ phủ cho đủ ba bản; máy kiểm tính đầy đủ cấu trúc, reviewer kiểm nội dung.
- Trạng thái phát hành yêu cầu lượt kiểm khớp hash; thay nội dung/nguồn phải làm mất hiệu lực phù hợp, không ghi đè lịch sử.
- Trang có đủ ba anchor, nhãn và trạng thái đúng; thao tác bàn phím, no-JS, deep link, màn hình nhỏ và zoom hoạt động.
- Từ chỉ có trong ví dụ không lọt vào chỉ mục kinh văn; diễn giải không lọt vào sách/audio hiện hành.
- Không thay đổi translation JSON, UID, segment, provenance, điểm chất lượng hoặc coverage kinh văn chỉ vì thêm diễn giải.

Các kiểm tra mới nối vào validator/tests/CI qua `explanations:check`; `explanations:report` báo tiến độ từ catalog và những đánh giá hiện hành. Dùng các cổng `npm run validate`, `npm test`, `npm run check`; phần giao diện/build chạy thêm `npm run build`, `npm run design:check`, `npm run seo:check` và kiểm browser theo `DESIGN.md`. Viết xong tài liệu hoặc công cụ không đồng nghĩa các cổng đã được chạy hoặc đã đạt.

## 8. Lộ trình triển khai

**Cập nhật theo chỉ dẫn ngày 2026-10-18:** người dùng yêu cầu “don't need to check actions, just continue next 10 texts”. Vì vậy, tiếp tục các lô 10 bài, đối chiếu và chấm điểm từng bản, tạo PR và merge sau kiểm tra local; không kiểm tra hoặc chờ GitHub Actions. Báo cáo chỉ ghi những kết quả thực sự đã kiểm.

**Tiến độ khi đóng lô 19 (2026-10-19):** Đã có đủ ba bản được duyệt cho **186/186 bài, 558/558 bản** theo thứ tự kế hoạch. [Báo cáo lô 19 — DN29–DN34](../modern-explanations/batch-19-dn29-dn34.md) ghi điểm và phạm vi kiểm thực tế. Báo cáo CLI không có lỗi diễn giải; đánh giá hiện hành khớp nội dung và nguồn. Phạm vi 186 bài đã khép; [bảng điểm hoàn tất](../modern-explanations/completion-mn-dn.md) ghi đủ từng bài và liên kết tới 19 báo cáo lô.

| Chặng | Công việc và đầu ra | Điều kiện đi tiếp |
| --- | --- | --- |
| 1. Nền tảng và MN1 | Schema, rubric, nguồn, bản đồ ý và ba bản MN1; loader, review/hash, component và kiểm tra. | MN1 có đủ ba bản được đối chiếu và chấm riêng; cơ chế không tác động kinh văn. |
| 2. Lô đầu MN1–MN10 | Tiếp tục MN2 đến MN10, sửa sau review, lập bảng điểm; kiểm tra local và tạo PR. | Cả 10 bài hoàn tất, kiểm tra đúng nội dung thành công, merge PR. |
| 3. Tiếp tục Trung Bộ | Các lô kế tiếp giữ thứ tự catalog và cùng ngưỡng điểm. | Mỗi lô 10 bài đạt chuẩn được tạo PR, kiểm tra và merge. |
| 4. Chuyển sang Trường Bộ | Sau MN152 đến DN1; lô tại ranh giới hai bộ tiếp tục đủ 10 bài. | Không bỏ hoặc lặp bài; bài dài vẫn đủ mạch nghĩa và chia phần đọc phù hợp. |
| 5. Hoàn thiện DN34 | Tiếp tục theo thứ tự; lô cuối chứa số bài còn lại. | Đủ 186 bài và 558 bản hiện hành được kiểm từ catalog, các PR đã merge. |
| 6. Duy trì | Theo dõi thay đổi nguồn và phản hồi; sửa, duyệt lại, giữ lịch sử. | Báo cáo phản ánh phiên bản hiện hành và những bản đang cần rà soát. |

Quy mô lô là 10 bài theo yêu cầu; chất lượng từng bài không giảm để đạt số lượng. Không cam kết ngày hoàn tất 558 bản trước khi đo được công sức tạo ra một bản **đã đạt**. Ghi riêng việc đọc nguồn, soạn, review và sửa để theo dõi phần còn lại.

### 8.1. Thứ tự công việc trong lô đầu

- Chốt hồ sơ nghĩa MN1, trường dữ liệu, rubric số và cách ghi căn cứ; liệt kê những chỗ chưa phân xử.
- Viết đủ ba bản MN1, đối chiếu và sửa trong lượt review tách khỏi lượt soạn.
- Kiểm trang đọc, nguồn, trạng thái và hash; tiếp tục từng bài MN2–MN10 theo cùng quy trình.
- Lập báo cáo điểm thật của 10 bài; kiểm tra local, tạo PR rồi merge đúng commit đã kiểm.

Đây là thứ tự công việc, không phải hạn buộc xuất bản. **Thứ tự khởi đầu đã thực hiện:** lập hồ sơ nghĩa đầy đủ của MN1, sau đó viết ba bản từ hồ sơ ấy. Không bắt đầu bằng sinh hàng loạt 558 bản rồi mới tìm người kiểm.

### 8.2. Điều kiện tạm dừng mở rộng

Dừng tăng sản lượng để sửa nguyên nhân khi có lỗi nghĩa lặp qua nhiều bài, người đọc lẫn ví dụ với kinh văn, nguồn chưa xác minh được, hoặc số bản soạn mới vượt khả năng review đến mức tồn đọng tăng liên tiếp qua hai lô. Việc biên soạn bài khác có nguồn rõ vẫn có thể tiếp tục trong phạm vi kiểm soát được.

Khi phát hiện một lỗi có tính hệ thống, ghi quy tắc bị thiếu, tìm lại các bản có cùng mẫu lỗi và kiểm chúng trước; không chỉ sửa một câu được báo. Ưu tiên xử lý trong 24–48 giờ đầu việc ngừng phục vụ bản sai, lưu bằng chứng và xác định phạm vi ảnh hưởng; không hứa sửa xong mọi vấn đề khó trong khoảng đó.

## 9. Checklist hoàn tất và báo cáo tiến độ

### Một bài kinh hoàn tất

- [ ] Đúng UID MN/DN, hồ sơ nguồn đầy đủ và đã đọc toàn bài.
- [ ] Hồ sơ nghĩa bao quát mạch bài; mọi đơn vị nội dung được xử lý ở cả ba bản.
- [ ] Đủ ba bản độc lập, khác nhau thực chất về ngôn ngữ, ví dụ và cách dẫn dắt.
- [ ] Thuật ngữ, người nói, logic, điều kiện và hướng tu tập được giữ đúng.
- [ ] Ví dụ và ứng dụng mới có nhãn; không có lời Phật hoặc nguồn bị bịa.
- [ ] Mỗi bản có review hiện hành, không còn lỗi chặn; tiếng Việt đã được đọc lại sau sửa.
- [ ] Hiển thị, nhãn, nguồn, anchor và trạng thái được kiểm; không ảnh hưởng dữ liệu kinh văn.
- [ ] Tiến độ và lịch sử được cập nhật bằng kết quả có thật.

### Báo cáo cần trả lời được

Với từng bộ và từng nhóm độc giả: bao nhiêu bản chưa bắt đầu, `draft`, `review`, `published` còn hiện hành, hoặc đang cần rà soát theo nguồn mới? Bao nhiêu **bài kinh** đã có đủ ba bản hiện hành? Lỗi thường gặp là gì, lô sau sẽ thay đổi điều gì?

Giữ mẫu số toàn dự án là 186 bài/558 bản tại catalog hiện tại, đồng thời báo riêng phạm vi từng lô. Không coi tạo đủ file, đủ tiêu đề hoặc đủ số chữ là hoàn thành. Kết quả cần tích lũy là những bản diễn giải dễ đọc, có căn cứ, giúp từng nhóm độc giả hiểu đúng hơn và tự tìm về bài kinh.
