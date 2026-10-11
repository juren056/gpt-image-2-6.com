# Generator and typography reference restoration

Recorded on 2026-10-11 from the current source and isolated review artifact under
`.artifacts/generator-match/`. This is a scoped extension of
[the homepage restoration boundary](homepage-restoration.md), prompted by the
owner's explicit request to match the fonts, generator and tables of
`https://nanobanana21.com/`. It does not authorize another homepage composition
change or replacement of account, payment or generation services.

## Overview

The reference was inspected in Chrome. Its observed font stack is
`ui-sans-serif, system-ui, sans-serif`, rather than the previously applied Manrope
face. The generator retains the existing dark/yellow surface and now follows the
reference's dense controls: mode tabs, Agent mode card, searchable model picker,
prompt, visible aspect-ratio and resolution controls, boxed output-count choices,
and a compact action area. Production preview remains beside the form on desktop.

The restored seven photographic homepage examples and their section order remain
the incumbent composition. Administrator access, checkout, Fal integration,
credits, tool icons and Chat Studio are preservation boundaries.

## Colors

Generator tokens in `src/styles/banana-generator.css` use dark panel `#101010`,
foreground `#f4f4f5`, muted text `#a1a1aa`, yellow accent `#facc15`, translucent
white field fills and thin translucent white borders. Existing light-theme
overrides remain in place. This change does not introduce another palette.

## Typography

`src/styles/globals.css` sets the shared UI stack to the observed reference stack;
display text inherits the body stack. Existing language-specific fallbacks remain
available. `src/styles/typography.css` preserves the established product rhythm:
16px general text, 15px account/workspace text, weight 460 for body text, weight
600 for headings and weight 500 for controls. Body leading is 1.5; Simplified
Chinese retains 1.65 leading and zero tracking.

The generator uses 14px text with 1.45 leading. Model descriptions are 12px;
labels and prompt text are 14px. Narrow-screen prompt text is 16px. The model
comparison table uses 14px text with 1.45 leading and tabular numerals. These are
observed implementation values, not an invitation to shrink other surfaces.

## Layout

At 1024px and wider, the generator uses a 35% form / 65% preview grid. The form
has 24px padding and a 16px gap; the preview has a separating vertical border.
Below that breakpoint the preview stacks after the form. At widths below 640px,
the form padding becomes 20px and the mode tabs fill the available width.

Aspect ratio and resolution occupy two equal columns with a 12px gap. The output
choices occupy four equal columns. The desktop mode-tab group is 316px wide and
60px tall; the model trigger is 56px tall and the prompt has a 160px minimum
height. Parameter triggers are 32px tall on desktop and 40px on narrow screens.

The comparison table has a 640px minimum width inside its own horizontal scroll
container. Its first column is sticky and 140px wide. The Nano Banana 2.1 column
is highlighted through both its header and body cells; it remains the default
model. Table cells use 16px padding and header cells 20px padding. The page header
retains sticky positioning.

## Elevation & Depth

Neutral fills and thin borders define the form, output-choice card and comparison
table. Select and model popups use a restrained ambient shadow. Focus treatment is
a yellow outline. This change preserves the existing gold hero wash and does not
introduce a new shadow or decorative illustration system.

## Shapes

The generator panel and output-choice card use 12px corners; the mode-tab group,
model trigger, prompt and menus use approximately 8px corners. The small NEW badge
is rounded. Google model identity is rendered as a colored SVG rather than a
plain blue letter. Output buttons retain the reference's crown decoration while
their actual availability is determined by the model's server-supported limit.

## Components

The model picker remains searchable and uses current model availability. Parameter
options come from `src/config/creative-studio.ts`. The primary action communicates
the current prerequisite, including an empty prompt, missing edit reference,
insufficient credits or a running task. Prompt-copy, brief download and draft
information remain available under the compact prompt-tools disclosure.

The output-count controls are functional rather than decorative. The four Nano
Banana models support one to four outputs; other model requests are limited to
one. `validateCreativeRequest` rejects non-integer, out-of-range and wrong-type
counts. It computes total credits from the model's own per-image price multiplied
by the validated count. `/api/studio/run` passes the count to the image service,
which sends `num_images` to Fal and uses the server-calculated credit total.

Nano Banana 2.1 remains fixed to 1K in the service at its existing 8-credit
per-image quote. The resolution selector offers that actual supported setting;
it does not expose 2K or 4K at a 1K price. Other models display their provider
default. Competitor credit prices are not substituted for the site's real prices.

