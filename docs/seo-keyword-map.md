# SEO keyword ownership map

Updated: 2026-10-12

This document defines the primary search intent owned by each public page family. Supporting copy may use related terms, but navigation anchors, Title, H1, introduction, FAQ, and structured data should reinforce the assigned intent instead of competing with another URL.

## Core hubs

| URL      | Primary keyword           |
| -------- | ------------------------- |
| /models  | ai image models           |
| /tools   | ai image tools            |
| /prompts | nano banana image prompts |

| Core image URL            | Primary search intent                 |
| ------------------------- | ------------------------------------- |
| /                         | nano banana 2.1 image generator       |
| /nano-banana-pro          | nano banana pro reference editing     |
| /ai-image-generator       | ai image generator                    |
| /ai-image-editor          | ai image editor with reference images |
| /ai-image-upscaler        | ai image upscaler / enlarge photos    |
| /image-background-remover | image background remover              |
| /guide                    | how to use nano banana                |

### Legacy video search boundary

`/ai-video-generator`, `/wan-3-0`, `/minimax-h3`, `/seedance-2-5` and
`/seedance-2-5-draft-mode` remain usable but carry `noindex, follow` in every
locale, have self-topic canonicals, omit hreflang, and are excluded from the
sitemap. They are deliberately not blocked in robots.txt: Google needs to crawl
the noindex directive. Keep image capabilities and existing workspaces intact.

The owner's screenshot shows seven queries over a 24-hour window with about
one impression per query. It is insufficient for conclusions about sustained
ranking. Review query + landing-page pairs over 28 days and compare the next
settled 28-day window after re-crawling. Separate image intent from video intent;
track image impressions, clicks, CTR and position alongside GA4 generation and
checkout events. Do not promise particular keywords, positions or crawl dates.

## Image model pages

| URL                     | Primary keyword                  |
| ----------------------- | -------------------------------- |
| /gpt-image-2-5-flare    | gpt image 2.5 flare generator    |
| /gpt-image-2-5-sunburst | gpt image 2.5 sunburst generator |
| /nano-banana-2          | nano banana 2 generator          |
| /nano-banana-2-5        | nano banana 2.5 generator        |
| /nano-banana-2-lite     | nano banana 2 lite generator     |
| /nano-banana-pro        | nano banana pro generator        |
| /seedream-5-pro         | seedream 5.0 pro generator       |
| /flux-2-pro             | flux.2 pro generator             |

## Tool pages

| URL                          | Primary keyword             |
| ---------------------------- | --------------------------- |
| /ai-image-generator          | ai image generator          |
| /ai-image-editor             | ai image editor             |
| /image-background-remover    | image background remover    |
| /background-changer          | background changer          |
| /add-shadow-to-image         | add shadow to image         |
| /ai-relight                  | ai relight                  |
| /remove-object-from-photo    | remove object from photo    |
| /ai-inpainting               | ai inpainting               |
| /ai-image-extender           | ai image extender           |
| /ai-image-upscaler           | ai image upscaler           |
| /image-layers-editor         | image layers editor         |
| /add-text-to-image           | add text to image           |
| /online-image-editor         | online image editor         |
| /batch-image-editor          | batch image editor          |
| /image-resizer               | image resizer               |
| /brand-kit                   | brand kit                   |
| /product-image-set-generator | product image set generator |
| /image-to-svg                | image to svg                |
| /svg-editor                  | svg editor                  |
| /ai-logo-generator           | ai logo generator           |
| /templates                   | design templates            |
| /sketch-to-image             | sketch to image             |
| /annotate-image-edit         | annotate image              |
| /prompt-builder              | ai prompt builder           |
| /image-workflow-builder      | image workflow builder      |

## Image scenario pages

| URL                             | Primary keyword                |
| ------------------------------- | ------------------------------ |
| /ai-poster-generator            | ai poster generator            |
| /ai-product-photo-generator     | ai product photo generator     |
| /ai-youtube-thumbnail-generator | ai youtube thumbnail generator |

## Prompt categories

The /prompts page owns Nano Banana image prompt discovery. Image category pages own only their exact category intent:

- /prompts/poster — poster prompts
- /prompts/product — product photography prompts
- /prompts/typography — typography prompts
- /prompts/infographic — infographic prompts
- /prompts/ecommerce — ecommerce image prompts
- /prompts/ui — UI design prompts
- /prompts/illustration — illustration prompts
- /prompts/photography — AI photography prompts
- /prompts/chinese — Chinese text image prompts

## Consolidation rules

- Internal prompt hand-offs use fragment URLs plus session storage, not crawlable prompt query strings.
- Pages with English-only body content are indexable only in English until a reviewed Chinese version exists.
- Non-indexable locale fallbacks use noindex, follow and canonicalize to the indexed English URL.
- Only English and reviewed Simplified Chinese URLs belong in the sitemap.
- New model or tool pages must receive a unique keyword here before release.
