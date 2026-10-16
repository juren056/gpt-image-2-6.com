import { envConfigs } from '@/config';
import { pricingCatalog } from '@/config/pricing';
import {
  DEFAULT_IMAGE_QUOTES,
  PRIMARY_IMAGE_MODEL,
} from '@/config/product-facts';

export const AGENT_DOCUMENT_PATHS = [
  '/llms.txt',
  '/llms-full.txt',
  '/index.md',
  '/product.md',
  '/pricing.md',
  '/faq.md',
  '/evaluation-method.md',
  '/prompts.md',
] as const;

const reviewedOn = '2026-10-16';
const siteUrl = envConfigs.app_url.replace(/\/$/, '');
const absolute = (path: string) => `${siteUrl}${path}`;
const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const monthlyIds = [
  'starter_monthly',
  'creator_monthly',
  'pro_monthly',
] as const;
const prepaidIds = [
  'starter_prepaid_monthly',
  'creator_prepaid_monthly',
  'pro_prepaid_monthly',
] as const;
const packIds = ['credits_boost', 'credits_flex', 'credits_power'] as const;

function planLine(id: keyof typeof pricingCatalog) {
  const product = pricingCatalog[id];
  return `- ${product.planName}: ${money(product.priceInCents)} USD, ${product.credits.toLocaleString('en-US')} credits`;
}

function resolutionLines() {
  return Object.entries(PRIMARY_IMAGE_MODEL.resolutionCredits ?? {}).map(
    ([resolution, credits]) => `- ${resolution}: ${credits} credits per image`
  );
}

const sourceLinks = [
  `- [Homepage](${absolute('/')}): live generator, original examples and model comparison.`,
  `- [Pricing](${absolute('/pricing')}): visible subscription, prepaid membership and credit-pack offers.`,
  `- [Prompt library](${absolute('/prompts')}): reusable product, poster, editing and scientific briefs.`,
  `- [Evaluation method](${absolute('/evaluation-method')}): reproducible comparison procedure and evidence limits.`,
  `- [Nano Banana 2.1 vs Pro](${absolute('/nano-banana-2-1-vs-pro')}): task-based comparison without an unsupported overall winner.`,
  `- [Beginner guide](${absolute('/guide')}): prompt, reference, generation and review workflow.`,
  `- [Terms](${absolute('/terms-of-service')}): service and use terms.`,
  `- [Privacy](${absolute('/privacy-policy')}): data-handling information.`,
];

export function buildIndexMarkdown() {
  return [
    `# ${envConfigs.app_name}`,
    '',
    `> ${envConfigs.app_name} is an independently operated web workspace for Nano Banana image generation, reference editing, prompt preparation and evidence-based model comparison. It is not an official Google website.`,
    '',
    `Last reviewed: ${reviewedOn}.`,
    '',
    '## What the site provides',
    '',
    `- A live ${PRIMARY_IMAGE_MODEL.label} generator and reference editor.`,
    `- ${PRIMARY_IMAGE_MODEL.resolutions?.join(', ')} output choices with the server-validated credit quote shown before submission.`,
    `- Up to ${PRIMARY_IMAGE_MODEL.maxReferences ?? 0} reference images where the selected workflow supports them.`,
    '- Original examples, reusable prompts and a documented evaluation method.',
    '- Monthly subscriptions, one-month prepaid memberships and one-time credit packs.',
    '',
    '## Current default quote',
    '',
    `The workbench defaults to ${DEFAULT_IMAGE_QUOTES.model} at ${DEFAULT_IMAGE_QUOTES.resolution}. Quotes are per single image and batch requests multiply the selected resolution cost.`,
    '',
    ...resolutionLines(),
    '',
    '## Primary sources on this site',
    '',
    ...sourceLinks,
    '',
    '## Machine-readable documents',
    '',
    `- [Product facts](${absolute('/product.md')})`,
    `- [Pricing facts](${absolute('/pricing.md')})`,
    `- [Frequently asked questions](${absolute('/faq.md')})`,
    `- [Evaluation method](${absolute('/evaluation-method.md')})`,
    `- [Prompt guidance](${absolute('/prompts.md')})`,
    `- [Compact LLM index](${absolute('/llms.txt')})`,
    `- [Full LLM reference](${absolute('/llms-full.txt')})`,
    '',
  ].join('\n');
}

