# Generator option repair — 2026-10-11

The owner reported that generator options could not be selected and explicitly
requested an independent UI. This supersedes only the previous generator option
styling and fixed-resolution restriction. The refreshed original images, hero,
system font, section composition, administrator access, embedded Stripe payment,
Fal integration, tool picker and Chat Studio are preserved.

## Findings and implementation

Chrome reproduced an aspect-ratio menu opening and then closing without applying
the requested option. Its portal-based Select was nested in a wrapping label. The
resolution Select was permanently controlled by `value="default"`, exposed only
one item, and the server forced Nano Banana 2.1 to 1K.

The replacement uses actual button radio groups in fieldsets: directly visible
common ratios, an expandable full supported ratio grid, shape icons and a visible
selected border. No portal or wrapping-label activation is needed. Mouse, touch,
Space/Enter, arrows, Home and End are supported. Generating locks the settings.
Nano Banana 2.1 resolution uses a three-button group with per-image credit quotes.
Models without a resolution billing rule show a clear default-output value rather
than a nonfunctional dropdown. Switching models and preparing examples resets the
resolution safely; drafts, login handoff and active-task recovery preserve it.

Chrome also reproduced the model Combobox opening and disappearing before an
item could be clicked. It now expands a searchable model list inside the form,
with explicit checked states, click and Enter selection, arrows and Escape.
The selected model trigger regains focus after selection or dismissal.

## Resolution and billing boundary

Fal's [official schema](https://fal.ai/models/google/nano-banana-2.1/api) confirms
1K, 2K and 4K and the 15 ratios already in this repository. Its
[measured pricing](https://fal.ai/nano-banana-2.1) lists representative default
16:9 requests at $0.0396/$0.0593/$0.1335, with edits and input tokens varying.
Checked 2026-10-11. These are provider costs, not promises about this site's price.

The site's explicit per-image credit schedule is 1K=8 (unchanged), 2K=12, 4K=28,
for generation and editing. Output count multiplies that value. The server ignores
client-supplied totals, rejects malformed or unsupported resolutions, and builds
the Fal resolution/ratio/count payload from validated values. Omitted resolution
remains backward compatible at 1K. Existing safety tolerance, moderation, refunds,
account guards and rate limiting remain. No schema migration, payment price or
credential change is part of this repair.

## Release verification

Verification evidence is recorded after local visual review and publication.
The source and deployed build must pass the reviewed homepage baseline. Only the
Nano Banana Worker, domain and D1 identity in `homepage-refresh.md` may be deployed.
The existing image-to-image moderation endpoint configuration limitation remains
outside this UI repair; do not bypass it or claim a verified edit result.

Local checks passed: all four Nano Banana models, all 15 ratios, 1K/2K/4K,
keyboard navigation, search and dismissal, 2K ×2 =24 credits, and 4K ×4 =112
credits with insufficient-credit submission disabled at a test balance of 100.
Reload preserved 9:16/2K/×2. Chrome at 390/768/1440 CSS pixels showed no horizontal
overflow; dark and light themes retained the choices. Model/resolution controls
remain panel-local. The isolated UI request recorded `size: 9:16`, `resolution:
2K`, `outputCount: 2`, and rendered the mocked two-result success state. No real
Fal request or Stripe charge was made in this option-repair verification.

`pnpm build` and `pnpm typecheck` passed. The options regression checks validated
3 resolutions ×4 counts ×2 operations, all ratios, provider payload, malformed
inputs, backward-compatible 1K and task resume. Existing creative batch/registry
checks and all 18 locales passed. The UTF-8 security scan and scoped manual review
found no HIGH issues. Source/built baseline checks protect the updated choices and
server pricing while asserting all unrelated protected files, copy and seven
photographs unchanged. Prerendering produced 1530 public pages.

Evidence: `.artifacts/generator-options/` contains build/typecheck/i18n/security
logs, `mock-request.json`, `local-desktop.png` and `local-models.png`.

## Published release

- Immutable release: `1a31fd57d586`.
- Cloudflare version: `cdb342d5-7ac7-4613-a58b-87f961b18771`.
- Worker/domain/D1 identity checked: `nanobanana21pro-com`,
  `nanobanana21pro.com`, `nanobanana21pro-db`.
- `pnpm cf:deploy --prebuilt --release-config` passed both the local and immutable
  artifact guards. Cloudflare completed automatic asset-upload retries.
- Post-release checks returned 200 for all eight checked public URLs. All seven
  photograph hashes matched; Fal remained enabled and anonymous generation was
  rejected before a provider request.
- Chrome on production selected Nano Banana Pro and returned to 2.1, then selected
  9:16, 4K/2K and ×2. Quotes updated to 56/24 credits respectively. Account balance
  remained 999979 throughout; no new live generation or charge was submitted.
- Screenshot: `.artifacts/generator-options/production-options.png`. Machine
  checks: `production-check.json`; deployment details: `deploy.log`.
