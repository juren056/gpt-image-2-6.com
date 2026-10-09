export const PROMPT_CATEGORIES = [
  'poster',
  'product',
  'typography',
  'infographic',
  'ecommerce',
  'ui',
  'illustration',
  'photography',
  'chinese',
] as const;

export type PromptCategory = (typeof PROMPT_CATEGORIES)[number];

export type StudioPrompt = {
  slug: string;
  title: string;
  category: PromptCategory;
  prompt: string;
  image: string;
  ratio: string;
  resolution: '1K' | '2K';
};

export const STUDIO_PROMPTS: StudioPrompt[] = [
  {
    slug: 'chinese-tea-poster',
    title: 'Chinese tea launch poster',
    category: 'chinese',
    prompt:
      'Design a vertical Chinese tea launch poster. Exact headline: “春山新茶”. Exact subheading: “明前龙井 · 清香回甘”. Pale rice-paper texture, one ceramic cup, restrained ink landscape, clear hierarchy, generous margins, no extra text.',
    image: '/imgs/seo/text-rendering-case.webp',
    ratio: '3:4',
    resolution: '2K',
  },
  {
    slug: 'editorial-type-poster',
    title: 'Editorial typography poster',
    category: 'typography',
    prompt:
      'Create a modern editorial poster with the exact headline “FORM FOLLOWS FEELING” and small caption “Design study 03”. Swiss grid, black type on warm ivory, one cobalt geometric form, crisp kerning, no extra words.',
    image: '/imgs/seo/prompt-case-board.webp',
    ratio: '3:4',
    resolution: '2K',
  },
  {
    slug: 'cobalt-perfume-ad',
    title: 'Cobalt perfume advertisement',
    category: 'product',
    prompt:
      'Premium cobalt-blue perfume bottle on dark slate, precise glass reflections, narrow rim light, soft mist behind the bottle, luxury studio advertising, centered product, label readable, no extra objects.',
    image: '/imgs/showcase/cobalt-perfume.webp',
    ratio: '4:3',
    resolution: '2K',
  },
  {
    slug: 'ecommerce-campaign-grid',
    title: 'E-commerce campaign board',
    category: 'ecommerce',
    prompt:
      'Build a clean e-commerce campaign board for a neutral running shoe: hero product image, two detail crops, three benefit labels, size guide panel and a clear “SHOP THE DROP” callout. White and graphite palette, consistent product geometry.',
    image: '/imgs/seo/ecommerce-campaign-board.webp',
    ratio: '16:9',
    resolution: '2K',
  },
  {
    slug: 'coffee-menu',
    title: 'Minimal café menu',
    category: 'poster',
    prompt:
      'Create an A4 café menu with exact sections “ESPRESSO”, “FILTER”, and “TEA”. Include four short items per section with aligned prices. Warm cream paper, dark brown type, one small line illustration, highly readable, no invented logos.',
    image: '/prompts/prompt-36.jpg',
    ratio: '3:4',
    resolution: '2K',
  },
  {
    slug: 'photosynthesis-diagram',
    title: 'Photosynthesis learning diagram',
    category: 'infographic',
    prompt:
      'Educational diagram explaining photosynthesis for a 12-year-old. Show sunlight, carbon dioxide, water, oxygen and glucose with five numbered arrows, short labels, green and amber palette, white background, accurate simple leaf cross-section.',
    image: '/imgs/seo/controlled-comparison.webp',
    ratio: '16:9',
    resolution: '2K',
  },
  {
    slug: 'finance-dashboard',
    title: 'Finance dashboard UI',
    category: 'ui',
    prompt:
      'Desktop finance dashboard mockup, 1440px canvas, left navigation, monthly revenue chart, four KPI cards, recent transactions table, accessible contrast, calm navy and mint palette, realistic data density, no company logo.',
    image: '/imgs/seo/api-workflow.webp',
    ratio: '16:9',
    resolution: '2K',
  },
  {
    slug: 'storybook-library',
    title: 'Cliffside storybook library',
    category: 'illustration',
    prompt:
      'Detailed storybook illustration of a quiet library carved into a sea cliff at sunrise, tiny readers on wooden bridges, warm window light, layered watercolor texture, calm blue water, wide establishing composition.',
    image: '/imgs/showcase/cliff-library.webp',
    ratio: '16:9',
    resolution: '1K',
  },
  {
    slug: 'ceramic-artist-portrait',
    title: 'Ceramic artist portrait',
    category: 'photography',
    prompt:
      'Environmental portrait of a ceramic artist in a daylight studio, hands resting beside unfinished clay vessels, soft north-window light, natural skin texture, muted earth palette, 50mm documentary photography.',
    image: '/imgs/showcase/ceramic-artist.webp',
    ratio: '4:3',
    resolution: '1K',
  },
];
