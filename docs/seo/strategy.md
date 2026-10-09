# SEO/GEO và liên kết giới thiệu — 2026-10-09

## Định vị và giới hạn bằng chứng

Kinh Tạng Pāli Việt là dự án dịch và tra cứu, với Pāli đã ghim làm nguồn chuẩn, đối chiếu từng segment và lịch sử biên tập công khai. Không tuyên bố bản dịch hoàn thiện, được giới học thuật chứng nhận, hoặc ưu việt hơn bản của các dịch giả khác.

Đã kiểm tra mã nguồn: trước thay đổi thiếu canonical, metadata chia sẻ và sitemap; hai CTA trang chủ bỏ base path. HTTP kiểm tra ngày 2026-10-09: trang chủ production trả 200, /robots.txt ở gốc host trả 404. Truy vấn web theo URL và tên site ngày 2026-10-09 không trả trang của dự án; đây không phải Search Console và không chứng minh site chưa được index. Chưa có quyền truy cập Search Console, dữ liệu backlink, CWV thực địa hay bằng chứng site production đã nhận thay đổi. Không có baseline traffic, số referring domains hoặc điểm DA/DR. Không gán điểm tổng SEO/GEO khi các dữ liệu đó còn thiếu.

Google xác nhận SEO nền tảng vẫn áp dụng cho AI Search; không có schema GEO riêng hoặc yêu cầu llms.txt:
https://developers.google.com/search/docs/appearance/ai-features
Liên kết nhằm thao túng thứ hạng vi phạm chính sách:
https://developers.google.com/search/docs/essentials/spam-policies

## Đã triển khai

- Canonical tuyệt đối từ Astro site + pathname, bỏ query/fragment.
- WebPage/WebSite JSON-LD khớp tiêu đề, mô tả và ngôn ngữ hiển thị. Không gán toàn bộ bốn bản cho một tác giả hay một giấy phép.
- Open Graph, Twitter summary và mô tả theo UID, tên bài, bộ kinh, trạng thái bản dịch.
- Sitemap sinh từ catalog, gồm trang tra cứu ngay cả khi bản Việt dự án chưa bắt đầu: trang vẫn có giá trị nguồn đối chiếu, trạng thái phải nói rõ. Không liệt kê tìm kiếm nội bộ.
- Search noindex,follow; sửa CTA dùng base path.

GitHub Pages phục vụ project dưới /kinh-tang-pali/. robots.txt có hiệu lực ở gốc host, nên file /kinh-tang-pali/robots.txt không điều khiển crawler. Cần quản trị repo host streamentry.github.io để kiểm tra robots.txt và thêm dòng Sitemap: https://streamentry.github.io/kinh-tang-pali/sitemap.xml. Không chặn /search/ bằng robots vì crawler cần đọc noindex.

## Tài sản đáng được trích dẫn

Ưu tiên trang bài cụ thể, đoạn có ID ổn định, trang nguồn /credits/ và lịch sử chất lượng /quality/. Khi trích dẫn ghi UID, segment ID, phiên bản/người dịch, trạng thái và ngày truy cập. Liên kết tới fragment dạng #mn118:1.1 khi đoạn đó thật sự tồn tại. Bản dự án và bản tham khảo phải được phân biệt; giấy phép kiểm tra tại /notice.txt. Không xuất toàn bộ văn bản bên thứ ba thành asset quảng bá.

Phản đối mạnh nhất: thêm metadata không tạo nhu cầu đọc, và một bản dịch có AI hỗ trợ có thể chưa được cộng đồng tin cậy. Vì vậy vòng tăng trưởng bắt đầu bằng phản hồi về một bài và tính hữu ích của đối chiếu, không bắt đầu bằng số backlink.

## Thử nghiệm 7 ngày

1. Sau khi release: kiểm tra homepage, một trang mỗi bộ, sitemap, canonical và query variants trên production. Xác minh Search Console URL-prefix property và nộp sitemap; lưu ngày cùng trạng thái xử lý. Chỉ chủ sở hữu thực hiện bước cần quyền tài khoản.
2. Chọn ba bài đã published, kiểm tra trên web đủ nguồn, trạng thái và neo đoạn. Nhờ hai người đọc kinh đánh giá khả năng tra cứu và lỗi ghi công trước khi giới thiệu rộng.
3. Chuẩn bị năm đề nghị cá nhân hóa cho người quản trị thư viện/nhóm đọc kinh phù hợp. Chỉ gửi sau khi người biên tập duyệt đối tượng và thông điệp. Một follow-up sau 7–10 ngày, dừng nếu không được phản hồi.

Ngưỡng thử nghiệm (mục tiêu, không phải dự báo): 100% URL mẫu trả 200, canonical đúng base, mọi URL sitemap có trang; sau năm đề nghị cần ít nhất hai phản hồi có nội dung hoặc một nhóm dùng thử. Nếu không có phản hồi, sửa đề nghị/đối tượng thay vì tăng số lượng. Sau 30 ngày ghi impressions, clicks, indexed URLs, referral visits và liên kết thực được xác minh; không xem ít clicks là thất bại khi chưa có impressions.

