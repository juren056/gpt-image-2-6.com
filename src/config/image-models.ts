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

export const IMAGE_MODEL_IDS = {
  qwen3: 'alibaba/qwen-image-3/text-to-image',
  // Kept only so historical tasks can still be identified and polled. These
  // models are not enabled for new user requests.
  qwen2Standard: 'fal-ai/qwen-image-2/text-to-image',
  qwen2Pro: 'fal-ai/qwen-image-2/pro/text-to-image',
} as const;

export const IMAGE_GENERATION_COST = 5;
export const QWEN_IMAGE_EDIT_COST = 5;
export const QWEN_IMAGE_EDIT_MODEL_ID = 'fal-ai/qwen-image-edit-2511';
// Verified against fal's public schema on 2026-09-11. This is a migration
// candidate, not the default until a paid acceptance run is explicitly approved.
export const QWEN_IMAGE_3_EDIT_MODEL_ID = 'alibaba/qwen-image-3/edit';
export const QWEN_IMAGE_2_STANDARD_COST = 4;
export const QWEN_IMAGE_2_PRO_COST = 10;
// fal's Qwen Image 3 endpoint accepts prompts up to 5,000 characters.
export const QWEN_IMAGE_3_MAX_PROMPT_LENGTH = 5000;
export const DEFAULT_IMAGE_MODEL_ID = IMAGE_MODEL_IDS.qwen3;
export const SIMPLE_TOOL_IMAGE_MODEL_ID = IMAGE_MODEL_IDS.qwen2Standard;

export const IMAGE_MODELS: readonly ImageModelDefinition[] = [
  {
    id: IMAGE_MODEL_IDS.qwen3,
    provider: 'fal',
    label: 'Qwen Image 3',
    availability: 'enabled',
    enabled: true,
    credits: IMAGE_GENERATION_COST,
  },
  {
    id: IMAGE_MODEL_IDS.qwen2Standard,
    provider: 'fal',
    label: 'Qwen Image 2 Standard',
    availability: 'disabled',
    enabled: false,
    credits: QWEN_IMAGE_2_STANDARD_COST,
  },
  {
    id: IMAGE_MODEL_IDS.qwen2Pro,
    provider: 'fal',
    label: 'Qwen Image 2 Pro',
    availability: 'disabled',
    enabled: false,
    credits: QWEN_IMAGE_2_PRO_COST,
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
  const negativePrompt =
    typeof options?.negative_prompt === 'string'
      ? options.negative_prompt.trim().slice(0, 500)
      : '';
  // Prompt expansion runs an extra language-model pass before image inference.
  // Keep the low-latency path as the default; users can still opt in from the
  // advanced controls when they want the provider to rewrite a short prompt.
  const promptExpansion = options?.enable_prompt_expansion === true;
  const requestedImages = Number(options?.num_images);
  const numImages = [1, 2, 4].includes(requestedImages) ? requestedImages : 1;

  return {
    image_size: resolvedImageSize,
    enable_prompt_expansion: promptExpansion,
    enable_safety_checker: true,
    num_images: numImages,
    output_format: 'png',
    ...(negativePrompt ? { negative_prompt: negativePrompt } : {}),
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
    const url = new URL(value, 'https://qwenimage3.com');
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
