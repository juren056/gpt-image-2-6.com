# Account assets implementation / continuation contract

Reference evidence: `docs/design-references/account/reference-assets.png` and the account workflows spec. Interaction is click-driven; thumbnail selection updates a right detail pane. On narrow screens, selecting a thumbnail scrolls and focuses that pane. Reduced motion disables the smooth scroll.

## Real routes and data

- `/settings/assets`: user-owned generated images, search, pagination, pending-task polling, favorites, collections, reversible Trash, and Characters / Products / Styles classification.
- `/settings/history`: real saved Studio projects and image generation history; no invented chat transcript.
- `/settings/prompts`: own bilingual prompt recipes, type/category/search/sort controls, copy and use actions.
- `/settings/skills`: same practical recipes organized as reusable task briefs.
- `/settings/tools`: all 25 existing tool registry entries link to the corresponding Studio tool.

Assets are loaded through `/api/images/`; projects through `/api/studio/projects`. Metadata uses `/api/assets/library`, backed by one owner/task record in the existing `post` table. Collection records use a separate post type. No migration or new credit operation.

Every metadata mutation validates task ownership, image media type and non-deleted state. Collection assignment validates active collection ownership. POST writes have a 500 ms per-user rate limit. Private metadata responses use `private, no-store`. Legacy favorite mutations preserve omitted classification and soft-trash fields. Trash never deletes the AI task or its credit ledger.

## Generator handoff

Actions write sessionStorage `banana-account:handoff:v1`:

```json
{"prompt":"...","model":"...","operation":"generate","imageUrls":[],"sourceTaskId":"optional"}
```

Then navigate to `/settings/generate?resume=asset` or `?resume=recipe`. Reference reuse sets operation `edit` and supplies result URLs. This prepares a draft and does not submit a billable task.

Upscale/remove-background actions navigate to `/settings/studio?tool=T10|T03&sourceTask=<ownedTaskId>`. Studio loads that task through its authenticated API and prepares references. Existing provider availability and credit checks remain authoritative.

Saved project links use `/settings/studio?project=<ownedProjectId>`. Studio loads the owner-checked project endpoint and restores state, title, prompt, model and selected asset. Load errors have explicit retry states.

## Deliberate practical limits

- Search and counts cover loaded image pages; a `+` indicates more pages, and Load more remains available with filters.
- Uploaded references are handled by the existing upload/editor flow. There is no fictitious Uploads index.
- Generated media type is Images; there are no dead Videos or Audio filter buttons.
- Recipe thumbnails illustrate themes, with an explanatory note. They do not claim to be community submissions or exact generated results.
- No automatic deletion after 30 days, fictitious storage capacity, or immediate paid regeneration.

## Verification

`pnpm exec tsx scripts/verify-asset-library.ts` creates an isolated scratch SQLite database under `.artifacts/account`, then checks owner isolation, foreign task/collection denial, duplicate-free favorite updates, category persistence, soft-trash restoration, and original task history preservation. It does not connect to deployment databases.
