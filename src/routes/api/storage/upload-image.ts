import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { envConfigs } from '@/config';
import { getStorage } from '@/modules/storage/service';
import { md5 } from '@/lib/hash';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respData, respErr } from '@/lib/resp';

const extFromMime = (mimeType: string) => {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
    'image/avif': 'avif',
    'image/heic': 'heic',
    'image/heif': 'heif',
  };
  return map[mimeType] || '';
};

// Cap for the no-storage local-disk fallback (dev). Configurable via INLINE_IMAGE_MAX_KB.
const INLINE_MAX_BYTES =
  (Number(envConfigs.inline_image_max_kb) || 10240) * 1024;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

function hasExpectedImageSignature(bytes: Uint8Array, mimeType: string) {
  if (mimeType === 'image/jpeg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === 'image/png') {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    );
  }
  if (mimeType === 'image/webp') {
    return (
      String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
      String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
    );
  }
  return false;
}

async function POST({ request }: { request: Request }) {
  const limited = await enforceMinIntervalRateLimit(request, {
    intervalMs: 1000,
    keyPrefix: 'upload-image',
  });
  if (limited) return limited;

  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Unauthorized');

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    if (!files.length) return respErr('No files provided');

    const storage = await getStorage();
    const uploadResults: Array<{
      url: string;
      key: string;
      filename: string;
      deduped: boolean;
    }> = [];

    for (const file of files) {
      if (!ALLOWED_IMAGE_MIME.has(file.type)) {
        return respErr(`File ${file.name} must be JPG, PNG or WebP`);
      }
      if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
        return respErr(`File ${file.name} exceeds the 10MB upload limit`);
      }

      const arrayBuffer = await file.arrayBuffer();
      const body = new Uint8Array(arrayBuffer);
      if (!hasExpectedImageSignature(body, file.type)) {
        return respErr(
          `File ${file.name} does not match its declared image type`
        );
      }

      const digest = md5(body);
      const ext =
        (extFromMime(file.type) || file.name.split('.').pop() || 'bin').replace(
          /[^a-zA-Z0-9]/g,
          ''
        ) || 'bin';
      // R2Provider prepends its own uploadPath (default `uploads`), so the object
      // key is the bare filename. The local fallback uses `public/uploads/<file>`.
      const objectKey = `${digest}.${ext}`;

      // No storage configured → persist to public/uploads and return a short
      // local URL. Avoids inlining a giant base64 data URL into DB columns (some
      // are varchar(255)). Configure R2 (admin → Storage) for production.
      if (!storage) {
        if (body.length > INLINE_MAX_BYTES) {
          const limitKb = Math.round(INLINE_MAX_BYTES / 1024);
          return respErr(
            `Image too large (${(body.length / 1024).toFixed(0)}KB > ${limitKb}KB). Configure storage or use a smaller image.`
          );
        }
        const dir = path.join(process.cwd(), 'public', 'uploads');
        await mkdir(dir, { recursive: true });
        await writeFile(path.join(dir, objectKey), body);
        uploadResults.push({
          url: `/uploads/${objectKey}`,
          key: `uploads/${objectKey}`,
          filename: file.name,
          deduped: false,
        });
        continue;
      }

      const exists = await storage.exists({ key: objectKey });
      if (exists) {
        const publicUrl = storage.getPublicUrl({ key: objectKey });
        if (publicUrl) {
          uploadResults.push({
            url: publicUrl,
            key: objectKey,
            filename: file.name,
            deduped: true,
          });
          continue;
        }
      }

      const result = await storage.uploadFile({
        body,
        key: objectKey,
        contentType: file.type,
        disposition: 'inline',
      });

      if (!result.success || !result.url) {
        return respErr(result.error || 'Upload failed');
      }

      uploadResults.push({
        url: result.url,
        key: result.key || objectKey,
        filename: file.name,
        deduped: false,
      });
    }

    return respData({
      urls: uploadResults.map((r) => r.url),
      results: uploadResults,
    });
  } catch (e: any) {
    console.error('upload image failed:', e);
    return respErr(e?.message || 'upload image failed');
  }
}

export const Route = createFileRoute('/api/storage/upload-image')({
  server: {
    handlers: { POST },
  },
});
