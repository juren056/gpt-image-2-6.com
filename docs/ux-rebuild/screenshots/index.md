# Browser screenshot evidence

Captured from the final local production build `.output-ux-final5` on 2026-09-12 with Microsoft Edge. The server used an ephemeral process-only local audit secret; no configuration file was changed. No screenshot triggered a paid operation.

## Homepage and directories

- `homepage-desktop.png` — 1440 × 1200 first screen; compact generator with model, size, prompt and primary action visible.
- `homepage-mobile.png` — real 390 × 844 device viewport through Edge DevTools emulation.
- `homepage-full-desktop.png` — full rendered page, including all model cards, grouped tools and scenario results.
- `models-directory-desktop.png` and `tools-directory-desktop.png` — public discovery directories.

## Complete route coverage

- Model screenshots: `m01-…-desktop.png` through `m08-…-desktop.png` — 8/8.
- Tool screenshots: `t01-…-desktop.png` through `t25-…-desktop.png` — 25/25.
- All route screenshots are real browser first screens, not design mockups.

## Responsive and dedicated-control evidence

- Model long-name shell: `nano-banana-2-lite-mobile.png`.
- Upload/batch: `batch-editor-mobile.png`.
- Brand and sharing: `brand-kit-mobile.png`, `prompt-builder-mobile.png`.
- Workflow: `workflow-builder-mobile.png`.
- Dedicated controls: `add-shadow-mobile.png`, `add-text-mobile.png`, `svg-editor-mobile.png`, `annotate-edit-mobile.png`.
- Desktop dedicated controls are also present in `t05-…`, `t12-…`, `t19-…`, and `t23-…`.

The initial command-line 390px captures were rejected because Edge applied its Windows minimum layout width. The mobile files above were recaptured using DevTools device metrics and visually inspected. Images on pages remain explicitly labelled as site-owned workflow illustrations unless a retained provider task proves model provenance.

Worktree baseline: `65ddb66` plus this uncommitted UX rebuild diff. No commit, push or deployment was performed.
