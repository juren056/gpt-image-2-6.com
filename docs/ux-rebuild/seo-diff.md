# SEO route diff

## Preserved

- Root metadata/H1, EN/ZH indexing policy, existing guides, prompts, Lab, blog, legal and legacy tool URLs.
- `seoHead` still emits localized canonical, hreflang, social metadata and JSON-LD.
- `robots.txt` still blocks private settings, admin and API paths.

## Added

- Unique metadata, H1, canonical and WebApplication schema for every explicit model/tool route.
- `/models` directory and server-rendered links.
- New clean URLs in sitemap; query drafts and private Studio remain excluded.
- Homepage and `/tools` contain crawlable links to every new page.

The shared route shells are code-split. The existing Paraglide message bundle remains the largest build artifact and was not expanded with duplicate page translations in this round.
