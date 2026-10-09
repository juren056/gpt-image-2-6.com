# Creative Studio Release Checklist

- [ ] `pnpm i18n:validate`
- [ ] `pnpm test:creative-studio`
- [ ] `pnpm typecheck`
- [ ] `pnpm build`
- [ ] Confirm no migration or schema change exists
- [ ] Configure provider credentials and R2 without exposing values to the client
- [ ] Approve the bounded live-test plan and maximum provider spend
- [ ] Run each live test once and attach request/result/credit evidence
- [ ] Add only accepted model IDs to `creative_enabled_model_ids`
- [ ] Test task polling, webhook completion, persisted output and failed-task credit refund
- [ ] Test project ownership, archive, share snapshot and revoke
- [ ] Test mobile canvas/tool navigation and keyboard focus
- [ ] Run project `security-scan` before any future commit
- [ ] Deploy to a preview environment; production remains unchanged
- [ ] Enable `creative_studio_enabled` only after preview acceptance

## Rollback

Turn off `creative_paid_models_enabled` to stop new paid submissions immediately. Turn off `creative_studio_enabled` to hide the workspace in the release integration. Do not delete tasks, posts, credits, orders or storage objects. Roll back application code to the prior deployment only after the switches are off; historical task polling remains supported by the existing model identifiers.
