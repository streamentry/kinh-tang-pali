# English audio approval packet

Date: 2026-11-28
State: local English TTS generation is authorized for the pinned 4,702-UID source scope with a $400 TTS-only cap. Five voice samples and complete local SN1.1 and DN1 tracks exist; no R2 uploads or English registrations have been made. The release manifest remains pending, public distribution is unapproved, and human content review remains pending.

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

The [SuttaCentral licensing page](https://suttacentral.net/licensing?lang=en) reviewed for this packet on 2026-11-27 says third-party material has terms set by its asserter and asks that its content not be used for generative-AI datasets or similar, including downstream applications. Direct retrieval on 2026-11-28 returned only a JavaScript browser-check page, so this update does not claim that the terms were re-read today. The source-specific publication record and the global AI-use request are separate evidence; neither silently overrides the project's pinned `NOASSERTION` or decides whether TTS is legally acceptable. This packet is not a legal determination.

The editor's 2026-11-28 decision is recorded in [editorial-decisions-2026-11-28-english-audio.md](editorial-decisions-2026-11-28-english-audio.md). A later user instruction authorized local TTS generation for the pinned resolved-English scope under a separate $400 cap. This is an internal project decision, not written permission, a legal determination, or a change to the pinned source terms. The source-rights and public-distribution release entries remain pending; no public audio is authorized. The 4,541 texts with Sujato-derived segments remain blocked for public registration/release under the current fail-closed manifest, while 161 project-only texts still require the remaining profile, budget, UID, and release approvals. Do not contact rights holders.

The release manifest applies this rights gate only when a resolved track contains Sujato-sourced segments. Such clearance must record its basis, explicitly allow AI-derived TTS and public audio, and link to the covered source scope; the per-UID source-hash allowlist binds any eventual release to exact text. A project-only KN UID may pass this one gate without Sujato clearance only while the pinned project-content license declares CC0 coverage for `content/translation/en/project`, and only after every other approval is complete. Use the authorization audit's `--project-only` scope to inspect that subset; the default full-corpus audit remains fail-closed, and a KN pilot does not satisfy the five-Nikāya goal.

## TTS candidate and cost range

The editor selected Gemini 3.8 Flash TTS (`gemini-3.8-flash-tts`) with Iapetus after hearing the five voice samples and approved the voice. Google describes Flash TTS for studio-grade voice fidelity and long-form stability. Flash-Lite remains an unselected lower-cost alternative. These are provider descriptions, not independent quality evidence. Both models use the `v1beta` speech API, have an 8,192-token input limit and 16,384-token output limit, and return WAV by default. The account billing tier is not independently verified; estimates use Standard Paid rates. See the [TTS guide](https://aistudio.google.com/docs/speech-generation), [Flash model page](https://aistudio.google.com/docs/models/gemini-3.8-flash-tts), and [Flash-Lite model page](https://aistudio.google.com/docs/models/gemini-3.8-flash-lite-tts).

The estimate below uses the current 1,678,442-word corpus, a hypothetical constant reading pace, and Google's 25 audio tokens per second. It estimates **output tokens only**. These figures are planning estimates, not an invoice quote; the editor has since approved a $400 ceiling for TTS input and audio generation.

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

The [official price table](https://ai.google.dev/gemini-api/docs/pricing#gemini-3.8-flash-tts) lists Standard Paid Flash TTS audio output at $9 per million audio tokens through December 31, then $18 from January 1; Flash-Lite is $6, then $12. Both list text input at $0.50/$1.00 per million tokens over those dates. Input-token cost is estimated from source length and is included within the $400 TTS-only ceiling. Actual duration depends on the approved sample pace, pauses, and chunking. The $400 cap excludes R2 storage and operations; approve a separate delivery and billing plan before public distribution. Recheck prices before a long run.

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

The English profile `en-iapetus-gemini38-v1` pins the selected model and Iapetus voice, the approved sample style, chunk limit, pauses, 24 kHz mono source WAV, 160 kbps MP3, and default 1× speed. Leave `vi-charon-mn1-v1` byte-for-byte unchanged. Voice approval does not approve the spoken wording of any full track.

## R2 cost and production URL

Cloudflare's [R2 pricing page](https://developers.cloudflare.com/r2/pricing/) lists Standard storage at $0.015/GB-month, Class A operations at $4.50/million, and Class B at $0.36/million. Direct R2 egress is free. The monthly free tier covers 10 GB-month, 1 million Class A operations, and 10 million Class B operations; existing account use is unknown, so do not assume that allowance is unused. Rates were checked 2026-11-27; recheck before upload.

There is a hard-cap conflict for public playback. Reads beyond the free Class B allowance are billable and depend on listener traffic. Cloudflare [budget alerts only notify](https://developers.cloudflare.com/billing/manage/budget-alerts/); they do not stop usage, and the documented [spending limits exclude R2 and are not a maximum-invoice guarantee](https://developers.cloudflare.com/billing/manage/spend-management/). A direct public bucket therefore cannot enforce a hard all-in dollar ceiling on open-ended playback. The approval manifest can cap TTS generation, but it cannot cap arbitrary public R2 reads.

A possible alternative is a **private** R2 bucket behind a Worker, with every GET and Range request passing through a single global Durable Object counter before the Worker performs an R2 read. This could enforce a maximum count of R2 reads only if public bucket access is disabled and no alternate URL bypasses the Worker. Cloudflare's built-in [Workers Rate Limiting binding is approximate and per-location](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/); its documentation points to Durable Objects for strict cross-location counters. This architecture is a proposal, not implemented or approved.

Even a strict R2-read count does **not** cap the whole invoice. Every allowed or rejected request can incur Worker or Durable Object charges. Their product-wide spending controls are account-wide, separate from R2, and Cloudflare says usage reporting and enforcement can lag, so the final bill may exceed a configured limit. A request-count cap can bound R2 Class B operations; it cannot provide a strict all-in USD ceiling under unrestricted public traffic. Before distribution, choose whether to accept monitored variable costs, approve a private Worker/DO route with a defined R2-read limit while accepting residual compute/storage charges, or require another delivery and billing model. Recheck the design and current rates before any upload.

The final R2 estimate still needs the approved English encoding and multipart plan to count bytes and object operations. Public playback volume is also unknown. Cloudflare describes the managed `r2.dev` URL as a non-production option; use and approve a production custom domain for full-corpus release, following its [public bucket guidance](https://developers.cloudflare.com/r2/buckets/public-buckets/). No English bucket or domain has been selected or created.

## Explicit decisions still needed

1. **Rights and source scope:** internal local TTS generation is authorized for the pinned source map. It is not written permission or legal clearance. The release manifest remains pending until its source-rights and public-distribution requirements are satisfied.
2. **Provider and profile:** Gemini 3.8 Flash TTS with Iapetus is the selected generation profile. The editor approved the sample voice; the account billing tier is not independently verified. Full spoken-content review remains pending.
3. **Budget:** the editor approved a $400 TTS-only ceiling for the pinned corpus, including input and audio charges and any retries. The generator is configured with zero automatic retries. R2 storage, Class A/B operations, and listener costs are excluded from this cap and remain unapproved. The cap is enforced against local estimates, not guaranteed as an exact invoice maximum.
4. **Voice and pace:** the editor approved the Iapetus sample voice. The full spoken content remains `review_status: pending` until listened to.
5. **Distribution:** public R2 destination and web-player registration remain unapproved. Before upload, explicitly approve the bucket and HTTPS production domain, plus immutable `en/<collection>/<uid>/<content-and-profile-hash>/` keys. `source/audio-storage.json` does not authorize English uploads.

Local production has started serially under the machine-wide TTS lock. The current batch writes MP3 parts and hash manifests only to the ignored `audio/english/` cache; it does not register or upload them. Keep no ASR, no translation or gap-filling, no media in Git, and `review_status: pending`. Obtain public R2 destination approval before any upload or player registration.
