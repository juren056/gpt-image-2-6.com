# UX rebuild baseline

- Recorded: 2026-09-12
- Initial HEAD: `65ddb66 首页显示新模型`
- Initial worktree: clean.
- Stack: TanStack Start, React 19, Vite 8, Nitro, strict TypeScript.
- Preserved systems: auth, anonymous Qwen trial, credits, billing, Fal adapters, image tasks, storage, projects, assets and history.
- Preserved public URLs: `/`, `/qwen-image-editor`, `/tools`, existing poster/product/thumbnail/background/filter/video pages, prompts, Lab, guides, blog and legal pages.
- Root Title/H1 and Qwen Image 3 search intent remain unchanged.
- Runtime/price authority remains `CREATIVE_MODELS`; task execution remains `/api/studio/run` and `/api/studio/utility`.

## New public architecture

- `/models`: crawlable model directory.
- Seven new explicit model routes plus the existing Qwen editor route.
- Twenty-four new explicit tool routes plus the existing background remover route.
- Homepage: task shortcuts, eight-model showcase, full grouped tool discovery and three complete workflow scenes.
- Studio remains an advanced project workspace; public pages no longer use it as their primary destination.
