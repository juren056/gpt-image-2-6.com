export type GuideKind =
  | 'prompts'
  | 'api'
  | 'comfyui'
  | 'comparison'
  | 'open_source'
  | 'text_rendering'
  | 'ecommerce';

export type GuideCategory = 'creator' | 'technical' | 'research';

export type GuideCatalogItem = {
  kind: GuideKind;
  path: string;
  image: string;
  category: GuideCategory;
};

export const GUIDE_CATALOG: GuideCatalogItem[] = [
  {
    kind: 'prompts',
    path: '/qwen-image-3-prompts',
    image: '/imgs/seo/prompt-case-board.webp',
    category: 'creator',
  },
  {
    kind: 'text_rendering',
    path: '/qwen-image-3-text-rendering',
    image: '/imgs/seo/text-rendering-case.webp',
    category: 'creator',
  },
  {
    kind: 'ecommerce',
    path: '/qwen-image-3-for-ecommerce',
    image: '/imgs/seo/ecommerce-campaign-board.webp',
    category: 'creator',
  },
  {
    kind: 'api',
    path: '/qwen-image-3-api',
    image: '/imgs/seo/api-workflow.webp',
    category: 'technical',
  },
  {
    kind: 'comfyui',
    path: '/qwen-image-3-comfyui',
    image: '/imgs/seo/comfyui-workflow.webp',
    category: 'technical',
  },
  {
    kind: 'open_source',
    path: '/qwen-image-3-open-source',
    image: '/imgs/seo/open-source-verification.webp',
    category: 'technical',
  },
  {
    kind: 'comparison',
    path: '/qwen-image-3-vs-qwen-image-2',
    image: '/imgs/seo/controlled-comparison.webp',
    category: 'research',
  },
];

export const GUIDE_PATHS = Object.fromEntries(
  GUIDE_CATALOG.map(({ kind, path }) => [kind, path])
) as Record<GuideKind, string>;

export const GUIDE_IMAGES = Object.fromEntries(
  GUIDE_CATALOG.map(({ kind, image }) => [kind, image])
) as Record<GuideKind, string>;
