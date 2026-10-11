import type { validateCreativeRequest } from '@/config/creative-studio';

/** Only validated server request values reach the provider payload. */
export function buildCreativeImageOptions(
  request: ReturnType<typeof validateCreativeRequest>
) {
  const options: Record<string, unknown> = {
    ...(request.size ? { [request.model.sizeParameter]: request.size } : {}),
    ...(request.quality ? { quality: request.quality } : {}),
    output_format: request.outputFormat,
    num_images: request.outputCount,
  };
  if (request.resolution) options.resolution = request.resolution;
  if (request.model.id === 'nano-banana-2.1') {
    options.limit_generations = true;
    options.safety_tolerance = '4';
  }
  if (request.providerModel.startsWith('bytedance/seedream/'))
    options.enable_safety_checker = true;
  if (request.imageUrls.length) options.image_urls = request.imageUrls;
  return options;
}
