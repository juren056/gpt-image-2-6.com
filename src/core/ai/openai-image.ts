import { downloadRemoteImage } from './remote-image';
import {
  AIMediaType,
  AITaskStatus,
  type AIConfigs,
  type AIGenerateParams,
  type AIImage,
  type AIProvider,
  type AITaskResult,
  type UploadFileFunction,
  type UuidFunction,
} from './types';

type OpenAIImageOptions = {
  image_input?: string[];
  mask_url?: string;
  size?: string;
  quality?: string;
  output_format?: 'png' | 'jpeg' | 'webp';
  background?: 'transparent' | 'opaque' | 'auto';
};

export interface OpenAIImageConfigs extends AIConfigs {
  apiKey: string;
  baseUrl?: string;
  uploadFile: UploadFileFunction;
  uuid?: UuidFunction;
}

export class OpenAIImageProvider implements AIProvider {
  readonly name = 'openai';
  configs: OpenAIImageConfigs;

  constructor(configs: OpenAIImageConfigs) {
    this.configs = configs;
  }

  private uuid() {
    return (this.configs.uuid || (() => crypto.randomUUID()))();
  }

  async generate({
    params,
  }: {
    params: AIGenerateParams;
  }): Promise<AITaskResult> {
    if (params.mediaType !== AIMediaType.IMAGE)
      throw new Error('OpenAI image provider only supports images');
    if (!params.model || !params.prompt.trim())
      throw new Error('Model and prompt are required');
    const options = (params.options || {}) as OpenAIImageOptions;
    const images = options.image_input || [];
    const baseUrl = (
      this.configs.baseUrl || 'https://api.openai.com/v1'
    ).replace(/\/$/, '');
    let body: BodyInit;
    let contentType: string | undefined;

    if (images.length) {
      const form = new FormData();
      form.set('model', params.model);
      form.set('prompt', params.prompt);
      if (options.size) form.set('size', options.size);
      if (options.quality) form.set('quality', options.quality);
      if (options.output_format)
        form.set('output_format', options.output_format);
      if (options.background) form.set('background', options.background);
      for (const [index, url] of images.entries()) {
        const image = await downloadRemoteImage(url);
        form.append(
          'image[]',
          new Blob([image.bytes], { type: image.contentType }),
          `${index}-${image.filename}`
        );
      }
      if (options.mask_url) {
        const mask = await downloadRemoteImage(options.mask_url);
        form.set(
          'mask',
          new Blob([mask.bytes], { type: mask.contentType }),
          mask.filename
        );
      }
      body = form;
    } else {
      contentType = 'application/json';
      body = JSON.stringify({
        model: params.model,
        prompt: params.prompt,
        n: 1,
        size: options.size || 'auto',
        quality: options.quality || 'auto',
        output_format: options.output_format || 'png',
        background: options.background || 'auto',
      });
    }

    const response = await fetch(
      `${baseUrl}/images/${images.length ? 'edits' : 'generations'}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.configs.apiKey}`,
          ...(contentType ? { 'Content-Type': contentType } : {}),
        },
        body,
        signal: AbortSignal.timeout(180_000),
      }
    );
    const payload = (await response.json()) as {
      data?: Array<{ b64_json?: string; url?: string }>;
      error?: { message?: string };
      usage?: unknown;
    };
    if (!response.ok)
      throw new Error(
        payload.error?.message ||
          `OpenAI image request failed (${response.status})`
      );
    const output = payload.data?.[0];
    if (!output) throw new Error('OpenAI returned no image');
    let imageUrl = output.url;
    if (output.b64_json) {
      const format = options.output_format || 'png';
      imageUrl = (
        await this.configs.uploadFile({
          body: Buffer.from(output.b64_json, 'base64'),
          key: `openai/image/${this.uuid()}.${format}`,
          contentType: `image/${format}`,
        })
      ).url;
    }
    if (!imageUrl) throw new Error('OpenAI returned an unusable image');
    const image: AIImage = {
      id: this.uuid(),
      createTime: new Date(),
      imageType: options.output_format || 'png',
      imageUrl,
    };
    return {
      taskStatus: AITaskStatus.SUCCESS,
      taskId: this.uuid(),
      taskInfo: { images: [image], status: 'success', createTime: new Date() },
      taskResult: { usage: payload.usage },
    };
  }
}
