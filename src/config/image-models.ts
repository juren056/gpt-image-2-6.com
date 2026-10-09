export type ImageModelProvider = 'fal';

export type ImageModelAvailability = 'enabled' | 'disabled';

export type ImageModelDefinition = {
  id: string;
  provider: ImageModelProvider;
  label: string;
  availability: ImageModelAvailability;
  enabled: boolean;
  credits: number | null;
};

export const IMAGE_MODEL_IDS = { fluxPro: 'fal-ai/flux-2-pro' } as const;
export const IMAGE_GENERATION_COST = 8;
export const IMAGE_EDIT_COST = 10;
export const IMAGE_EDIT_MODEL_ID = 'fal-ai/flux-2-pro/edit';
export const IMAGE_MAX_PROMPT_LENGTH = 10000;
export const DEFAULT_IMAGE_MODEL_ID = IMAGE_MODEL_IDS.fluxPro;
export const SIMPLE_TOOL_IMAGE_MODEL_ID = DEFAULT_IMAGE_MODEL_ID;
export const IMAGE_MODELS: readonly ImageModelDefinition[] = [
  {
    id: DEFAULT_IMAGE_MODEL_ID,
    provider: 'fal',
    label: 'FLUX.2 [pro]',
    availability: 'enabled',
    enabled: true,
    credits: IMAGE_GENERATION_COST,
  },
];

export const ALLOWED_IMAGE_SIZES = [
  'square_hd',
  'landscape_4_3',
  'landscape_16_9',
  'portrait_4_3',
  'portrait_16_9',
] as const;

export function findImageModel(modelId: string) {
  return IMAGE_MODELS.find((model) => model.id === modelId);
}

export function requireEnabledImageModel(
  modelId: string
): ImageModelDefinition & {
  enabled: true;
  availability: 'enabled';
  credits: number;
} {
  const model = findImageModel(modelId);
  if (!model) {
    throw new Error('Unsupported image model');
  }
  if (
    !model.enabled ||
    model.availability !== 'enabled' ||
    model.credits === null
  ) {
    throw new Error(`${model.label} is disabled for new generations.`);
  }
  return model as ImageModelDefinition & {
    enabled: true;
    availability: 'enabled';
    credits: number;
  };
}

export function sanitizeImageGenerationOptions(
  options?: Record<string, unknown>
): Record<string, unknown> {
  const imageSize = options?.image_size;
  const resolvedImageSize =
    typeof imageSize !== 'string' ||
    !ALLOWED_IMAGE_SIZES.includes(
      imageSize as (typeof ALLOWED_IMAGE_SIZES)[number]
    )
      ? 'square_hd'
      : imageSize;
  const seed = options?.seed;
  const resolvedSeed =
    typeof seed === 'number' &&
    Number.isInteger(seed) &&
    seed >= 0 &&
    seed <= 2_147_483_647
      ? seed
      : undefined;
  return {
    image_size: resolvedImageSize,
    enable_safety_checker: true,
    num_images: 1,
    output_format: 'png',
    ...(resolvedSeed === undefined ? {} : { seed: resolvedSeed }),
  };
}

export function sanitizeImageEditOptions(
  imageUrls: unknown,
  options?: Record<string, unknown>
) {
  if (
    !Array.isArray(imageUrls) ||
    imageUrls.length < 1 ||
    imageUrls.length > 3
  ) {
    throw new Error('Upload between 1 and 3 reference images');
  }
  const urls = imageUrls.map((value) => {
    if (typeof value !== 'string' || value.length > 2048) {
      throw new Error('Invalid reference image URL');
    }
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Invalid reference image URL');
    }
    return value;
  });
  const sanitized = sanitizeImageGenerationOptions(options);
  return {
    ...sanitized,
    image_urls: urls,
  };
}
