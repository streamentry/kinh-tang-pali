# Vì sao 741 bài `kn` không thể lên `published` — và quyết định đã chọn

Câu hỏi được giao: ~1.176 bài bị chặn vì bản Anh đã ghim không tồn tại. **Ghim commit mới
hay sửa luật trong `validate.ts`?** Trả lời bằng số đo, không bằng suy đoán.

Tài liệu này ghi lại phép đo và lập luận. Mọi con số ở đây tái lập được bằng các lệnh
ghi ở cuối.

## Tóm tắt quyết định

**Ghim lại không thu được gì. Sửa luật thì hạ tiêu chuẩn. Nên: giữ luật, và làm đúng
việc có thể làm — ghim thêm một bản Anh độc lập mà SuttaCentral *đã có* ngay tại commit
đang ghim.**

`bilara-data` ở commit mới nhất **không có thêm một tệp Anh nào** cho `kn` so với commit
đã ghim. Không một tệp. Vậy nên "ghim commit mới" là lựa chọn không tồn tại — không phải
lựa chọn đắt, mà là lựa chọn **rỗng**.

Nhưng có một nguồn lỡ sót: `translation/en/kelly` có **100 tệp** cho `kn/mil`
(Milindapañha) **tại chính commit đã ghim**. Giao diện với 223 bài `mil` đang bị chặn thì
**92 bài** có thể đứng được nhờ bản Anh **độc lập thật** — không phải lớp lấp nội bộ.

## 1. Cơ chế chặn, nói đúng

`scripts/validate.ts:223-231`:

```ts
const needsEnglish = meta.status === 'review' || meta.status === 'published';
if (!existsSync(englishFile)) {
  const message = `${uid}: pinned English reference missing (${englishPath}); …`;
  if (needsEnglish) errors.push(message);
  else warnings.push(message);
}
```

Đây là **cảnh báo** khi bài còn `draft` và **lỗi** khi bài lên `review`/`published`.
`npm run validate` hiện **exit 0**: 1.195 dòng cảnh báo, không có dòng lỗi nào.

Nên "blocker" của những bài này không phải cổng kỹ thuật — nó là ranh giới mà
`AGENTS.md` đã viết thẳng:

> thiếu tầng tham khảo là lỗi chặn đối với `review`/`published`

Đó là một **bất biến đã được viết ra**, không phải sự cố. Hạ nó là hạ tiêu chuẩn, nên
không làm.

### Điều dễ nhầm: record gap **không** phải lỡ dễi

`content/meta/reference-gaps.yaml` — tệp do `scripts/record-reference-gaps.ts` sinh —
**đã ghi nhận sẵn 774 khoá**, và **4 bài trong số đó đang `published`**. Cơ chế "ghi nhận
mất mát" chạy tốt và đã dùng thật.

Nhưng nó chỉ giải quyết chuyện **coverage thấp trong một tệp Anh đã có**. Nó không tạo
ra tệp. Với 741 bài mà SuttaCentral **chưa bao giờ phát hành** bản Anh, không có tệp nào
để ghi nhận — nên cơ chế này không cứu được, và đó là đúng thiết kế.

> Cần nói thẳng vì sổ đánh giá từng ghi *"`validate.ts` coi tệp Anh thiếu là **error**"*,
> và câu đó sai: nó là **warning**. Ranh giới thật là `needsEnglish` ở dòng 227.

## 2. Ghim commit mới: phép đo

Commit đang ghim: `11c9d708978cde8ba61096d8a75f7ddfb846f639`.
Commit mới nhất trên nhánh `published`: `f5ce35f517ae` (2026-10-03).

Đếm **từng tệp** `translation/en/sujato/sutta/kn/*` ở cả hai commit, rồi `comm`:

| commit | số tệp Anh `kn` |
| --- | --- |
| `11c9d708` (đã ghim) | 514 |
| `f5ce35f5` (mới nhất) | 514 |

- chỉ có ở commit mới: **0**
- chỉ có ở commit cũ: **0**

Kiểm tra cả tám dịch giả tiếng Anh hiện có (`anandajoti`, `brahmali`, `kelly`, `kovilo`,
`patton`, `soma`, `suddhaso`, `sujato`) × toàn bộ thư mục `kn`, tại **commit đã ghim**:

| dịch giả | `kn/…` có bản Anh | so với Sujato |
| --- | --- | --- |
| `sujato` | cp 35 · dhp 26 · iti 11 · ja 83 · kp 9 · snp 5 · thag 264 · thig 73 · ud 8 | — |
| **`kelly`** | **`mil` 100** | **chưa ai khai** |
| `soma` | thig 73 | trùng hệt Sujato → không thu thêm |
| `suddhaso` | dhp 26, snp 1 | trùng hệt Sujato → không thu thêm |
| `kovilo` | pv 1 | 1 tệp, không đủ |
| `anandajoti`, `brahmali`, `patton` | — | không có |

Và `mil`, `tha`, `vv`, `ne`, `bv`, `thi`, `ps`, `cnd` **không có thư mục dịch Anh nào** ở
bất kỳ commit nào đã kiểm.

**Kết luận:** ngoài `kelly`, không tồn tại một bản Anh độc lập nào cho những bài đang bị
chặn. Gần đúng toàn bộ 741 bài nằm ngoài tầm với của SuttaCentral.

