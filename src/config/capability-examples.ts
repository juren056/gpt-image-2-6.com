import { envConfigs } from '@/config';
import type { BananaGeneratorSelection } from '@/lib/banana-generator-navigation';

/** Original illustrative artwork, independent of paid generation history. */
export const CAPABILITY_EXAMPLES = [
  {
    id: 'shoe',
    image: '/images/capabilities/shoe-20261012.webp',
    mode: 'generate',
    scene: 'product',
    prompt:
      'Create a premium studio campaign photograph of one unbranded banana-yellow woven running shoe with a black sole, floating diagonally above charcoal stone pedestals. Show the whole shoe, realistic laces and material detail, sculptural side light and a believable shadow. A dark backdrop with warm yellow light. No text or logo.',
  },
  {
    id: 'serum',
    image: '/images/capabilities/serum-pair-20261012.webp',
    reference: '/images/capabilities/serum-source-20261012.webp',
    mode: 'edit',
    scene: 'product',
    prompt:
      'Use the supplied ivory serum bottle photograph. Preserve its cylindrical silhouette, black pump, ivory finish and the exact label "DAILY SERUM". Replace only the scene with dark stone and draped golden-yellow satin, a botanical shadow and warm commercial side lighting. Keep the bottle fully visible. Produce one photograph, not a comparison grid. Check the label spelling.',
  },
  {
    id: 'photographer',
    image: '/images/capabilities/photographer-scenes-20261012.webp',
    reference: '/images/capabilities/photographer-source-20261012.webp',
    mode: 'edit',
    scene: 'character',
    prompt:
      'Use the adult male photographer in the supplied reference. Keep his face, short swept dark hair, charcoal overshirt, cream T-shirt, mustard-yellow camera strap and black camera recognizable. Create a three-panel cinematic storyboard of him in a daylight studio, on a city pavement and browsing a bookshop. Keep identity and clothing consistent, with natural hands and realistic photography. No text or logo. Check each face after generation.',
  },
  {
    id: 'poster',
    image: '/images/capabilities/fresh-ideas-20261012.webp',
    mode: 'generate',
    scene: 'poster',
    prompt:
      'Design an original black-and-yellow creative event poster mounted on a pale plaster wall. Exact large headline: "FRESH IDEAS". Exact smaller lines: "CREATIVE NIGHT" and "24 OCTOBER". Use confident condensed sans-serif typography, generous spacing and a photoreal sculptural folded yellow fabric ribbon. Show the entire poster with margins. No other words or logo. Proofread every letter and the date.',
  },
] as const;

export function capabilityExampleSelection(
  example: (typeof CAPABILITY_EXAMPLES)[number]
): BananaGeneratorSelection {
  return {
    model: 'nano-banana-2.1',
    mode: example.mode,
    prompt: example.prompt,
    aspectRatio: '3:2',
    scene: example.scene,
    focus: 'prompt',
    imageUrls:
      'reference' in example
        ? [new URL(example.reference, envConfigs.app_url).href]
        : [],
  };
}