export function buildProductMarkdown() {
  return [
    `# ${PRIMARY_IMAGE_MODEL.label} product facts`,
    '',
    `> Current, server-aligned facts for the ${envConfigs.app_name} image workspace.`,
    '',
    `Last reviewed: ${reviewedOn}.`,
    '',
    '## Availability',
    '',
    `- Display name: ${PRIMARY_IMAGE_MODEL.label}`,
    `- Internal model selector: ${PRIMARY_IMAGE_MODEL.id}`,
    `- Status: ${PRIMARY_IMAGE_MODEL.productionEnabled ? 'enabled in production' : 'not enabled in production'}`,
    `- Operations: ${PRIMARY_IMAGE_MODEL.operations.join(', ')}`,
    `- Output resolutions: ${PRIMARY_IMAGE_MODEL.resolutions?.join(', ')}`,
    `- Maximum reference images: ${PRIMARY_IMAGE_MODEL.maxReferences ?? 0}`,
    '',
    '## Credit quote',
    '',
    ...resolutionLines(),
    '',
    'A request can produce one image. Batch output multiplies the unit quote by the requested image count. The UI displays the quote before submission. Provider failures use the task credit-reversal flow; a completed image that does not match a creative preference is not a provider failure.',
    '',
    '## Workflow',
    '',
    '1. Choose generation or reference editing.',
    '2. Write a prompt and assign each reference image a clear role.',
    '3. Select aspect ratio and resolution.',
    '4. Review the model name and credit quote.',
    '5. Sign in, submit once, follow the task status and inspect the output.',
    '',
    '## Scope and identity',
    '',
    `${envConfigs.app_name} is an independent service. It is not Google, and a site subscription is not an official Google subscription. Availability, provider terms and quotes can change; the live workbench and checkout are authoritative for a transaction.`,
    '',
    '## Supporting pages',
    '',
    ...sourceLinks,
    '',
  ].join('\n');
}

export function buildPricingMarkdown() {
  return [
    '# Pricing and credits',
    '',
    `> Current public offers for ${envConfigs.app_name}, generated from the same catalog used by checkout.`,
    '',
    `Last reviewed: ${reviewedOn}. Prices are in USD.`,
    '',
    '## Monthly subscriptions',
    '',
    'These plans renew automatically until cancelled.',
    '',
    ...monthlyIds.map(planLine),
    '',
    '## One-month prepaid memberships',
    '',
    'These are one-time Alipay payments for one month and do not renew automatically.',
    '',
    ...prepaidIds.map(planLine),
    '',
    '## One-time credit packs',
    '',
    'Credit packs do not renew automatically. Pack credits are valid for 365 days.',
    '',
    ...packIds.map(planLine),
    '',
    '## Nano Banana 2.1 request estimates',
    '',
    ...resolutionLines(),
    '',
    'The number of requests a balance can fund depends on the selected resolution and batch size. A request estimate is not a guarantee that every completed image will meet a creative brief.',
    '',
    `Review the visible product, amount, payment method and renewal terms on [the pricing page](${absolute('/pricing')}) and checkout before paying.`,
    '',
  ].join('\n');
}

export function buildFaqMarkdown() {
  return [
    '# Frequently asked questions',
    '',
    '## Can I generate Nano Banana 2.1 images here now?',
    '',
    `Yes. The production workspace is configured for ${PRIMARY_IMAGE_MODEL.label} generation and reference editing. A single ${DEFAULT_IMAGE_QUOTES.resolution} image currently uses ${DEFAULT_IMAGE_QUOTES.credits} credits. Check the live model selector before submitting.`,
    '',
    '## Is Nano Banana 2.1 free?',
    '',
    'Prompt preparation, copying and downloading are free. Connected generation uses the displayed account credit quote. Unlimited free generation is not included.',
    '',
    '## Is Nano Banana Pro the same model as Nano Banana 2.1?',
    '',
    'No. They are separate model choices. Compare the same prompt, references, supported settings, failures, quote and revision effort before selecting one.',
    '',
    '## Which resolutions are available and what do they cost?',
    '',
    ...resolutionLines(),
    '',
    '## Do failed tasks restore credits?',
    '',
    'A provider task that reaches the failed state follows the transactional credit-reversal flow. A completed output that does not match a subjective preference is a different case.',
    '',
    '## Are the examples a controlled benchmark?',
    '',
    `No. The homepage examples demonstrate workflows and original prompts. Only outputs produced with named models under recorded conditions support a model result comparison. See the [evaluation method](${absolute('/evaluation-method')}).`,
    '',
    '## Is this an official Google website?',
    '',
    'No. This is an independently operated workspace. Site plans and credits are separate from Google or direct provider billing.',
    '',
    '## Can generated output be used commercially?',
    '',
    `Commercial use depends on provider terms, the prompt, uploaded materials and third-party rights. Review [the terms](${absolute('/terms-of-service')}) and the applicable provider license before publishing.`,
    '',
  ].join('\n');
}

