# Tầng nhóm cho Tương Ưng, Tăng Chi và Tiểu Bộ

Ngày nghiên cứu: 2026-10-22. Đối chiếu repository tại `2f77e43c0f9819630ab4c24e26d1c5f9e6dc87ae`.
Đây là bản nghiên cứu và thiết kế; website chưa thay đổi.

## Quyết định đề xuất

Thêm cây điều hướng trung gian theo cấu trúc truyền thống SuttaCentral đã ghi nhận.
Người đọc có thể mở một thiên, tương ưng, chương, tác phẩm hoặc phẩm, xem mục lục
và đi tiếp qua các bài trong nhóm. Dùng **phẩm** làm đơn vị đọc liên tục nhỏ khi
tác phẩm có phẩm; dùng chương hoặc tác phẩm ngắn khi cấu trúc gốc phù hợp hơn.

Cây cho phép nhiều độ sâu. Tương Ưng và Tăng Chi có các tầng bổ sung ở một số
nhánh; từng tác phẩm Tiểu Bộ có cấu trúc riêng. Không cần thêm tầng rỗng chỉ để
mọi đường dẫn có cùng số cấp.

Phản biện quan trọng: một phẩm truyền thống có thể tập hợp văn bản theo công
thức, số pháp, nhân vật hoặc cách lưu truyền, và không nhất thiết tạo thành một
giáo trình thực hành thống nhất. Module theo chủ đề thực hành nên có lớp biên
soạn riêng và căn cứ lựa chọn; cây truyền thống vẫn giữ nguyên.

## Kết quả đã xác minh

Nguồn điều hướng là `suttacentral/sc-data`, commit
`4d481d7cfbaeccad19fa85adc215d3c15ff43457`, trùng commit `legacyHtml` hiện đang
ghim trong dự án. Pāli authority vẫn thuộc pin Bilara riêng của repository.
Lần triển khai nên khai pin điều hướng riêng dù ban đầu dùng cùng SHA với nguồn
HTML; thay bản tra cứu không nên âm thầm thay cấu trúc nhóm.

Đã tải 23 tệp JSON: `super-tree`, SN, AN và 20 cây tác phẩm KN. Từng tệp được so
SHA-256 và git blob hash với cây `structure` của đúng commit. Cây con hoàn chỉnh
có 194 entry, `truncated: false`; không dùng kết quả recursive toàn repository
vì API trả bản bị cắt trước khi đến thư mục structure.

| Phạm vi | URL bài trong catalog | Lá trong cây nguồn / tệp Pāli | Node nhóm, bỏ gốc bộ | Ánh xạ |
| --- | ---: | ---: | ---: | --- |
| SN | 1.819 | 1.819 | 300 | đủ, mỗi URL đúng một nhánh |
| AN | 1.781 | 1.408 | 229 | đủ, giải quyết 38 tệp gộp |
| KN | 2.351 | 2.351 | 325 | đủ, mỗi URL đúng một nhánh |

Tổng là **5.951 URL hiện có**, không phải lời khẳng định về số bài kinh riêng lẻ
trong toàn truyền thống: một URL có thể chứa một dải kinh/kệ. Các node nhóm cũng
bao gồm tầng lớn và tầng phụ, không phải toàn bộ đều là phẩm.

Kết quả máy: [audit JSON](nikaya-hierarchy-audit.json). Nguồn và hash:
[manifest](nikaya-hierarchy-sources.json). Chạy lại từ đúng thư mục worktree:

```bash
python3 docs/research/scripts/audit-nikaya-groups.py --fetch \
  --output /private/tmp/nikaya-hierarchy-audit.json
```

Không có mục bị bỏ sót, lá nguồn chưa resolve, UID trùng hoặc URL thuộc hai nhánh.
Audit này xác nhận membership và nguồn metadata, chưa kiểm tên Việt của mọi nhóm,
giao diện, tốc độ build hoặc toàn bộ thứ tự segment bên trong tệp gộp.

## Cấu trúc cho từng bộ

### Tương Ưng Bộ

`Bộ → Thiên → Tương ưng → [tầng phụ khi có] → Phẩm → Bài`.
Có năm thiên lớn và 56 tương ưng trong cây đã ghim:

