# Long-tail page routing and SEO specification

Reviewed: 2026-10-10. This work follows the project's `new-page`,
`new-static-page`, and the SEO section of `launch-audit` where applicable.
Editorial pages use the existing bilingual `NanoSitePage` factory rather than
introducing a second MDX renderer. No database or provider changes are required.

## Content routes

Keep all existing canonical paths and their current titles. Expand their content
counts: home 10 sections / 6 FAQs; prompts, comparison, science, guide 5 / 3;
migration 4 / 3. Other existing counts remain 4 / 2.

Add complete English and Chinese pages:

| Page ID        | Canonical path                        | Sections / FAQs | Metadata |
| -------------- | ------------------------------------- | --------------- | -------- |
| versus2        | `/vs-2`                               | 5 / 3           | Article  |
| versusGpt      | `/vs-gpt-image`                       | 5 / 3           | Article  |
| mcp            | `/mcp`                                | 5 / 3           | WebPage  |
| logo           | `/logo`                               | 5 / 3           | WebPage  |
| blog           | `/blog`                               | 3 / 2           | WebPage  |
| blogProduct    | `/blog/product-photo-prompts`         | 4 / 2           | Article  |
| blogText       | `/blog/readable-text-in-ai-images`    | 4 / 2           | Article  |
| blogReferences | `/blog/consistent-characters`         | 4 / 2           | Article  |
| blogExport     | `/blog/image-export-resolution`       | 4 / 2           | Article  |
| blogRights     | `/blog/commercial-use-and-watermarks` | 4 / 2           | Article  |

The existing `/blog` becomes an editorial hub while preserving its MDX/DB loader
and previous article listing inside the hub. Keep `/blog/$slug` intact so historic
article URLs still resolve. Explicit static tutorial routes take precedence over
that dynamic route. No new empty pages or placeholder
claims of an operational MCP/API offering are introduced. No `/vs-qwen` route is
added, respecting the earlier Qwen removal request.

## Permanent aliases

| Alias         | Target                         |
| ------------- | ------------------------------ |
| `/vs-pro`     | `/posts/nano-banana-21-vs-pro` |
| `/how-to-use` | `/guide`                       |
| `/migration`  | `/guide/nano-banana-2-to-2-1`  |
| `/maker`      | `/editor`                      |
| `/claude`     | `/mcp`                         |

Use TanStack's `beforeLoad` redirect with status 301. Preserve the request's
locale, query string, and fragment; do not hardcode a production origin into the
redirect. Use the Paraglide localization runtime for locale prefixes. Aliases
render no duplicate body and have no sitemap entries.

## Search metadata and sitemap

Continue using `seoHead`: unique translated title/description, self canonical,
Open Graph/Twitter, localized Article/WebPage, breadcrumbs, visible FAQ data.
Only reviewed English and Chinese are indexable; do not expand hreflang/sitemap
to untranslated locales. Source the new canonical paths from `NANO_SITE_PAGES`
and deduplicate against historic paths. Preserve existing published blog URLs.

## Verification

The root integration will regenerate `routeTree.gen.ts` via Vite; never edit it
by hand. Run `pnpm typecheck` and `pnpm build` after integration. Read local
HTTP responses for all ten canonical pages and all five aliases in English and
Chinese; confirm 200 or exact 301 target, correct canonical/hreflang, complete
page content, no duplicate sitemap URLs, no aliases, no unreviewed locale URLs.
No schema synchronization, production migration, commit, or deployment is part
of this routing change.
