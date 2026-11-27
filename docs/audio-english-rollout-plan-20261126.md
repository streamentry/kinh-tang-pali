# English Audio Rollout Plan

Plan created 2026-11-26; status updated 2026-11-27: provider-free preflight is merged, and player/registration support is under implementation. No English Gemini requests, R2 uploads, or English voice profile changes have been made. The Sujato AI-use gate remains unresolved.

## Goal and scope

Add one standard English-reading track for each sutta whose current reader English has a published translation, across all five Nikāyas. This phase adds English audio for the translated text itself. It does not create English child/adult/senior explanations. Those would be a separate writing and review project.

The track transcript must match the English column the reader resolves: pinned `english-sujato` text where it has words, plus `english-project` only where that layer supplies a published fill. Use the English segments in Pāli order and keep each segment's `enFrom` provenance. Do not translate from Pāli or Vietnamese as part of TTS. Do not speak comments, scorecards, IDs, reviewer notes, or source labels. A blank English segment stays blank; never ask TTS to fill it.

## No-TTS inventory baseline

The current store was scanned without contacting a provider. The committed `npm run audio:english:preflight -- --require-ready` command uses the reader's resolved English at bilara commit `11c9d708978cde8ba61096d8a75f7ddfb846f639` and counts a candidate when it has English prose and no missing English at Pāli segments of 40 or more normalized characters, excluding reference blocks.

| Nikāya | Catalog texts | English candidates | No resolved English | Texts using project fills |
| --- | ---: | ---: | ---: | ---: |
| DN | 34 | 34 | 0 | 34 |
| MN | 152 | 152 | 0 | 129 |
| SN | 1,819 | 1,819 | 0 | 446 |
| AN | 1,781 | 1,781 | 0 | 248 |
| KN | 2,351 | 916 | 1,435 | 203 |
| **Total** | **6,137** | **4,702** | **1,435** | **1,060** |

The latest no-TTS run on 2026-11-26 reproduced the inventory: 4,702 candidates, 1,435 with no English, zero partial/blocked, and candidate UID sets matching the committed inventory. Candidates contain about 9.82 million English characters and 1.68 million whitespace-delimited words. There are 161 project-only English texts, all in KN; the other candidates include Sujato text, sometimes alongside project fills. These figures define a snapshot, not approval to generate or publish audio. The UID lists and run details are recorded in [`audio-english-preflight-inventory-20261126.json`](audio-english-preflight-inventory-20261126.json). Re-run the preflight against the current store before generation.

The pinned upstream manifest has 4,291 `english-sujato` files; the repository's reference audit identifies 1,596 catalog UIDs with no English in that upstream edition. Published project fills account for some texts and some segments, so file counts alone are not the audio candidate count.

Texts with no resolved English stay out of scope until an English translation is published. Do not present the 4,702 candidate count as all 6,137 texts having English.

## Rights and provider gate

