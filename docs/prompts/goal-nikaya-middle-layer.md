# Goal — Hoàn thiện tầng nhóm SN / AN / KN từ dữ liệu đến website live

## Nhiệm vụ

Triển khai đầy đủ tầng điều hướng trung gian cho Tương Ưng Bộ, Tăng Chi Bộ và
Tiểu Bộ. Người đọc đi được từ bộ đến thiên/chương/tác phẩm, đến phẩm/nhóm nhỏ,
rồi đến từng bài; đọc liên tục những nhóm phù hợp và nghe playlist khi đã có
audio hợp lệ. Hoàn thành qua kiểm thử, PR, CI, merge và xác minh website live.

Thực thi công việc, không chỉ viết kế hoạch hoặc dựng scaffold. SN12, AN3 và
Suttanipāta là ba lát cắt kiểm chứng ban đầu; sau khi chúng đạt gate phải tiếp
tục hoàn thiện toàn bộ ba bộ. Không dừng ở demo hoặc chỉ import dữ liệu.

Không có quy trình nào bảo đảm tuyệt đối không phát sinh lỗi. Mục tiêu là không
phát hành khi còn lỗi chặn đã biết, kiểm các lỗi dễ xảy ra bằng ca âm, giữ khả
năng phục hồi và phân biệt bằng chứng local / CI / production.

**Chỉ bắt đầu goal khi người dùng giao thực thi prompt này. Việc viết, lưu hoặc
đọc prompt không tự khởi chạy triển khai, tạo TTS, tạo lịch hay publish.**

## 1. Khảo sát và bảo vệ trạng thái hiện tại

Đọc `AGENTS.md`, `DESIGN.md`, `docs/architecture.md`, cùng:

- `docs/research/nikaya-middle-layer-2026-10-22.md`;
- `docs/research/nikaya-hierarchy-sources.json`;
- `docs/research/nikaya-hierarchy-audit.json`;
- `docs/research/scripts/audit-nikaya-groups.py`.

Nếu nhánh triển khai chưa chứa nghiên cứu, tìm commit cục bộ `7155d8165` hoặc
nhánh `codex/research-nikaya-modules`, kiểm diff rồi đưa đúng các tệp nghiên cứu
vào nhánh làm việc. Nếu không có chúng, tái lập từ nguồn ghim ở §2; không phụ
thuộc một đường dẫn worktree hay cache `/tmp` trên máy cũ.

Trước khi đổi tên nhóm tiếng Việt, đọc đầy đủ `skill/translation.md` và
`docs/quality-assessments.md`. Tác vụ này không chỉnh kinh văn hoặc chấm lại
quality của bản dịch. Phần quy tắc mới hơn trong tài liệu quality và quyết định
người biên tập có ưu tiên khi tài liệu cũ còn mô tả ngưỡng khác nhau.

Kiểm Git status, HEAD, remote main, worktree và diff thực tế. Dùng worktree phù
hợp, nhánh `codex/…`; giữ nguyên WIP khác và lịch sử người khác. Xác định rõ base
SHA; không reset/clean, stash tùy tiện, force-push hoặc ghi đè nhánh đang có người
làm. Khi cần nhiều agent, chia quyền sở hữu tệp rõ ràng và giữ một người tích hợp.

Ghi baseline đo được: catalog, URL bài, thứ tự hiện hành, trạng thái dịch, audio,
hash kinh văn/tóm tắt, build và kiểm tra hiện có. Số đo nghiên cứu là mốc đối
chiếu, không phải hằng số để ép catalog tương lai khớp bằng cách bỏ bài.

## 2. Nguồn và cấu trúc phải triển khai

Nguồn nghiên cứu: `https://github.com/suttacentral/sc-data`, commit
`4d481d7cfbaeccad19fa85adc215d3c15ff43457`.

Các đường dẫn gốc:

- `structure/tree/super-tree.json`;
- `structure/tree/sutta/sn-tree.json`;
- `structure/tree/sutta/an-tree.json`;
- các `<work>-tree.json` được liệt kê dưới nhánh KN của super-tree;
- registry tên trong `sc_bilara_data/root/misc/site/name/sutta/`, và registry
  tên dịch thích hợp khi đã xác minh tác giả, nguồn và điều khoản.

