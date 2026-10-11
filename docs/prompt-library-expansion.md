# Prompt library expansion — 2026-10-11

The public `/prompts` page and account `/settings/prompts` now share a catalog of **1,488 unique prompts with source-paired example images**, replacing the account's seven placeholder cards. These are credited community examples, not original works of this site.

## Benchmark and source scope

| Library | Observed inventory | What was used |
| --- | --- | --- |
| [NanoBanana21](https://nanobanana21.com/app/prompts) | 24 rendered preview images in the observed view; no authoritative total shown | Interaction reference only. No unlicensed original image imports. |
| [KenerateAI](https://kenerateai.com/nano-banana-prompts) | Page states 26 prompts | Structure reference only. |
| [MeiGen.ai](https://github.com/jau123/nanobanana-trending-prompts) | 1,446 complete structured records | 1,365 usable, unique, locally paired examples. |
| [YouMind OpenLab](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) | Website inventory advertised as 15,768; repository snapshot contains 129 complete featured sections | 123 usable featured examples. The advertised full website inventory was not imported. |

The two imported collections publish CC BY 4.0 licenses. Individual creator, original publication, collection, license, source model, and changes are retained in every record and displayed in the image/prompt dialog. Prompts are not relabeled as results generated on this site. `/data/prompt-library-credits.txt` includes the collections' license notices. Image bytes and watermarks are preserved; only separate WebP previews are resized.

Snapshots:

- MeiGen: `eb4e5889ac3272fe9d9ca49db90cec60e2a24a38`
- YouMind: `621bc9414edf7783a41fdf0d33548e500b9730ea`
- Catalog revision: `407869b0f8e8`

Exclusions include duplicate/incomplete records, unsupported prompt lengths, unsuitable public-gallery content, three failed image URLs, and a visually detected source mismatch (male-specific prompt paired with a female subject). The editorial exclusion is retained in `src/config/prompt-library-exclusions.json`. The displayed total counts complete records with decoded, locally verified image pairs. Featured examples were visually reviewed; all 1,488 prompts have not been individually regenerated on this site's model.

## User experience

- Search titles, complete prompts, styles, authors and example models.
- Ten categories with actual counts; filter text-to-image/reference-image recipes and original example model.
- Featured, alphabetical and newest sorting; 24 items per page.
- Favorite prompts in this browser, with an explicit favorites filter.
- Open full-resolution originals and complete copyable prompts.
- Use a prompt via the existing session-storage handoff to `/settings/generate?resume=recipe`. The current available Nano Banana 2.1 generator remains the default.
- Reference-dependent recipes enter edit mode and require the user's own upload. Example output images are not automatically treated as input references.
- Selecting/copying/favoriting a prompt does not start generation or consume credits.

## Architecture and operations

The public page contains 24 server-rendered featured examples and uses the existing canonical, hreflang and sitemap entry. The account page stays noindex. The complete catalog and image files are static assets; loading or filtering the library adds no database queries or Worker generation requests. Originals total approximately 256 MiB, while cards load smaller lazy WebP previews.

`scripts/import-prompt-library.mjs` reads source snapshots as data only, deduplicates records, restricts downloads to the two known HTTPS image CDNs, verifies raster metadata, retains original hashes, and produces the catalog and featured manifest. It can resume using cached images. Source repositories are not executed.

Recreate source snapshots in `.artifacts/prompt-research/trending` and `youmind`, check out the pinned revisions above, and include `prompts/prompts.json` in the trending sparse checkout. Run the importer, then `scripts/merge-prompt-library-messages.mjs` if translation keys are absent. Featured display names/categories can be edited in `src/config/prompt-library-curation.json`. Controls are Chinese in the Chinese catalogs and English fallbacks in the remaining catalogs; original prompt languages are retained.

## Validation

`pnpm exec tsx scripts/verify-prompt-library.ts` verifies count, uniqueness, category totals, each original and preview, image dimensions, original SHA-256 bytes, attribution fields, supported prompt lengths, search/category/favorite filters, and generation handoff. Build, static prerender, security scan, and browser interaction acceptance are required before release.

The template scanner's binary-to-text worktree concatenation is unsuitable for thousands of original images. `scripts/verify-prompt-release-security.py` calls the template's filename, ignore, tracked-file, size and secret checks while scanning UTF-8 source separately; the raster assets are decoded and hash-verified by the catalog test. One 7 MiB licensed original triggers the scanner's 5 MiB repository-size advisory; it is deliberately retained unchanged, fits the asset limit, and is only loaded on demand in the detail viewer. No HIGH finding was reported.

## Production acceptance — 2026-10-11

Published to the existing `nanobanana21pro-com` Worker and `https://nanobanana21pro.com`, version `1bd6d5a0-8b91-445a-9fc3-b248e6c794b7`. The release identity guard verified the domain and existing Nano Banana D1 binding. No database migration was needed.

Production catalog and public page returned HTTP 200 with revision `407869b0f8e8` and 1,488 records. Sample preview/original pairs from all three example models returned HTTP 200 with correct raster content types. The public page has one H1, its existing canonical and no noindex directive.

Chrome acceptance in the signed-in account confirmed 1,488 records and 62 pages. A text recipe populated the current Fal workbench in text-to-image mode. The product contact-sheet recipe populated its full prompt in image-to-image mode with zero uploaded references, requiring the user's own reference. Neither action submitted generation or consumed credits. Public browser search for `sandwich` returned five records, and the reference-image filter returned 207. Favorite persistence, full originals, copying, light theme and mobile layout were checked using the shared component in the local preview.

`pnpm typecheck`, the production build with 1,530 prerendered pages, catalog/image verification and translation validation passed. Production screenshot: `.artifacts/prompt-research/prompt-library-live.png`. Deployment log: `.artifacts/prompt-research/deploy-retry.log`.
