# DN22 audio repair — 2026-10-21

Editor reported repeated speech at old minutes 12–15 and near the ending; replaced affected/adjacent regions and duration outliers without editing scripture.

The old R2 object and full metadata/progress/QC evidence remain archived in `content/audio/progress.json` → `texts.dn22.historical_audio_versions`. Original local cache remains separate. No scripture, summary or narration profile was edited.

- Replacement: `a679ba1f1bcfb7fb0f21c999316ec513cb0599804dd35bd3486863d2869e9219`; 57,408,480 bytes; **47:50** (previously 52:31).
- [Replacement MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/dn/dn22/a679ba1f1bcfb7fb.mp3); [superseded MP3](https://pub-8fa53f5182904685bd0c13d6c894a0e9.r2.dev/vi/dn/dn22/5a67d26abd398b7a.mp3).
- Approved `vi-charon-mn1-v1` / Charon / style / speed / encoding unchanged. Summary WAVs and scripture start **2:50.71** unchanged.
- Seven original regions replaced. Four subdivided losslessly by sentence after whole-chunk regeneration still produced duration outliers. Other 21 original WAVs reused byte-for-byte.
- Final plan: 40 chunks, 2 summary chunks. Exact text accounting and every cached WAV hash/format verified. MP3 frame integrity, R2 full SHA-256/bytes and HTTP 206 range passed.

| Original chunk (zero-based) | Old region | Replacement region |
| --- | --- | --- |
| 6 | 9:48–13:14 | 9:48–11:46 |
| 7 | 13:14–14:58 | 11:46–13:33 |
| 14 | 24:57–27:50 | 23:33–25:24 |
| 18 | 32:54–36:41 | 30:28–32:22 |
| 25 | 47:54–49:53 | 43:35–45:20 |
| 26 | 49:53–52:00 | 45:20–47:19 |
| 27 | 52:00–52:31 | 47:19–47:50 |

Local isolated Chrome verified the new URL, 1× playback, summary/scripture jump, +15s seek and playback at 0:00, 12:00, 15:00 and 3 minutes/30 seconds before the end. Observation is stored in the registration/progress records.

**Review remains pending.** No ASR/transcription was performed. Duration changes and browser playback do not establish that every spoken word is correct; the editor should re-listen to these regions, especially the final three minutes. The old report is retained.

Publication: PR CI and production deployment/readback pending at this checkpoint.
