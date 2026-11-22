# Dīgha Nikāya audience audio rollout

Date: 2026-11-22. Scope: DN1–DN34.

## Source readiness

The 34 DN suttas already have published children, adult, and older-adult explanations. `npm run explanations:check` passed with 558 published audience versions across 186 texts and zero errors. The DN-only no-TTS preflight found 102 tracks, 2,329,782 spoken characters, 508,336 words, 1,806 TTS chunks, and 1,704 chunk-pause boundaries. The preflight is recorded in `docs/audio-audience-variants-preflight-dn-20261122.json`.

## Cost estimate

The official Standard price for `gemini-3.8-flash-tts` is $9 per million output audio tokens through 2026-12-31, with audio counted at 25 tokens per second. Google lists $18 per million output tokens from 2027-01-01. The same page lists $0.50 per million input text tokens through 2026-12-31; the exact DN input-token count was not measured. Source: [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing#gemini-3.8-flash-tts).

The first four completed tracks rendered 12.56–12.89 source characters per generated audio second. Applying the median rate (12.73 characters/second) to the 2,329,782-character preflight gives about 3,051 output minutes and an output-audio estimate of $41.20 at the current rate. This excludes the unmeasured input-token charge and any future pricing change; it is a forecast, not a billing cap. The same estimated audio minutes would cost about $82.40 in output audio after 2027-01-01 at the listed rate.

## Current progress

PR #2101 merged as `cca598483aba4d6780208f88f816f1fa86f8309b`; Pages run #45034146064 succeeded. Production Chrome verified play/seek for all 15 DN1–DN5 tracks and selected-children auto-next from DN1 to DN2.

PR #2102 merged as `a966be61cbf78f2bb64bf0e469140f11db455419`; Pages run #45058623807 succeeded. Production Chrome verified play/seek for all 15 DN6–DN10 tracks and selected-children auto-next from DN6 to DN7.

PR #2103 merged as `bf378e97e9ebfa351977bfad3852c7ca53c88018`; its Pages deployment #45082579080 is still in progress. DN11–DN15 have 15 R2-verified registrations in that merged batch. Local Chrome passed play/seek for all 15 and selected-children auto-next from DN11 to DN12; production player checks await Pages completion.

Across DN1–DN25, 75 of 102 explanation tracks are generated, registered locally, and publicly R2-verified. Thirty tracks (DN1–DN10) are merged and production-player verified. DN11–DN15 are merged in PR #2103; their production check awaits the still-running Pages deployment. DN16–DN20 are the next five-sutta PR batch, and DN21–DN25 are uploaded locally for the following batch. Every new registration remains `review_status: pending`; human listening has not been claimed.

`npm run audio:check` reports 531 MN/DN audience registrations and zero errors. The latest full validation, 513-test suite, Astro check, and build covered the 60-track state; the build generated 7,814 pages and indexed 6,991. Pinned Chrome passed play/seek on all 15 DN16–DN20 tracks and selected-children auto-next from DN16 to DN17. DN13/children and DN22/adults each had one incomplete public full-file read; their cached hashes and public ranges matched, and one cached upload retry succeeded without another Gemini request. The original standard DN1–DN15 registrations match the pre-audio baseline after excluding only the new explanation fields.

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