Đọc README cấu trúc tại đúng commit. `grouping.json` và thư mục `division` cũ
không phải nguồn phát triển mới; `child_range.json` chỉ hỗ trợ nhãn phạm vi.
API menu có thể dùng đối chiếu, nhưng build và trình duyệt phải dùng snapshot đã
ghim, không phụ thuộc API live cho cây điều hướng.

Tạo lock điều hướng riêng. Xác minh commit → tree → blob → bytes cho mọi tệp
nhập, gồm registry tên. Kiểm `truncated`; nếu API cắt cây thì lấy cây con đầy đủ,
không tiếp tục với danh sách thiếu. Ghi repo, commit, đường dẫn, git blob hash,
SHA-256 và căn cứ giấy phép phù hợp. Không gán CC0 hàng loạt cho bản dịch bên
thứ ba; giữ nguyên các edition/giấy phép hiện có. Không tự đổi pin Pāli hay pin
nguồn Việt nguyên bài để thêm điều hướng.

Cây cần hỗ trợ:

- SN: bộ → 5 thiên → 56 tương ưng → các tầng phụ khi có → phẩm → bài;
- AN: bộ → chương Một–Mười một pháp → nhóm năm mươi/tầng phụ khi có → phẩm → bài;
- KN: bộ → tác phẩm/phân bộ tác phẩm → 0–n tầng chương/phẩm → bài/cụm kệ.

Giữ độ sâu biến đổi. Node KN nguồn có 20 tác phẩm/phân bộ vì Apadāna và Niddesa
đều tách đôi; không trình bày thành khẳng định mọi truyền thống đều có 20 sách.
Khuddakapāṭha có thể đi thẳng đến bài. Pháp Cú đã có 26 lá theo phẩm, dạng
`dhp1-20`…; không tạo thêm 423 UID câu kệ. `thig10.1` thuộc chương mười một kệ
`thig-ekadasanipata`; không suy tên chương từ số UID. “Nhóm năm mươi” cũng không
buộc phải chứa đúng 50 bài.

Lượt này triển khai cây truyền thống toàn bộ. Mô hình phân biệt được
`traditional`, `edition-volume` và `editorial`, nhưng không tự sáng tác tuyển
tập thực hành, tập in hay nội dung giới thiệu chưa có căn cứ để lấp giao diện.

## 3. Invariants — lỗi nào ở đây cũng chặn phát hành

1. Tầng mới là **điều hướng**, không phải phiên bản văn bản trong `layers.yaml`.
   Nhóm tham chiếu UID; kinh văn canonical vẫn chỉ nằm tại nguồn hiện hành.
2. Giữ UID, segment ID, anchors, sourceKey, URL bài và provenance đang có.
   Không copy kinh văn sang JSON nhóm, không viết lại catalog `order` hay
   `CanonDocument.canonicalOrder`.
3. Mỗi URL catalog SN/AN/KN có đúng một đường tổ tiên truyền thống; không có
   orphan, cycle, ID trùng, hai cha hoặc leaf không resolve. Việc thuộc nhiều
   tuyển tập editorial sau này là quan hệ riêng, không sửa đường truyền thống.
4. Membership và thứ tự nhánh lấy từ tree. Thứ tự bài con trong tệp gộp phải
   dựa vào Pāli đã ghim và contract ownership segment, không sort chuỗi UID.
5. Phân biệt URL bài, tệp nguồn, lá gộp và đoạn/kệ. Đếm theo đúng đơn vị, lấy
   tổng từ code; không gắn nhãn “số bài” cho một tổng chưa chứng minh được.
6. Nhãn nhóm có provenance riêng. Tên Việt được đối chiếu; thiếu bản Việt thì
   dùng tên Pāli đã xác minh và nhãn cấp phù hợp, ghi rõ thiếu bản Việt trong
   registry. Không biến slug, chỉ số key hoặc suy đoán thành tên đã duyệt.
7. Giữ bốn bản, attribution từng bài, reference gaps, tra cứu toàn văn ở cuối
   reader, quality history, trạng thái xuất bản và khả năng tìm kiếm hiện có.
