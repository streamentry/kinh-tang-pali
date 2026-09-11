# MN5 — Anaṅgaṇa (Kinh Không Uế Nhiễm)

## Sources

- Pāli authority: SuttaCentral/Bilara `root/pli/ms/sutta/mn/mn5_root-pli-ms.json` pinned at `11c9d708978cde8ba61096d8a75f7ddfb846f639`.
- English reference: Bhikkhu Sujato, `mn5_translation-en-sujato.json`, same pinned Bilara commit.
- Vietnamese comparison: HT. Thích Minh Châu, `buddhanussati/loicuaducphat` `mn/mn5.html` pinned at `9a9fdc135c83be0fd78df5353c55267d6b0ea7fd`.

Pāli is the final authority where references differ or compress repetitions.

## High-risk audit points

- `mn5:2–8`: four persons with/without a blemish; `aṅgaṇa` rendered `uế nhiễm` (TMC `cấu uế`), kept uniform across title and body. The vocative `āvuso` is restored at every occurrence (này các hiền giả), matching both references; the earlier draft had dropped it systematically.
- `mn5:31.3`: the draft's added speaker tag ("Sāriputta nói:") was removed — the root carries only the quote; the vocative `āvuso moggallānā` inside the quote identifies the addressee.
- `mn5:4–7`: the bronze-bowl similes repeat in full in the root. An earlier draft mirrored Sujato's compression and left 60 segments empty; the canonical text now translates every root segment and no segment is empty. `…pe…` markers in the root (18-20.2–3, 22-24.2–3, 26-27.2–3) are kept as `…` around genuinely present content.
- `mn5:17–27`: the four-assemblies and four-requisites wishes are distributed across segments in the root (17.2 monks only; 18-20 nuns/laymen/laywomen; 21.2 monks only; 22-24 nuns/laymen/laywomen; 25.2 robes only; 26-27 food/lodging/medicine). The canonical text trims each segment to its own root content instead of following Sujato's merged renderings (e.g. `mn5:26-27.6` mentions only medicines and provisions for the sick).
- `mn5:29–30`: simile fixes per root: covered with another bronze bowl (not a lid); onlooker subject for lifting/opening; three-term response triads (`amanāpatā/pāṭikulyatā/jegucchatā` vs their positive counterparts) kept distinct; `jaññajaññaṁ viyā` rendered neutrally (`trông thật quý đẹp`) with the EN/TMC split recorded in comments.
- `mn5:32–33`: the long character lists preserve every Pāli item pair; `sikkhāya tibbagāravā` = tôn trọng sâu sắc sự tu học; `pivanti/ghasanti maññe` = như uống lấy, như nuốt lấy; `sabrahmacārī` in 32.3/33.3 read as vocative. The deliberate chiasm `okkamane/paviveke` is preserved across the negative (32.1) and positive (32.2, 33.2) lists instead of mechanical negation.
- Terminology cross-adoptions (audited against the parallel MN5 publication): `appatīta/appaccaya` = bất mãn (not `cay cú`); `paṇīta` = tốt đẹp, kept distinct from `agga` = tốt nhất (15.x); `mahānāgā` = hai bậc long tượng; `kupita` = giận dữ.

## Gate

Canonical publication requires exact Pāli key coverage (203/203 segments), no empty segments, passing repository validation/build, no blocking semantic errors, and arithmetic `final_score > 9.0` under `AGENTS.md`.
