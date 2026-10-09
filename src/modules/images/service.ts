import { and, count, eq, gte, isNull, lt, ne } from 'drizzle-orm';

import { FalProvider } from '@/core/ai/fal';
import { GeminiProvider } from '@/core/ai/gemini';
import {
  inspectProviderSafetyPayload,
  moderateWithOpenAIRetry,
  type ModerationResult,
} from '@/core/ai/moderation';
import { OpenAIImageProvider } from '@/core/ai/openai-image';
import { ReplicateProvider } from '@/core/ai/replicate';
import {
  AIMediaType,
  AIProvider,
  AITaskStatus as ProviderTaskStatus,
  type AITaskResult,
} from '@/core/ai/types';
import { db } from '@/core/db';
import { R2Provider } from '@/core/storage';
import {
  CREATIVE_MODELS,
  findCreativeModel,
  requireProductionCreativeModel,
  UTILITY_MODELS,
  validateCreativeRequest,
  type CreativeModelId,
} from '@/config/creative-studio';
import { aiTask, order } from '@/config/db/schema';
import {
  DEFAULT_IMAGE_MODEL_ID,
  IMAGE_GENERATION_COST,
  QWEN_IMAGE_3_EDIT_MODEL_ID,
  QWEN_IMAGE_3_MAX_PROMPT_LENGTH,
  QWEN_IMAGE_EDIT_COST,
  QWEN_IMAGE_EDIT_MODEL_ID,
  requireEnabledImageModel,
  sanitizeImageEditOptions,
  sanitizeImageGenerationOptions,
} from '@/config/image-models';
import {
  BACKGROUND_REMOVAL_COST,
  getMinimaxH3GenerationCost,
  getSeedance25GenerationCost,
  getVideoGenerationCost,
  getWan3GenerationCost,
  isBackgroundRemovalModel,
  isMatchaFilterRemovalModel,
  isWan3VideoModel,
  MATCHA_FILTER_REMOVAL_COST,
  MEDIA_TOOL_MODELS,
  MINIMAX_H3_PROMPT_MAX_LENGTH,
  sanitizeBackgroundRemovalOptions,
  sanitizeMatchaFilterRemovalOptions,
  sanitizeMinimaxH3VideoOptions,
  sanitizeSeedance25VideoOptions,
  sanitizeVideoOptions,
  sanitizeWan3VideoOptions,
  SEEDANCE25_PROMPT_MAX_LENGTH,
  VIDEO_PROMPT_MAX_LENGTH,
  WAN3_PROMPT_MAX_LENGTH,
} from '@/config/media-tools';
import {
  AITaskStatus,
  createTask,
  findTask,
  getTasks,
  updateTask,
} from '@/modules/ai-tasks/service';
import { getAllConfigs, type ConfigMap } from '@/modules/config/service';
import {
  assertUserSafetyAllowed,
  automatedSafetyReviewStatus,
  classifyPromptLocally,
  moderateAndEnforce,
  providerSafetyMetadata,
  recalculateUserSafety,
  shouldQuarantineGeneratedOutput,
  type SafetyDecision,
} from '@/modules/images/content-safety';
import {
  MATCHA_COLORIZATION_STRENGTH,
  shouldRunMatchaColorization,
} from '@/lib/matcha-filter';

import { buildFalWebhookUrl } from './fal-webhook';

type ImageTaskRow = typeof aiTask.$inferSelect;
type ModerationPayload = Pick<AITaskResult, 'taskInfo' | 'taskResult'>;

function allowedSafetyMetadata(decision: SafetyDecision) {
  return {
    safetyStatus: 'allowed',
    safetyCategory: decision.category,
    safetySeverity: decision.severity,
    safetySource: decision.source,
    safetyConfidence: decision.confidence,
    safetyReviewStatus: 'not_required',
    safetyAction: 'allowed',
  };
}

function moderationConfig(configs: ConfigMap) {
  return {
    apiKey: configs.openai_api_key || '',
    baseUrl: configs.openai_base_url || 'https://api.openai.com/v1',
    model: configs.content_safety_openai_model || 'omni-moderation-latest',
  };
}

function outputImageUrls(result: ModerationPayload) {
  return (result.taskInfo?.images || [])
    .map((image) => image.imageUrl)
    .filter((url): url is string => Boolean(url));
}

async function inspectGeneratedOutput(
  configs: ConfigMap,
  result: ModerationPayload
): Promise<{
  decision: ModerationResult | null;
  corroborated: boolean;
}> {
  const providerDecision = inspectProviderSafetyPayload(
    result.taskResult,
    result.taskInfo
  );
  const imageUrls = outputImageUrls(result);
  const moderation = moderationConfig(configs);
  if (moderation.apiKey && imageUrls.length) {
    const external = await moderateWithOpenAIRetry({
      ...moderation,
      imageUrls,
    });
    if (
      providerDecision?.decision === 'block' &&
      external.decision === 'block'
    ) {
      return { decision: external, corroborated: true };
    }
    if (providerDecision?.decision === 'block') {
      return { decision: providerDecision, corroborated: false };
    }
    if (
      external.category === 'moderation_unavailable' &&
      providerDecision?.decision === 'allow'
    ) {
      return { decision: providerDecision, corroborated: false };
    }
    return { decision: external, corroborated: false };
  }
  return { decision: providerDecision, corroborated: false };
}

function blockedOutputSafety(
  decision: ModerationResult,
  corroborated: boolean
) {
  const source = decision.detector === 'openai' ? 'external' : 'provider';
  const reviewStatus = automatedSafetyReviewStatus(
    {
      allowed: false,
      category: decision.category,
      severity: decision.severity,
      confidence: decision.confidence,
      source,
    },
    { corroborated }
  );
  return {
    safetyStatus: 'blocked',
    safetyCategory: decision.category,
    safetySeverity: decision.severity,
    safetySource: source,
    safetyConfidence: decision.confidence,
    safetyReviewStatus: reviewStatus,
    safetyAction: 'output_quarantined',
  };
}

async function completeTaskAfterOutputSafety(params: {
  taskId: string;
  configs: ConfigMap;
  result: ModerationPayload;
}) {
  const assessment = await inspectGeneratedOutput(
    params.configs,
    params.result
  );
  const { decision, corroborated } = assessment;
  if (shouldQuarantineGeneratedOutput(decision)) {
    // Keep the explicit guard type-safe if the policy helper changes later.
    if (!decision) return false;
    const safety = blockedOutputSafety(decision, corroborated);
    await updateTask({
      taskId: params.taskId,
      status: AITaskStatus.FAILED,
      taskResult: {
        errorMessage:
          'The result was withheld by the content safety system. Credits were refunded.',
        errorCode: 'OUTPUT_SAFETY_QUARANTINED',
        moderationReasonCode: decision.reasonCode,
      },
      safety,
    });
    if (safety.safetyReviewStatus === 'confirmed') {
      const task = await findTask(params.taskId);
      if (task) await recalculateUserSafety(task.userId);
    }
    return false;
  }
  await updateTask({
    taskId: params.taskId,
    status: AITaskStatus.SUCCESS,
    taskResult: {
      ...(params.result.taskResult ?? {}),
      ...(params.result.taskInfo ?? {}),
      ...(decision?.category === 'moderation_unavailable'
        ? {
            moderationReviewStatus: 'unavailable',
            moderationReasonCode: decision.reasonCode,
          }
        : {}),
    },
    safety:
      decision?.category === 'moderation_unavailable'
        ? {
            safetyStatus: 'review',
            safetyCategory: 'moderation_unavailable',
            safetySeverity: 'none',
            safetySource: 'external',
            safetyConfidence: 0,
            safetyReviewStatus: 'not_required',
            safetyAction: 'output_review_unavailable',
          }
        : decision
          ? {
              safetyStatus: 'allowed',
              safetyCategory: '',
              safetySeverity: 'none',
              safetySource:
                decision.detector === 'openai' ? 'external' : decision.detector,
              safetyConfidence: decision.confidence,
              safetyReviewStatus: 'not_required',
              safetyAction: 'output_allowed',
            }
          : undefined,
  });
  return true;
}

