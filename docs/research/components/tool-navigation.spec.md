# Tool Navigation Specification

## Overview

- **Target files:** `src/components/site-header.tsx`, `src/blocks/header.tsx`, `messages/{en,zh,ru}.json`
- **Screenshots:** user-provided `codex-clipboard-ed7c2c6c-a4fd-431e-a868-c3a08e435375.png`, `codex-clipboard-be2b00ac-3d8f-4572-9b6c-38905a82086c.png`, `codex-clipboard-dc894730-0694-459f-ae2b-a419397b8be9.png`
- **Interaction model:** hover/focus dropdown on desktop; disclosure groups inside the existing mobile menu

## Desktop structure

- Keep the current sticky header, brand, locale selector, theme toggle, and auth/user controls.
- Replace the flat navigation list with direct links and grouped links.
- Order: Home, AI Tools, AI Image, AI Video, Pricing, Guides.
- A grouped trigger is a text button followed by a small down chevron.
- Dropdown panel is positioned below its trigger, approximately 440-520px wide, rounded 16px, bordered, shadowed, and uses the current theme tokens.
- Each item row contains a 36-40px tinted icon tile, a concise title, and a muted description.
- Rows have generous horizontal padding, 10-12px vertical spacing, rounded hover background, and a subtle title color transition.

## Menu content

### AI Tools

- All AI Tools -> `/tools`
- Background Remover -> `/image-background-remover`
- Qwen Image 3 API -> `/qwen-image-3-api`
- Qwen Image 3 ComfyUI -> `/qwen-image-3-comfyui`

### AI Image

- Qwen Image 3 Generator -> `/#generator`
- AI Poster Generator -> `/ai-poster-generator`
- AI Product Photo Generator -> `/ai-product-photo-generator`
- AI YouTube Thumbnail Generator -> `/ai-youtube-thumbnail-generator`

### AI Video

- Seedance 2.5 -> `/seedance-2-5`
- Seedance 2.0 -> `/ai-video-generator`
- MiniMax H3 -> `/minimax-h3`

## Content rules

- All labels and descriptions are supplied by `src/blocks/header.tsx`; the component reads no new translations.
- Add concise menu translation keys to English, Chinese, and Russian message files.
- Change `landing.nav.generator` display values to Home / 首页 / Главная.
- Do not rename the `#generator` anchor, generator component, or generator workspace copy.

## Responsive behavior

- Desktop dropdown navigation appears at `lg` and above.
- Below `lg`, retain the current hamburger and drawer.
- Direct links remain normal rows. Grouped links render as expandable sections with comfortable 44px minimum targets.
- Long descriptions may be hidden on very narrow screens; titles and destinations must remain visible.

## Accessibility

- Group triggers expose their menu relationship and keyboard focus.
- Hover opening must also work with `focus-within`.
- Use semantic links for destinations and semantic disclosure controls on mobile.
- Decorative icons are hidden from assistive technology.

## Validation

- `npx tsc --noEmit`
- `pnpm.cmd build`
- Desktop and mobile visual inspection with every group expanded.
