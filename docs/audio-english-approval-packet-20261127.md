# English audio approval packet

Date: 2026-11-27
State: decisions are still required. This document authorizes no API request, voice creation, audio generation, or R2 upload.

## Audited source scope

The fresh provider-free preflight generated `2026-11-27T15:05:09Z` at bilara commit `11c9d708978cde8ba61096d8a75f7ddfb846f639` found 4,702 candidates with resolved English, 1,435 catalog texts without English, no partial/blocked candidates, and zero provider calls or uploads. The current source text contains 1,678,442 whitespace-delimited English words and 9,815,038 characters. The corresponding per-UID source map was generated at `2026-11-27T15:05:21Z` from that preflight. Its 4,702 UID records are each one compact JSON line for easier per-sutta review; the file remains valid JSON.

The accompanying [`audio-english-source-rights-map-20261127.json`](audio-english-source-rights-map-20261127.json) binds each candidate UID to its resolved English hash, source layer counts, pinned source-file paths and hashes, and—where project fills are used—the project content and review-metadata hashes. It contains no transcript text, audio, or credentials.

Reproduce both reports from the current pinned store with:

```bash
npm run audio:english:preflight -- --require-ready --output /tmp/audio-english-preflight.json
npm run audio:english:source-map -- --preflight /tmp/audio-english-preflight.json --output /tmp/audio-english-source-rights-map.json
```

| Pinned source unit | Candidate texts containing Sujato English | Sujato-sourced segments | Pinned Bilara publication record |
| --- | ---: | ---: | --- |
| DN | 34 | 14,418 | `scpub2` · CC0 |
| MN | 152 | 23,028 | `scpub3` · CC0 |
| SN | 1,819 | 36,788 | `scpub4` · CC0 |
| AN | 1,781 | 37,403 | `scpub5` · CC0 |
| KN · Cariyāpiṭaka | 35 | 1,617 | `scpub86` · CC0 |
| KN · Dhammapada | 26 | 1,853 | `scpub7` · CC0 |
| KN · Itivuttaka | 112 | 2,733 | `scpub16` · CC0 |
| KN · Jātaka | 83 | 736 | No separate `kn/ja` record found |
| KN · Khuddakapāṭha | 9 | 357 | `scpub19` · CC0 |
| KN · Sutta Nipāta | 73 | 5,549 | `scpub17` · CC0 |
| KN · Theragāthā | 264 | 6,369 | `scpub1` · CC0 |
| KN · Therīgāthā | 73 | 2,380 | `scpub6` · CC0 |
| KN · Udāna | 80 | 2,268 | `scpub18` · CC0 |

Overall, 4,541 candidate texts contain at least one Sujato-sourced segment (135,499 segments in this snapshot). Project English fills appear in 1,060 candidates. The 161 project-only candidates are all in KN and are listed in the source map. They have no Sujato segments, but still need separate provider, profile, cost, sample, and distribution approvals. A KN-only pilot cannot complete the five-Nikāya objective.

## Rights decision

