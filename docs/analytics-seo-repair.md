# Analytics and image search repair

Scope authorized by the owner on 2026-10-12: strictly verify GA4, correct search
discovery around the site's image product, test and deploy. Homepage composition,
photographs, styles, auth, administrator access, payments, credits and generation
implementations remain unchanged. The existing homepage baseline is not updated.

## Findings and repair

The live public configuration returned `G-3W5C23WYR3`. The Google loader returned
HTTP 200, but `window.gtag` was undefined after hydration and no collect request
was observed. The React component rendered an inline initialization script only
after asynchronous public config arrived. Browser-inserted inline script text was
inert. Initialization now runs in a React effect before asynchronously loading
gtag.js. The measurement ID is validated, and initialization is deduplicated on
remount. There is no DB/env credential change, inline script interpolation or
manual page-view implementation that could double-count enhanced measurement.

The sitemap advertised five video pages, including Wan and MiniMax. Their titles
and content specifically targeted video models, matching the screenshot's video
queries. This supports topic dilution as a contributing factor, not proof of a
Google penalty or a complete explanation of rankings. The screenshot's 24-hour
sample is extremely small. The GSC Wizard connector refused reads because its
subscription had expired. Direct signed-in Search Console inspection of the same
domain with the 28-day filter was subsequently possible: the current report
showed zero clicks, one impression and `/seedance-2-5` as its sole landing page.
The query table had no rows, so the screenshot's Wan query-to-page pairing cannot
be confirmed from this current report. The available sample is too small for
ranking conclusions.

The five legacy video paths now have `noindex, follow`, retain their page content
and function, and are omitted from sitemap and hreflang. Their URLs are not
redirected to an unrelated homepage and remain crawlable. Image model/tool
metadata uses the configured app brand instead of the generic AI Image Studio.
Existing unique page content, canonicals and reviewed-language indexing remain.
Keyword ownership and an honest follow-up measurement plan are recorded in
`docs/seo-keyword-map.md`.

## Verification and release

- `pnpm build` and isolated `pnpm cf:build` both completed successfully. The latter
  generated 1530 public HTML pages, sitemap and robots. The source, built and
  prepared-release homepage baseline checks all passed without changing it.
- TypeScript, locale validation, analytics initialization/privacy, auth navigation,
  public creative pages, keyword generators, model catalog, credit ledger and Fal
  webhook checks passed. Worktree security scan and manual diff review were clean.
- Actual application browser navigation tested delayed public config, one loader,
  one initial page view and exactly three page views for home → pricing → back.
  The real Google endpoint returned HTTP 204 for all page views and `pricing_view`.
  Both local final Node build and production passed; no JavaScript errors occurred.
  Google's queue uses native `arguments` objects, rather than ordinary arrays.
- Both themes on nine public page families and homepage widths 390/768/1440px
  passed without horizontal overflow. Live original homepage images all loaded.
  A single unthrottled desktop synthetic sample recorded LCP 1400ms and CLS 0;
  this is a diagnostic sample, not field Core Web Vitals or a Lighthouse score.
- Live sitemap audit passed all 113 indexable URLs: HTTP status, unique title and
  description, single H1, canonical and internal discovery. All 90 legacy video
  HTML pages across 18 locale URL prefixes returned HTTP 200 with noindex, no
  hreflang and the existing reviewed-language canonical policy.
- Immutable release `2c8628920266`: all 5166 newly built public/server files matched
  the prepared release. Older hashed assets are retained only for open browser
  sessions; new entry points use this build's chunks.
- Deployed on 2026-10-12 to `nanobanana21pro-com`, domain
  `nanobanana21pro.com`, D1 `nanobanana21pro-db` and the existing upload bucket.
  Worker version: `76dd5f35-ce2b-46e6-bcef-5b90fd13b978`.
- Signed-in GA4 property `558313491`, stream `16097672578`, ID `G-3W5C23WYR3`
  was checked directly: enhanced measurement and history navigation collection
  were enabled. After visiting the live homepage and pricing in ordinary Chrome,
  its realtime report displayed one active user, both page titles, `page_view`,
  `first_visit`, `session_start` and `pricing_view`.
- Search Console confirmed successful resubmission of the live sitemap on
  2026-10-12. Its previously discovered URL count still reflects the old read;
  index changes take effect after Google revisits the pages, not at deployment.

Evidence logs and sanitized request reports are in the ignored
`.artifacts/analytics-seo/` directory. No payment or paid generation was started
as part of this analytics/SEO release.

## Google login question investigated during this release

The owner's existing sign-in tab had `error=account_not_linked`. A read-only D1
check confirmed the displayed email's existing account had one credential login,
zero Google links and `emailVerified = false`. Better Auth's current version
defaults `accountLinking.requireLocalEmailVerified` to true. The public config
also showed email verification and email OTP disabled. This explains the blocked
implicit linking; it is not evidence of a broken Google client secret. The UI
currently collapses OAuth errors into a generic message. No verification flag,
provider trust rule, account association or authentication source was changed.
Password sign-in is the current existing path; safe future linking needs a
verified local email or explicit linking from an authenticated password session.

Primary references:

- [Google: SPA measurement](https://developers.google.com/analytics/devguides/collection/ga4/single-page-applications)
- [Google: automatic versus manual page views](https://developers.google.com/analytics/devguides/collection/ga4/views)
- [Google: noindex must remain crawlable](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
