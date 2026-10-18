# Shared JavaScript performance repair — 18 October 2026

The owner authorized continued shared-JavaScript repairs, strict verification and automatic Git deployment. The existing homepage composition, photographs, carousel, creation dialog, languages, authentication, checkout, generation, credits and monitoring remain preservation boundaries. No paid generation or payment is needed to verify this loading change.

## Diagnosis and implementation

Before this task, home and the Pro comparison each advertised 51 unique first-party JavaScript preload/entry resources: 8,324,817 decoded bytes, 2,414,201 bytes with standardized gzip. The Chinese prompt page advertised 52: 8,341,598 decoded / 2,419,685 gzip bytes. This counts unique URLs in HTML modulepreload/module-script tags, not later dynamic imports or third-party scripts. HTTP bodies are decoded and recompressed identically for comparison; these are not exact browser transfer totals.

The prior isolated build contained a 6,825,298-byte translation chunk (1,967,676 gzip). PageSpeed identified the deployed translation chunk as approximately 1,223 KiB transferred with 1,090 KiB unused; the different transfer number reflects the deployed build/compression, rather than the normalized gzip measure above.

Two causes combine: unbounded runtime lookup of the complete `m` namespace retains unrelated keys, and `locale-modules` compilation co-locates thousands of messages in shared source modules. Narrowing the lookups alone yielded a 5,991,791-byte / 1,758,107 gzip message chunk, only a modest reduction. That intermediate client build was not published.

Runtime lookup now uses 22 finite generated registries. Each entry references the original Paraglide message function; interpolation, locale selection, metadata and fallback behavior stay in the existing compiler runtime. The helper rejects inherited object properties and retains the existing unknown-key fallback. `scripts/dynamic-message-scopes.json` defines the scopes; run `pnpm i18n:lookups` after changing the corresponding keys. Normal and Cloudflare production builds check that the registries match the message catalog. `pnpm test:i18n-lookups` checks registry membership, original function identity, all 18 locale catalogs, interpolation, explicit locale selection, unknown/prototype keys and source access patterns.

