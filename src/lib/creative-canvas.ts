import type {
  StudioAsset,
  StudioLayer,
  StudioProjectState,
} from '@/modules/creative-projects/service';

export const EXPORT_PRESETS = [
  { id: 'square', width: 1080, height: 1080 },
  { id: 'portrait', width: 1080, height: 1350 },
  { id: 'story', width: 1080, height: 1920 },
  { id: 'landscape', width: 1200, height: 628 },
] as const;

export const STUDIO_TEMPLATES = [
  {
    id: 'white-product',
    label: 'White product hero',
    prompt:
      'A clean ecommerce hero of {product} on a pure white background, accurate proportions, soft contact shadow',
  },
  {
    id: 'studio-product',
    label: 'Studio product',
    prompt:
      'Premium studio product photography of {product}, {brand} palette, controlled lighting, commercial detail',
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle scene',
    prompt:
      '{product} in an authentic lifestyle setting for {audience}, natural light, realistic scale',
  },
  {
    id: 'ad-square',
    label: 'Square ad',
    prompt:
      'Square advertising key visual for {product}, headline-safe composition, {brand} visual identity',
  },
  {
    id: 'logo',
    label: 'Logo mark',
    prompt:
      'Simple vector-ready logo mark for {brand}, limited colors, no gradients, clean negative space',
  },
  {
    id: 'icon-set',
    label: 'Icon set',
    prompt:
      'Consistent set of six vector-ready icons for {brand}, uniform stroke and visual weight',
  },
] as const;

export function createEmptyStudioState(): StudioProjectState {
  return {
    version: 1,
    canvas: { width: 1080, height: 1080, background: '#ffffff' },
    layers: [],
    assets: [],
  };
}

export function createLayer(
  type: StudioLayer['type'],
  name: string,
  data: Record<string, unknown> = {}
): StudioLayer {
  return {
    id: crypto.randomUUID(),
    type,
    name: name.slice(0, 80),
    visible: true,
    locked: false,
    opacity: 1,
    data,
  };
}

export function appendAsset(
  state: StudioProjectState,
  input: Omit<StudioAsset, 'id' | 'version' | 'createdAt'>
): StudioProjectState {
  const parent = input.parentAssetId
    ? state.assets.find((asset) => asset.id === input.parentAssetId)
    : undefined;
  const asset: StudioAsset = {
    ...input,
    id: crypto.randomUUID(),
    version: (parent?.version || 0) + 1,
    createdAt: new Date().toISOString(),
  };
  return {
    ...state,
    assets: [...state.assets, asset],
    selectedAssetId: asset.id,
  };
}

export function applyTemplate(
  templateId: string,
  values: { product?: string; brand?: string; audience?: string }
) {
  const template = STUDIO_TEMPLATES.find((item) => item.id === templateId);
  if (!template) throw new Error('Unknown template');
  return template.prompt.replace(
    /\{(product|brand|audience)\}/g,
    (_, key: keyof typeof values) => values[key]?.trim() || `[${key}]`
  );
}

/** Browser-safe allowlist sanitizer. It removes active content, external
 * resources and event attributes before the SVG is previewed or exported. */
export function sanitizeSvgMarkup(input: string) {
  if (input.length > 2_000_000) throw new Error('SVG exceeds 2 MB');
  if (!/^\s*<svg[\s>]/i.test(input))
    throw new Error('A real SVG document is required');
  return input
    .replace(
      /<\/?(?:script|foreignObject|iframe|object|embed|audio|video)\b[^>]*>/gi,
      ''
    )
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s(?:href|xlink:href)\s*=\s*(["'])(?!\s*#)[\s\S]*?\1/gi, '')
    .replace(/url\(\s*(["']?)(?!#)[^)]+\)/gi, 'none');
}

export function recolorSvg(input: string, from: string, to: string) {
  if (!/^#[0-9a-f]{3,8}$/i.test(from) || !/^#[0-9a-f]{3,8}$/i.test(to)) {
    throw new Error('SVG colors must be hexadecimal');
  }
  return sanitizeSvgMarkup(input)
    .replaceAll(from, to)
    .replaceAll(from.toLowerCase(), to);
}
