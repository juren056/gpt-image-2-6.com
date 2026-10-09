# Five competitor UI audit and implementation plan

Observed 2026-10-10. This is a public-page/UI audit, not a copy of private application source. Authentication, paid generation and uploads to third parties were not performed.

| Site | Evidence | Patterns adopted | Limits |
| --- | --- | --- | --- |
| [NanoBanana Pro](https://nanobanana.pro/) | Desktop/mobile home and pricing CSS + screenshots | Input/result columns, adjacent credit cost, direct workspace entry | Click states not verified |
| [NanoBanana2](https://nanobanana2.com/text-to-image-generator) | Cached public structure | Task-first organization, restrained disclosure | Live connection failed; no pixel/interaction claims |
| [Pollo AI](https://pollo.ai/ai-image-generator) | Live composer, model chooser, settings, pricing toggle | Prompt-first flow, model/ratio/cost grouped, disabled empty submit | Mobile viewport override failed; no login/generation/purchase |
| [Freepik → Magnific](https://www.magnific.com/ai/photo-editor) | Live public editor and mobile empty state, onboarding/pricing toggles | Task links, mobile collapsed navigation, clear edit entry | Upload/history after selection not tested |
| [Krea](https://www.krea.ai/image) | Live sidebar/tool search/model dialog/examples/advanced settings | Persistent rail, search, example prefill | No generation or paid states |

Detailed observations are in each site's subdirectory; screenshots and measured CSS are in `.artifacts/competitors/`. Access-error screenshots are explicitly labeled and excluded from visual targets.

## Own-site design foundation

Use a 224px charcoal left rail on desktop, collapsible mobile sheet, a 64px utility bar and a maximum 1280px content area. Heading 32–40px sans, body 14px, compact 12px labels. Warm amber primary (oklch .82 .16 85), neutral canvas, 16–24px panel radii, 8/16/24/32 spacing. Dark mode keeps the same hierarchy with dark neutral panels. Scope tokens to `.creative-home` so authenticated/admin surfaces retain their theme.

Replace the long marketing-first homepage with a concise heading, existing functional generator, four own-artwork inspiration cards and a task directory; keep compact pricing, FAQ and footer. Tool search filters real implemented routes. Examples fill the existing generator prompt event and focus the composer; they never auto-submit. Model selector searches existing model names and shows actual configured credit costs. Keep existing authentication, API calls, result handling, draft preservation and payment logic.

Component ownership: root builds shell/home blocks/tokens/translations; workspace builder refines generator layout; model-picker builder refines shared selection. Do not reproduce competitor logos, artwork, promotional claims or unsupported advanced options.

Validation: production build and TypeScript; desktop/mobile light/dark browser checks; tool search, model search/selection, example prefill, ratio selection, anonymous draft/sign-up handoff. Live generation remains dependent on configured provider credentials.
