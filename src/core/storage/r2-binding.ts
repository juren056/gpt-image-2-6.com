import type {
  StorageProvider,
  StorageUploadOptions,
  StorageUploadResult,
} from '.';

export interface ImageBucketObject {
  body: ReadableStream;
  httpEtag: string;
  httpMetadata?: { contentType?: string };
}

export interface ImageBucket {
  put(
    key: string,
    body: Uint8Array,
    options: { httpMetadata: { contentType: string } }
  ): Promise<unknown>;
  get(key: string): Promise<ImageBucketObject | null>;
}

export function getImageBucket(): ImageBucket | undefined {
  return (
    globalThis as typeof globalThis & {
      __CF_ENV__?: { IMAGE_BUCKET?: ImageBucket };
    }
  ).__CF_ENV__?.IMAGE_BUCKET;
}

export const MEDIA_KEY_PATTERN =
  /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\.(?:jpg|png|webp)$/;

/** Private bucket; unguessable image URLs allow the selected AI provider to read references. */
export class R2BindingProvider implements StorageProvider {
  readonly name = 'r2-binding';
  configs = {};
  constructor(
    private bucket: ImageBucket,
    private origin: string
  ) {}

  async uploadFile(
    options: StorageUploadOptions
  ): Promise<StorageUploadResult> {
    const extensions: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    const extension = extensions[options.contentType || ''];
    if (!extension)
      return {
        success: false,
        provider: this.name,
        error: 'Only JPG, PNG and WebP images can be stored',
      };
    // Never expose a predictable content hash or the user's original filename.
    const key = `${crypto.randomUUID()}.${extension}`;
    await this.bucket.put(`uploads/${key}`, options.body, {
      httpMetadata: { contentType: options.contentType! },
    });
    return {
      success: true,
      provider: this.name,
      key,
      url: `${this.origin.replace(/\/$/, '')}/api/storage/media/${key}`,
    };
  }

  async downloadAndUpload(): Promise<StorageUploadResult> {
    throw new Error('The upload binding only accepts validated image bytes');
  }
}
