# F5-TTS Vietnamese ViVoice on Kaggle

This integration is a research-only GPU test path for the `hynt/F5-TTS-Vietnamese-ViVoice` checkpoint. The model weights are intentionally kept in a private Kaggle Dataset rather than committed to this Git repository.

## Provenance and license

- Model: `hynt/F5-TTS-Vietnamese-ViVoice`
- Model source: <https://huggingface.co/hynt/F5-TTS-Vietnamese-ViVoice>
- Source code: <https://github.com/nguyenthienhy/F5-TTS-Vietnamese>
- Model license: `CC-BY-NC-SA-4.0` — research/non-commercial use only.
- The model card prohibits impersonation, unauthorized voice cloning, and misleading use. Generated audio should be identified as AI-generated.
- Translation snapshot: `content/translation/vi/project/sutta/mn/mn1_translation-vi-project.json` at Git commit `1770865c0dba9f5caddbc901565450768f274c05`.

## Kaggle assets

- Private model Dataset: `fountainheadle/f5-tts-vietnamese-vivoice-model`
- Smoke-test kernel: `fountainheadle/f5-tts-vietnamese-vivoice-mn1-smoke-test`
- The Dataset contains `model_last.pt`, `vocab.txt`, `ref.wav`, `ref2.wav`, and provenance metadata. It is not part of Git.

## Run modes

The notebook defaults to `smoke` and generates the first 12 translation segments. It uses the GPU, the upstream F5-TTS CLI, `vocos`, the bundled reference audio/text, and speed `0.75`. After the smoke output is inspected, set the notebook mode to `full` to generate the complete MN 1 text.

The wrapper is [scripts/tts/f5_vivvoice_kaggle.py](/Volumes/SSD/kinh-tang-pali/scripts/tts/f5_vivvoice_kaggle.py). It writes a WAV and JSON manifest containing input counts, device, speed, hashes, and output hash.

## Verified smoke run

Kaggle kernel version 3 completed successfully on a Tesla T4. It loaded the 5,394,362,124-byte checkpoint, processed 12 segments / 415 characters at speed `0.75`, and produced 29.173 seconds of mono 24 kHz PCM WAV. The downloaded artifact is [mn1-f5-vivvoice-kaggle-t4-smoke.wav](/Volumes/SSD/kinh-tang-pali/audio/mn1-f5-vivvoice-kaggle-t4-smoke.wav); its manifest records checkpoint SHA-256 `5ae8293dd09868d5758cd1edc6b74f53bd0200652d907bd43724a69c7b82ea1f` and output SHA-256 `82f270919891d936b046851b0fe5afbe2bfc04e35c377388c54572dd78a65b43`.

## Operational constraints

Kaggle GPU availability is subject to queue/quota. Internet must be enabled for the first dependency installation; a private attached Dataset avoids downloading the 5.39 GB checkpoint on every run. Kaggle execution and generated audio are test evidence, not production or publication approval.
