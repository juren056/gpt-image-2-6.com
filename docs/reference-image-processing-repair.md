# Reference image processing — 2026-10-12

## Diagnosis and authorized behavior

Four recent BRIA background-removal attempts stopped before Fal dispatch with `MODERATION_UNAVAILABLE`, reason `Invalid URL string.`, and zero credits. Production `openai_base_url` contained a Gmail address. This was separate from the repaired R2 upload problem.

The owner explicitly requested “先不用审核，直接放”. Added the administrator setting `content_safety_openai_enabled`; production is explicitly `false`. Input and output OpenAI requests now honor this setting across every shared image service. Existing encrypted credentials remain untouched. The malformed address was replaced with the standard HTTPS API base address for future configuration; successful OpenAI authentication is not claimed while the review is disabled.

Provider safety handling, local prompt rules, authentication, account access, exact model selection, credits and refund logic are retained. An unset switch preserves the previous key-based behavior for other installations. Saving an email, API key, credential-bearing URL or non-HTTPS address as the OpenAI base URL is rejected before writes.

## Reference input inventory

| Surface                                                                                                                                             | Execution path                                                                   | Review switch                                                      |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Homepage/account generator, public model generators, Chat Studio reference creation and asset reuse                                                 | `/api/studio/run` → `runCreativeImage`                                           | Shared input and output configuration                              |
| Legacy image edit                                                                                                                                   | `/api/images/edit` → `generateImageEdit`                                         | Shared input and output configuration                              |
| T02 reference editing; T04 background replacement; T06 relight; T07 object removal; T08 inpainting; T09 outpainting; T22 sketch; T23 annotated edit | Dedicated tool → `/api/studio/run`                                               | Shared configuration; masks/source URLs retain existing validation |
| T03 background removal; T10 upscale; T18 vectorize                                                                                                  | `/api/studio/utility` → `runCreativeUtility`                                     | Shared configuration                                               |
| T14 batch; T17 product set; T20 logo/vector pipeline; T25 continuous workflow                                                                       | Child jobs use the same studio run/utility endpoints                             | No separate legacy OpenAI gate                                     |
| Public background remover and Matcha filter removal                                                                                                 | `/api/media-tools/*` → `submitMediaToolTask`                                     | Shared configuration                                               |
| Video tools accepting reference image options                                                                                                       | `submitMediaToolTask`                                                            | Same reference option extraction/configuration                     |
| T05 shadows; T11 layers; T12 text; T13 canvas; T15 resize; T16 brand assets; T19 SVG editing; T21 templates; T24 prompt sharing                     | Browser composition/project storage; any AI action delegates to studio endpoints | Local composition does not invoke OpenAI review                    |

All OpenAI review calls in the image service resolve the same setting. The generated-output completion and anonymous prompt paths also use it. No client receives an API key or a raw database configuration map.

## Verification

- Configuration regression: explicit opt-out suppresses the review key without deleting it, explicit opt-in/default remains compatible, provider unsafe flags still block, malformed addresses and invalid switch values reject.
- Existing content-safety cases, output moderation, creative batch/reference validation and generator resolution/credit/provider payload checks passed.
- TypeScript and security scan passed. The existing homepage baseline passed after updating only the authorized image service hash. Homepage source, copy, images, generator UI, payments and chat were not changed by this repair.
- Production build passed. The first verified deployment is Worker version `24e2bb0e-825a-4322-a371-d61a5ddc490c`, immutable release `143d336730e0`.

## Live processing, not just uploading

At 2026-10-12 00:09 Asia/Shanghai, both authenticated browser tasks completed successfully through Fal. The database audit confirms exactly one consumption row for each task:

| Operation                                                            | Actual model                    | Task                                   | Output                                                               | Credits            |
| -------------------------------------------------------------------- | ------------------------------- | -------------------------------------- | -------------------------------------------------------------------- | ------------------ |
| Background removal, own public shoe example                          | `fal-ai/bria/background/remove` | `d00e9d1f-7e95-484b-8589-b71344ca2f80` | 1672 × 941 PNG, RGBA, alpha extrema 0–255; loaded in comparison view | 3, one consumption |
| Image-to-image, uploaded purple wand changed into gold/amber on navy | `google/nano-banana-2.1/edit`   | `7de210c9-2c48-4343-af80-2e6cc0129e2a` | 1024 × 1024 PNG; loaded in generator with download link              | 8, one consumption |

Evidence is in `.artifacts/moderation-repair/live-results.json`, `task-credit-audit.json`, `background-result.png` and `image-edit-result.png`. Eight public routes returned 200 and all seven protected homepage images matched their hashes. This is an inventory/shared-route audit of all reference tools, with two real provider processing tests; it does not claim a separate paid live run for every tool.

The wand fixture has a historical `.png` filename but JPEG bytes. The upload correctly rejected a mismatched `image/png` declaration; the successful test used `image/jpeg`. No MIME validation was weakened. Simultaneous test tabs also triggered the account-wide one-second upload limit. The shared upload helper now waits and retries only that explicit pre-upload response, once; storage/auth/validation errors are not replayed.

## Source-image interaction correction

The example button previously only remounted the preview and left the parent processing input empty. It now sets the uploaded source used by the actual task. A further browser check found that freshly allocated default-preview arrays could restore an old example after removal or while replacing it. Memoized defaults now change only on a real example/handoff change, preserving a user's upload/removal state across renders. These corrections apply to every dedicated tool using the shared workspace.

The final immutable release is `80afde6aecf0`, Worker version `4f3be7d1-f727-4a34-94c6-720fbf364dec`. The full `pnpm build`, 1,530-page prerender, protected homepage guard, TypeScript, bounded upload retry regression and security scan passed before publishing. Production public-route and image-hash checks passed again after this release.

At 00:37 Asia/Shanghai, the final release was tested by removing the saved example (input stayed at 0/1 and processing disabled), uploading the wand with its correct JPEG type, and executing background removal again. Task `7618aa42-ce7d-4fd8-936c-74198a5ec148` completed successfully on BRIA, producing an 800 × 600 RGBA PNG with alpha extrema 0–255. Its source URL was the new upload, not the old example. The audit confirms one 3-credit consumption. All three paid test tasks therefore consumed 14 credits in total, each once. The image-edit download also succeeded through the site's authenticated download link. Final replacement evidence: `.artifacts/moderation-repair/background-upload-result.png` and `background-upload-output.png`.
