import { downloadRemoteImage } from './remote-image';
import {
  AIConfigs,
  AIGenerateParams,
  AIImage,
  AIMediaType,
  AIProvider,
  AITaskResult,
  AITaskStatus,
  UploadFileFunction,
  UuidFunction,
} from './types';

type GeminiImageOptions = {
  image_input?: string[];
  image_size?: '512' | '1024' | '2048' | '4096';
  aspect_ratio?: string;
  conversation_parts?: Array<Record<string, unknown>>;
};

const defaultUuid: UuidFunction = () => crypto.randomUUID();

/**
 * Gemini configs
 */
export interface GeminiConfigs extends AIConfigs {
  apiKey: string;
  uploadFile?: UploadFileFunction;
  uuid?: UuidFunction;
}

/**
 * Gemini provider
 */
export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';
  configs: GeminiConfigs;

  constructor(configs: GeminiConfigs) {
    this.configs = configs;
  }

  private getUuid(): string {
    return (this.configs.uuid || defaultUuid)();
  }

  async generate({
    params,
  }: {
    params: AIGenerateParams;
  }): Promise<AITaskResult> {
    const { mediaType, model, prompt, options } = params;

    if (mediaType !== AIMediaType.IMAGE) {
      throw new Error(`mediaType not supported: ${mediaType}`);
    }

    if (!model) {
      throw new Error('model is required');
    }

    if (!prompt) {
      throw new Error('prompt is required');
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.configs.apiKey}`;

    const imageOptions = (options || {}) as GeminiImageOptions;
    const requestParts: Array<Record<string, unknown>> = [{ text: prompt }];

    if (imageOptions.image_input) {
      for (const imageUrl of imageOptions.image_input) {
        const image = await downloadRemoteImage(imageUrl);
        requestParts.push({
          inlineData: {
            mimeType: image.contentType,
            data: Buffer.from(image.bytes).toString('base64'),
          },
        });
      }
    }

    const priorParts = Array.isArray(imageOptions.conversation_parts)
      ? imageOptions.conversation_parts
      : [];

    const payload = {
      contents: [
        ...(priorParts.length ? [{ role: 'model', parts: priorParts }] : []),
        { role: 'user', parts: requestParts },
      ],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          ...(imageOptions.aspect_ratio
            ? { aspectRatio: imageOptions.aspect_ratio }
            : {}),
          ...(imageOptions.image_size
            ? { imageSize: `${Number(imageOptions.image_size) / 1024}K` }
            : {}),
        },
      },
    };

    const resp = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      throw new Error(
        `request failed with status: ${resp.status}, body: ${errorText}`
      );
    }

    const data = (await resp.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            inlineData?: { mimeType: string; data: string };
            thoughtSignature?: string;
            text?: string;
          }>;
        };
      }>;
      usageMetadata?: unknown;
    };

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('no candidates returned');
    }

    const taskId = this.getUuid();
    const candidate = data.candidates[0];
    const parts = candidate.content?.parts;

    if (!parts || parts.length === 0) {
      throw new Error('no parts returned');
    }

    const imagePart = parts.find((part) => part.inlineData);

    if (!imagePart) {
      throw new Error('no image part returned');
    }

    const mimeType = imagePart.inlineData!.mimeType;
    const base64Data = imagePart.inlineData!.data;

    if (!this.configs.uploadFile) {
      throw new Error('uploadFile function is required for Gemini provider');
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const ext = mimeType.split('/')[1] || 'png';
    const key = `gemini/image/${this.getUuid()}.${ext}`;

    const uploadResult = await this.configs.uploadFile({
      body: buffer,
      key,
      contentType: mimeType,
    });

    if (!uploadResult || !uploadResult.url) {
      throw new Error('upload image failed');
    }

    const image: AIImage = {
      id: this.getUuid(),
      createTime: new Date(),
      imageType: mimeType,
      imageUrl: uploadResult.url,
    };

    return {
      taskStatus: AITaskStatus.SUCCESS,
      taskId: taskId,
      taskInfo: {
        images: [image],
        status: 'success',
        createTime: new Date(),
      },
      // Preserve Google's opaque thought signatures for a future continuation.
      // Never blank or synthesize them. Base64 output is omitted from storage.
      taskResult: {
        usageMetadata: data.usageMetadata,
        conversationParts: parts.map((part) => ({
          ...(part.text ? { text: part.text } : {}),
          ...(part.thoughtSignature
            ? { thoughtSignature: part.thoughtSignature }
            : {}),
          ...(part === imagePart
            ? { inlineData: { mimeType, data: uploadResult.url } }
            : {}),
        })),
      },
    };
  }
}
