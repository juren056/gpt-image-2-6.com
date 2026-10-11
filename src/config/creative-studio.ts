export type CreativeProvider = 'fal' | 'openai' | 'gemini';
export type CreativeOperation =
  | 'generate'
  | 'edit'
  | 'remove-background'
  | 'replace-background'
  | 'relight'
  | 'remove-object'
  | 'repaint'
  | 'outpaint'
  | 'upscale'
  | 'vectorize';

export type CreativeModelId =
  | 'nano-banana-2.1'
  | 'gpt-image-2.5-flare'
  | 'gpt-image-2.5-sunburst'
  | 'nano-banana-2'
  | 'nano-banana-2.5'
  | 'nano-banana-2-lite'
  | 'nano-banana-pro'
  | 'seedream-5-pro'
  | 'flux-2-pro';

export type CreativeModelDefinition = {
  acceptanceId:
    | 'M02'
    | 'M03'
    | 'M04'
    | 'M05'
    | 'M06'
    | 'M07'
    | 'M08'
    | 'M09'
    | 'M10';
  id: CreativeModelId;
  label: string;
  provider: CreativeProvider;
  credential: 'fal_api_key' | 'openai_api_key' | 'gemini_api_key';
  endpoints: Partial<Record<'generate' | 'edit', string>>;
  operations: readonly CreativeOperation[];
  maxPromptLength: number;
  maxReferences: number;
  sizes: readonly string[];
  qualities: readonly string[];
  resolutions?: readonly string[];
  resolutionCredits?: Readonly<Record<string, number>>;
  sizeParameter: 'image_size' | 'aspect_ratio';
  credits: Partial<Record<CreativeOperation, number>>;
  productionEnabled: boolean;
  commercialUse: 'approved' | 'pending';
};

/**
 * One authoritative registry for API validation, billing quotes and UI options.
 * New paid integrations intentionally ship disabled until their bounded live
 * acceptance run is approved. This flag is not a fake model substitution.
 */
