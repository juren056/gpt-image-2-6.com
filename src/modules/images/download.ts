import { isIP } from 'node:net';

const MAX_REDIRECTS = 3;

/** Refuse a raster image wrapped in SVG or active markup before download. */
export function validateEditableVectorSvg(markup: string): string {
  if (
    markup.length > 2_000_000 ||
    !/^\s*(?:<\?xml[^>]*>\s*)?<svg[\s>]/i.test(markup) ||
    /<\s*(?:script|foreignObject|iframe|object|embed|image)\b/i.test(markup) ||
    /\son[a-z]+\s*=/i.test(markup) ||
    /\b(?:href|xlink:href)\s*=\s*["'](?!#)/i.test(markup) ||
    !/<\s*(?:path|polygon|polyline|rect|circle|ellipse)\b/i.test(markup)
  ) {
    throw new Error('The provider did not return an editable vector SVG');
  }
  return markup;
}

export async function readBoundedVectorResponse(
  response: Response
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Empty vector response');
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const item = await reader.read();
    if (item.done) break;
    total += item.value.byteLength;
    if (total > 2_000_000) {
      await reader.cancel();
      throw new Error('SVG exceeds 2 MB');
    }
    chunks.push(item.value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

const IMAGE_EXTENSION_BY_TYPE: Record<string, string> = {
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/svg+xml': 'svg',
  'image/webp': 'webp',
};

export function assertSafeImageDownloadUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('Invalid image URL');
  }

  const hostname = url.hostname.toLowerCase();
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    isIP(hostname) !== 0
  ) {
    throw new Error('Unsafe image URL');
  }

  return url;
}

export function getImageDownloadFilename(
  taskId: string,
  contentType: string
): string {
  const normalizedType = contentType.split(';', 1)[0]?.trim().toLowerCase();
  const extension = IMAGE_EXTENSION_BY_TYPE[normalizedType] || 'png';
  const safeTaskId =
    taskId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 36) || 'generated';
  return `qwen-image-${safeTaskId}.${extension}`;
}

export async function fetchImageForDownload(rawUrl: string): Promise<Response> {
  let currentUrl = assertSafeImageDownloadUrl(rawUrl);

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
    const response = await fetch(currentUrl, {
      headers: { Accept: 'image/*' },
      redirect: 'manual',
      signal: AbortSignal.timeout(30_000),
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location || redirectCount === MAX_REDIRECTS) {
        throw new Error('Too many image redirects');
      }
      currentUrl = assertSafeImageDownloadUrl(
        new URL(location, currentUrl).toString()
      );
      continue;
    }

    if (!response.ok) {
      throw new Error(`Image source returned HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().startsWith('image/')) {
      throw new Error('Image source returned an invalid file type');
    }
    if (!response.body) {
      throw new Error('Image source returned an empty file');
    }

    return response;
  }

  throw new Error('Unable to download image');
}
