# Editor decision: Gemini TTS for accessible English readings

**Decision date:** 2026-11-28

**Decision owner:** Project editor
**Scope:** The provider-free English-audio candidate inventory dated 2026-11-27, resolved from pinned Bilara commit `11c9d708978cde8ba61096d8a75f7ddfb846f639`; see [the inventory](audio-english-preflight-inventory-20261127.json) and [the source map](audio-english-source-rights-map-20261127.json).

## Decision

The editor chooses Gemini TTS to make spoken versions of the existing resolved English translations available to people who cannot read the text. The intended audio is a reading of the text already shown by the English column. It is not a new translation, summary, explanation, paraphrase, or commentary.

Gemini TTS produces AI-generated, AI-derived audio. The accessibility purpose does not make that output non-AI. The editor understands that the SuttaCentral request documented in the [2026-11-27 approval packet](audio-english-approval-packet-20261127.md) asks that its material not be used in AI-derived technologies, and chooses to proceed with this accessibility use for the source scope above. Direct retrieval of those pages on 2026-11-28 returned only a JavaScript browser-check page; this decision does not claim the terms were re-read today.

This is an internal editorial decision about the project's intended use. It is **not** written permission from SuttaCentral or a translator, a legal opinion, or a claim that the pinned source terms grant rights for TTS or distribution. It does not alter the source records, attribution, or license declarations. Do not contact rights holders as part of this decision.

## Limits

- Speak only the current resolved English text, preserving segment order and each segment's source attribution. Project English fills must remain published.
- Do not use TTS to translate, fill English gaps, summarize, explain, or rewrite any text.
- This decision does not authorize API requests. The exact Gemini model and tier, English voice and profile, sample approval, total spend ceiling, and UID/source-hash allowlist remain separate gates.
- This decision does not approve public audio distribution, a public R2 bucket, domain, or key prefix. The source-rights and public-distribution manifest entries remain pending until their full requirements are met.
- Keep `source/english-audio-approvals.json` at `release_status: pending` with an empty UID allowlist. Do not create English audio or upload objects until every applicable approval gate is complete.
- Any future audio remains `review_status: pending` until a person listens to it and approves its spoken content.

The current candidate count is a pinned snapshot, not blanket approval for new source commits or future candidate sets. Re-run the preflight and review any changed source scope before expanding production.
