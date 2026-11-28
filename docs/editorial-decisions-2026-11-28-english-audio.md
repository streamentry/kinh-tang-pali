# Editor decision: Gemini TTS for accessible English readings

**Decision date:** 2026-11-28

**Decision owner:** Project editor
**Scope:** The provider-free English-audio candidate inventory dated 2026-11-27, resolved from pinned Bilara commit `11c9d708978cde8ba61096d8a75f7ddfb846f639`; see [the inventory](audio-english-preflight-inventory-20261127.json) and [the source map](audio-english-source-rights-map-20261127.json).

## Decision

The editor chooses Gemini TTS to make spoken versions of the existing resolved English translations available to people who cannot read the text. The intended audio is a reading of the text already shown by the English column. It is not a new translation, summary, explanation, paraphrase, or commentary.

Gemini TTS produces AI-generated, AI-derived audio. The accessibility purpose does not make that output non-AI. The editor understands that the SuttaCentral request documented in the [2026-11-27 approval packet](audio-english-approval-packet-20261127.md) asks that its material not be used in AI-derived technologies, and chooses to proceed with this accessibility use for the source scope above. Direct retrieval of those pages on 2026-11-28 returned only a JavaScript browser-check page; this decision does not claim the terms were re-read today.

This is an internal editorial decision about the project's intended use. It is **not** written permission from SuttaCentral or a translator, a legal opinion, or a claim that the pinned source terms grant rights for TTS or distribution. It does not alter the source records, attribution, or license declarations. Do not contact rights holders as part of this decision.

## Follow-up authorization — 2026-11-28

After the initial decision, the editor instructed the project to merge the decision and begin English audio. The editor approved the Iapetus sample voice and selected a **$400 TTS-only ceiling** for the pinned 4,702-text source scope. This authorizes local, serial Gemini TTS generation for that scope, using the separate English profile. The cap includes sample, text-input, and audio-output charges. The generator allows one explicit retry per recorded network/HTTP 5xx failure, reserves the first attempt against the cap when its outcome is uncertain, and never retries authentication, quota, billing, or other 4xx errors. It excludes R2 storage, operations, and public listener traffic.

The five voice samples and completed local tracks are recorded in the dated [generation status snapshot](audio-english-generation-status-20261128.json) and ignored local manifests. Their spoken-content review remains pending. The production release manifest still has an empty UID registration allowlist; this follow-up does not authorize public R2 upload or web-player registration.

## Limits

- Speak only the current resolved English text, preserving segment order and each segment's source attribution. Project English fills must remain published.
- Do not use TTS to translate, fill English gaps, summarize, explain, or rewrite any text.
- The initial source-use decision did not itself authorize API requests. The later follow-up above authorizes local Gemini TTS generation for the pinned scope under the $400 TTS-only ceiling. Stop at the ceiling; do not extend scope or spend without a new editor decision.
- This decision does not approve public audio distribution, a public R2 bucket, domain, or key prefix. The source-rights and public-distribution manifest entries remain pending until their full requirements are met.
- Keep `source/english-audio-approvals.json` at `release_status: pending` with an empty registration UID allowlist. Local generation does not authorize upload, registration, or web playback; those remain blocked until public release gates are complete.
- Any future audio remains `review_status: pending` until a person listens to it and approves its spoken content.

The current candidate count is a pinned snapshot, not blanket approval for new source commits or future candidate sets. Re-run the preflight and review any changed source scope before expanding production.
