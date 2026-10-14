# First-experience and public-evidence repair

Owner authorized strict execution of the screenshot plan on 2026-10-13. Local implementation and verification completed on 2026-10-14. Production release 8d0656b4cbbe was deployed on 2026-10-14; Worker version 9301784e-e31e-41c5-b8a4-29084784b970.

## Resulting behavior

- Public prompt links carry a whitelisted recipe ID. Explicit selection wins over a saved draft or an old running task. Prompt, model, mode, ratio, resolution, output count and public references move together. The previous non-empty draft is recoverable; selection never submits or retries a request. Pending selection survives a mocked login return and reload. Only an accepted matching request clears it; delayed responses cannot overwrite a newer selection.
- Fresh free briefs use 2.1, 1K and one output. Existing drafts can be continued or replaced explicitly. Signup estimates read public configuration: 20 credits at 8 per image means two requests and four remaining credits. Eligibility, expiry, retry costs and refund boundaries are disclosed.
- Four original website outputs are beside the homepage generator, with original PNG links, model, settings, costs and dates. The approved seven original homepage photographs, hero, fonts, section order and comparison table remain intact.
- The Chinese prompt page has four original outputs (NB-05–08), complete prompts, parameters and text limitations. It has localized metadata, en/zh alternates and a sitemap entry. Other untranslated category pages retain their existing indexing restrictions.
- Contact pages and the footer expose support@nanobanana21pro.com without requiring login. The owner will provision the mailbox later; receiving mail is not verified.
- Optional referral and pending-plan storage cannot crash the homepage. Failure to remove a stored referral code does not retry an already successful claim.

## Verification and limits

| Dimension        | Evidence                                                                                                                                                                                                                                    | Result                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Functional       | Generator-entry, copy-accessor, resolution, batch, product-facts and analytics privacy regressions                                                                                                                                          | Passed                                                                                                              |
| Browser          | 17 local checks: stale English draft, Chinese tea link, restore, free defaults, active-task safety, denied storage, mocked login return, captured submit payload private analytics fields, two-reference edits and rejected-submit recovery | Passed; zero provider calls                                                                                         |
| Responsive/theme | 390/768/1440px on home, Chinese prompts and free page; desktop light/dark                                                                                                                                                                   | No horizontal overflow; screenshots under .artifacts/acquisition-repair                                             |
| SEO              | Eight server-rendered pages: HTTP 200, one H1, descriptions, canonical, language; Chinese hreflang and sitemap lastmod; private-route robots exclusions                                                                                     | Passed                                                                                                              |
| Payments         | Hosted/embedded Stripe callback and subscription metadata regression                                                                                                                                                                        | Passed at mocked provider boundary; no real purchase                                                                |
| Security         | Deterministic worktree scan and manual review of URLs, draft priority, references, model/count validation, analytics privacy and storage recovery                                                                                           | No findings in worktree/staged scans and manual review                                                              |
| Performance      | Explicit image dimensions, WebP previews, lazy loading and public SSR                                                                                                                                                                       | Scoped asset review only; no Lighthouse/CWV claim. Existing large messages chunk remains about 6.64MB / 1.92MB gzip |

The original NB-01–NB-20 results and hashes remain unchanged. They are operator tests, not independent reviews. Real auth/payment end-to-end testing was not repeated for this UI repair. Local intercepted responses are not evidence of a new live Fal generation.

## Outstanding evidence

The repeated-model test pack in repeated-model-test-plan.md needs fresh budget authorization (nine calls, 87 currently quoted site credits, cap 100, no automatic retries). The previous 20-call authorization was used. Independent reviewers must provide their own observations with permission; no outreach or invented reviews were performed. A browser/curl test with a bot User-Agent is not proof of access from verified OpenAI/Google crawler IPs. Search inclusion and ChatGPT recommendations are not guaranteed.

## Release boundary

Only nanobanana21pro-com / nanobanana21pro.com, D1 nanobanana21pro-db (342759c0-6eec-465f-a80c-717c500ab546), and R2 nanobanana21pro-uploads may be deployed. Use the source and built homepage guards. Update only the four changed protected hashes after visual review; every other protected hash/copy value must match. No database migration, credentials change or paid request is part of this release.

## Production verification

Native Chromium verified eight live server-rendered pages, canonical/locale metadata, the 116-URL sitemap and private-route robots exclusions. The Chinese tea link loads 2.1, 3:4, 2K and one output. Keyboard resolution changes display 12/28/8 credits. No page errors, unexpected API writes or new provider calls occurred. Generic Python HTTP traffic received Cloudflare 403; this does not establish whether verified search-crawler IPs can access the site.