8. Audio chỉ hiện khi metadata còn hợp lệ với nguồn. Giữ profile đã duyệt,
   review pending/approved, URL R2 và bằng chứng QC. Không tạo TTS, ghép MP3,
   transcribe hoặc upload media mới trong goal điều hướng này.
9. Mọi lỗi tải nguồn/hash/resolve phải có chẩn đoán và exit khác 0. Không dùng
   fallback âm thầm, tắt test hoặc giảm gate để tạo kết quả xanh.

## 4. Contract Gate — dữ liệu trước giao diện

Xây schema, importer tái lập được, bộ kiểm tra và thư viện dùng chung. Có thể
dùng các vị trí sau hoặc điều chỉnh theo code hiện tại, ghi lý do khi đổi:

- `source/navigation.lock.json`;
- `content/navigation/traditional/{sn,an,kn}.json`;
- registry tên nhóm kèm provenance/status tên;
- `scripts/sync-navigation.*`, `scripts/check-navigation.*`;
- `src/lib/canon/groups.ts` và tests tương ứng.

Một node cần có ID nguồn, collection, loại nhóm, origin, quan hệ cha/con có thứ
tự, tên/provenance tên và liên kết nguồn. Dùng discriminated union để phân biệt
node nhóm với bài; node lớn không bị hiểu nhầm là UID bài. Chạy kiểm schema,
unique ancestry, coverage, source hashes và deterministic generation.

Các lệnh sync/check phải có mục đích rõ: sync tải snapshot vào cache; generate
sinh dữ liệu; check đối chiếu và fail khi lệch mà không sửa tệp. Khi lỗi giữa
chừng, giữ bản dữ liệu hợp lệ trước đó; ghi tệp atomic. Build offline phải chạy
được khi cache ghim đã đủ, thiếu cache phải báo đúng nguyên nhân.

Baseline nghiên cứu cần tái lập hoặc giải thích được mọi chênh lệch:

| Bộ | URL catalog | Lá nguồn/tệp Pāli | Node nhóm, bỏ gốc bộ |
| --- | ---: | ---: | ---: |
| SN | 1.819 | 1.819 | 300 |
| AN | 1.781 | 1.408 | 229 |
| KN | 2.351 | 2.351 | 325 |

AN có 38 tệp gộp phục vụ 411 URL bài riêng hiện có. Ví dụ `an1.1-10` phải resolve
đúng các URL `an1.1`…`an1.10`; các UID catalog đã là dải như `an5.308-1152` và
`sn12.93-213` vẫn giữ nguyên. Kiểm cả `an1.296-305`, trong đó có ownership của
prefix riêng và subrange. Dùng contract `segmentBelongsToUid` hiện tại; không
mở rộng dải bằng phép đếm số và không chỉ dựa vào cache tự sinh của dự án.

Tách navigation traversal khỏi chỉ số `order` lịch sử. Kiểm ca AN hiện có
`an2.1 → an2.10 → an2.100 … → an2.11`; đường đọc mới phải theo nguồn thực. KN
phải theo thứ tự tác phẩm của nguồn ghim, không theo thứ tự các đợt import.

Gate chỉ đạt khi một phép đối soát độc lập chứng minh đủ toàn bộ catalog, nguồn
file tương ứng và ownership, cùng các ca âm ở §8. Chưa đạt thì sửa contract
trước khi nhân rộng component và route.

## 5. Integration Gate — ba lát cắt thật

Làm hoàn chỉnh SN12, AN3 và Suttanipāta, sử dụng dữ liệu thật từ importer:

- SN12 phải có đường từ Thiên Nhân Duyên đến `sn12-aharavagga`, rồi đủ
  SN12.11–20; bài SN12.15 có breadcrumb đúng.
- AN3 phải có tầng paṇṇāsaka và `an3-mahavagga`, đủ AN3.61–70; AN3.65 về đúng
  nhóm, và nhóm năm mươi thứ hai không bị cắt tại bài số 100.
- Suttanipāta phải mở `snp-atthakavagga` với đủ SNP4.1–16 theo đúng thứ tự.

Đi từ trang bộ → nhóm lớn → nhóm nhỏ → bài → quay về nhóm, kể cả mở deep link
trực tiếp, reload, nút back/forward của trình duyệt và khi tắt JavaScript.
Kiểm dữ liệu, HTML thật và browser; mock hoặc build pass đơn thuần không đủ.

