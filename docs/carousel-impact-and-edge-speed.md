# Carousel visual impact and edge acceleration — 2026-10-17

The owner authorized a larger, more visually prominent homepage prompt carousel
and the same treatment in the five-second creation nudge. Both carousels now use
one motion controller so autoplay, hover, edge acceleration, touch gestures and
reduced-motion behavior remain consistent.

## Interaction

- The homepage uses a taller viewport, larger cards and images, stronger center
  scale, depth, yellow focus treatment and dimmer supporting cards.
- The creation nudge is wider on desktop and centers a larger active card inside
  a taller image rail. Its original heading, generator handoff and blank-prompt
  action remain unchanged.
- The inner edge band advances in the corresponding direction at a faster rate;
  the outermost band accelerates again. A yellow gradient and double chevron
  provide visual feedback without intercepting clicks.
- Hovering or focusing a card outside the edge bands pauses movement and enlarges
  that card. Manual pause on the homepage overrides edge acceleration.
- Keyboard users can move with Left and Right; Space toggles the homepage pause.
  Touch users can swipe horizontally while vertical page scrolling remains
  available.
- Reduced-motion users receive no autoplay or edge acceleration; manual controls
  remain immediate.

Only the nearby carousel window is mounted. Broken images are skipped. Opening
the detail dialog pauses the homepage rail, and preparing a prompt pauses the
creation nudge. Edge activation is measured once per direction and surface.

## Preserved boundaries

Prompt inventory quantities remain hidden. Selecting an image prepares the
generator but does not submit generation, deduct credits or start checkout. The
server preflight, pricing, payment return and exact-draft generation resume are
unchanged. No database migration or provider configuration is involved.

## Verification

Review desktop, tablet and mobile widths for visual scale and overflow. Automated
browser checks cover normal autoplay, both acceleration levels and directions,
hover pause, manual pause, keyboard movement, touch swipe, the five-second dialog
and reduced-motion behavior. Production checks also confirm the prompt counts
remain absent and the generator handoff stays generation-free.

The isolated production build measured a 440px homepage viewport with a 347px
active card and a 304px nudge rail inside a 1152px dialog. In equal sampling
windows the normal, inner-edge and outer-edge modes produced 2, 4 and 5 visible
card changes respectively. Both edge directions, hover pause, manual pause,
reduced-motion static behavior and touch swipe passed. Selecting a nudge card
closed the dialog and prepared the generator without a generation or payment
POST.
