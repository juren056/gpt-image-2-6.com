# Shared model icons — 2026-10-13

The owner approved executing the shared model identity plan and automatic deployment.
All model entrances use ModelBrandTile / ModelBrandMark from creative-visuals.tsx.
Nano Banana uses Gemini, GPT Image uses OpenAI, Seedream uses Seed and FLUX uses BFL;
unknown families and failed image loads use a neutral CPU mark. Family matching uses
model IDs, never the inference gateway. Google authentication keeps its separate G.

List/hero containers are 40px, compact triggers 32px, marks 20px and radii 10px.
Surfaces use shared neutral muted/border tokens; brand colors stay native and monochrome
OpenAI/BFL marks invert in dark mode. Existing selection/focus/hover behavior remains.
Long picker names truncate with full title text, while accessible names remain complete.
No model catalog, provider configuration, credit quote, request, auth or payment code changes.
Tool icon styling is preserved. Homepage changes affect only generator and comparison icons;
all protected photographs, copy, section order and model table data remain unchanged.

CUA fixture uses the actual shared components and homepage model-control CSS.
Verified all four brand families and generic fallback, 40/32/20px dimensions, search,
Enter selection, Escape dismissal and no horizontal overflow at mobile/tablet widths.
Dark/light screenshots and build evidence are in .artifacts/model-icons/.
The two protected source hashes were explicitly amended for this owner-authorized scope;
other protected files, locale copy and image hashes retain their previous values.

Production base: cec5a16 (Cloudflare Git main), Worker 1d82a607-31ea-431a-ae67-46486e8abbfb.
Keep the latest SeeAPI Worker fix, Git deployment configuration and account menu.
There are no database migrations, provider setting changes or paid generation tests in this UI release.

Additional CUA acceptance: chat model selection changes the shared brand tile; after viewport stabilization mobile document width stays within the viewport. Fault injection is confined to the ignored Vite fixture: a missing Seed asset renders the 40px CPU fallback. Launch review covers responsive/theme/accessibility, preserved SEO semantics, reuse of small existing local brand assets, and scoped security review.