| Thiên, nhãn Việt quen dùng | UID nguồn | Tương ưng |
| --- | --- | --- |
| Có Kệ | `sn-sagathavaggasamyutta` | SN1–11 |
| Nhân Duyên | `sn-nidanavaggasamyutta` | SN12–21 |
| Uẩn | `sn-khandhavaggasamyutta` | SN22–34 |
| Sáu Xứ | `sn-salayatanavaggasamyutta` | SN35–44 |
| Đại Phẩm | `sn-mahavaggasamyutta` | SN45–56 |

Ví dụ đã đối soát: `sn → sn-nidanavaggasamyutta → sn12 → sn12-aharavagga →
sn12.11 … sn12.20`. Giao diện có thể trình bày: **Tương Ưng → Thiên Nhân Duyên →
Tương ưng Nhân duyên → Phẩm Đồ ăn → SN12.15**. Nhãn Việt là lớp tên riêng cần
đối chiếu nguồn mục lục; không sửa tiêu đề hoặc kinh văn của từng bài.

SN22 có thêm các nhóm năm mươi; một số nhánh có tầng peyyāla. Vì thế một schema
cố định chỉ có `collection/chapter/sutta` sẽ làm mất thông tin.

### Tăng Chi Bộ

`Bộ → Chương Một–Mười một pháp → [nhóm năm mươi/tầng phụ khi có] → Phẩm → Bài`.
Các node `an1`–`an11` đã có sẵn. AN1 đi thẳng từ chương xuống phẩm, trong khi
nhiều chương khác có thêm tầng paṇṇāsaka. Tên “năm mươi” không bảo đảm đúng 50 bài:
cây và API cho nhóm thứ hai của AN3 đi từ AN3.51 đến AN3.102.

Ví dụ đã đối soát: `an → an3 → an3-dutiyapannasaka → an3-mahavagga → an3.65`.
Phẩm này chứa AN3.61–70. Module đọc nhỏ có thể đặt ở phẩm, còn chương và nhóm năm
mươi làm mục lục lớn hơn.

### Tiểu Bộ

`Bộ → Tác phẩm/phân bộ tác phẩm → [chương/phẩm/tầng riêng] → Bài hoặc cụm kệ`.
Các ví dụ đã kiểm từ cây nguồn:

| Tác phẩm | Nhóm tự nhiên | Thành viên mẫu |
| --- | --- | --- |
| Udāna | `ud-bodhivagga` | UD1.1–1.10 |
| Suttanipāta | `snp-atthakavagga` | SNP4.1–4.16 |
| Itivuttaka | chương một pháp → phẩm thứ nhất | ITI1–10 |
| Theragāthā | chương một kệ → phẩm thứ nhất | THAG1.1–1.10 |
| Therīgāthā | `thig-ekakanipata` | THIG1.1–1.18 |
| Jātaka | chương một kệ → `ja-apannakavagga` | JA1–10 |

Khuddakapāṭha có chín lá trực tiếp; không cần tự chia thêm phẩm. Pháp Cú đã có
26 lá dạng `dhp1-20`, `dhp21-32`…; các trang hiện tại chính là các đơn vị theo phẩm.
Không bung chúng thành 423 UID mới.

`super-tree` có 20 node tác phẩm KN vì Apadāna và Niddesa đều được chia làm hai
phân bộ. Con số đó không phải tuyên bố “Tiểu Bộ thống nhất có 20 sách”. Truyền
thống và ấn bản có khác biệt; frontend nên ghi tên tác phẩm/phân bộ cụ thể.

Tên chương không thể suy từ số đầu UID: `thig10.1` thuộc `thig-ekadasanipata`,
chương mười một kệ. Jātaka cũng cần giữ ranh giới giữa kệ kinh văn và truyện văn
xuôi chú giải; việc thêm nhóm không làm nguồn Pāli hiện có trở thành toàn bộ
truyện chú giải.

## Ba loại nhóm cần khai rõ

**Nhóm truyền thống** lấy membership và thứ tự nhánh từ cây nguồn, có đúng một
đường tổ tiên. Đây là phần nên làm trước.

**Tập của một ấn bản** mang nguồn ấn bản cụ thể, ví dụ tập in II-A, nhà xuất bản,
năm và phạm vi. Các ranh giới này phụ thuộc cách in và phân tập; không dùng làm
ID chung thay thế chương/phẩm.

**Tuyển tập/module biên soạn** có thể chọn bài từ nhiều bộ, như một tuyển đọc về
niệm hay duyên khởi. Cần nhãn “Dự án biên soạn”, tiêu chí chọn và thứ tự đọc có
lý do. Một bài được nằm trong nhiều tuyển tập; điều đó không đổi nhánh truyền
thống của bài. Tập nghe chia theo thời lượng cũng thuộc lớp biên soạn.

