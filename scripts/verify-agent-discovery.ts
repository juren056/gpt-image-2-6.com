import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { pricingCatalog } from '../src/config/pricing';
import { PRIMARY_IMAGE_MODEL } from '../src/config/product-facts';
import {
  AGENT_DOCUMENT_PATHS,
  agentDocumentResponse,
  buildEvaluationMarkdown,
  buildFaqMarkdown,
  buildIndexMarkdown,
  buildLlmsFull,
  buildLlmsIndex,
  buildPricingMarkdown,
  buildProductMarkdown,
  buildPromptsMarkdown,
} from '../src/lib/agent-docs';

const docs = {
  '/llms.txt': buildLlmsIndex(),
  '/llms-full.txt': buildLlmsFull(),
  '/index.md': buildIndexMarkdown(),
  '/product.md': buildProductMarkdown(),
  '/pricing.md': buildPricingMarkdown(),
  '/faq.md': buildFaqMarkdown(),
  '/evaluation-method.md': buildEvaluationMarkdown(),
  '/prompts.md': buildPromptsMarkdown(),
};

assert.deepEqual(Object.keys(docs), [...AGENT_DOCUMENT_PATHS]);

for (const [path, body] of Object.entries(docs)) {
  assert.match(body, /^# /, `${path} must start with one H1`);
  assert.equal(
    /\u0000|\r/.test(body),
    false,
    `${path} contains unsafe control text`
  );
  assert.ok(body.length > 250, `${path} is unexpectedly short`);
  assert.ok(body.length < 100_000, `${path} is unexpectedly large`);
}

const consolidated = Object.values(docs).join('\n');
assert.doesNotMatch(consolidated, /Default model: FLUX/i);
assert.match(consolidated, new RegExp(PRIMARY_IMAGE_MODEL.label));
for (const [resolution, credits] of Object.entries(
  PRIMARY_IMAGE_MODEL.resolutionCredits ?? {}
)) {
  assert.match(consolidated, new RegExp(`${resolution}: ${credits} credits`));
}
for (const id of [
  'starter_monthly',
  'creator_monthly',
  'pro_monthly',
  'credits_boost',
  'credits_flex',
  'credits_power',
]) {
  const product = pricingCatalog[id];
  assert.match(docs['/pricing.md'], new RegExp(product.planName));
  assert.match(
    docs['/pricing.md'],
    new RegExp(`\\$${(product.priceInCents / 100).toFixed(2)}`)
  );
}

for (const path of AGENT_DOCUMENT_PATHS.slice(2)) {
  assert.match(docs['/llms.txt'], new RegExp(path.replace('.', '\\.')));
}

const response = agentDocumentResponse(docs['/product.md'], {
  canonicalPath: '/',
});
assert.match(response.headers.get('content-type') ?? '', /^text\/markdown/);
assert.match(response.headers.get('link') ?? '', /rel="canonical"/);
assert.match(response.headers.get('link') ?? '', /rel="describedby"/);
assert.equal(response.headers.get('x-content-type-options'), 'nosniff');

const [footer, robots, seo, routes, prerender] = await Promise.all([
  readFile('src/blocks/footer.tsx', 'utf8'),
  readFile('src/routes/robots[.]txt.ts', 'utf8'),
  readFile('src/lib/seo.ts', 'utf8'),
  readFile('src/lib/nano-site-routes.tsx', 'utf8'),
  readFile('scripts/prerender-public.mjs', 'utf8'),
]);

for (const path of AGENT_DOCUMENT_PATHS.slice(0, 6)) {
  assert.ok(footer.includes(path), `Footer is missing ${path}`);
}
for (const provider of [
  'chatgpt.com',
  'claude.ai',
  'perplexity.ai',
  'gemini.google.com',
  'grok.com',
]) {
  assert.ok(footer.includes(provider), `Footer is missing ${provider}`);
}
for (const crawler of ['OAI-SearchBot', 'ChatGPT-User', 'GPTBot']) {
  assert.ok(robots.includes(crawler), `robots.txt is missing ${crawler}`);
}
assert.equal(
  (robots.match(/Disallow: \/zh\/api\//g) ?? []).length,
  4,
  'Every crawler group must keep the localized API private'
);
assert.ok(seo.includes("rel: 'describedby'"));
assert.ok(seo.includes("type: 'text/markdown'"));
assert.ok(routes.includes("'@type': 'SoftwareApplication'"));
for (const path of AGENT_DOCUMENT_PATHS) {
  assert.ok(prerender.includes(path), `Prerender list is missing ${path}`);
}
assert.ok(prerender.includes('rel="canonical"'));
assert.ok(prerender.includes('rel="describedby"'));

console.log(
  `Agent discovery verification passed: ${Object.keys(docs).length} documents, shared product facts, footer discovery, crawler rules and structured data.`
);