export async function getMonthlyImageUsage(userId: string) {
  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );
  const nextMonthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
  );

  const [result] = await db()
    .select({ value: count(aiTask.id) })
    .from(aiTask)
    .where(
      and(
        eq(aiTask.userId, userId),
        eq(aiTask.mediaType, AIMediaType.IMAGE),
        eq(aiTask.status, AITaskStatus.SUCCESS),
        gte(aiTask.createdAt, monthStart),
        lt(aiTask.createdAt, nextMonthStart),
        isNull(aiTask.deletedAt)
      )
    );

  return {
    count: Number(result?.value ?? 0),
    periodStart: monthStart.toISOString(),
    periodEnd: nextMonthStart.toISOString(),
  };
}

function getPublicGenerationError(message: string): string {
  if (
    /flagged by a content checker|content (?:safety|policy)|safety (?:checker|filter)|nsfw|not safe for work|moderation/i.test(
      message
    )
  ) {
    return "This prompt was blocked by the AI provider's content safety filter. Try removing protected character names or sensitive details, then try again. Your credits were restored.";
  }

  if (
    /fal|queue\.fal\.run|downstream service|provider (?:status|result|request)|service unavailable|request timed out/i.test(
      message
    )
  ) {
    return 'The AI generation service is temporarily unavailable. Please try again shortly. Credits are restored when a generation task fails.';
  }

  return message;
}

function resolveProvider(configs: ConfigMap, providerName: string): AIProvider {
  const storageConfigured = Boolean(
    configs.r2_access_key && configs.r2_secret_key && configs.r2_bucket_name
  );
  const storage = storageConfigured
    ? new R2Provider({
        accountId: configs.r2_account_id || '',
        accessKeyId: configs.r2_access_key,
        secretAccessKey: configs.r2_secret_key,
        bucket: configs.r2_bucket_name,
        uploadPath: configs.r2_upload_path,
        region: 'auto',
        endpoint: configs.r2_endpoint,
        publicDomain: configs.r2_domain,
      })
    : null;
  const uploadFile = storage
    ? async (file: {
        body: Buffer | Uint8Array;
        key: string;
        contentType: string;
      }) => {
        const result = await storage.uploadFile(file);
        if (!result.success || !result.url) {
          throw new Error(result.error || 'Failed to persist provider output');
        }
        return { url: result.url };
      }
    : undefined;
  if (providerName === 'fal' && configs.fal_api_key) {
    return new FalProvider({
      apiKey: configs.fal_api_key,
      customStorage: Boolean(storage),
      saveFiles: storage
        ? async (files) => {
            const saved = await Promise.all(
              files.map(async (file) => {
                const result = await storage.downloadAndUpload({
                  url: file.url,
                  key: file.key,
                  contentType: file.contentType,
                });
                if (!result.success || !result.url) {
                  throw new Error(result.error || 'Failed to persist image');
                }
                return { ...file, url: result.url };
              })
            );
            return saved;
          }
        : undefined,
    });
  }
  if (providerName === 'openai' && configs.openai_api_key) {
    if (!uploadFile)
      throw new Error('R2 storage is required to persist OpenAI images');
    return new OpenAIImageProvider({
      apiKey: configs.openai_api_key,
      baseUrl: configs.openai_base_url,
      uploadFile,
    });
  }
  if (providerName === 'gemini' && configs.gemini_api_key) {
    if (!uploadFile)
      throw new Error('R2 storage is required to persist Gemini images');
    return new GeminiProvider({ apiKey: configs.gemini_api_key, uploadFile });
  }
  if (providerName === 'replicate' && configs.replicate_api_token) {
    return new ReplicateProvider({ apiToken: configs.replicate_api_token });
  }
  throw new Error(
    `${providerName} is not configured. Add its API key in Admin > Settings > AI.`
  );
}

function isCreativeModelLive(configs: ConfigMap, modelId: CreativeModelId) {
  const model = findCreativeModel(modelId);
  if (!model?.productionEnabled) return false;
  const explicitlyEnabled = (configs.creative_enabled_model_ids || '')
    .split(',')
    .map((value) => value.trim())
    .includes(modelId);
  return configs.creative_paid_models_enabled === 'true' && explicitlyEnabled;
}

export async function getCreativeModelAvailability() {
  const configs = await getAllConfigs();
  return CREATIVE_MODELS.map((model) => ({
    ...model,
    configured: Boolean(configs[model.credential]),
    enabled: isCreativeModelLive(configs, model.id),
  }));
}

function resolveImageEditModelId() {
  const requested = process.env.QWEN_IMAGE_EDIT_MODEL_ID?.trim();
  if (!requested || requested === QWEN_IMAGE_EDIT_MODEL_ID) {
    return QWEN_IMAGE_EDIT_MODEL_ID;
  }
  if (requested === QWEN_IMAGE_3_EDIT_MODEL_ID) {
    return QWEN_IMAGE_3_EDIT_MODEL_ID;
  }
  throw new Error('Unsupported QWEN_IMAGE_EDIT_MODEL_ID configuration');
}

/**
 * Submit the one-off anonymous trial without creating a user-owned database
 * record. The route wraps the provider task id in a short-lived signed token.
 */
export function validateAnonymousImageInput(params: {
  prompt: string;
  options?: Record<string, unknown>;
}) {
  const trimmed = params.prompt.trim();
  if (!trimmed) throw new Error('Prompt is required');
  if (trimmed.length > QWEN_IMAGE_3_MAX_PROMPT_LENGTH) {
    throw new Error(
      `Prompt is too long (max ${QWEN_IMAGE_3_MAX_PROMPT_LENGTH} characters)`
    );
  }

  const options = sanitizeImageGenerationOptions({
    ...params.options,
    // Keep the public trial bounded to one provider request and one output.
    num_images: 1,
  });
  return { prompt: trimmed, options };
}

export async function prepareAnonymousImage(params: {
  prompt: string;
  options?: Record<string, unknown>;
}) {
  const validated = validateAnonymousImageInput(params);
  const safety = classifyPromptLocally(validated.prompt);
  if (!safety.allowed) throw new Error(safety.publicMessage);
  const configs = await getAllConfigs();
  const moderation = moderationConfig(configs);
  if (moderation.apiKey) {
    const external = await moderateWithOpenAIRetry({
      ...moderation,
      text: validated.prompt,
    });
    if (external.decision === 'block') {
      throw new Error(
        'This request may violate the content policy and was blocked before generation.'
      );
    }
  }
  const provider = resolveProvider(configs, 'fal');
  return { provider, ...validated };
}