export function buildEvaluationMarkdown() {
  return [
    '# Evaluation method',
    '',
    '> A repeatable method for comparing Nano Banana 2.1 with other image models without turning a small sample into an unsupported universal ranking.',
    '',
    '## Controlled comparison',
    '',
    '1. Define a real task and explicit pass criteria before generating.',
    '2. Use the same prompt, references, aspect ratio and target resolution where both models support them.',
    '3. Record model identifiers, settings, time, quote, failures and retries.',
    '4. Keep all raw outputs. Do not publish only the best result from one model.',
    '5. Score observable requirements such as spelling, identity, geometry, preserved details and crop.',
    '6. Record correction effort and total credits, not only the first output.',
    '7. Repeat enough tasks to describe the tested workload; avoid claiming an overall winner from one prompt.',
    '',
    '## Evidence boundary',
    '',
    'Workflow illustrations and prompt recipes are not benchmark evidence. Product availability comes from the live model catalog. Prices come from the server checkout catalog. Model quality claims require raw outputs and recorded test conditions.',
    '',
    `Read the full [human-facing evaluation page](${absolute('/evaluation-method')}) and the [model comparison](${absolute('/nano-banana-2-1-vs-pro')}).`,
    '',
  ].join('\n');
}

export function buildPromptsMarkdown() {
  return [
    '# Nano Banana 2.1 prompt guidance',
    '',
    '> Reusable structure for product images, posters and reference edits. Replace the examples with facts from your own project.',
    '',
    '## Five-part prompt structure',
    '',
    'State the subject and action, composition, lighting or material, exact visible text, and constraints. Choose one visual direction and one destination shape before adding detail.',
    '',
    '## Product image example',
    '',
    'One cobalt glass bottle centered on pale limestone, soft light from the left, realistic reflections, no lettering, empty space above, square catalog composition. Preserve the bottle silhouette and cap geometry.',
    '',
    '## Poster example',
    '',
    'Create a portrait event poster with one large headline, “SPRING STUDIO”, near the top and the date “18 MAY” below it. Use an uncluttered illustration in the lower half. Add no other words or logos.',
    '',
    '## Reference edit structure',
    '',
    'Name the change first, then list what must remain. Example: replace the background with a pale stone studio wall; preserve product silhouette, label position, cap, reflections, camera angle and crop.',
    '',
    '## Review checklist',
    '',
    '- Inspect spelling and punctuation character by character.',
    '- Compare identity, product geometry and labels with the source reference.',
    '- Check the crop and output size at the final placement.',
    '- Add exact prices, dates and legal copy in an editable manual layer.',
    '- Save an accepted baseline and change one observed problem per revision.',
    '',
    `Browse the [full prompt library](${absolute('/prompts')}) or open the [generator](${absolute('/')}).`,
    '',
  ].join('\n');
}

export function buildLlmsIndex() {
  return [
    `# ${envConfigs.app_name}`,
    '',
    `> Independent ${PRIMARY_IMAGE_MODEL.label} image generation, reference editing, prompt guidance, original examples and transparent pricing. Not an official Google website.`,
    '',
    '## Essential documents',
    '',
    `- [Site overview](${absolute('/index.md')}): identity, current default, capabilities and primary sources.`,
    `- [Product facts](${absolute('/product.md')}): live model, operations, reference limit and resolution credit quotes.`,
    `- [Pricing](${absolute('/pricing.md')}): subscriptions, prepaid memberships and one-time credit packs.`,
    `- [FAQ](${absolute('/faq.md')}): availability, credits, failures, evidence and commercial-use boundaries.`,
    `- [Evaluation method](${absolute('/evaluation-method.md')}): controlled comparison protocol and evidence limits.`,
    `- [Prompt guidance](${absolute('/prompts.md')}): reusable prompt structures and review checklist.`,
    '',
    '## Human-facing pages',
    '',
    ...sourceLinks,
    '',
    '## Optional',
    '',
    `- [Full consolidated reference](${absolute('/llms-full.txt')}): the complete curated machine-readable set in one file.`,
    '',
  ].join('\n');
}

export function buildLlmsFull() {
  return [
    buildIndexMarkdown(),
    '---',
    '',
    buildProductMarkdown(),
    '---',
    '',
    buildPricingMarkdown(),
    '---',
    '',
    buildFaqMarkdown(),
    '---',
    '',
    buildEvaluationMarkdown(),
    '---',
    '',
    buildPromptsMarkdown(),
  ].join('\n');
}

export function agentDocumentResponse(
  body: string,
  options: {
    contentType?: 'text/plain' | 'text/markdown';
    canonicalPath: string;
  }
) {
  return new Response(body, {
    headers: {
      'Content-Type': `${options.contentType ?? 'text/markdown'}; charset=utf-8`,
      'Content-Language': 'en',
      'Cache-Control':
        'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      Link: `<${absolute(options.canonicalPath)}>; rel="canonical", <${absolute('/llms.txt')}>; rel="describedby"`,
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
