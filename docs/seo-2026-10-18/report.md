# 2026-10-18 SEO execution and verification

Scope: the owner's `01_NanoBanana21Pro_Analysis_2026-10-18.md` and `02_NanoBanana21Pro_Codex_Tasks_2026-10-18.md`, read before implementation. Repository: `juren056/nanobanana21pro.com`, branch `main`. The worktree was clean at entry. This release covers SEO content and output only. Authentication, payments, generation, credits, subscriptions, popups and analytics business behavior are outside this change.

## Baseline and live GSC findings

See [120-URL pre-release baseline](baseline.csv), [65 discovered URLs](gsc-discovered.csv), [intent map](intent-map.md), and [source/citation ledger](sources-and-citation-candidates.md). Detailed raw HTML and browser observations are retained locally under `.artifacts/seo-20261018/`; they are not public application assets.

GSC was inspected through CUA in the signed-in Chrome browser, property `sc-domain:nanobanana21pro.com`:

- Index report last updated 12 October: 53 indexed, 72 excluded. The 65 “Discovered – currently not indexed” examples all show last crawl as unavailable. This is an aggregate discovery report, not evidence that Google fetched and rejected the present content. The initial HTTP crawl finds all 65 reachable.
- Three redirects are the HTTP / www homepage variants; preserve HTTPS apex normalization.
- Three “alternate with proper canonical” examples are `/?prompt=...` handoffs. They canonicalize to the clean homepage. Do not add parameter URLs to the sitemap.
- One intentional noindex is `/sign-up?callbackUrl=/#tool-generator`. It remains excluded.
- “Crawled – currently not indexed” shows zero. No server-error class was reported in the viewed report. A separate fetch timeout would not establish a Googlebot block.
- Existing sitemap was successful, submitted 14 October, last read 16 October, 116 discovered URLs.
- `/prompts/chinese`: historical inspection says URL unknown to Google, no recorded crawl/referring sitemap/canonical. Its realtime inspection on 18 October at 17:18:48 succeeds with smartphone inspection, allowed crawl and indexing, and the correct self-canonical. These are different time/state views and are recorded separately.
- `/posts/nano-banana-21-vs-pro`: indexed; Googlebot smartphone crawl on 18 October at 04:29:28 succeeded, crawl/index allowed, declared and Google-selected canonical both the inspected URL. Referring page `/templates`; no referring sitemap detected in this inspection. Valid breadcrumb reported.

The supplied seven-day web-search baseline is 5 clicks / 102 impressions / 4.90% CTR / average position about 36.2, 9–15 October. The separate 24-hour window has 0 clicks / 8 impressions / position 32.88. These cannot be compared as growth rates. Query and page exports are independent, not joint query/page records.

## SEO00–SEO12 delivery

