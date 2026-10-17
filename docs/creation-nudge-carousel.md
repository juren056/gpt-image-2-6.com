# Creation nudge carousel — 2026-10-17

The owner requested that the five-second homepage creation nudge return to its
previous compact, single-column composition and rotate through the prompt
library imagery used by the homepage showcase.

## Behavior

- The pricing preview sidebar was removed from the nudge. Pricing remains on the
  homepage and in the final Generate purchase flow.
- The dialog opens after five visible seconds on every homepage entry and keeps
  the original heading, explanation, primary action and write-your-own-prompt
  action.
- Four cards are visible on desktop and two on narrow screens. The original four
  homepage scenarios appear first, followed by the 1,488 prompt-library images.
- The cards advance one position from right to left. Hovering or focusing a card
  pauses movement; reduced-motion users receive a static set of cards.
- Selecting an original scenario prepares its reviewed prompt and settings.
  Selecting a library image retrieves the full prompt only on demand and then
  prepares the generator. Neither action submits a generation or starts payment.
- Only seven cards are mounted at once, so the 1,492-image rotation does not create
  a large DOM or preload the full prompt catalog.

The subsequent owner-authorized visual-impact update centers a larger active
card, increases the dialog rail size and adds the same two-level left/right edge
acceleration used by the homepage carousel. The full catalog is still never
rendered or fetched as prompt bodies up front.
See [Carousel visual impact and edge acceleration](carousel-impact-and-edge-speed.md).

## Preserved flow

The server-authoritative generation preflight, credit check, purchase dialog,
exact-draft checkout return and one-shot resume remain unchanged. There is no
database migration or provider configuration change.
