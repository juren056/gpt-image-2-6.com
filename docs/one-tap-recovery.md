# One Tap recovery and new-user verification — 2026-10-12

## Scope

One Tap previously ignored authentication callback errors and rendered nothing.
An existing password user could select Google and stay signed out without an
explanation. The owner authorized failure messages, password-to-Google recovery
and new-user registration verification. The owner has no unused Google test
account and explicitly chose isolated testing with that limitation disclosed.
The existing personal Google association remains untouched.

## Behavior

The integration supplies an error hook to Better Auth's actual One Tap callback.
It displays allowlisted local messages for account not linked, invalid credential,
disabled registration, service/network failure and generic failure. Raw provider
text and tokens are never displayed or logged. Dismissing a prompt is not an
authentication failure; an AbortError does not show a banner. The banner can be
dismissed and disappears for a signed-in user.

Old password users receive a password sign-in link leading to Profile's explicit
Google association. The original safe internal destination, query and fragment
are preserved. Successful One Tap returns to that destination via an absolute
same-origin callback, avoiding Better Auth's relative-fragment origin rejection.
A successful callback also refetches the shared session with the cookie cache bypassed. The per-call One Tap client has a separate store; returning to the same page fragment does not reload that store. Browser verification exposed this stale-header case and required an explicit shared-session refresh.

No account trust rules, verification flags, user associations or database schema
are changed. The integration remains mounted through its compatibility component;
translation and runtime configuration now live in a block.

## Test methodology

`scripts/verify-one-tap.ts` runs the installed server plugin with in-memory users,
an ephemeral RSA-signed JWT and a test-only mocked Google JWKS endpoint. Signature,
issuer, audience, expiry and cookie verification use the real installed code. It
checks old-password-account rejection, fresh Google registration, session-cookie
creation and repeated session reads, returning-user identity, wrong audience and
invalid token. Test keys are ephemeral and never used in production.

`scripts/verify-google-account-linking.ts` additionally verifies fresh Google
OAuth registration and subsequent login to the same user without duplication.
The OAuth provider response is an isolated fixture. Neither script sends requests
to Google or creates production users. They cannot establish real Google consent,
production database user creation or production signup credit granting.

Browser tests exercise the actual build with a browser-local Google SDK and API
fixtures: callback failures, translated text, recovery target, cancellation,
successful reload/session display and no second prompt for an authenticated user.
This proves application behavior, not genuine Google-issued credentials.

## Release and evidence

- Deployed release `4c12b8f73046` to `https://nanobanana21pro.com`.
- Cloudflare Worker version `210f4859-d02f-4a3a-b95a-6e1bf4b1b71d`.
- Final `pnpm build`, `pnpm cf:build`, typecheck, locale validation and auth-navigation tests passed. All 1,530 static pages were generated.
- All 5,169 prepared public/server files match the final Cloudflare build byte for byte. Source and built homepage baselines passed; 90 excluded HTML pages retain noindex and the sitemap has 113 URLs.
- The One Tap and OAuth isolated integration scripts passed. Local and production browser builds each passed 11 fixture scenarios: English/Chinese mobile failures, cancellation, success and persisted session after refresh, plus desktop light-theme recovery. The same-anchor success scenario failed before shared-session refresh and passed after it.
- Actual production OAuth start returns 200 with the correct Google callback, state and PKCE. Anonymous login-method access and linking return 401. An invalid One Tap token returns 400.
- Production SEO checks passed. GA4 sends the expected measurement ID `G-3W5C23WYR3` and receives HTTP 204; no duplicated initial page view or browser errors were observed. The seven homepage photos loaded successfully.
- Deterministic and manual security review passed. No production account associations, database schema or auth trust policy were changed.

Reproducible integration commands: `pnpm exec tsx scripts/verify-one-tap.ts`, `pnpm exec tsx scripts/verify-google-account-linking.ts` and `pnpm test:auth-navigation`.

**Remaining limitation:** no unused real Google account was available. Genuine first-time Google consent, production creation of that user and its signup-credit grant were not performed. The owner expressly selected isolated testing; browser fixtures and signed isolated JWTs are not evidence of a real Google signup. Existing owner-account association remains untouched.
