# Generator and typography reference — 2026-10-11

Target: `src/components/banana-generator.tsx`, its CSS, global font tokens.
Reference: https://nanobanana21.com/, observed through Chrome. Screenshot: `.artifacts/generator-match/reference-desktop.png`; computed records: `reference-styles.json` in the same directory.

## Structure and styles

System font `ui-sans-serif, system-ui, sans-serif`; body 16px/24px, weight 460, tracking -0.011em. Desktop generator 1232px outer width; left/right 35%/65%, form padding 24px, gap 16px, preview padding 16px. Panel dark #101010, 12px corners and white/12% border. Tabs 54px inner height, 14px, yellow #facc15 selected.
Agent card precedes model: 14px bold heading, small NEW outline badge, muted description, yellow link to existing Chat Studio. Model control 56px, multicolor Google icon on 36px dark tile, text 14px and summary 12px, chevron at end. Prompt 160px high, 14px/20.3px, padding 8px 10px, white/16% border, 7.2px corners.
Aspect and resolution always visible, equal columns with 12px gap, controls 32px high on desktop. Output count panel has 16px padding and 12px radius, four 40px choices ×1–×4, yellow border selected, crowns on multi-output choices. CTA 44px, 14px/20.3px; clear prerequisite text while disabled. Preview empty state 72px, dashed border; history four columns.

## Interactions and product truth

Tabs switch generate/edit; edit adds reference uploader. Model selection remains searchable and uses existing registry. Ratios use provider-supported options. Keep authentication, task persistence, moderation, credit validation/refunds, history and download paths. Resolution displays the currently billed resolution only; do not expose 2K/4K at the existing 1K quote. Batch count must reach server and multiply registry credit cost; do not build decorative choices. Existing providers outside supported Nano Banana batch stay single image. Crowns indicate multiple outputs, not a fabricated subscription requirement.
Quotes remain visible as a compact row/detail disclosure, never drop cost disclosure. Prompt copy/save and task recovery remain available in an auxiliary disclosure. Preserve restored photographs and homepage composition.

## Responsive

At >=1024px use 35/65 columns; smaller screens stack form then preview. At 390px fit full-width tabs, 20px padding and 16px input text to avoid mobile zoom; horizontal model table scrolls within its region. No full-page overflow.

## Assets/content

Use existing Google SVG path and Lucide icons, existing locale messages where applicable. Add bilingual prerequisite labels and batch wording. Real pricing, models, references and account state remain authoritative.
