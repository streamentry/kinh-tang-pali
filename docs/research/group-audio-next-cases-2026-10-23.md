# Next audio cases: source readiness and budget inputs

Prepared on 2026-10-23 from publication main
`4faec0267e424c6ace02b1cf6952a131d6ac272c`, while PR #830 runs independently.
This is preparation for the [group-audio plan](group-audio-plan-2026-10-23.md),
not permission to start more Gemini requests. No production queue was extended,
no provider request was made, and no new media was generated or uploaded.

## Exact scope after pilot listening acceptance

The editor still needs to hear and accept SN1.1–SN1.10 beside the MN1 sample
before the next production cases. The request to continue independent phases
while CI runs does not itself approve those recordings or a corpus budget.

| Order | Case | Actual reading UIDs | Chunks | Request characters |
| --- | --- | ---: | ---: | ---: |
| 1 | AN bundle: `an1-cittapariyadanavagga` | 10 | 20 | 2,460 |
| 2 | Native Pháp Cú range: `dhp1-20` | 1 | 4 | 2,875 |
| 3 | Longer prose: `sn12-aharavagga` | 10 | 35 | 26,802 |
| 4 | Longer verses: `snp-atthakavagga` | 16 | 53 | 35,583 |
| 5 | Parts stress case: `an3-mahavagga` | 10 | 77 | 80,232 |
| Total if all stages are later authorized | | 47 | 189 | 147,952 |

Counts come from current published documents and the pinned chunk planner;
they include spoken titles and presentation whitespace. They are not token
counts, provider quotas, bills or actual durations of these ungenerated cases.
Each stage remains separate; preparing this table does not schedule 47 requests
or assume all 47 reading assets will be authorized together.

The [machine-readable snapshot](group-audio-next-cases-2026-10-23.json) retains
each exact UID, order, home group, source hash, profile hash, chunk count and
zero-request preflight. All 47 are technically eligible at this snapshot.
Recompute before generation and again before upload; later downgrades or edits
must block stale assets.

## Ownership checks

`scripts/audio-rollout-ownership.ts` compares narration segment IDs against the
raw pinned Pāli keys, checks unique ownership and verifies nothing owned by a
selected reading was dropped. The AN bundle additionally requires one source
file, `an1.1-10`, and each URL's own prefix. Results:

| Case | Owned non-title source segments | Duplicate | Missing |
| --- | ---: | ---: | ---: |
| AN1.1–AN1.10 | 47 | 0 | 0 |
| `dhp1-20` | 104 | 0 | 0 |
| SN12.11–SN12.20 | 387 | 0 | 0 |
| SNP4.1–SNP4.16 | 888 | 0 | 0 |
| AN3.61–AN3.70 | 906 | 0 | 0 |

Source segments can include standalone omissions; those remain pauses under the
existing policy, not invented spoken expansions. These ownership checks do not
constitute a fresh semantic review of the translations.

The Pháp Cú navigation node `dhp` contains 26 reading UIDs. It is **not** a group
for the first chapter alone. Use the new `--uid dhp1-20` preflight filter, never
expand it to `dhp1`…`dhp20`, and do not initialize the entire work's production
queue for this one case. No new group or canonical UID is required.

## Price check and estimates

Google's [official pricing](https://ai.google.dev/gemini-api/docs/pricing#gemini-3.8-flash-tts),
checked 2026-10-23, lists Standard paid rates for the exact pinned model
`gemini-3.8-flash-tts`: $0.50 per million input text tokens and $9 per million
output audio tokens through 2026-12-31. Audio uses 25 tokens/second. From
2027-01-01 the listed rates become $1 and $18 respectively. Account tier,
discounts, credits, taxes and actual invoice usage were not inspected. Do not
switch model, voice, service tier or API to chase a cheaper quoted rate.

**Own calculation, not a quote or spending authorization:** the output component
at the current Standard list price is $0.81 per generated hour. The ten SN1
pilot caches contain 435.48 seconds of raw generated WAV for 5,406 request
characters, verified from 20 WAV hashes/frame counts. Local inserted pauses
are excluded. Linear character extrapolation gives the following rough cases:

| Case | Estimated generated minutes | Output-only USD estimate |
| --- | ---: | ---: |
| AN bundle | 3.30 | 0.0446 |
| `dhp1-20` | 3.86 | 0.0521 |
| SN12 prose | 35.98 | 0.4858 |
| SNP4 verses | 47.77 | 0.6449 |
| AN3 stress case | 107.72 | 1.4542 |

The combined output-only estimate is $2.6816. This is **not a total cost or hard
cap**: input/style token usage is unknown, pace varies, failed requests may be
billed and rework may add generation. The current generator retains WAVs but
does not retain provider token-usage records, so these figures cannot reconcile
an invoice. R2 costs and local encoding are also outside this calculation.
Use actual generated WAV durations for parts and timings; these estimates must
never become chapter offsets. Check account usage and an explicit spending
limit before any unbounded corpus run.

## Reproduce without credentials

```bash
python3 scripts/audio-preflight.py --collection an --group an1-cittapariyadanavagga --output audio/next-an-bundle-preflight.json
python3 scripts/audio-preflight.py --collection kn --uid dhp1-20 --output audio/next-dhp1-20-preflight.json
python3 scripts/audio-preflight.py --collection sn --group sn12-aharavagga --output audio/next-sn12-preflight.json
python3 scripts/audio-preflight.py --collection kn --group snp-atthakavagga --output audio/next-snp4-preflight.json
python3 scripts/audio-preflight.py --collection an --group an3-mahavagga --output audio/next-an3-stress-preflight.json
node --import tsx scripts/audio-rollout-ownership.ts
```

The last command writes `audio/next-cases-ownership.json` and fails on ownership
drift. Preflight rejects an unknown UID, a UID without its collection, or a UID
combined with a group. Neither command reads `.env`, creates production entries,
calls a provider or implies editorial approval.

## Evidence still required before broad production

1. Editor accepts actual SN1 pilot content; retain `pending` until then.
2. Explicitly authorize the next bounded case, then generate/upload sequentially
   under the current machine lock and immutable profile.
3. Verify public bytes/hash/range and actual individual/group playback. A valid
   WAV or normal duration does not prove the spoken words are correct.
4. For parts, use real WAV boundaries and test incomplete groups/long single
   readings. PR #830 provides a local exporter; no production compilation
   download or verified MP3 chapter alignment is claimed here.
5. Maintain five-successful-upload PR cadence. Work independently while CI runs;
   check each run after two hours, merge only on applicable exact-head green,
   and verify Pages/player separately before marking live.

This snapshot resolves source scope and supplies pricing inputs. It leaves the
manual acceptance, new production permission, actual audio evidence and any
corpus spending decision explicitly open.
