# Generator restore-then-switch repair

The owner authorized strict execution of the remaining generator and Chinese SEO plan on 2026-10-14.

## Resulting behavior

- A generator selection is assembled as one normalized draft before the interface applies it. Prompt, model, mode, ratio, resolution, output count and reference images therefore move together.
- Restoring a previous draft no longer backs up the current template over the real previous draft.
- A submitted request uses the exact normalized snapshot displayed when the user clicked generate. Later React state changes cannot alter its request body, task record or accepted-draft marker.
- The exact sequence old draft → Chinese tea → restore old draft → Bottle background edit produces Nano Banana 2.1, image edit, one reference, 3:2, 1K, one output and an 8-credit quote. The state survives a reload.
- Chinese prompt-library guidance and badges remain localized. No new copy or homepage photograph was introduced.

## Verification

| Dimension     | Evidence                                                                                                             | Result                                                                                 |
| ------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Unit          | Generator-entry regression includes the exact restore-then-bottle transition and credit calculation                  | Passed                                                                                 |
| Browser       | Chromium executed the full path, reloaded, submitted once into a local intercept and compared the complete JSON body | Passed; one intercepted local submission and zero provider calls                       |
| Regression    | Existing 15-case acquisition browser suite                                                                           | Passed; zero provider calls                                                            |
| Chinese pages | `/zh` and `/zh/prompts/chinese` at 390, 768 and 1440px; metadata, hreflang, headings, localized copy and overflow    | Six page/viewport checks passed                                                        |
| Build         | TypeScript, Vite production build and Cloudflare build with 1,532 static pages                                       | Passed                                                                                 |
| SEO           | Local crawl of the generated site map                                                                                | 116 indexable URLs; no missing or duplicate metadata, bad H1/canonical or orphan pages |
| Security      | Deterministic worktree/staged scans plus manual review of client-only draft handling and request construction        | No findings                                                                            |

The request test used a local API intercept and did not spend credits or call an image provider. Search Console freshness and indexing are separate external observations; submission acceptance is not proof of indexing.
