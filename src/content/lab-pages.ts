export type LabPage = {
  slug: string;
  title: string;
  shortAnswer: string;
  goal: string;
  prompt: string;
  settings: string;
  image: string;
  imageAlt: string;
  observed: string;
  worked: string[];
  failed: string[];
  improvedPrompt: string;
  conclusion: string;
};

export const LAB_PAGES: LabPage[] = [
  {
    slug: 'qwen-image-3-chinese-text-test',
    title: 'Qwen Image 3 Chinese Text Test',
    shortAnswer:
      'Qwen Image 3 can produce useful Chinese display text, but small copy still needs visual proofreading before publication.',
    goal: 'Inspect hierarchy and legibility across a Chinese poster, menu-style rows, packaging copy, a large headline and smaller supporting text.',
    prompt:
      'Vertical tea poster. Exact headline “春山新茶”. Subheading “明前龙井 · 清香回甘”. Add three short menu rows with aligned prices. Rice-paper texture, restrained ink landscape, no extra text.',
    settings: 'Qwen Image 3 · portrait 4:3 · prompt expansion on · one output',
    image: '/imgs/seo/text-rendering-case.webp',
    imageAlt: 'Qwen Image 3 Chinese typography poster example',
    observed:
      'The headline has the clearest hierarchy. Smaller repeated characters and price alignment are the areas that require the closest review.',
    worked: [
      'Clear large headline',
      'Useful poster hierarchy',
      'Coherent image and type styling',
    ],
    failed: [
      'Small characters can deform',
      'Dense menu rows may lose alignment',
      'Generated copy must not be treated as final artwork',
    ],
    improvedPrompt:
      'Keep only the exact supplied Chinese strings. Use no decorative pseudo-text. Set every menu item on a separate baseline with wide spacing and large type.',
    conclusion:
      'Use the model for concept and display typography, then inspect every character at full size and replace critical body copy in a design tool when needed.',
  },
  {
    slug: 'qwen-image-3-typography-test',
    title: 'Qwen Image 3 Typography Test',
    shortAnswer:
      'Short English and Chinese headlines are the safest typography use case; mixed-language and small text need stricter prompts and review.',
    goal: 'Compare English, Chinese, Japanese, mixed-language hierarchy, small text and poster layout in one repeatable visual brief.',
    prompt:
      'Editorial poster with exact lines “DESIGN SYSTEMS”, “设计系统”, and “デザイン”. Swiss grid, ivory paper, cobalt circle, three clear type sizes, no other lettering.',
    settings: 'Qwen Image 3 · portrait 4:3 · one output · exact quoted text',
    image: '/imgs/seo/prompt-case-board.webp',
    imageAlt: 'Qwen Image 3 multilingual typography test board',
    observed:
      'Large isolated lines are easier to verify than paragraphs. Quoted strings and an explicit ban on extra lettering reduce visual noise.',
    worked: [
      'Strong title hierarchy',
      'Poster composition',
      'Mixed-script concept exploration',
    ],
    failed: [
      'Small glyph details remain fragile',
      'Extra decorative text may appear',
      'Kerning can vary between runs',
    ],
    improvedPrompt:
      'Render exactly three text lines and nothing else. Use large high-contrast type, generous line spacing and no microcopy, captions or logos.',
    conclusion:
      'Keep text short, quote it exactly, and generate at the final aspect ratio. Proofreading remains mandatory.',
  },
  {
    slug: 'qwen-image-3-product-photo-test',
    title: 'Qwen Image 3 Product Photo Test',
    shortAnswer:
      'The model is useful for premium product concepts, especially when the brief defines material, lighting, contact shadow and camera angle.',
    goal: 'Evaluate a clean packshot, luxury advertising light, e-commerce composition and product geometry in a single product brief.',
    prompt:
      'Cobalt perfume bottle on dark slate, exact bottle proportions, narrow rim light, controlled reflection, realistic contact shadow, centered luxury advertising frame, no hands, no extra products.',
    settings: 'Qwen Image 3 · landscape 4:3 · one output',
    image: '/imgs/showcase/cobalt-perfume.webp',
    imageAlt: 'Qwen Image 3 cobalt perfume product advertisement example',
    observed:
      'Lighting and mood are strong. Brand-critical geometry, label spelling and cap alignment should be checked against a real reference.',
    worked: [
      'Studio lighting concept',
      'Material rendering',
      'Campaign-ready composition',
    ],
    failed: [
      'Exact SKU geometry is not guaranteed',
      'Label text can vary',
      'Reflections may need retouching',
    ],
    improvedPrompt:
      'Keep the supplied bottle silhouette, cap height and label position unchanged. Use one key light, one rim light and a physically grounded contact shadow.',
    conclusion:
      'Use text-to-image for concepting and the editor with a product reference when identity preservation matters.',
  },
  {
    slug: 'qwen-image-3-infographic-test',
    title: 'Qwen Image 3 Infographic Test',
    shortAnswer:
      'Qwen Image 3 can draft strong infographic layouts, but facts and labels must be validated separately.',
    goal: 'Test a five-step process, directional arrows, data grouping, educational clarity and visible label hierarchy.',
    prompt:
      'Educational photosynthesis infographic with five numbered arrows: sunlight, carbon dioxide, water, oxygen and glucose. White background, green and amber palette, short exact labels, no statistics.',
    settings: 'Qwen Image 3 · landscape 16:9 · one output',
    image: '/imgs/seo/controlled-comparison.webp',
    imageAlt: 'Qwen Image 3 educational infographic layout example',
    observed:
      'The broad flow can read well, while arrow direction and small labels need deliberate inspection before educational use.',
    worked: [
      'Visual grouping',
      'Color-coded hierarchy',
      'Fast layout exploration',
    ],
    failed: [
      'The model does not verify facts',
      'Arrow direction can be ambiguous',
      'Small labels may be malformed',
    ],
    improvedPrompt:
      'Use exactly five numbered nodes in a clockwise path. Keep each label to two words and leave a clear gap between every arrow and label.',
    conclusion:
      'Treat the result as a visual draft, then verify facts and rebuild critical labels as editable text.',
  },
  {
    slug: 'qwen-image-3-image-editing-test',
    title: 'Qwen Image 3 Image Editing Test',
    shortAnswer:
      'Reference editing works best when the instruction separates the requested change from details that must remain unchanged.',
    goal: 'Test background replacement, style change, advertising treatment and subject preservation using an uploaded reference.',
    prompt:
      'Replace only the background with a premium black studio set. Keep the bottle, label, cap, perspective and crop unchanged. Add a soft contact shadow and narrow rim light.',
    settings: 'Qwen Image Edit 2511 · one reference · one output',
    image: '/imgs/seo/ecommerce-campaign-board.webp',
    imageAlt: 'Qwen Image reference editing product workflow example',
    observed:
      'Explicit preserve clauses improve the editing brief. Fine label details and exact boundaries still need a full-resolution comparison.',
    worked: [
      'Natural-language background changes',
      'Advertising restyle',
      'Subject-aware edits',
    ],
    failed: [
      'Pixel-perfect preservation is not guaranteed',
      'Tiny text may change',
      'Complex edges can drift',
    ],
    improvedPrompt:
      'Change only the background and lighting. Do not redraw, resize, rotate or alter the product, logo, label typography or crop.',
    conclusion:
      'Name both the desired change and the protected details. Compare against the source before using the edit commercially.',
  },
  {
    slug: 'qwen-image-3-vs-pro',
    title: 'Qwen Image 3 Standard vs Pro',
    shortAnswer:
      'This site currently exposes one verified Qwen Image 3 endpoint, so it does not publish a fabricated Standard-versus-Pro winner.',
    goal: 'Define a reproducible comparison protocol for text, detail, prompt adherence, layout, latency and provider cost without inventing unavailable results.',
    prompt:
      'Create a bilingual product poster with exact headline “NIGHT BLOOM / 夜花”, one glass perfume bottle, three benefit labels and a strict two-column grid.',
    settings:
      'Same prompt, aspect ratio, output count and safety settings for every endpoint; record provider-reported latency and current provider price.',
    image: '/imgs/seo/controlled-comparison.webp',
    imageAlt: 'Qwen Image controlled comparison protocol board',
    observed:
      'A fair comparison requires both endpoints to be available at the same time. Until then, a qualitative protocol is more honest than invented scores.',
    worked: [
      'Repeatable prompt',
      'Defined review criteria',
      'No unsupported numeric claims',
    ],
    failed: [
      'No verified Standard endpoint is configured',
      'No paired outputs are available yet',
      'Pricing can change at the provider',
    ],
    improvedPrompt:
      'Keep the same seed where supported, exact quoted text, identical resolution and one output. Change only the endpoint under test.',
    conclusion:
      'The production UI shows only models that are actually enabled. This page will gain paired outputs only after a controlled run exists.',
  },
];

export function getLabPage(slug: string) {
  return LAB_PAGES.find((page) => page.slug === slug);
}
