# Password and Google authentication — 2026-10-18

Owner-approved scope: email/password registration and login, Google OAuth and
Google One Tap. No unlinking, email OTP, verification requirement or GitHub entry.

- New password registrations accept optional name (fallback from email local part)
  and a single password field with visibility and password-manager support.
- Both signup and signin retain safe internal callbacks and fragments. Signup
  OAuth errors now enter the same recovery flow as signin.
- All unbound same-email Google logins require authenticated explicit linking,
  including verified local users (`disableImplicitLinking: true`). A Google
  identity already bound to a user still logs into that user directly.
- The password recovery screen calls Better Auth `linkSocial` after successful
  authentication; no manual Profile navigation is required. One Tap's existing
  nested recovery destination enters this same path. Google retains real consent,
  token, state/PKCE, same-email and cross-account ownership checks.
- Server/public-config policy disables email OTP, local email verification and
  GitHub regardless of stale admin flags; the flags remain in the general engine.
  Password reset is not advertised. Provider credentials are unchanged.
- No account email verification flags are bulk changed; no users merged; no DB
  migration; no generation or payment requests added; homepage baseline unchanged.

Verification: installed Better Auth memory-adapter integration for OAuth and
cryptographically signed One Tap fixtures; callback/open-redirect tests; locale
validation; production build; responsive browser checks with isolated API fixtures.
Real personal Google consent is not completed by automated fixtures. A pure
password user who loses their password and never linked Google still needs manual
support recovery because no mailbox ownership channel is configured.