Sau khi gate đạt, tiếp tục nhập đủ ba bộ trong cùng goal; không chờ phê duyệt
demo nếu chưa có quyết định mới của người dùng yêu cầu dừng.

## 6. Sản phẩm hoàn chỉnh cho toàn bộ SN / AN / KN

### Mục lục và reader

Trang bộ ưu tiên nhóm lớn, giữ đường vào “Tất cả bài” và các URL phân trang cũ.
Trang nhóm có tên, cấp nhóm, phạm vi, tổ tiên, nhánh con, bài thành viên và số
bài có bản Việt/audio hợp lệ. Tính thống kê trên unique UID, không cộng trùng
qua nhiều tầng. Hiển thị rõ các trạng thái thiếu/draft; không coi nhóm là hoàn
chỉnh chỉ vì một số bài đã published.

Route nhóm dùng namespace riêng, ví dụ
`/sutta/sn/nhom/sn12-aharavagga/`, xử lý đúng Astro base path và link tương đối.
ID nhóm lạ trả 404, không redirect tùy tiện sang bài khác. Reader có breadcrumb
về phẩm/chương/tác phẩm và bộ. Bài trước/sau của SN/AN/KN dùng traversal đã xác
minh; không thay dữ liệu thứ tự lịch sử. Luồng DN/MN giữ hành vi đã được kiểm.
Nếu có chế độ điều hướng giới hạn trong nhóm, nhãn và biên đầu/cuối phải rõ,
context chỉ chấp nhận nhóm thật chứa UID đó, không làm đổi canonical URL bài.

### Đọc liên tục

Cung cấp đọc liên tục cho nhóm nhỏ đủ điều kiện, dùng các document/segment từ
store hiện tại. Định nghĩa trước ngân sách số bài/ký tự/HTML dựa trên đo đạc và
ghi vào cấu hình có kiểm thử. Nhóm lớn đi qua các chương/phẩm con hoặc phần đọc
có giới hạn, với liên kết tiếp tục rõ ràng; không sinh một HTML hàng nghìn bài.

Giữ ranh giới, tiêu đề, UID và trạng thái từng bài. Bảo đảm mọi segment dự kiến
được hiện đúng một lần và đúng thứ tự; namespace DOM IDs để không trùng toolbar,
anchors hay audio IDs giữa các bài. Link về segment trên trang bài gốc vẫn đúng.
Giữ các chế độ/bản đối chiếu theo contract reader; phần chưa có bản dịch nói rõ
thiếu. Không chèn giới thiệu biên soạn thành lời kinh hoặc mở rộng dấu lược.
Tra cứu toàn văn tham khảo của tệp gộp không bị lặp mười lần cho mười URL con.

### Playlist nhóm

Tái dùng engine/player hiện có với danh sách thành viên có thứ tự. Phân biệt
phạm vi nhóm, bài có audio và bài chưa có audio. Chọn rõ chính sách track thiếu,
hiển thị cho người nghe; không âm thầm bỏ bài hoặc tự vòng lặp cuối nhóm.
Next/Back và auto-next giữ đúng phạm vi. Toggle auto-next vẫn mặc định bật và
ghi nhớ lựa chọn bằng cơ chế hiện có; mở trang bình thường không autoplay.
Luôn chỉ có một audio đang phát; xử lý điều hướng, kết thúc, R2 lỗi, storage bị
chặn và lỗi autoplay. Nhóm chưa có audio không có player rỗng hoặc audio giả.
Giữ native fallback, tốc độ mặc định và nhãn chờ nghe duyệt.

### Tìm kiếm, SEO và hiệu năng

Đưa nhóm vào sitemap và tìm kiếm như một loại kết quả riêng, có URL/title và
breadcrumb đúng. Không lập chỉ mục lại toàn bộ kinh văn ở mọi tầng nhóm hoặc
bản đọc liên tục; kết quả kinh vẫn truy về trang/segment gốc. Giữ tìm kiếm các
bản hiện có và cấu hình canonical/noindex phù hợp cho các biến thể đọc.

