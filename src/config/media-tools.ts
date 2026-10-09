import { sanitizeMatchaFilterStrength } from '@/lib/matcha-filter';

export const MEDIA_TOOL_MODELS = {
  seedance20TextToVideo: 'bytedance/seedance-2.0/text-to-video',
  seedance25TextToVideo: 'bytedance/seedance-2.5/text-to-video',
  minimaxH3TextToVideo: 'minimax/h3/text-to-video',
  wan3TextToVideo: 'alibaba/wan-3.0/text-to-video',
  backgroundRemoval: 'fal-ai/bria/background/remove',
  matchaFilterRemoval: 'fal-ai/flux-2-pro/edit',
} as const;

const LEGACY_WAN3_MODELS = new Set([
  'wan3.0-video',
  'fal-ai/wan/v2.7/text-to-video',
]);

export function isWan3VideoModel(
  model?: string | null,
  configuredModel = MEDIA_TOOL_MODELS.wan3TextToVideo
) {
  return Boolean(
    model && (model === configuredModel || LEGACY_WAN3_MODELS.has(model))
  );
}

const LEGACY_BACKGROUND_REMOVAL_MODELS = new Set([
  'fal-ai/imageutils/rembg',
  'fal-ai/birefnet/v2',
]);

export function isBackgroundRemovalModel(model?: string | null) {
  return (
    model === MEDIA_TOOL_MODELS.backgroundRemoval ||
    (typeof model === 'string' && LEGACY_BACKGROUND_REMOVAL_MODELS.has(model))
  );
}

export function isMatchaFilterRemovalModel(model?: string | null) {
  return model === MEDIA_TOOL_MODELS.matchaFilterRemoval;
}

export const VIDEO_GENERATION_COST = 150;
export const VIDEO_GENERATION_COST_LONG = 240;
export const SEEDANCE25_CREDITS_PER_SECOND = 50;
export const BACKGROUND_REMOVAL_COST = 2;
export const MATCHA_FILTER_REMOVAL_COST = 10;

export const VIDEO_PROMPT_MAX_LENGTH = 1200;
export const SEEDANCE25_PROMPT_MAX_LENGTH = 5000;
export const MINIMAX_H3_PROMPT_MAX_LENGTH = 2000;
export const MINIMAX_H3_CREDITS_PER_SECOND = 30;
export const WAN3_CREDITS_PER_SECOND = 30;
export const WAN3_PROMPT_MAX_LENGTH = 5000;
export const WAN3_DURATIONS = [5, 10, 15] as const;

const VIDEO_ASPECT_RATIOS = ['16:9', '9:16', '1:1'] as const;
const VIDEO_DURATIONS = [5, 8] as const;

export function sanitizeVideoOptions(
  options?: Record<string, unknown>
): Record<string, unknown> {
  const aspectRatio = VIDEO_ASPECT_RATIOS.includes(
    options?.aspect_ratio as (typeof VIDEO_ASPECT_RATIOS)[number]
  )
    ? options?.aspect_ratio
    : '16:9';
  const duration = VIDEO_DURATIONS.includes(
    Number(options?.duration) as (typeof VIDEO_DURATIONS)[number]
  )
    ? Number(options?.duration)
    : 5;

  return {
    aspect_ratio: aspectRatio,
    duration: String(duration),
    resolution: '720p',
    generate_audio: true,
  };
}

export function getVideoGenerationCost(options?: Record<string, unknown>) {
  return Number(options?.duration) === 8
    ? VIDEO_GENERATION_COST_LONG
    : VIDEO_GENERATION_COST;
}

const SEEDANCE25_ASPECT_RATIOS = [
  '21:9',
  '16:9',
  '4:3',
  '1:1',
  '3:4',
  '9:16',
] as const;

