# Biên soạn và chấm điểm diễn giải hiện đại

Tài liệu này áp dụng riêng cho ba bản diễn giải theo nhóm độc giả của mỗi bài Trung Bộ và Trường Bộ. Đây là nội dung biên tập giúp đọc kinh, có nguồn để đối chiếu; điểm biên tập không phải chứng nhận chứng ngộ hoặc sự phê chuẩn của một chuyên gia Pāli độc lập.

## 1. Thứ tự và đơn vị hoàn tất

Thực hiện theo yêu cầu ngày 2026-10-18: `mn1` đến `mn152`, sau đó `dn1` đến `dn34`. Tên hiển thị có thể viết MN1 hoặc MN 1; UID và tên tệp luôn theo catalog, không đổi thành `mn01`.

Một bài hoàn tất khi ba bản `children`, `adults`, `older-adults` đều có nội dung đầy đủ, qua đối chiếu nguồn, có đánh giá còn hiệu lực và đạt ngưỡng xuất bản. Một bản đạt điểm cao không bù cho bản còn thiếu hoặc sai nghĩa.

Mỗi lô gồm 10 bài liên tiếp trong thứ tự này. Sau khi đối chiếu, chấm điểm và kiểm tra local, tạo PR rồi merge đúng nội dung đã kiểm. Theo chỉ dẫn bổ sung của người dùng ngày 2026-10-18 (“don't need to check actions, just continue next 10 texts”), công việc này không kiểm tra hoặc chờ GitHub Actions. Tại ranh giới hai bộ, lô tiếp tục từ MN152 sang DN1, không bỏ hoặc đảo bài. Lô cuối chứa số bài còn lại. Phần nền tảng kỹ thuật đi cùng lô đầu; việc thêm công cụ tự nó không được tính là đã hoàn thành một bài.

## 2. Ba nhóm độc giả

| Nhóm | Cách viết và ví dụ | Điều cần bảo vệ |
| --- | --- | --- |
| Trẻ em | Câu ngắn, sự việc cụ thể, gia đình, bạn bè, học tập, chơi và chia sẻ. Giải nghĩa từ khó ngay khi dùng. Có thể chia bài dài thành nhiều đoạn để đọc cùng người lớn. | Trẻ có thể quan sát, đặt câu hỏi và nhận lỗi. Không biến giáo pháp thành yêu cầu phục tùng người lớn, đe dọa bằng nghiệp hoặc hứa phần thưởng. |
| Người trưởng thành | Lập luận rõ, liên hệ công việc, quan hệ, trách nhiệm, lựa chọn và áp lực đời sống. | Giữ mục tiêu tu tập và giải thoát của kinh; không thu hẹp thành mẹo tăng năng suất, thành công hay kiểm soát người khác. |
| Người lớn tuổi | Nhịp đọc thong thả, đoạn vừa phải, ví dụ về kinh nghiệm, quan hệ giữa các thế hệ, thay đổi vai trò và nếp sống. | Tôn trọng khả năng suy xét và quyền chủ động; không mặc định mọi người đều yếu, bệnh, cô đơn hoặc sắp chết. Không gọi là “ngoan”, không lên giọng dạy trẻ. |

Đây là định hướng biên tập, không phải phép phân loại năng lực theo tuổi. Mỗi người được tự chọn bản dễ đọc nhất. Ba bản phải cùng bảo toàn các ý và quan hệ lập luận của bài kinh; thay từ đồng nghĩa hoặc đổi nhân vật trong một khuôn văn chưa tạo thành ba bản phù hợp.

## 3. Hồ sơ nguồn và bản đồ ý

Trước khi viết, đọc toàn bài Pāli tại commit khóa trong `source/suttacentral.lock.json`, bản Việt của dự án và các bản tham khảo liên quan. Dùng `source/upstream-manifest.json` để xác minh Pāli thực sự thuộc snapshot được khóa. English và Việt tham khảo giúp kiểm tra cách hiểu; Pāli là thẩm quyền cuối cùng theo `AGENTS.md` và `skill/translation.md`.

Mỗi hồ sơ ghi đường dẫn, SHA-256 của nội dung đã đọc và commit xuất xứ nếu có. Ghi đúng những nguồn thực sự dùng, kể cả chú giải hoặc chú thích khi một lựa chọn diễn giải dựa vào chúng. Không ghi đã đối chiếu một nguồn chỉ vì nguồn ấy có trong kho. Bản Thích Minh Châu dạng HTML là toàn văn tham khảo, không tự tạo sự tương ứng segment mà nguồn không cung cấp.

Bản đồ ý gồm các đơn vị có mã riêng, tiêu đề, các segment Pāli thực và diễn đạt ngắn điều phải giữ. Các đơn vị phải bao phủ toàn bộ khóa của bài, kể cả phần dẫn, đối thoại, những nhánh điều kiện, phủ định, đoạn lặp, đoạn kết và nhãn của ấn bản. Nhãn biên tập được nhận diện là nhãn, không gán thành lời Phật. Có thể gộp một công thức lặp khi ghi đầy đủ các đối tượng và chỉ rõ những thay đổi có ý nghĩa.

Trong mỗi bản diễn giải, các phần giảng ý hoặc làm rõ phải cùng bao phủ toàn bộ bản đồ. Một ví dụ đời sống có dẫn mã ý không thay thế phần giải thích ý đó. Liên kết đủ segment chỉ chứng minh sự hiện diện trong cấu trúc; người đánh giá vẫn phải đọc để kiểm xem lời diễn giải có thật sự giữ ý hay không.

Không điền một khoảng trống hoặc dấu lược trong bản tham khảo bằng phỏng đoán rồi gọi là đã đối chiếu. Khi có bất đồng dịch thuật, ghi lựa chọn và giới hạn của lựa chọn. Không bịa lời nói, động cơ nhân vật, kết quả thực hành hay một sự kiện trong bối cảnh kinh.

## 4. Rubric 10 tiêu chí

Chấm từng tiêu chí từ 0 đến 10, có thể dùng một chữ số thập phân. Chưa đọc hoặc chưa kiểm tra thì chưa chấm, không điền điểm mặc định. Mỗi điểm phải có nhận xét nêu căn cứ cụ thể và giới hạn còn lại. Đặc biệt, lời nhận xét không được tuyên bố “đã thử với người đọc” nếu chưa thực sự làm việc đó.

| Mã | Tiêu chí | Căn cứ cần kiểm |
| --- | --- | --- |
| `source_fidelity` | Nguồn và khả năng đối chiếu | Đúng bài, đúng snapshot, đúng diễn giả, những đoạn được viện dẫn tồn tại; nêu trung thực khoảng trống hoặc khác biệt của nguồn phụ. |
| `semantic_fidelity` | Trung thành với ý nghĩa | Giữ điều kinh khẳng định và không khẳng định; không đưa quan niệm hiện đại vào miệng Phật hoặc biến giải thoát thành thành công đời thường. |
| `core_coverage` | Bao quát toàn bài | Đủ bối cảnh, các phần triển khai, điều kiện, danh mục có ý nghĩa, đoạn lặp có biến đổi và kết luận. Không chỉ kể một thông điệp nổi bật. |
| `logic_context` | Lập luận và ngữ cảnh | Đúng chủ thể, quan hệ nhân quả, mức độ, phạm vi, phủ định; phân biệt lời khuyên với mô tả thành tựu, lời đối thoại với kết luận của người kể. |
| `terminology` | Thuật ngữ | Dùng nhất quán, giải nghĩa theo bài, giữ khác biệt cần thiết; không ép một thuật ngữ khó vào từ hiện đại quá hẹp. |
| `audience_fit` | Phù hợp người đọc | Ngôn ngữ, nhịp, tình huống và mức giải thích phù hợp nhóm đã chọn, không định kiến theo tuổi. |
| `clarity` | Rõ và cuốn hút | Người đọc theo được tiến trình, đoạn văn có trọng tâm, ví dụ làm sáng ý; tránh vừa khó hiểu vừa lặp dài hoặc lời dẫn sáo rỗng. |
| `editorial_separation` | Phân biệt kinh và lời biên tập | Ví dụ, lời giải nghĩa có tính lựa chọn và gợi ý thực hành được nhận diện; trích dẫn nếu có đúng nguồn và không dùng dấu ngoặc kép để giả làm lời kinh. |
| `practical_integrity` | Liên hệ đời sống có chừng mực | Liên hệ đúng ý và vừa sức; không hứa chứng đắc, chữa bệnh hoặc kết quả chắc chắn; không biến lời dạy dành cho một bối cảnh thành chỉ thị áp dụng máy móc cho mọi người. |
| `technical_integrity` | Tính toàn vẹn của bản ghi | Đủ cấu trúc, Unicode, mã ý, tác giả, đường dẫn và liên kết nguồn; công cụ kiểm tra xác nhận hash và trạng thái phù hợp. Tiêu chí này không thay cho kiểm tra build của PR. |

### Mốc chấm chung

| Điểm | Cách hiểu |
| --- | --- |
| Chưa chấm | Chưa có đủ đối chiếu hoặc bằng chứng để kết luận; không suy ra là 0 và không được xuất bản. |
| 0–3 | Thiếu nghiêm trọng hoặc mâu thuẫn căn bản với yêu cầu của tiêu chí. |
| 4–6 | Có phần đúng nhưng còn nhiều lỗi hoặc khoảng trống ảnh hưởng cách hiểu. |
| 7–7,9 | Có nền tảng; còn điểm yếu đáng kể cần sửa trước khi duyệt. |
| 8–8,9 | Khá rõ và phần lớn đúng; còn thiếu sót cụ thể cần giải quyết để đạt chuẩn. |
| 9–9,4 | Đạt tiêu chí, có căn cứ; giới hạn còn lại nhỏ và đã nêu rõ. |
| 9,5–9,9 | Đáp ứng rất vững, những chỗ khó đã được kiểm tra và xử lý rõ ràng. |
| 10 | Không tìm thấy khuyết điểm đối với tiêu chí trong phạm vi kiểm tra đã ghi; không đồng nghĩa với tính đúng tuyệt đối hoặc quyền miễn đánh giá lại. |

Không nâng điểm chỉ để đủ lô. Hai người đánh giá có thể bất đồng; ghi lý do, sửa chỗ chưa chắc và đánh giá lại. Nếu tác giả và người kiểm đều là tác tử của cùng một công cụ, ghi trung thực điều đó. Sự đồng thuận của tác tử không tự chứng minh bản diễn giải đúng.

## 5. Công thức và điều kiện xuất bản

Điểm một bản là trung bình số học của 10 tiêu chí, không làm tròn trước khi xét ngưỡng. Khi xét ngưỡng, so sánh chính xác các giá trị thập phân đã nhập để sai số cộng số thực không đẩy điểm đúng 9,0 xuống dưới ngưỡng; điểm thực sự dưới 9,0 vẫn không đạt. Bản đạt chuẩn khi đồng thời:

1. Điểm trung bình ít nhất **9,0/10**.
2. Bốn tiêu chí `source_fidelity`, `semantic_fidelity`, `core_coverage`, `logic_context` đều ít nhất **9,0/10**.
3. Không còn lỗi chặn phát hành.
4. Đánh giá gắn với đúng nội dung, đúng bản đồ ý và đúng các nguồn hiện hành; kiểm tra cấu trúc thành công.

Điểm hoàn tất bài kinh là **điểm thấp nhất trong ba bản**. Có thể hiển thị thêm từng điểm để người đọc thấy khác biệt. Không tính điểm hoàn tất khi bất kỳ bản nào còn thiếu, chưa duyệt hoặc đánh giá đã hết hiệu lực. Không dùng một trung bình chung của cả ba để che một bản yếu.

Các lỗi chặn gồm: sai nghĩa; đảo phủ định; nhầm chủ thể; thiếu phần chính; thêm lời hoặc sự kiện như thể thuộc kinh; sai nguồn; làm mất điều kiện; gán thành tựu tu tập cho một hoạt động đơn giản; hoặc một ví dụ khiến người đọc hiểu ngược điều kinh dạy. Lỗi chặn thắng điểm số: 9,8 vẫn chưa được xuất bản nếu còn một lỗi như vậy.

Các trạng thái biên tập là `draft`, `review`, `published`. Bộ tải tính thêm trạng thái `stale` khi nội dung hoặc nguồn khác với lần duyệt. Khi chưa có đánh giá, giữ điểm trống. Điểm do máy kiểm tra cấu trúc không được dùng để tự tạo điểm đúng nghĩa.

## 6. Nội dung, đánh giá và thay đổi nguồn

Nội dung lưu tại:

```text
content/comment/vi/project/explanations/sutta/<collection>/<uid>.json
```

Hồ sơ trạng thái và lịch sử đánh giá lưu tại:

```text
content/meta/explanations/sutta/<collection>/<uid>.json
```

Namespace diễn giải riêng nằm trong phạm vi nội dung biên tập của dự án đã được khai báo giấy phép. Nó không phải bản dịch segment và không thay thế các tệp `*_comment-vi-project.json`. JSON có cấu trúc giúp hiển thị đoạn văn như văn bản thuần và kiểm tra mã ý, nhãn ví dụ, tác giả. Đây là cách triển khai cụ thể thay cho bố cục YAML/Markdown dự kiến trong kế hoạch ban đầu.

Hash dùng để duyệt gồm bản đồ ý, nội dung của đúng nhóm độc giả và những phụ thuộc nguồn thực sự đã dùng. Nó không chứa trạng thái, mã lần duyệt hoặc thời điểm duyệt, vì thay đổi các trường đó không được tự làm mất hiệu lực chính lần duyệt. Commit nguồn dùng để truy nguyên; một commit không liên quan hoặc việc khóa lại cùng nội dung nguồn không tự làm tất cả bài mất duyệt. Thay đổi byte nguồn liên quan, bản đồ ý hoặc lời diễn giải phải yêu cầu đánh giá lại.

Ghi công tác giả và người đánh giá bằng ID trong `source/tooling.yaml`. Không sửa ghi công các bản dịch hoặc đánh giá trước đây. Một điểm mới chỉ đánh giá diễn giải mới, không tự nâng trạng thái bản dịch kinh văn.

## 7. Quy trình cho từng bài

1. Đọc toàn bài và xác minh các nguồn đã khóa. Lập bản đồ ý với segment thật.
2. Viết ba bản đầy đủ, dùng cùng bản đồ nhưng có cách diễn đạt phù hợp từng nhóm. Đánh dấu ví dụ và gợi ý biên tập.
3. Đối chiếu ngược từ mỗi phần diễn giải về nguồn; kiểm cả ý bị bỏ, ý bị thêm và những chỗ có nhiều cách dịch.
4. Đọc từng bản như một người đọc mới: từ khó đã được giải thích chưa, ví dụ có rõ chưa, đoạn sau có nối được đoạn trước không. Ghi rõ đây là lượt đọc biên tập, nếu chưa có người đọc thật tham gia.
5. Chấm riêng 10 tiêu chí, ghi căn cứ và lỗi chặn. Sửa rồi tạo lần đánh giá mới nếu chưa đạt; giữ lịch sử cần thiết.
6. Chạy công cụ kiểm tra. Chỉ chuyển sang xuất bản khi đánh giá còn hiệu lực và mọi điều kiện đạt.
7. Ghi kết quả vào báo cáo của lô, tiếp tục bài kế tiếp.

## 8. Cổng kiểm tra của lô và PR

Mỗi lô phải có đủ các bài theo thứ tự, mỗi bài đủ ba bản đã duyệt. Kiểm tra dữ liệu diễn giải được tích hợp vào validation của dự án. Giữ các kiểm tra nội dung và local phù hợp được quy định trong `AGENTS.md`; thay đổi giao diện phải có kiểm tra thực tế trang, thao tác bàn phím và màn hình hẹp. Chỉ dẫn bổ sung ở mục 1 bỏ việc kiểm tra và chờ GitHub Actions, không bỏ việc đối chiếu nguồn hoặc chấm điểm.

PR cần nêu phạm vi bài, điểm của ba nhóm và điểm thấp nhất của mỗi bài, những quyết định diễn giải đáng chú ý, nguồn và giới hạn của lượt đánh giá, cùng kết quả kiểm tra thực tế. Phân biệt rõ kiểm tra thành công, bị bỏ qua và chưa chạy; không ghi GitHub Actions đã đạt khi không kiểm tra. Merge đúng commit đã kiểm tra; nếu commit thay đổi, kiểm tra lại phần liên quan.

Theo dõi bằng nội dung và lịch sử đánh giá trong kho cùng PR đã merge. Bài chưa làm không được xuất bản bằng văn mẫu, mô tả chờ hoặc điểm ước lượng. Nếu nguồn, quyền truy cập hoặc lỗi kiểm tra nội dung/local chặn tiến độ, ghi bài/lô đang dừng và lý do cụ thể để tiếp tục đúng chỗ.

## Tài liệu liên quan

- [Kế hoạch diễn giải theo ba nhóm độc giả](plan/mordern-explaination.md)
- [Báo cáo lô 01 — MN1–MN10](modern-explanations/batch-01-mn1-mn10.md)
- [Báo cáo lô 02 — MN11–MN20](modern-explanations/batch-02-mn11-mn20.md)
- [Báo cáo lô 03 — MN21–MN30](modern-explanations/batch-03-mn21-mn30.md)
- [Báo cáo lô 04 — MN31–MN40](modern-explanations/batch-04-mn31-mn40.md)
- [Báo cáo lô 05 — MN41–MN50](modern-explanations/batch-05-mn41-mn50.md)
- [Báo cáo lô 06 — MN51–MN60](modern-explanations/batch-06-mn51-mn60.md)
- [Báo cáo lô 07 — MN61–MN70](modern-explanations/batch-07-mn61-mn70.md)
- [Báo cáo lô 08 — MN71–MN80](modern-explanations/batch-08-mn71-mn80.md)
- [Báo cáo lô 09 — MN81–MN90](modern-explanations/batch-09-mn81-mn90.md)
- [Báo cáo lô 10 — MN91–MN100](modern-explanations/batch-10-mn91-mn100.md)
- [Báo cáo lô 11 — MN101–MN110](modern-explanations/batch-11-mn101-mn110.md)
- [Báo cáo lô 12 — MN111–MN120](modern-explanations/batch-12-mn111-mn120.md)
- [Báo cáo lô 13 — MN121–MN130](modern-explanations/batch-13-mn121-mn130.md)
- [Báo cáo lô 14 — MN131–MN140](modern-explanations/batch-14-mn131-mn140.md)
- [Hướng dẫn đóng góp](../AGENTS.md)
- [Quy trình dịch và đối chiếu nguồn](../skill/translation.md)
- [Đánh giá bản dịch và tóm tắt hiện có](quality-assessments.md)
- [Nguồn được khóa](../source/suttacentral.lock.json)
- [Khai báo công cụ](../source/tooling.yaml)
- [Báo cáo lô 15 — MN141–MN150](modern-explanations/batch-15-mn141-mn150.md)
- [Báo cáo lô 16 — MN151–MN152 và DN1–DN8](modern-explanations/batch-16-mn151-mn152-dn1-dn8.md)
- [Báo cáo lô 17 — DN9–DN18](modern-explanations/batch-17-dn9-dn18.md)
- [Báo cáo lô 18 — DN19–DN28](modern-explanations/batch-18-dn19-dn28.md)
- [Báo cáo lô 19 — DN29–DN34](modern-explanations/batch-19-dn29-dn34.md)
- [Bảng điểm hoàn tất 186 bài — Trung Bộ và Trường Bộ](modern-explanations/completion-mn-dn.md)