## Hợp đồng dữ liệu đề xuất

Tầng mới thuộc **điều hướng**, tách khỏi `source/layers.yaml`, vì năm tầng trong
registry đó là các phiên bản văn bản. Dữ liệu nhóm chỉ tham chiếu bài, không chứa
bản kinh văn sao chép.

```json
{
  "id": "sn12-aharavagga",
  "collection": "sn",
  "parentId": "sn12",
  "kind": "vagga",
  "origin": "traditional",
  "children": [
    {"type": "text", "uid": "sn12.11"},
    {"type": "text", "uid": "sn12.12"}
  ],
  "source": {
    "repository": "suttacentral/sc-data",
    "commit": "4d481d7cfbaeccad19fa85adc215d3c15ff43457",
    "path": "structure/tree/sutta/sn-tree.json"
  }
}
```

Mẫu rút gọn chỉ minh họa hai thành viên đầu; manifest sản xuất phải chứa đủ cả
mười bài của phẩm. Tên Pāli/Việt và provenance tên khai riêng. Upstream chuyển
registry tên sang `sc_bilara_data`; không suy tên từ slug hoặc số thứ tự của key
như `sn-name:325.sn12-aharavagga`. UID thực nằm sau phần chỉ số của key.

Một bộ tệp có thể triển khai:

- `source/navigation.lock.json`: pin cây và registry tên; hash từng tệp.
- `content/navigation/traditional/{sn,an,kn}.json`: cây đã resolve với catalog.
- `content/navigation/editorial/*.yaml`: tuyển tập biên soạn khi có nhu cầu.
- `src/lib/canon/groups.ts`: load, ancestors, descendants, leaf resolution và traversal.
- `src/pages/sutta/[collection]/nhom/[groupId].astro`: namespace nhóm riêng.

Ví dụ route mới: `/sutta/sn/nhom/sn12/`, `/sutta/sn/nhom/sn12-aharavagga/`,
`/sutta/an/nhom/an3-mahavagga/`, `/sutta/kn/nhom/snp-atthakavagga/`.
Toàn bộ URL bài hiện tại giữ nguyên.

## Hai lỗi kỹ thuật phải tránh

**Tệp gộp và URL bài là hai đơn vị khác nhau.** Trong AN, 38 lá/tệp nguồn phục vụ
411 URL bài đã có. `an1.1-10` resolve về `an1.1`…`an1.10`; các dải đã là UID
catalog như `an5.308-1152` hoặc `sn12.93-213` vẫn là một đơn vị hiện hành. Dùng
`sourceKey`/`sourcePath` và contract `segmentBelongsToUid`, không tự bung mọi dải
số. Khi đọc liên tục, đừng lặp toàn văn tham khảo của cùng một tệp gộp ở mỗi bài.

**`order` hiện tại là chỉ số lịch sử.** Importer giữ số cũ và nối phần mới vào
cuối. AN có 25 chỗ nghịch thứ tự UID tự nhiên, ví dụ `an2.1 → an2.10 → an2.100 …
→ an2.11`; KN có thứ tự tác phẩm phản ánh các đợt import. Thêm `navigationOrder`
theo traversal cây nguồn. Với thành viên riêng trong một tệp gộp, kiểm thứ tự
theo segment Pāli đã ghim và quy tắc ownership. Không âm thầm viết lại `order`
hoặc `CanonDocument.canonicalOrder` trong tác vụ nhóm bài.

## Trải nghiệm và thứ tự triển khai

Ở trang bộ, hiển thị các nhóm lớn. Trang nhóm cho biết phạm vi, nhánh con, danh
sách bài, số bài có bản Việt và breadcrumb về cấp trên. Trong reader, thêm đường
về phẩm/tương ưng/chương/tác phẩm; giữ liên kết cũ hoạt động. Danh sách `/page/N/`
có thể tiếp tục phục vụ chế độ “Tất cả bài”.

“Đọc liên tục” nên bắt đầu ở phẩm hoặc nhóm nhỏ phù hợp. Mỗi bài giữ tiêu đề,
UID, anchors, provenance và trạng thái riêng. Nhóm lớn mở mục lục các nhánh con;
không sinh một HTML chứa hàng nghìn bài. Giới thiệu của module phải có nhãn biên
soạn và tách khỏi lời kinh. Search cần phân biệt kết quả nhóm với kết quả kinh,
tránh nhân đôi chỉ mục khi một đoạn kinh xuất hiện ở reader và bản đọc liên tục.

