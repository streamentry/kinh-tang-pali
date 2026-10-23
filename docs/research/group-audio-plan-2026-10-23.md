# Audio for the new SN / AN / KN groups

**Execution update, 2026-10-24:** the editor explicitly changed the execution
goal to “move to next phase to complete all audio and check CI back and merge
later (2h for each run)”. Production is now authorized for the full SN/AN/KN
scope below without waiting for pilot listening acceptance. The original
proposal and its staged rationale remain recorded below; its permission gate
is superseded by this newer decision. Keep all human content reviews pending
until actually heard and approved. Keep serial generation, the pinned MN1
profile, all source/file/QC safeguards and five-upload PR cadence; continue TTS
while PR CI runs and revisit each run after two hours before merging green
exact-head checks. No parallel TTS, ASR, voice migration or invented summaries.

Design proposal, 2026-10-23. Inspected main at
`cbfcc60c373aebb9b364360dc67e9b87ac8cd1a3` after pulling PRs #816–820.
No TTS requests, uploads or production changes were made for this proposal.

## Recommendation

**Generate each existing reading UID once; let every group reuse those recordings
in canonical navigation order.** The production scheduling unit can be a phẩm,
but the reusable source/audio identity remains the reader UID. Keep the approved
MN1 narration profile exactly as pinned.

For very short texts, add a continuous downloadable phẩm recording assembled
from the same validated WAV cache. This is a derived export, not another TTS
generation. It can provide uninterrupted listening while preserving individual
text links and repair granularity. Larger ancestors remain playlists of existing
assets rather than separate narrations of the same scripture.

The strongest alternative is one MP3 per phẩm from the outset. It gives a coherent
listening session and fewer public objects, but some groups are very long, the
current player expects per-UID assets, and per-text buttons would need reliable
chapter offsets and bounded playback. Starting with reusable UID assets fits the
existing UI and source validation; derive compilations once the pilot is heard.

## What is actually present

The new group route already calls `groupTexts()` and `loadAudio()` and passes
valid tracks to `CollectionAudio`. It explicitly says missing tracks are skipped
and playback stops at the end. There are currently no SN/AN/KN audio registrations.

The local inventory read every current document through `composeDocument()` and
`narrationSource()`, preserving the store's ownership rules. Snapshot:

| Collection | Reading UIDs | Published candidates | Draft | Leaf-only groups |
| --- | ---: | ---: | ---: | ---: |
| SN | 1,819 | 1,819 | 0 | 231 |
| AN | 1,781 | 1,781 | 0 | 186 |
| KN | 2,351 | 2,351 | 0 | 252 |

All 5,951 documents have Vietnamese for their non-title Pāli content segments;
none has a per-text summary. Published status makes a text a technical candidate,
not evidence that its future spoken audio is correct. PR #820 repaired and
republished the 21 former KN drafts. Future downgrades must block affected
recordings again. Known source/QC issues recorded in
`docs/navigation.md` must also be triaged before their affected passages are read.
Do not silently fix or remove canonical colophons in a TTS transcript.

All 669 leaf-only groups now contain only published candidates.
**Leaf groups do not cover the entire catalog:** `cnd23` is a direct child of the
mixed group `cnd`; `ne1`, `ne2`, `ne3`, `ne36`, `ne37` belong directly to mixed
group `ne`. Queue all UIDs through navigation traversal and record their home
groups; a scheduler that processes only leaf-only groups loses these six texts.

The snapshot is [group-audio-inventory-2026-10-23.json](group-audio-inventory-2026-10-23.json).
Counts must be recomputed when source text or publication status changes.

## Size and listening-session implications

The measured scripture-only text totals 12,724,860 characters.
Of 5,951 units, 878 contain fewer than 250 characters.
This supports a later compilation option for short verses, but is not a reason
to invent or expand range UIDs.

As a rough planning calibration, current MN1 has 22,152 narration characters over
1,734.79 seconds, about 12.77 characters/second. Applying that rate is an estimate
only: Vietnamese prose, verses, names, omissions and pause density differ. It is
not an API speed parameter, quota forecast or promise of generated duration.

| Group | Current members | Scripture characters | Rough duration at MN1 rate |
| --- | ---: | ---: | ---: |
| `sn1-nalavagga` — Phẩm Cây Lau | 10 | 5,026 | 7 min |
| `sn12-aharavagga` — Phẩm Đoàn Thực | 10 | 25,861 | 34 min |
| `an3-mahavagga` — Phẩm Lớn | 10 | 78,247 | 102 min |
| `snp-atthakavagga` | 16 | 33,573 | 44 min |

The same crude extrapolation for all scripture is about 277 hours before new
spoken headings, summaries and additional assembly pauses. Do a transcript/chunk
inventory and current provider-price check before authorizing a corpus budget;
do not extrapolate a bill from the character count alone.

Group sizes vary widely: KN has a leaf group near 891,000 characters. The web
reading budget (800 segments / 30 texts) measures HTML, not audio duration.
Use a separate configurable audio-export budget, provisionally targeting 20–30
minute listening parts at existing text boundaries. Measure actual generated WAV
duration; a long single text can have multiple parts without acquiring new
canonical UIDs. Part IDs are audio metadata, not new sutta identities.

## Transcript policy to decide before production

MN/DN keep their existing summary-first contract and source hashes. For SN/AN/KN,
propose **verified text title followed by canonical Vietnamese content**, with no
per-text generated summary. Read no UID, segment ID, translation note, quality
record, image caption or provenance machinery. Handle standalone omissions as
the existing approved pause policy; never expand omitted passages.

