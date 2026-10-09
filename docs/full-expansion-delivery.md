# Full Expansion Delivery Matrix

Updated: 2026-09-12 after production rollout. This ledger distinguishes contract coverage, Fal provider acceptance, and the production gate.

## Models

| ID  | Scope                  | Code implementation | Configuration         | Mock / contract tests | Paid live test                          | Production | Evidence / blocker    |
| --- | ---------------------- | ------------------- | --------------------- | --------------------- | --------------------------------------- | ---------- | --------------------- |
| M01 | Qwen Image 3 Edit      | Implemented         | `fal_api_key` present | Passed                | Passed                                  | Enabled    | fal edit endpoint     |
| M02 | GPT Image 2.5 Flare    | Implemented         | `fal_api_key` present | Passed                | Passed                                  | Enabled    | fal generation + edit |
| M03 | GPT Image 2.5 Sunburst | Implemented         | `fal_api_key` present | Passed                | Passed                                  | Enabled    | fal generation + edit |
| M04 | Nano Banana 2          | Implemented         | `fal_api_key` present | Passed                | Passed                                  | Enabled    | fal generation + edit |
| M05 | Nano Banana 2 Lite     | Implemented         | `fal_api_key` present | Passed                | Passed                                  | Enabled    | fal generation + edit |
| M06 | Nano Banana Pro        | Implemented         | `fal_api_key` present | Passed                | Passed                                  | Enabled    | fal generation + edit |
| M07 | Seedream 5.0 Pro       | Implemented         | `fal_api_key` present | Passed                | Passed                                  | Enabled    | fal generation + edit |
| M08 | FLUX.2 [pro]           | Implemented         | `fal_api_key` present | Passed                | Passed after one corrected targeted run | Enabled    | fal generation + edit |

## Tools

| ID  | Workflow                            | Code implementation | Configuration                  | Mock / integration tests                   | Paid live test                | Production          | Evidence / blocker                                   |
| --- | ----------------------------------- | ------------------- | ------------------------------ | ------------------------------------------ | ----------------------------- | ------------------- | ---------------------------------------------------- |
| T01 | Text to image                       | Implemented         | `fal_api_key`                  | Passed: registry/dispatch contract         | Model endpoints passed        | Enabled             | Unified Studio dispatch                              |
| T02 | Image editing                       | Implemented         | `fal_api_key`                  | Passed: refs/limits/mask contract          | Model endpoints passed        | Enabled             | Ordered reference-image edit                         |
| T03 | Background removal                  | Implemented         | `fal_api_key`                  | Passed: utility endpoint contract          | Passed                        | Enabled             | Transparent-output task                              |
| T04 | Background generation / replacement | Implemented         | `fal_api_key`                  | Passed: operation/model contract           | Shared model endpoints passed | Enabled             | Reference edit pipeline                              |
| T05 | Product shadow                      | Implemented         | None                           | Passed: layer-state contract               | N/A                           | Local-ready         | Non-destructive shadow layer                         |
| T06 | Relighting                          | Implemented         | `fal_api_key`                  | Passed: operation/model contract           | Shared model endpoints passed | Enabled             | Dedicated reference edit                             |
| T07 | Object removal                      | Implemented         | `fal_api_key`                  | Passed: brush/lasso + mask contract        | Shared model endpoints passed | Enabled             | Mask-guided Fal reference edit                       |
| T08 | Local repaint                       | Implemented         | `fal_api_key`                  | Passed: brush/lasso + mask contract        | Shared model endpoints passed | Enabled             | Protected-region edit                                |
| T09 | Outpainting                         | Implemented         | `fal_api_key`                  | Passed: source/mask contract               | Shared model endpoints passed | Enabled             | Expand/edit operation                                |
| T10 | Upscaling                           | Implemented         | `fal_api_key`                  | Passed: utility endpoint/quote             | Passed                        | Enabled             | fal clarity upscaler                                 |
| T11 | Layers                              | Implemented         | None                           | Passed: serialized layer state             | N/A                           | Local-ready         | Visibility, lock, opacity, grouping field            |
| T12 | Editable text                       | Implemented         | None                           | Passed: editable text layer state          | N/A                           | Local-ready         | Copy/font/color/alignment/line-height fields         |
| T13 | Unified canvas                      | Implemented         | None                           | Passed: history/export state               | N/A                           | Local-ready         | Zoom, selection state, undo/redo, composition/export |
| T14 | Batch processing                    | Implemented         | `fal_api_key`                  | Passed: bounded child queue state          | Shared model endpoints passed | Enabled             | Progress, retry entry and queued-child cancellation  |
| T15 | Multi-size adaptation               | Implemented         | None                           | Passed: four export presets                | N/A                           | Local-ready         | Reflow-aware canvas sizes                            |
| T16 | Brand asset library                 | Implemented         | Existing project + local store | Passed: serialization                      | N/A                           | Local-ready         | Cross-project local brand kit                        |
| T17 | Product image set                   | Implemented         | `fal_api_key`                  | Passed: four-child recipe                  | Shared model endpoints passed | Enabled             | White, studio, lifestyle and ad variants             |
| T18 | Vectorization                       | Implemented         | `fal_api_key`                  | Passed: endpoint/output contract           | Passed                        | Enabled             | fal Recraft vectorize                                |
| T19 | SVG recolor / export                | Implemented         | None                           | Passed: active-content rejection           | N/A                           | Local-ready         | Sanitized real SVG workflow                          |
| T20 | Logo / icon / brand graphics        | Implemented         | `fal_api_key` + vectorizer     | Passed: three-child recipe                 | Shared endpoints passed       | Enabled             | Graphic set then vector workflow                     |
| T21 | Template start                      | Implemented         | `fal_api_key` for generation   | Passed: recipe interpolation               | Shared model endpoints passed | Enabled             | Prompt preview then direct run                       |
| T22 | Sketch reference                    | Implemented         | `fal_api_key`                  | Passed: sketch/mask attachment             | Shared model endpoints passed | Enabled             | Canvas/upload reference sent to edit                 |
| T23 | On-image annotation edits           | Implemented         | `fal_api_key`                  | Passed: annotation/mask state              | Shared model endpoints passed | Enabled             | Numbered instruction + protected edit                |
| T24 | Share / reuse prompt                | Implemented         | Existing DB                    | Passed: ownership/token contract via build | N/A                           | Enabled with Studio | Explicit snapshot and revoke API                     |
| T25 | Continuous same-image workflow      | Implemented         | Existing DB                    | Passed: lineage/version contract           | N/A                           | Enabled with Studio | Immutable parent asset/version chain                 |

