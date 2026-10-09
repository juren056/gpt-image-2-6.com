import {
  AIConfigs,
  AIFile,
  AIGenerateParams,
  AIImage,
  AIMediaType,
  AIProvider,
  AITaskResult,
  AITaskStatus,
  AIVideo,
  SaveFilesFunction,
  UuidFunction,
} from './types';

const defaultUuid: UuidFunction = () => crypto.randomUUID();

function formatFalErrorDetail(value: unknown, depth = 0): string {
  if (depth > 5 || value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => formatFalErrorDetail(item, depth + 1))
      .filter(Boolean)
      .join('; ');
  }
  if (typeof value !== 'object') return '';

  const record = value as Record<string, unknown>;
  const message = formatFalErrorDetail(
    record.msg ?? record.message ?? record.reason ?? record.detail,
    depth + 1
  );
  const location = Array.isArray(record.loc)
    ? record.loc.map(String).filter(Boolean).join('.')
    : '';
  const type = typeof record.type === 'string' ? record.type : '';
  if (message) {
    return `${location ? `${location}: ` : ''}${message}${type ? ` (${type})` : ''}`;
  }

  for (const key of ['error', 'errors', 'data', 'body']) {
    if (!(key in record)) continue;
    const nested = formatFalErrorDetail(record[key], depth + 1);
    if (nested) return nested;
  }
  return '';
}

function falFailureCategory(status: number | undefined, detail: string) {
  const normalized = detail.toLowerCase();
  if (
    /content[_ -]?policy|content[_ -]?safety|safety[_ -]?(?:checker|filter)|moderation|nsfw|not safe for work|flagged/.test(
      normalized
    )
  ) {
    return 'Content safety policy violation';
  }
  if (
    /timeout|timed out|deadline/.test(normalized) ||
    status === 408 ||
    status === 504
  ) {
    return 'Provider request timed out';
  }
  if (status === 429 || /rate limit|too many requests/.test(normalized)) {
    return 'Provider rate limit exceeded';
  }
  if (status === 401 || /unauthorized|invalid (?:api )?key/.test(normalized)) {
    return 'Provider authentication failed';
  }
  if (status === 403 || /forbidden|permission denied/.test(normalized)) {
    return 'Provider permission denied';
  }
  if (status === 404 || /model not found|endpoint not found/.test(normalized)) {
    return 'Provider model or endpoint not found';
  }
  if (
    status === 422 ||
    /validation|invalid input|required field/.test(normalized)
  ) {
    return 'Input or content validation failed';
  }
  if ((status ?? 0) >= 500) return 'Provider service failure';
  return 'Provider generation failed';
}

function formatFalFailure(params: {
  status?: number;
  payload?: unknown;
  fallback?: string;
  requestId?: string | null;
  errorType?: string | null;
}) {
  const payload = params.payload as Record<string, unknown> | null;
  const detail = formatFalErrorDetail(
    payload?.detail ??
      payload?.error ??
      payload?.errors ??
      payload?.message ??
      params.fallback
  );
  const errorType =
    params.errorType ||
    (typeof payload?.error_type === 'string' ? payload.error_type : '') ||
    (typeof payload?.error_code === 'string' ? payload.error_code : '');
  const category = falFailureCategory(
    params.status,
    `${errorType || ''} ${detail}`
  );
  const code = [params.status ? `HTTP ${params.status}` : '', errorType || '']
    .filter(Boolean)
    .join(', ');
  const metadata = [code, params.requestId ? `request ${params.requestId}` : '']
    .filter(Boolean)
    .join('; ');
  return `${category}${metadata ? ` (${metadata})` : ''}${detail ? `: ${detail}` : ''}`.slice(
    0,
    2000
  );
}

/**
 * Fal configs
 * @docs https://fal.ai/
 */
export interface FalConfigs extends AIConfigs {
  apiKey: string;
  customStorage?: boolean;
  saveFiles?: SaveFilesFunction;
  uuid?: UuidFunction;
}

/**
 * Fal provider
 * @docs https://fal.ai/
 */
export class FalProvider implements AIProvider {
  readonly name = 'fal';
  configs: FalConfigs;

  private baseUrl = 'https://queue.fal.run';

