# Dīgha Nikāya audience audio rollout

Date: 2026-11-22. Scope: DN1–DN34.

## Source readiness

The 34 DN suttas already have published children, adult, and older-adult explanations. `npm run explanations:check` passed with 558 published audience versions across 186 texts and zero errors. The DN-only no-TTS preflight found 102 tracks, 2,329,782 spoken characters, 508,336 words, 1,806 TTS chunks, and 1,704 chunk-pause boundaries. The preflight is recorded in `docs/audio-audience-variants-preflight-dn-20261122.json`.

## Cost estimate

The official Standard price for `gemini-3.8-flash-tts` is $9 per million output audio tokens through 2026-12-31, with audio counted at 25 tokens per second. Google lists $18 per million output tokens from 2027-01-01. The same page lists $0.50 per million input text tokens through 2026-12-31; the exact DN input-token count was not measured. Source: [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing#gemini-3.8-flash-tts).

The first four completed tracks rendered 12.56–12.89 source characters per generated audio second. Applying the median rate (12.73 characters/second) to the 2,329,782-character preflight gives about 3,051 output minutes and an output-audio estimate of $41.20 at the current rate. This excludes the unmeasured input-token charge and any future pricing change; it is a forecast, not a billing cap. The same estimated audio minutes would cost about $82.40 in output audio after 2027-01-01 at the listed rate.

## Current progress

The first batch, DN1–DN5, is merged as PR #2101 at merge commit `cca598483aba4d6780208f88f816f1fa86f8309b`. Pages run #45034146064 succeeded on that head. Pinned Chrome verified all 15 DN1–DN5 audience tracks on production: real R2 playback and seek passed, and auto-next preserved the selected children track from DN1 to DN2. Human listening remains pending.

Across DN1–DN15, 45 of 102 explanation tracks are generated, registered in this worktree, and publicly R2-verified. DN6–DN10 are the next five-sutta PR batch. DN11–DN15 are uploaded and verified locally for the following batch. All new registrations remain `review_status: pending`. After removing only `explanation_tracks` and `explanation_track_history`, the original standard DN1–DN15 registrations match the pre-audio baseline.

`npm run audio:check` reports 501 MN/DN audience registrations and zero errors. The player/code PR passed `npm run validate`, 513 tests (509 passed, 4 skipped), `npm run check` with zero errors, and `npm run build` (7,814 pages generated; 6,991 indexed). A DN13/children public full-file read ended early once; the cached MP3 hash and a public range read matched, and one cached upload retry completed without another Gemini request. Production CI, Pages, and player verification remain pending for DN6–DN15.

PR #2101 is production-verified; its 15 DN1–DN5 play/seek checks and selected-children auto-next check passed on the merged Pages reference. DN6–DN10 have 15 R2-verified registrations in the next publication batch. DN11–DN15 have 15 more R2-verified registrations in local production state for the following batch. The DN13/children incomplete-read and one cached retry have separate local evidence; the retry made zero TTS calls.

## Player behavior

Each DN page will offer the existing standard Vietnamese sutta recording plus children, adult, and older-adult explanation tracks. Selecting a version only changes the active track. A listener must tap Play. When auto-next is enabled, playback continues with that version on the next sutta. If the next sutta lacks the selected version, playback stops and explains why. The collection player enables an audience version only when every sutta in that collection has it.

The standard Vietnamese recordings remain the existing `content/audio/dn*.json` assets and begin at their existing scripture markers. No original DN audio is regenerated or overwritten.

## Production rules

- Keep `vi-charon-mn1-v1` byte-for-byte, including Gemini model, Charon voice, style text, chunk limit, pauses, WAV and MP3 encoding, and 1× default speed.
- Generate one track at a time under the machine-wide TTS lock. Reuse only cached WAV chunks whose source, profile, plan, and frame hashes match.
- If an assembled MP3 exceeds 30 minutes, package it into ordered parts of at most 30 minutes from the verified cached WAVs; do not call Gemini again for packaging.
- Read only the currently selected published explanation and bind its selected review ID, content hash, review date, and source dependencies into the audio fingerprint.
- Upload immutable DN keys under `vi/dn/<uid>/explanations/<audience>/` to the existing bucket. Verify the uploaded bytes, full SHA-256 readback, and HTTP range response before registration.
- Keep audio media and caches out of Git. Commit source code, registrations, preflight and progress records, and production evidence.
- Keep each `review_status` at `pending` until a person listens and approves the spoken content.

## Release sequence

1. Extend the explanation-source, batch, preflight, uploader, registration validator, and player code from MN to DN while keeping current MN callers and registrations valid.
2. Run the DN preflight again and verify the pinned profile hash and selected reviews before TTS.
3. Produce DN1–DN34 in batches of five suttas, with a final batch of four. Each batch contains up to 15 new tracks.
4. Run repository validation, tests, build, and local Chrome play-and-seek checks. Commit only the five or four registration JSON files for each audio batch.
5. Check each PR at its scheduled interval, merge only its passing current head, wait for Pages, then verify production play and seek. Verify auto-next preserves each version in individual and collection players.

Completion requires all 102 DN variants to be generated, uploaded, registered, merged, and production-player verified, with all 34 original DN recordings preserved. Human audio-content review remains pending until the editor listens.