Theo `DESIGN.md`, registry token và component chung. Dùng HTML progressive
enhancement, không thêm framework chỉ để dựng cây. Mục lục nhóm lớn dùng nhánh
con và danh sách gọn; tránh tải mọi bản kinh văn vào JSON client. Tái sử dụng
ảnh đã có, không nhân thêm biến thể ảnh cho mỗi tổ tiên nhóm.

Đo trước/sau cho cây, các trang lớn như SN35, AN1, Jātaka, Apadāna, cùng nhóm
nhỏ. Ghi kích thước HTML/JS, số route, thời gian và bộ nhớ build, số biến thể ảnh
và kích thước artifact. Kiểm dung lượng ổ trước full build, dùng SSD phù hợp;
không dọn dữ liệu ngoài tác vụ. Nếu vượt ngân sách đã khai, sửa cách render trước
phát hành; không chữa bằng cách bỏ bài hoặc giấu lỗ hổng dữ liệu.

## 7. Kiểm soát phạm vi và review

Chỉ thay các phần cần cho tầng nhóm, tích hợp và kiểm chứng. Kinh văn, tóm tắt,
comments, scorecard, giấy phép edition và profile audio không thuộc diff dự kiến.
Đối soát hash trước/sau để chứng minh chúng được giữ nguyên. Nếu phát hiện lỗi
nội dung có sẵn, ghi riêng cùng bằng chứng, không âm thầm sửa trong PR điều hướng.

Sau mỗi phase, review đối kháng: tìm lỗi gán nhóm, mất bài, đếm trùng, thứ tự sai,
rò nội dung tham khảo, ID DOM trùng và mất scope player. Sửa lỗi rồi kiểm lại đúng
lớp bị ảnh hưởng. Với việc có thể tách độc lập, chỉ giao agent theo chính sách
đang có; mọi worker phải biết quyền sở hữu tệp và không revert công việc khác.

Ghi tiến độ trong một tài liệu ngắn: phase, SHA, lệnh/kết quả, lỗi còn mở và việc
tiếp theo. Giữ nghiên cứu và quyết định kỹ thuật đủ để agent khác tiếp tục mà
không phải đoán. Không ghi credentials, media hoặc cache upstream vào Git.

## 8. Ma trận kiểm thử bắt buộc

**Dữ liệu thật:** toàn bộ catalog hiện tại resolve; mọi nguồn đúng pin/hash;
tree không cắt; mỗi leaf/sourceKey tương ứng; mỗi URL có một nhánh truyền thống;
thứ tự cây và segment ownership được đối soát độc lập, không chỉ gọi lại cùng
helper rồi so kết quả với chính nó.

**Ca âm:** sửa một byte nguồn; thiếu một lá; UID không có trong catalog; sourcePath
sai; node hai cha/cycle; duplicate ID; mapping tệp gộp chồng lấn; title không có
provenance; API trả truncated; file generated lệch snapshot; cache thiếu. Mỗi lỗi
phải bị phát hiện, không tạo báo cáo xanh hoặc ghi đè dữ liệu tốt.

**Ca hồi quy:** AN tệp gộp/nested range; Pháp Cú range; THIG10.1/chương mười một
kệ; tác phẩm không có phẩm; nhóm một bài; tầng paṇṇāsaka/peyyāla; biên đầu/cuối;
UID dài; nhóm không audio; audio stale hash; DN/MN và URL `/page/N/` cũ.

**Reader/search/audio:** mỗi segment xuất hiện đúng một lần ở bản đọc liên tục;
DOM ID duy nhất; deep link/anchors; ranh giới nhóm; bộ lọc bản; search không nhân
đôi lời kinh; playlist đúng thứ tự và phạm vi; default/persistence auto-next;
storage bị chặn; play/seek/pause; track thiếu/lỗi; JavaScript tắt. Khi SN/AN/KN
chưa có audio thật, dùng fixture media cục bộ để kiểm engine và kiểm nhóm thật
không hiện player rỗng; không bịa bằng chứng R2 production của ba bộ.

**Browser:** desktop 1440/1024, mobile 390/320, zoom 200%, bàn phím/focus,
reduced motion; trang bộ/nhóm/bài/đọc liên tục/search; ba mode reader và các bản
theo `DESIGN.md`. Không lỗi JS, mất chữ, overflow toàn trang hoặc click bị che.

