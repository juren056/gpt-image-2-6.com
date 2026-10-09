# Pollo AI — observed UI and interaction reference

Observed 2026-10-10. Entry: https://pollo.ai/ai-image-generator; pricing reached through its visible header link.

## Provenance and limits

CUA browser supplied live DOM measurements and interaction observations. The initial supplemental Python Playwright session was rejected with HTTP 403; `desktop.png`, `tablet.png`, `mobile.png` and matching unsuffixed JSON files record that block, not reference UI. Do not use them as design targets. CUA successfully loaded and later hydrated the public generator. An initial full-page screenshot failed, then viewport screenshots worked. No login, generation, upload, or purchase was performed. Public screenshots contain competitor assets only as evidence; none were downloaded into the product asset directory.

## Measured visual structure

- Dark document background: `rgb(13, 13, 18)`; heading white `rgb(255, 255, 255)`.
- Desktop hero H1: Inter / Inter Fallback, 48px font, 56px line height. Centered heading and supporting text sit over a photographic hero with dark overlay.
- Orange announcement strip and primary navigation CTA establish one dominant conversion action. Navigation exposes task families, model pages, pricing, login and registration.
- Generator is the hero's focal point: a wide translucent dark composer, narrow vertical media-mode rail on its left, large prompt area, bottom settings row. Input typography is 13px / 20px; observed editable area 617.4px wide ×100px high with no border or padding.
- Settings popover observed width 432px and height430.2px; outer radius12px. Source class exposes transform entry transition200ms, cubic-bezier(0,1,0,1); reduced-motion overrides present.
- `cua-generator-desktop.png` records a1440px DOM viewport and the open settings panel (captured image1432×865). `generator-desktop.json` / `cua-desktop.json` retain exact per-element CSS. A390px capability override did not resize this tab: `cua-viewport-attempt.json` still reports1440px. Its screenshot is `cua-generator-default.png`; true mobile interaction fidelity remains unverified.

## Verified interaction states

1. Media tabs switch workflow families. Image is active on this entry; the compact rail makes the active workflow obvious without adding a full sidebar.
2. The editable composer hydrated after the initial page snapshot. It includes reference attachment, text/image mode, model choice, aspect/resolution/count summary, credits and disabled empty-prompt submit.
3. Model button opens a categorized chooser. Featured cards advertise model name, resolution and minimum credits; the remaining list groups providers and gives a one-line capability summary. New/discount badges are supplemental. Picker content was observed through the live open DOM, not inferred from a marketing model list.
4. Settings summary opens aspect-ratio icons (square, portrait and landscape), resolution tiers, speed/quality mode and output count in one compact panel. Unsupported options are visually disabled for the selected model.
5. Public visibility and copy-protection controls expose privacy behavior near generation settings. Do not import competitor defaults blindly; match actual backend behavior.
6. An automatic announcement modal initially interrupted the model click. Closing its Close button restored the composer; this is a conversion interruption and should not be copied into the new app.
7. Apps/Tools public tabs are clickable and swap a purpose-oriented tool directory. Showcase carousel has explicit slide controls and pause/play rather than only automatic cycling.
8. Pricing billing toggle was verified: clicking Monthly changed the Lite amount from annual-equivalent¥1,876 to¥2,344/mo and removed annual billing text, while400 monthly credits stayed constant. Paid tiers have credit sliders and a featured middle plan. Currency is browser-context dependent; these values are observations, not recommended prices.

## Actionable transfer to our branded app

- Put a usable prompt composer above the fold, with model and ratio controls adjacent to the prompt.
- Show model capability + actual credit cost in selector rows, and disable unsupported controls instead of letting invalid combinations reach the API.
- Keep upload/edit and text generation in one workspace with explicit mode state; show previews and removal controls for attachments.
- Place examples immediately after the composer and let examples prefill a prompt without submitting.
- Use a short public task directory and full tool browsing elsewhere; avoid reproducing giant mega-navigation, promotional popups, unverified popularity claims, or unsupported model lists.
- In pricing, synchronize price, credits, billing period and CTA product ID; preserve existing payment logic.

## Evidence

- `.artifacts/competitors/pollo.ai/cua-generator-desktop.png`
- `.artifacts/competitors/pollo.ai/cua-pricing-desktop.png`
- `docs/research/pollo.ai/generator-desktop.json`
- `docs/research/pollo.ai/pricing-desktop.json`
- `docs/research/pollo.ai/cua-viewport-attempt.json` (failed resize, not a mobile reference)
