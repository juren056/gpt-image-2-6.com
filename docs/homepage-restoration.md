# Homepage restoration boundary

Recorded on 2026-10-11 from the restored source and isolated public artifact. This document applies to the homepage restoration only. Deployment evidence is recorded separately after the release is verified.

The owner's subsequent explicit font, generator and table reference request is
documented in [Generator and typography reference restoration](generator-reference-restoration.md).
That scoped extension preserves the photo composition and the application fixes
described here; its validation and release evidence are recorded separately.

## Overview

The owner's current instruction is to restore the requested `nanobanana21.com` homepage effect in both local source and production, while retaining the repaired administrator access, payments, Fal generation, tool icon picker and Chat Studio. Restore the approved composition rather than rolling back the entire application.

The homepage uses a dark background, a gold wash behind the hero, yellow primary actions and photographic examples. Its sequence is header, centered hero, embedded generator, yellow introduction, three alternating feature rows, four-step guidance, model comparison, capabilities, use cases, pricing, FAQ and a closing action. The three feature rows show the woman with a dog, the yellow MORNING BLEND poster and framed coastal prints. The four case images show a product scene, a consistent character, localized packaging and a smoothie bowl.

Ground truth for this boundary is `src/blocks/banana-home.tsx`, `src/blocks/banana-features.tsx`, `src/components/banana-home-content.tsx`, `src/components/banana-features.tsx` and their homepage styles. The source and image hashes and selected locale copy are recorded in `docs/homepage-baseline.json`.

## Colors

The homepage's incumbent dark palette comes from `src/styles/banana-replica.css`: background `#0a0a0a`, foreground `#f8f8f8`, primary `#facc15`, primary text `#171717`, and neutral card/border values expressed in OKLCH. The hero uses translucent yellow gradients over a dark neutral wash. The introduction has a yellow field; the step section has a warm pale field. Existing light-theme overrides remain available.

These are observations of this surface, not a new global palette or authorization to recolor account, payment or tool pages.

## Typography

The homepage inherits the current `--font-ui` stack through `--font-body`; it does not introduce a separate display face. Hero text is 44px/1.05 at desktop, section headings 48px/1.05 and feature titles 30px/34.5px, at weight 600. Feature body copy is 16px/26px; its image caption is 12px/18px. At the narrowest breakpoint, the hero becomes 26px/1.25, section headings 30px and feature titles 24px/29px.

This restoration preserves the current shared typography. It does not approve unrelated global design changes merely because they coexist in the checkout.

## Layout

The desktop content container is capped at 1280px with 24px horizontal padding. Feature rows use two equal columns separated by 64px, with 96px between rows. From 1024px upward, even rows place the image on the left and copy on the right. Below 1024px, each row stacks copy and image in one column with a 40px gap. Below 640px, container padding becomes 20px. Feature images fill a 16:9 frame using `object-fit: cover`.

The embedded generator stays near the beginning of the page. Feature calls to action prepare its current prompt, edit mode or shape focus; they do not force the Pro model. The default highlighted comparison column is Nano Banana 2.1.

## Elevation & Depth

The hero's wash provides atmosphere; cards and image frames use neutral tonal layering and thin borders. This restoration retains the incumbent depth treatment and does not create a new shadow vocabulary.

## Shapes

Primary homepage buttons use a 7px radius, feature image frames 12px, and icon containers 7px. Feature photos and case images remain WebP files under `public/images/banana21/`. Captions describe examples without claiming benchmark results. Alternative text describes the restored images rather than the rejected workflow diagrams.

## Components

The hero leads directly to the embedded generator. The three feature rows pair an icon, title, explanatory copy and a yellow action with an example image. Model selection, prompt preparation, account navigation and pricing continue to use current application behavior. The restoration changes homepage imagery and copy without replacing business modules or protected application pages.

## Do's and Don'ts

