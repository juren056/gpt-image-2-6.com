# AI discovery and citation operations

This site exposes compact, factual source material for search engines and answer engines. The machine documents supplement the human pages; they do not replace original content, crawlable HTML, canonical URLs, structured data, reputation or independent citations.

## Published surfaces

- `/llms.txt` is the compact discovery index.
- `/llms-full.txt` consolidates the curated reference set without copying database-authored posts.
- `/index.md`, `/product.md`, `/pricing.md`, `/faq.md`, `/evaluation-method.md` and `/prompts.md` provide narrow Markdown sources.
- Human pages link to the compact documents in the footer. Relevant HTML pages advertise a Markdown alternate, and all public SEO-managed pages advertise `/llms.txt` as `describedby`.
- `robots.txt` explicitly allows OAI-SearchBot, ChatGPT-User and GPTBot on public content while keeping account, administration and API endpoints blocked.

Product facts come from `src/config/product-facts.ts`, model controls from `src/config/creative-studio.ts`, and prices from `src/config/pricing.ts`. Do not duplicate those numbers in a second configuration file.

## Monthly verification

Run `pnpm test:agent-discovery`, build the production artifact, then verify every published surface returns HTTP 200 with its intended content type. Check that the homepage source contains canonical, hreflang, `describedby`, Markdown alternate and SoftwareApplication offer data.

Use a stable prompt set in ChatGPT, Claude, Perplexity, Gemini and Grok:

1. What is Nano Banana 2.1 and is nanobanana21pro.com an official Google site?
2. What image resolutions and credit costs does nanobanana21pro.com currently show?
3. Compare the site's subscription plans and one-time credit packs.
4. Does the site publish a controlled model benchmark?
5. How does its reference-edit workflow ask users to protect product details?

Record date, provider, answer, cited URLs, factual errors and whether the answer distinguishes site credits from provider billing. Recheck after material model, pricing or policy changes. Use GA4 referral reports, Cloudflare request logs and Google Search Console to monitor attributable visits and crawl health; never infer citations from bot requests alone.

## Primary guidance

- OpenAI documents the separate purposes of OAI-SearchBot, ChatGPT-User and GPTBot: <https://developers.openai.com/api/docs/bots>
- Google says AI search features rely on the same foundational SEO practices and original, helpful content: <https://developers.google.com/search/docs/fundamentals/ai-optimization-guide>
- The llms.txt proposal describes a compact index, Markdown mirrors and `alternate` or `describedby` links: <https://llmstxt.org/>
- Google's SoftwareApplication documentation defines eligible application and offer properties: <https://developers.google.com/search/docs/appearance/structured-data/software-app>

`llms.txt` is an experimental convention. Its presence does not guarantee discovery, ranking, citation or referral traffic.