export function sanitizeSeedance25VideoOptions(
  options?: Record<string, unknown>
): Record<string, unknown> {
  const requestedDuration = Number(options?.duration);
  const duration = Number.isInteger(requestedDuration)
    ? Math.min(30, Math.max(4, requestedDuration))
    : 5;
  const aspectRatio = SEEDANCE25_ASPECT_RATIOS.includes(
    options?.aspect_ratio as (typeof SEEDANCE25_ASPECT_RATIOS)[number]
  )
    ? options?.aspect_ratio
    : '16:9';

  return {
    resolution: '720p',
    duration: String(duration),
    aspect_ratio: aspectRatio,
    generate_audio: true,
    bitrate_mode: 'standard',
  };
}

export function getSeedance25GenerationCost(options?: Record<string, unknown>) {
  return (
    Number(sanitizeSeedance25VideoOptions(options).duration) *
    SEEDANCE25_CREDITS_PER_SECOND
  );
}

const MINIMAX_H3_ASPECT_RATIOS = [
  '21:9',
  '16:9',
  '4:3',
  '1:1',
  '3:4',
  '9:16',
] as const;

export function sanitizeMinimaxH3VideoOptions(
  options?: Record<string, unknown>
): Record<string, unknown> {
  const requestedDuration = Number(options?.duration);
  const duration = Number.isInteger(requestedDuration)
    ? Math.min(15, Math.max(5, requestedDuration))
    : 5;
  const aspectRatio = MINIMAX_H3_ASPECT_RATIOS.includes(
    options?.aspect_ratio as (typeof MINIMAX_H3_ASPECT_RATIOS)[number]
  )
    ? options?.aspect_ratio
    : '16:9';

  return {
    aspect_ratio: aspectRatio,
    duration,
    resolution: '2K',
    enable_safety_checker: true,
    prompt_expansion_mode: 'fast',
  };
}

export function getMinimaxH3GenerationCost(options?: Record<string, unknown>) {
  const sanitized = sanitizeMinimaxH3VideoOptions(options);
  return Number(sanitized.duration) * MINIMAX_H3_CREDITS_PER_SECOND;
}

const WAN3_ASPECT_RATIOS = ['16:9', '9:16', '1:1', '4:3', '3:4'] as const;

export function sanitizeWan3VideoOptions(
  options?: Record<string, unknown>
): Record<string, unknown> {
  const requestedDuration = Number(options?.duration);
  const duration = WAN3_DURATIONS.includes(
    requestedDuration as (typeof WAN3_DURATIONS)[number]
  )
    ? requestedDuration
    : 5;
  const ratio = WAN3_ASPECT_RATIOS.includes(
    options?.aspect_ratio as (typeof WAN3_ASPECT_RATIOS)[number]
  )
    ? options?.aspect_ratio
    : '16:9';

  return {
    resolution: '720p',
    aspect_ratio: ratio,
    duration,
    audio: true,
    enable_prompt_expansion: false,
    enable_thinking: false,
    enable_safety_checker: true,
  };
}

export function getWan3GenerationCost(options?: Record<string, unknown>) {
  return (
    Number(sanitizeWan3VideoOptions(options).duration) * WAN3_CREDITS_PER_SECOND
  );
}

export function sanitizeBackgroundRemovalOptions(imageUrl: string) {
  if (!/^https?:\/\//i.test(imageUrl) && !imageUrl.startsWith('/uploads/')) {
    throw new Error('Upload a valid image before removing its background');
  }

  return {
    image_url: imageUrl,
    crop_to_bbox: false,
  };
}

export function sanitizeMatchaFilterRemovalOptions(
  imageUrl: string,
  strength?: unknown
) {
  if (!/^https?:\/\//i.test(imageUrl) && !imageUrl.startsWith('/uploads/')) {
    throw new Error('Upload a valid image before removing the matcha filter');
  }

  return {
    image_urls: [imageUrl],
    strength: sanitizeMatchaFilterStrength(strength),
    enable_safety_checker: true,
    output_format: 'png',
    num_images: 1,
  };
}
