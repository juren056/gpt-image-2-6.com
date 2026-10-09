export type QwenLanding = {
  slug: string;
  title: string;
  description: string;
  intent: string;
  prompt: string;
  image: string;
  sections: Array<{ title: string; body: string }>;
};

export const QWEN_LANDING_PAGES: QwenLanding[] = [
  {
    slug: 'qwen-image-3-pro',
    title: 'Qwen Image 3 Pro: Capabilities and Online Generator',
    description:
      'Use the verified Qwen Image 3 endpoint for detailed images, multilingual text and structured layouts, with transparent settings and credits.',
    intent:
      'The provider currently describes the configured Qwen Image 3 endpoint as Pro. The product UI does not invent a separate Standard option while no verified Standard endpoint is configured.',
    prompt:
      'Magazine cover titled “MATERIAL FUTURES”, translucent recycled-plastic sculpture, precise three-column editorial grid, one subtitle and issue date, clean studio light.',
    image: '/imgs/seo/prompt-case-board.webp',
    sections: [
      {
        title: 'Where Pro is useful',
        body: 'Use it for poster concepts, editorial layouts, product campaigns and images where visible text and composition both matter.',
      },
      {
        title: 'Settings that are real',
        body: 'The live endpoint supports prompts up to 5,000 characters, negative prompts, prompt expansion, seed, common aspect ratios and one or more outputs. The public trial is intentionally limited to one output.',
      },
      {
        title: 'What to verify',
        body: 'Proofread every visible word, inspect hands and product geometry, and treat factual diagrams as drafts until a human checks the content.',
      },
    ],
  },
  {
    slug: 'qwen-image-3-image-to-image',
    title: 'Qwen Image 3 Image-to-Image Workflow',
    description:
      'Transform a reference image with clear natural-language instructions while naming the product, text and composition that must remain unchanged.',
    intent:
      'Image-to-image is best for directed changes: a new background, revised lighting, a style shift or a campaign treatment anchored to a source image.',
    prompt:
      'Replace only the background with a premium black studio set. Keep the bottle, cap, label text, perspective and crop unchanged.',
    image: '/imgs/seo/ecommerce-campaign-board.webp',
    sections: [
      {
        title: 'Reference order matters',
        body: 'The editor accepts up to three references. Put the main image first and refer to image 1, image 2 and image 3 explicitly when their roles differ.',
      },
      {
        title: 'Write preserve clauses',
        body: 'A useful editing instruction says what changes and what does not. Name logos, label text, proportions, camera angle and crop when they are important.',
      },
      {
        title: 'Review the result',
        body: 'Compare the output and source at full size. Small text, fine edges and identity-critical geometry deserve special attention.',
      },
    ],
  },
  {
    slug: 'qwen-image-3-infographic-generator',
    title: 'Qwen Image 3 Infographic Generator',
    description:
      'Draft clear process diagrams, educational graphics and information layouts with short labels, numbered structure and explicit visual hierarchy.',
    intent:
      'Use Qwen Image 3 to explore an infographic layout quickly, then verify every fact, number, arrow and label before publishing.',
    prompt:
      'Five-step circular infographic explaining the water cycle: evaporation, condensation, precipitation, collection and return flow. Short exact labels, blue palette, white background.',
    image: '/imgs/seo/controlled-comparison.webp',
    sections: [
      {
        title: 'Keep the information finite',
        body: 'Specify the exact number of nodes and keep labels short. Dense paragraphs are less reliable than a small structured sequence.',
      },
      {
        title: 'Describe relationships',
        body: 'State whether the flow is linear, circular or branching, and specify arrow direction instead of asking for a generic infographic.',
      },
      {
        title: 'Validate facts separately',
        body: 'An image model creates pixels, not verified research. Check data and rebuild critical labels as editable text.',
      },
    ],
  },
  {
    slug: 'qwen-image-3-text-generator',
    title: 'Qwen Image 3 Text and Typography Generator',
    description:
      'Create poster headlines, packaging concepts and multilingual display typography with exact quoted text and deliberate layout instructions.',
    intent:
      'Short, high-contrast text with a defined hierarchy is the most practical starting point for text rendering.',
    prompt:
      'Vertical poster with exact headline “MAKE ROOM FOR IDEAS” and caption “Studio Notes 04”. Black type, warm ivory paper, cobalt square, no other lettering.',
    image: '/imgs/seo/text-rendering-case.webp',
    sections: [
      {
        title: 'Quote exact copy',
        body: 'Put every required line in quotation marks and explicitly forbid extra captions, logos and pseudo-text.',
      },
      {
        title: 'Use a simple hierarchy',
        body: 'One headline, one subtitle and generous spacing are easier to inspect than a crowded page of body copy.',
      },
      {
        title: 'Proofread at full size',
        body: 'Typography generation is visual drafting. Replace legal, pricing or brand-critical text in a design tool when exactness is required.',
      },
    ],
  },
  {
    slug: 'qwen-image-3-product-photo-generator',
    title: 'Qwen Image 3 Product Photo Generator',
    description:
      'Create studio packshots and advertising concepts with explicit material, light, camera and contact-shadow direction.',
    intent:
      'Text-to-image works for product concepts; the editor is the safer route when an existing SKU must stay recognizable.',
    prompt:
      'Minimal skincare bottle on pale limestone, soft north-window light, realistic translucent cap, grounded shadow, premium e-commerce packshot, no props or extra text.',
    image: '/imgs/showcase/cobalt-perfume.webp',
    sections: [
      {
        title: 'Describe materials',
        body: 'Name glass, brushed metal, paper, ceramic or translucent plastic so highlights and reflections have a physical target.',
      },
      {
        title: 'Ground the product',
        body: 'Ask for a realistic contact shadow and specify the camera height and lens feel to avoid a floating object.',
      },
      {
        title: 'Preserve real products',
        body: 'Upload a source image and use the editor when exact shape, packaging and label placement matter.',
      },
    ],
  },
  {
    slug: 'qwen-image-3-poster-generator',
    title: 'Qwen Image 3 Poster Generator',
    description:
      'Generate poster concepts with exact headlines, controlled grids, deliberate hierarchy and image-first compositions.',
    intent:
      'Poster prompts work better when they define the copy, format, focal image, palette and hierarchy instead of naming only a style.',
    prompt:
      'A3 exhibition poster. Exact title “OBJECT / MEMORY”. One chrome chair, black background, acid-green rule, small date “08—24 OCT”, strict Swiss grid, no extra words.',
    image: '/imgs/seo/prompt-case-board.webp',
    sections: [
      {
        title: 'Lock the format first',
        body: 'Choose a portrait or landscape ratio before writing the composition so the prompt matches the final placement.',
      },
      {
        title: 'Provide exact text',
        body: 'Quote required lines and ask for no extra words. Keep the first run to a headline and one supporting line.',
      },
      {
        title: 'Separate concept from final art',
        body: 'Use the generated poster as a direction, then proofread and rebuild production-critical copy when needed.',
      },
    ],
  },
  {
    slug: 'qwen-image-3-standard-vs-pro',
    title: 'Qwen Image 3 Standard vs Pro: What Is Actually Available?',
    description:
      'A transparent comparison of Qwen Image 3 labels, verified endpoints and the criteria needed for a fair Standard-versus-Pro test.',
    intent:
      'Only the verified Qwen Image 3 endpoint is enabled here. No fabricated Standard results, speed claims or scores are published.',
    prompt:
      'Bilingual perfume poster titled “NIGHT BLOOM / 夜花”, one bottle, three benefit labels, two-column grid, dark studio lighting.',
    image: '/imgs/seo/controlled-comparison.webp',
    sections: [
      {
        title: 'Compare controlled inputs',
        body: 'Use the same prompt, ratio, output count and seed where supported. Change only the endpoint.',
      },
      {
        title: 'Inspect useful criteria',
        body: 'Review text accuracy, product geometry, layout adherence, fine detail, provider-reported latency and current cost.',
      },
      {
        title: 'Why there is no winner yet',
        body: 'A comparison without two simultaneously verified endpoints and paired outputs would be marketing fiction. The UI therefore shows only the working option.',
      },
    ],
  },
];

export function getQwenLandingPage(slug: string) {
  return QWEN_LANDING_PAGES.find((page) => page.slug === slug);
}
