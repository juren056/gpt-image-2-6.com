# SEO keyword ownership map

Updated: 2026-09-20

This document defines the primary search intent owned by each public page family. Supporting copy may use related terms, but navigation anchors, Title, H1, introduction, FAQ, and structured data should reinforce the assigned intent instead of competing with another URL.

## Core hubs

| URL                   | Primary keyword            |
| --------------------- | -------------------------- |
| /                     | qwen image 3 generator     |
| /qwen-image-editor    | qwen image editor          |
| /models               | ai image models            |
| /tools                | ai image tools             |
| /prompts              | ai image and video prompts |
| /qwen-image-3-prompts | qwen image 3 prompts       |
| /guides               | qwen image 3 guides        |
| /lab                  | qwen image 3 tests         |
| /pricing              | qwen image 3 pricing       |
| /blog                 | qwen image 3 blog          |

## Image model pages

| URL                             | Primary keyword                  |
| ------------------------------- | -------------------------------- |
| /qwen-image-2-1-generator       | qwen image 2.1 generator         |
| /qwen-image-2-1-transparent-png | qwen image 2.1 transparent png   |
| /gpt-image-2-5-flare            | gpt image 2.5 flare generator    |
| /gpt-image-2-5-sunburst         | gpt image 2.5 sunburst generator |
| /nano-banana-2                  | nano banana 2 generator          |
| /nano-banana-2-5                | nano banana 2.5 generator        |
| /nano-banana-2-lite             | nano banana 2 lite generator     |
| /nano-banana-pro                | nano banana pro generator        |
| /seedream-5-pro                 | seedream 5.0 pro generator       |
| /flux-2-pro                     | flux.2 pro generator             |

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

## Video and scenario pages

| URL                             | Primary keyword                |
| ------------------------------- | ------------------------------ |
| /wan-3-0                        | wan 3.0 ai video generator     |
| /seedance-2-5                   | seedance 2.5 video generator   |
| /minimax-h3                     | minimax h3 video generator     |
| /ai-video-generator             | ai video generator             |
| /ai-poster-generator            | ai poster generator            |
| /ai-product-photo-generator     | ai product photo generator     |
| /ai-youtube-thumbnail-generator | ai youtube thumbnail generator |

## Prompt categories

The /prompts page is the broad mixed image-and-video library. Image category pages own only their exact category intent:

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

- /qwen-image-3-standard-vs-pro permanently redirects to /qwen-image-3-vs-pro.
- Internal prompt hand-offs use fragment URLs plus session storage, not crawlable prompt query strings.
- Pages with English-only body content are indexable only in English until a reviewed Chinese version exists.
- Non-indexable locale fallbacks use noindex, follow and canonicalize to the indexed English URL.
- Only English and reviewed Simplified Chinese URLs belong in the sitemap.
- New model or tool pages must receive a unique keyword here before release.
