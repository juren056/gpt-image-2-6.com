# Long-tail page UI and interaction specification

Source: user CSV, priority screenshot and pasted planning notes, reviewed 2026-10-10. These are editorial inputs; unverified keyword metrics and retirement dates are excluded.

## Selected changes

- Keep existing semantic colors, typography, NanoBanana D icon and homepage title/description/H1.
- Compact the homepage introduction, then expose the workbench and three P0 destinations: prompts, Pro comparison and scientific figures. Place the existing illustrative product image below the workbench, explicitly labeled as an illustration.
- Related links follow the page's topic rather than dumping the entire sitemap. The blog hub links all five new practical guides and preserves the old article list.
- Logo and science pages provide relevant prompt recipes. Prompt cards send a prompt to the homepage workbench through the existing query parameter.
- Preserve prompt, model, operation and aspect ratio in a session-scoped draft; validate restored choices. Files must be selected again after reload. Explicit page defaults and prompt query parameters take precedence over a draft's mode/model.
- Poll active generation only while visible; stop automatic polling after repeated retrieval failures, show retry without creating a second paid job. Do not clear an active job when changing display preferences.
- Keep provider availability checks and pending-state copy. No new model, price, subscription or MCP claim is enabled by this content rebuild.

## Acceptance

One H1 per route, keyboard-operable native forms/FAQ disclosures, semantic theme tokens, no overflow at 390/768/1440 px. EN/ZH titles, descriptions, canonical/hreflang and sitemap cover every selected page. Alias routes return 301 and never enter sitemap. Build, typecheck, HTTP metadata checks and CUA draft/recipe/FAQ/mobile interactions must pass before deployment.
