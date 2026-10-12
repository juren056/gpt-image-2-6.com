# Google login recovery — 2026-10-12

## Root cause

The interrupted task had identified the owner's `account_not_linked` callback,
but had not implemented recovery. A read-only production check found an existing
password account with an unverified local email and no Google association. Email
verification and email OTP are disabled in current runtime configuration. Better
Auth 1.6 therefore refuses implicit linking under its default requirement for a
verified local email. This callback does not establish that the Google client
secret is invalid.

## Implemented recovery

The sign-in page explains this specific failure and offers a password sign-in
destination leading to Profile. After signing in, the user explicitly chooses
Connect Google. Better Auth's authenticated `link-social` flow handles consent,
OAuth state and PKCE, verified Google email, matching email, and conflicting
associations. A successful link enables Google sign-in to the original account.
The original internal destination is preserved for Continue creating.

The new read-only `/api/user/login-methods` endpoint requires a session and only
returns distinct provider names for that session's account, with private/no-store
caching. The UI obtains connection state from this endpoint, never from URL flags.
It handles loading, retry, pending submission, mismatched email, conflicts and
generic failures. OAuth error codes are mapped to local messages; arbitrary
provider text is not rendered.

Production auth policy is unchanged: no trusted provider override, no disabling
`requireLocalEmailVerified`, no manual email-verification flag, and no direct
database account association. There are no schema migrations, provider credential
updates or changes to payment, credits, generation, homepage or tool menus.

## Verification scope

`pnpm exec tsx scripts/verify-google-account-linking.ts` exercises the installed
Better Auth handler with isolated in-memory users and Google response fixtures.
It verifies rejection of unauthenticated linking, blocked implicit linking for
the original unverified password user, successful explicit same-email linking,
subsequent Google login to that same user, mismatched emails, unverified Google
email and a Google association already owned by a different user. The local email
verification flag stays false. Test fixtures do not make external requests or
modify production users.

`pnpm test:auth-navigation` covers safe internal callbacks, nested recovery
destinations, hash retention and error classifications. New messages exist in all
18 catalogs; English, Simplified Chinese and Traditional Chinese have localized
copy, with English fallback for the other catalogs.

Browser checks use the actual built application, with browser-local session and
API fixtures to test the signed-in UI without borrowing a personal session.
These checks are not a substitute for a user's real Google consent. The owner
must sign in with the existing password and choose the same-email Google account
once to establish the real association; no personal password is requested in chat.

## Completed release verification

- `pnpm build`, `pnpm cf:build`, TypeScript, auth navigation, isolated Google
  linking integration and all 18 locale catalogs passed. Cloudflare generated
  1,530 static pages, sitemap and robots. Both builds used separate Nitro paths.
- Source, built and immutable-release homepage baseline checks passed without
  modifying the baseline. All 5,169 new public/server files were byte-compared
  against the final Cloudflare build. Existing hashed browser assets were retained
  for open tabs; new entry points use the new build.
- Local and deployed application browser tests each passed 12 recovery cases,
  including 390/768/1440 widths, light/dark themes, pending submission, retry,
  connected-state refresh, safe errors and OAuth redirect. Signed-in tests used
  browser-local session/API fixtures. Chinese recovery text and localized callback
  URLs also passed against the deployed application. No personal consent was used.
- Actual live anonymous requests returned HTTP 401 for login-methods and
  `link-social`. Real Google OAuth start returned HTTP 200 with the production
  callback, state and PKCE. Its consent was not completed.
- Actual live GA4 navigation generated exactly three page views and a pricing
  event, all HTTP 204, one loader and no JavaScript errors. All 113 sitemap URLs
  and 90 excluded legacy video HTML pages passed again. Original homepage images
  loaded. A single unthrottled sample recorded LCP 2,960ms and CLS 0.000516; this
  is a diagnostic sample, not field Core Web Vitals or a Lighthouse score.
- Deterministic security scan and manual review passed. Auth-policy, payment,
  credits and generation server files are unchanged by this release.

Deployed immutable release: `66bbab8246eb`. Worker version:
`b3501708-c3f3-4062-a9dd-3a55f2e5eea3`. The successful deployment was confirmed on
2026-10-12 at 16:36 Asia/Shanghai. Target: `nanobanana21pro-com`, domain
`nanobanana21pro.com`, existing D1 `nanobanana21pro-db` and upload bucket. There
were no migrations or credential changes. Sanitized verification reports and
screenshots remain in ignored `.artifacts/google-link/`.