Completed batches expose thumbnails for choosing the displayed image. Downloads
include the selected image index, and the server resolves the requested image
only through the authenticated user's owned task. Invalid index syntax returns
400 and unavailable task/image selections return 404. Existing draft restoration,
history, credit queries, task polling and failure handling remain connected.

## Do's and Don'ts

- Do preserve the photographic homepage and repaired account/payment/workspace
  behavior while adjusting this surface.
- Do use current model configuration for controls and server-calculated credits
  for billing. A visual match must not change those facts.
- Do review the desktop split, mobile stack, menus and the table's own horizontal
  scrolling before updating the approved baseline.
- Do include generator and typography source in the baseline once the owner-
  authorized change has passed visual review. A failed baseline must not be
  bypassed by a silent refresh.
- Don't enable unsupported resolutions or charge a multi-image request as a
  single image.
- Don't treat a mocked successful batch as evidence of a real Fal request,
  successful payment or webhook credit grant.

### Evidence boundary

Reference evidence is `reference-styles.json` and `reference-desktop.png`
under `.artifacts/generator-match/`. The isolated local
captures are `desktop.png` and `mobile.png`. `mock-request.json` records a browser
request with `outputCount: 4` and aspect ratio `8:1`; the preview server mocks its
response. This proves browser request wiring, not a paid provider generation.

The bounded batch verification lives in `scripts/tests/verify-creative-batch.ts`;
it covers invalid output counts, server cost multiplication, reference validation
and resumed output-count validation. Fixed 1K provider options and owned-image
download indices are also visible in the server source; that source inspection
is distinct from a real provider or database integration test. Final build, review and deployment
results should be recorded here only after their corresponding checks complete.
The final release and its completed checks are recorded below.

### Completed release verification — 2026-10-11

- `pnpm build` passed using isolated Nitro build/output directories under
  `.artifacts/generator-match/`, including 1,530 static pages. TypeScript checking,
  creative-batch, workflow-resume, creative-studio and image-download checks passed.
- Fresh visual review passed for desktop, narrow-screen stacking, horizontal
  table scrolling and both themes. Final placeholder/accent contrast corrections
  are included in the built artifact. Evidence: `reviewer.md`, `desktop-final.png`,
  `light-final.png` and `table-mobile.png` in the same artifact directory.
- Source and built-output baseline guards passed. The previous release
  `13d54c2f9748` was deliberately checked and rejected because it lacks the
  reviewed four-output control. Deployment uses the reviewed isolated artifact,
  not a stale shared `.output` directory.
- Release `6de4e37a8a28` was deployed to Worker `nanobanana21pro-com`; Cloudflare
  version `7e5d1ad8-a32a-4048-9bab-0a91751d43c7`. The custom domain remains
  `https://nanobanana21pro.com/`, with the existing `nanobanana21pro-db` binding.
  No migration, provider credentials, account grants or CalculusMate resources
  were changed by this release.
- Production HTTP checks passed for homepage, pricing, prompts, editor, robots,
  sitemap and the studio-model endpoint. All seven homepage photos returned 200
  and matched their local file hashes. The Nano Banana 2.1 model reports enabled
  and configured. Evidence: `production-check.json`.
- Logged-in production Chrome verification confirmed the administrator menu and
  working Admin overview, the preserved Chat Studio composer and six starters,
  and 25 tool-menu entries with 25 distinct SVG icons. The Starter checkout
  confirmation displayed $8.99 and 400 credits; payment was not submitted.
- Production selection of four outputs displayed a 32-credit quote; switching
  back to one restored 8 credits. This was a UI/quote check, not a new paid Fal
  generation. The existing completed banana generation remained visible.
- Production screenshots: `production-generator.png`, `production-table.png`,
  `production-admin.png`, `production-chat.png`, `production-tools.png` and
  `production-checkout.png`, all under `.artifacts/generator-match/`.

The baseline now protects the reviewed generator, shared typography, table,
homepage composition and relevant locale strings. Future changes must preserve
this boundary unless the owner explicitly requests another change.

### Global drift left untouched

`DESIGN.md` and `.impeccable/design.json` retain older task-selector/vector
homepage directions that conflict with the owner's restored photo composition.
They were not rewritten in this bounded extension. The requested reference font
and retained section kickers are surface evidence, not newly invented universal
rules or a reason to prescribe system display faces for unrelated projects.
