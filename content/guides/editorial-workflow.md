---
title: Editorial workflow
---

# Editorial workflow

`draft → review → published`

1. Tạo metadata YAML cho UID.
2. Sync source Pāli pinned.
3. Dịch vào segmented JSON với key giống source.
4. `npm run validate`.
5. Khi đủ segment, chuyển `review` và human review.
6. Chỉ chuyển `published` sau khi reviewer + ngày review đã ghi nhận.