- Do retain this approved homepage composition and its seven photographic examples unless the owner explicitly requests a homepage change.
- Do visually review the desktop hero, all three feature rows and mobile stacking before releasing a homepage change.
- Do preserve current administrator permissions and entry points, Stripe checkout, credit accounting, Fal integration, the tool icon menu and Chat Studio when changing marketing content.
- Do verify source, selected locale copy and image hashes with `scripts/verify-homepage-baseline.mjs` before building.
- Do validate the generated homepage with `--built`; this checks its approved image paths, heading, absence of rejected SVG references and actual image-file hashes. With a prepared release, validate its own asset directory using `--public-dir`, not only the build directory.
- Do use independent `NITRO_BUILD_DIR` and `NITRO_OUTPUT_DIR` paths when concurrent tasks build the same checkout. This release uses `.artifacts/home-restore/nitro` and `.artifacts/home-restore/output`.
- Do deploy only Worker `nanobanana21pro-com`, domain `nanobanana21pro.com`, and D1 `nanobanana21pro-db` (`342759c0-6eec-465f-a80c-717c500ab546`). The prepared release identity must match the generated build identity.
- Don't silently refresh `docs/homepage-baseline.json` to make a failed gate pass. Updating it requires an explicit homepage request and visual review.
- Don't restore only an older production Worker while leaving rejected homepage source locally; a later build would bring the rejected changes back.
- Don't roll back the entire Worker or checkout to recover homepage appearance, since that could discard repaired account, payment, generation and workspace behavior.
- Don't treat retained older browser assets as authorization to reintroduce their old homepage composition.

### Recorded validation boundary

The isolated public artifact and desktop/mobile screenshots demonstrate the restored composition. They do not prove a paid checkout, webhook credit grant or Fal generation succeeded. Those claims require their own production evidence. Local screenshots are `.artifacts/studio-redesign/home-restored-desktop.png`, `home-restored-features.png` and `home-restored-mobile.png`; the final release review includes the corrected alt text and consistent restored feature/case copy.

### Global drift left untouched

`DESIGN.md` still describes a task-selector homepage without yellow haze and with vector workflow illustrations. That description conflicts with this explicitly requested homepage restoration. It was not refreshed or canonized in this scoped task. `.impeccable/design.json` is also preserved. Existing section kickers are an incumbent detail, not a newly prescribed reusable rule.

### Production release evidence

The restored release was deployed and checked on 2026-10-11. Prepared release
`13d54c2f9748` uses Cloudflare version `0387a653-2587-4c6b-b05b-a6cdaacb23dd` on
`https://nanobanana21pro.com`. The deployment reported Worker
`nanobanana21pro-com` and binding `nanobanana21pro-db`; no migration or provider
credential update was made in this restoration.

Validation completed:

- `pnpm cf:build` passed with 1530 static public pages; the prepared release's
  own HTML and seven image hashes passed the homepage gate.
- `pnpm exec tsc --noEmit` passed with a 6144 MB Node heap. The first default-heap
  attempt exhausted memory; this was a tooling resource limit, not a type error.
- All 18 locale files passed key/placeholder validation. The final worktree
  security scan found no findings, and the scoped diff whitespace check passed.
- The deliberately supplied old release was rejected for missing the approved
  photograph, confirming that the prevention check fails closed.
- Desktop, mobile and tablet views were checked; all seven restored images loaded
  and the narrow views did not horizontally overflow. The finish reviewer scored
  the corrected image-description finding resolved and returned `ship` for it.
- `/`, `/prompts`, the 1488-item prompt catalog, `/robots.txt` and `/sitemap.xml`
  returned HTTP 200. All seven production photographs matched local hashes and
  the restored heading and alternative text were present in production HTML.
- In the authenticated Chrome session, the administrator menu entered `/admin`
  and loaded the system overview. Chat Studio retained its prompt composer and
  six prompt starters. The tool menu retained 25 entries with icons and switched
  to the background-removal workspace. Starter pricing entered the two-column
  checkout confirmation page at $8.99, with its existing recurring billing terms.
- The public model API and homepage generator still reported Nano Banana 2.1
  configured/enabled and an 8-credit quote. Existing generation history remained
  visible. This verification did not submit a new paid generation, payment,
  subscription or webhook test.

Evidence is under `.artifacts/studio-redesign/`: `build-home-verified.log`,
`typecheck-home-final.log`, `deploy-home-restore.log`,
`home-restoration-production-check.json`, `home-restoration-verdict.md`,
`home-restored-production.png`, `restored-preserved-admin.png`,
`restored-preserved-chat.png`, `restored-preserved-tool-menu.png` and
`restored-preserved-checkout.png`.
