# English Audio Rollout Plan

Plan created 2026-11-26; status updated 2026-11-28: the provider-free preflight and English player are merged. PR [#2115](https://github.com/streamentry/kinh-tang-pali/pull/2115) is on main as `9504d64aa7000a9f0609e6ae20fd4113c9fc0d3b`; the later editor decision merged in PR [#2116](https://github.com/streamentry/kinh-tang-pali/pull/2116) as `8505551f682f46e7c11e2560c8ade90a165f6b12`. A fresh preflight confirms 4,702 candidates with no partial or blocked entries. English local TTS generation has started under the approved $400 TTS-only ceiling. Five voice samples and full local tracks for SN1.1 and DN1 exist; no R2 upload or registration exists. The English voice profile is pinned; spoken-content review remains pending. The release manifest and public-distribution gate remain pending.

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

The latest no-TTS run on 2026-11-26 reproduced the inventory: 4,702 candidates, 1,435 with no English, zero partial/blocked, and candidate UID sets matching the committed inventory. The fresh 2026-11-28 preflight matched the same UID set and source commit. Candidates contain about 9.82 million English characters and 1.68 million whitespace-delimited words. There are 161 project-only English texts, all in KN; the other candidates include Sujato text, sometimes alongside project fills. These figures define the authorized generation snapshot; they do not authorize public release. The UID lists and run details are recorded in [`audio-english-preflight-inventory-20261126.json`](audio-english-preflight-inventory-20261126.json). Re-run the preflight against the current store before generation.

The pinned upstream manifest has 4,291 `english-sujato` files; the repository's reference audit identifies 1,596 catalog UIDs with no English in that upstream edition. Published project fills account for some texts and some segments, so file counts alone are not the audio candidate count.

Texts with no resolved English stay out of scope until an English translation is published. Do not present the 4,702 candidate count as all 6,137 texts having English.

## Rights and provider gate

At the pinned repository snapshot, [`source/suttacentral.lock.json`](../source/suttacentral.lock.json) records the Sujato edition as third-party, `NOASSERTION`, with attribution required. The [2026-11-27 source review in the approval packet](audio-english-approval-packet-20261127.md) records that SuttaCentral's edition pages for [DN](https://suttacentral.net/edition/dn/en/sujato), [MN](https://suttacentral.net/edition/mn/en/sujato), [SN](https://suttacentral.net/edition/sn/en/sujato), [AN](https://suttacentral.net/edition/an/en/sujato), and the [Itivuttaka (KN) edition](https://suttacentral.net/edition/iti/en/sujato) describe CC0, while the [licensing page](https://suttacentral.net/licensing?lang=en) requests that its material not be used in AI-derived technologies. Direct retrieval on 2026-11-28 returned only a JavaScript browser-check page; this update does not claim those terms were re-read today.

The editor chose Gemini TTS for accessible readings of the current resolved English text and acknowledged that the output is AI-generated and AI-derived. The user later authorized local generation for the pinned 4,702-UID scope under a $400 TTS-only ceiling after approving the sample voice. See [the decision record](editorial-decisions-2026-11-28-english-audio.md) and [generation authorization](../source/english-audio-generation-authorization.json). These are internal project decisions, not written permission, a legal determination, or a change to a pinned source term. Public audio distribution remains unapproved. Check each actual source edition, especially KN, rather than assuming one license covers every segment.

Project-authored English fills are declared CC0 in the repository license, but only 161 current texts are project-only; they do not provide a five-Nikāya substitute for the Sujato-derived corpus. The local-generation authorization covers the current accessible-audio source map only; it does not alter source terms or release approvals. Do not overwrite Sujato with an English fill; the current store explicitly forbids shadowing the reference layer.

The earlier Vietnamese audio authorization did not set the English budget. The later English instruction authorizes serial Gemini TTS for the pinned resolved-English scope under a $400 TTS-only cap; it does not approve public R2 distribution or alter source license records. The production release manifest remains pending until its source-rights and destination requirements are met.

The inventory contains 161 project-only texts with no Sujato segments; all are in KN. They could support a limited technical pilot after separate English profile, spend, and R2 approval. That pilot would not replace the full 4,702-text goal, and would not authorize TTS of Sujato-derived texts.

The release gate follows segment provenance: any UID with at least one `english-sujato` segment requires a source-rights decision that records written permission or an editor/legal decision, explicitly allows AI-derived TTS and public audio, and points to the decision's covered source scope. Project-only UIDs may omit Sujato clearance only while the current lock declares CC0 for `content/translation/en/project`; they still require the provider, profile/sample, full cost, public distribution, exact source-hash allowlist, and all other approvals. The provider-free authorization audit supports `--project-only` for that restricted scope, while its default remains the full candidate set. A project-only pass is only a pilot authorization and never full-goal completion.

## Voice and source profile

Keep `vi-charon-mn1-v1` byte-for-byte. A separate English profile, `en-iapetus-gemini38-v1`, pins `gemini-3.8-flash-tts`, Iapetus, the sample style, 3,000-character chunks, 0.35-second chunk pauses, mono 24 kHz WAV source, 160 kbps MP3, and default 1× playback. The editor approved the sample voice and pace. The profile does not approve spoken content; keep every generated track's `review_status: pending` until a person listens. Continue checking long readings, verse, Pāli names and diacritics, quotations, numbers, and punctuation. No fallback voice or post-generation speed change.

The editor set a $400 ceiling for Gemini TTS input and audio generation over the pinned 4,702-UID scope, including sample calls; R2 costs are excluded. The current source snapshot contains 1,678,442 words. The Standard Paid output-only estimate was about $151 at 150 wpm through 2026-12-31 and about $302 at rates starting 2027-01-01; input, retries, and pauses are additional. The batch runner estimates cost from measured audio duration and stops before the cap. The account's billing tier is not independently verified; recheck rates and account tier before a long run.

## Data and player design

- Keep English registrations separate from Vietnamese originals and the three Vietnamese audience tracks. Proposed sidecar: `content/audio/en/<collection>/<uid>.json`.
- Fingerprint the language, resolved English text, ordered segment IDs, per-segment `enFrom`, pinned source commit, published project-fill identity where used, profile ID/hash, and transcript hash. A source or profile change must make the track stale.
- Store immutable objects under `en/<collection>/<uid>/<content-and-profile-hash>/`. Bind each registration to the approved R2 bucket and public base URL; single-file and per-part keys must contain the source/profile fingerprint and that object's SHA-256. Verify public full SHA-256, byte count, and range responses before registration. Split long readings into ordered parts no longer than 30 minutes using already verified WAVs. Keep media and caches out of Git.
- Add an explicit audio-language choice. Vietnamese remains the default; English is labeled “English translation,” never “original.” English audio is one standard track in this phase. No autoplay; selection requires Play. Auto-next stays in English and stops with a clear message when the next sutta has no English track.
- Enable English in a collection player only when every text in that group has an English track. Do not silently switch to Vietnamese or skip a text.
- Keep `review_status: pending` until a person listens to and approves the spoken English. Voice-and-pace approval does not approve every track's content.

## Phases and gates

1. **Decision and source gates.** The internal editor decision allows local AI-derived TTS for accessibility on the pinned source scope; do not change `NOASSERTION` or claim legal clearance. Public R2 distribution and release registration remain gated by the separate release manifest.
2. **Reproducible preflight.** Run `npm run audio:english:preflight -- --require-ready` before a new source scope. The 2026-11-28 run reproduced the saved 4,702-UID set with zero partial or blocked texts and zero R2 uploads. The generator has a no-provider `--prepare-only` mode that reports per-UID chunks and estimated TTS cost.
3. **Language-aware player and registry.** Add English without changing the current Vietnamese audio contract. Test mixed provenance, stale-source rejection, no-autoplay, no cross-language fallback, part seeking, and collection completeness.
4. **Profile and sample review.** Five short samples were generated, and the editor approved the Iapetus voice. Full spoken-content review remains pending. Continue long-form and part-boundary checks while generating; do not treat voice approval as content approval.
5. **Serial production.** Generate one UID at a time under the machine-wide `kinh-tang-pali-tts.lock`. The English generator uses its own profile and local-generation authorization, not the Vietnamese generator or profile. It rechecks each source identity before requests, caches exact chunks, makes no automatic retries, and stops before the $400 estimated TTS cap. Current production started with DN1; local MP3 parts remain unregistered and unuploaded.
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

This decision does not change source license declarations or claim legal permission. The later local-generation authorization is separate from the release manifest, which remains pending with an empty UID registration allowlist. Public R2 destination and distribution remain unapproved. Five short voice samples and complete SN1.1 and DN1 tracks are in the ignored local cache; estimated TTS spend so far is $1.17177 of the $400 cap. No audio is registered or public. Spoken-content review remains pending.

## Generation checkpoint — 2026-11-28

The follow-up editor authorization, English profile, and scope pin are in `source/english-audio-generation-authorization.json` and `source/english-narration-profile.json`. The source map and fresh provider-free preflight agree on the exact 4,702-UID set at Bilara commit `11c9d708978cde8ba61096d8a75f7ddfb846f639`.

The editor approved the Iapetus sample voice and selected a $400 TTS-only ceiling. Five 60-word voice samples were generated serially. Complete local SN1.1 and DN1 tracks were generated or reused from the already-generated SN1.1 preview. DN1 used 23 TTS requests and produced three MP3 parts of 1,714.6s, 1,775.6s, and 1,437.2s. The estimated cumulative TTS cost is $1.17177, including the six prior sample calls. All media remains in the ignored `audio/english/` cache or `/private/tmp`; no audio was committed, registered, or uploaded. Every track remains `review_status: pending`.

R2 and player release are still blocked on a public destination and release approvals. The account's Standard Paid billing tier is an estimate basis, not independently verified. The production runner continues serially from the pinned source map and stops at the $400 TTS cap.