Audio nhóm có thể tái dùng `CollectionAudio` với tập UID thuộc nhánh, chỉ đưa vào
MP3 hợp lệ với nguồn hiện tại. Next/Back và tự phát tiếp theo thứ tự nhóm; báo rõ
giới hạn khi có bài chưa có audio. Đây là thiết kế sử dụng audio đã tồn tại,
không phải yêu cầu tạo TTS hay ghép thêm MP3 trong lượt nghiên cứu này.

Làm thử ba nhánh: SN12, AN3 và Suttanipāta. Chúng đại diện nhóm chủ đề, nhóm số
pháp và một tác phẩm KN. Sau đó import cây đủ ba bộ và mở các lớp chương/phẩm
còn lại. Cách này kiểm cả ba kiểu điều hướng trước khi sinh hàng trăm trang nhóm.

Cổng triển khai gồm: hash nguồn đúng; nhóm không chu kỳ/trùng ID; mỗi catalog
UID có đúng một đường truyền thống; resolve đủ tệp gộp; thứ tự đọc được kiểm từ
nguồn; tổng đếm tách URL/tệp/bài được nguồn liệt kê; tất cả link cũ vẫn hoạt
động; search không đếm trùng; playlist giới hạn đúng nhóm; browser desktop/mobile
theo `DESIGN.md`. Các technical gate của website áp dụng khi bắt đầu đổi sản phẩm.

## Nguồn chính

- [README cấu trúc SuttaCentral, đúng pin](https://github.com/suttacentral/sc-data/blob/4d481d7cfbaeccad19fa85adc215d3c15ff43457/structure/README.md): `tree` thay `grouping`/`division`; `child_range` chỉ là nhãn hỗ trợ.
- [Cây SN](https://github.com/suttacentral/sc-data/blob/4d481d7cfbaeccad19fa85adc215d3c15ff43457/structure/tree/sutta/sn-tree.json), [cây AN](https://github.com/suttacentral/sc-data/blob/4d481d7cfbaeccad19fa85adc215d3c15ff43457/structure/tree/sutta/an-tree.json), [super-tree KN](https://github.com/suttacentral/sc-data/blob/4d481d7cfbaeccad19fa85adc215d3c15ff43457/structure/tree/super-tree.json).
- [Suttanipāta](https://github.com/suttacentral/sc-data/blob/4d481d7cfbaeccad19fa85adc215d3c15ff43457/structure/tree/sutta/snp-tree.json), [Pháp Cú](https://github.com/suttacentral/sc-data/blob/4d481d7cfbaeccad19fa85adc215d3c15ff43457/structure/tree/sutta/dhp-tree.json), [Therīgāthā](https://github.com/suttacentral/sc-data/blob/4d481d7cfbaeccad19fa85adc215d3c15ff43457/structure/tree/sutta/thig-tree.json).
- [Registry tên SN Pāli](https://github.com/suttacentral/sc-data/blob/4d481d7cfbaeccad19fa85adc215d3c15ff43457/sc_bilara_data/root/misc/site/name/sutta/sn-name_root-misc-site.json), [tên AN](https://github.com/suttacentral/sc-data/blob/4d481d7cfbaeccad19fa85adc215d3c15ff43457/sc_bilara_data/root/misc/site/name/sutta/an-name_root-misc-site.json).
- [A Reader’s Guide, Bhikkhu Sujato](https://suttacentral.net/general-guide-sujato?lang=en), [Discourses guide](https://suttacentral.net/discourses-guide-sujato?lang=en): đơn vị cấu trúc và giới hạn phân loại; KN có khác biệt truyền thống.
- [Mục lục Tương Ưng, bản HT. Thích Minh Châu do BuddhaSasana lưu](https://budsas.org/uni/u-kinh-tuongungbo/tu-00.htm), [lời giới thiệu Tăng Chi](https://budsas.org/uni/u-kinh-tangchibo/tcgiang-01.htm): tham khảo tên Việt và cách phân tập của ấn bản, không sao chép kinh văn vào dự án.

Độ tin cậy: **cao** về cây nguồn và khả năng ánh xạ catalog, vì đã kiểm hash và
membership toàn bộ. Tên Việt toàn bộ nhóm, thiết kế giao diện, quyền tái sử dụng
registry tên và chất lượng các tuyển tập biên soạn còn cần kiểm ở lượt triển khai.