At group level, a reviewed group summary could be a separate introductory track
played once before the members. No such summary registry currently exists. It
would need authoring from the actual whole group, attribution as project prose,
source hash, review and a distinct asset type. A title/range announcement is a
structural introduction, not a summary. For the first pilot, verified headings
and scripture are sufficient; do not invent summaries merely to pass today's
MN/DN-specific validator. This is a proposed SN/AN/KN policy, not a change already
approved or implemented.

Preserve `vi-charon-mn1-v1`, model, Charon, exact style, chunk ceiling, pauses,
encoding and 1× default. Split locally into the approved bounded requests and
resume sequentially under the existing machine lock. Keep style in speech
metadata, separate from the spoken transcript. The official [Gemini speech
generation documentation](https://ai.google.dev/gemini-api/docs/speech-generation)
also separates verbatim text from delivery metadata; no provider or voice
migration is required for this design.

## Assets, reuse and invalidation

Maintain three distinct identities:

1. **Reading asset:** collection + canonical UID + spoken-text hash + profile
   hash + transcript-policy version. A range UID stays a range. AN individual
   pages served by a bundle use their own owned segments, not repeated copies of
   the whole source file.
2. **Group playlist:** group ID plus its ordered descendant reading assets.
   Recompute from navigation. A membership/order change updates the playlist;
   it does not by itself require regenerating unchanged speech.
3. **Optional compilation:** ordered asset/chunk hashes + any reviewed intro +
   assembly policy. Encode from WAV/PCM once, retain a chapter table derived from
   exact WAV boundaries. Do not concatenate independently encoded MP3 byte streams
   and assume chapter times remain exact.

Generate/cache speech at boundaries that permit a text's chapter timing to be
known from WAV durations. Without ASR/alignment, a request spanning multiple
texts does not establish accurate within-request chapter offsets. Do not present
estimated offsets as verified per-text timing.

Spoken title changes affect a reading asset; group-title changes affect only a
spoken group intro/compilation when one exists. Notes-only edits do not invalidate
speech. Recheck current source **and current publication status** before upload
and playback: today's `loadAudio()` checks the narration hash but does not itself
reject a document whose status was downgraded without changing the text.

Use the existing public audio bucket and immutable content-hash keys, e.g.
`vi/sn/sn1.1/<audio-hash>.mp3`, `vi/an/an1.1/<audio-hash>.mp3`,
`vi/kn/dhp1-20/<audio-hash>.mp3`. Derivative exports need a distinct group namespace.
Keep MP3/WAV/cache outside Git and preserve superseded assets/QC history.

## Engineering work required

This is more than removing a UID regex:

- `scripts/audio-source.ts` currently accepts only MN/DN; add catalog-validated
  collection/UID resolution for heterogeneous KN IDs and explicit narration modes.
- `narrationIssues()` currently requires a summary for every text; retain that
  rule for MN/DN and add a deliberate scripture-only contract for the new scope.
- `scripts/audio-r2.py` currently maps every non-MN UID to **DN**. Replace that
  fall-through with the verified source collection before accepting any new UID.
- Inventory/progress and `check-audio-progress.ts` are MN/DN-specific. Add a
  versioned new-scope registry or an explicit backward-compatible extension;
  preserve all historical MN/DN evidence and validate statuses independently.
- Cache by exact source/profile/text, enforce complete owned-segment accounting,
  checkpoint after each request, and recheck source/status before publication.
- Extend registration/player metadata for scripture-only mode and future parts.
  Show “Kinh văn” from 0 when no summary exists; do not label a phantom summary.
- Use a minimal player DTO. Current group routes spread the entire loaded audio
  JSON into tracks; avoid sending profile snapshots and QC histories for thousands
  of tracks in every ancestor's HTML. Check playlist payloads and lazy loading.
- Keep partial groups explicit: “5/10 có audio” is valid; do not advertise a
  complete phẩm recording if a required member is draft, missing or stale.

Before compilation work, the new per-UID MP3 registrations can already feed the
existing group playlist route. A cached member is reused in every ancestor;
there is no need to synthesize separate copies for a thiên, tương ưng and phẩm.

## Rollout

First implement and test preparation/inventory without calling the provider.
Verify every one of the 5,951 UIDs is either eligible or explicitly blocked,
including six mixed-group texts. Preserve existing MN1/DN22 behavior and hashes.

Then propose one complete pilot: **Phẩm Cây Lau, SN1.1–SN1.10**, roughly seven
minutes before extra headings/pauses. It is short enough for complete manual
listening and exercises prose/verse transitions. Hear the approved MN1 sample
alongside it; keep review pending until the editor approves actual content.

After acceptance, exercise an AN bundle, a ranged Pháp Cú chapter and the larger
SN12.11–20/SNP4 group before broadening. Use AN3.61–70 as a long-session/parts
stress case, not the first sample. Recheck current publication status before
each generation and upload; do not rely on this snapshot for later releases.

Generate one request at a time, upload completed assets with public hash/range
verification, and publish in the existing five-successful-asset PR cadence.
After a merge, subsequent generation can continue without waiting for Pages;
mark live only after the deployed player is verified. Keep ASR disabled per the
editor's decision, retain manual-listening status separately, and do not use
duration or file integrity as evidence that every spoken word is correct.

This document records a proposal. Committing or merging it does not itself start
TTS generation or authorize an unbounded corpus run. A subsequent execution goal
must state the pilot scope and preserve its manual-listening acceptance gate
before broadening. No provider call is needed to review or merge this document.
