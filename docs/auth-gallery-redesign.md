# Authentication gallery redesign

The owner approved a black/yellow creative gallery for sign-in and sign-up on
2026-10-12. Desktop uses an artwork area and a single form panel; mobile uses a
compact poster banner above the form. The owner subsequently requested distinct
application scenarios instead of repeated homepage imagery. Three original
images were generated with built-in image_gen: an audio brand campaign,
architectural space concept and streetwear social campaign. Their prompts and
provenance are recorded in `docs/auth-gallery-assets.json`. They are independent
assets under `public/images/auth-gallery/`; the homepage baseline is unchanged.

## Scope

- Shared props-only shell and password controls; translated content in a block.
- Existing system font, scoped light/dark colors and yellow primary actions.
- Separate sign-in/sign-up headlines; signup credits come from public config.
- Password visibility, official Google icon, loading states and accessible errors.
- Existing OAuth, email password, OTP, invitation, captcha and callback behavior.
- Reduced-motion support and controls sized for touch and keyboard access.
- The main poster is eager/high priority; auxiliary artwork is lazy/low priority,
  so mobile's hidden artwork does not compete for network bandwidth. Entrance
  motion uses transforms while keeping the poster visible from its first paint.

## Hydration boundary

The root requests public config independently of the lazy authentication routes.
Its cache can become populated before an auth route hydrates. Both routes defer
using that cached config until their first effect, keeping the first browser
render identical to SSR. The theme-dependent icon uses the same mounted pattern.
Do not remove either boundary merely because a single warm-page test passes.

## Homepage guard

An earlier commit's formatter changed the guard bytes while leaving the reviewed
hash unchanged. This task restores the exact reviewed guard from the earlier Git
snapshot, excludes it from Prettier and preserves LF via `.gitattributes`.
`docs/homepage-baseline.json` remains unchanged.

## Verification

Evidence is saved under the ignored `.artifacts/auth-gallery/` directory. The
browser matrix covers both auth routes, English/Chinese, light/dark and
320/390/768/1440px widths. Auth API interactions are intercepted in the functional
tests so they cannot create users or send verification mail. These tests verify
UI behavior and navigation; they are not evidence of a completed real OAuth login.

The source security scan, TypeScript check, translation validation, auth navigation
tests, production build and Cloudflare build are required before deployment.
Homepage source and built-artifact guards must also pass. The release records the
actual deployed Worker version separately.

The final original-art version passed 35 browser scenarios plus 14 additional
checks: both routes, English/Chinese, both themes, four viewport widths, form
validation, password visibility, OTP navigation, invitation restrictions,
required captcha, keyboard focus and repeated config-before-hydration races.
Mobile requests only one main artwork; both hidden auxiliary images are deferred.
The 640px variant is 31,816 bytes. Higher-density screens can select the 1280px
variant (74,244 bytes), so 31KB is not a universal mobile transfer-size claim.
Desktop displays all three distinct application scenarios.
TypeScript, all 18 translation files, `pnpm build`, `pnpm cf:build`, security scan
and both source/built homepage guards passed.

## Release and production evidence

Original-art release: `48bc3607e905`; Cloudflare Worker version:
`21ec3d4c-29ee-473e-a857-c60fe0d843f2`, deployed to
`nanobanana21pro-com` / `nanobanana21pro.com`. No database migration or provider
configuration change was made.

Production returned HTTP 200 for the homepage and all 11 image files matched
their recorded SHA-256: seven protected homepage photographs plus four new auth
assets. All 17 production browser scenarios passed: auth routes at 390/1440px
in both themes and English/Chinese, including a real saved-provider Google authorization request
stopped before Google account login. No real account was created.

The final mobile Lighthouse lab run reports accessibility 100, best practices
96, performance 66, SEO 66 and CLS 0.004. Simulated LCP is 4.8s and TBT is 260ms;
this is not a passing overall performance score. Existing shared bundles and
third-party identity scripts remain outside this auth layout change. The auth
pages intentionally retain their existing indexing policy. Network lab scores
vary and are not field Core Web Vitals. Raw reports are retained in
`.artifacts/auth-gallery/lighthouse-original-art.json`.

## Follow-up completion review

The owner's completion review on 2026-10-12 identified three refinements: preserve
the poster's 16:9 composition on mobile, move its desktop scenario caption above
the overlapping cards, and replace endless loading after a failed public-config
request with a translated error and retry action. Both auth routes use the same
props-only feedback component. Retrying presents an accessible loading state,
prevents repeated actions and keeps auth forms unavailable until the configuration succeeds; raw backend error
details are never shown. The hydration boundary and all authentication checks
remain in place. No provider, credit, payment or database settings were changed.

The review also found that the existing invitation eligibility description was
still English in 15 locales. Those translations now retain the same eligibility
condition: registration and completion of the invited friend's first paid
purchase. Mobile captions use the quiet lower corner of the full poster rather
than covering its headline. German `Name` and Vietnamese `Email` are legitimate
local labels, not untranslated sentences.

The final follow-up artifact passed 79 browser checks: the original 35-case
matrix, 14 hydration/keyboard/captcha checks, 26 extended layouts (six locales,
320/1024px and 390px at 3x device pixel ratio), and four public-config outage /
retry recovery checks. Node and Cloudflare production builds passed, along with
TypeScript, all 18 message catalogs and the security review. Release
`f950eab567d1` was verified against all 4,928 built public files, including 1,530
HTML pages, and the protected homepage guard passed. An earlier incomplete
copy was rejected before deployment; only the fully verified copy is released.

Follow-up production Worker version:
`c27126fc-8535-4570-b6e9-7db6e99592c5`. Its domain and D1/R2 identities match the
approved Nano Banana deployment. The seven homepage images and all four auth
assets again passed production SHA-256 checks.

All 47 production browser checks passed: 17 live configuration / Google
authorization-destination cases, 26 extended layout checks and four intercepted
configuration outage / retry cases against the deployed JavaScript. The latter
use browser-local interception and do not interrupt the real config endpoint or
change accounts. Real account login and paid operations were not performed in
this UI review.

The follow-up Lighthouse measurements remain variable: the run alongside
functional checks reported performance 80 / LCP 3.4s, while the isolated rerun
reported performance 56 / simulated LCP 11.6s, CLS 0.004 and TBT 30ms.
Accessibility remained 100 and best practices 96. These are lab measurements,
not field Core Web Vitals, and do not establish that the shared-script loading
bottleneck is solved. The installed Paraglide compiler explicitly warns that its
experimental middleware locale-splitting flag is unsuitable for production
client-side routing; it was not enabled to improve a benchmark at the cost of
breaking client-only forms and navigation. The final isolated report is
`.artifacts/auth-gallery/lighthouse-review-isolated.json`.
