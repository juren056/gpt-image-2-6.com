# Cloudflare deployment

The production site uses Worker `nanobanana21pro-com`, custom domain
`nanobanana21pro.com`, and the D1 binding `DB`.

Keep the local `wrangler.jsonc` and `.env.production` files: they contain the
deployment settings and are intentionally ignored by Git. Store runtime secrets
with `wrangler secret put`, never in public Worker variables.

Run `pnpm cf:deploy` to build the application and publish it. The command works on
Windows and Linux and loads `.env.production` before building. Deploy the
generated application, rather than a Cloudflare Hello World starter.

D1 uses SQLite migrations in `drizzle/d1/`. The older PostgreSQL migrations under
`drizzle/` must not be applied to D1. For future schema changes, run
`pnpm db:generate:d1`, review the generated SQL, and then run
`pnpm db:migrate:d1` before publishing.

AI, payments, OAuth, email, and R2 credentials are configured in the application's
admin settings. A new D1 database starts without those provider credentials or
any administrator accounts.