## Release gates

- The bounded Fal provider acceptance and Vercel deployment were explicitly authorized and completed. No commit, push, DNS, WAF, payment configuration, or database migration was performed.
- Emergency rollback remains available through `creative_paid_models_enabled=false`; `creative_studio_enabled=false` additionally hides the workspace navigation entry.
- Existing URLs, accounts, orders, credits, and historical tasks were left untouched.

## File coverage

| IDs                            | Primary implementation files                                                                                                                                                                                |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M01–M08                        | `src/config/creative-studio.ts`, `src/modules/images/service.ts`, `src/routes/api/studio/run.ts`, `src/routes/api/studio/models.ts`                                                                         |
| M01–M08                        | `src/core/ai/fal.ts`, `src/modules/images/fal-webhook.ts`                                                                                                                                                   |
| T01–T10, T17–T18, T20, T22–T23 | `src/config/creative-tools.ts`, `src/components/creative-studio-workspace.tsx`, `src/routes/api/studio/run.ts`, `src/routes/api/studio/utility.ts`                                                          |
| T11–T16, T19, T21, T25         | `src/lib/creative-canvas.ts`, `src/components/creative-studio-workspace.tsx`                                                                                                                                |
| T23                            | `src/core/ai/openai-image.ts` (native mask) and provider-reference mask fallback                                                                                                                            |
| T24                            | `src/modules/creative-projects/service.ts`, `src/routes/api/studio/shares.ts`, `src/routes/api/studio/shares.$token.ts`, `src/routes/api/studio/shares.$id.revoke.ts`, `src/routes/studio/share/$token.tsx` |
| T25                            | `src/modules/creative-projects/service.ts`, `src/routes/api/studio/projects.ts`, `src/routes/api/studio/projects.$id.ts`                                                                                    |
| All                            | `scripts/verify-creative-studio.ts`, this matrix, provider evidence, setup, live-test plan and release checklist                                                                                            |