  private async request(
    url: string,
    init: RequestInit,
    timeoutMs = 20_000
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Fal request timed out');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async requestQueueGet(
    url: string,
    headers: Record<string, string>
  ): Promise<Response> {
    const retryableStatuses = new Set([429, 502, 503, 504]);
    const delays = [500, 1_500];

    for (let attempt = 0; attempt <= delays.length; attempt += 1) {
      const response = await this.request(
        url,
        { method: 'GET', headers },
        12_000
      );
      if (
        !retryableStatuses.has(response.status) ||
        attempt === delays.length
      ) {
        return response;
      }

      // Fal can mark a queue item completed slightly before its downstream
      // result is readable. Retry safe GET requests, never POST submissions.
      await response.body?.cancel().catch(() => undefined);
      await new Promise((resolve) => setTimeout(resolve, delays[attempt]));
    }

    throw new Error('Fal queue request retry exhausted');
  }

  private async throwRequestError(
    response: Response,
    operation: string
  ): Promise<never> {
    const body = await response.text().catch(() => '');
    let payload: unknown = body;
    try {
      payload = JSON.parse(body);
    } catch {
      // Keep the raw response body when Fal does not return JSON.
    }
    const failure = formatFalFailure({
      status: response.status,
      payload,
      fallback: body,
      requestId: response.headers.get('x-fal-request-id'),
      errorType: response.headers.get('x-fal-error-type'),
    });
    throw new Error(`Fal ${operation} failed: ${failure}`);
  }

  constructor(configs: FalConfigs) {
    this.configs = configs;
  }

  private getUuid(): string {
    return (this.configs.uuid || defaultUuid)();
  }

  private async trySaveFiles(files: AIFile[]): Promise<AIFile[] | undefined> {
    if (!this.configs.saveFiles) return undefined;
    try {
      return await this.configs.saveFiles(files);
    } catch (error) {
      console.error('save files failed:', error);
      return undefined;
    }
  }

  async generate({
    params,
  }: {
    params: AIGenerateParams;
  }): Promise<AITaskResult> {
    const { mediaType, model, prompt, options, callbackUrl } = params;

    if (!mediaType) {
      throw new Error('mediaType is required');
    }

    if (!model) {
      throw new Error('model is required');
    }

    if (!prompt) {
      throw new Error('prompt is required');
    }

    const input = this.formatInput({ mediaType, model, prompt, options });

    let apiUrl = `${this.baseUrl}/${model}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Key ${this.configs.apiKey}`,
      // Keep interactive requests at Fal's normal priority. The start deadline
      // prevents a request from waiting in the queue indefinitely; once a
      // runner starts, Fal still lets inference finish at full quality.
      'X-Fal-Queue-Priority': 'normal',
      'X-Fal-Request-Timeout': '180',
    };

    const isValidCallbackUrl =
      callbackUrl &&
      callbackUrl.startsWith('http') &&
      !callbackUrl.includes('localhost') &&
      !callbackUrl.includes('127.0.0.1');

    if (isValidCallbackUrl) {
      const url = new URL(apiUrl);
      url.searchParams.set('fal_webhook', callbackUrl);
      apiUrl = url.toString();
    }

