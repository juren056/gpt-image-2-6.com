# Cloudflare Git deployment

The existing Cloudflare Worker is connected to `juren056/nanobanana21pro.com`,
production branch `main`. Its commands are:

- Build: `pnpm cf:ci:build`
- Deploy: `pnpm cf:ci:deploy`
- Root: `/`

`scripts/cloudflare-ci.mjs` materializes the ignored `wrangler.jsonc` from
`wrangler.production.json` when a clean checkout has no working copy. That
committed configuration contains public app settings and the existing Worker,
domain, D1 and R2 identities. It contains no credentials.

The build runs the normal `cf:build` pipeline, including source and built homepage
checks and public prerendering. It verifies the production resource identities
and minifies Worker modules with esbuild while retaining function names and
module paths. The deploy checks those identities again and invokes the normal
`cf:deploy --prebuilt` pipeline. A mismatch stops the release.

Worker secrets and provider keys are not copied into build configuration.
`AUTH_SECRET` and `CONFIG_ENCRYPTION_KEY` remain in the existing Worker;
provider settings, including SeeAPI, remain in its D1 database. This pipeline
does not run migrations or alter administrator access, payments or credit rules.

The former build failed because its cipher aliases assumed a top-level
transitive dependency. Vite now resolves the cipher modules from better-auth's
installed dependency tree, including a clean pnpm installation.

After pushing, verify the Cloudflare build's commit and successful deployment,
then check public pages, protected image hashes and authenticated SeeAPI review.
Do not treat a queued build or successful Git push as a successful release.