export const CREATIVE_MODELS: readonly CreativeModelDefinition[] = [
  {
    acceptanceId: 'M10',
    id: 'nano-banana-2.1',
    label: 'Nano Banana 2.1',
    provider: 'fal',
    credential: 'fal_api_key',
    endpoints: {
      generate: 'google/nano-banana-2.1',
      edit: 'google/nano-banana-2.1/edit',
    },
    operations: ['generate', 'edit'],
    maxPromptLength: 32000,
    maxReferences: 14,
    sizes: [
      'auto',
      '21:9',
      '16:9',
      '3:2',
      '4:3',
      '5:4',
      '1:1',
      '4:5',
      '3:4',
      '2:3',
      '9:16',
      '4:1',
      '1:4',
      '8:1',
      '1:8',
    ],
    qualities: [],
    resolutions: ['1K', '2K', '4K'],
    resolutionCredits: { '1K': 8, '2K': 12, '4K': 28 },
    sizeParameter: 'aspect_ratio',
    // Default 1K stays at 8 credits. Higher resolutions have explicit quotes;
    // Fal's measured 2K/4K costs are approximately 1.5x/3.4x the 1K cost.
    // https://fal.ai/nano-banana-2.1 (checked 2026-10-11)
    credits: { generate: 8, edit: 8 },
    productionEnabled: true,
    commercialUse: 'approved',
  },
  {
    acceptanceId: 'M02',
    id: 'gpt-image-2.5-flare',
    label: 'GPT Image 2.5 Flare',
    provider: 'fal',
    credential: 'fal_api_key',
    endpoints: {
      generate: 'openai/gpt-image-2.5/flare/text-to-image',
      edit: 'openai/gpt-image-2.5/flare/edit',
    },
    operations: [
      'generate',
      'edit',
      'replace-background',
      'relight',
      'remove-object',
      'repaint',
      'outpaint',
    ],
    maxPromptLength: 32000,
    maxReferences: 16,
    sizes: [
      'square_hd',
      'landscape_4_3',
      'landscape_16_9',
      'portrait_4_3',
      'portrait_16_9',
      'auto',
    ],
    qualities: ['low', 'medium', 'high', 'xhigh', 'max', 'auto'],
    sizeParameter: 'image_size',
    credits: {
      generate: 12,
      edit: 12,
      'replace-background': 12,
      relight: 12,
      'remove-object': 12,
      repaint: 12,
      outpaint: 12,
    },
    productionEnabled: true,
    commercialUse: 'approved',
  },
  {
    acceptanceId: 'M03',
    id: 'gpt-image-2.5-sunburst',
    label: 'GPT Image 2.5 Sunburst',
    provider: 'fal',
    credential: 'fal_api_key',
    endpoints: {
      generate: 'openai/gpt-image-2.5/sunburst/text-to-image',
      edit: 'openai/gpt-image-2.5/sunburst/edit',
    },
    operations: [
      'generate',
      'edit',
      'replace-background',
      'relight',
      'remove-object',
      'repaint',
      'outpaint',
    ],
    maxPromptLength: 32000,
    maxReferences: 16,
    sizes: [
      'square_hd',
      'landscape_4_3',
      'landscape_16_9',
      'portrait_4_3',
      'portrait_16_9',
      'auto',
    ],
    qualities: ['low', 'medium', 'high', 'xhigh', 'max', 'auto'],
    sizeParameter: 'image_size',
    credits: {
      generate: 8,
      edit: 8,
      'replace-background': 8,
      relight: 8,
      'remove-object': 8,
      repaint: 8,
      outpaint: 8,
    },
    productionEnabled: true,
    commercialUse: 'approved',
  },
  {
    acceptanceId: 'M04',
    id: 'nano-banana-2',
    label: 'Nano Banana 2',
    provider: 'fal',
    credential: 'fal_api_key',
    endpoints: {
      generate: 'fal-ai/nano-banana-2',
      edit: 'fal-ai/nano-banana-2/edit',
    },
    operations: [
      'generate',
      'edit',
      'replace-background',
      'relight',
      'remove-object',
      'repaint',
      'outpaint',
    ],
    maxPromptLength: 32000,
    maxReferences: 14,
    sizes: ['auto', '1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'],
    qualities: [],
    sizeParameter: 'aspect_ratio',
    credits: {
      generate: 6,
      edit: 6,
      'replace-background': 6,
      relight: 6,
      'remove-object': 6,
      repaint: 6,
      outpaint: 6,
    },
    productionEnabled: true,
    commercialUse: 'approved',
  },
  {
    acceptanceId: 'M05',
    id: 'nano-banana-2-lite',
    label: 'Nano Banana 2 Lite',
    provider: 'fal',
    credential: 'fal_api_key',
    endpoints: {
      generate: 'google/nano-banana-2-lite',
      edit: 'google/nano-banana-2-lite/edit',
    },
    operations: ['generate', 'edit'],
    maxPromptLength: 32000,
    maxReferences: 1,
    sizes: ['auto', '1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'],
    qualities: [],
    sizeParameter: 'aspect_ratio',
    credits: { generate: 3, edit: 3 },
    productionEnabled: true,
    commercialUse: 'approved',
  },
  {
    acceptanceId: 'M06',
    id: 'nano-banana-pro',
    label: 'Nano Banana Pro',
    provider: 'fal',
    credential: 'fal_api_key',
    endpoints: {
      generate: 'fal-ai/nano-banana-pro',
      edit: 'fal-ai/nano-banana-pro/edit',
    },
    operations: [
      'generate',
      'edit',
      'replace-background',
      'relight',
      'remove-object',
      'repaint',
      'outpaint',
    ],
    maxPromptLength: 32000,
    maxReferences: 14,
    sizes: ['auto', '1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'],
    qualities: [],
    sizeParameter: 'aspect_ratio',
    credits: {
      generate: 15,
      edit: 15,
      'replace-background': 15,
      relight: 15,
      'remove-object': 15,
      repaint: 15,
      outpaint: 15,
    },
    productionEnabled: true,
    commercialUse: 'approved',
  },
  {
    acceptanceId: 'M07',
    id: 'seedream-5-pro',
    label: 'Seedream 5.0 Pro',
    provider: 'fal',
    credential: 'fal_api_key',
    endpoints: {
      generate: 'bytedance/seedream/v5/pro/text-to-image',
      edit: 'bytedance/seedream/v5/pro/edit',
    },
    operations: [
      'generate',
      'edit',
      'replace-background',
      'relight',
      'remove-object',
      'repaint',
      'outpaint',
    ],
    maxPromptLength: 10000,
    maxReferences: 10,
    sizes: [
      'auto_1K',
      'auto_2K',
      'square_hd',
      'landscape_16_9',
      'portrait_16_9',
    ],
    qualities: [],
    sizeParameter: 'image_size',
    credits: {
      generate: 8,
      edit: 10,
      'replace-background': 10,
      relight: 10,
      'remove-object': 10,
      repaint: 10,
      outpaint: 10,
    },
    productionEnabled: true,
    commercialUse: 'approved',
  },
  {
    acceptanceId: 'M08',
    id: 'flux-2-pro',
    label: 'FLUX.2 [pro] (fal/BFL)',
    provider: 'fal',
    credential: 'fal_api_key',
    endpoints: {
      generate: 'fal-ai/flux-2-pro',
      edit: 'fal-ai/flux-2-pro/edit',
    },
    operations: [
      'generate',
      'edit',
      'replace-background',
      'relight',
      'remove-object',
      'repaint',
      'outpaint',
    ],
    maxPromptLength: 10000,
    maxReferences: 9,
    sizes: [
      'square_hd',
      'landscape_4_3',
      'landscape_16_9',
      'portrait_4_3',
      'portrait_16_9',
    ],
    qualities: [],
    sizeParameter: 'image_size',
    credits: {
      generate: 8,
      edit: 10,
      'replace-background': 10,
      relight: 10,
      'remove-object': 10,
      repaint: 10,
      outpaint: 10,
    },
    productionEnabled: true,
    commercialUse: 'approved',
  },
  {
    acceptanceId: 'M09',
    id: 'nano-banana-2.5',
    label: 'Nano Banana 2.5',
    provider: 'fal',
    credential: 'fal_api_key',
    endpoints: {},
    operations: ['generate', 'edit'],
    maxPromptLength: 32000,
    maxReferences: 14,
    sizes: ['auto', '1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'],
    qualities: [],
    sizeParameter: 'aspect_ratio',
    credits: {},
    productionEnabled: false,
    commercialUse: 'pending',
  },
] as const;

