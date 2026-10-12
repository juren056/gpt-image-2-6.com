# Photographic capability cards — 2026-10-12

The owner explicitly approved replacing the four capability line drawings with
original finished artwork, then requested strict execution of that plan.
The change is limited to the capabilities section. Its heading and four existing
descriptions, section order, hero, generator, steps, model table, seven previous
homepage photographs, pricing, administrator access, payments, Fal, tools and
Chat Studio remain preserved.

## Design and behavior

The four new examples are a yellow running-shoe campaign, an ivory serum bottle
shown on a plain background and golden satin, one fictional adult male photographer
in three scenes, and a black/yellow FRESH IDEAS event poster. Main line art has
been removed. Desktop cards divide copy/artwork 40/60; narrower cards put the
complete 3:2 artwork above the copy. Artwork uses contain sizing so faces and
poster text remain visible. The dark/yellow palette, system font and light theme
are retained. Labels distinguish original illustrative artwork and the paired
before/after panels; these are not Fal benchmarks or user generation history.

Each 44px example action prepares the existing generator with Nano Banana 2.1,
3:2, the appropriate scene, prompt and generate/edit mode. Editing uses the
source-only bottle photograph or the first character panel, never the edited
result or complete comparison as its reference. Selecting an example does not
submit generation, create checkout or spend credits. The user must explicitly
submit the existing generator. Generated outcomes still require review.

Hover feedback is a 3px lift, yellow edge and 1.025 image scale on mouse devices.
Keyboard focus highlights the card and button. There is no automatic card entry
animation or perpetual motion. Reduced-motion preferences disable transitions
and transforms. Image dimensions and lazy loading are declared.

## Artwork provenance

Built-in image_gen generated four independent originals. Prompts are recorded in
[capability-gallery-prompts.json](capability-gallery-prompts.json). Final WebP
assets are in `public/images/capabilities/`; two source-only crops support the
editing interactions. A manifest records original and final hashes. The previous
homepage and account images were not reused or replaced.

## Review and release

Local review passed 21 browser cases: English/Chinese, light/dark, widths 320,
390, 768, 1024 and 1440, plus normal-motion hover and keyboard activation.
Every layout exercised all four example actions, verified generator prompt,
model/mode/ratio/reference payloads, focus transfer, 44px controls, complete 3:2
artwork, image loading, no horizontal overflow and no paid POST request. Final
CSS review also verifies captions sit below images. Initial screenshots found
the example badge could obscure a mobile poster/face; it was moved below the
artwork and rechecked. Full-section offscreen screenshot capture can omit a
decoded lazy image, so individual in-viewport card screenshots were also captured.

The initial Node production build and TypeScript checks passed. Final CSS was
reviewed on that artifact with the source stylesheet injected before the
Cloudflare build. Local runtime-config/session/model endpoints were mocked for
UI isolation; this is not evidence of a paid Fal task or payment. The final
Cloudflare release must be tested without this CSS override or API mocks.

Before updating the protected baseline, all 26 other protected files, all
existing locale copy and eight non-target component functions were compared and
required to remain unchanged. Only the reviewed component/block/styles/guard
scope, new registry, new copy and six assets were added to the baseline. Future
source and built release guards reject line art, stale artwork and missing
example actions. All 18 locale catalogs have matching keys; the six new image
descriptions/labels are localized. All six WebP files are under 84 KB each.

## Final artifact review

`pnpm cf:build` passed including all 1530 prerendered pages and source/built
homepage guards. The final Cloudflare artifact passed 31 browser cases without
the source CSS override: the 21 core cases, six Arabic/German/Japanese layouts
(including 390px at DPR 3), two JavaScript-disabled pages, and two preserved
homepage reviews at 390/1440. The latter reviewed the hero, all three feature
rows, four guidance steps, model highlighting and four existing case cards.
Source-only references were decoded successfully inside the real generator,
and selected mode and 3:2 radio states were asserted. Local provider/config
responses remained mocked; paid operations were not submitted.

The immutable release `194a7b20c87b` was prepared only after static prerendering
finished. All 4934 public build files, including 1530 HTML files, matched its
prepared release by SHA-256. Worker `nanobanana21pro-com`, domain
`nanobanana21pro.com`, D1 `nanobanana21pro-db` /
`342759c0-6eec-465f-a80c-717c500ab546`, and the production image R2 binding
were verified. The final security scan and manual review found no findings;
no backend, auth, payment, credit or provider configuration was modified.

The scoped launch review covered responsive layouts and both themes, preserved
SEO headings/copy plus descriptive localized alt text, lazy image loading with
declared dimensions (251024 bytes for the four display assets, source crops only
on selection), and deterministic/manual security review. No new package, font,
third-party runtime request, server-only component import, HTML injection or
automatic billing path was added. This is a scoped asset/performance review,
not a new whole-site Lighthouse score or audit of unchanged backend behavior.

## Published release

- Cloudflare version `e2c7cf3f-87c7-4fa8-bd4e-978c7609f195` published successfully
  from the checked immutable release. No production migration was needed.
- All 17 deployed image hashes matched source: six new capability assets, seven
  protected homepage photographs and four unchanged account gallery assets.
- Ten public/navigation URLs returned 200 after normal redirects, including
  both homepages, pricing, prompts, tools, settings/login/register, robots and
  sitemap. Settings verification follows its normal anonymous sign-in redirect;
  it is not a test of authenticated administrator access.
- All four prepared selections passed the existing server request validator and
  provider payload builder: 3:2, 1K, one output, 8 credits, correct generate/edit
  endpoint and source-only HTTPS reference. This validation issued no provider
  request. Both deployed reference assets were also accessible to a normal Node
  fetch without a browser session, with HTTP 200 and `image/webp`.
- The final live deployment passed 31 browser cases with its actual configuration,
  no API mocks and no stylesheet override: 21 core interaction/keyboard/hover
  cases, eight extra locale/JavaScript-disabled cases and two preserved homepage
  reviews. All four example actions prepared the real generator fields, selected
  mode and ratio, and decoded the correct source reference where applicable.
  No paid POST request or page JavaScript error was observed. The initial live
  sweep waited for all lazy images after jumping between sections; it was fixed
  to scroll each image into view and decode it, then the entire core matrix was
  rerun successfully. No product-code change was needed for that test issue.
- Final evidence is under `.artifacts/capability-gallery/`: `review-live.log`,
  `live-results.json`, `extra-live-results.json`, `preserved-live-results.json`,
  `live-assets-results.json`, `production-capabilities-desktop.png` and
  `production-card-mobile.png`. Local final Cloudflare checks and release hashes
  are in `review-cf.log`, `extra-cf.log`, `release-integrity.log` and build logs.

Both local source and the published release use the same reviewed card design.
The baseline and AGENTS instructions now protect this scope against stale line
drawings, incorrect source references or future unrelated homepage rollbacks.