| ID    | Implementation / existing verified behavior                                                                                                                                                                                                                                                            | Verification / remaining boundary                                                                                             |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| SEO00 | Captured public initial HTML for 120 URLs; recorded status, title, description, H1, canonical, robots, body, links, images, schemas and languages. Mapped content and SEO sources.                                                                                                                     | GSC observations above; baseline CSV retained.                                                                                |
| SEO01 | Existing core URLs have distinct responsibilities, baseline and related reading in `intent-map.md`.                                                                                                                                                                                                    | Possible overlap is marked unproven; no unsupported mergers, mass deletion or keyword-volume claims.                          |
| SEO02 | Added crawlable independent-service/model explanation, actual controls/costs, four recorded original examples, method and contextual links below existing homepage content.                                                                                                                            | Existing workspace, hero, photo sequence, pricing and interaction retained; protected baseline changes require visual review. |
| SEO03 | Two original side-by-side comparison pages now contain full prompts, inputs, endpoint, date, shape, resolution, dimensions, 8/6/15-credit records and specific observations.                                                                                                                           | One trial/model; requested resolution uncontrolled; no speed/quality winner, invented accuracy or October 29 shutdown.        |
| SEO04 | NB-05–08 original previews/prompts and exact text observations, punctuation differences and repeatable correction process. Chinese directory and general tutorial retain different purposes and interlink.                                                                                             | No new generation; final text and input fidelity still require human review.                                                  |
| SEO05 | MCP remains a tutorial: external version-pinned stdio example, scope, credentials, IDs/status/results and troubleshooting; source/license checked. Free/pricing copy explains eligible 20/30-day grant, 2 × 8 with 4 left, 8/12/28 quotes, Mini Pack and separate provider billing.                    | External MCP not installed or executed; no hosted endpoint or new site capability. Commercial configuration unchanged.        |
| SEO06 | Expanded four existing method-page cases: Chinese headline, fictional snack label, bottle background edit and two-reference scene. Includes originals and complete records.                                                                                                                            | Zero new duplicate case URLs; raw originals and manifest preserved. Bria remains identified separately.                       |
| SEO07 | Updated intent-specific titles/descriptions, Draft H1/status, share images and actual editorial dates; retained existing suitable Article/Organization/WebSite/SoftwareApplication/Breadcrumb/FAQ output.                                                                                              | Validate initial HTML and schema JSON; no ratings or guaranteed rich results.                                                 |
| SEO08 | Sitemap dates reflect actual edits, canonical EN/ZH pages and evidence image locations. Removed contradictory noindex only for Wan and Draft, both with prior GSC exposure and useful existing content. Existing parameter canonical, redirect, private noindex and reviewed-language policy retained. | No broad locale canonical changes. Indexing remains Google's decision.                                                        |
| SEO09 | Added semantic links between home, comparisons, methods, Chinese and text tutorial; stable image src/alt/dimensions/lazy previews and original PNG links; image sitemap added to relevant landing pages.                                                                                               | Performance measurements and any narrow resource repair recorded below; no unsupported improvement claim.                     |
| SEO10 | Preserved Wan sources/content/workspace; refreshed metadata. Draft clearly describes editable cost assumptions and unavailable generation. Rights tutorial adds concrete provenance/delivery checks and existing official sources.                                                                     | Other lower-relevance model variants retained without expansion. No Halloween thin pages.                                     |
| SEO11 | Public original evidence and four expanded source records are citation-ready; verified source and relevant contribution-candidate ledger prepared.                                                                                                                                                     | No outreach, third-party posts, paid links or external-repository changes.                                                    |
| SEO12 | Build, type, indexing/freshness, locale, HTTP/content/schema/image and security checks form the release gate. Git release and live verification recorded below.                                                                                                                                        | Seven-day and 28-day search effects cannot be measured on release day.                                                        |

## Main implementation locations

- `src/blocks/seo-editorial.tsx`: translated crawlable evidence and tutorials; integrates with home, article pages and Chinese directory.
- `src/blocks/{banana-home,nano-site,prompt-directory,verified-examples}.tsx` and `src/components/{banana-article,verified-examples}.tsx`: content wiring and original case observations.
- `messages/{en,zh}.json`: reviewed English/Chinese content; other UI catalogs receive matching English fallback keys and remain subject to the existing reviewed-language index policy.
- `src/content/pages/evaluation-method.{en,zh}.mdx`: four complete existing case records.
- `src/config/{search-indexing,sitemap-updates}.ts`, `src/routes/sitemap[.]xml.ts`, route metadata and `src/lib/nano-site-routes.tsx`: indexing policy, dates, images and share metadata.
- `scripts/verify-{search-indexing,sitemap-freshness}.ts`: tests for changed SEO policy/date behavior; existing HTTP SEO sweep retained.

## Release checks and deployment

Local release gate passed: `pnpm build`, `pnpm typecheck`, `pnpm i18n:validate`, `verify-search-indexing.ts`, `verify-sitemap-freshness.ts`, `verify-seo-local.mjs` and `verify-seo-evidence.mjs`. The final HTTP sweep reports 120 indexable sitemap URLs, no non-200 responses, missing/duplicate titles or descriptions, H1/canonical failures or orphans. The evidence check verifies 10 EN/ZH image landing pages, eight distinct original image URLs and four restored indexable video URLs. Original PNG SHA-256 verification passes for all 20 files.

CUA reviewed the existing composition and new content in English/Chinese, dark/light, and actual 389/768/1440 CSS-pixel representative widths. No horizontal document overflow was measured. Four protected source hashes were updated for the authorized SEO body/thumbnail/font-import changes; original photos, protected copy, generator and commercial source hashes remain unchanged. The initial local preview lacked an ephemeral auth secret; a correctly configured final preview was used for the release checks. This does not test registration or payment flows, which are outside the SEO change.