export type PreparedAnonymousImage = Awaited<
  ReturnType<typeof prepareAnonymousImage>
>;

export async function submitAnonymousImage(prepared: PreparedAnonymousImage) {
  const result = await prepared.provider.generate({
    params: {
      mediaType: AIMediaType.IMAGE,
      model: DEFAULT_IMAGE_MODEL_ID,
      prompt: prepared.prompt,
      options: prepared.options,
    },
  });

  return {
    taskId: result.taskId,
    statusUrl:
      typeof result.taskResult?.status_url === 'string'
        ? result.taskResult.status_url
        : undefined,
    responseUrl:
      typeof result.taskResult?.response_url === 'string'
        ? result.taskResult.response_url
        : undefined,
  };
}

export async function generateAnonymousImage(params: {
  prompt: string;
  options?: Record<string, unknown>;
}) {
  return submitAnonymousImage(await prepareAnonymousImage(params));
}

export async function queryAnonymousImage(
  taskId: string,
  queueUrls?: { statusUrl?: string; responseUrl?: string }
) {
  const configs = await getAllConfigs();
  const provider = resolveProvider(configs, 'fal');
  if (!provider.query) throw new Error('Image provider cannot be polled');

  const result = await provider.query({
    taskId,
    mediaType: AIMediaType.IMAGE,
    model: DEFAULT_IMAGE_MODEL_ID,
    taskResult: {
      status_url: queueUrls?.statusUrl,
      response_url: queueUrls?.responseUrl,
    },
  });

  if (result.taskStatus === ProviderTaskStatus.SUCCESS) {
    const safety = await inspectGeneratedOutput(configs, result);
    if (shouldQuarantineGeneratedOutput(safety.decision)) {
      return {
        id: taskId,
        status: AITaskStatus.FAILED,
        images: [],
        errorMessage:
          'The generated result was withheld by the content safety system.',
        providerStatus: 'SAFETY_QUARANTINED',
        queuePosition: undefined,
      };
    }
  }

  return {
    id: taskId,
    status: result.taskStatus,
    images: result.taskInfo?.images ?? [],
    errorMessage: getPublicGenerationError(result.taskInfo?.errorMessage || ''),
    providerStatus: result.taskInfo?.status || '',
    queuePosition: result.taskInfo?.queuePosition,
  };
}

export async function claimAnonymousImage(params: {
  userId: string;
  providerTaskId: string;
  prompt: string;
  statusUrl?: string;
  responseUrl?: string;
}) {
  await assertUserSafetyAllowed(params.userId);
  const prompt = params.prompt.trim().slice(0, QWEN_IMAGE_3_MAX_PROMPT_LENGTH);
  const safety = classifyPromptLocally(prompt);
  if (!safety.allowed) throw new Error(safety.publicMessage);
  const [existing] = await db()
    .select({ id: aiTask.id })
    .from(aiTask)
    .where(
      and(
        eq(aiTask.userId, params.userId),
        eq(aiTask.taskId, params.providerTaskId)
      )
    )
    .limit(1);
  if (existing) return existing;

  const result = await queryAnonymousImage(params.providerTaskId, {
    statusUrl: params.statusUrl,
    responseUrl: params.responseUrl,
  });
  if (result.status !== AITaskStatus.SUCCESS || !result.images.length) {
    throw new Error('The free generation is not ready to save');
  }
  const task = await createTask({
    userId: params.userId,
    mediaType: AIMediaType.IMAGE,
    provider: 'fal',
    model: DEFAULT_IMAGE_MODEL_ID,
    prompt,
    costCredits: 0,
    options: { source: 'anonymous_trial' },
    safety: allowedSafetyMetadata(safety),
  });
  await db()
    .update(aiTask)
    .set({ taskId: params.providerTaskId })
    .where(eq(aiTask.id, task.id));
  await updateTask({
    taskId: task.id,
    status: AITaskStatus.SUCCESS,
    taskResult: { images: result.images },
  });
  return { id: task.id };
}

function parseTaskResult(task: ImageTaskRow) {
  let images: Array<{ imageUrl?: string }> = [];
  let errorMessage = '';
  let providerStatus = '';
  let queuePosition: number | undefined;
  let inferenceTime: number | undefined;
  let seed: number | undefined;
  let options: Record<string, unknown> = {};
  if (task.options) {
    try {
      const parsedOptions = JSON.parse(task.options as string);
      options = {
        image_size:
          typeof parsedOptions?.image_size === 'string'
            ? parsedOptions.image_size
            : 'square_hd',
        ...(typeof parsedOptions?.seed === 'number'
          ? { seed: parsedOptions.seed }
          : {}),
      };
    } catch {
      /* ignore malformed historical option data */
    }
  }
  if (task.taskResult) {
    try {
      const parsed = JSON.parse(task.taskResult as string);
      images = parsed?.images ?? [];
      errorMessage = getPublicGenerationError(parsed?.errorMessage ?? '');
      providerStatus = parsed?.status ?? '';
      queuePosition =
        typeof parsed?.queuePosition === 'number'
          ? parsed.queuePosition
          : undefined;
      inferenceTime =
        typeof parsed?.inferenceTime === 'number'
          ? parsed.inferenceTime
          : undefined;
      seed =
        typeof parsed?.seed === 'number'
          ? parsed.seed
          : typeof options.seed === 'number'
            ? options.seed
            : undefined;
    } catch {
      /* ignore */
    }
  }
  return {
    id: task.id,
    prompt: task.prompt,
    model: task.model,
    provider: task.provider,
    status: task.status,
    costCredits: task.costCredits,
    createdAt: task.createdAt,
    images,
    errorMessage,
    providerStatus,
    queuePosition,
    inferenceTime,
    seed,
    options,
  };
}

function parseMediaToolTask(task: ImageTaskRow) {
  let images: Array<{ imageUrl?: string }> = [];
  let videos: Array<{ videoUrl?: string }> = [];
  let errorMessage = '';
  let providerStatus = '';
  let queuePosition: number | undefined;
  let inferenceTime: number | undefined;

  if (task.taskResult) {
    try {
      const parsed = JSON.parse(task.taskResult as string);
      images = parsed?.images ?? [];
      videos = parsed?.videos ?? [];
      errorMessage = getPublicGenerationError(parsed?.errorMessage ?? '');
      providerStatus = parsed?.status ?? '';
      queuePosition =
        typeof parsed?.queuePosition === 'number'
          ? parsed.queuePosition
          : undefined;
      inferenceTime =
        typeof parsed?.inferenceTime === 'number'
          ? parsed.inferenceTime
          : undefined;
    } catch {
      /* ignore malformed historical task data */
    }
  }

  return {
    id: task.id,
    prompt: task.prompt,
    model: task.model,
    provider: task.provider,
    mediaType: task.mediaType,
    status: task.status,
    costCredits: task.costCredits,
    createdAt: task.createdAt,
    images,
    videos,
    errorMessage,
    providerStatus,
    queuePosition,
    inferenceTime,
  };
}

