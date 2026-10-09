# NanoBanana2 — partial public research

Research attempted 2026-10-10. Requested URLs: https://nanobanana2.com/text-to-image-generator, https://nanobanana2.com/, https://nanobanana2.com/pricing.

## Access status and evidence

All six native browser navigations at 1440 and 390 widths failed `net::ERR_CONNECTION_CLOSED`; records are `.artifacts/competitors/nanobanana2.com/{generator,home,pricing}-{1440,390}.json`. Supplemental direct HTTPS fetching failed with an unexpected TLS EOF. CUA research also could not initialize a usable browser due to subagent IAB and Chrome header-policy errors. No browser screenshot or computed CSS can be reliably attributed to this site, and no interaction state was verified.

The web retrieval service supplied text for https://nanobanana2.com/text-to-image-generator; it identified the page as a cached crawl from five months ago. The homepage fetch timed out. Cached text is **secondary, potentially stale evidence**, not current browser observation. Only its control structure is summarized below. No proprietary assets downloaded for use in the app.

## Cached page structure (not live-verified)

Navigation groups creation, editing, video, solutions, personal works, and pricing. The dedicated landing page includes an immediately embedded generator, a short introductory prompt suggestion, FAQ, and related task-specific routes.

The generator text exposes create/edit modes, aspect ratio, an advanced-options affordance, model/version, resolution, web-search option, prompt example, cost-labeled generation action, and a descriptive empty output. Trending theme chips and four quick-start prompt suggestions appear after the generator. Footer grouping separates image models, video models, editing tools, and resources.

## What remains unknown

- Colors, typography, dimensions, mobile layout, breakpoints, scroll behavior, hover transitions.
- Exact model menu choices, aspect ratio/resolution options, advanced-panel contents.
- Whether example/theme chips insert text or navigate, whether mode change preserves prompt and files, upload behavior.
- Login gating, generated result tools, image-history states, error/retry/download flow.
- Current pricing/billing switches, payments, and FAQ collapse behavior.

Do not present these unknowns as observed competitor functionality. Do not copy search-grounding or 4K claims into the user's app unless supported by the configured provider.

## Candidate patterns for the user's implementation

P0: Progressive disclosure: expose prompt and essentials, move model-dependent settings into an advanced panel. This is a design recommendation inferred from the cached structure, not a verified interaction.

P1: Put quick-start ideas beside an empty prompt and make their behavior explicit in the user's app (e.g. insert editable prompt). Pair creation/edit mode with the user's actual text-to-image versus image-edit provider support.

P1: Use task-specific pages and related-tool links to let visitors enter the same workspace through a concrete job such as product photo or portrait.

P2: Group navigation and footer by user task rather than maintaining one oversized undifferentiated model list.
