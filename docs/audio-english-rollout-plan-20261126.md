# English Audio Rollout Plan

Plan created 2026-11-26; status updated 2026-11-28: the provider-free preflight and English player are merged. PR [#2115](https://github.com/streamentry/kinh-tang-pali/pull/2115) is on main as `9504d64aa7000a9f0609e6ae20fd4113c9fc0d3b`. The editor's Gemini-TTS accessibility decision is recorded in [the 2026-11-28 decision](editorial-decisions-2026-11-28-english-audio.md). No English Gemini requests, R2 uploads, or English voice profile changes have been made. Provider/model/tier, voice/sample, spend ceiling, public distribution, and exact UID/source approvals remain pending.

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

At the pinned repository snapshot, [`source/suttacentral.lock.json`](../source/suttacentral.lock.json) records the Sujato edition as third-party, `NOASSERTION`, with attribution required. The [2026-11-27 source review in the approval packet](audio-english-approval-packet-20261127.md) records that SuttaCentral's edition pages for [DN](https://suttacentral.net/edition/dn/en/sujato), [MN](https://suttacentral.net/edition/mn/en/sujato), [SN](https://suttacentral.net/edition/sn/en/sujato), [AN](https://suttacentral.net/edition/an/en/sujato), and the [Itivuttaka (KN) edition](https://suttacentral.net/edition/iti/en/sujato) describe CC0, while the [licensing page](https://suttacentral.net/licensing?lang=en) requests that its material not be used in AI-derived technologies. Direct retrieval on 2026-11-28 returned only a JavaScript browser-check page; this update does not claim those terms were re-read today.

The editor recorded a project decision on 2026-11-28 to use Gemini TTS for accessible readings of the current resolved English text, explicitly acknowledging that the resulting audio is AI-generated and AI-derived and choosing to proceed despite the request documented in the approval packet. See [the decision record](editorial-decisions-2026-11-28-english-audio.md). This is an internal editorial choice, not written permission, a legal determination, or a change to any pinned source term. It does not approve public distribution. Check each actual source edition, especially KN, rather than assuming one license covers every segment.

Project-authored English fills are declared CC0 in the repository license, but only 161 current texts are project-only; they do not provide a five-Nikāya substitute for the Sujato-derived corpus. The editor's decision covers the current accessible-audio project scope, but every source, provider, cost, sample, UID, and distribution gate still applies. Do not overwrite Sujato with an English fill; the current store explicitly forbids shadowing the reference layer.

The earlier Vietnamese audio authorization does not approve English TTS costs, an English voice, or public English R2 distribution. The 2026-11-28 decision selects Gemini TTS for the accessibility purpose and records the editor's position on AI-derived use; it does not authorize API requests or public uploads. Complete the manifest's source-rights requirements, exact provider/model/tier approval, sample/profile approval, full cost ceiling, UID/source-hash authorization, and public-distribution approval first.

The inventory contains 161 project-only texts with no Sujato segments; all are in KN. They could support a limited technical pilot after separate English profile, spend, and R2 approval. That pilot would not replace the full 4,702-text goal, and would not authorize TTS of Sujato-derived texts.

The release gate follows segment provenance: any UID with at least one `english-sujato` segment requires a source-rights decision that records written permission or an editor/legal decision, explicitly allows AI-derived TTS and public audio, and points to the decision's covered source scope. Project-only UIDs may omit Sujato clearance only while the current lock declares CC0 for `content/translation/en/project`; they still require the provider, profile/sample, full cost, public distribution, exact source-hash allowlist, and all other approvals. The provider-free authorization audit supports `--project-only` for that restricted scope, while its default remains the full candidate set. A project-only pass is only a pilot authorization and never full-goal completion.

## Voice and source profile

Keep `vi-charon-mn1-v1` byte-for-byte. Create a separate English profile and SHA-256 pin only after an English-speaking editor approves sample voice and pace. Do not assume Charon or the Vietnamese style works for English. The English profile must pin its own model, voice, style, chunk limit, pauses, encoding, and 1× default speed. Test ordinary prose, long readings, verse, Pāli names and diacritics, quotations, numbers, and punctuation. No fallback voice or post-generation speed change.

Costing follows the approved English sample and a language-specific chunk preflight. Do not reuse the Vietnamese estimate: these tracks have different source length, chunking, and generated duration. Check provider rates at execution time and obtain an explicit spend ceiling.

## Data and player design

- Keep English registrations separate from Vietnamese originals and the three Vietnamese audience tracks. Proposed sidecar: `content/audio/en/<collection>/<uid>.json`.
- Fingerprint the language, resolved English text, ordered segment IDs, per-segment `enFrom`, pinned source commit, published project-fill identity where used, profile ID/hash, and transcript hash. A source or profile change must make the track stale.
- Store immutable objects under `en/<collection>/<uid>/<content-and-profile-hash>/`. Bind each registration to the approved R2 bucket and public base URL; single-file and per-part keys must contain the source/profile fingerprint and that object's SHA-256. Verify public full SHA-256, byte count, and range responses before registration. Split long readings into ordered parts no longer than 30 minutes using already verified WAVs. Keep media and caches out of Git.
- Add an explicit audio-language choice. Vietnamese remains the default; English is labeled “English translation,” never “original.” English audio is one standard track in this phase. No autoplay; selection requires Play. Auto-next stays in English and stops with a clear message when the next sutta has no English track.
- Enable English in a collection player only when every text in that group has an English track. Do not silently switch to Vietnamese or skip a text.
- Keep `review_status: pending` until a person listens to and approves the spoken English. Voice-and-pace approval does not approve every track's content.

## Phases and gates

1. **Decision and source gates.** The editor's project decision on AI-derived TTS for accessibility is recorded. Keep the pinned `NOASSERTION` source record unchanged and make no legal-clearance claim. The approval manifest still requires its complete source-rights disposition, including public-audio permission, while the separate public-distribution approval must identify the actual destination. If those gates are incomplete, stop before TTS or upload.
2. **Reproducible preflight.** Run `npm run audio:english:preflight -- --require-ready` before production. It enumerates the five catalogs, resolves English by the reader's layer rules, checks project-fill publication status, and reports missing text, per-segment provenance, exact characters/words, and source hashes without TTS. After an English profile is approved, add a profile-aware dry-run that computes chunk count, duration, and a rate-checked cost estimate without generating audio.
3. **Language-aware player and registry.** Add English without changing the current Vietnamese audio contract. Test mixed provenance, stale-source rejection, no-autoplay, no cross-language fallback, part seeking, and collection completeness.
4. **Profile approval and pilot.** After rights, cost, and provider approvals, prepare five representative English samples (one per Nikāya where an eligible text exists, including prose/verse and long/short material). The editor approves English voice and pace before batch production. Keep sample content review separate and pending.
5. **Serial production.** Generate one UID at a time under the existing machine-wide OS flock at `Path(tempfile.gettempdir()) / 'kinh-tang-pali-tts.lock'`, established by `scripts/gemini_tts.py`. The English generator must use that same lock, but must not invoke the Vietnamese generator or profile. Recheck the exact per-UID approval, source, profile, and chunk hashes before each request, and stay within the approved all-in budget. Reuse only exact source/profile/chunk-hash cache. Publish small batches grouped by Nikāya; choose batch size after the preflight measures long tracks and PR metadata.
6. **Release verification.** Require exact-head CI green before merge. Continue independent authorized production while CI runs; check each PR at the repository's two-hour interval. After Pages succeeds, use pinned Chrome against the public site and R2 to verify the English selector, play/seek, parts, attribution, collection auto-next, and `review_status`.

## Completion criteria

The full audio-delivery goal remains the complete candidate set from the final current preflight. Rights, provider, profile/sample, budget, and distribution approvals are prerequisites for producing those candidates; they do not narrow the objective. If any candidate remains blocked or lacks audio because an approval is unresolved, the five-Nikāya goal remains incomplete. Do not report a rights-cleared subset or a KN-only pilot as completion.

Audio delivery is complete only when every candidate UID in the final preflight has been generated, R2-verified, registered, merged, and confirmed in the current production player; collection playback must preserve English and stop rather than fall back when a track is missing. Catalog texts with no resolved English remain outside the current candidate set and must be listed as exclusions; if a published English source later makes one eligible, include it in the next preflight. Keep source provenance and remaining rights restrictions visible in the audit.

Human listening is a separate approval layer. No English track is considered human-approved until a person has actually heard and approved its spoken content; otherwise keep `review_status: pending`.

## Implementation checkpoint — 2026-11-27

The provider-free preflight command was merged in commit `c7f714e8912eecc56c0fe42f596c5c0e9105025c`. The latest run, generated `2026-11-27T15:05:09Z`, is preserved at [`audio-english-preflight-inventory-20261127.json`](audio-english-preflight-inventory-20261127.json): pinned bilara and manifest commit `11c9d708978cde8ba61096d8a75f7ddfb846f639`, 4,702 candidates, 1,435 texts without English, zero partial/blocked candidates, zero provider calls, and zero uploads. It also verifies that all 4,702 candidates currently have a valid Vietnamese original registration; the English sidecar count is zero. These counts are a current snapshot, not rights or production approval.

Player and registration support merged in PR #2113 at `03c5be00a9704a07e7f0629d1ca5818d35b0f1de`. It adds the `english-standard` track to the existing reader and collection player, reads only `content/audio/en/<collection>/<uid>.json`, binds registrations to the resolved English source, segment provenance, pinned commit, English-fill metadata hash, profile hash, approval references, and R2 verification fields, and keeps `review_status` separate. The English collection option stays disabled unless every text in that collection or group has a verified English track. A saved English choice with no available track stops and reports that Vietnamese audio was not started. Vietnamese remains the default; selecting a track does not autoplay.

PR #2113 local verification before merge: 594 tests (590 passed, 4 skipped); validation passed with 2,275 existing warnings; quality history checked 5,840 records with no errors; explanation audit checked 558 published audience versions with no errors; Astro check had zero errors/warnings and 52 hints; design check passed. Direct Astro build rendered 7,814 pages and Pagefind indexed 6,991. Installed Chrome verified the selector, no-autoplay state, no cross-language fallback, group completeness rule, and no horizontal overflow at 1440, 1024, 390, and 320 px. External HTTPS requests were blocked during that local UI check, so it does not prove R2 playback or English audio behavior.

Pages run `45999632315` deployed the merged player commit. Production Chrome confirmed the English-unavailable state, no autoplay or Vietnamese playback fallback, collection disablement, and narrow-screen layout. It also found that the native audio element requested the Vietnamese original before a tap because it advertised metadata preload. PR #2115 addresses that request and the native English-path gaps; its current branch adds the pending approval manifest and tests English resumption and auto-next. Exact-head CI is pending, and a fresh production check is still required after merge. No English assets exist, so English play/seek has not been tested and is not applicable yet.

No English profile or audio sidecars have been created. Rights, provider, sample, budget, and public-distribution approvals remain unresolved. Human listening remains pending for any future track. The provider-free source-by-source rights audit and decision packet are in [`audio-english-approval-packet-20261127.md`](audio-english-approval-packet-20261127.md) and [`audio-english-source-rights-map-20261127.json`](audio-english-source-rights-map-20261127.json); these records do not grant TTS or distribution authorization.

## Repository references

- English layer precedence: [`source/layers.yaml`](../source/layers.yaml).
- Pinned edition, license record, and project-content license: [`source/suttacentral.lock.json`](../source/suttacentral.lock.json).
- Provider-free preflight implementation and source fingerprinting: [`scripts/audio-english-preflight.ts`](../scripts/audio-english-preflight.ts), [`src/lib/canon/english-audio.ts`](../src/lib/canon/english-audio.ts).
- Initial source and eligibility snapshot: [`audio-english-preflight-inventory-20261126.json`](audio-english-preflight-inventory-20261126.json).
- Current provider-free snapshot: [`audio-english-preflight-inventory-20261127.json`](audio-english-preflight-inventory-20261127.json).
- Per-UID source and rights map plus decision packet: [`audio-english-source-rights-map-20261127.json`](audio-english-source-rights-map-20261127.json) and [`audio-english-approval-packet-20261127.md`](audio-english-approval-packet-20261127.md), merged in PR #2114 at `96488ffa9ec2088149586b79122fe92886df5ee3`. These provider-free records do not grant TTS or distribution authorization.
- Provider-free approval allowlist audit: [`scripts/audio-english-authorization-check.ts`](../scripts/audio-english-authorization-check.ts), gated by [`source/english-audio-approvals.json`](../source/english-audio-approvals.json). It makes no provider calls or uploads.
- Post-merge no-audio production smoke: [`scripts/verify-english-player-lazy-load.py`](../scripts/verify-english-player-lazy-load.py). Run only after a successful Pages deployment, using the pinned player-venv and installed Chrome. It aborts media requests before transfer and verifies the no-prefetch/unavailable state; it does not prove English playback, seeking, or spoken content.
- Existing Vietnamese audio contract and no-ASR/review rules: [`docs/audio.md`](audio.md).

## Latest implementation checkpoint — 2026-11-27 UTC

PR #2114 merged as `96488ffa9ec2088149586b79122fe92886df5ee3`. A fresh provider-free preflight at `2026-11-27T18:03:31Z` reproduced the pinned snapshot: 4,702 candidates, 1,435 texts without English, zero partial or blocked candidates, and zero provider calls or uploads. A fresh source map matched all 4,702 committed UID and source-hash records. The approval audit found 0/4,702 UIDs authorized; source-rights, provider, cost, voice-sample, public-distribution, profile, and per-UID identity approvals remain pending.

PR #2115 remains open for player and fail-closed registration work. Its prior native browser check failed because the fixture expected media to load when a listener selected a version. The fixture now matches the source-free player markup and checks that audio loads only after explicit Play; hosted CI on the updated branch is required to verify this path. Local unit verification after the R2 identity and catalog-key tests passed 602 tests (597 passed, 5 skipped), and `npm run check` reported 0 errors, 0 warnings, and 5 existing hints. The Node native-bridge integration file could not run locally because its Playwright package is absent from that worktree. A separate local Astro preview smoke used the pinned Python Playwright 1.55.0 and Chrome 158.0.8127.37; all seven assertions passed on three pages. It observed zero audio requests before interaction and one media request after an explicit tap, which was aborted before transfer. This is local player evidence only, not production or English playback/seek evidence. A prior full build reached 2.9 GB in ignored `dist/` during image-variant optimization and was stopped; its partial output was removed.

The fresh authorization audit at `2026-11-27T18:54:34Z` found 0/4,702 UIDs authorized. The rights, provider, cost ceiling, voice sample, public distribution, profile, and per-UID source-identity gates remain pending. It recorded zero provider calls and zero uploads. The authorization command exits nonzero by default if any current candidate is blocked or the allowlist contains a UID outside the current preflight. Use `--report-only` only for diagnostic output; it is not a production authorization gate.

English registration validation binds each object to the approved R2 bucket and HTTPS base URL. Its shared key builder binds the UID, source/profile hashes, and object checksum, and is tested against every current catalog UID. Multipart tracks carry and validate a separate immutable key for each part.

No English profile or sidecar audio exists. No English provider call or R2 write has occurred. Human listening remains pending. The full five-Nikāya goal remains incomplete.


## Current decision and state — 2026-11-28

The English player and fail-closed authorization path merged in PR [#2115](https://github.com/streamentry/kinh-tang-pali/pull/2115) at main commit `9504d64aa7000a9f0609e6ae20fd4113c9fc0d3b`. The editor's decision to use Gemini TTS for accessible readings of existing resolved English text, while acknowledging the AI-derived output and SuttaCentral request, is recorded in [editorial-decisions-2026-11-28-english-audio.md](editorial-decisions-2026-11-28-english-audio.md).

This decision does not change source license declarations or claim legal permission. No provider call, English sample/profile, generated audio, or R2 upload is authorized by this record alone. The approval manifest remains pending with an empty UID/source-hash allowlist; model/tier, voice/sample, spend ceiling, source-rights disposition, and public R2 destination remain unresolved. Human listening remains pending for any future audio.