## 3. Phân bố 741 bài bị chặn

| `kn` nhóm | số bài | bản Anh độc lập tồn tại? |
| --- | --- | --- |
| `ja` | 382 | 83/458 tệp của Sujato — 375 bài này không có |
| `mil` | 223 | **có: `kelly` 100 tệp → giao với 92 bài** |
| `vv` | 66 | không |
| `pv` | 31 | không (`kovilo` chỉ 1 tệp) |
| `ne` | 21 | không |
| `bv` | 10 | không |
| `ps` | 5 | không |
| `cnd` | 3 | không |

## 4. Việc đáng làm: ghim thêm `kelly`

Đây là hướng **không làm yếu tiêu chuẩn**: nó **thu thêm** một tầng tham khảo độc lập
thật, thay vì hạ yêu cầu. Cụ thể:

- khai một `referenceEditions` thứ hai trong `source/suttacentral.lock.json`, cùng
  `commit`, `authority: false`, `requiredFor: [review, published]`, và **khai `license`**
  bắt buộc — `kelly` là bản của người khác, nên `NOASSERTION` kèm lý do, tuyệt đối không
  gán CC0;
- `src/lib/canon/load.ts:175` hiện lấy **bản `role: 'english'` đầu tiên**
  (`find((entry) => entry.role === 'english')`), nên phải đổi thành tra theo `collection`;
- đồng bộ 100 tệp, sinh lại `NOTICE`, tính lại coverage cho các bài `mil`, sinh lại
  `content/meta/reference-gaps.yaml`;
- chạy lại `verify:store` để chứng minh **không** có segment lệch tầng (bài học từ
  `kn/thig2.7`, nơi tầng Anh đã ghim lệch ngay ở mức segment).

**Chưa làm trong đợt này** — đây là thay đổi kiến trúc chạm `load.ts`, `layers.ts`,
`reference.ts`, `validate.ts`, các script audit, `NOTICE`, manifest và bộ test; xong một
nửa sẽ để lại trạng thái đỏ tệ hơn trạng thái hiện tại. Nó cần một đợt riêng.

## 5. Việc **không** làm, và lý do

**Không** sửa `validate.ts` để cho `review`/`published` khi thiếu tệp Anh đã ghim.

Cái giá phải trả, gọi tên:

1. **Mất quyền kiểm chứng độc lập.** Đúng thứ làm cho `triangulation` có nghĩa là người
   đọc tin rằng bản Việt đã được so với một bản Anh khác. Với 741 bài, "bản Anh khác"
   sẽ là lớp lấp của chính dự án — tức là so với chính mình.
2. **Mất khả năng phát hiện trôi chất lượng.** Khi tầng tham khảu bắt buộc biến mất, hai
   bản dịch tệ và một bản dịch tốt sẽ trông **giống nhau**. Bộ dò bắt lỗi nghĩa mà đợt
   này tìm được (`an6.25:5.3`, `sn22.62:1.2`) đều đến từ việc so với bản đã ghim.
3. **Trái một bất biến đã viết trong `AGENTS.md`.** Hạ luật để cho bài lên được là thay
   đổi chính sách, và chính sách là việc của người biên tập.
4. **Không cần thiết.** `kelly` cứu được 92 bài bằng bản Anh thật. 649 bài còn lại thì
   upstream không có gì để cứu — dù có hạ luật thì tầng tham khảo của chúng vẫn rỗng, chỉ
   là giấy tờ không còn yêu cầu nó.

## 6. 649 bài còn lại thì sao

Chúng **đã ở trạng thái đúng**: `draft`, kèm blocker ghi rõ là giới hạn upstream. Không
cần sửa gì. Bản dịch vẫn được đọc, vẫn nằm trong store, vẫn so sánh được ở mức segment —
chỉ là chưa tuyên bố là đã đối chiếu với bản Anh độc lập, và scorecard nói đúng điều đó.

Cách duy nhất để chúng thật sự đủ điều kiện là **SuttaCentral phát hành bản Anh cho
chúng** — điều mà đợt này đã chứng minh là chưa xảy ra. Không có thao tác kỹ thuật nào
làm thay được.

## Tái lập

```bash
# 514 tệp ở cả hai commit; diff rỗng
OLD=11c9d708978cde8ba61096d8a75f7ddfb846f639; NEW=f5ce35f517ae
for REF in $OLD $NEW; do
  for s in cp dhp iti ja kp snp thag thig ud; do
    gh api "repos/suttacentral/bilara-data/contents/translation/en/sujato/sutta/kn/$s?ref=$REF" \
      --jq ".[] | \"kn/$s/\" + .name"
  done
done | sort | uniq -c

# kelly/mil tại commit đã ghim — 100 tệp
gh api "repos/suttacentral/bilara-data/contents/translation/en/kelly/sutta/kn/mil?ref=$OLD" --jq 'length'

# ranh giới validate
sed -n '223,232p' scripts/validate.ts

# 774 record gap, trong đó 4 bài đang published
npm run reference:gaps            # sinh lại tệp
grep -c 'uid:' content/meta/reference-gaps.yaml
```

Các tài liệu liên quan: [`docs/translation-store.md`](translation-store.md),
[`docs/draft-backlog-2026-10-05.md`](draft-backlog-2026-10-05.md).
