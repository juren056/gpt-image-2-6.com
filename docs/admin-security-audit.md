# Administrator permissions and security review

Production version: `fb26895c-2902-4abc-b383-f55d3d018ac4`.

The owner account `marcushuang4595@gmail.com` now has the existing template `super_admin` role. Ordinary `admin` retains configuration read-only access. No role defaults, schema, provider credentials or payment records were changed.

| Severity | Finding | Resolution |
| --- | --- | --- |
| High | Inactive roles still contributed permissions, so disabling a role did not revoke its access. | Permission resolution now joins the role table and requires `status = active`, in addition to assignment expiry. |
| Medium | Nine admin endpoints required `admin.*` rather than the template's individual resource permissions. | Users, export, credits, orders, subscriptions, generations, posts and categories now check the required resource/action; GET cannot authorize write or deletion. |
| Functional | Owner could enter the admin area but could not save configuration or test Stripe. | Assigned the existing owner-level role; configuration endpoints still require `admin.settings.write`. |

Role and permission management remains privileged. Secret values remain masked on admin reads, protected config keys remain blocked from settings saves, public config uses a secret-filtered allowlist, and Stripe webhook signature verification remains enabled.

Validation: isolated SQLite tests using the actual permission resolver cover active, disabled, expired and absent roles, owner versus admin settings rights, and action-specific checks. Nine unauthenticated live admin requests were rejected, an unsigned Fal callback was rejected, and public config contained no secret fields. Credit ledger and auth navigation checks passed. TypeScript and the template deterministic security scan passed (243 changed files at scan time).

The browser Stripe test no longer returns Forbidden. Stripe now reports `Invalid API Key`; valid credentials must be entered and saved by the owner. No charge or paid order was created. This is a scoped review of access control, configuration/secret boundaries, callback guards and existing credit/auth checks, not a guarantee that every possible site vulnerability has been excluded.

Release package: `.artifacts/account/admin-hotfix-release/wrangler.json`, preserving approved yellow/black public static pages and their browser assets. Current local UI redesign source/build is not the public release baseline.
