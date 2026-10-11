import { envConfigs } from '@/config';
import type { BananaGeneratorSelection } from '@/lib/banana-generator-navigation';

/** Original illustrative assets. These are not user history or model benchmarks. */
export const HOMEPAGE_IMAGE_REVISION = 'creative-refresh-20261011';
export const homepageImage = (id: string) =>
  `/images/banana21/${id}.webp?v=${id === 'case-character' ? 'character-refresh-20261011' : HOMEPAGE_IMAGE_REVISION}`;

export const HOMEPAGE_EXAMPLES = [
  {
    id: 'references',
    imageId: 'feature-references',
    mode: 'edit' as const,
    ratio: '16:9',
    scene: 'portrait',
    prompt:
      "Use the supplied reference montage. Keep the woman's curly hair, face and mustard cardigan, the cream terrier and the matte yellow bottle recognizable. Make one natural lifestyle photograph in a bright oak living room with soft morning light. Remove the reference tiles from the final composition. Preserve realistic hands and the bottle shape.",
  },
  {
    id: 'text',
    imageId: 'feature-text',
    mode: 'generate' as const,
    ratio: '16:9',
    scene: 'poster',
    prompt:
      'Design an original coffee campaign poster. Use a pale ivory paper background, a banana-yellow block, black modern sans-serif lettering and a photoreal yellow espresso cup. Exact headline: "FRESH COFFEE". Exact subheading: "Every morning, made for you". Keep every letter accurate, with generous space around the words. No additional text or logo.',
  },
  {
    id: 'ratios',
    imageId: 'feature-ratios',
    mode: 'generate' as const,
    ratio: '1:1',
    scene: 'product',
    prompt:
      'Photograph a matte yellow reusable water bottle on pale limestone with one green leaf and soft yellow fabric. Natural directional studio light, fine material texture and generous negative space. Keep the entire bottle visible and away from crop edges. No text or logo. Compose this image for the selected aspect ratio.',
  },
  {
    id: 'product',
    imageId: 'case-product',
    mode: 'edit' as const,
    ratio: '16:9',
    scene: 'product',
    prompt:
      'Use the yellow dropper bottle in the supplied reference. Preserve the bottle silhouette, matte yellow finish and black cap. Create one premium product photograph on pale limestone with a small lemon peel and water droplets, warm window light and a botanical shadow. Remove the comparison divider and white-background panel. No added lettering or brand logo.',
  },
  {
    id: 'character',
    imageId: 'case-character',
    mode: 'edit' as const,
    ratio: '16:9',
    scene: 'character',
    prompt:
      'Use the woman in the supplied contact sheet as the character reference. Keep her face, straight dark bob, navy blue jacket and cream top consistent. Create a single cinematic photograph of her sketching beside the window of a quiet cafe in natural daylight. Do not include the four-panel grid or change her identity.',
  },
  {
    id: 'localize',
    imageId: 'case-localize',
    mode: 'edit' as const,
    ratio: '16:9',
    scene: 'poster',
    prompt:
      'Use the supplied packaging example as a reference. Make one cream-and-yellow banana snack pouch with the same silhouette, banana symbol and typography hierarchy. Replace the headline with the exact text "BANANA BITES" and the smaller line with "CRISP & SIMPLE". Preserve spacing and colors. Remove the second pouch. Check all spelling and add no other words.',
  },
  {
    id: 'social',
    imageId: 'case-social',
    mode: 'generate' as const,
    ratio: '9:16',
    scene: 'social',
    prompt:
      'Create a sunny overhead breakfast campaign photograph for a portrait social story. Show a yellow ceramic bowl with yogurt, banana slices and blueberries beside a small yellow mug on ivory linen. Keep the important food details in the central safe area with useful empty space at the top. Natural daylight and realistic food texture, no text or logo.',
  },
] as const;

export function homepageExampleSelection(
  example: (typeof HOMEPAGE_EXAMPLES)[number]
): BananaGeneratorSelection {
  return {
    model: 'nano-banana-2.1',
    mode: example.mode,
    prompt: example.prompt,
    aspectRatio: example.ratio,
    scene: example.scene === 'portrait' ? 'character' : example.scene,
    focus: 'prompt',
    imageUrls:
      example.mode === 'edit'
        ? [new URL(homepageImage(example.imageId), envConfigs.app_url).href]
        : [],
  };
}
