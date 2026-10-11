# Original homepage images and generator refresh — 2026-10-11

The owner requested replacement homepage images and a generator redesign within the existing layout, then explicitly authorized strict execution. This supersedes only the image/generator portion of the earlier reference restoration.

## Scope and preserved surfaces

Seven original AI images were selected from fourteen independently generated candidates: reference composition, readable coffee poster, aspect-ratio examples, product photo, consistent character, packaging localization and social covers. They use the existing banana-yellow palette and realistic editorial photography. All are clearly labeled illustrative examples, never user history or model benchmarks. The generator offers four example cards; all seven examples can prepare a prompt from their homepage section. Editing examples prepare an original public reference image. Selecting an example does not submit a request, spend credits or change the user's account.

The existing black/yellow ambient background, navigation, system font, hero heading/description, section sequence and model comparison table remain intact. Administrator permissions, accounts, credit ledger, Stripe embedded checkout, Fal provider/model configuration, tool icon picker and Chat Studio were not rolled back. There are no database migrations or credential changes.

The generator retains two columns on desktop and stacks on mobile. The left pane is 400px where space permits, with a compact Agent shortcut, model menu, edit references, prompt, six scenario starters, visual ratio controls, supported resolution, output count, server-consistent credit quote and explicit submit. The right pane separates illustrative examples, processing, failures, finished results and actual account history. Results retain their aspect ratio and support zoom, download, batch selection, editing and variation. Mobile submission scrolls to the result. Existing draft/task recovery remains.

## Assets and reproducibility

Generation mode: built-in `image_gen.imagegen`, one call per candidate. All candidate originals and prompts are in `.artifacts/homepage-refresh/candidates/` and `image-candidates.json`. The original generator output files remain at their original paths. Selected asset prompts, dimensions, byte sizes and SHA-256 hashes are recorded in [homepage-image-provenance.json](homepage-image-provenance.json).

Selected variants: references A, coffee text A, ratios A, product B, character B, localization A, social B. The canonical assets under `public/images/banana21/` are WebP at 1280×720, approximately 36–151KB each. The original PNGs are preserved. Only deterministic resizing/WebP encoding was applied. Image URLs use `creative-refresh-20261011` to avoid stale browser images; alt text was updated to describe each actual image.

## Validation

| Dimension   | Evidence                                                                                                                                   | Result                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| Responsive  | CUA at exact 390, 768 and 1440px; one column on mobile/tablet, 400px left pane on desktop                                                  | No horizontal page overflow                                             |
| Theme       | CUA dark/light inspection, model menu and control contrast                                                                                 | Passed; corrected light model border                                    |
| SEO         | Existing canonical, H1, metadata and section copy protected; descriptive image alt text; 1530 prerendered public pages, sitemap and robots | Preserved                                                               |
| Performance | Seven 1280×720 WebP images, dimensions declared, lazy loading; public pages remain static on Workers free tier                             | Passed scoped asset review; no claim of measured Lighthouse/CWV scores  |
| Security    | Worktree deterministic scan and manual review of example selection, URLs and explicit submit                                               | No HIGH findings; no client-side secret or auto-payment/generation path |

Local mocked CUA checks exercised example selection without generation, one edit reference, 16:9 preparation, two outputs with a 16-credit quote, batch result selection, download URL, processing state, failure recovery and both themes. Mock responses are only for local UI testing, not evidence of a live Fal result. Backend creative-batch and Stripe embedded-checkout regression tests passed. The final production build and live verification are recorded below after deployment.

## Release discipline

The pre-change source/copy/images are saved under `.artifacts/homepage-refresh/before/`, including the exact previous release configuration (`release-601b8124bd6f`). Approved homepage hashes were updated only after the authorized scope and CUA visual review. Every previously protected file/copy value outside the permitted scope was compared to the previous baseline and required to match. The baseline now also protects the example registry, selection helper, revision/disclosure and guard script. Future builds/deployments must pass `scripts/verify-homepage-baseline.mjs` against both source and built files.

Builds use isolated `.artifacts/homepage-refresh/nitro` and `.artifacts/homepage-refresh/output` directories. Deploy only `nanobanana21pro-com`, `https://nanobanana21pro.com`, D1 `nanobanana21pro-db` / `342759c0-6eec-465f-a80c-717c500ab546`, through `pnpm cf:deploy` with the exact immutable release config. Do not deploy stale build directories or change other projects.

## Production verification and existing configuration limitation

The first refreshed release was published successfully. HTTP verification returned 200 for the homepage, pricing, prompts, editor, scientific figures, comparison, sitemap and robots. All seven deployed WebP hashes matched local source; the Fal model remained enabled and anonymous checkout creation was rejected.

Chrome verified one real Fal text-to-image generation from the original coffee-poster example: 1376×768 output, loaded successfully, 8 credits debited (999987 → 999979). The authenticated image download succeeded and the downloaded PNG decoded successfully. The existing administrator menu opened the real admin panel. The 25 creative-tool menu items each retained an SVG icon. Chat Studio retained its repaired layout.

The reference-image example test uncovered an existing moderation configuration failure: `openai_base_url` is not a valid URL. The safety task recorded `moderation_unavailable`, reason `Invalid URL string.`, and 0 credits charged. This request never reached Fal and is not a policy violation. The owner was asked to confirm the intended official or proxy endpoint; no credential value was printed and no safety setting was disabled or changed. Text-to-image remains functional. Image editing requires this endpoint configuration to be corrected before its live test can pass.

The live result test also exposed missing homepage-specific CSS for result actions and legacy labels describing download as “Open full-size result” and zoom as “Reference preview”. These were corrected in the generator's own stylesheet and localized copy; the final checked build/release below includes that correction.

## Final published release

- Immutable release: `648f28ed70c5`.
- Cloudflare version: `e66aecf8-251a-462d-9b5a-8b0c6160ec2a` on `nanobanana21pro-com`, custom domain `nanobanana21pro.com`.
- Final `pnpm cf:build` passed, including the source/built homepage guard and public prerendering. TypeScript and all 18 locale consistency checks passed. Creative batch and embedded checkout regression checks passed; the scoped security review found no HIGH issues.
- Post-deploy HTTP checks passed again for all eight checked public URLs and all seven image hashes. The configured Fal model stayed enabled; unauthenticated checkout stayed rejected.
- Chrome reloaded the final deployment and opened the existing successful coffee result without generating again. The result loaded at 1376×768, with the corrected Download image and View full-size labels. The three result action buttons use separate 40px controls with an 8px gap. Final local mobile verification showed no horizontal overflow, wrapped controls and scrolling to the result after submission.
- Evidence: `.artifacts/homepage-refresh/final-build.log`, `final-deploy.log`, `production-check.json`, `production-final.png`, and `final-mobile-result.png`.

The safety endpoint clarification remains pending. Image-to-image has not passed its live test; do not describe it as verified or bypass safety checks to make the test pass. No Stripe charge was made during this UI release.