The pinned lock records the Sujato English layer as third-party, `NOASSERTION`, with attribution required. At the same bilara commit, the official [`_publication.json`](https://github.com/suttacentral/bilara-data/blob/11c9d708978cde8ba61096d8a75f7ddfb846f639/_publication.json) has CC0 publication records for 12 of the 13 source units in the table; no separate record for `kn/ja` was found. Those records' `license_statement` fields state CC0 but do not contain the AI-use request.

The current [SuttaCentral licensing page](https://suttacentral.net/licensing?lang=en) says third-party material has terms set by its asserter and asks that its content not be used for generative-AI datasets or similar, including downstream applications. The source-specific publication record and the global AI-use request are separate evidence; neither silently overrides the project's pinned `NOASSERTION` or decides whether TTS is acceptable. This packet is not a legal determination.

Under the user’s project rule, **all 4,541 texts with any Sujato-derived segment remain blocked for TTS** until written permission or a documented editor/legal decision explicitly resolves the AI-use request and the relevant source terms. The 161 project-only texts contain no Sujato segments, but still require separate provider, profile/sample, cost, and distribution approval. Do not contact SuttaCentral, Bhikkhu Sujato, or other rights holders without explicit authorization.

## TTS candidate and cost range

No English model or voice has been selected. A candidate for an editor-approved sample is Gemini 3.8 Flash TTS (`gemini-3.8-flash-tts`, Standard Paid). Google describes it for audiobook/studio narration and long-form stability. Gemini 3.8 Flash-Lite TTS is a lower-cost alternative; Google positions it for high-throughput and read-aloud workloads. These are provider descriptions, not independent quality evidence. Both currently use the `v1beta` speech API, have an 8,192-token input limit and 16,384-token output limit, and return WAV by default. See the [TTS guide](https://aistudio.google.com/docs/speech-generation), [Flash model page](https://aistudio.google.com/docs/models/gemini-3.8-flash-tts), and [Flash-Lite model page](https://aistudio.google.com/docs/models/gemini-3.8-flash-lite-tts).

The estimate below uses the current 1,678,442-word corpus, a hypothetical constant reading pace, and Google’s 25 audio tokens per second. It estimates **output tokens only**. It is not a quote, profile selection, or spend approval.

| Assumed pace | Approximate audio | Flash TTS through 2026-12-31 | Flash TTS from 2027-01-01 | Flash-Lite through 2026-12-31 | Flash-Lite from 2027-01-01 |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 120 words/min | 233.1 h | $188.82 | $377.65 | $125.88 | $251.77 |
| 150 words/min | 186.5 h | $151.06 | $302.12 | $100.71 | $201.41 |
| 180 words/min | 155.4 h | $125.88 | $251.77 | $83.92 | $167.84 |

For comparison, the 161 KN project-only texts are 51,652 words across 2,612 segments. This subset avoids Sujato-derived text but is not a substitute for the five-Nikāya goal and still needs separate provider, sample, budget, and public-R2 approval.

| Assumed pace | Approximate audio | Flash TTS through 2026-12-31 | Flash TTS from 2027-01-01 | Flash-Lite through 2026-12-31 | Flash-Lite from 2027-01-01 |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 120 words/min | 7.17 h | $5.81 | $11.62 | $3.87 | $7.75 |
| 150 words/min | 5.74 h | $4.65 | $9.30 | $3.10 | $6.20 |
| 180 words/min | 4.78 h | $3.87 | $7.75 | $2.58 | $5.17 |

These project-only figures use the same 25-audio-tokens-per-second and output-only price assumptions as the full-corpus table. They exclude input-token charges, chunk pauses, voice samples, retries, and R2 storage/egress; they are not a budget or provider approval.

The [official price table](https://ai.google.dev/gemini-api/docs/pricing#gemini-3.8-flash-tts) lists Standard Paid Flash TTS audio output at $9 per million audio tokens through December 31, then $18 from January 1; Flash-Lite is $6, then $12. Both list text input at $0.50/$1.00 per million tokens over those dates. Input tokens are not estimated here because no model token-count request has been approved. Actual duration depends on the editor-approved pace, pauses, and text chunking; samples and retries add cost. The full budget must also cover public R2 storage/egress if applicable. Recheck prices before any provider request.

For batch planning, the same assumptions split by Nikāya are:

| Nikāya | Candidates | English words | Hours at 150 wpm | Flash output-only USD through Dec 31 | Flash-Lite output-only USD through Dec 31 |
| --- | ---: | ---: | ---: | ---: | ---: |
| DN | 34 | 214,801 | 23.9 | $19.33 | $12.89 |
| MN | 152 | 364,156 | 40.5 | $32.77 | $21.85 |
| SN | 1,819 | 410,887 | 45.7 | $36.98 | $24.65 |
| AN | 1,781 | 473,009 | 52.6 | $42.57 | $28.38 |
| KN | 916 | 215,589 | 24.0 | $19.40 | $12.94 |

These are planning estimates, not quotes or approvals. The assumed pace is not approved, row values are rounded, and the January 1, 2027 prices double the output-only amounts. Chunk/request counts and encoded bytes still depend on the approved English profile and its dry-run; input tokens, pauses, samples, retries, and R2 storage/egress are excluded.

The pricing table says free-tier use may improve Google products, while paid-tier use is not used to improve products. A paid tier may be preferable for source handling, but that does not resolve SuttaCentral’s AI-derived-use request.

For voice selection, do not assume Charon or the Vietnamese style works in English. The official [voice guide](https://aistudio.google.com/docs/speech-generation#voices) lists prebuilt voices and an English-filterable voice library. Choose a voice only after an English-speaking editor hears and approves a sample. `voices.list`, Voice Design, and TTS sample generation are provider operations; none has been called. The separate English profile must pin its own model, voice, style, chunk limit, pauses, encoding, default 1× speed, and profile hash. Leave `vi-charon-mn1-v1` unchanged.

## Explicit decisions still needed

1. **Rights:** written permission or a documented editor/legal decision that explicitly addresses AI-derived narration of the pinned source, with scope covering the relevant source units. If unresolved, Sujato-derived TTS remains blocked.
2. **Provider:** approve the exact provider, model, and paid/free tier for a sample and production. No Gemini request has been made for English.
3. **Budget:** specify a maximum USD spend that includes voice/sample work, input and audio tokens, a bounded retry allowance, R2 storage, and egress. The ranges above exclude input tokens, samples, retries, and R2 costs; they are not the ceiling.
4. **Voice and pace:** approve an English-speaking editor to listen to the sample and approve the separate English profile before scaling.
5. **Distribution:** explicitly approve the public R2 bucket and HTTPS base URL, plus immutable `en/<collection>/<uid>/<content-and-profile-hash>/` keys. `source/audio-storage.json` documents a public bucket and base URL for Vietnamese narration; it does not authorize English uploads.

After those decisions, rerun the all-five-Nikāya preflight, review the source map, prepare an exact profile/chunk/cost plan, and generate one UID at a time under the TTS lock. Use no ASR, do not rewrite English gaps, do not commit media or caches, and keep every new track `review_status: pending` until human listening is complete.
