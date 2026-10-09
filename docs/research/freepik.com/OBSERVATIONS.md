# Freepik / Magnific — observed editor and interaction reference

Observed2026-10-10. https://www.freepik.com/ai/photo-editor redirects to https://www.magnific.com/ai/photo-editor. The live banner announces the changed brand; this is today's reference identity, not an assumption about historical Freepik UI.

## Provenance and limits

CUA loaded the public landing and followed its Edit photos with AI link into `/app/image-editor?tool=adjust&from_element=landing_photo_editor`. Initial supplemental Python Playwright captured only an HTTP403 rejection. Its unsuffixed desktop/tablet/mobile PNG and JSON files are access-limit evidence, not design references. CUA viewport screenshots succeeded after an initial screenshot issue. `cua-editor-default.png` was captured while this tab still retained its390px viewport despite a browser capability resize; its actual dimensions identify it as another mobile reference. No user file was uploaded, no generation was attempted and no authentication or checkout was entered.

## Public landing topology

1. Rebrand announcement, broad creative-suite navigation, search/create, login.
2. Breadcrumb and concise photo-editor hero with one editor-entry CTA.
3. Three benefit cards followed by alternating image/text feature rows, each deep-linking to its specific tool.
4. Three-step getting-started accordion, related-tools carousel, model links, FAQ and footer.

The vocabulary is task-oriented: background change, upscale, retouch, expand, camera-angle change, restyle and skin enhancement. Each capability has a dedicated visible route rather than forcing users to understand model names first.

## Measured styles

- Landing font family: Geist / Geist Fallback / Helvetica Neue / Helvetica / Arial / sans-serif.
- Public header measured72px high and absolute-positioned; main navigation gap32px, nav control type15px /17.25px.
- Announcement type14px, weight500, line22.4px, color `rgb(255, 88, 174)`.
- Exact heading/button measurements are preserved in `cua-desktop.json`; hydrated editor measurements are in `editor-desktop.json` and `editor-mobile.json`. Measurements reflect observed hydration state and viewport; do not interpret transparent body background as the whole app's palette.
- Actual editor screenshot uses white canvas, pale gray rounded tutorial card, black primary selection control, small neutral upload control and sparse top chrome. Dark landing and light editor are separate surfaces.

## Verified interaction states

1. Clicking step2 in the landing tutorial accordion collapses step1 and expands image-input guidance. This is click-driven, with one active explanation.
2. Editor entry works without a login redirect. A cookie-preference panel initially obscured it. Reject All dismissed the panel and revealed the public empty state; no need to accept tracking to view it.
3. Editor desktop navigation exposes Home, search, stock, Explore, All tools, Connections, Academy and more; top toolbar exposes pricing, assistant and authentication.
4. Empty editor starts with an onboarding carousel (four concepts: targeting an image area, settings, image upload, edit prompt), previous/next controls, tutorial-video CTA, Upload an image and Select from creations. Both input choices are visible before authentication; post-selection behavior was not tested.
5. Mobile hides the full navigation behind a menu, reduces top actions, stacks the tutorial and input actions, and displays a dismissible app-download strip along the bottom. This strip consumes useful editing space and should not be copied into a web-only product.
6. Pricing button in editor opens a new public tab. Annual/monthly switch was verified: switching changes the accessible label from Switch to monthly billing to Switch to annual billing; Premium changes from240K credits/year to20K credits/month, annual billing text to monthly billing, and observed amount¥1,950 to¥2,900/mo. Individual/Teams plan type and Pro credit-tier radios are separate controls.

## Actionable transfer to our branded app

- Create a clean editing empty state that clearly offers upload and generation-history selection, instead of an empty output box.
- Use a short task-first tool directory with deep links to real implemented tasks.
- Keep model choice secondary to the desired edit; use compact help text and capability labels.
- Add lightweight optional guidance: three steps with one expanded explanation, or a dismissible starter hint inside the workspace.
- On mobile, collapse navigation and stack controls, while preserving easy access to upload, prompt and primary generation action.
- Pricing should make annual versus monthly credit validity and billing explicit. Only show privacy/licensing assertions the app can substantiate.

## Evidence

- `.artifacts/competitors/freepik.com/cua-editor-mobile.png`
- `.artifacts/competitors/freepik.com/cua-editor-default.png` (actual390px; see limitation above)
- `docs/research/freepik.com/cua-desktop.json`
- `docs/research/freepik.com/editor-mobile.json`
- `docs/research/freepik.com/pricing-monthly.json`
