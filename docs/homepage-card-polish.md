# Homepage card layout and motion — 2026-10-11

The owner requested the four-step cards, model comparison/table banner and four
creative capability cards be redesigned to match the website theme.

The palette remains banana yellow `#facc15`, ink `#171719`, warm paper `#f5f3ee`,
white `#f5f5f2` and muted neutral `#c2c2c7`. Existing system typography, titles,
copy, section order and model pricing remain. Changes are scoped to the three
requested sections in `banana-home-content.tsx` and its own stylesheet.

- Steps: left-aligned ink cards, yellow icon tiles, 01–04 sequence markers and
  connecting arrows. Desktop uses four columns, tablet two, mobile one.
- Models: a semantic comparison table with four distinct icons, yellow default
  column, full-column hover/keyboard focus feedback and 42px selection controls.
  Mobile keeps readable widths within a horizontally scrollable region. The
  comparison link uses two model tiles, balanced text and a responsive arrow.
- Capabilities: two columns on desktop/tablet, one on mobile, with a different
  small SVG diagram for text, reference editing, consistent characters and
  lettering. The graphics are decorative and hidden from assistive technology.

Motion is deliberately limited to a once-per-section reveal and short hover
feedback. IntersectionObserver disconnects after entry. Content is visible in
SSR, before hydration and without JavaScript. Reduced-motion preferences disable
animations/transitions and decorative hover transforms. No perpetual animation,
new data request, provider call or paid action is introduced. Existing model
buttons still prepare the generator; the comparison link still goes to `/vs-2`.

The hero, generator, all seven photographs (including the new character), user
case cards, pricing, administrator, payment, tools and chat remain protected.
Before files are saved under `.artifacts/homepage-card-polish/before/`. Baseline
updates must allow only the two visual files and the guard script, assert every
other protected file/copy value unchanged, and compare non-target component
functions byte-for-byte. Update the baseline only after visual review.

Verification and the published release are recorded below when complete.

## Verification

- Production build, TypeScript check and source/built homepage baseline passed.
- CUA Chrome review: steps, model table, comparison banner and capabilities;
  light and dark themes. Desktop screenshots are in
  `.artifacts/homepage-card-polish/local-*.png`.
- Responsive DOM checks at CSS widths 390, 768 and 1440: no page overflow;
  step columns 1/2/4 and capability columns 1/2/2. Mobile model table remains
  inside its own horizontal scroll region. Chrome's overridden-viewport image
  capture timed out; mobile claims are based on measured layout, not screenshots.
- Keyboard focus on Pro highlights all five table cells. Its selection button
  prepares Nano Banana Pro in the generator without creating an image.
- Revealed cards report 360ms entry animation. Reduced-motion CSS disables motion;
  that preference was reviewed in source/build, not toggled on the user's device.
- Protected file hashes, all 18 locale copy snapshots and the non-target Hero,
  Intro, UseCases, FAQ and Closing component functions remain unchanged.
- Manual security review: no data calls, sensitive values, auth changes, HTML
  injection or provider actions added; observer cleanup disconnects correctly.

## Published release

- Immutable release: `0fd3bbd443b0`.
- Cloudflare version: `dea117af-bacd-4261-8c5d-5f8a01d32c2f`.
- Only `nanobanana21pro-com` / `nanobanana21pro.com` was deployed, using its
  existing D1 database identity. No production migration or provider setting change.
- Eight public URLs returned 200, both homepage locales contain the new layouts,
  one H1 and correct canonicals, all seven image hashes match the approved source.
- CUA Chrome verified the published steps, table and capability cards. Proof:
  `.artifacts/homepage-card-polish/production-steps.png`,
  `production-models.png` and `production-capabilities.png`.
- Final worktree security scanner: 83 changed files scanned, no findings.
  No git commit was created and no paid generation or payment was submitted.