At the pinned repository snapshot, [`source/suttacentral.lock.json`](../source/suttacentral.lock.json) records the Sujato edition as third-party, `NOASSERTION`, with attribution required. Current SuttaCentral pages for [DN](https://suttacentral.net/edition/dn/en/sujato), [MN](https://suttacentral.net/edition/mn/en/sujato), [SN](https://suttacentral.net/edition/sn/en/sujato), [AN](https://suttacentral.net/edition/an/en/sujato), and the [Itivuttaka (KN) edition](https://suttacentral.net/edition/iti/en/sujato), together with the [licensing page](https://suttacentral.net/licensing?lang=en), describe CC0 for those works and request that they not be used in AI-derived technologies.

For this project, the default is **no Gemini TTS request using any Sujato-derived segment**. Open that path only after obtaining written permission or documenting an editor/legal decision that explicitly addresses the request and the source terms. A CC0 statement alone is not treated as clearance for AI TTS in this workflow. This is a conservative project rule, not a legal determination. Check each actual source edition, especially KN, rather than assuming one license covers every segment.

Project-authored English fills are declared CC0 in the repository license, but only 161 current texts are project-only; they do not provide a five-Nikāya substitute for the Sujato-derived corpus. If permission for AI-derived audio is not obtained, use human narration for Sujato text or open a separate independent English-translation project. Do not overwrite Sujato with an English fill; the current store explicitly forbids shadowing the reference layer.

The earlier Vietnamese audio authorization does not approve English TTS costs, an English voice, or public English R2 distribution. Resolve source rights, provider use, cost ceiling, and public distribution approval before any TTS or upload.

The inventory contains 161 project-only texts with no Sujato segments; all are in KN. They could support a limited technical pilot after separate English profile, spend, and R2 approval. That pilot would not replace the full 4,702-text goal, and would not authorize TTS of Sujato-derived texts.

## Voice and source profile

Keep `vi-charon-mn1-v1` byte-for-byte. Create a separate English profile and SHA-256 pin only after an English-speaking editor approves sample voice and pace. Do not assume Charon or the Vietnamese style works for English. The English profile must pin its own model, voice, style, chunk limit, pauses, encoding, and 1× default speed. Test ordinary prose, long readings, verse, Pāli names and diacritics, quotations, numbers, and punctuation. No fallback voice or post-generation speed change.

Costing follows the approved English sample and a language-specific chunk preflight. Do not reuse the Vietnamese estimate: these tracks have different source length, chunking, and generated duration. Check provider rates at execution time and obtain an explicit spend ceiling.

## Data and player design

- Keep English registrations separate from Vietnamese originals and the three Vietnamese audience tracks. Proposed sidecar: `content/audio/en/<collection>/<uid>.json`.
- Fingerprint the language, resolved English text, ordered segment IDs, per-segment `enFrom`, pinned source commit, published project-fill identity where used, profile ID/hash, and transcript hash. A source or profile change must make the track stale.
- Store immutable objects under `en/<collection>/<uid>/<content-and-profile-hash>/`. Verify public full SHA-256, byte count, and range responses before registration. Split long readings into ordered parts no longer than 30 minutes using already verified WAVs. Keep media and caches out of Git.
- Add an explicit audio-language choice. Vietnamese remains the default; English is labeled “English translation,” never “original.” English audio is one standard track in this phase. No autoplay; selection requires Play. Auto-next stays in English and stops with a clear message when the next sutta has no English track.
- Enable English in a collection player only when every text in that group has an English track. Do not silently switch to Vietnamese or skip a text.
- Keep `review_status: pending` until a person listens to and approves the spoken English. Voice-and-pace approval does not approve every track's content.

## Phases and gates

1. **Rights decision.** Resolve the Sujato AI-derived-use request and the pinned `NOASSERTION` record. Confirm whether TTS may use Sujato text and whether the resulting audio may be public. If not, stop that source path.
2. **Reproducible preflight.** Run `npm run audio:english:preflight -- --require-ready` before production. It enumerates the five catalogs, resolves English by the reader's layer rules, checks project-fill publication status, and reports missing text, per-segment provenance, exact characters/words, and source hashes without TTS. After an English profile is approved, add a profile-aware dry-run that computes chunk count, duration, and a rate-checked cost estimate without generating audio.
3. **Language-aware player and registry.** Add English without changing the current Vietnamese audio contract. Test mixed provenance, stale-source rejection, no-autoplay, no cross-language fallback, part seeking, and collection completeness.
4. **Profile approval and pilot.** After rights, cost, and provider approvals, prepare five representative English samples (one per Nikāya where an eligible text exists, including prose/verse and long/short material). The editor approves English voice and pace before batch production. Keep sample content review separate and pending.
5. **Serial production.** Generate one UID at a time under the machine-wide TTS lock. Reuse only exact source/profile/chunk-hash cache. Publish small batches grouped by Nikāya; choose batch size after the preflight measures long tracks and PR metadata.
6. **Release verification.** Require exact-head CI green before merge. Continue independent authorized production while CI runs; check each PR at the repository's two-hour interval. After Pages succeeds, use pinned Chrome against the public site and R2 to verify the English selector, play/seek, parts, attribution, collection auto-next, and `review_status`.

## Completion criteria

The technical phase is complete when every rights-cleared candidate UID in the approved preflight has a generated English track, verified R2 registration, merged registration, and current production player proof; collection playback preserves English and stops rather than falling back when a track is missing. Excluded texts, source provenance, and any rights restrictions remain visible in the audit. No English track is considered human-approved until it has actually been heard; all such tracks remain `review_status: pending` until that happens.

## Implementation checkpoint — 2026-11-27

The provider-free preflight command was merged in commit `c7f714e8912eecc56c0fe42f596c5c0e9105025c`. A fresh run is preserved at [`audio-english-preflight-inventory-20261127.json`](audio-english-preflight-inventory-20261127.json): pinned bilara and manifest commit `11c9d708978cde8ba61096d8a75f7ddfb846f639`, 4,702 candidates, 1,435 texts without English, zero partial/blocked candidates, zero provider calls, and zero uploads. It also verifies that all 4,702 candidates currently have a valid Vietnamese original registration; the English sidecar count is zero. These counts are a current snapshot, not rights or production approval.

The player implementation is still on its working branch and has not merged. It adds the `english-standard` track to the existing reader and collection player, reads only `content/audio/en/<collection>/<uid>.json`, binds registrations to the resolved English source, segment provenance, pinned commit, English-fill metadata hash, profile hash, approval references, and R2 verification fields, and keeps `review_status` separate. The English collection option stays disabled unless every text in that collection or group has a verified English track. A saved English choice with no available track stops and reports that Vietnamese audio was not started. Vietnamese remains the default; selecting a track does not autoplay.

Local verification on the working branch: 594 tests (590 passed, 4 skipped); validation passed with 2,275 existing warnings; quality history checked 5,840 records with no errors; explanation audit checked 558 published audience versions with no errors; Astro check had zero errors/warnings and 52 hints; design check passed. Direct Astro build rendered 7,814 pages and Pagefind indexed 6,991. Installed Chrome verified the selector, no-autoplay state, no cross-language fallback, group completeness rule, and no horizontal overflow at 1440, 1024, 390, and 320 px. External HTTPS requests were blocked during this local UI check, so it does not prove R2 playback or English audio behavior.

No English profile or audio sidecars have been created. Rights, provider, sample, budget, and public-distribution approvals remain unresolved. Human listening remains pending for any future track.

## Repository references

- English layer precedence: [`source/layers.yaml`](../source/layers.yaml).
- Pinned edition, license record, and project-content license: [`source/suttacentral.lock.json`](../source/suttacentral.lock.json).
- Provider-free preflight implementation and source fingerprinting: [`scripts/audio-english-preflight.ts`](../scripts/audio-english-preflight.ts), [`src/lib/canon/english-audio.ts`](../src/lib/canon/english-audio.ts).
- Initial source and eligibility snapshot: [`audio-english-preflight-inventory-20261126.json`](audio-english-preflight-inventory-20261126.json).
- Current provider-free snapshot: [`audio-english-preflight-inventory-20261127.json`](audio-english-preflight-inventory-20261127.json).
- Existing Vietnamese audio contract and no-ASR/review rules: [`docs/audio.md`](audio.md).
