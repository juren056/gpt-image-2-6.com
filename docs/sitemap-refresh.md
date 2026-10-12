# Sitemap freshness — 2026-10-12

The owner's request is to update sitemap discovery for Google Search Console.
Preserve the image-focused index policy, all 113 canonical URLs, reviewed English
and Chinese locales, and the five excluded video paths. No homepage, auth,
payment, generation or moderation change is included.

The sitemap's old homepage date (2026-10-10) predates the photographic capability
content in commit 71c5909 on 2026-10-12. Pricing content was reviewed in the
2026-10-11 release (2470483). Generic public model/tool titles and the models
directory received the brand correction in 6e6d736 on 2026-10-12. A sparse,
documented date record updates those affected paths, while leaving custom
editorial metadata and unrelated dates alone. Build or request time must never
refresh every URL's lastmod. Later explicit editorial dates take precedence.

DB blog entries now retain updatedAt when merged with local articles instead of
silently substituting the publication date. Dynamic sitemap freshness is bounded
to five minutes; the deployed static sitemap explicitly revalidates instead of
inheriting asset caching. No Google ping or unrelated Indexing API is used.

Google Search Console was accessible in the existing signed-in Chrome session.
Before this update its sitemap report showed success, last read 2026-10-12,
and 113 discovered pages. The GSC Wizard connector requires an active subscription,
so submission is performed through Google's own interface.

Verification and release evidence will be recorded after deployment.

Verification: 113 live URLs returned 200, with self-canonical URLs, no redirects and no noindex. The new sitemap preserves the exact 113-URL sequence and corrects 34 lastmod dates. Local final HTML remains canonical/indexable for all entries. Freshness unit checks, TypeScript, Node/Cloudflare builds, 1,530 static pages, homepage source/built protection and security scan all passed. 5,173 prepared release files match the final build.

Release 76c1ed5a61b2 / Worker version 39665506-c148-469f-b5ef-85dba6dab9a1 was deployed to the verified Nano Banana domain, D1 and R2 identities. Live XML is byte-identical to the final build, responds with application/xml and public, max-age=0, must-revalidate. Concurrent unverified moderation changes are preserved outside this isolated release.

GSC resubmission: Google's signed-in sitemap interface confirmed 已成功提交站点地图. The report continues to show 成功 and 113 discovered pages. Submission proof is saved under .artifacts/sitemap-refresh/gsc-submitted.png. This confirms acceptance, not that every URL is indexed or will be indexed immediately.

Homepage recrawl: URL inspection confirmed the homepage is already indexed. Google then confirmed 已请求编入索引 and that the URL was added to the priority crawl queue. Proof: .artifacts/sitemap-refresh/gsc-home-recrawl.png. Repeated requests do not improve queue priority.