    const resp = await this.request(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
    });

    if (!resp.ok) {
      await this.throwRequestError(resp, 'submission');
    }

    const data = await resp.json();

    if (!data || !data.request_id) {
      throw new Error('generate failed: no request_id');
    }

    return {
      taskStatus: AITaskStatus.PENDING,
      taskId: data.request_id,
      taskInfo: {},
      taskResult: data,
    };
  }

  async query({
    taskId,
    model,
    mediaType,
    taskResult,
  }: {
    taskId: string;
    model?: string;
    mediaType?: AIMediaType;
    taskResult?: any;
  }): Promise<AITaskResult> {
    if (!model) {
      throw new Error('model is required to query a Fal task');
    }

    const queryModel = model;
    const statusUrl = this.resolveQueueUrl(
      taskResult?.status_url,
      `${this.baseUrl}/${queryModel}/requests/${taskId}/status`
    );
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Key ${this.configs.apiKey}`,
    };

    const statusResp = await this.requestQueueGet(statusUrl, headers);

    if (!statusResp.ok) {
      await this.throwRequestError(statusResp, 'status request');
    }

    const statusData = await statusResp.json();
    const taskStatus = this.mapStatus(statusData.status);

    if (taskStatus !== AITaskStatus.SUCCESS) {
      let failureMessage = this.getErrorMessage(statusData);
      let failureCode = statusData.error_code || statusData.error_type || '';
      if (taskStatus === AITaskStatus.FAILED) {
        const failureUrl = this.resolveQueueUrl(
          taskResult?.response_url,
          `${this.baseUrl}/${queryModel}/requests/${taskId}`
        );
        try {
          const failureResp = await this.requestQueueGet(failureUrl, headers);
          const body = await failureResp.text().catch(() => '');
          let payload: unknown = body;
          try {
            payload = JSON.parse(body);
          } catch {
            // Preserve non-JSON provider errors.
          }
          failureCode =
            failureResp.headers.get('x-fal-error-type') || failureCode;
          failureMessage = formatFalFailure({
            status: failureResp.status,
            payload,
            fallback: failureMessage || body,
            requestId: failureResp.headers.get('x-fal-request-id') || taskId,
            errorType: failureCode,
          });
        } catch (error) {
          failureMessage = formatFalFailure({
            payload: statusData,
            fallback:
              failureMessage ||
              (error instanceof Error ? error.message : String(error)),
            requestId: taskId,
            errorType: failureCode,
          });
        }
      }
      return {
        taskId,
        taskStatus,
        taskInfo: {
          status: statusData.status,
          errorCode: failureCode,
          errorMessage: failureMessage,
          queuePosition:
            typeof statusData.queue_position === 'number'
              ? statusData.queue_position
              : undefined,
          inferenceTime:
            typeof statusData.metrics?.inference_time === 'number'
              ? statusData.metrics.inference_time
              : undefined,
        },
        taskResult: statusData,
      };
    }

    const resultUrl = this.resolveQueueUrl(
      taskResult?.response_url,
      `${this.baseUrl}/${queryModel}/requests/${taskId}`
    );
    const resultResp = await this.requestQueueGet(resultUrl, headers);

    if (!resultResp.ok) {
      await this.throwRequestError(resultResp, 'result request');
    }

    const data = await resultResp.json();

    const { images, videos } = await this.normalizeOutput(data, mediaType);

    return {
      taskId,
      taskStatus,
      taskInfo: {
        images,
        videos,
        status: statusData.status,
        errorCode: '',
        errorMessage: '',
        createTime: new Date(),
        inferenceTime:
          typeof statusData.metrics?.inference_time === 'number'
            ? statusData.metrics.inference_time
            : undefined,
      },
      taskResult: data,
    };
  }

  /** Normalize a successful Fal webhook payload using the same durable-storage
   * path as queue polling. This lets the app finish a task even when the user
   * closes the page or their browser/network stops polling. */
  async normalizeWebhookPayload(
    payload: any,
    mediaType: AIMediaType = AIMediaType.IMAGE
  ): Promise<Pick<AITaskResult, 'taskInfo' | 'taskResult'>> {
    const { images, videos } = await this.normalizeOutput(payload, mediaType);
    return {
      taskInfo: {
        images,
        videos,
        status: 'COMPLETED',
        errorCode: '',
        errorMessage: '',
        createTime: new Date(),
      },
      taskResult: payload,
    };
  }

  private async normalizeOutput(
    data: any,
    mediaType?: AIMediaType
  ): Promise<{ images?: AIImage[]; videos?: AIVideo[] }> {
    let images: AIImage[] | undefined;
    let videos: AIVideo[] | undefined;

    if (mediaType === AIMediaType.VIDEO) {
      if (data.video?.url) {
        videos = [{ id: '', createTime: new Date(), videoUrl: data.video.url }];
      } else if (Array.isArray(data.videos)) {
        videos = data.videos.map((video: any) => ({
          id: '',
          createTime: new Date(),
          videoUrl: video.url,
        }));
      }
    } else if (data.image?.url) {
      images = [{ id: '', createTime: new Date(), imageUrl: data.image.url }];
    } else if (data.svg?.url) {
      images = [
        {
          id: '',
          createTime: new Date(),
          imageType: 'image/svg+xml',
          imageUrl: data.svg.url,
        },
      ];
    } else if (Array.isArray(data.images)) {
      images = data.images.map((image: any) => ({
        id: '',
        createTime: new Date(),
        imageUrl: image.url,
      }));
    }

    if (this.configs.customStorage) {
      if (images && images.length > 0) {
        const filesToSave: AIFile[] = [];
        images.forEach((image, index) => {
          if (image.imageUrl) {
            filesToSave.push({
              url: image.imageUrl,
              contentType: 'image/png',
              key: `fal/image/${this.getUuid()}.png`,
              index: index,
              type: 'image',
            });
          }
        });

        if (filesToSave.length > 0) {
          const uploadedFiles = await this.trySaveFiles(filesToSave);
          if (uploadedFiles) {
            uploadedFiles.forEach((file: AIFile) => {
              if (file && file.url && images && file.index !== undefined) {
                const image = images[file.index];
                if (image) {
                  image.imageUrl = file.url;
                }
              }
            });
          }
        }
      }

      if (videos && videos.length > 0) {
        const filesToSave: AIFile[] = [];
        videos.forEach((video, index) => {
          if (video.videoUrl) {
            filesToSave.push({
              url: video.videoUrl,
              contentType: 'video/mp4',
              key: `fal/video/${this.getUuid()}.mp4`,
              index: index,
              type: 'video',
            });
          }
        });

        if (filesToSave.length > 0) {
          const uploadedFiles = await this.trySaveFiles(filesToSave);
          if (uploadedFiles) {
            uploadedFiles.forEach((file: AIFile) => {
              if (file && file.url && videos && file.index !== undefined) {
                const video = videos[file.index];
                if (video) {
                  video.videoUrl = file.url;
                }
              }
            });
          }
        }
      }
    }

    return { images, videos };
  }

  private mapStatus(status: string): AITaskStatus {
    switch (status) {
      case 'IN_QUEUE':
        return AITaskStatus.PENDING;
      case 'IN_PROGRESS':
        return AITaskStatus.PROCESSING;
      case 'COMPLETED':
        return AITaskStatus.SUCCESS;
      case 'FAILED':
        return AITaskStatus.FAILED;
      default:
        throw new Error(`unknown status: ${status}`);
    }
  }

  private getErrorMessage(data: any): string {
    return formatFalErrorDetail(
      data?.error ?? data?.detail ?? data?.message ?? data
    );
  }

  private resolveQueueUrl(candidate: unknown, fallback: string): string {
    if (typeof candidate !== 'string' || !candidate) return fallback;

    try {
      const url = new URL(candidate);
      if (url.protocol === 'https:' && url.origin === this.baseUrl) {
        return url.toString();
      }
    } catch {
      // Invalid or non-Fal URLs fall back to the known queue endpoint.
    }

    return fallback;
  }

  private formatInput({
    mediaType,
    model,
    prompt,
    options,
  }: {
    mediaType: AIMediaType;
    model: string;
    prompt: string;
    options: any;
  }): any {
    // Utility models such as BiRefNet do not accept a prompt field. The local
    // task still records a human-readable prompt for history and auditing.
    const promptlessUtilityModels = new Set([
      'fal-ai/birefnet/v2',
      'fal-ai/imageutils/rembg',
      'fal-ai/bria/background/remove',
      'fal-ai/clarity-upscaler',
      'fal-ai/recraft/vectorize',
    ]);
    let input: any = promptlessUtilityModels.has(model) ? {} : { prompt };

    if (!options) {
      return input;
    }

    input = { ...input, ...options };
    if (model === 'fal-ai/flux-2-pro/edit') delete input.strength;
    if (model.startsWith('fal-ai/flux-2-pro')) delete input.num_images;

    if (options.image_input && Array.isArray(options.image_input)) {
      if (['fal-ai/kling-video/o1/video-to-video/edit'].includes(model)) {
        input.input_images = options.image_input;
      } else {
        input.image_url = options.image_input[0];
      }
      delete input.image_input;
    }

    if (options.video_input && Array.isArray(options.video_input)) {
      input.video_url = options.video_input[0];
      delete input.video_input;
    }

    return input;
  }
}