export const UTILITY_MODELS = {
  removeBackground: 'fal-ai/bria/background/remove',
  upscale: 'fal-ai/clarity-upscaler',
  vectorize: 'fal-ai/recraft/vectorize',
} as const;

export function findCreativeModel(id: string) {
  return CREATIVE_MODELS.find((model) => model.id === id);
}

export function requireProductionCreativeModel(id: string) {
  const model = findCreativeModel(id);
  if (!model) throw new Error('Unsupported creative model');
  if (model.commercialUse !== 'approved') {
    throw new Error(
      `${model.label} is coming soon. Commercial use has not been approved for this service.`
    );
  }
  if (!model.productionEnabled) {
    throw new Error(
      `${model.label} is coming soon. Its official API, parameters, and pricing must be verified before launch.`
    );
  }
  return model;
}

export function requireCreativeModel(id: string, operation: CreativeOperation) {
  const model = findCreativeModel(id);
  if (!model) throw new Error('Unsupported creative model');
  if (!model.operations.includes(operation as never)) {
    throw new Error(`${model.label} does not support ${operation}`);
  }
  return model;
}

// These Fal Nano Banana schemas support num_images for generation and edits.
// https://fal.ai/models/google/nano-banana-2.1/api
// https://fal.ai/models/fal-ai/nano-banana-2/api
// https://fal.ai/models/fal-ai/nano-banana-pro/api
// https://fal.ai/models/google/nano-banana-2-lite/api
export function getCreativeOutputLimit(modelId: string): number {
  return [
    'nano-banana-2.1',
    'nano-banana-2',
    'nano-banana-pro',
    'nano-banana-2-lite',
  ].includes(modelId)
    ? 4
    : 1;
}

