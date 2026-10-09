# UX rebuild baseline

- Recorded: 2026-09-12
- Initial HEAD: `65ddb66 首页显示新模型`
- Initial worktree: clean.
- Stack: TanStack Start, React 19, Vite 8, Nitro, strict TypeScript.
- Runtime/price authority remains `CREATIVE_MODELS`; task execution remains `/api/studio/run` and `/api/studio/utility`.

## New public architecture

- `/models`: crawlable model directory.
- Twenty-four new explicit tool routes plus the existing background remover route.
- Homepage: task shortcuts, eight-model showcase, full grouped tool discovery and three complete workflow scenes.
- Studio remains an advanced project workspace; public pages no longer use it as their primary destination.
