# Audio versions for MN children, adults, and older adults

Date: 2026-11-16. Scope: MN1–MN152.

## Reader behavior

Each sutta page will offer four choices, one active track at a time:

| Track | Source | Audio action |
| --- | --- | --- |
| Standard Vietnamese sutta | Existing `content/audio/mn*.json` MP3 | Reuse; start at its existing `scripture_start_seconds` marker. Never regenerate or overwrite this asset. |
| Children | Current published children explanation | New TTS asset; explanation only. |
| Adults | Current published adults explanation | New TTS asset; explanation only. |
| Older adults | Current published older-adults explanation | New TTS asset; explanation only. |

The three new tracks read the audience label, selected explanation title, visible section headings, the shared editorial disclaimer, example/practice attribution notes, and paragraph text. They do not read hidden source IDs, scorecards, review metadata, or reference links. The standard track continues to include the existing shared summary before the sutta; the player starts it at the canonical Vietnamese text marker by default, and its summary chapter remains available.

Users choose a track and press Play. Page entry never starts audio. The existing auto-next toggle continues with the selected track on the next sutta; if that version is unavailable there, the player stops and explains why instead of switching silently. The selection persists across pages and collection players. Native audio remains available when JavaScript is off.

## Source, profile, and review gates

- Read only current, selected, `published` explanation content. Include the selected review ID, review date, visible prose, and pinned source dependency hashes in the per-track source fingerprint so stale tracks disappear after a text or review change.
- Keep `vi-charon-mn1-v1` byte-for-byte: Gemini `gemini-3.8-flash-tts`, Charon, style prompt, 1,400-character chunks, 0.35-second chunk pauses, 1.6-second summary-to-sutta pause where that boundary exists, mono 24 kHz WAV, 160 kbps MP3, no speed processing, and 1× default playback.
- Generate strictly serially under the existing machine-wide TTS lock. Reuse only WAV chunks whose text/source/profile hashes and frame data match. Do not run ASR or regenerate any of the existing standard tracks.
- Keep every audio `review_status: pending`. TTS, hashes, R2 readback, CI, and web playback do not approve the spoken content.

## Size and cost estimate

Current preflight resolves 152 published explanations per audience. Including the spoken audience labels and editorial notes, the three new audiences total **456 tracks, 4,659,339 characters, 1,033,494 whitespace-separated words, and 3,757 requests** under the pinned chunk limit. The existing MN audio yields a projected **102 hours** of explanation speech at the current measured rate. At 160 kbps, that is about **7.4 GB** of new MP3 data. The estimate scales the existing per-sutta audio duration by each explanation's word count and adds the pinned chunk pauses; actual TTS duration will vary.

Google's current Standard Gemini 3.8 Flash TTS rate is $0.00225 per 10 seconds of generated audio through 2026-12-31. The output estimate is about **$83**, before text-input token charges; the account's tier and actual audio duration determine billing. [Google pricing](https://ai.google.dev/gemini-api/docs/pricing).

Use the existing `kinh-tang-pali-audio` bucket, public base URL, and account from `source/audio-storage.json`. Do not change its public-access setting, account, or domain. Cloudflare describes `r2.dev` as rate-limited and intended for development traffic; consider a custom domain before broad sustained traffic. [Cloudflare public-bucket guidance](https://developers.cloudflare.com/r2/buckets/public-buckets/).

## Release sequence

1. Add a deterministic explanation source, a full 152 × 3 preflight, per-audience cache fingerprints, and registration validation. No TTS or R2 write during preflight.
2. Add the track selector and one-version playback to individual sutta and collection players. Keep original audio as the fallback and expose only whitelisted track fields in page/playlist JSON.
3. Produce variants one UID and one audience at a time. Upload only after transcript, profile, WAV/MP3 frame, SHA-256, and duration checks pass. Use immutable R2 keys containing UID, audience, and audio hash; read each uploaded object back and verify full bytes/hash and a range request before registration.
4. Publish in batches of five suttas (15 new variants), with local source/profile/player checks, exact-head CI, merge, Pages deployment, then production play/seek and auto-next checks. Continue generating the next batch while CI runs, but never run TTS requests concurrently.
5. Keep WAV, MP3, and cache files out of Git. Commit only code, source registrations, reports, and progress records.

Completion requires all 456 new variants to be generated, uploaded, registered, merged, and production-player verified; all 152 original MP3s must remain reused; all four choices must work on all 152 pages; auto-next must preserve the chosen version. Human audio review remains pending until the editor listens.