export function getCreativeUnitCredits(
  model: CreativeModelDefinition,
  operation: CreativeOperation,
  resolution?: string
) {
  if (model.resolutions?.length) {
    const selected = resolution ?? model.resolutions[0];
    if (!model.resolutions.includes(selected))
      throw new Error(`Unsupported resolution for ${model.label}`);
    return model.resolutionCredits?.[selected];
  }
  if (resolution !== undefined)
    throw new Error(`${model.label} uses its default output resolution`);
  return model.credits[operation];
}

export function validateCreativeRequest(input: {
  model: string;
  operation: string;
  prompt?: string;
  imageUrls?: unknown;
  size?: unknown;
  quality?: unknown;
  resolution?: unknown;
  outputFormat?: unknown;
  outputCount?: unknown;
}) {
  const operation = input.operation as CreativeOperation;
  const model = requireCreativeModel(input.model, operation);
  const outputCount = input.outputCount === undefined ? 1 : input.outputCount;
  const outputLimit = getCreativeOutputLimit(model.id);
  if (
    typeof outputCount !== 'number' ||
    !Number.isInteger(outputCount) ||
    outputCount < 1 ||
    outputCount > outputLimit
  ) {
    throw new Error(
      `Output count must be an integer between 1 and ${outputLimit}`
    );
  }
  const prompt = (input.prompt || '').trim();
  if (!prompt || prompt.length > model.maxPromptLength) {
    throw new Error(
      `Prompt must contain 1–${model.maxPromptLength} characters`
    );
  }
  const imageUrls = Array.isArray(input.imageUrls)
    ? input.imageUrls.map((value) => {
        if (typeof value !== 'string' || value.length > 2048) {
          throw new Error('Invalid reference image URL');
        }
        const url = new URL(value);
        if (url.protocol !== 'https:') {
          throw new Error('Reference images must use HTTPS');
        }
        return value;
      })
    : [];
  if (operation !== 'generate' && imageUrls.length === 0) {
    throw new Error(`${operation} requires a reference image`);
  }
  if (imageUrls.length > model.maxReferences) {
    throw new Error(
      `${model.label} accepts at most ${model.maxReferences} reference images`
    );
  }
  const size =
    typeof input.size === 'string' && model.sizes.includes(input.size as never)
      ? input.size
      : model.sizes[0];
  const quality =
    typeof input.quality === 'string' &&
    model.qualities.includes(input.quality as never)
      ? input.quality
      : model.qualities[0];
  const outputFormat = ['png', 'jpeg', 'webp'].includes(
    String(input.outputFormat)
  )
    ? String(input.outputFormat)
    : 'png';
  const providerModel =
    operation === 'generate' ? model.endpoints.generate : model.endpoints.edit;
  if (!providerModel) {
    throw new Error(`${model.label} has no ${operation} endpoint`);
  }
  if (input.resolution !== undefined && typeof input.resolution !== 'string')
    throw new Error('Resolution must be a string');
  const resolution = model.resolutions?.length
    ? ((input.resolution as string | undefined) ?? model.resolutions[0])
    : (input.resolution as string | undefined);
  const credits = getCreativeUnitCredits(model, operation, resolution);
  if (!credits) {
    throw new Error(`No billing rule exists for ${model.label} ${operation}`);
  }
  return {
    model,
    operation,
    prompt,
    imageUrls,
    size,
    quality,
    resolution,
    outputFormat,
    providerModel,
    outputCount,
    credits: credits * outputCount,
  };
}
