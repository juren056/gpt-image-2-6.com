import type { CreativeModelId } from '@/config/creative-studio';

type GeneratorStep = { title: string; description: string };
type GeneratorFaq = { question: string; answer: string };

export type GptImageOpportunityKind =
  | 'comparison'
  | 'product-photo'
  | 'poster'
  | 'four-k'
  | 'api-pricing';

export type GptImageOpportunity = {
  path: string;
  title: string;
  metaTitle: string;
  description: string;
  eyebrow: string;
  image: string;
  imageAlt: string;
  defaultModel: CreativeModelId;
  initialMode: 'generate' | 'edit';
  initialPrompt: string;
  badges: string[];
  sectionTitle: string;
  sectionDescription: string;
  outcomes: GeneratorStep[];
  steps: GeneratorStep[];
  tips: string[];
  limitation: string;
  faqs: GeneratorFaq[];
};

export const GPT_IMAGE_OPPORTUNITIES: Record<
  GptImageOpportunityKind,
  GptImageOpportunity
> = {
  comparison: {
    path: '/gpt-image-2-5-flare-vs-sunburst',
    title: 'GPT Image 2.5 Flare vs Sunburst',
    metaTitle: 'GPT Image 2.5 Flare vs Sunburst: Compare & Test Both',
    description:
      'Compare GPT Image 2.5 Flare and Sunburst by speed, editing precision, quality controls, and workflow. Then test either model in the same generator.',
    eyebrow: 'Model decision guide',
    image: '/imgs/seo/controlled-comparison.webp',
    imageAlt:
      'A controlled side-by-side image workflow for comparing Flare and Sunburst',
    defaultModel: 'gpt-image-2.5-flare',
    initialMode: 'generate',
    initialPrompt:
      'A premium citrus drink campaign on pale stone, controlled studio light, condensation, realistic label typography, clean commercial composition',
    badges: [
      'Flare for fast iteration',
      'Sunburst for precise editing',
      'Same official token rates',
    ],
    sectionTitle: 'Choose the model around the cost of a wrong result',
    sectionDescription:
      'Flare is the faster everyday option. Sunburst is the more capable option when editing precision matters most. Use the same brief and references when comparing them.',
    outcomes: [
      {
        title: 'Fast concept loops',
        description:
          'Use Flare when you need several directions, compositions, or campaign sketches quickly.',
      },
      {
        title: 'Careful revisions',
        description:
          'Use Sunburst when a reference image, product detail, or localized edit must survive the change.',
      },
      {
        title: 'A fair comparison',
        description:
          'Lock the prompt, references, shape, and quality tier before judging output differences.',
      },
    ],
    steps: [
      {
        title: 'Write one acceptance brief',
        description:
          'Describe the subject, composition, text, and details that must remain unchanged.',
      },
      {
        title: 'Run Flare first',
        description:
          'Use the faster model to establish a viable direction and expose weaknesses in the brief.',
      },
      {
        title: 'Repeat with Sunburst',
        description:
          'Keep the input stable and compare adherence, small details, and edit precision.',
      },
      {
        title: 'Choose by failure cost',
        description:
          'Prefer speed for exploration and precision when another revision would cost more than the slower run.',
      },
    ],
    tips: [
      'Compare at the same quality setting.',
      'Use identical reference images and ordering.',
      'Judge text and product geometry at full size.',
      'Record which model wins for each repeatable task.',
    ],
    limitation:
      'A single sample does not establish a universal winner. Image generation is probabilistic, and latency varies with quality, prompt complexity, and service load.',
    faqs: [
      {
        question: 'What is the main difference between Flare and Sunburst?',
        answer:
          'OpenAI describes Flare as its fastest model for high-quality everyday image generation and Sunburst as its most capable model, especially where editing precision matters.',
      },
      {
        question: 'Is Flare cheaper than Sunburst in the official API?',
        answer:
          'The current official model pages list the same per-token rates for both. Real task cost still depends on token use and selected quality.',
      },
      {
        question: 'Do both models support image editing?',
        answer:
          'Yes. Both accept text and image inputs and support image generation and image editing endpoints.',
      },
      {
        question: 'Which model should I use for product edits?',
        answer:
          'Start with Sunburst when preservation and editing precision are the priority. Flare is useful for faster visual exploration.',
      },
    ],
  },
  'product-photo': {
    path: '/gpt-image-2-5-product-photo-editor',
    title: 'GPT Image 2.5 Product Photo Editor',
    metaTitle: 'GPT Image 2.5 Product Photo Editor – Edit Product Images',
    description:
      'Upload a product photo, describe the new setting, and edit it with GPT Image 2.5 Sunburst while keeping product geometry, labels, and brand details explicit.',
    eyebrow: 'Commerce image workflow',
    image: '/imgs/tools/ai-product-photo-showcase.webp',
    imageAlt:
      'Product photo variations arranged for a consistent ecommerce campaign',
    defaultModel: 'gpt-image-2.5-sunburst',
    initialMode: 'edit',
    initialPrompt:
      'Keep the product shape, label, logo, cap, and colors unchanged. Replace only the background with warm limestone, soft left studio light, a natural contact shadow, and a clean premium ecommerce composition.',
    badges: [
      'Reference-led editing',
      'Label preservation brief',
      'Commercial scene variations',
    ],
    sectionTitle: 'Edit the scene without losing the product',
    sectionDescription:
      'A useful product edit must preserve the SKU, packaging, label hierarchy, proportions, and claim text buyers rely on.',
    outcomes: [
      {
        title: 'Marketplace-ready scenes',
        description:
          'Create clean studio, white-background, and contextual variants from one approved source photo.',
      },
      {
        title: 'Campaign consistency',
        description:
          'Reuse the same lighting, surface, camera angle, and negative constraints across a product set.',
      },
      {
        title: 'Fewer hidden changes',
        description:
          'State exactly which label, logo, color, cap, and geometry details must remain untouched.',
      },
    ],
    steps: [
      {
        title: 'Upload the approved source',
        description:
          'Use the sharpest product image available and avoid compressed screenshots.',
      },
      {
        title: 'Separate keep and change',
        description:
          'List protected product details first, then describe only the scene change.',
      },
      {
        title: 'Generate one controlled edit',
        description:
          'Inspect the label, edges, reflections, color, and contact shadow.',
      },
      {
        title: 'Build the image set',
        description:
          'Reuse the accepted art direction while changing one scene variable at a time.',
      },
    ],
    tips: [
      'Name every product detail that must not change.',
      'Quote exact visible label text.',
      'Ask for a natural contact shadow, not a floating pack.',
      'Compare output color against the source before publishing.',
    ],
    limitation:
      'AI edits can invent label text, alter logos, or change product geometry. Complete a human product-accuracy review before advertising or listing an output.',
    faqs: [
      {
        question: 'Can GPT Image 2.5 edit an existing product photo?',
        answer:
          'Yes. This workflow accepts reference images and starts with Sunburst because OpenAI positions it for editing precision.',
      },
      {
        question: 'How do I keep the product unchanged?',
        answer:
          'List the protected geometry, colors, logo, label text, cap, materials, and camera angle before describing the scene change.',
      },
      {
        question: 'Can I use the result on an ecommerce listing?',
        answer:
          'Review it against the physical product and marketplace rules first. Do not publish invented claims or misleading details.',
      },
      {
        question: 'Why does this page start in Edit mode?',
        answer:
          'The primary intent is to transform an approved source product photo, so the reference uploader is shown first.',
      },
    ],
  },
  poster: {
    path: '/gpt-image-2-5-poster-generator',
    title: 'GPT Image 2.5 Poster Generator',
    metaTitle: 'GPT Image 2.5 Poster Generator – Create Poster Concepts',
    description:
      'Create poster concepts with GPT Image 2.5 Flare. Define headline, hierarchy, format, imagery, and safe margins, then inspect typography before export.',
    eyebrow: 'Poster design workflow',
    image: '/imgs/tools/ai-poster-showcase.webp',
    imageAlt:
      'A collection of vivid poster concepts with clear headline hierarchy',
    defaultModel: 'gpt-image-2.5-flare',
    initialMode: 'generate',
    initialPrompt:
      'Vertical event poster for an independent design festival. Headline: “MAKE THE SIGNAL”. Bold editorial typography, cobalt and warm orange palette, geometric image system, clear date and venue area, generous safe margins.',
    badges: [
      'Headline-first prompt',
      'Vertical and landscape shapes',
      'Fast concept iteration',
    ],
    sectionTitle: 'Design the information hierarchy before the decoration',
    sectionDescription:
      'A poster needs a readable message at a distance. Lock the headline, event information, format, and safe areas before asking for visual style.',
    outcomes: [
      {
        title: 'Campaign concepts',
        description:
          'Explore distinct art directions quickly while keeping the event message stable.',
      },
      {
        title: 'Format-aware layouts',
        description:
          'Choose a vertical, landscape, or square shape that matches the placement.',
      },
      {
        title: 'A production brief',
        description:
          'Use the output as visual direction, then verify critical text in a design editor.',
      },
    ],
    steps: [
      {
        title: 'Write the message',
        description:
          'Set one headline, one supporting line, and essential date or venue information.',
      },
      {
        title: 'Choose a hierarchy',
        description:
          'Describe which line dominates and where the information block should sit.',
      },
      {
        title: 'Add art direction',
        description:
          'Specify palette, imagery, print texture, era, and negative space.',
      },
      {
        title: 'Proof every character',
        description:
          'Check names, dates, prices, and legal text before publishing.',
      },
    ],
    tips: [
      'Keep generated headline text short.',
      'Put exact copy in quotation marks.',
      'Reserve safe margins for cropping.',
      'Generate the visual system before dense event details.',
    ],
    limitation:
      'Generated typography may contain spelling or layout errors. Posters with dates, prices, legal terms, addresses, or sponsor marks require manual proofreading.',
    faqs: [
      {
        question: 'Can GPT Image 2.5 create text inside a poster?',
        answer:
          'It can attempt rendered text, but critical copy must be proofread. Short headlines are more practical than dense schedules.',
      },
      {
        question: 'Which model does this poster generator use?',
        answer: 'It opens with GPT Image 2.5 Flare for fast concept iteration.',
      },
      {
        question: 'Can I make a vertical poster?',
        answer:
          'Yes. Choose a portrait output shape and describe the hierarchy and safe margins.',
      },
      {
        question: 'Should I publish the generated poster directly?',
        answer:
          'Verify all text, rights, logos, dates, prices, and output dimensions first.',
      },
    ],
  },
  'four-k': {
    path: '/gpt-image-2-5-4k-generator',
    title: 'GPT Image 2.5 4K Generator',
    metaTitle: 'GPT Image 2.5 4K Generator – High-Resolution Workflow',
    description:
      'Build a high-resolution GPT Image 2.5 workflow: generate the composition, inspect details, then upscale and verify a true 4K export.',
    eyebrow: 'High-resolution workflow',
    image: '/imgs/seo/controlled-comparison.webp',
    imageAlt:
      'A close detail inspection used before preparing a high-resolution export',
    defaultModel: 'gpt-image-2.5-sunburst',
    initialMode: 'generate',
    initialPrompt:
      'Wide cinematic coastal observatory at blue hour, crisp architectural materials, layered atmosphere, realistic practical lighting, restrained color grade, fine foreground detail, no text.',
    badges: [
      'Generate first',
      'Upscale second',
      'Verify actual pixel dimensions',
    ],
    sectionTitle: 'Treat 4K as a measurable delivery requirement',
    sectionDescription:
      '“4K” describes pixel dimensions, not a style. Create the right image, then upscale it to the required canvas and inspect the export at 100%.',
    outcomes: [
      {
        title: 'A strong source frame',
        description:
          'Solve composition and reject errors before any enlargement.',
      },
      {
        title: 'A real 4K file',
        description:
          'Upscale to the target size and verify downloaded pixel dimensions.',
      },
      {
        title: 'Detail-level review',
        description:
          'Inspect faces, text, repeated structures, edges, and texture after enlargement.',
      },
    ],
    steps: [
      {
        title: 'Generate the composition',
        description:
          'Choose the final aspect ratio and solve subject, camera, light, and space.',
      },
      {
        title: 'Inspect the source',
        description:
          'Reject visual errors before spending time on enlargement.',
      },
      {
        title: 'Upscale the accepted image',
        description: 'Use the image upscaler to reach the required 4K canvas.',
      },
      {
        title: 'Verify the export',
        description:
          'Confirm pixel dimensions, crop, sharpness, and compression.',
      },
    ],
    tips: [
      'Define the final aspect ratio before generation.',
      'Avoid tiny text before enlargement.',
      'Inspect repeated patterns and faces at 100%.',
      'Keep the source for future reprocessing.',
    ],
    limitation:
      'This page does not claim every GPT Image 2.5 response is native 4K. The final deliverable may require a separate upscale, which cannot reliably repair a flawed source.',
    faqs: [
      {
        question: 'Does GPT Image 2.5 always generate native 4K images?',
        answer:
          'Do not assume that from a model name or quality label. Verify actual output dimensions; this workflow separates generation from upscaling.',
      },
      {
        question: 'What does 4K mean for an image?',
        answer:
          'It is a pixel-dimension target, commonly around 3840 pixels on the long horizontal edge for UHD.',
      },
      {
        question: 'Which model is selected here?',
        answer:
          'Sunburst is selected for a detail-focused source image. Final size is verified after download.',
      },
      {
        question: 'Where do I upscale the result?',
        answer:
          'Use the site’s AI Image Upscaler, then inspect the exported dimensions and detail.',
      },
    ],
  },
  'api-pricing': {
    path: '/gpt-image-2-5-api-pricing',
    title: 'GPT Image 2.5 API Pricing',
    metaTitle: 'GPT Image 2.5 API Pricing: Flare vs Sunburst Costs',
    description:
      'See the official GPT Image 2.5 Flare and Sunburst token rates, understand what changes real image cost, and test the workflow with visible site credits.',
    eyebrow: 'Developer cost guide',
    image: '/imgs/seo/api-workflow.webp',
    imageAlt:
      'An image API workflow showing inputs, model processing, review, and delivery',
    defaultModel: 'gpt-image-2.5-flare',
    initialMode: 'generate',
    initialPrompt:
      'Minimal product launch key visual, translucent glass object, controlled gradient background, precise reflections, generous negative space for campaign copy',
    badges: [
      '$5 / 1M text input tokens',
      '$8 / 1M image input tokens',
      '$30 / 1M image output tokens',
    ],
    sectionTitle: 'Estimate the whole workflow, not just one token rate',
    sectionDescription:
      'The official pages currently list matching rates for Flare and Sunburst. Actual spend changes with token use, input images, quality, retries, and candidate count.',
    outcomes: [
      {
        title: 'Comparable rates',
        description:
          'Use the same official rate card as the starting point for both models.',
      },
      {
        title: 'Task-level budgeting',
        description:
          'Measure prompt, reference input, output, retries, storage, and delivery separately.',
      },
      {
        title: 'Visible site billing',
        description:
          'This generator shows its credit quote before submission; credits are not API tokens.',
      },
    ],
    steps: [
      {
        title: 'Choose the workflow',
        description:
          'Separate generation, editing, exploration, and final rendering.',
      },
      {
        title: 'Fix the quality policy',
        description:
          'Decide when low or medium is enough and when xhigh or max is justified.',
      },
      {
        title: 'Measure accepted outputs',
        description:
          'Track cost per approved asset, not only cost per API request.',
      },
      {
        title: 'Add operational costs',
        description:
          'Include moderation, storage, failed jobs, support, and bandwidth.',
      },
    ],
    tips: [
      'Date every pricing snapshot.',
      'Keep API tokens separate from site credits.',
      'Budget retries by task type.',
      'Use lower quality for exploration and maximum quality selectively.',
    ],
    limitation:
      'Prices and model behavior can change. These rates are a dated official snapshot, not a guaranteed invoice calculator. Check provider documentation before purchasing.',
    faqs: [
      {
        question: 'What are the current GPT Image 2.5 API token rates?',
        answer:
          'As checked on September 29, 2026, both official pages list $5 per million text input tokens, $1.25 cached text input, $8 image input, $2 cached image input, and $30 image output.',
      },
      {
        question: 'Is Sunburst more expensive than Flare?',
        answer:
          'The official pages currently list the same token rates. Total task cost can still differ because token use and retry behavior differ.',
      },
      {
        question: 'Can I calculate an exact image price from the rate card?',
        answer:
          'Not from headline rates alone. You need actual token use, quality, inputs, output, and retries. OpenAI notes its GPT Image 2 calculator does not estimate GPT Image 2.5 token use.',
      },
      {
        question: 'Are AI Image Studio credits the same as API tokens?',
        answer:
          'No. Site credits are the billing unit shown before a run; API tokens are the provider’s underlying unit.',
      },
    ],
  },
};

export const GPT_IMAGE_RELATED = [
  {
    href: '/gpt-image-2-5-flare-vs-sunburst',
    title: 'Flare vs Sunburst',
    description: 'Choose between fast iteration and editing precision.',
    image: '/imgs/seo/controlled-comparison.webp',
  },
  {
    href: '/gpt-image-2-5-product-photo-editor',
    title: 'Product Photo Editor',
    description: 'Preserve product details while changing the scene.',
    image: '/imgs/tools/ai-product-photo-showcase.webp',
  },
  {
    href: '/gpt-image-2-5-poster-generator',
    title: 'Poster Generator',
    description: 'Build headline-led campaign concepts.',
    image: '/imgs/tools/ai-poster-showcase.webp',
  },
  {
    href: '/gpt-image-2-5-4k-generator',
    title: '4K Workflow',
    description: 'Generate, upscale, and verify the final dimensions.',
    image: '/imgs/seo/controlled-comparison.webp',
  },
  {
    href: '/gpt-image-2-5-api-pricing',
    title: 'API Pricing',
    description: 'Understand official rates and real workflow cost.',
    image: '/imgs/seo/api-workflow.webp',
  },
] as const;
