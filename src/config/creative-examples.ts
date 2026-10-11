export type CreativeExample = {
  exampleId: string;
  publicAsset: string;
  inputAsset?: string;
  modelId?: string;
  toolSlug?: string;
  promptOrRecipe: string;
  parameters: Record<string, string | number | boolean>;
  sourceType: 'verified-site-output' | 'site-owned-illustration';
  generatedAt?: string;
  authorization: 'site-owned';
};

/**
 * Public example provenance. Illustrations are never labelled as output from a
 * model unless a retained task record verifies that exact model and asset.
 */
export const CREATIVE_EXAMPLES: readonly CreativeExample[] = [
  {
    exampleId: 'banana-21-brief-illustration',
    publicAsset: '/imgs/showcase/cobalt-perfume.webp',
    modelId: 'nano-banana-2.1',
    promptOrRecipe:
      'A product brief illustration, not a verified Nano Banana 2.1 output.',
    parameters: { mode: 'preview', aspect_ratio: '1:1' },
    sourceType: 'site-owned-illustration',
    authorization: 'site-owned',
  },
  {
    exampleId: 'flare-campaign-concept',
    publicAsset: '/imgs/tools/ai-poster-showcase.webp',
    modelId: 'gpt-image-2.5-flare',
    promptOrRecipe:
      'A refined launch campaign key visual with controlled typography-safe negative space.',
    parameters: { mode: 'generate', ratio: '16:9', quality: 'high' },
    sourceType: 'site-owned-illustration',
    authorization: 'site-owned',
  },
  {
    exampleId: 'sunburst-visual-exploration',
    publicAsset: '/imgs/showcase/cliff-library.webp',
    modelId: 'gpt-image-2.5-sunburst',
    promptOrRecipe:
      'A serene cliffside library at golden hour with cinematic depth and quiet detail.',
    parameters: { mode: 'generate', ratio: '16:9', quality: 'medium' },
    sourceType: 'site-owned-illustration',
    authorization: 'site-owned',
  },
  {
    exampleId: 'banana-reference-scene',
    publicAsset: '/imgs/showcase/ceramic-artist.webp',
    modelId: 'nano-banana-2',
    promptOrRecipe:
      'Preserve the subject while changing the surrounding scene to a warm artisan studio.',
    parameters: { mode: 'edit', references: 1, ratio: '4:3' },
    sourceType: 'site-owned-illustration',
    authorization: 'site-owned',
  },
  {
    exampleId: 'banana-25-workspace-preview',
    publicAsset: '/imgs/seo/controlled-comparison.webp',
    modelId: 'nano-banana-2.5',
    promptOrRecipe:
      'Prepare a controlled product campaign with consistent subject identity and editable negative space.',
    parameters: { mode: 'preview', ratio: '16:9', api: 'pending' },
    sourceType: 'site-owned-illustration',
    authorization: 'site-owned',
  },
  {
    exampleId: 'banana-lite-night-scene',
    publicAsset: '/imgs/showcase/midnight-train.webp',
    modelId: 'nano-banana-2-lite',
    promptOrRecipe:
      'A tiny night train crossing a misty bridge, readable silhouette and deep blue palette.',
    parameters: { mode: 'generate', ratio: '16:9' },
    sourceType: 'site-owned-illustration',
    authorization: 'site-owned',
  },
  {
    exampleId: 'banana-pro-product-scene',
    publicAsset: '/imgs/tools/ai-product-photo-showcase.webp',
    inputAsset: '/imgs/showcase/cobalt-perfume.webp',
    modelId: 'nano-banana-pro',
    promptOrRecipe:
      'Preserve the supplied product and build a premium studio composition around it.',
    parameters: { mode: 'edit', references: 1, ratio: '1:1' },
    sourceType: 'site-owned-illustration',
    authorization: 'site-owned',
  },
  {
    exampleId: 'seedream-editorial-product',
    publicAsset: '/imgs/showcase/cobalt-perfume.webp',
    modelId: 'seedream-5-pro',
    promptOrRecipe:
      'A premium cobalt perfume bottle on warm ivory stone with soft studio light.',
    parameters: { mode: 'generate', ratio: '1:1', quality: 'high' },
    sourceType: 'site-owned-illustration',
    authorization: 'site-owned',
  },
  {
    exampleId: 'flux-art-direction-board',
    publicAsset: '/imgs/generated/feature-styles-1783598714340.png',
    modelId: 'flux-2-pro',
    promptOrRecipe:
      'A controlled visual style board with consistent geometry, palette, and spacing.',
    parameters: { mode: 'generate', ratio: '16:10' },
    sourceType: 'site-owned-illustration',
    authorization: 'site-owned',
  },
  {
    exampleId: 'product-campaign-board',
    publicAsset: '/imgs/seo/ecommerce-campaign-board.webp',
    toolSlug: 'product-image-set-generator',
    promptOrRecipe: 'Product cutout to campaign layout workflow illustration',
    parameters: { ratio: '16:10' },
    sourceType: 'site-owned-illustration',
    authorization: 'site-owned',
  },
  {
    exampleId: 'poster-showcase',
    publicAsset: '/imgs/tools/ai-poster-showcase.webp',
    toolSlug: 'ai-poster-generator',
    promptOrRecipe: 'Poster visual with separately editable headline intent',
    parameters: { ratio: '16:10' },
    sourceType: 'site-owned-illustration',
    authorization: 'site-owned',
  },
  {
    exampleId: 'vector-style-board',
    publicAsset: '/imgs/generated/feature-styles-1783598714340.png',
    toolSlug: 'image-to-svg',
    promptOrRecipe: 'Raster-to-vector workflow illustration',
    parameters: { output: 'svg' },
    sourceType: 'site-owned-illustration',
    authorization: 'site-owned',
  },
] as const;
