# Bounded Paid Live-Test Plan — Executed

Status: **authorized by the production rollout request and executed on 2026-09-12**.

No automatic充值, payment, retry loop, or provider call is included. Before execution, confirm the provider dashboard has a hard spend cap and approve the maximum below.

| Scope                  |                      Operations | Count | Test specification                         | Site credits |
| ---------------------- | ------------------------------: | ----: | ------------------------------------------ | -----------: |
| M01 Qwen Image 3 Edit  |                            edit |     1 | 1 reference, square, PNG                   |            5 |
| M02 Flare              |                 generate + edit |     2 | 1024 square, auto quality, one output each |           24 |
| M03 Sunburst           |                 generate + edit |     2 | 1024 square, auto quality, one output each |           16 |
| M04 Nano Banana 2      |                 generate + edit |     2 | 1K, one reference for edit                 |           12 |
| M05 Nano Banana 2 Lite |                 generate + edit |     2 | 1K, one reference                          |            6 |
| M06 Nano Banana Pro    |                 generate + edit |     2 | 1K, one reference                          |           30 |
| M07 Seedream 5 Pro     |                 generate + edit |     2 | 1K, one output, one reference              |           18 |
| M08 FLUX.2 [pro]       |                 generate + edit |     2 | about 1MP, one output, one reference       |           18 |
| Utilities              | remove BG + upscale + vectorize |     3 | one small test image; upscale at 2x        |           13 |

Maximum: **18 provider submissions and 142 site credits**. No failed POST is retried automatically. Each operation is stopped after one submission; polling uses only idempotent GET requests.

Result: all 18 endpoint cases completed successfully. The first bounded run passed 17 cases and found the M08 edit field mismatch. Only that case was submitted again after the correction; it passed in 16.5 seconds with request ID `01a09326-8ea2-7ea3-8917-88e969b7aeb9`. Thus the rollout made 19 total provider submissions, with no automatic POST retries. Provider acceptance used Fal-hosted outputs; application credit debit/refund and durable-storage behavior remain covered by the existing integration/contract tests rather than being represented as part of this provider-only live run.
