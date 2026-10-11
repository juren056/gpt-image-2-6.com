# Nano Banana 2.1 reference rebuild

Reference: https://nanobanana21.com/. Rebuilt the public frontend on 2026-10-10 using the project `clone-website` skill. The existing TanStack Start engine, account records, fal integration, credits, payments and analytics remain in place.

## Replaced frontend

- New announcement, six-link navigation, centered hero, yellow/black ambient background and external generation-mode tabs.
- Generator uses the reference's 35/65 desktop split, compact form, searchable model picker and shallow result placeholder. It stacks below 1024px.
- New alternating feature rows, cream workflow section, model comparison, capability cards, illustrated use cases, full pricing groups, FAQ, closing CTA and footer.
- Inner editorial pages use a new centered article shell and the same generator.
- Deleted 13 unused previous homepage blocks, the old content/workbench components and the unused CTA background. Cleared the remaining Qwen description in local public configuration.
- Kept the user's pixel-banana brand assets. Marketing copy, availability and checkout remain specific to this service; competitor discounts and account offers were not imported.

## Files

- `src/blocks/banana-home.tsx`: homepage composition.
- `src/components/banana-generator.tsx`: real account-aware generator, prompt persistence, model selection, reference upload, task polling and results.
- `src/components/banana-header.tsx` and `banana-footer.tsx`: public chrome.
- `src/components/banana-article.tsx`: inner page shell.
- `src/styles/banana-*.css`: scoped reference styles.
- `docs/research/replica-*.json` and `docs/research/components/banana-*.spec.md`: measured reference evidence and specifications.
- `public/images/banana21/`: seven observed reference illustrations, resized to WebP. Total 444,160 bytes; explicit dimensions and lazy loading. Provenance is recorded in `docs/research/replica-assets.json`.

## Verification

- Production build and TypeScript check passed.
- Creative Studio registry, public model/tool route coverage and auth-navigation checks passed. Removed obsolete tests requiring the deleted directory-style homepage; route and asset coverage remain checked.
- Local HTTP verification passed for 42 EN/ZH editorial pages and 10 permanent redirects, including unique metadata, one H1, canonical/hreflang, JSON-LD and sitemap.
- CUA verified desktop, tablet and mobile layouts, searchable model selection, keyboard mode switching, reference uploader, prompt restoration, navigation and theme toggle. No page-level horizontal overflow at 390px or 768px.
- Security scan found no findings. UI uses React escaping, TanStack Query and the existing API client; no new backend or database mutation surface was added.

## Operational limits

The current model/provider availability still controls generation. Unconfigured models display a pending state and do not spend credits. Checkout continues to depend on configured payment credentials. Resolution upgrades and multiple outputs are visibly unavailable until their backend/billing support is configured. No new production migration was required.

Reference illustrations are labelled as illustrations rather than output from this service. A few operational controls differ from the reference because this service uses its own backend. The pre-existing generated locale/message bundle remains large; a Lighthouse score or measured Core Web Vitals improvement is not claimed.

## Deployment

Deployed to the existing Cloudflare Worker `nanobanana21pro-com`, keeping its D1 binding. Live URL: https://nanobanana21pro.com/. Version: `9f339aef-ac4c-4289-a70c-e9e40e431438`.

Final live HTTP verification passed for all 42 EN/ZH pages and 10 redirects. CUA confirmed the new six-link header and centered hero, 430.6/799.8px generator columns at a 1440px viewport, responsive stacking at 768px and 390px, mobile navigation opening/closing, dark/light switching, searchable model menu, pricing-group switching and FAQ expansion. The hero's desktop top coordinate is 161.6px, compared with 161.9px in the reference measurement. The panel's vertical position differs by a few pixels because this service's descriptive copy is different.

Final screenshots: `.artifacts/replica/live-desktop.png`, `live-mobile.png`, `live-pricing.png` and `live-faq.png`. Build, TypeScript, source checks and security scan all passed. Generation and checkout were not exercised against paid providers; those remain in their existing pending/configuration states.
