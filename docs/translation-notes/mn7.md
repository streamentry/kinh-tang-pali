# MN7 — Vattha (Kinh Ví Dụ Tấm Vải)

## Sources

- Pāli authority: SuttaCentral/Bilara `root/pli/ms/sutta/mn/mn7_root-pli-ms.json` pinned at `11c9d708978cde8ba61096d8a75f7ddfb846f639`.
- English reference: Bhikkhu Sujato, `mn7_translation-en-sujato.json`, same pinned Bilara commit.
- Vietnamese comparison: HT. Thích Minh Châu, `buddhanussati/loicuaducphat` `mn/mn7.html` pinned at `9a9fdc135c83be0fd78df5353c55267d6b0ea7fd`.

## High-risk audit points

- `mn7:3.2`: the sixteen corruptions repeat in full in the root (`X cittassa upakkileso` ×16, then the giving-up chains of sections 4–5). The draft mirrored Sujato's compression and left 60 segments empty; canonical fills every root segment. `abhijjhāvisamalobha` = tham dục và tà tham (TMC mapping, order fixed); `pamāda` = phóng dật (standard VN technical term, supersedes draft `buông lung`); `sārambha` = hung hăng (DPD/EN) with TMC `cấp tháo` noted.
- Vocative `bhikkhave` restored at every occurrence (này các tỳ-kheo); quote-open parity with the root verified programmatically.
- `mn7:9.1, 14.1, 15.1`: root-carried `…pe…` elisions kept as `…` around genuinely present content (dhamme; karuṇā; muditā), per the MN45 precedent; 16.1 (upekkhā) spelled out in full as the root does.
- `mn7:13–16`: brahmavihāra formula keeps `pharitvā viharati` (rải … trú), the ten-direction coverage, and `averena abyāpajjena`; the draft's added `tu tập` removed.
- `mn7:19–20`: `santike` = trong sự hiện diện (not `dưới sự hướng dẫn`); `kaṇhakammo` = nghiệp đen; `phaggu/uposatha` kept as two distinct observances.
- Supersedes the parallel in-progress MN7 assessment ("Muse Spark"), which scored the un-audited draft (60 empty segments) as segment_alignment 10.0.

## Gate

Exact Pāli key coverage (147/147), no empty segments, passing repository validation/build, no blocking semantic errors, arithmetic `final_score` = 9.59 > 9.0 under `AGENTS.md`.
