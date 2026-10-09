# NanoBanana Pro — public UI research

Observed 2026-10-10; exact UTC acquisition times are in the evidence JSON. URLs: https://nanobanana.pro/ and https://nanobanana.pro/pricing. Both returned HTTP 200 at desktop 1440 × 1000 and mobile 390 × 1000.

## Evidence and limitations

Screenshots and rendered computed-style inventories: `.artifacts/competitors/nanobanana.pro/home-{1440,390}.{png,json}` and `pricing-{1440,390}.{png,json}`. Initial captures used the explicitly assigned native Python Playwright reconnaissance workflow. Subsequent browser interaction verification was switched to CUA as requested by the coordinator, but CUA failed with connection-closed / unavailable subagent IAB visibility / Chrome header-policy errors. Therefore **no clicked state is claimed verified**. No login, file upload, paid generation, checkout, or account creation was performed. Some use-case images were absent in the initial full-page screenshot; do not interpret blank images as intended product layout.

## Topology

1. Compact header: brand left; feature/pricing anchors and prompt library in middle; locale and sign-in right. At 390, desktop navigation is hidden and a 36 px icon menu button appears.
2. Dismissible, high-contrast external-product announcement strip.
3. Split hero: text and primary anchor CTA left, portrait/reference-image visual right. The CTA links to `/#dashboard` rather than a separate app route.
4. Embedded workbench on black section: narrow prompt/input card on left, larger generated-output empty state on right; wide generation-history card below. On mobile, cards stack input → output → history.
5. Image/text feature explanation, alternating use-case sections, six-item feature grid.
6. Pricing: billing-period controls, three subscription cards, then three independent credit-pack cards. Middle subscription and middle pack receive popularity emphasis.
7. Six FAQ explanations shown simultaneously in a two-column desktop grid, not an accordion in the captured DOM.
8. Multi-column footer with tool/prompt-library routes and legal links.

## Measured styles

| Element | Desktop measured | Mobile measured |
|---|---|---|
| Body/control font | Open Sans, sans-serif | Same |
| Desktop navigation container | x=112, width=1216 at 1440 | Hidden; 16 px outer page margin |
| Main H1 | 48 px / 60 px, weight 700 | 24 px / 30 px, weight 700 |
| Section heading | Usually 36 px / 40 px or 48 px / 48 px | 30 px / 36 px |
| Hero CTA | 18 px / 28 px, weight 600; height 40 px; pill | Width 358 px, full content width |
| Prompt textarea | 424 × 96 px; 12 px 16 px padding | 334 × 96 px |
| Textarea surface | rgb(42,42,42), 1 px border; radius 24.8 px | Same |
| Generate action | 424 × 56 px; 16 px / 24 px, weight 500 | 334 × 56 px |
| Input/output card heading | 20 px / 28 px, weight 600 | Same |
| Navigation sign-in | 14 px / 20 px; height 36 px; radius 18.8 px | Inside unverified menu |

Measured primary: `oklch(0.7 0.15 60)` (warm orange). Primary foreground/base dark: `oklch(0.15 0.02 60)`. Default text: `oklch(0.9 0.02 80)`. Muted text: `oklch(0.65 0.04 75)`. Border: `oklch(0.3 0.06 60)`. Muted surface: `oklch(0.22 0.03 70)`. Primary controls have 150 ms cubic-bezier(0.4,0,0.2,1) transitions; hero pill has 300 ms transition. These are computed CSS declarations, not proof that a particular hover state was exercised.

## Interaction inventory — observed affordances only

- Prompt includes 0/1000 character count. Reference image zone advertises click or drag-and-drop and JPG/PNG/WebP, ≤6 MB. File selection/result-preview states unverified.
- Generate action includes its credit cost directly. Separate helper text states first generation requires login. Output empty state explains where results appear; history empty state explicitly explains login requirement.
- No model picker, aspect-ratio picker, example-reuse action, or create/edit tab was present in this captured home workbench. Do not add claims that this competitor has those controls.
- Header locale is a combobox. Sign-in button exists; resulting auth UI unverified.
- Monthly/yearly billing uses radio semantics and a discount badge. Captured default cards displayed monthly labels. Toggle result is unverified, so do not reproduce guessed price changes.
- Subscription cards use narrower feature lists; add-on packs display credits and equivalent generation counts. Payment behavior unverified.
- Back-to-top button has fixed positioning, an opacity transition of 300 ms, and was initially opacity 0 / pointer-events none. Trigger threshold unverified.
- FAQ was already expanded/static in both captures. It should not be described as click-expand.
- Pricing page is dedicated and does not duplicate the homepage hero/workbench. A countdown varied between captures (one captured homepage had zeros); avoid adopting fabricated urgency.

## Prioritized transferable patterns

P0: Put prompt, optional reference upload, result preview, and cost-visible generation action in one workspace; keep input/output adjacent on desktop and stacked on mobile. Do not copy competitor brand assets, product promises, or prices.

P0: Make empty states explain the next action, with history access/auth requirements distinct from generation validation.

P1: Give every marketing CTA the same direct anchor to the workbench. A user should reach an editable prompt without navigating through multiple promotional pages.

P1: Separate subscription plans from one-off credit packs; show credits per period and the central recommendation with restrained border/badge emphasis.

P2: Maintain a compact navigation and full-width mobile primary action. Use warm accent on neutral surfaces, but apply the user's own identity and production-supported capabilities.