Rủi ro: phổ biến bản nháp như kinh văn đã chốt; cộng đồng hiểu nhầm AI là thẩm quyền; liên kết gắn sai tác giả; hàng nghìn trang khiến crawl phân tán. Theo dõi indexing theo bộ và trạng thái trước khi cân nhắc giảm sitemap. Không tự noindex toàn corpus thiếu bản Việt nếu trang còn nguồn hữu ích.

## Prospect shortlist

Đây là ứng viên nghiên cứu, không phải đối tác hay backlink đã có. Không có contact/email được xác minh.

| Nơi | Bằng chứng/đường dẫn | Đề nghị và điều kiện |
| --- | --- | --- |
| **VRI / Tipitaka.org** | [Other Resources](https://www.tipitaka.org/other-resources) — danh sách có SuttaCentral và nhiều công cụ tra cứu; trang công khai mời gửi tài nguyên hữu ích tới `help@tipitaka.org`. Kiểm tra 2026-10-09. | **Ưu tiên 1.** Gửi mô tả ngắn, nêu rõ dự án Việt ngữ đang phát triển và phân biệt bản tham khảo. Đây là đề nghị vào danh sách tài nguyên, không xin bảo chứng. |
| **BuddhaNet** | [Web Links](https://www.buddhanet.net/resources/) và [Theravadan Websites](https://www.buddhanet.net/l_thera/) — có phân mục nguồn Phật học; trang Theravada mời gửi mô tả khoảng 50 từ tới `webmaster@buddhanet.net`. Kiểm tra 2026-10-09. | **Ưu tiên 2.** Dùng mô tả 50 từ bên dưới; xác minh trang gửi vẫn hoạt động trước khi gửi. |
| Dhamma.Gift | [Multi-Tool resource guide](https://dhamma.gift/assets/common/multiTool.html) — danh mục có Pāli readers, SuttaCentral và công cụ nghiên cứu. Kiểm tra 2026-10-09. | Xin xem xét như một tài nguyên đọc Pāli–Việt; tìm kênh đóng góp trước. Không giả định họ nhận đề xuất. |
| E-Piṭaka | [Bản tải Tipiṭaka tiếng Việt](https://epitaka.org/en/download) — phát hành Pāli và bản dịch theo dòng, gồm pack Vietnamese; trang nêu rõ CC-BY-4.0 cho bản dịch của họ. Kiểm tra 2026-10-09. | Đối tượng trùng một phần và sản phẩm đã đầy đủ hơn; chỉ đề nghị liên kết phương pháp/đối chiếu nếu giúp độc giả, không quảng bá là thay thế hay tương đương. |
| BuddhaSasana | [Mục lục nguồn Việt](https://www.budsas.org/uni/) — thư viện đang lưu kinh Việt và ghi tên dịch giả theo bộ. Kiểm tra 2026-10-09. | Xin nhận xét công cụ đối chiếu; chỉ đề nghị đưa vào tài nguyên nếu quản trị thấy hữu ích. Không đề nghị thay thế bản HT. Thích Minh Châu. |
| Viện Nghiên cứu Phật học Việt Nam | [Trang Kinh tạng Pāli](https://vncphvn.com/tam-tang/tang-pali/kinh-pali) và [phụ lục đối chiếu](https://vncphvn.com/sutra/SV/phu-luc-1) — tổ chức có trách nhiệm biên tập, trang nêu hệ số CST hỗ trợ đối chiếu nhiều ngôn ngữ. Kiểm tra 2026-10-09. | **Ưu tiên 3, xin đánh giá nội dung trước.** Có thể đề nghị góp ý cách ghi edition/UID và trạng thái dự án. Chỉ hỏi bổ sung vào thư mục tài nguyên khi có trang phù hợp; không ngụ ý viện ủng hộ. Liên hệ công khai trên site: `vncphvn.info@gmail.com`. |
| Theravāda.vn / Thư viện Hoa Sen | [Sơ đồ Tam tạng và tài liệu học](https://theravada.vn/so-do-kinh-diem-tam-tang-pali-tipi%E1%B9%ADaka/) và [sổ tay mục lục](https://thuvienhoasen.org/p15a36833/2/so-tay-muc-luc-tam-tang-pali) đã xuất hiện trong tìm kiếm. Kiểm tra 2026-10-09. | Tệp có liên quan nhưng chưa xác nhận có cổng nhận nguồn ngoài. Trước hết đọc kỹ và ghi một góp ý hữu ích; không gửi link unsolicited. |
| Inti Dharma, OpenTipitaka, WikiDhamma | [Inti library](https://dharma.inti.foundation/thu-vien-kinh), [OpenTipitaka](https://www.opentipitaka.org/vi), [WikiDhamma](https://wikidhamma.com/) — đều có tính năng đọc kinh Pāli–Việt hoặc corpus rộng. Kiểm tra 2026-10-09. | Các sản phẩm gần kề/đối tượng trùng; không ưu tiên xin link. Có thể xin góp ý phương pháp khi có quan hệ phù hợp, hoặc cùng liên kết tài nguyên nếu lợi ích cho người đọc rõ ràng. |

## Mẫu đề nghị để duyệt, chưa gửi

“Tôi đang biên tập Kinh Tạng Pāli Việt, một công cụ đọc đối chiếu Pāli và các bản dịch theo từng đoạn. Bản Việt mới có trạng thái và lịch sử kiểm tra công khai; dự án có AI hỗ trợ, còn Pāli là nguồn chuẩn. Tôi thấy trang [tài nguyên cụ thể] của quý vị phục vụ [nhu cầu cụ thể]. Xin quý vị thử [URL bài đã kiểm tra] và cho biết công cụ có giúp tra cứu hay có lỗi nguồn/ghi công nào cần sửa. Nếu thấy phù hợp, quý vị có thể giới thiệu như một tài nguyên đối chiếu đang biên tập. Không cần đặt liên kết nếu chưa thấy hữu ích.”

Theo dõi từng đề nghị: URL prospect, bằng chứng phù hợp, ngày kiểm tra, người duyệt, ngày gửi, phản hồi, URL backlink thật, ngày xác minh. Không mua link, trao đổi link bắt buộc, tạo tài khoản hàng loạt hoặc đăng Wikipedia để tự quảng bá.

## Kiểm chứng local

- `npm test`: 378 pass, không skip.
- `npm run validate`: pass, 1.839 cảnh báo cache nguồn tham khảo; không coi đây là store coverage đầy đủ.
- `npm run check`: 0 errors, 0 warnings; 5 hints có sẵn.
- Astro build trực tiếp: 6.146 trang; Pagefind lập chỉ mục 6.137 trang.
- `npm run seo:check`: 6.145 URL indexable khớp HTML và sitemap, canonical/metadata/JSON-LD/base links pass.
- `npm run build`: pass toàn pipeline sync + validate + Astro + Pagefind. `source:sync --manifest`: đối soát 10.093 file của bốn edition, không cần tải thêm. Chưa có hosted CI hoặc release của patch.


### Mô tả 50 từ cho directory tiếng Anh

> An independent, Vietnamese-first Pāli Canon reader focused on Majjhima Nikāya. It aligns pinned Mahāsaṅgīti Pāli text with English and Vietnamese references by Bilara segment ID. The project's Vietnamese translation is labelled by editorial status, with source, translator and licence details shown. Work is ongoing; Pāli remains authoritative when references differ.

Mô tả này nói rõ giới hạn phạm vi, không tự gọi dự án là đầy đủ, học thuật hoặc được chứng thực. Mô tả có đúng 50 từ theo quy ước tách bằng khoảng trắng.


### Tín hiệu index hiện có

Truy vấn tìm kiếm web ngày 2026-10-09 cho URL chính xác và tên dự án không trả trang kinh-tang-pali; nó trả các nguồn Tam tạng Pāli–Việt khác. Không thể suy ra deindexation vì loại truy vấn, coverage và thời gian cập nhật của search tool không được biết. Sau khi có quyền Search Console, URL Inspection và Page indexing là nguồn xác minh; theo dõi indexed pages, impressions và query data trước khi đổi nội dung hàng loạt.

### Hai thư đề nghị cụ thể — bản nháp, chưa gửi

**VRI / Tipitaka.org** — gửi `help@tipitaka.org` theo lời mời ở [Other Resources](https://www.tipitaka.org/other-resources).

Subject: Resource suggestion for the Pāli Tipiṭaka “Other Resources” page

> Hello VRI team,
>
> Would you consider adding the Kinh Tạng Pāli Việt reader (https://streamentry.github.io/kinh-tang-pali/) to your Other Resources page? It is an independent, Vietnamese-first reader focused on the Majjhima Nikāya. Its pinned Mahāsaṅgīti Pāli text is aligned with available references by Bilara segment ID; the project’s Vietnamese translation carries an editorial status and source details. The project is ongoing and does not claim VRI endorsement.
>
> If this resource does not fit your list, no reply is needed. Thank you for maintaining these Tipiṭaka resources.

**BuddhaNet** — gửi `webmaster@buddhanet.net` theo chỉ dẫn [Theravadan Websites](https://www.buddhanet.net/l_thera/); giữ mô tả đúng 50 từ.

Subject: Vietnamese Pāli Canon reader for BuddhaNet’s Theravada links

> An independent, Vietnamese-first Pāli Canon reader focused on Majjhima Nikāya. It aligns pinned Mahāsaṅgīti Pāli text with English and Vietnamese references by Bilara segment ID. The project’s Vietnamese translation is labelled by editorial status, with source, translator and licence details shown. Work is ongoing; Pāli remains authoritative when references differ.

> URL: https://streamentry.github.io/kinh-tang-pali/

Chỉ gửi sau khi production đã trả sitemap 200, có URL mẫu hoạt động, và người biên tập duyệt hai bản nháp. Ghi lại phản hồi; không follow-up nếu directory từ chối.
