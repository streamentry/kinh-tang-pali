# Sơ đồ trang và tìm kiếm

Build tạo `sitemap.xml` làm sitemap index, trỏ tới `sitemap-pages.xml` và một
sitemap cho từng bộ DN, MN, SN, AN, KN. Các tệp nằm tại cùng thư mục gốc của
site; URL tuyệt đối lấy từ `site` và `base` trong `astro.config.mjs`. Địa chỉ
để gửi trong Google Search Console là:

https://streamentry.github.io/kinh-tang-pali/sitemap.xml

Sitemap liệt kê trang canonical có thể lập chỉ mục, kể cả các bài có bản dịch
đang biên tập. Trang tìm kiếm và trang đọc liên tục được đánh dấu `noindex` và
không nằm trong sitemap. Sitemap không bảo đảm trang được thu thập, lập chỉ mục,
xếp hạng hay được công cụ AI trích dẫn.

Không phát sinh `lastmod` từ thời điểm build: ngày đó không chứng minh nội dung
trang đã thay đổi đáng kể. Chỉ thêm trường này khi có nguồn ngày thay đổi chính
xác và ổn định cho từng trang. Không dùng `priority` hay `changefreq` như tín
hiệu xếp hạng.

GitHub Pages hiện đặt dự án dưới `/kinh-tang-pali/` trên một hostname dùng chung.
`robots.txt` chỉ có hiệu lực ở gốc hostname, nên một tệp tại thư mục dự án không
thể khai báo sitemap cho crawler. Gửi sitemap index trực tiếp qua Search Console;
nếu chuyển sang tên miền riêng, có thể khai báo URL index trong `/robots.txt`
của tên miền đó sau khi xác minh cấu hình triển khai.

Sau build, `npm run seo:check` phân tích XML, kiểm tra giới hạn sitemap, URL trùng,
phạm vi URL và đối chiếu toàn bộ sitemap với HTML indexable cùng canonical. CI
và workflow triển khai đều chạy kiểm tra này. Xem thêm [hướng dẫn sitemap của
Google](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
và [hướng dẫn AI trong Search](https://developers.google.com/search/docs/appearance/ai-features).
