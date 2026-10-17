# Generation-first conversion flow — 2026-10-17

The owner requested that the five-second homepage interruption stop asking for payment and instead help visitors begin a useful generation. Payment now appears only after the visitor has prepared a valid request and clicks Generate.

## Behavior

- After five visible seconds on each homepage entry, the site offers four original starting scenarios: product photography, consistent character, poster text and social creative.
- Selecting a scenario loads its prompt, mode, aspect ratio and public reference image into the existing generator. It does not generate, charge credits or open checkout.
- Visitors can dismiss the nudge or choose to write their own prompt.
- Signed-in Generate requests run a server preflight that validates the exact model, operation, references, resolution, batch count, provider readiness, account status, content policy, recent duplicate failures and server-authoritative credit price.
- Users with enough credits continue directly into the existing generation path. Users with insufficient credits see the exact cost, balance and shortfall plus the smallest one-time pack that covers the request. Other packs and monthly-plan comparison remain available.
- The exact normalized generation draft is stored in session storage before checkout. A successful payment returns to `/?generation=resume#generator`, refreshes the balance and submits the draft once. The resume query and stored intent are consumed before submission to prevent reload duplicates.
- Signed-out visitors keep the existing sign-in return and draft restoration flow. New-account starter credits remain unchanged.

## Payment return repair

Checkout redirects now use the already validated same-origin return path directly. The previous redirect targeted a missing `/auth-callback` route, which could prevent a paid user from returning to the intended generator state. Embedded and hosted Stripe checkout still pass through the payment callback that fulfills the order before redirecting.

## Review

The production build passed TypeScript, 18-locale consistency, creative request validation, content-safety checks, analytics privacy checks and dedicated recommendation/resume-intent tests. Impeccable UI detection returned no findings after the final styling pass.

CUA reviewed the real production build at the default desktop viewport and 390×844 mobile viewport. The English and Chinese five-second dialogs fit without overflow, preserve the approved black/yellow homepage, display the four original photos, and load the selected product example into the edit generator without submitting it. The purchase dialog uses the same bounded responsive dialog pattern and receives server preflight values; no real payment was made during verification.

There is no schema migration and no provider credential change.
