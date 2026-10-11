# Production rollback

The user requested restoration of the release preceding the workflow redesign.

- Approved rollback baseline: `40ae8583-68a5-47c2-b697-f4f3bf27f46c` (transparent banana icons; original yellow/black layout).
- Active production version after administrator permission audit: `fb26895c-2902-4abc-b383-f55d3d018ac4`. Uses recovered approved static assets, administrator entry detection, resource/action permissions and active-role checks. Reproducible release package: `.artifacts/account/admin-hotfix-release/wrangler.json`. See `admin-security-audit.md` for scope and validation.
- Rejected redesign version: `52118540-1899-49f1-9bd5-ca4c7408b638`.
- Worker: `nanobanana21pro-com`, domain: `nanobanana21pro.com`.
- Applied via Wrangler version rollback to 100% of traffic.
- Database, credits, administrator role, secrets, and other bound resources were not changed.
- Local uncommitted redesign source and build output are preserved. They do not represent the active production release. Do not deploy the current build without an explicit decision to restore or replace the rejected redesign.

Evidence: `.artifacts/account/rollback-workflow-upgrade.log`, `.artifacts/account/rollback-live-report.json`, `.artifacts/account/rollback-live-home.png`.