Production builds use the standard Paraglide `message-modules` output. A compiler-only trial still merged the used messages through the namespace barrel into a roughly 6 MB shared chunk, so the build also rewrites static references into direct physical message imports. The transform reads the compiler's actual exports, retains the original function bodies, and emits high-resolution source maps. JSX, duplicate references, parameters, locale options and source maps are covered by a dedicated test; unknown or unsupported namespace uses fail the build. The compiler-only trial was not published. Development retains `locale-modules` to keep rebuild/file counts manageable. This does not use experimental middleware locale splitting or change client navigation. See the installed compiler's `--help` and [official compiler options](https://paraglidejs.com/compiler-options).

## Verification

- Scoped registry check: 1,939 function references; 18 locale catalogs; interpolation and error cases passed.
- Source regression check: 548 source files without unbounded `m` namespace access.
- 18-language catalog consistency, auth navigation, generation/purchase resume, homepage showcase mixing/wrapping, analytics/privacy, public creative routes, keyword generators, Creative Studio validation/SVG safety, search policy, sitemap freshness and agent discovery checks passed.
- The existing approved homepage source/copy/image hash guard passes without changing its baseline.
- The first release's Node production build passed: client 3m45s, SSR 3m26s, Nitro 43.71s. TypeScript passed after message compilation. The Cloudflare Git build repeats the production compilation and source/built homepage guards.
- All 120 sitemap pages passed the compiled-server HTTP/SEO sweep; image/evidence/schema checks passed. Home, Pro comparison and Chinese prompt pages retain exactly the same visible SSR text as the pre-change production HTML.
- CUA exercised the English and Chinese creation dialogs, 4K/two-output controls, original example import, Chinese NB-05 import, old-brief restoration followed by a reference edit (one reference, 3:2, 1K, one output), and the prompt-library Ecommerce filter. No browser console errors were captured. No paid generation, payment or production login mutation was performed. The local SQLite environment has no connected image provider, so its unavailable-model message is not production acceptance evidence.
- Responsive DOM widths were 389/768/1440 CSS pixels with no horizontal document overflow. Desktop appearance was reviewed; Chinese dark/light classes and content were checked. Narrow viewport screenshot capture timed out in the browser tool, so this report does not claim narrow screenshots passed. Original styles and the protected homepage baseline remain unchanged.
- Scoped security scan and manual diff review passed with no findings in 57 changed files. The only newly declared dependency, locked magic-string 0.30.21, was already present transitively and is used only in the build transform.
- This committed report records the release candidate. The Git commit, Cloudflare deployment version and post-release verification are recorded in the task handoff and `.artifacts/js-performance-20261018/release.json` after the authorized Git push.

## Measurement method

PageSpeed uses Lighthouse 13.5.0 / HeadlessChromium 153; mobile is simulated Moto G / slow 4G, desktop uses the report's custom throttling. No CrUX field data is available. Scores are lab observations and may vary. Preserve all runs, including regressions, and compare byte counts independently of score changes. Raw reports and build logs are under `.artifacts/js-performance-20261018/`.

| Before, same production release | Performance | FCP   | LCP   | TBT   | CLS   |
| ------------------------------- | ----------- | ----- | ----- | ----- | ----- |
| Home mobile, 18:32              | 56          | 11.0s | 13.0s | 0ms   | 0     |
| Home desktop, 18:32             | 71          | 0.8s  | 1.0s  | 810ms | 0.001 |
| Pro comparison mobile, 18:26    | 56          | 10.9s | 11.8s | 0ms   | 0     |
| Pro comparison desktop, 18:26   | 77          | 0.8s  | 0.8s  | 540ms | 0     |
| Chinese cases mobile, 18:36     | 56          | 10.9s | 11.3s | 0ms   | 0     |
| Chinese cases desktop, 18:36    | 62          | 1.9s  | 1.9s  | 460ms | 0     |

## First published translation-splitting payload

The same preload/entry measurement described above was repeated against the final compiled server. Third-party analytics/Google scripts and lazy chunks requested after startup are excluded from both sides; no monitoring integration was removed or disabled.

| Page           | Before raw JS | First-release raw JS | Before normalized gzip | First-release normalized gzip | Gzip reduction |
| -------------- | ------------: | -------------------: | ---------------------: | ----------------------------: | -------------: |
| Home           |     8,324,817 |            5,620,989 |              2,414,201 |                     1,353,770 |         43.92% |
| Pro comparison |     8,324,817 |            5,620,989 |              2,414,201 |                     1,353,770 |         43.92% |
| Chinese cases  |     8,341,598 |            6,160,493 |              2,419,685 |                     1,582,274 |         34.61% |

Startup resources increase from 51 to 53 on home/comparison and from 52 to 54 on Chinese cases. This is a tradeoff of two small additional files for substantially fewer bytes; no inventory image is eagerly loaded to manufacture the reduction. That first release still had a 5,272,761 raw / 1,228,588 normalized gzip client entry. Existing eager route factories, shared page copy and framework/UI code still offer further optimization opportunities. This release does not claim that all shared JavaScript or unused code is eliminated, nor that the lab/field Core Web Vitals targets are met. Production PageSpeed is re-measured after Git deployment and all runs are retained.

## Production feedback and further isolation

Commit `587d28bd01474bf583a1098a9adb725e7b826b40` was automatically published by the Cloudflare Git build `0f52786e-d471-4a7f-85d0-181b270f8847`, active version `d7fa1b2f` (100% Ready). All 120 production sitemap pages and evidence/schema checks passed. Production normalized gzip was 1,353,843 bytes on home/comparison and 1,582,349 on Chinese cases. The following results were retained rather than treating a byte reduction as complete performance acceptance:

| First production release, 19:13 | Performance |  FCP |  LCP |   TBT |   CLS |
| ------------------------------- | ----------: | ---: | ---: | ----: | ----: |
| Home mobile                     |          45 | 7.8s | 9.0s | 510ms |     0 |
| Home desktop                    |          84 | 0.6s | 1.6s | 260ms | 0.001 |
| Pro comparison mobile           |          54 | 7.7s | 9.3s | 220ms |     0 |
| Pro comparison desktop          |          85 | 0.5s | 0.5s | 350ms |     0 |
| Chinese cases mobile            |          82 | 3.3s | 3.3s | 210ms |     0 |
| Chinese cases desktop           |          64 | 1.5s | 1.6s | 630ms |     0 |

A separate home mobile repeat at 19:15 scored 39, FCP 7.8s, LCP 9.7s, TBT 780ms, CLS 0. Loading improved, but mobile blocking regressed; the follow-up therefore continues beyond the first release.

The site route factory had been importing page copy, generator copy and rendering together. Copy for every page consequently entered the startup graph. The follow-up moves the existing copy builders to `nano-site-content.ts`, obtains the active page's serializable presentation through a bounded public GET server function, and passes it to the unchanged rendering composition. SSR computes it in-process; client navigation requests the active page. Known page IDs and all 18 supported locale values are validated with Zod. No user records, provider credentials or mutable business data are returned; no generation, billing, auth or database mutation is added. A prototype production build returned correct 200/H1 output for home, Pro comparison, Chinese home/cases and blog; CUA exercised the actual Chinese client transition to NB-05.

A second eager path came from route FAQ/schema loaders importing blocks that also contained video/image workspaces. These loaders now import a small `public-faq-copy.ts` module; the same functions are used/re-exported by their rendering blocks. Its finite registry contains only the relevant FAQ keys. All 43 question/answer pairs across eight page types were compared to the original compiler functions in every locale. The workflow-copy helper now accepts an explicit locale so an unprefixed server-function URL cannot select English for a Chinese navigation. All 18 explicit workflow locales passed.

Follow-up TypeScript, locale consistency, creative/public pages, keyword generators, Creative Studio/SVG safety, auth navigation, generation/purchase resume, showcase wrapping, search policy, sitemap freshness and discovery checks passed. The deterministic and manual security review found no findings in the 24 source changes reviewed before the report update. The protected homepage baseline has not been changed. The final candidate/production payload and lab outcomes are recorded in the task release evidence after full compiled-browser validation and Git deployment.

## Final follow-up candidate validation

The complete follow-up Node build passed (client 4m52s, SSR 3m27s, Nitro 45.15s). All 120 sitemap URLs, evidence image/schema checks and the approved homepage guard passed again. Home, Pro comparison and Chinese cases retain exactly the same visible SSR text as the original production snapshots. No homepage baseline, protected image, protected copy or styling source was changed.

The final CUA check used the complete build at port 3124: Chinese NB-05 navigation prepared the expected Chinese headline, 1:1/1K/single-output settings; Chinese pricing navigation updated both H1 and document title; the carousel pause control switched to Continue with pressed state. Keyboard activation was used where overridden viewport pointer/screenshot capture did not act reliably. Mobile measured 390 CSS pixels / 373 document pixels, desktop 1440 / 1423; no horizontal document overflow or application-runtime errors from the final preview origin were observed. Earlier browser-extension message-channel errors came from the previous production document, not the preview. Paid actions were not submitted. Native narrow screenshots remain a tool limitation rather than claimed visual evidence.

| Page           | Original raw JS | Final candidate raw JS | Original normalized gzip | Final candidate normalized gzip | Gzip reduction |
| -------------- | --------------: | ---------------------: | -----------------------: | ------------------------------: | -------------: |
| Home           |       8,324,817 |              2,630,146 |                2,414,201 |                         735,551 |         69.53% |
| Pro comparison |       8,324,817 |              2,630,146 |                2,414,201 |                         735,551 |         69.53% |
| Chinese cases  |       8,341,598 |              3,171,171 |                2,419,685 |                         964,958 |         60.12% |

These measurements use the same Python gzip calculation throughout. The largest startup entry is now 2,283,183 raw / 611,135 Python-gzip bytes. Home/comparison have 51 unique initial modules; Chinese cases 54. The separate site-copy and tool-workspace chunks are no longer first-party startup requirements on these pages.

A new reproducible gate, `pnpm test:startup-js <origin>`, fetches unique first-party modulepreload/module-entry assets and checks all responses plus normalized Node-gzip budgets: 900,000 bytes for home/comparison and 1,200,000 for Chinese cases. The final candidate passes at 740,286 / 740,286 / 973,744 Node-gzip bytes. Node and Python zlib implementations produce slightly different compressed totals; budgets use Node consistently, and longitudinal percentages above use Python consistently. Both exclude inline loader JSON, images and third-party scripts. No browser-specific, bot-specific, analytics-disable or feature-disable path is used to meet a budget. After the authorized Git deployment, the same HTTP/SEO, startup-budget and PageSpeed checks are repeated; the definitive release evidence is `.artifacts/js-performance-20261018/release.json` and the final task handoff.