Pre-commit security review: the repository `security-scan` worktree scanner returned clean, and the manual diff review found no reachable injection, XSS, privilege or business-rule change. The only endpoint output changed is the public sitemap. Public, fixed evidence paths are rendered as escaped React text and ordinary links. The staged scan is required again immediately before commit.

Git publication, production verification and GSC submission results will be appended after the actual deployment, not inferred from a queued build.

Cloudflare dashboard read-only inspection confirms the production Worker, D1 and upload bucket belong to Nano Banana, repository `juren056/nanobanana21pro.com`, production branch `main`, build `pnpm cf:ci:build`, deploy `pnpm cf:ci:deploy`. Builds are enabled. The settings page also displayed a GitHub user/organization lookup warning; actual push/build outcome must be checked before declaring release success.

## Performance evidence

PageSpeed's direct public API returned daily-quota HTTP 429, so the public PageSpeed UI was used through CUA. No CrUX field data was available for the inspected comparison. The initial mobile comparison run (18 October 17:30, Lighthouse 13.5.0, simulated Moto G / slow 4G) measured performance 56, FCP 11.0s, LCP 12.2s, TBT 0ms and CLS 0. Desktop measured 69, FCP/LCP 0.8s, TBT 1370ms, CLS 0. These are single lab runs, not user percentiles. The report identifies the shared CSS as render blocking and substantial unused shared JavaScript; the latter is not permission to refactor the generator or other business modules.

| Before release, single lab run | Performance | FCP   | LCP   | TBT    | CLS   |
| ------------------------------ | ----------- | ----- | ----- | ------ | ----- |
| Homepage mobile                | 56          | 11.1s | 13.1s | 0ms    | 0     |
| Homepage desktop               | 64          | 1.9s  | 2.3s  | 340ms  | 0.001 |
| Comparison mobile              | 56          | 11.0s | 12.2s | 0ms    | 0     |
| Comparison desktop             | 69          | 0.8s  | 0.8s  | 1370ms | 0     |
| Chinese cases mobile           | 68          | 4.1s  | 4.4s  | 310ms  | 0     |
| Chinese cases desktop          | 80          | 0.8s  | 0.9s  | 410ms  | 0     |

All six reports show no field data and Lighthouse SEO 100; that score checks basic technical output, not content quality or ranking. Detailed text is retained in `.artifacts/seo-20261018/psi-*-before.txt`.

Measured narrow fixes: remove an unused 101,698-byte `Noto Sans SC Variable` CSS import (no styles reference that family; system typography remains unchanged); add 320px responsive previews for recorded evidence and 384/640px variants for the seven approved homepage photographs. Existing original PNGs, original WebPs and cache-revision URLs remain valid. The 20 existing evidence previews total 822,104 bytes; their new 320px alternatives total 214,156 bytes. Seven source photographs total 597,814 bytes; new 384px alternatives total 94,016, and 640px alternatives 203,042. These are asset-byte comparisons, not claims of an equivalent page-load percentage improvement: browsers select by viewport/DPR and retain the original high-density option.

The initial 120-page HTTP sweep passed metadata/status/canonical/H1 and identified only the two language versions of Draft as orphaned after restoring indexability. A contextual link from Wan's video-source discussion fixes this without adding irrelevant sitewide links. All 20 PNGs were verified against manifest SHA-256 values, with zero mismatches.

Local compiled stylesheet comparison: primary CSS decreased from 483,267 raw / 102,061 gzip bytes to 375,392 raw / 57,569 gzip bytes. The separate account-menu stylesheet remained 5,432 raw / 1,503 gzip bytes. This measures artifacts with the same gzip calculation, not network transfer across different compression settings. Remaining shared JavaScript, source-map and general contrast warnings are recorded for a separate scoped task; no generator or popup refactor was performed to chase a lab score.

## Post-release measurement plan

Early observation: 25 October (7 days). Full trend review: 15 November (28 days). Keep search type, countries, devices and comparable window lengths fixed. Record relevant query coverage, URL-level clicks/impressions/positions, query-filtered Pages/CTR, inspection canonical/crawl/index state, and image search separately. The windows and tiny initial sample must accompany conclusions. No ranking, indexing deadline or top-three promise is made. This plan does not create a scheduled automation.