async function assertPaidGenerationAllowed(userId: string) {
  await assertUserSafetyAllowed(userId);
  const [openDispute] = await db()
    .select({ id: order.id })
    .from(order)
    .where(and(eq(order.userId, userId), eq(order.status, 'disputed')))
    .limit(1);
  if (openDispute) {
    throw new Error(
      'Paid generation is temporarily unavailable while a payment dispute is open. Contact support if you need help.'
    );
  }
}

export async function getOwnedImageDownload(taskId: string, userId: string) {
  const task = await findTask(taskId);
  if (
    !task ||
    task.userId !== userId ||
    task.mediaType !== AIMediaType.IMAGE ||
    task.status !== AITaskStatus.SUCCESS ||
    task.deletedAt
  ) {
    return null;
  }

  const imageUrl = parseTaskResult(task).images[0]?.imageUrl;
  if (!imageUrl) return null;

  return {
    imageUrl,
    prompt: task.prompt,
    model: task.model,
  };
}

export async function generateImage(params: {
  userId: string;
  prompt: string;
  model?: string;
  options?: Record<string, unknown>;
}) {
  const { userId, prompt, model, options } = params;
  const trimmed = prompt.trim();
  if (!trimmed) throw new Error('Prompt is required');
  if (trimmed.length > QWEN_IMAGE_3_MAX_PROMPT_LENGTH)
    throw new Error(
      `Prompt is too long (max ${QWEN_IMAGE_3_MAX_PROMPT_LENGTH} characters)`
    );

  await assertPaidGenerationAllowed(userId);

  const resolvedModel = model || DEFAULT_IMAGE_MODEL_ID;
  const modelDefinition = requireEnabledImageModel(resolvedModel);
  const sanitizedOptions = sanitizeImageGenerationOptions(options);
  const configs = await getAllConfigs();
  const provider = resolveProvider(configs, modelDefinition.provider);
  const safety = await moderateAndEnforce({
    userId,
    prompt: trimmed,
    mediaType: AIMediaType.IMAGE,
    model: resolvedModel,
    moderation: moderationConfig(configs),
  });
  const outputCount = Number(sanitizedOptions.num_images) || 1;
  const generationCost = modelDefinition.credits * outputCount;

  const task = await createTask({
    userId,
    mediaType: AIMediaType.IMAGE,
    provider: provider.name,
    model: resolvedModel,
    prompt: trimmed,
    costCredits: generationCost,
    options: sanitizedOptions,
    safety: allowedSafetyMetadata(safety),
  });
  const callbackUrl =
    provider instanceof FalProvider
      ? buildFalWebhookUrl(configs.app_url, task.id)
      : undefined;

  try {
    const result = await provider.generate({
      params: {
        mediaType: AIMediaType.IMAGE,
        model: resolvedModel,
        prompt: trimmed,
        options: sanitizedOptions,
        callbackUrl,
      },
    });

    await db()
      .update(aiTask)
      .set({
        taskId: result.taskId,
        status: AITaskStatus.PROCESSING,
        taskResult: JSON.stringify(result.taskResult ?? {}),
      })
      .where(eq(aiTask.id, task.id));

    return {
      id: task.id,
      status: AITaskStatus.PROCESSING,
      costCredits: generationCost,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Image generation failed';
    await updateTask({
      taskId: task.id,
      status: AITaskStatus.FAILED,
      taskResult: {
        errorMessage: message,
      },
      safety: providerSafetyMetadata(message) ?? undefined,
    });
    throw new Error(getPublicGenerationError(message));
  }
}

export async function generateImageEdit(params: {
  userId: string;
  prompt: string;
  imageUrls: string[];
  options?: Record<string, unknown>;
}) {
  const prompt = params.prompt.trim();
  if (!prompt) throw new Error('Describe the edit you want');
  if (prompt.length > QWEN_IMAGE_3_MAX_PROMPT_LENGTH) {
    throw new Error(
      `Prompt is too long (max ${QWEN_IMAGE_3_MAX_PROMPT_LENGTH} characters)`
    );
  }
  await assertPaidGenerationAllowed(params.userId);
  const options = sanitizeImageEditOptions(params.imageUrls, params.options);
  const configs = await getAllConfigs();
  const provider = resolveProvider(configs, 'fal');
  const editModel = resolveImageEditModelId();
  const safety = await moderateAndEnforce({
    userId: params.userId,
    prompt,
    imageUrls: params.imageUrls,
    mediaType: AIMediaType.IMAGE,
    model: editModel,
    moderation: moderationConfig(configs),
  });
  const task = await createTask({
    userId: params.userId,
    mediaType: AIMediaType.IMAGE,
    provider: provider.name,
    model: editModel,
    prompt,
    costCredits: QWEN_IMAGE_EDIT_COST,
    options,
    safety: allowedSafetyMetadata(safety),
  });

  try {
    const result = await provider.generate({
      params: {
        mediaType: AIMediaType.IMAGE,
        model: editModel,
        prompt,
        options,
      },
    });
    await db()
      .update(aiTask)
      .set({
        taskId: result.taskId,
        status: AITaskStatus.PROCESSING,
        taskResult: JSON.stringify(result.taskResult ?? {}),
      })
      .where(eq(aiTask.id, task.id));
    return {
      id: task.id,
      status: AITaskStatus.PROCESSING,
      costCredits: QWEN_IMAGE_EDIT_COST,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Image editing failed';
    await updateTask({
      taskId: task.id,
      status: AITaskStatus.FAILED,
      taskResult: { errorMessage: message },
      safety: providerSafetyMetadata(message) ?? undefined,
    });
    throw new Error(getPublicGenerationError(message));
  }
}

/** Unified M01–M10 execution path. It validates the exact selected model,
 * charges from the same registry quote, persists the task before dispatch,
 * and never substitutes another model. New models are guarded by admin flags
 * until their paid acceptance run is explicitly approved. */
export async function runCreativeImage(params: {
  userId: string;
  model: string;
  operation: string;
  prompt?: string;
  imageUrls?: string[];
  size?: string;
  quality?: string;
  outputFormat?: string;
  maskUrl?: string;
  conversationParts?: Array<Record<string, unknown>>;
}) {
  requireProductionCreativeModel(params.model);
  const request = validateCreativeRequest(params);
  await assertPaidGenerationAllowed(params.userId);
  const configs = await getAllConfigs();
  if (!isCreativeModelLive(configs, request.model.id)) {
    throw new Error(
      `${request.model.label} is awaiting paid acceptance and production enablement`
    );
  }
  const provider = resolveProvider(configs, request.model.provider);
  const options: Record<string, unknown> = {
    ...(request.size ? { [request.model.sizeParameter]: request.size } : {}),
    ...(request.quality ? { quality: request.quality } : {}),
    output_format: request.outputFormat,
    num_images: 1,
  };
  if (request.providerModel.startsWith('bytedance/seedream/')) {
    // Fal image endpoints that expose this option default to true. Sending it
    // explicitly prevents a future endpoint/default change from disabling it.
    options.enable_safety_checker = true;
  }
  if (request.imageUrls.length) {
    options.image_urls = request.imageUrls;
  }
  if (params.conversationParts && request.model.provider === 'gemini') {
    options.conversation_parts = params.conversationParts;
  }
  if (params.maskUrl) {
    const mask = new URL(params.maskUrl);
    if (mask.protocol !== 'https:') throw new Error('Mask must use HTTPS');
    if (
      request.model.id === 'gpt-image-2.5-flare' ||
      request.model.id === 'gpt-image-2.5-sunburst'
    ) {
      options.mask_url = params.maskUrl;
    } else {
      const references = (options.image_urls ||
        options.input_images ||
        options.image_input ||
        []) as string[];
      if (references.length >= request.model.maxReferences) {
        throw new Error(
          'The selected model has no remaining reference slot for the mask'
        );
      }
      const annotatedPrompt = `${request.prompt}\nApply the edit only to the white region of the final reference mask; preserve black regions exactly.`;
      if (request.model.provider === 'fal') {
        options.image_urls = [...references, params.maskUrl];
      } else {
        options.image_input = [...references, params.maskUrl];
      }
      request.prompt = annotatedPrompt;
    }
  }
  const safety = await moderateAndEnforce({
    userId: params.userId,
    prompt: request.prompt,
    imageUrls: request.imageUrls,
    mediaType: AIMediaType.IMAGE,
    model: request.providerModel,
    moderation: moderationConfig(configs),
  });
  const task = await createTask({
    userId: params.userId,
    mediaType: AIMediaType.IMAGE,
    provider: provider.name,
    model: request.providerModel,
    prompt: request.prompt,
    costCredits: request.credits,
    options: {
      ...options,
      studioModelId: request.model.id,
      operation: request.operation,
    },
    safety: allowedSafetyMetadata(safety),
  });
  try {
    const result = await provider.generate({
      params: {
        mediaType: AIMediaType.IMAGE,
        model: request.providerModel,
        prompt: request.prompt,
        options,
        callbackUrl:
          provider instanceof FalProvider
            ? buildFalWebhookUrl(configs.app_url, task.id)
            : undefined,
      },
    });
    if (result.taskStatus === ProviderTaskStatus.SUCCESS) {
      const allowed = await completeTaskAfterOutputSafety({
        taskId: task.id,
        configs,
        result,
      });
      return {
        id: task.id,
        status: allowed ? AITaskStatus.SUCCESS : AITaskStatus.FAILED,
        costCredits: request.credits,
      };
    }
    await db()
      .update(aiTask)
      .set({
        taskId: result.taskId,
        status: AITaskStatus.PROCESSING,
        taskResult: JSON.stringify(result.taskResult ?? {}),
      })
      .where(eq(aiTask.id, task.id));
    return {
      id: task.id,
      status: AITaskStatus.PROCESSING,
      costCredits: request.credits,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Creative image request failed';
    await updateTask({
      taskId: task.id,
      status: AITaskStatus.FAILED,
      taskResult: { errorMessage: message },
      safety: providerSafetyMetadata(message) ?? undefined,
    });
    throw new Error(getPublicGenerationError(message));
  }
}

export async function getCreativeUtilityAvailability() {
  const configs = await getAllConfigs();
  const enabledIds = new Set(
    (configs.creative_enabled_model_ids || '')
      .split(',')
      .map((value) => value.trim())
  );
  const paidEnabled =
    configs.creative_paid_models_enabled === 'true' &&
    Boolean(configs.fal_api_key);
  return {
    'remove-background': {
      enabled: paidEnabled && enabledIds.has('utility-remove-background'),
      credits: 3,
    },
    upscale: {
      enabled: paidEnabled && enabledIds.has('utility-upscale'),
      credits: 5,
    },
    vectorize: {
      enabled: paidEnabled && enabledIds.has('utility-vectorize'),
      credits: 5,
    },
  };
}

export async function runCreativeUtility(params: {
  userId: string;
  operation: 'remove-background' | 'upscale' | 'vectorize';
  imageUrl: string;
  scale?: 2 | 4;
}) {
  const definitions = {
    'remove-background': { model: UTILITY_MODELS.removeBackground, credits: 3 },
    upscale: {
      model: UTILITY_MODELS.upscale,
      credits: params.scale === 4 ? 8 : 5,
    },
    vectorize: { model: UTILITY_MODELS.vectorize, credits: 5 },
  } as const;
  const definition = definitions[params.operation];
  if (!definition) throw new Error('Unsupported studio utility');
  const imageUrl = params.imageUrl.trim();
  const parsed = new URL(imageUrl);
  if (parsed.protocol !== 'https:')
    throw new Error('Image must use a public HTTPS URL');
  await assertPaidGenerationAllowed(params.userId);
  const configs = await getAllConfigs();
  if (
    configs.creative_paid_models_enabled !== 'true' ||
    !(configs.creative_enabled_model_ids || '')
      .split(',')
      .map((value) => value.trim())
      .includes(`utility-${params.operation}`)
  ) {
    throw new Error(
      `${params.operation} is awaiting paid acceptance and production enablement`
    );
  }
  const provider = resolveProvider(configs, 'fal');
  const safety = await moderateAndEnforce({
    userId: params.userId,
    prompt: params.operation,
    imageUrls: [imageUrl],
    mediaType: AIMediaType.IMAGE,
    model: definition.model,
    moderation: moderationConfig(configs),
  });
  const options = {
    image_url: imageUrl,
    ...(params.operation === 'upscale'
      ? { upscale_factor: params.scale || 2 }
      : {}),
  };
  const task = await createTask({
    userId: params.userId,
    mediaType: AIMediaType.IMAGE,
    provider: provider.name,
    model: definition.model,
    prompt: params.operation,
    costCredits: definition.credits,
    options: { ...options, operation: params.operation },
    safety: allowedSafetyMetadata(safety),
  });
  try {
    const result = await provider.generate({
      params: {
        mediaType: AIMediaType.IMAGE,
        model: definition.model,
        prompt: params.operation,
        options,
        callbackUrl: buildFalWebhookUrl(configs.app_url, task.id),
      },
    });
    await db()
      .update(aiTask)
      .set({
        taskId: result.taskId,
        status: AITaskStatus.PROCESSING,
        taskResult: JSON.stringify(result.taskResult ?? {}),
      })
      .where(eq(aiTask.id, task.id));
    return {
      id: task.id,
      status: AITaskStatus.PROCESSING,
      costCredits: definition.credits,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Studio utility failed';
    await updateTask({
      taskId: task.id,
      status: AITaskStatus.FAILED,
      taskResult: { errorMessage: message },
      safety: providerSafetyMetadata(message) ?? undefined,
    });
    throw new Error(getPublicGenerationError(message));
  }
}

async function submitMediaToolTask(params: {
  userId: string;
  mediaType: AIMediaType;
  model: string;
  prompt: string;
  options: Record<string, unknown>;
  costCredits: number;
  providerName?: 'fal';
}) {
  await assertPaidGenerationAllowed(params.userId);
  const configs = await getAllConfigs();
  const provider = resolveProvider(configs, params.providerName ?? 'fal');
  const referenceUrls = Object.entries(params.options).flatMap(
    ([key, value]) =>
      /image/i.test(key)
        ? Array.isArray(value)
          ? value.filter((item): item is string => typeof item === 'string')
          : typeof value === 'string'
            ? [value]
            : []
        : []
  );
  const safety = await moderateAndEnforce({
    userId: params.userId,
    prompt: params.prompt,
    imageUrls: referenceUrls,
    mediaType: params.mediaType,
    model: params.model,
    moderation: moderationConfig(configs),
  });
  const task = await createTask({
    userId: params.userId,
    mediaType: params.mediaType,
    provider: provider.name,
    model: params.model,
    prompt: params.prompt,
    costCredits: params.costCredits,
    options: params.options,
    safety: allowedSafetyMetadata(safety),
  });

  try {
    const result = await provider.generate({
      params: {
        mediaType: params.mediaType,
        model: params.model,
        prompt: params.prompt,
        options: params.options,
      },
    });

    await db()
      .update(aiTask)
      .set({
        taskId: result.taskId,
        status: AITaskStatus.PROCESSING,
        taskResult: JSON.stringify(result.taskResult ?? {}),
      })
      .where(eq(aiTask.id, task.id));

    return {
      id: task.id,
      status: AITaskStatus.PROCESSING,
      costCredits: params.costCredits,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'AI generation failed';
    await updateTask({
      taskId: task.id,
      status: AITaskStatus.FAILED,
      taskResult: { errorMessage: message },
      safety: providerSafetyMetadata(message) ?? undefined,
    });
    throw new Error(getPublicGenerationError(message));
  }
}

export async function generateVideo(params: {
  userId: string;
  prompt: string;
  options?: Record<string, unknown>;
}) {
  const prompt = params.prompt.trim();
  if (!prompt) throw new Error('Prompt is required');
  if (prompt.length > VIDEO_PROMPT_MAX_LENGTH) {
    throw new Error(
      `Prompt is too long (max ${VIDEO_PROMPT_MAX_LENGTH} characters)`
    );
  }

  return submitMediaToolTask({
    userId: params.userId,
    mediaType: AIMediaType.VIDEO,
    model: MEDIA_TOOL_MODELS.seedance20TextToVideo,
    prompt,
    options: {
      ...sanitizeVideoOptions(params.options),
      end_user_id: params.userId,
    },
    costCredits: getVideoGenerationCost(params.options),
  });
}

export async function generateSeedance25Video(params: {
  userId: string;
  prompt: string;
  options?: Record<string, unknown>;
}) {
  const prompt = params.prompt.trim();
  if (!prompt) throw new Error('Prompt is required');
  if (prompt.length > SEEDANCE25_PROMPT_MAX_LENGTH) {
    throw new Error(
      `Prompt is too long (max ${SEEDANCE25_PROMPT_MAX_LENGTH} characters)`
    );
  }

  return submitMediaToolTask({
    userId: params.userId,
    mediaType: AIMediaType.VIDEO,
    model: MEDIA_TOOL_MODELS.seedance25TextToVideo,
    prompt,
    options: {
      ...sanitizeSeedance25VideoOptions(params.options),
      end_user_id: params.userId,
    },
    costCredits: getSeedance25GenerationCost(params.options),
  });
}

export async function generateMinimaxH3Video(params: {
  userId: string;
  prompt: string;
  options?: Record<string, unknown>;
}) {
  const prompt = params.prompt.trim();
  if (!prompt) throw new Error('Prompt is required');
  if (prompt.length > MINIMAX_H3_PROMPT_MAX_LENGTH) {
    throw new Error(
      `Prompt is too long (max ${MINIMAX_H3_PROMPT_MAX_LENGTH} characters)`
    );
  }

  return submitMediaToolTask({
    userId: params.userId,
    mediaType: AIMediaType.VIDEO,
    model: MEDIA_TOOL_MODELS.minimaxH3TextToVideo,
    prompt,
    options: sanitizeMinimaxH3VideoOptions(params.options),
    costCredits: getMinimaxH3GenerationCost(params.options),
  });
}

export async function generateWan3Video(params: {
  userId: string;
  prompt: string;
  options?: Record<string, unknown>;
}) {
  const prompt = params.prompt.trim();
  if (!prompt) throw new Error('Prompt is required');
  if (prompt.length > WAN3_PROMPT_MAX_LENGTH) {
    throw new Error(
      `Prompt is too long (max ${WAN3_PROMPT_MAX_LENGTH} characters)`
    );
  }

  return submitMediaToolTask({
    userId: params.userId,
    mediaType: AIMediaType.VIDEO,
    providerName: 'fal',
    model: MEDIA_TOOL_MODELS.wan3TextToVideo,
    prompt,
    options: sanitizeWan3VideoOptions(params.options),
    costCredits: getWan3GenerationCost(params.options),
  });
}

export async function removeImageBackground(params: {
  userId: string;
  imageUrl: string;
}) {
  const configs = await getAllConfigs();
  const inputUrl = params.imageUrl.startsWith('/uploads/')
    ? `${configs.app_url.replace(/\/$/, '')}${params.imageUrl}`
    : params.imageUrl;

  return submitMediaToolTask({
    userId: params.userId,
    mediaType: AIMediaType.IMAGE,
    model: MEDIA_TOOL_MODELS.backgroundRemoval,
    prompt: 'Remove the image background and preserve the foreground subject.',
    options: sanitizeBackgroundRemovalOptions(inputUrl),
    costCredits: BACKGROUND_REMOVAL_COST,
  });
}

export async function removeMatchaFilter(params: {
  userId: string;
  imageUrl: string;
  strength?: number;
}) {
  const configs = await getAllConfigs();
  const inputUrl = params.imageUrl.startsWith('/uploads/')
    ? `${configs.app_url.replace(/\/$/, '')}${params.imageUrl}`
    : params.imageUrl;

  return submitMediaToolTask({
    userId: params.userId,
    mediaType: AIMediaType.IMAGE,
    model: MEDIA_TOOL_MODELS.matchaFilterRemoval,
    prompt:
      'Perform color correction only. Completely remove the artificial matcha filter, including green, yellow-green, olive, chartreuse and mustard color casts from highlights, midtones and shadows. Rebuild a neutral white balance, neutral whites and grays, natural skin tones when people are present, realistic material colors, and balanced contrast with readable shadow and highlight detail. If the source is so strongly colorized that the original chroma cannot be inferred reliably, produce a clean neutral grayscale result instead of retaining any green or yellow tint. Preserve the exact subject, identity, facial features, pose, text, logos, watermarks, objects, composition, crop, perspective, texture, grain and fine details. Do not add, remove, redraw, reshape or restyle anything.',
    options: sanitizeMatchaFilterRemovalOptions(inputUrl, params.strength),
    costCredits: MATCHA_FILTER_REMOVAL_COST,
  });
}

const MATCHA_COLORIZATION_PROMPT =
  'Conservatively colorize this neutralized image while preserving it as the exact same photograph. Infer only restrained, plausible real-world colors from the visible materials and context. Restore natural-looking color separation and gentle tonal depth without vivid, cinematic or stylized grading. Keep whites and grays neutral and do not reintroduce green, yellow-green, olive, chartreuse or mustard casts. Preserve every subject, face, expression, pose, object, line of text, logo, watermark, composition, crop, perspective, texture, grain, shadow and highlight. Do not add, remove, redraw, reshape or restyle anything.';

function getStoredMatchaStrength(task: ImageTaskRow) {
  if (!task.options) return undefined;
  try {
    return JSON.parse(task.options as string)?.strength;
  } catch {
    return undefined;
  }
}

export async function refreshMediaToolTask(taskId: string, userId: string) {
  const task = await findTask(taskId);
  const configs = await getAllConfigs();
  const isAllowedModel =
    task?.model === MEDIA_TOOL_MODELS.seedance20TextToVideo ||
    task?.model === MEDIA_TOOL_MODELS.seedance25TextToVideo ||
    task?.model === MEDIA_TOOL_MODELS.minimaxH3TextToVideo ||
    isWan3VideoModel(task?.model) ||
    isBackgroundRemovalModel(task?.model) ||
    isMatchaFilterRemovalModel(task?.model);
  if (!task || task.userId !== userId || !isAllowedModel) {
    throw new Error('Task not found');
  }

  if (
    task.status === AITaskStatus.SUCCESS ||
    task.status === AITaskStatus.FAILED ||
    task.status === AITaskStatus.CANCELED ||
    !task.taskId
  ) {
    return parseMediaToolTask(task);
  }

  const pollCutoff = new Date(Date.now() - 1_500);
  const [pollLease] = await db()
    .update(aiTask)
    .set({ updatedAt: new Date() })
    .where(
      and(
        eq(aiTask.id, task.id),
        lt(aiTask.updatedAt, pollCutoff),
        ne(aiTask.status, AITaskStatus.SUCCESS),
        ne(aiTask.status, AITaskStatus.FAILED),
        ne(aiTask.status, AITaskStatus.CANCELED),
        isNull(aiTask.deletedAt)
      )
    )
    .returning({ id: aiTask.id });
  if (!pollLease) {
    return parseMediaToolTask((await findTask(taskId)) ?? task);
  }

  const provider = resolveProvider(configs, task.provider);
  if (!provider.query)
    throw new Error('Provider does not support task polling');

  let providerTaskResult: unknown;
  try {
    providerTaskResult = task.taskResult
      ? JSON.parse(task.taskResult as string)
      : undefined;
  } catch {
    providerTaskResult = undefined;
  }
  const matchaStage =
    providerTaskResult && typeof providerTaskResult === 'object'
      ? (providerTaskResult as Record<string, unknown>)._matchaStage
      : undefined;
  const firstMatchaPass =
    providerTaskResult && typeof providerTaskResult === 'object'
      ? (providerTaskResult as Record<string, unknown>)._matchaFirstPass
      : undefined;
  const hasFirstMatchaPass = Boolean(
    firstMatchaPass &&
    typeof firstMatchaPass === 'object' &&
    Array.isArray((firstMatchaPass as { images?: unknown }).images) &&
    (firstMatchaPass as { images: unknown[] }).images.length
  );

  try {
    const result = await provider.query({
      taskId: task.taskId,
      mediaType: task.mediaType as AIMediaType,
      model: task.model,
      taskResult: providerTaskResult,
    });

    if (result.taskStatus === ProviderTaskStatus.SUCCESS) {
      const shouldColorize =
        isMatchaFilterRemovalModel(task.model) &&
        matchaStage !== 'colorize' &&
        shouldRunMatchaColorization(getStoredMatchaStrength(task));
      const neutralizedImage = result.taskInfo?.images?.[0]?.imageUrl;

      if (shouldColorize && neutralizedImage) {
        try {
          const colorization = await provider.generate({
            params: {
              mediaType: AIMediaType.IMAGE,
              model: MEDIA_TOOL_MODELS.matchaFilterRemoval,
              prompt: MATCHA_COLORIZATION_PROMPT,
              options: sanitizeMatchaFilterRemovalOptions(
                neutralizedImage,
                MATCHA_COLORIZATION_STRENGTH
              ),
            },
          });
          await db()
            .update(aiTask)
            .set({
              taskId: colorization.taskId,
              status: AITaskStatus.PROCESSING,
              taskResult: JSON.stringify({
                ...(colorization.taskResult &&
                typeof colorization.taskResult === 'object'
                  ? colorization.taskResult
                  : {}),
                _matchaStage: 'colorize',
                _matchaFirstPass: result.taskInfo,
              }),
            })
            .where(eq(aiTask.id, task.id));
        } catch (error) {
          console.warn(
            '[images] matcha colorization pass failed to start; using neutralized result',
            {
              taskId: task.id,
              message: error instanceof Error ? error.message : String(error),
            }
          );
          await completeTaskAfterOutputSafety({
            taskId: task.id,
            configs,
            result,
          });
        }
      } else {
        await completeTaskAfterOutputSafety({
          taskId: task.id,
          configs,
          result,
        });
      }
    } else if (
      result.taskStatus === ProviderTaskStatus.FAILED ||
      result.taskStatus === ProviderTaskStatus.CANCELED
    ) {
      await updateTask({
        taskId: task.id,
        status:
          matchaStage === 'colorize' && hasFirstMatchaPass
            ? AITaskStatus.SUCCESS
            : AITaskStatus.FAILED,
        taskResult:
          matchaStage === 'colorize' && hasFirstMatchaPass
            ? firstMatchaPass
            : (result.taskInfo ?? {
                errorMessage: 'AI generation failed',
              }),
      });
    } else {
      await db()
        .update(aiTask)
        .set({
          status:
            result.taskStatus === ProviderTaskStatus.PENDING
              ? AITaskStatus.PENDING
              : AITaskStatus.PROCESSING,
          taskResult: JSON.stringify({
            ...(providerTaskResult && typeof providerTaskResult === 'object'
              ? providerTaskResult
              : {}),
            ...(result.taskResult ?? {}),
            ...(result.taskInfo ?? {}),
          }),
        })
        .where(eq(aiTask.id, task.id));
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Provider status check failed';
    const ageMs = Date.now() - new Date(task.createdAt).getTime();
    const timeoutMs =
      task.mediaType === AIMediaType.VIDEO ? 20 * 60 * 1000 : 8 * 60 * 1000;
    const permanent =
      /Fal (?:status|result) request failed \((?:400|401|403|404|422)\)/.test(
        message
      );
    if (permanent || ageMs >= timeoutMs) {
      await updateTask({
        taskId: task.id,
        status:
          matchaStage === 'colorize' && hasFirstMatchaPass
            ? AITaskStatus.SUCCESS
            : AITaskStatus.FAILED,
        taskResult:
          matchaStage === 'colorize' && hasFirstMatchaPass
            ? firstMatchaPass
            : { errorMessage: message },
      });
    }
  }

  return parseMediaToolTask((await findTask(taskId))!);
}

export async function refreshImageTask(taskId: string, userId: string) {
  const task = await findTask(taskId);
  if (!task || task.userId !== userId || task.mediaType !== AIMediaType.IMAGE) {
    throw new Error('Task not found');
  }

  if (
    task.status === AITaskStatus.SUCCESS ||
    task.status === AITaskStatus.FAILED ||
    task.status === AITaskStatus.CANCELED
  ) {
    return parseTaskResult(task);
  }

  if (!task.taskId) {
    return parseTaskResult(task);
  }

  // Multiple browser queries (active result + gallery recovery) can ask for
  // the same provider status at once. Keep the lease just below the active
  // workspace's one-second cadence: a longer lease silently skips every other
  // poll and delays displaying a result that Fal has already completed.
  const pollCutoff = new Date(Date.now() - 900);
  const [pollLease] = await db()
    .update(aiTask)
    .set({ updatedAt: new Date() })
    .where(
      and(
        eq(aiTask.id, task.id),
        lt(aiTask.updatedAt, pollCutoff),
        ne(aiTask.status, AITaskStatus.SUCCESS),
        ne(aiTask.status, AITaskStatus.FAILED),
        ne(aiTask.status, AITaskStatus.CANCELED),
        isNull(aiTask.deletedAt)
      )
    )
    .returning({ id: aiTask.id });
  if (!pollLease) {
    const current = await findTask(taskId);
    return parseTaskResult(current ?? task);
  }

  const configs = await getAllConfigs();
  const provider = resolveProvider(configs, task.provider);

  if (!provider.query) {
    throw new Error('Provider does not support task polling');
  }

  let result: AITaskResult;
  try {
    let providerTaskResult: unknown;
    try {
      providerTaskResult = task.taskResult
        ? JSON.parse(task.taskResult as string)
        : undefined;
    } catch {
      providerTaskResult = undefined;
    }

    result = await provider.query({
      taskId: task.taskId,
      mediaType: AIMediaType.IMAGE,
      model: task.model,
      taskResult: providerTaskResult,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Provider status check failed';
    const ageMs = Date.now() - new Date(task.createdAt).getTime();
    const isPermanentProviderError =
      /Fal (?:status|result) request failed \((?:400|401|403|404|422)\)/.test(
        message
      );

    // Do not leave an unrecoverable or abandoned provider task spinning
    // forever. Temporary network/5xx failures remain retryable for eight
    // minutes, which is generous for these image endpoints but still gives
    // the user a definite outcome and an automatic credit refund.
    if (isPermanentProviderError || ageMs >= 8 * 60 * 1000) {
      console.error('[images] provider status check failed permanently', {
        taskId: task.id,
        providerTaskId: task.taskId,
        provider: task.provider,
        model: task.model,
        message,
      });
      await updateTask({
        taskId: task.id,
        status: AITaskStatus.FAILED,
        taskResult: { errorMessage: message },
        safety: providerSafetyMetadata(message) ?? undefined,
      });
      const failedTask = await findTask(taskId);
      return parseTaskResult(failedTask!);
    }

    console.warn('[images] temporary provider polling failure; will retry', {
      taskId: task.id,
      providerTaskId: task.taskId,
      provider: task.provider,
      model: task.model,
      message,
    });
    return parseTaskResult(task);
  }

  if (result.taskStatus === ProviderTaskStatus.SUCCESS) {
    await completeTaskAfterOutputSafety({ taskId: task.id, configs, result });
  } else if (
    result.taskStatus === ProviderTaskStatus.FAILED ||
    result.taskStatus === ProviderTaskStatus.CANCELED
  ) {
    const providerError =
      result.taskInfo?.errorMessage || 'Image generation failed';
    console.error('[images] provider task failed', {
      taskId: task.id,
      providerTaskId: task.taskId,
      provider: task.provider,
      model: task.model,
      status: result.taskInfo?.status || result.taskStatus,
      errorCode: result.taskInfo?.errorCode || '',
      message: providerError,
    });
    await updateTask({
      taskId: task.id,
      status: AITaskStatus.FAILED,
      taskResult: result.taskInfo ?? {
        errorMessage: providerError,
      },
      safety: providerSafetyMetadata(providerError) ?? undefined,
    });
  } else {
    let previousResult: Record<string, unknown> = {};
    try {
      previousResult = task.taskResult
        ? JSON.parse(task.taskResult as string)
        : {};
    } catch {
      previousResult = {};
    }
    await db()
      .update(aiTask)
      .set({
        status:
          result.taskStatus === ProviderTaskStatus.PENDING
            ? AITaskStatus.PENDING
            : AITaskStatus.PROCESSING,
        taskResult: JSON.stringify({
          ...previousResult,
          ...(result.taskResult ?? {}),
          ...(result.taskInfo ?? {}),
        }),
      })
      .where(
        and(
          eq(aiTask.id, task.id),
          ne(aiTask.status, AITaskStatus.SUCCESS),
          ne(aiTask.status, AITaskStatus.FAILED),
          ne(aiTask.status, AITaskStatus.CANCELED)
        )
      );
  }

  const updated = await findTask(taskId);
  return parseTaskResult(updated!);
}

export async function completeImageTaskFromFalWebhook(params: {
  localTaskId: string;
  providerTaskId: string;
  status: string;
  payload?: any;
  error?: unknown;
}) {
  const task = await findTask(params.localTaskId);
  if (
    !task ||
    task.mediaType !== AIMediaType.IMAGE ||
    task.provider !== 'fal'
  ) {
    throw new Error('Task not found');
  }

  if (!task.taskId || task.taskId !== params.providerTaskId) {
    // The callback can race the initial request-id write. A non-2xx response
    // asks Fal to retry rather than accepting an event we cannot bind safely.
    throw new Error('Provider task is not ready for callback');
  }

  if (
    task.status === AITaskStatus.SUCCESS ||
    task.status === AITaskStatus.FAILED ||
    task.status === AITaskStatus.CANCELED
  ) {
    return parseTaskResult(task);
  }

  if (params.status !== 'OK') {
    const message =
      typeof params.error === 'string'
        ? params.error
        : (params.error as any)?.message || 'Fal image generation failed';
    await updateTask({
      taskId: task.id,
      status: AITaskStatus.FAILED,
      taskResult: { status: 'ERROR', errorMessage: message },
      safety: providerSafetyMetadata(message) ?? undefined,
    });
  } else {
    const configs = await getAllConfigs();
    const provider = resolveProvider(configs, 'fal');
    if (!(provider instanceof FalProvider)) {
      throw new Error('Fal provider is unavailable');
    }
    const normalized = await provider.normalizeWebhookPayload(
      params.payload,
      AIMediaType.IMAGE
    );
    if (!normalized.taskInfo?.images?.some((image) => image.imageUrl)) {
      throw new Error('Fal callback did not contain an image');
    }
    await completeTaskAfterOutputSafety({
      taskId: task.id,
      configs,
      result: normalized,
    });
  }

  return parseTaskResult((await findTask(task.id))!);
}

export async function listImages(userId: string, page = 1, limit = 20) {
  let tasks = await getTasks({
    userId,
    mediaType: AIMediaType.IMAGE,
    page,
    limit,
  });

  // A page reload loses the client-side active task id. Refresh a small number
  // of non-terminal tasks here so completed Fal jobs do not stay spinning in
  // the gallery forever.
  const activeTasks = tasks
    .filter(
      (task: ImageTaskRow) =>
        task.status === AITaskStatus.PENDING ||
        task.status === AITaskStatus.PROCESSING
    )
    .slice(0, 6);

  if (activeTasks.length > 0) {
    await Promise.allSettled(
      activeTasks.map((task: ImageTaskRow) => refreshImageTask(task.id, userId))
    );
    tasks = await getTasks({
      userId,
      mediaType: AIMediaType.IMAGE,
      page,
      limit,
    });
  }

  return tasks.map(parseTaskResult);
}

export { IMAGE_GENERATION_COST };