Chạy các gate hiện có và gate navigation mới: `npm run validate`, `npm test`,
`npm run check`, `npm run design:check`, `npm run audio:check`, `npm run build`,
`npm run seo:check`; đối soát store/catalog/license và các gate khác mà CI yêu
cầu. Cache phải đúng và đủ để các test quan trọng thực sự chạy. Lỗi môi trường
không được trình bày thành lỗi sản phẩm hoặc thành PASS; chẩn đoán rồi chạy lại
khi đã sửa điều kiện, giữ nguyên gate.

## 9. PR, merge, deploy và phục hồi

Trong lượt **thực thi goal**, việc tạo PR, push, merge sau CI xanh và xác minh
website live thuộc phạm vi hoàn thành. Tách PR theo phase có thể review nếu cần;
mọi commit được merge phải ở trạng thái có thể triển khai, không để route thiếu
dữ liệu hoặc schema nửa cũ nửa mới trên main. Pilot không kết thúc goal.

Mỗi PR mô tả vấn đề, hành vi cuối cùng, nguồn/pin, tác động URL/thứ tự, kiểm thử
và giới hạn thật. Stage đúng tệp; quét secret và diff; push không force. Chờ các
check áp dụng của đúng head thành công rồi mới merge, đọc lại remote main.
Không dùng admin merge hoặc bỏ gate. Attach PR vào chat nếu công cụ hỗ trợ.

Theo dõi đúng deployment chứa merge commit hoặc descendant đã chứng minh chứa
nó. Watcher timeout là lỗi kết nối theo dõi; kiểm trạng thái API trước khi nói
deployment thất bại hoặc rerun. Không tạo deployment trùng để xử lý một lệnh
theo dõi mất kết nối.

Sau deploy thành công, kiểm production: năm trang bộ vẫn vào được; ba bộ mới có
nhóm; mọi route/link nhóm được crawl; các ca đại diện SN12, AN3, SNP, DHP, THIG
và range mở đúng; thử đọc liên tục và search; kiểm player thật khi có media.
Lưu URL, SHA, deployment ID, thời điểm và quan sát thực. Không coi merge hoặc
upload artifact là bằng chứng website đã đổi.

Chuẩn bị runbook phục hồi: schema/generated file cùng phiên bản; diff/revert
phạm vi nhóm; commit trước thay đổi; cách deploy lại bản ổn định; giữ URL cũ.
Khi phải phục hồi, dùng commit revert có review/CI phù hợp, không reset lịch sử
hoặc xóa nội dung người khác. Bằng chứng lỗi vẫn được giữ trong log.

## 10. Điều kiện hoàn tất

Chỉ báo goal hoàn tất khi có đủ bằng chứng:

- Toàn bộ SN/AN/KN có cây nhóm đúng nguồn, tên/provenance và thứ tự kiểm được;
  không chỉ ba lát cắt hoặc vài module mẫu.
- Mọi URL catalog có membership duy nhất, không thiếu/trùng/sai sourceKey;
  số đếm công bố tái lập được và đúng đơn vị.
- Trang bộ/nhóm, breadcrumb, điều hướng, đọc liên tục có giới hạn, search/SEO
  và playlist theo khả năng media thực tế đều hoạt động theo hợp đồng.
- Kinh văn, segment/URL cũ, quality, provenance, giấy phép edition, audio và
  hành vi DN/MN không có thay đổi ngoài phạm vi đã kiểm.
- Các ca âm/hồi quy đạt; gate local và CI đúng head xanh; browser desktop/mobile
  có bằng chứng; không còn lỗi chặn đã biết.
- PR đã merge; remote main và deployment production chứa thay đổi được xác
  minh; website live đã được kiểm, không chỉ build local.
- Có tài liệu nguồn, schema, sync/check, thêm nhóm/nâng pin và phục hồi; Git sạch
  trong worktree tác vụ, WIP khác được giữ; báo rõ mọi giới hạn còn lại.

Báo cáo cuối ngắn gọn bằng tiếng Việt: đã có gì trên website, số nhóm/mục theo
từng bộ, link mẫu và PR, kết quả local/CI/live, giới hạn đã xác minh. Không hứa
“không bao giờ có lỗi”; nêu đúng bằng chứng và trạng thái thực tế.
